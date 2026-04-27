import { useEffect, useRef, useState } from "react";
import {
  LogOut,
  User,
  Settings,
  Menu,
  ScanLine,
  X,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAppStore, Role } from "@/store/appStore";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ThemeToggle";
import { motion, AnimatePresence } from "framer-motion";
import jsQR from "jsqr";
import axios from "axios";
import ApiService from "@/api/apiServices";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const roleLabels: Record<Role, string> = {
  "super-admin": "Super Admin",
  admin: "Admin",
  user: "User",
};

const roleBadgeStyle: Record<Role, string> = {
  "super-admin": "bg-orange-500/15 text-orange-400 border-orange-500/25",
  admin: "bg-amber-500/15 text-amber-400 border-amber-500/25",
  user: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
};

interface ScanResult {
  orderId: string;
  items: { name: string; quantity: number }[];
  total: number;
  alreadyApproved?: boolean;
}

interface TopHeaderProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  onMobileMenuOpen: () => void;
}

export function TopHeader({
  collapsed,
  onToggleCollapse,
  onMobileMenuOpen,
}: TopHeaderProps) {
  const { currentRole, currentUser } = useAppStore();
  const navigate = useNavigate();

  const [showScanner, setShowScanner] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [scanError, setScanError] = useState("");
  const [scanning, setScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const activeRef = useRef(false);

  const empName =
    (currentUser as any)?.emp_name ?? roleLabels[currentRole] ?? "User";
  const displayEmail = (currentUser as any)?.emp_mail ?? "";
  const nameParts = empName.trim().split(/\s+/);
  const initials =
    nameParts.length >= 2
      ? (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase()
      : nameParts[0][0].toUpperCase();

  const stopCamera = () => {
    activeRef.current = false;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    rafRef.current = null;
    streamRef.current = null;
  };

  const openScanner = () => {
    setScanResult(null);
    setScanError("");
    setShowScanner(true);
  };

  const closeScanner = () => {
    stopCamera();
    setShowScanner(false);
    setScanResult(null);
    setScanError("");
    setScanning(false);
  };

  useEffect(() => {
    if (!showScanner || scanResult) return;
    let cancelled = false;
    const init = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        await video.play();
        activeRef.current = true;
        const tick = () => {
          if (!activeRef.current) return;
          const canvas = canvasRef.current;
          if (canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext("2d")!;
            ctx.drawImage(video, 0, 0);
            const imageData = ctx.getImageData(
              0,
              0,
              canvas.width,
              canvas.height
            );
            const code = jsQR(
              imageData.data,
              imageData.width,
              imageData.height
            );
            if (code?.data) {
              activeRef.current = false;
              stopCamera();
              setScanning(true);
              const raw = code.data.trim();
              let orderId = raw.split("/").pop() ?? raw;
              try {
                const url = new URL(raw);
                orderId = url.searchParams.get("order_id") ?? orderId;
              } catch {}
              ApiService.get(`/api/admin/scan/${orderId}`)
                .then((res) => {
                  const d = res.data;
                  if (d.status === "approved") {
                    setScanResult({
                      orderId: String(d.order_id ?? orderId),
                      items: [],
                      total: d.total_amount ?? 0,
                      alreadyApproved: true,
                    });
                  } else {
                    setScanResult({
                      orderId: String(d.order_id ?? orderId),
                      items:
                        d.items?.map((it: any) => ({
                          name: it.name ?? `Item #${it.menu_id}`,
                          quantity: it.quantity,
                        })) ?? [],
                      total: d.total_amount ?? 0,
                    });
                  }
                })
                .catch(() => setScanError("Failed to fetch order. Try again."))
                .finally(() => setScanning(false));
              return;
            }
          }
          rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);
      } catch {
        if (!cancelled) {
          setScanError("Camera access denied or not available.");
        }
      }
    };
    init();
    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [showScanner]);

  const handleDone = async () => {
    if (!scanResult?.orderId) return;
    try {
      const token = sessionStorage.getItem("access_token");
      const baseURL = import.meta.env.VITE_API_BASE_URL || "";
      await axios.put(
        `${baseURL}/api/admin/order/${scanResult.orderId}/status?status=approved`,
        null,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "ngrok-skip-browser-warning": "true",
          },
        }
      );
      window.dispatchEvent(
        new CustomEvent("qr-order-received", {
          detail: { orderId: scanResult.orderId },
        })
      );
      closeScanner();
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      console.error(
        "Status update error:",
        JSON.stringify(err?.response?.data)
      );
      const errorText = Array.isArray(detail)
        ? detail.map((e: any) => e.msg).join(", ")
        : typeof detail === "string"
        ? detail
        : "Failed to update order status";
      setScanError(errorText);
      setScanResult(null);
    }
  };

  return (
    <>
      <header className="h-14 sm:h-16 border-b border-border bg-card/50 backdrop-blur-xl flex items-center justify-between px-3 sm:px-5 sticky top-0 z-30 gap-2">
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mobile hamburger */}
          <button
            onClick={onMobileMenuOpen}
            className="lg:hidden p-2 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Scan QR button — admin only */}
          {currentRole === "admin" && (
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={openScanner}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl border border-orange-500/40 bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 transition-colors font-semibold text-sm"
            >
              <ScanLine className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">Scan QR</span>
            </motion.button>
          )}
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />

          <Badge
            variant="outline"
            className={`text-[10px] font-semibold hidden sm:inline-flex ${roleBadgeStyle[currentRole]}`}
          >
            {roleLabels[currentRole]}
          </Badge>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold text-white hover:opacity-90 hover:ring-2 hover:ring-orange-500/40 transition-all cursor-pointer"
                style={{
                  background:
                    "linear-gradient(135deg, hsl(24 95% 53%), hsl(43 96% 52%))",
                }}
              >
                {initials}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <div className="px-2 py-1.5">
                <p className="text-sm font-semibold">{empName}</p>
                <p className="text-xs text-muted-foreground">{displayEmail}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer">
                <User className="w-4 h-4 mr-2" /> Profile
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                <Settings className="w-4 h-4 mr-2" /> Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => navigate("/login")}
                className="cursor-pointer text-destructive hover:!text-white focus:text-white"
              >
                <LogOut className="w-4 h-4 mr-2" /> Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* QR Scanner Modal */}
      <AnimatePresence>
        {showScanner && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={closeScanner}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-sm rounded-2xl overflow-hidden border border-orange-500/20"
              style={{
                background: "rgba(10,10,20,0.95)",
                backdropFilter: "blur(20px)",
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-orange-500/15 flex items-center justify-center">
                    <ScanLine className="w-4 h-4 text-orange-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">
                      Scan Order QR
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      Use camera to scan the QR code
                    </p>
                  </div>
                </div>
                <button
                  onClick={closeScanner}
                  className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                >
                  <X className="w-3.5 h-3.5 text-white" />
                </button>
              </div>

              <div className="p-5">
                {/* Live camera feed */}
                {!scanResult && !scanError && !scanning && (
                  <div className="flex flex-col items-center gap-3">
                    <div className="relative w-full rounded-xl overflow-hidden">
                      <video
                        ref={videoRef}
                        className="w-full rounded-xl"
                        playsInline
                        muted
                      />
                      <canvas ref={canvasRef} className="hidden" />
                      {/* Corner brackets overlay */}
                      <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute top-3 left-3 w-8 h-8 border-t-2 border-l-2 border-orange-400 rounded-tl-lg" />
                        <div className="absolute top-3 right-3 w-8 h-8 border-t-2 border-r-2 border-orange-400 rounded-tr-lg" />
                        <div className="absolute bottom-3 left-3 w-8 h-8 border-b-2 border-l-2 border-orange-400 rounded-bl-lg" />
                        <div className="absolute bottom-3 right-3 w-8 h-8 border-b-2 border-r-2 border-orange-400 rounded-br-lg" />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground text-center">
                      Point camera at the order QR code
                    </p>
                  </div>
                )}

                {/* Scanning / processing */}
                {scanning && (
                  <div className="flex flex-col items-center gap-3 py-8">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{
                        repeat: Infinity,
                        duration: 0.9,
                        ease: "linear",
                      }}
                      className="w-10 h-10 border-2 border-orange-400/30 border-t-orange-400 rounded-full"
                    />
                    <p className="text-sm text-muted-foreground">
                      Reading QR code...
                    </p>
                  </div>
                )}

                {/* Error */}
                {scanError && (
                  <div className="flex flex-col items-center gap-3 py-6">
                    <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center">
                      <AlertCircle className="w-7 h-7 text-red-400" />
                    </div>
                    <p className="text-sm font-semibold text-red-400 text-center">
                      {scanError}
                    </p>
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={() => {
                        setScanError("");
                        openScanner();
                      }}
                      className="px-5 py-2 rounded-xl text-sm font-bold text-white"
                      style={{
                        background:
                          "linear-gradient(135deg, hsl(24 95% 53%), hsl(43 96% 52%))",
                      }}
                    >
                      Try Again
                    </motion.button>
                  </div>
                )}

                {/* Success result */}
                {scanResult && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    {scanResult.alreadyApproved ? (
                      /* Already collected */
                      <div className="flex flex-col items-center gap-4 py-4">
                        <div className="w-16 h-16 rounded-full bg-amber-500/10 border-2 border-amber-500/40 flex items-center justify-center">
                          <AlertCircle className="w-8 h-8 text-amber-400" />
                        </div>
                        <div className="text-center space-y-1">
                          <p className="text-sm font-bold text-white">
                            Order Already Collected
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Order{" "}
                            <span className="text-orange-400 font-semibold">
                              #{scanResult.orderId}
                            </span>{" "}
                            has already been approved and collected.
                          </p>
                          <p className="text-xs text-amber-400/80 font-medium mt-2">
                            This meal has already been served to the employee.
                          </p>
                        </div>
                        <button
                          onClick={closeScanner}
                          className="w-full py-2.5 rounded-xl text-sm font-bold text-white"
                          style={{
                            background:
                              "linear-gradient(135deg, hsl(24 95% 53%), hsl(43 96% 52%))",
                          }}
                        >
                          Close
                        </button>
                      </div>
                    ) : (
                      /* Normal approve flow */
                      <>
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                            <CheckCircle className="w-7 h-7 text-emerald-400" />
                          </div>
                          <p className="text-sm font-bold text-white">
                            QR Verified
                          </p>
                        </div>

                        <div
                          className="rounded-xl border border-white/10 overflow-hidden"
                          style={{ background: "rgba(255,255,255,0.03)" }}
                        >
                          <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
                            <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">
                              Order ID
                            </span>
                            <span className="text-sm font-bold text-orange-400">
                              #{scanResult.orderId}
                            </span>
                          </div>
                          <div className="px-4 py-3 space-y-2">
                            {scanResult.items.map((it, i) => (
                              <div
                                key={i}
                                className="flex items-center justify-between"
                              >
                                <span className="text-sm text-white">
                                  {it.name}
                                </span>
                                <span
                                  className="text-xs font-bold px-2 py-0.5 rounded-lg"
                                  style={{
                                    background: "rgba(249,115,22,0.15)",
                                    color: "#fb923c",
                                  }}
                                >
                                  ×{it.quantity}
                                </span>
                              </div>
                            ))}
                          </div>
                          <div className="px-4 py-3 border-t border-white/10 flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">
                              Total
                            </span>
                            <span
                              className="text-base font-bold"
                              style={{
                                background:
                                  "linear-gradient(135deg,#f97316,#fbbf24)",
                                WebkitBackgroundClip: "text",
                                WebkitTextFillColor: "transparent",
                              }}
                            >
                              ₹{scanResult.total}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={handleDone}
                          className="w-full py-2.5 rounded-xl text-sm font-bold text-white"
                          style={{
                            background:
                              "linear-gradient(135deg,hsl(24 95% 53%),hsl(43 96% 52%))",
                          }}
                        >
                          Done ✓
                        </button>
                      </>
                    )}
                  </motion.div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

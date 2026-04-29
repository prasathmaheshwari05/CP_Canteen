import { useState, useRef, MouseEvent, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store/appStore";
import ApiService from "@/api/apiServices";

interface FieldProps {
  label: string;
  type: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  suffix?: React.ReactNode;
  autoComplete?: string;
}

function Field({
  label,
  type,
  placeholder,
  value,
  onChange,
  error,
  suffix,
  autoComplete,
}: FieldProps) {
  const [focused, setFocused] = useState(false);

  return (
    <div className="space-y-1">
      <label className="text-xs font-bold text-white uppercase tracking-wider">
        {label}
      </label>
      <div
        className={`relative rounded-lg border transition-all duration-200 ${
          error
            ? "border-red-400 bg-red-500/10"
            : focused
            ? "border-orange-400 bg-white/25"
            : "border-white/30 bg-white/20"
        }`}
      >
        <input
          type={type}
          value={value}
          autoComplete={autoComplete}
          placeholder={focused ? "" : error ? error : placeholder}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full bg-transparent text-white text-sm outline-none px-3 py-2.5 ${
            suffix ? "pr-10" : ""
          } ${
            error && !focused
              ? "placeholder:text-red-400 placeholder:font-medium"
              : "placeholder:text-white/40"
          }`}
        />
        {suffix && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {suffix}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Login() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const navigate = useNavigate();
  const { setRole, setCurrentUser } = useAppStore();

  const handleMouseMove = useCallback((e: MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientY - rect.top - rect.height / 2) / 25;
    const y = -(e.clientX - rect.left - rect.width / 2) / 25;
    setRotation({
      x: Math.max(-8, Math.min(8, x)),
      y: Math.max(-8, Math.min(8, y)),
    });
  }, []);

  const handleMouseLeave = useCallback(() => setRotation({ x: 0, y: 0 }), []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const errs: Record<string, string> = {};
    if (!identifier.trim())
      errs.identifier = "Employee ID or Email is required";
    if (!password.trim()) errs.password = "Password is required";

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setErrors({});
    setIsLoading(true);

    const isEmail = identifier.trim().includes("@");

    try {
      let empId: number;

      if (isEmail) {
        // Fetch users to find emp_id by email
        const usersRes = await ApiService.get("/auth/users");
        const users: any[] = usersRes.data ?? [];
        const matched = users.find(
          (u: any) =>
            u.emp_mail?.toLowerCase() === identifier.trim().toLowerCase()
        );
        if (!matched) {
          setErrors({ password: "No account found with this email" });
          setIsLoading(false);
          return;
        }
        empId = matched.emp_id;
      } else {
        empId = Number(identifier.trim());
      }

      const res = await ApiService.post("/auth/login", {
        emp_id: empId,
        password,
      });
      const { access_token, role, emp_name, emp_mail, emp_id: loginEmpId, id: userId } = res.data;
      sessionStorage.setItem("access_token", access_token);
      setRole(role);
      setCurrentUser({ emp_name, emp_mail, emp_id: loginEmpId, id: userId } as any);
      navigate("/");
    } catch {
      setErrors({ password: "Invalid credentials" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden p-4">
      <div className="absolute inset-0 cafe-bg-slider" />
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />

      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md z-10"
        style={{ perspective: "1200px" }}
      >
        <div
          ref={cardRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="relative rounded-2xl border border-white/20 bg-white/10 backdrop-blur-xl shadow-2xl overflow-hidden transition-transform duration-200"
          style={{
            transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
            transformStyle: "preserve-3d",
            boxShadow:
              "0 25px 60px -15px rgba(0,0,0,0.3), 0 0 40px -10px rgba(255,255,255,0.1)",
          }}
        >
          <div
            className="absolute inset-0 rounded-2xl opacity-30 pointer-events-none"
            style={{
              background:
                "linear-gradient(135deg, rgba(255,255,255,0.1), transparent 50%, rgba(255,255,255,0.05))",
            }}
          />

          <div className="relative p-8 space-y-6">
            <div className="text-center space-y-2">
              {/* CP Logo */}
              <div className="flex justify-center">
                <img
                  src="/CP_Logo.png"
                  alt="CP Dining"
                  style={{ maxWidth: "60%", height: "auto" }}
                  className="object-contain drop-shadow-lg"
                />
              </div>
              {/* CP Dining title with neon effect - commented out, logo has name+slogan */}
              {/* <div className="relative">
                <motion.h1 ...>CP Dining</motion.h1>
              </div>
              <p>Quick Meals. Zero Hassle.</p> */}
            </div>

            <form onSubmit={handleLogin} className="space-y-4" noValidate>
              <Field
                label="Employee ID or Email"
                type="text"
                placeholder="Enter Employee ID or Email"
                value={identifier}
                autoComplete="username"
                onChange={(v) => {
                  setIdentifier(v);
                  setErrors((e) => ({ ...e, identifier: "" }));
                }}
                error={errors.identifier}
              />
              <Field
                label="Password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                autoComplete="current-password"
                onChange={(v) => {
                  setPassword(v);
                  setErrors((e) => ({ ...e, password: "" }));
                }}
                error={errors.password}
                suffix={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-white/70 hover:text-white transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                }
              />

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 bg-gradient-to-r from-orange-500 to-amber-600 text-white font-semibold group relative overflow-hidden hover:shadow-[0_0_30px_rgba(249,115,22,0.4)] transition-shadow"
              >
                {isLoading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                  />
                ) : (
                  <span className="flex items-center gap-2">
                    Sign In{" "}
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                )}
              </Button>
            </form>

            <div className="text-center">
              <p className="text-sm text-white/90">
                Don't have an account?{" "}
                <Link
                  to="/signup"
                  className="text-orange-400 hover:text-orange-300 font-medium transition-colors"
                >
                  Sign Up
                </Link>
              </p>
            </div>
          </div>
        </div>

      </motion.div>

      <p className="absolute bottom-4 w-full text-center text-xs text-white/75 tracking-wide select-none z-10" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>
        © 2026 Changepond. All rights reserved.
      </p>
    </div>
  );
}

import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
  useSpring,
} from "framer-motion";
import {
  LayoutDashboard,
  Package,
  Users,
  ChefHat,
  ClipboardList,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  X,
  BookOpen,
  ShoppingBag,
} from "lucide-react";
import { useAppStore, Role } from "@/store/appStore";
import { broadcastLogout } from "@/hooks/useAuthSync";

const roleMenus: Record<
  Role,
  { label: string; icon: React.ElementType; path: string }[]
> = {
  "super-admin": [
    { label: "Dashboard", icon: LayoutDashboard, path: "/" },
    { label: "Products", icon: Package, path: "/products" },
    { label: "Today's Menu", icon: ChefHat, path: "/menu" },
    { label: "Users", icon: Users, path: "/users" },
  ],
  admin: [
    { label: "Dashboard", icon: LayoutDashboard, path: "/" },
    { label: "Products", icon: Package, path: "/products" },
    { label: "Today's Menu", icon: ChefHat, path: "/menu" },
    { label: "Orders", icon: ClipboardList, path: "/orders" },
  ],
  user: [
    { label: "Dashboard", icon: LayoutDashboard, path: "/" },
    { label: "My Booking", icon: BookOpen, path: "/my-booking" },
    { label: "My Cart", icon: ShoppingBag, path: "/my-cart" },
  ],
};

function ParallaxMenuItem({
  item,
  isActive,
  collapsed,
  index,
  onNavigate,
}: {
  item: { label: string; icon: React.ElementType; path: string };
  isActive: boolean;
  collapsed: boolean;
  index: number;
  onNavigate?: () => void;
}) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 300, damping: 20 });
  const springY = useSpring(y, { stiffness: 300, damping: 20 });
  const rotateX = useTransform(springY, [-20, 20], [4, -4]);
  const rotateY = useTransform(springX, [-20, 20], [-4, 4]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    x.set(e.clientX - rect.left - rect.width / 2);
    y.set(e.clientY - rect.top - rect.height / 2);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.07, duration: 0.3 }}
      style={{ perspective: 600 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <motion.div style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}>
        <Link
          to={item.path}
          onClick={onNavigate}
          className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 border ${
            collapsed ? "justify-center" : ""
          } ${
            isActive
              ? "text-orange-700 dark:text-orange-300 bg-orange-500/15 border-orange-400/40 shadow-[0_8px_20px_rgba(249,115,22,0.22)]"
              : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-white/35 dark:bg-slate-800/30 border-transparent hover:border-slate-300/50 dark:hover:border-slate-600/50 hover:bg-white/60 dark:hover:bg-slate-800/55"
          }`}
        >
          {isActive && (
            <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full bg-orange-500" />
          )}
          <motion.div style={{ translateZ: 8 }} className="shrink-0">
            <item.icon className="w-[18px] h-[18px]" />
          </motion.div>
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{ translateZ: 12 }}
                className="text-sm font-medium"
              >
                {item.label}
              </motion.span>
            )}
          </AnimatePresence>
        </Link>
      </motion.div>
    </motion.div>
  );
}

interface AppSidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  onMobileClose?: () => void;
}

export function AppSidebar({
  collapsed,
  onToggleCollapse,
  onMobileClose,
}: AppSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentRole, clearAuth } = useAppStore();

  const handleLogout = () => {
    sessionStorage.removeItem('access_token');
    clearAuth();
    broadcastLogout();
    navigate('/login', { replace: true });
  };
  const items = roleMenus[currentRole] ?? [];

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 256 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="h-full flex flex-col z-40 overflow-hidden relative"
      style={{
        background: "hsl(var(--sidebar-background))",
        borderRight: "1px solid hsl(var(--sidebar-border))",
      }}
    >
      <div
        className="absolute inset-0 pointer-events-none opacity-70"
        style={{
          background:
            "radial-gradient(circle at 0% 0%,rgba(56,189,248,0.18),transparent 40%),radial-gradient(circle at 100% 100%,rgba(249,115,22,0.15),transparent 45%)",
        }}
      />
      <div
        className={`h-16 flex items-center border-b border-sidebar-border/80 shrink-0 px-4 relative z-10 ${
          collapsed ? "justify-center" : "justify-between"
        }`}
      >
        {!collapsed && (
          <div className="flex items-center gap-3 min-w-0">
            <img
              src="/CP_Logo1.png"
              alt="CP Dining"
              className="h-9 w-auto object-contain shrink-0"
            />
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="overflow-hidden"
            >
              <h1 className="text-sm font-bold gradient-text leading-none">
                CP Dining
              </h1>
              <p className="text-[10px] text-sidebar-foreground/50 mt-0.5">
                Quick Meals. Zero Hassle.
              </p>
            </motion.div>
          </div>
        )}
        <button
          onClick={() => {
            onToggleCollapse();
            onMobileClose?.();
          }}
          className="p-2 rounded-xl bg-white/55 dark:bg-slate-900/65 border border-slate-300/50 dark:border-slate-700/70 hover:bg-white dark:hover:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-orange-600 dark:hover:text-orange-300 transition-all duration-200 shrink-0 lg:flex hidden shadow-sm hover:shadow-md"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <PanelLeftOpen className="w-4 h-4" />
          ) : (
            <PanelLeftClose className="w-4 h-4" />
          )}
        </button>
        {/* Mobile close button */}
        <button
          onClick={onMobileClose}
          className="p-2 rounded-xl bg-white/55 dark:bg-slate-900/65 border border-slate-300/50 dark:border-slate-700/70 hover:bg-white dark:hover:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-orange-600 dark:hover:text-orange-300 transition-all duration-200 shrink-0 lg:hidden shadow-sm hover:shadow-md"
          aria-label="Close sidebar"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <nav className="flex-1 py-5 px-3 space-y-1.5 overflow-y-auto scrollbar-thin relative z-10">
        {!collapsed && (
          <p className="text-[9px] uppercase tracking-widest text-slate-500 dark:text-slate-400 font-semibold px-3 pb-2">
            Navigation
          </p>
        )}
        {items.map((item, index) => (
          <ParallaxMenuItem
            key={item.path}
            item={item}
            isActive={location.pathname === item.path}
            collapsed={collapsed}
            index={index}
            onNavigate={() => {
              onMobileClose?.();
              if (!collapsed) onToggleCollapse();
            }}
          />
        ))}
      </nav>

      <div className="px-3 mb-4 shrink-0 relative z-10">
        <button
          onClick={handleLogout}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-500 dark:text-red-400 bg-red-500/5 border border-red-500/15 hover:bg-red-500/15 hover:border-red-500/30 hover:text-red-600 dark:hover:text-red-300 transition-all duration-200 ${
            collapsed ? "justify-center" : ""
          }`}
        >
          <LogOut className="w-[18px] h-[18px] shrink-0" />
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-sm font-medium"
              >
                Logout
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </motion.aside>
  );
}

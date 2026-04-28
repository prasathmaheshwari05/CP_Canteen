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
  ChevronLeft,
  ChevronRight,
  BookOpen,
} from "lucide-react";
import { useAppStore, Role } from "@/store/appStore";

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
  ],
};

function ParallaxMenuItem({
  item,
  isActive,
  collapsed,
  index,
}: {
  item: { label: string; icon: React.ElementType; path: string };
  isActive: boolean;
  collapsed: boolean;
  index: number;
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
          className={`sidebar-link ${isActive ? "active" : ""}`}
        >
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

export function AppSidebar({ collapsed, onToggleCollapse, onMobileClose }: AppSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentRole, setCurrentUser } = useAppStore();

  const handleLogout = () => {
    sessionStorage.removeItem('access_token');
    setCurrentUser(null);
    navigate('/login');
  };
  const items = roleMenus[currentRole] ?? [];

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 256 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="h-full flex flex-col z-40 overflow-hidden"
      style={{
        background: "hsl(var(--sidebar-background))",
        borderRight: "1px solid hsl(var(--sidebar-border))",
      }}
    >
      <div
        className={`h-16 flex items-center border-b border-sidebar-border shrink-0 px-4 ${
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
          onClick={() => { onToggleCollapse(); onMobileClose?.(); }}
          className="p-1.5 rounded-lg hover:bg-sidebar-accent text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors shrink-0 lg:flex hidden"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
        {/* Mobile close button */}
        <button
          onClick={onMobileClose}
          className="p-1.5 rounded-lg hover:bg-sidebar-accent text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors shrink-0 lg:hidden"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      <nav className="flex-1 py-5 px-3 space-y-1 overflow-y-auto scrollbar-thin">
        {!collapsed && (
          <p className="text-[9px] uppercase tracking-widest text-sidebar-foreground/30 font-semibold px-3 pb-2">
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
          />
        ))}
      </nav>

      <div className="px-3 mb-4 shrink-0">
        <button
          onClick={handleLogout}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-500 hover:bg-red-500/15 hover:text-red-400 transition-all duration-200 ${
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

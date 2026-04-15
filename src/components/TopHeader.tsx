import {
  Search,
  LogOut,
  User,
  Settings,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAppStore, Role } from "@/store/appStore";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ThemeToggle";
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

interface TopHeaderProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export function TopHeader({ collapsed, onToggleCollapse }: TopHeaderProps) {
  const { currentRole, currentUser } = useAppStore();
  const navigate = useNavigate();

  const empName = (currentUser as any)?.emp_name ?? roleLabels[currentRole] ?? "User";
  const displayEmail = (currentUser as any)?.emp_mail ?? "";

  // Build initials: first letter of first word + first letter of last word
  const nameParts = empName.trim().split(/\s+/);
  const initials = nameParts.length >= 2
    ? (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase()
    : nameParts[0][0].toUpperCase();

  return (
    <header className="h-16 border-b border-border bg-card/50 backdrop-blur-xl flex items-center justify-between px-5 sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 bg-muted/40 border border-border/50 rounded-xl px-3 py-2 w-72">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <input
            placeholder="Search anything..."
            className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none w-full"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <ThemeToggle />

        <Badge
          variant="outline"
          className={`text-[10px] font-semibold ${roleBadgeStyle[currentRole]}`}
        >
          {roleLabels[currentRole]}
        </Badge>

        {/* Profile Dropdown */}
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
  );
}

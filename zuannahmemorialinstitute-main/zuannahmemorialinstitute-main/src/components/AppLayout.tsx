import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, BookOpen, Settings, FileText, Library, CalendarRange, LogOut, Shield, UserCog, GraduationCap } from "lucide-react";
import zuannahLogo from "@/assets/zuannah_logo.jpeg";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole, AppRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type NavItem = {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  roles?: AppRole[];
};

const NAV_ITEMS: NavItem[] = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/students", label: "Students", icon: Users, roles: ["admin", "teacher"] },
  { to: "/subjects", label: "Subjects", icon: Library, roles: ["admin"] },
  { to: "/grades", label: "Grade Entry", icon: BookOpen, roles: ["admin", "teacher"] },
  { to: "/my-grades", label: "My Grades", icon: GraduationCap, roles: ["student"] },
  { to: "/my-child-grades", label: "My Child's Grades", icon: GraduationCap, roles: ["parent"] },
  { to: "/reports", label: "Reports", icon: FileText, roles: ["admin", "teacher"] },
  { to: "/academic-years", label: "Academic Years", icon: CalendarRange, roles: ["admin"] },
  { to: "/users", label: "User Management", icon: UserCog, roles: ["admin"] },
  { to: "/settings", label: "Settings", icon: Settings, roles: ["admin"] },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { role } = useUserRole();

  const roleLabel = role ? role.charAt(0).toUpperCase() + role.slice(1) : "User";
  const roleBadgeVariant = role === "admin" ? "default" : role === "teacher" ? "secondary" : "outline";

  const visibleNavItems = NAV_ITEMS.filter(
    (item) => !item.roles || (role && item.roles.includes(role))
  );
  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Header */}
      <header className="bg-brown text-sidebar-foreground px-6 py-3 flex items-center justify-between no-print">
        <div className="flex items-center gap-3">
          <img src={zuannahLogo} alt="ZMI Logo" className="w-10 h-10 rounded-full object-contain" />
          <div>
            <h1 className="text-lg font-display font-bold text-gold">Zuannah Memorial Institute</h1>
            <p className="text-xs text-sidebar-foreground/70">Grade Sheet Management System</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={roleBadgeVariant} className="text-xs">
            <Shield className="w-3 h-3 mr-1" />
            {roleLabel}
          </Badge>
          <span className="text-sm text-sidebar-foreground/60">{user?.email}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={signOut}
            className="text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
          >
            <LogOut className="w-4 h-4 mr-1" />
            Logout
          </Button>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <nav className="w-56 bg-brown shrink-0 no-print">
          <ul className="py-2">
            {visibleNavItems.map((item) => {
              const active = location.pathname === item.to;
              return (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className={`flex items-center gap-3 px-5 py-3 text-sm transition-colors ${
                      active
                        ? "bg-sidebar-accent text-gold font-semibold"
                        : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Main */}
        <main className="flex-1 p-6 overflow-auto animate-fade-in">{children}</main>
      </div>
    </div>
  );
}

import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import {
  LayoutDashboard,
  Wrench,
  FlaskConical,
  Users,
  FileBarChart,
  ArrowRightLeft,
  X,
  GraduationCap,
  Settings,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useState } from "react";

type SidebarLink = {
  to?: string;
  label: string;
  icon: React.ElementType;
  children?: { to: string; label: string }[];
};

const adminLinks: SidebarLink[] = [
  { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/tools", label: "Tools & Products", icon: Wrench },
  // { to: "/admin/lecturers", label: "Lecturers", icon: GraduationCap },
  { to: "/admin/delegations", label: "Delegations", icon: ArrowRightLeft },
  {
    label: "Student Profiles",
    icon: Users,
    children: [
      { to: "/admin/students", label: "View All Students" },
      { to: "/admin/students?add=true", label: "Add Student" },
    ],
  },
  { to: "/admin/labs", label: "Labs", icon: FlaskConical },
  { to: "/admin/reports", label: "Analytics & Reports", icon: FileBarChart },
  { to: "/admin/settings", label: "Settings", icon: Settings },
];

interface AppSidebarProps {
  open: boolean;
  onClose: () => void;
}

const AppSidebar = ({ open, onClose }: AppSidebarProps) => {
  const { user } = useAuth();
  const location = useLocation();
  const [studentsDropdownOpen, setStudentsDropdownOpen] = useState(false);

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-foreground/30 md:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 flex h-full w-60 flex-col bg-sidebar text-sidebar-foreground transition-transform duration-200 md:static md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-14 items-center justify-between border-b border-sidebar-border px-4">
          <div className="flex items-center gap-2">
            <Wrench className="h-5 w-5 text-sidebar-primary" />
            <span className="text-lg font-bold text-sidebar-accent-foreground">
              ToolPort
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-sidebar-foreground md:hidden"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {adminLinks.map((link) => {
            // If the link has children, render a dropdown
            if (link.children) {
              const isActive = location.pathname.startsWith("/admin/students");
              return (
                <div key={link.label} className="space-y-1">
                  <button
                    onClick={() => setStudentsDropdownOpen(!studentsDropdownOpen)}
                    className={cn(
                      "flex w-full items-center justify-between gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-primary"
                        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    )}
                  >
                    <span className="flex items-center gap-3">
                      <link.icon className="h-4 w-4" />
                      {link.label}
                    </span>
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 transition-transform",
                        studentsDropdownOpen && "rotate-180"
                      )}
                    />
                  </button>
                  {studentsDropdownOpen && (
                    <div className="ml-6 space-y-1 border-l border-sidebar-border pl-2">
                      {link.children.map((child) => (
                        <NavLink
                          key={child.to}
                          to={child.to}
                          onClick={onClose}
                          className={({ isActive }) =>
                            cn(
                              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                              isActive
                                ? "bg-sidebar-accent text-sidebar-primary"
                                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                            )
                          }
                        >
                          {child.label}
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            // Regular link (no children)
            return (
              <NavLink
                key={link.to}
                to={link.to!}
                onClick={onClose}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-primary"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )
                }
              >
                <link.icon className="h-4 w-4" />
                {link.label}
              </NavLink>
            );
          })}
        </nav>

        <div className="border-t border-sidebar-border p-4">
          <p className="truncate text-xs text-sidebar-foreground/60">
            {user?.username}
          </p>
          <p className="truncate text-sm font-medium text-sidebar-accent-foreground">
            {user?.name}
          </p>
        </div>
      </aside>
    </>
  );
};

export default AppSidebar;
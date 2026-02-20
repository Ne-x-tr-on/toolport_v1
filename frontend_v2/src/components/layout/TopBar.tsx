import { LogOut, Wrench, Menu } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface TopBarProps {
  onToggleSidebar?: () => void;
}

const TopBar = ({ onToggleSidebar }: TopBarProps) => {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-card px-4 md:px-6">
      <div className="flex items-center gap-3">
        {onToggleSidebar && (
          <Button variant="ghost" size="icon" className="md:hidden" onClick={onToggleSidebar}>
            <Menu className="h-5 w-5" />
          </Button>
        )}
        <div className="flex items-center gap-2">
          <Wrench className="h-5 w-5 text-primary" />
          <span className="text-lg font-bold tracking-tight">ToolPort</span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="hidden text-sm font-medium sm:inline">{user?.name}</span>
        <Badge variant="secondary" className="capitalize">{user?.role}</Badge>
        <Button variant="ghost" size="icon" onClick={logout} title="Logout">
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
};

export default TopBar;

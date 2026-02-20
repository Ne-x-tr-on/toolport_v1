import { useState, ReactNode } from "react";
import TopBar from "./TopBar";
import AppSidebar from "./AppSidebar";
import Footer from "./Footer";

const DashboardLayout = ({ children }: { children: ReactNode }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen w-full">
      <AppSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar onToggleSidebar={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
        <Footer />
      </div>
    </div>
  );
};

export default DashboardLayout;

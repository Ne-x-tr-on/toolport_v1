import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import AdminTools from "./pages/AdminTools";
import AdminLecturers from "./pages/AdminLecturers";
import AdminDelegations from "./pages/AdminDelegations";
import AdminLabs from "./pages/AdminLabs";
import AdminStudentProfiles from "./pages/AdminStudentProfiles";
import AdminReports from "./pages/AdminReports";
import AdminSettings from "./pages/AdminSettings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const RootRedirect = () => {
  const { user } = useAuth();
  if (user) return <Navigate to="/admin/dashboard" replace />;
  return <Navigate to="/login" replace />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<RootRedirect />} />
            <Route path="/login" element={<Login />} />

            {/* Admin */}
            <Route path="/admin/dashboard" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/tools" element={<ProtectedRoute><AdminTools /></ProtectedRoute>} />
            <Route path="/admin/lecturers" element={<ProtectedRoute><AdminLecturers /></ProtectedRoute>} />
            <Route path="/admin/delegations" element={<ProtectedRoute><AdminDelegations /></ProtectedRoute>} />
            <Route path="/admin/labs" element={<ProtectedRoute><AdminLabs /></ProtectedRoute>} />
            <Route path="/admin/students" element={<ProtectedRoute><AdminStudentProfiles /></ProtectedRoute>} />
            <Route path="/admin/reports" element={<ProtectedRoute><AdminReports /></ProtectedRoute>} />
            <Route path="/admin/settings" element={<ProtectedRoute><AdminSettings /></ProtectedRoute>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import AppLayout from "@/components/AppLayout";
import RoleGuard from "@/components/RoleGuard";
import Dashboard from "@/pages/Dashboard";
import Students from "@/pages/Students";
import GradeEntry from "@/pages/GradeEntry";
import GradeSheet from "@/pages/GradeSheet";
import Reports from "@/pages/Reports";
import SettingsPage from "@/pages/SettingsPage";
import SubjectManagement from "@/pages/SubjectManagement";
import UserManagement from "@/pages/UserManagement";
import AcademicYearManagement from "@/pages/AcademicYearManagement";
import StudentDashboard from "@/pages/StudentDashboard";
import ParentDashboard from "@/pages/ParentDashboard";
import Login from "@/pages/Login";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/students" element={<RoleGuard allowed={["admin", "teacher"]}><Students /></RoleGuard>} />
                      <Route path="/grades" element={<RoleGuard allowed={["admin", "teacher"]}><GradeEntry /></RoleGuard>} />
                      <Route path="/subjects" element={<RoleGuard allowed={["admin"]}><SubjectManagement /></RoleGuard>} />
                      <Route path="/grade-sheet/:id" element={<RoleGuard allowed={["admin", "teacher"]}><GradeSheet /></RoleGuard>} />
                      <Route path="/reports" element={<RoleGuard allowed={["admin", "teacher"]}><Reports /></RoleGuard>} />
                      <Route path="/academic-years" element={<RoleGuard allowed={["admin"]}><AcademicYearManagement /></RoleGuard>} />
                      <Route path="/settings" element={<RoleGuard allowed={["admin"]}><SettingsPage /></RoleGuard>} />
                      <Route path="/users" element={<RoleGuard allowed={["admin"]}><UserManagement /></RoleGuard>} />
                      <Route path="/my-grades" element={<RoleGuard allowed={["student"]}><StudentDashboard /></RoleGuard>} />
                      <Route path="/my-child-grades" element={<RoleGuard allowed={["parent"]}><ParentDashboard /></RoleGuard>} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DashboardLayout } from "@/components/DashboardLayout";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { useAppStore } from "@/store/appStore";
import { useAuthSync } from "@/hooks/useAuthSync";
import SuperAdminDashboard from "@/pages/SuperAdminDashboard";
import AdminDashboard from "@/pages/AdminDashboard";
import ProductManagement from "@/pages/ProductManagement";
import UserManagement from "@/pages/UserManagement";
import AdminMenuManagement from "@/pages/AdminMenuManagement";
import AdminOrders from "@/pages/AdminOrders";
import UserDashboard from "@/pages/UserDashboard";
import UserCart from "@/pages/UserCart";
import MyBooking from "@/pages/MyBooking";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import NotFound from "./pages/NotFound.tsx";
import Acknowledged from "@/pages/Acknowledged";

const queryClient = new QueryClient();

function AppRoutes() {
  const { currentRole } = useAppStore();
  useAuthSync();

  const token = sessionStorage.getItem('access_token');
  const isAuth = !!token && !!currentRole;

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/acknowledged" element={<Acknowledged />} />
      <Route path="/*" element={
        !isAuth ? <Navigate to="/login" replace /> : (
          <DashboardLayout>
            <Routes>
              {currentRole === 'super-admin' && (
                <>
                  <Route path="/" element={<SuperAdminDashboard />} />
                  <Route path="/products" element={<ProductManagement />} />
                  <Route path="/menu" element={<AdminMenuManagement />} />
                  <Route path="/users" element={<UserManagement />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </>
              )}
              {currentRole === 'admin' && (
                <>
                  <Route path="/" element={<AdminDashboard />} />
                  <Route path="/products" element={<ProductManagement />} />
                  <Route path="/menu" element={<AdminMenuManagement />} />
                  <Route path="/orders" element={<AdminOrders />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </>
              )}
              {currentRole === 'user' && (
                <>
                  <Route path="/" element={<UserDashboard />} />
                  <Route path="/order" element={<UserDashboard />} />
                  <Route path="/cart" element={<UserCart />} />
                  <Route path="/my-booking" element={<MyBooking />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </>
              )}
            </Routes>
          </DashboardLayout>
        )
      } />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Toaster />
          <Sonner position="top-center" richColors />
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;

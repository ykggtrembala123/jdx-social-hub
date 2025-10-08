import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Auth from "./pages/Auth";
import AffiliateDashboard from "./pages/AffiliateDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import AffiliateDetails from "./pages/AffiliateDetails";
import CreateAffiliate from "./pages/CreateAffiliate";
import EditAffiliate from "./pages/EditAffiliate";
import WithdrawalManagement from "./pages/WithdrawalManagement";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={<Auth />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <AffiliateDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/withdrawals"
              element={
                <ProtectedRoute>
                  <WithdrawalManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/create-affiliate"
              element={
                <ProtectedRoute>
                  <CreateAffiliate />
                </ProtectedRoute>
              }
            />
            <Route
              path="/affiliate/:code"
              element={<AffiliateDetails />}
            />
            <Route
              path="/affiliate/:code/edit"
              element={
                <ProtectedRoute>
                  <EditAffiliate />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

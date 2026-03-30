import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import AgentLayout from "./components/agent/AgentLayout";
import AgentOverview from "./pages/agent/Overview";
import AgentAnalytics from "./pages/agent/Analytics";
import AgentJobs from "./pages/agent/Jobs";
import CreateReport from "./pages/agent/CreateReport";
import AgentJobDetail from "./pages/agent/JobDetail";
import AgentNotifications from "./pages/agent/Notifications";
import AgentSettings from "./pages/agent/Settings";
import ContractorLayout from "./components/contractor/ContractorLayout";
import ContractorOverview from "./pages/contractor/Overview";
import ContractorAnalytics from "./pages/contractor/Analytics";
import Marketplace from "./pages/contractor/Marketplace";
import AppliedJobs from "./pages/contractor/AppliedJobs";
import CurrentJobs from "./pages/contractor/CurrentJobs";
import SavedJobs from "./pages/contractor/SavedJobs";
import ContractorProfile from "./pages/contractor/Profile";
import ContractorNotifications from "./pages/contractor/Notifications";

const queryClient = new QueryClient();

function DashboardRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  return user.role === "agent" ? <Navigate to="/dashboard" /> : <Navigate to="/contractor" />;
}

function RequireAgent({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (user.role !== "agent") return <Navigate to="/contractor" />;
  return <>{children}</>;
}

function RequireContractor({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (user.role !== "contractor") return <Navigate to="/dashboard" />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      {/* Agent routes */}
      <Route path="/dashboard" element={<RequireAgent><AgentLayout /></RequireAgent>}>
        <Route index element={<AgentOverview />} />
        <Route path="analytics" element={<AgentAnalytics />} />
        <Route path="jobs" element={<AgentJobs />} />
        <Route path="jobs/:jobId" element={<AgentJobDetail />} />
        <Route path="create-report" element={<CreateReport />} />
        <Route path="notifications" element={<AgentNotifications />} />
        <Route path="settings" element={<AgentSettings />} />
      </Route>

      {/* Contractor routes */}
      <Route path="/contractor" element={<RequireContractor><ContractorLayout /></RequireContractor>}>
        <Route index element={<ContractorOverview />} />
        <Route path="analytics" element={<ContractorAnalytics />} />
        <Route path="marketplace" element={<Marketplace />} />
        <Route path="applied" element={<AppliedJobs />} />
        <Route path="current" element={<CurrentJobs />} />
        <Route path="saved" element={<SavedJobs />} />
        <Route path="profile" element={<ContractorProfile />} />
        <Route path="notifications" element={<ContractorNotifications />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

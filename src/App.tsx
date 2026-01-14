import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Explore from "./pages/Explore";
import Components from "./pages/Components";
import NotFound from "./pages/NotFound";
import Dashboard from "./pages/Dashboard";
import Settings from "./pages/Settings";
import Finance from "./pages/Finance";
import CreatorProfile from "./pages/CreatorProfile";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import CompleteProfile from "./pages/CompleteProfile";
import DonationImage from "./pages/DonationImage";
// Payment pages - separate flows for creator fee and tips
import CreatorPaymentSuccess from "./pages/payments/CreatorPaymentSuccess";
import CreatorPaymentFailed from "./pages/payments/CreatorPaymentFailed";
import TipPaymentSuccess from "./pages/payments/TipPaymentSuccess";
import TipPaymentFailed from "./pages/payments/TipPaymentFailed";
// Admin pages
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminCreators from "./pages/admin/AdminCreators";
import AdminWithdrawals from "./pages/admin/AdminWithdrawals";
import AdminTips from "./pages/admin/AdminTips";
import AdminSettings from "./pages/admin/AdminSettings";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/explore" element={<Explore />} />
          {/* Creator fee payment routes */}
          <Route path="/payments/creator/success" element={<CreatorPaymentSuccess />} />
          <Route path="/payments/creator/failed" element={<CreatorPaymentFailed />} />
          {/* Tips payment routes */}
          <Route path="/payments/tips/success" element={<TipPaymentSuccess />} />
          <Route path="/payments/tips/failed" element={<TipPaymentFailed />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/finance" element={<Finance />} />
          <Route path="/complete-profile" element={<CompleteProfile />} />
          <Route path="/donation-image" element={<DonationImage />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />
          {/* Admin routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="creators" element={<AdminCreators />} />
            <Route path="withdrawals" element={<AdminWithdrawals />} />
            <Route path="tips" element={<AdminTips />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>
          <Route path="/:username" element={<CreatorProfile />} />
          <Route path="/components" element={<Components />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
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
import About from "./pages/About";
import Contact from "./pages/Contact";
import Status from "./pages/Status";
import CookiePolicy from "./pages/CookiePolicy";
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
import AdminVerifications from "./pages/admin/AdminVerifications";
import AdminMailbox from "./pages/admin/AdminMailbox";
import AdminAdmins from "./pages/admin/AdminAdmins";
import AdminShareImage from "./pages/admin/AdminShareImage";
import AdminEmailTemplates from "./pages/admin/AdminEmailTemplates";
import AdminTipDetail from "./pages/admin/AdminTipDetail";
import AdminWithdrawalDetail from "./pages/admin/AdminWithdrawalDetail";

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
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
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/status" element={<Status />} />
            <Route path="/cookie-policy" element={<CookiePolicy />} />
            {/* Admin routes */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="creators" element={<AdminCreators />} />
              <Route path="verifications" element={<AdminVerifications />} />
              <Route path="withdrawals" element={<AdminWithdrawals />} />
              <Route path="withdrawals/:withdrawalId" element={<AdminWithdrawalDetail />} />
              <Route path="tips" element={<AdminTips />} />
              <Route path="tips/:tipId" element={<AdminTipDetail />} />
              <Route path="mailbox" element={<AdminMailbox />} />
              <Route path="share-image" element={<AdminShareImage />} />
              <Route path="email-templates" element={<AdminEmailTemplates />} />
              <Route path="settings" element={<AdminSettings />} />
              <Route path="admins" element={<AdminAdmins />} />
            </Route>
            <Route path="/:username" element={<CreatorProfile />} />
            <Route path="/components" element={<Components />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;

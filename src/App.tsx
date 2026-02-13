import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import MaintenanceGuard from "@/components/MaintenanceGuard";
import { GlobalLoaderProvider } from "@/contexts/GlobalLoaderContext";
import { GlobalLoader } from "@/components/GlobalLoader";

// Empty fallback - global loader handles all loading visuals
const PageLoader = () => null;

// Lazy load all pages
const Home = lazy(() => import("./pages/Home"));
const Explore = lazy(() => import("./pages/Explore"));
const Components = lazy(() => import("./pages/Components"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Settings = lazy(() => import("./pages/Settings"));
const Finance = lazy(() => import("./pages/Finance"));
const CreatorProfile = lazy(() => import("./pages/CreatorProfile"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const Status = lazy(() => import("./pages/Status"));
const CookiePolicy = lazy(() => import("./pages/CookiePolicy"));
const CompleteProfile = lazy(() => import("./pages/CompleteProfile"));
const DonationImage = lazy(() => import("./pages/DonationImage"));
const Embed = lazy(() => import("./pages/Embed"));
const StreamerAlert = lazy(() => import("./pages/StreamerAlert"));
const Authenticity = lazy(() => import("./pages/Authenticity"));
const Support = lazy(() => import("./pages/Support"));
const SupportTickets = lazy(() => import("./pages/SupportTickets"));
const Notices = lazy(() => import("./pages/Notices"));
const SupportTicketDetail = lazy(() => import("./pages/SupportTicketDetail"));
const Deposit = lazy(() => import("./pages/Deposit"));
const Transactions = lazy(() => import("./pages/Transactions"));
const PitchDeck = lazy(() => import("./pages/PitchDeck"));

// Payment pages
const CreatorPaymentSuccess = lazy(() => import("./pages/payments/CreatorPaymentSuccess"));
const CreatorPaymentFailed = lazy(() => import("./pages/payments/CreatorPaymentFailed"));
const TipPaymentSuccess = lazy(() => import("./pages/payments/TipPaymentSuccess"));
const TipPaymentFailed = lazy(() => import("./pages/payments/TipPaymentFailed"));

// Admin pages (heavy - Monaco Editor, charts)
const AdminLayout = lazy(() => import("./pages/admin/AdminLayout"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminCreators = lazy(() => import("./pages/admin/AdminCreators"));
const AdminWithdrawals = lazy(() => import("./pages/admin/AdminWithdrawals"));
const AdminTips = lazy(() => import("./pages/admin/AdminTips"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));
const AdminVerifications = lazy(() => import("./pages/admin/AdminVerifications"));
const AdminMailbox = lazy(() => import("./pages/admin/AdminMailbox"));
const AdminAdmins = lazy(() => import("./pages/admin/AdminAdmins"));
const AdminShareImage = lazy(() => import("./pages/admin/AdminShareImage"));
const AdminEmailTemplates = lazy(() => import("./pages/admin/AdminEmailTemplates"));
const AdminTipDetail = lazy(() => import("./pages/admin/AdminTipDetail"));
const AdminWithdrawalDetail = lazy(() => import("./pages/admin/AdminWithdrawalDetail"));
const AdminNotices = lazy(() => import("./pages/admin/AdminNotices"));
const AdminPages = lazy(() => import("./pages/admin/AdminPages"));
const AdminSupport = lazy(() => import("./pages/admin/AdminSupport"));
const AdminSupportDetail = lazy(() => import("./pages/admin/AdminSupportDetail"));

// Optimized QueryClient with caching
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <GlobalLoaderProvider>
            <GlobalLoader />
            <MaintenanceGuard>
              <Suspense fallback={<PageLoader />}>
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
                  <Route path="/authenticity" element={<Authenticity />} />
                  <Route path="/notices" element={<Notices />} />
                  <Route path="/support" element={<Support />} />
                  <Route path="/support/tickets" element={<SupportTickets />} />
                  <Route path="/support/ticket/:ticketId" element={<SupportTicketDetail />} />
                  <Route path="/deposit" element={<Deposit />} />
                  <Route path="/transactions" element={<Transactions />} />
                  <Route path="/pitch" element={<PitchDeck />} />
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
                    <Route path="notices" element={<AdminNotices />} />
                    <Route path="pages" element={<AdminPages />} />
                    <Route path="support" element={<AdminSupport />} />
                    <Route path="support/:ticketId" element={<AdminSupportDetail />} />
                  </Route>
                  <Route path="/embed/:username" element={<Embed />} />
                  <Route path="/alerts/:token" element={<StreamerAlert />} />
                  <Route path="/:username" element={<CreatorProfile />} />
                  <Route path="/components" element={<Components />} />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </MaintenanceGuard>
          </GlobalLoaderProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;

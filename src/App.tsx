import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { LandingSettingsProvider } from "@/hooks/useLandingSettings";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ThemeProvider } from "next-themes";
import { BackgroundImageGenerationProvider } from "@/hooks/useBackgroundImageGeneration";
import { BackgroundGenerationIndicator } from "@/components/layout/BackgroundGenerationIndicator";
import { MaintenanceGuard } from "@/components/maintenance/MaintenanceGuard";
import { useAppDomainRedirect } from "@/hooks/useAppDomainRedirect";
import { Loader2 } from "lucide-react";
import { Suspense, lazy } from "react";

// Critical pages loaded immediately
import Index from "./pages/Index";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

// Lazy load all other pages for better performance
const VideoAnalyzer = lazy(() => import("./pages/VideoAnalyzer"));
const ExploreNiche = lazy(() => import("./pages/ExploreNiche"));
const Folders = lazy(() => import("./pages/Folders"));
const MonitoredChannels = lazy(() => import("./pages/MonitoredChannels"));
const Analytics = lazy(() => import("./pages/Analytics"));
const ViralLibrary = lazy(() => import("./pages/ViralLibrary"));
const ViralAgents = lazy(() => import("./pages/ViralAgents"));
const PromptsImages = lazy(() => import("./pages/PromptsImages"));
const VoiceGenerator = lazy(() => import("./pages/VoiceGenerator"));
const VideoGenerator = lazy(() => import("./pages/VideoGenerator"));
const YouTubeIntegration = lazy(() => import("./pages/YouTubeIntegration"));
const SearchChannels = lazy(() => import("./pages/SearchChannels"));
const ChannelAnalyzer = lazy(() => import("./pages/ChannelAnalyzer"));
const SRTConverter = lazy(() => import("./pages/SRTConverter"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const AdminPanel = lazy(() => import("./pages/AdminPanel"));
const SceneGenerator = lazy(() => import("./pages/SceneGenerator"));
const AnalysisHistory = lazy(() => import("./pages/AnalysisHistory"));
const PlansCredits = lazy(() => import("./pages/PlansCredits"));
const PaymentSuccess = lazy(() => import("./pages/PaymentSuccess"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const PendingApproval = lazy(() => import("./pages/PendingApproval"));
const Maintenance = lazy(() => import("./pages/Maintenance"));

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <Loader2 className="w-8 h-8 animate-spin text-primary" />
  </div>
);

// Smart redirect: logged in -> dashboard, not logged in -> landing
const RootRedirect = () => {
  const { user, loading } = useAuth();
  useAppDomainRedirect();
  
  if (loading) {
    return <PageLoader />;
  }
  
  return user ? <Navigate to="/dashboard" replace /> : <Navigate to="/landing" replace />;
};

// Wrapper component that handles domain redirect for all routes
const AppRoutes = () => {
  useAppDomainRedirect();
  
  return (
    <MaintenanceGuard>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/landing" element={<LandingSettingsProvider><Landing /></LandingSettingsProvider>} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<ProtectedRoute><Index /></ProtectedRoute>} />
          <Route path="/analyzer" element={<ProtectedRoute><VideoAnalyzer /></ProtectedRoute>} />
          <Route path="/history" element={<ProtectedRoute><AnalysisHistory /></ProtectedRoute>} />
          <Route path="/explore" element={<ProtectedRoute><ExploreNiche /></ProtectedRoute>} />
          <Route path="/folders" element={<ProtectedRoute><Folders /></ProtectedRoute>} />
          <Route path="/channels" element={<ProtectedRoute><MonitoredChannels /></ProtectedRoute>} />
          <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
          <Route path="/library" element={<ProtectedRoute><ViralLibrary /></ProtectedRoute>} />
          <Route path="/agents" element={<ProtectedRoute><ViralAgents /></ProtectedRoute>} />
          <Route path="/prompts" element={<ProtectedRoute><PromptsImages /></ProtectedRoute>} />
          <Route path="/voice" element={<ProtectedRoute><VoiceGenerator /></ProtectedRoute>} />
          
          <Route path="/video-gen" element={<ProtectedRoute><VideoGenerator /></ProtectedRoute>} />
          <Route path="/youtube" element={<ProtectedRoute><YouTubeIntegration /></ProtectedRoute>} />
          <Route path="/search-channels" element={<ProtectedRoute><SearchChannels /></ProtectedRoute>} />
          <Route path="/channel-analyzer" element={<ProtectedRoute><ChannelAnalyzer /></ProtectedRoute>} />
          <Route path="/srt" element={<ProtectedRoute><SRTConverter /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute><AdminPanel /></ProtectedRoute>} />
          
          <Route path="/scenes" element={<ProtectedRoute><SceneGenerator /></ProtectedRoute>} />
          <Route path="/plans" element={<ProtectedRoute><PlansCredits /></ProtectedRoute>} />
          <Route path="/payment-success" element={<ProtectedRoute><PaymentSuccess /></ProtectedRoute>} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/pending-approval" element={<ProtectedRoute><PendingApproval /></ProtectedRoute>} />
          <Route path="/maintenance" element={<Maintenance />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </MaintenanceGuard>
  );
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Optimize query behavior
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <AuthProvider>
        <BackgroundImageGenerationProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AppRoutes />
              <BackgroundGenerationIndicator />
            </BrowserRouter>
          </TooltipProvider>
        </BackgroundImageGenerationProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { LandingSettingsProvider } from "@/hooks/useLandingSettings";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ThemeProvider } from "next-themes";
import { BackgroundImageGenerationProvider } from "@/hooks/useBackgroundImageGeneration";
import { BackgroundGenerationIndicator } from "@/components/layout/BackgroundGenerationIndicator";
import Index from "./pages/Index";
import Landing from "./pages/Landing";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import VideoAnalyzer from "./pages/VideoAnalyzer";
import ExploreNiche from "./pages/ExploreNiche";
import Folders from "./pages/Folders";
import MonitoredChannels from "./pages/MonitoredChannels";
import Analytics from "./pages/Analytics";
import ViralLibrary from "./pages/ViralLibrary";
import ViralAgents from "./pages/ViralAgents";
import PromptsImages from "./pages/PromptsImages";
import VoiceGenerator from "./pages/VoiceGenerator";

import VideoGenerator from "./pages/VideoGenerator";
import YouTubeIntegration from "./pages/YouTubeIntegration";
import SearchChannels from "./pages/SearchChannels";
import ChannelAnalyzer from "./pages/ChannelAnalyzer";
import SRTConverter from "./pages/SRTConverter";
import SettingsPage from "./pages/SettingsPage";
import AdminPanel from "./pages/AdminPanel";

import SceneGenerator from "./pages/SceneGenerator";
import AnalysisHistory from "./pages/AnalysisHistory";
import PlansCredits from "./pages/PlansCredits";
import PaymentSuccess from "./pages/PaymentSuccess";
import TermsOfService from "./pages/TermsOfService";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import ResetPassword from "./pages/ResetPassword";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <AuthProvider>
        <BackgroundImageGenerationProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
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
                <Route path="*" element={<NotFound />} />
              </Routes>
              <BackgroundGenerationIndicator />
            </BrowserRouter>
          </TooltipProvider>
        </BackgroundImageGenerationProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;

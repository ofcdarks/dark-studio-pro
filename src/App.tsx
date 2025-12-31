import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Index from "./pages/Index";
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
import BatchImages from "./pages/BatchImages";
import VideoGenerator from "./pages/VideoGenerator";
import YouTubeIntegration from "./pages/YouTubeIntegration";
import SearchChannels from "./pages/SearchChannels";
import ViralAnalysis from "./pages/ViralAnalysis";
import SRTConverter from "./pages/SRTConverter";
import SettingsPage from "./pages/SettingsPage";
import AdminPanel from "./pages/AdminPanel";
import ThumbnailsPage from "./pages/ThumbnailsPage";
import SceneGenerator from "./pages/SceneGenerator";

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
            <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/analyzer" element={<ProtectedRoute><VideoAnalyzer /></ProtectedRoute>} />
            <Route path="/explore" element={<ProtectedRoute><ExploreNiche /></ProtectedRoute>} />
            <Route path="/folders" element={<ProtectedRoute><Folders /></ProtectedRoute>} />
            <Route path="/channels" element={<ProtectedRoute><MonitoredChannels /></ProtectedRoute>} />
            <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
            <Route path="/library" element={<ProtectedRoute><ViralLibrary /></ProtectedRoute>} />
            <Route path="/agents" element={<ProtectedRoute><ViralAgents /></ProtectedRoute>} />
            <Route path="/prompts" element={<ProtectedRoute><PromptsImages /></ProtectedRoute>} />
            <Route path="/voice" element={<ProtectedRoute><VoiceGenerator /></ProtectedRoute>} />
            <Route path="/batch-images" element={<ProtectedRoute><BatchImages /></ProtectedRoute>} />
            <Route path="/video-gen" element={<ProtectedRoute><VideoGenerator /></ProtectedRoute>} />
            <Route path="/youtube" element={<ProtectedRoute><YouTubeIntegration /></ProtectedRoute>} />
            <Route path="/search-channels" element={<ProtectedRoute><SearchChannels /></ProtectedRoute>} />
            <Route path="/viral-analysis" element={<ProtectedRoute><ViralAnalysis /></ProtectedRoute>} />
            <Route path="/srt" element={<ProtectedRoute><SRTConverter /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute><AdminPanel /></ProtectedRoute>} />
            <Route path="/thumbnails" element={<ProtectedRoute><ThumbnailsPage /></ProtectedRoute>} />
            <Route path="/scenes" element={<ProtectedRoute><SceneGenerator /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

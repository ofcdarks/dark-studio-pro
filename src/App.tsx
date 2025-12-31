import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/analyzer" element={<VideoAnalyzer />} />
          <Route path="/explore" element={<ExploreNiche />} />
          <Route path="/folders" element={<Folders />} />
          <Route path="/channels" element={<MonitoredChannels />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/library" element={<ViralLibrary />} />
          <Route path="/agents" element={<ViralAgents />} />
          <Route path="/prompts" element={<PromptsImages />} />
          <Route path="/voice" element={<VoiceGenerator />} />
          <Route path="/batch-images" element={<BatchImages />} />
          <Route path="/video-gen" element={<VideoGenerator />} />
          <Route path="/youtube" element={<YouTubeIntegration />} />
          <Route path="/search-channels" element={<SearchChannels />} />
          <Route path="/viral-analysis" element={<ViralAnalysis />} />
          <Route path="/srt" element={<SRTConverter />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

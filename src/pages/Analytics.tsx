import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  BarChart3, 
  TrendingUp, 
  Eye, 
  Video, 
  ThumbsUp, 
  Users, 
  Loader2, 
  RefreshCw,
  ExternalLink,
  Play,
  MessageSquare,
  Youtube,
  Settings,
  AlertCircle,
  DollarSign,
  Download,
  Info,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Lightbulb,
  Clock,
  Flame,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  TrendingDown,
  Target,
  Plus,
  Trash2,
  Calendar,
  Trophy,
  History,
  Timer,
  Award,
  Pin,
  PinOff,
  Star,
  GripVertical
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Link } from "react-router-dom";
import { usePersistedState } from "@/hooks/usePersistedState";
import { Alert, AlertDescription } from "@/components/ui/alert";
import jsPDF from "jspdf";
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface YouTubeAnalytics {
  channel: {
    id: string;
    name: string;
    description: string;
    customUrl: string;
    thumbnail: string;
    banner?: string;
    country?: string;
    publishedAt: string;
  };
  statistics: {
    subscribers: number;
    totalViews: number;
    totalVideos: number;
    hiddenSubscriberCount: boolean;
  };
  recentMetrics: {
    analyzedVideos: number;
    totalViewsRecent: number;
    avgViewsPerVideo: number;
    avgLikesPerVideo: number;
    avgCommentsPerVideo: number;
    avgEngagementRate: number;
  };
  monetization: {
    estimatedRPM: number;
    estimatedTotalEarnings: number;
    estimatedMonthlyEarnings: number;
    disclaimer: string;
  };
  topVideos: Array<{
    videoId: string;
    title: string;
    thumbnail: string;
    publishedAt: string;
    views: number;
    likes: number;
    comments: number;
    engagementRate: string;
  }>;
  trendsData: Array<{
    month: string;
    views: number;
    videos: number;
    likes: number;
    avgViews: number;
  }>;
  allVideos: Array<{
    videoId: string;
    title: string;
    thumbnail?: string;
    views: number;
    likes: number;
    comments: number;
    publishedAt: string;
    engagementRate: string;
  }>;
  currentMonth?: {
    key: string;
    videosCount: number;
    views: number;
    likes: number;
    comments?: number;
    revenue?: number;
  };
}

const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  }
  return num.toLocaleString("pt-BR");
};

const Analytics = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [channelUrl, setChannelUrl] = usePersistedState("analytics_channel_url", "");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyticsData, setAnalyticsData] = usePersistedState<YouTubeAnalytics | null>("analytics_data", null);
  const [isGoalDialogOpen, setIsGoalDialogOpen] = useState(false);
  const [checklistItems, setChecklistItems] = usePersistedState<Record<string, boolean>>("analytics_checklist", {});
  const [newGoal, setNewGoal] = useState({
    goal_type: "subscribers",
    target_value: 10000,
    deadline: "",
    period_type: "all_time" as "all_time" | "monthly",
  });

  // Fetch user's API settings
  const { data: apiSettings } = useQuery({
    queryKey: ["api-settings", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("user_api_settings")
        .select("youtube_api_key, youtube_validated")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch monitored channels for quick selection
  const { data: monitoredChannels } = useQuery({
    queryKey: ["monitored-channels", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("monitored_channels")
        .select("id, channel_url, channel_name")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch saved analytics channels (max 5)
  const { data: savedChannels, refetch: refetchSavedChannels } = useQuery({
    queryKey: ["saved-analytics-channels", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("saved_analytics_channels")
        .select("*")
        .eq("user_id", user.id)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const [draggedChannel, setDraggedChannel] = useState<string | null>(null);

  const isChannelSaved = savedChannels?.some((c) => c.channel_url === channelUrl) || false;
  const canSaveMore = (savedChannels?.length || 0) < 5;

  const saveChannel = async () => {
    if (!user || !analyticsData || !channelUrl) return;
    
    if (!canSaveMore) {
      toast({
        title: "Limite atingido",
        description: "Você pode salvar no máximo 5 canais. Remova um para adicionar outro.",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase.from("saved_analytics_channels").upsert(
      {
        user_id: user.id,
        channel_url: channelUrl,
        channel_id: analyticsData.channel.id,
        channel_name: analyticsData.channel.name,
        channel_thumbnail: analyticsData.channel.thumbnail,
        subscribers: analyticsData.statistics.subscribers,
        total_views: analyticsData.statistics.totalViews,
        total_videos: analyticsData.statistics.totalVideos,
        last_fetched_at: new Date().toISOString(),
        cached_data: analyticsData as any,
      },
      { onConflict: "user_id,channel_url" }
    );

    if (error) {
      toast({ title: "Erro ao salvar canal", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Canal salvo!", description: "Os dados do canal foram fixados" });
    refetchSavedChannels();
  };

  const unsaveChannel = async (channelUrlToRemove: string) => {
    if (!user) return;
    
    const { error } = await supabase
      .from("saved_analytics_channels")
      .delete()
      .eq("user_id", user.id)
      .eq("channel_url", channelUrlToRemove);

    if (error) {
      toast({ title: "Erro ao remover canal", variant: "destructive" });
      return;
    }

    toast({ title: "Canal removido" });
    refetchSavedChannels();
    
    // Clear data if removing current channel
    if (channelUrlToRemove === channelUrl) {
      setAnalyticsData(null);
    }
  };

  const loadSavedChannel = (channel: any) => {
    setChannelUrl(channel.channel_url);
    if (channel.cached_data) {
      setAnalyticsData(channel.cached_data);
    }
  };

  // Drag and drop handlers for reordering channels
  const handleDragStart = (channelId: string) => {
    setDraggedChannel(channelId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (targetChannelId: string) => {
    if (!draggedChannel || draggedChannel === targetChannelId || !savedChannels || !user) {
      setDraggedChannel(null);
      return;
    }

    const draggedIndex = savedChannels.findIndex(c => c.id === draggedChannel);
    const targetIndex = savedChannels.findIndex(c => c.id === targetChannelId);

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedChannel(null);
      return;
    }

    // Reorder the array
    const newOrder = [...savedChannels];
    const [removed] = newOrder.splice(draggedIndex, 1);
    newOrder.splice(targetIndex, 0, removed);

    // Update display_order for all affected channels
    const updates = newOrder.map((channel, index) => 
      supabase
        .from("saved_analytics_channels")
        .update({ display_order: index })
        .eq("id", channel.id)
    );

    await Promise.all(updates);
    refetchSavedChannels();
    setDraggedChannel(null);
  };

  const handleDragEnd = () => {
    setDraggedChannel(null);
  };

  // Fetch active channel goals
  const { data: channelGoals, refetch: refetchGoals } = useQuery({
    queryKey: ["channel-goals", user?.id, channelUrl],
    queryFn: async () => {
      if (!user || !channelUrl) return [];
      const { data, error } = await supabase
        .from("channel_goals")
        .select("*")
        .eq("user_id", user.id)
        .eq("channel_url", channelUrl)
        .eq("is_active", true)
        .is("completed_at", null)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user && !!channelUrl,
  });

  // Fetch completed goals for history
  const { data: completedGoals, refetch: refetchCompletedGoals } = useQuery({
    queryKey: ["completed-goals", user?.id, channelUrl],
    queryFn: async () => {
      if (!user || !channelUrl) return [];
      const { data, error } = await supabase
        .from("channel_goals")
        .select("*")
        .eq("user_id", user.id)
        .eq("channel_url", channelUrl)
        .not("completed_at", "is", null)
        .order("completed_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user && !!channelUrl,
  });

  // Calculate statistics for completed goals
  const completedStats = completedGoals && completedGoals.length > 0 ? {
    totalCompleted: completedGoals.length,
    avgDaysToComplete: Math.round(
      completedGoals.reduce((sum, goal) => {
        const start = new Date(goal.created_at);
        const end = new Date(goal.completed_at!);
        return sum + (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
      }, 0) / completedGoals.length
    ),
    fastestCompletion: Math.min(
      ...completedGoals.map((goal) => {
        const start = new Date(goal.created_at);
        const end = new Date(goal.completed_at!);
        return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      })
    ),
    byType: {
      subscribers: completedGoals.filter((g) => g.goal_type === "subscribers").length,
      views: completedGoals.filter((g) => g.goal_type === "views").length,
      videos: completedGoals.filter((g) => g.goal_type === "videos").length,
      engagement: completedGoals.filter((g) => g.goal_type === "engagement").length,
    },
  } : null;

  // Check for overdue goals on initial load
  useEffect(() => {
    if (channelGoals && channelGoals.length > 0) {
      const timer = setTimeout(() => checkGoalDeadlines(), 1000);
      return () => clearTimeout(timer);
    }
  }, [channelGoals]);

  const createGoal = async () => {
    if (!user || !channelUrl) return;

    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    const startValue = analyticsData
      ? getMetricFromData(analyticsData, newGoal.goal_type, newGoal.period_type)
      : 0;

    const { error } = await supabase.from("channel_goals").insert({
      user_id: user.id,
      channel_url: channelUrl,
      goal_type: newGoal.goal_type,
      target_value: newGoal.target_value,
      start_value: startValue,
      current_value: startValue,
      deadline: newGoal.deadline || null,
      period_type: newGoal.period_type,
      period_key: newGoal.period_type === "monthly" ? currentMonthKey : null,
    });

    if (error) {
      toast({ title: "Erro ao criar meta", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Meta criada!", description: "Sua meta foi adicionada com sucesso" });
    setIsGoalDialogOpen(false);
    setNewGoal({ goal_type: "subscribers", target_value: 10000, deadline: "", period_type: "all_time" });
    refetchGoals();
  };

  const updateGoalProgress = async () => {
    if (!channelGoals || !analyticsData) return;

    const completedGoals: string[] = [];
    const nearDeadlineGoals: string[] = [];
    const today = new Date();
    const threeDaysFromNow = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000);

    for (const goal of channelGoals) {
      const currentValue = getMetricFromData(
        analyticsData,
        goal.goal_type,
        goal.period_type === "monthly" ? "monthly" : "all_time"
      );

      const wasNotCompleted = !goal.completed_at;
      const isCompleted = currentValue >= goal.target_value;
      
      // Check for newly completed goals
      if (isCompleted && wasNotCompleted) {
        completedGoals.push(goalTypeLabels[goal.goal_type]?.label || goal.goal_type);
      }
      
      // Check for goals near deadline (within 3 days)
      if (goal.deadline && !isCompleted) {
        const deadlineDate = new Date(goal.deadline);
        if (deadlineDate <= threeDaysFromNow && deadlineDate >= today) {
          const daysLeft = Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          nearDeadlineGoals.push(`${goalTypeLabels[goal.goal_type]?.label} (${daysLeft} dia${daysLeft > 1 ? 's' : ''})`);
        }
      }

      await supabase
        .from("channel_goals")
        .update({
          current_value: currentValue,
          completed_at: isCompleted && wasNotCompleted ? new Date().toISOString() : goal.completed_at,
        })
        .eq("id", goal.id);
    }
    
    // Show notifications for completed goals
    if (completedGoals.length > 0) {
      toast({
        title: "🎉 Meta Atingida!",
        description: `Parabéns! Você atingiu sua meta de ${completedGoals.join(", ")}!`,
        duration: 8000,
      });
    }
    
    // Show notifications for goals near deadline
    if (nearDeadlineGoals.length > 0) {
      setTimeout(() => {
        toast({
          title: "⏰ Prazo Próximo",
          description: `Metas com prazo próximo: ${nearDeadlineGoals.join(", ")}`,
          variant: "destructive",
          duration: 8000,
        });
      }, completedGoals.length > 0 ? 2000 : 0);
    }
    
    refetchGoals();
    refetchCompletedGoals();
  };

  // Check goals on mount and when analytics data changes
  const checkGoalDeadlines = () => {
    if (!channelGoals) return;
    
    const today = new Date();
    const overdueGoals: string[] = [];
    
    for (const goal of channelGoals) {
      if (goal.deadline && !goal.completed_at) {
        const deadlineDate = new Date(goal.deadline);
        if (deadlineDate < today) {
          overdueGoals.push(goalTypeLabels[goal.goal_type]?.label || goal.goal_type);
        }
      }
    }
    
    if (overdueGoals.length > 0) {
      toast({
        title: "⚠️ Metas Atrasadas",
        description: `Você tem metas com prazo vencido: ${overdueGoals.join(", ")}`,
        variant: "destructive",
        duration: 6000,
      });
    }
  };

  const deleteGoal = async (goalId: string) => {
    const { error } = await supabase.from("channel_goals").delete().eq("id", goalId);
    if (error) {
      toast({ title: "Erro ao deletar meta", variant: "destructive" });
      return;
    }
    toast({ title: "Meta removida" });
    refetchGoals();
  };

  const goalTypeLabels: Record<string, { label: string; icon: React.ElementType }> = {
    subscribers: { label: "Inscritos", icon: Users },
    views: { label: "Views", icon: Eye },
    videos: { label: "Vídeos", icon: Video },
    likes: { label: "Likes", icon: ThumbsUp },
    comments: { label: "Comentários", icon: MessageSquare },
    revenue: { label: "Faturamento", icon: DollarSign },
    engagement: { label: "Engajamento %", icon: TrendingUp },
  };

  const getMonthKey = (date: Date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

  const sumBy = (
    videos: Array<{ views: number; likes: number; comments: number }>,
    key: "views" | "likes" | "comments"
  ) => videos.reduce((sum, v) => sum + (typeof v[key] === "number" ? v[key] : 0), 0);

  const getMetricFromData = (
    data: YouTubeAnalytics,
    goalType: string,
    periodType: "all_time" | "monthly"
  ) => {
    if (periodType === "monthly") {
      const currentMonthKey = getMonthKey(new Date());
      const monthVideos = (data.allVideos ?? []).filter((video) =>
        getMonthKey(new Date(video.publishedAt)) === currentMonthKey
      );

      switch (goalType) {
        case "videos":
          return monthVideos.length;
        case "views":
          return sumBy(monthVideos as any, "views");
        case "likes":
          return sumBy(monthVideos as any, "likes");
        case "comments":
          return sumBy(monthVideos as any, "comments");
        case "revenue":
          return Math.round(data.monetization?.estimatedMonthlyEarnings ?? 0);
        default:
          return 0;
      }
    }

    switch (goalType) {
      case "subscribers":
        return data.statistics.subscribers;
      case "views":
        return data.statistics.totalViews;
      case "videos":
        return data.statistics.totalVideos;
      case "likes":
        return sumBy((data.allVideos ?? []) as any, "likes");
      case "comments":
        return sumBy((data.allVideos ?? []) as any, "comments");
      case "revenue":
        return Math.round(data.monetization?.estimatedTotalEarnings ?? 0);
      case "engagement":
        return Math.round(data.recentMetrics.avgEngagementRate * 100);
      default:
        return 0;
    }
  };

  const formatGoalValue = (goalType: string, value: number) => {
    if (goalType === "revenue") return `R$ ${formatNumber(value)}`;
    return formatNumber(value);
  };

  const fetchAnalytics = async () => {
    if (!channelUrl.trim()) {
      toast({
        title: "URL necessária",
        description: "Por favor, insira a URL do canal do YouTube",
        variant: "destructive",
      });
      return;
    }

    if (!apiSettings?.youtube_api_key) {
      toast({
        title: "Chave de API necessária",
        description: "Configure sua chave de API do YouTube nas configurações",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);

    try {
      const { data, error } = await supabase.functions.invoke("fetch-youtube-analytics", {
        body: {
          channelUrl,
          youtubeApiKey: apiSettings.youtube_api_key,
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setAnalyticsData(data);
      toast({
        title: "Analytics carregado!",
        description: `Dados do canal ${data.channel.name} obtidos com sucesso`,
      });
      
      // Update saved channel cache if pinned
      if (isChannelSaved && user) {
        await supabase.from("saved_analytics_channels").update({
          subscribers: data.statistics.subscribers,
          total_views: data.statistics.totalViews,
          total_videos: data.statistics.totalVideos,
          last_fetched_at: new Date().toISOString(),
          cached_data: data as any,
        }).eq("user_id", user.id).eq("channel_url", channelUrl);
        refetchSavedChannels();
      }
      
      // Update goals with current data
      setTimeout(() => updateGoalProgress(), 500);
    } catch (error: unknown) {
      console.error("Error fetching analytics:", error);
      const errorMessage = error instanceof Error ? error.message : "Não foi possível carregar os analytics";
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Export to CSV function
  const exportToCSV = () => {
    if (!analyticsData) return;

    // Create CSV content
    const headers = ["Título", "Views", "Likes", "Comentários", "Engajamento %", "Data de Publicação", "URL"];
    const rows = analyticsData.allVideos?.map((video) => [
      `"${video.title.replace(/"/g, '""')}"`,
      video.views,
      video.likes,
      video.comments,
      video.engagementRate,
      video.publishedAt,
      `https://www.youtube.com/watch?v=${video.videoId}`,
    ]) || [];

    // Add channel summary at the top
    const summaryRows = [
      ["Canal:", analyticsData.channel.name],
      ["Inscritos:", analyticsData.statistics.subscribers],
      ["Views Totais:", analyticsData.statistics.totalViews],
      ["Total de Vídeos:", analyticsData.statistics.totalVideos],
      ["RPM Estimado:", `$${analyticsData.monetization?.estimatedRPM || 2.5}`],
      ["Faturamento Estimado Total:", `$${analyticsData.monetization?.estimatedTotalEarnings || 0}`],
      [""],
      headers,
      ...rows,
    ];

    const csvContent = summaryRows.map((row) => row.join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `analytics_${analyticsData.channel.name.replace(/[^a-z0-9]/gi, "_")}_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Exportação concluída",
      description: "O arquivo CSV foi baixado com sucesso",
    });
  };

  // Export Weekly PDF Report - La Casa Core Branding
  const exportWeeklyPDF = async () => {
    if (!analyticsData) return;

    // Load logo as base64
    const loadLogoAsBase64 = (): Promise<string | null> => {
      return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL("image/png"));
          } else {
            resolve(null);
          }
        };
        img.onerror = () => resolve(null);
        // Use the header logo
        img.src = "/logo-official.svg";
      });
    };

    const logoBase64 = await loadLogoAsBase64();

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    let yPos = 20;

    // Brand Colors - La Casa Dark Core
    const brandColors = {
      primary: [245, 158, 11] as [number, number, number], // Amber #f59e0b
      dark: [10, 10, 15] as [number, number, number], // #0a0a0f
      gold: [217, 173, 77] as [number, number, number], // Gold accent
      white: [255, 255, 255] as [number, number, number],
      muted: [156, 163, 175] as [number, number, number],
      success: [34, 197, 94] as [number, number, number],
      cardBg: [20, 20, 28] as [number, number, number],
    };

    const addHeader = () => {
      // Dark premium header with gradient effect
      doc.setFillColor(...brandColors.dark);
      doc.rect(0, 0, pageWidth, 55, "F");
      
      // Gold accent line
      doc.setFillColor(...brandColors.primary);
      doc.rect(0, 55, pageWidth, 3, "F");

      // Add logo if available
      if (logoBase64) {
        try {
          doc.addImage(logoBase64, "PNG", margin, 10, 35, 35);
        } catch (e) {
          console.log("Could not add logo to PDF");
        }
      }

      // Brand name (positioned after logo)
      const textStartX = logoBase64 ? margin + 42 : margin;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(24);
      doc.setTextColor(...brandColors.primary);
      doc.text("LA CASA", textStartX, 25);
      
      doc.setFontSize(11);
      doc.setTextColor(...brandColors.gold);
      doc.text("DARK CORE", textStartX, 35);

      // Report title
      doc.setFontSize(10);
      doc.setTextColor(...brandColors.white);
      doc.text("RELATORIO SEMANAL DE PERFORMANCE", textStartX, 47);

      // Date on right side
      doc.setFontSize(9);
      doc.setTextColor(...brandColors.muted);
      const dateStr = new Date().toLocaleDateString("pt-BR", { 
        day: "2-digit", 
        month: "long", 
        year: "numeric" 
      });
      doc.text(dateStr, pageWidth - margin, 47, { align: "right" });
      
      yPos = 70;
    };


    const addFooter = (pageNum: number, totalPages: number) => {
      // Footer bar
      doc.setFillColor(...brandColors.dark);
      doc.rect(0, pageHeight - 20, pageWidth, 20, "F");
      doc.setFillColor(...brandColors.primary);
      doc.rect(0, pageHeight - 20, pageWidth, 1, "F");

      doc.setFontSize(8);
      doc.setTextColor(...brandColors.muted);
      doc.text("La Casa Core • Plataforma de Crescimento para YouTube", margin, pageHeight - 8);
      doc.text(`${pageNum}/${totalPages}`, pageWidth - margin, pageHeight - 8, { align: "right" });
    };

    const addSectionTitle = (title: string) => {
      checkNewPage(30);
      doc.setFillColor(...brandColors.cardBg);
      doc.roundedRect(margin, yPos - 5, pageWidth - margin * 2, 14, 2, 2, "F");
      doc.setFillColor(...brandColors.primary);
      doc.roundedRect(margin, yPos - 5, 4, 14, 1, 1, "F");
      
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...brandColors.primary);
      doc.text(title.toUpperCase(), margin + 10, yPos + 4);
      yPos += 18;
    };

    const addMetricCard = (x: number, y: number, width: number, label: string, value: string, subtitle?: string) => {
      doc.setFillColor(...brandColors.cardBg);
      doc.roundedRect(x, y, width, subtitle ? 32 : 26, 3, 3, "F");
      
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...brandColors.muted);
      doc.text(label, x + 8, y + 10);
      
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...brandColors.white);
      doc.text(value, x + 8, y + 22);
      
      if (subtitle) {
        doc.setFontSize(7);
        doc.setTextColor(...brandColors.muted);
        doc.text(subtitle, x + 8, y + 29);
      }
    };

    const checkNewPage = (neededSpace: number = 40) => {
      if (yPos + neededSpace > pageHeight - 30) {
        doc.addPage();
        yPos = 25;
      }
    };

    // ========== PAGE 1 - OVERVIEW ==========
    addHeader();

    // Channel Info Card
    doc.setFillColor(...brandColors.cardBg);
    doc.roundedRect(margin, yPos, pageWidth - margin * 2, 35, 4, 4, "F");
    
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...brandColors.white);
    doc.text(analyticsData.channel.name, margin + 10, yPos + 15);
    
    doc.setFontSize(9);
    doc.setTextColor(...brandColors.muted);
    doc.text(analyticsData.channel.customUrl || `youtube.com/channel/${analyticsData.channel.id}`, margin + 10, yPos + 24);
    
    const channelAge = Math.round((new Date().getTime() - new Date(analyticsData.channel.publishedAt).getTime()) / (1000 * 60 * 60 * 24 * 30));
    doc.setTextColor(...brandColors.gold);
    doc.text(`${channelAge} meses de canal`, pageWidth - margin - 10, yPos + 15, { align: "right" });
    
    yPos += 45;

    // Main Metrics Grid
    addSectionTitle("METRICAS PRINCIPAIS");
    
    const metricsStartY = yPos;
    const cardWidth = (pageWidth - margin * 2 - 15) / 3;
    
    addMetricCard(margin, metricsStartY, cardWidth, "INSCRITOS", formatNumber(analyticsData.statistics.subscribers));
    addMetricCard(margin + cardWidth + 5, metricsStartY, cardWidth, "VIEWS TOTAIS", formatNumber(analyticsData.statistics.totalViews));
    addMetricCard(margin + (cardWidth + 5) * 2, metricsStartY, cardWidth, "VÍDEOS", formatNumber(analyticsData.statistics.totalVideos));
    
    yPos = metricsStartY + 35;
    
    addMetricCard(margin, yPos, cardWidth, "ENGAJAMENTO", `${analyticsData.recentMetrics.avgEngagementRate}%`, "Taxa média");
    addMetricCard(margin + cardWidth + 5, yPos, cardWidth, "VIEWS/VÍDEO", formatNumber(analyticsData.recentMetrics.avgViewsPerVideo), "Média");
    addMetricCard(margin + (cardWidth + 5) * 2, yPos, cardWidth, "LIKES/VÍDEO", formatNumber(analyticsData.recentMetrics.avgLikesPerVideo), "Média");
    
    yPos += 45;

    // Monetization Section
    addSectionTitle("ESTIMATIVAS DE MONETIZACAO");
    
    const monetY = yPos;
    const monetWidth = (pageWidth - margin * 2 - 10) / 3;
    
    // RPM Card
    doc.setFillColor(...brandColors.cardBg);
    doc.roundedRect(margin, monetY, monetWidth, 38, 3, 3, "F");
    doc.setFontSize(8);
    doc.setTextColor(...brandColors.muted);
    doc.text("RPM ESTIMADO", margin + 8, monetY + 12);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...brandColors.success);
    doc.text(`$${(analyticsData.monetization?.estimatedRPM || 2.5).toFixed(2)}`, margin + 8, monetY + 28);
    
    // Monthly Revenue
    doc.setFillColor(...brandColors.cardBg);
    doc.roundedRect(margin + monetWidth + 5, monetY, monetWidth, 38, 3, 3, "F");
    doc.setFontSize(8);
    doc.setTextColor(...brandColors.muted);
    doc.text("RECEITA MENSAL EST.", margin + monetWidth + 13, monetY + 12);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...brandColors.success);
    doc.text(`$${formatNumber(analyticsData.monetization?.estimatedMonthlyEarnings || 0)}`, margin + monetWidth + 13, monetY + 28);
    
    // Total Revenue
    doc.setFillColor(...brandColors.cardBg);
    doc.roundedRect(margin + (monetWidth + 5) * 2, monetY, monetWidth, 38, 3, 3, "F");
    doc.setFontSize(8);
    doc.setTextColor(...brandColors.muted);
    doc.text("RECEITA TOTAL EST.", margin + (monetWidth + 5) * 2 + 8, monetY + 12);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...brandColors.success);
    doc.text(`$${formatNumber(analyticsData.monetization?.estimatedTotalEarnings || 0)}`, margin + (monetWidth + 5) * 2 + 8, monetY + 28);
    
    yPos = monetY + 50;

    // ========== GOALS SECTION ==========
    addSectionTitle("METAS DE CRESCIMENTO");

    if (channelGoals && channelGoals.length > 0) {
      channelGoals.forEach((goal) => {
        checkNewPage(22);
        const progress = goal.target_value > goal.start_value 
          ? Math.min(100, Math.round(((goal.current_value - goal.start_value) / (goal.target_value - goal.start_value)) * 100))
          : goal.current_value >= goal.target_value ? 100 : 0;
        
        const label = goalTypeLabels[goal.goal_type]?.label || goal.goal_type;
        
        doc.setFillColor(...brandColors.cardBg);
        doc.roundedRect(margin, yPos, pageWidth - margin * 2, 18, 2, 2, "F");
        
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...brandColors.white);
        doc.text(label, margin + 8, yPos + 8);
        
        doc.setFontSize(9);
        doc.setTextColor(...brandColors.muted);
        doc.text(`${formatNumber(goal.current_value)} / ${formatNumber(goal.target_value)}`, margin + 70, yPos + 8);
        
        // Progress bar background
        doc.setFillColor(40, 40, 50);
        doc.roundedRect(margin + 110, yPos + 4, 60, 6, 2, 2, "F");
        
        // Progress bar fill
        const progressColor = progress >= 100 ? brandColors.success : brandColors.primary;
        doc.setFillColor(progressColor[0], progressColor[1], progressColor[2]);
        doc.roundedRect(margin + 110, yPos + 4, Math.max(2, (progress / 100) * 60), 6, 2, 2, "F");
        
        // Percentage
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        const textProgressColor = progress >= 100 ? brandColors.success : brandColors.primary;
        doc.setTextColor(textProgressColor[0], textProgressColor[1], textProgressColor[2]);
        doc.text(`${progress}%`, pageWidth - margin - 8, yPos + 10, { align: "right" });
        
        yPos += 22;
      });
    } else {
      doc.setFillColor(...brandColors.cardBg);
      doc.roundedRect(margin, yPos, pageWidth - margin * 2, 20, 2, 2, "F");
      doc.setFontSize(10);
      doc.setTextColor(...brandColors.muted);
      doc.text("Nenhuma meta ativa definida", margin + 10, yPos + 13);
      yPos += 25;
    }

    // Completed Goals
    if (completedGoals && completedGoals.length > 0) {
      yPos += 5;
      addSectionTitle("CONQUISTAS RECENTES");
      
      completedGoals.slice(0, 3).forEach((goal) => {
        checkNewPage(15);
        const label = goalTypeLabels[goal.goal_type]?.label || goal.goal_type;
        const completedDate = goal.completed_at ? new Date(goal.completed_at).toLocaleDateString("pt-BR") : "";
        
        doc.setFillColor(34, 60, 34); // Dark green
        doc.roundedRect(margin, yPos, pageWidth - margin * 2, 14, 2, 2, "F");
        
        doc.setFontSize(9);
        doc.setTextColor(...brandColors.success);
        doc.text(`[OK] ${label}: ${formatNumber(goal.target_value)} atingido em ${completedDate}`, margin + 8, yPos + 9);
        
        yPos += 18;
      });
    }

    // ========== CHECKLIST SECTION ==========
    yPos += 5;
    addSectionTitle("CHECKLIST DE OTIMIZACAO");

    const totalChecklistItems = 17;
    const completedItems = Object.values(checklistItems).filter(Boolean).length;
    const checklistProgress = Math.round((completedItems / totalChecklistItems) * 100);

    // Progress overview
    doc.setFillColor(...brandColors.cardBg);
    doc.roundedRect(margin, yPos, pageWidth - margin * 2, 30, 3, 3, "F");
    
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...brandColors.white);
    doc.text(`${completedItems} de ${totalChecklistItems} tarefas concluidas`, margin + 10, yPos + 12);
    
    // Large progress bar
    doc.setFillColor(40, 40, 50);
    doc.roundedRect(margin + 10, yPos + 18, pageWidth - margin * 2 - 50, 6, 2, 2, "F");
    const checklistFillColor = checklistProgress >= 100 ? brandColors.success : brandColors.primary;
    doc.setFillColor(checklistFillColor[0], checklistFillColor[1], checklistFillColor[2]);
    doc.roundedRect(margin + 10, yPos + 18, Math.max(2, (checklistProgress / 100) * (pageWidth - margin * 2 - 50)), 6, 2, 2, "F");
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    const checklistTextColor = checklistProgress >= 100 ? brandColors.success : brandColors.primary;
    doc.setTextColor(checklistTextColor[0], checklistTextColor[1], checklistTextColor[2]);
    doc.text(`${checklistProgress}%`, pageWidth - margin - 10, yPos + 23, { align: "right" });
    
    yPos += 38;

    // Categories breakdown
    const categories = [
      { name: "SEO", prefix: "seo_", total: 5 },
      { name: "Engajamento", prefix: "eng_", total: 4 },
      { name: "Conteudo", prefix: "cnt_", total: 4 },
      { name: "Crescimento", prefix: "grw_", total: 4 },
    ];

    const catWidth = (pageWidth - margin * 2 - 15) / 4;
    categories.forEach((cat, idx) => {
      const catCompleted = Object.entries(checklistItems)
        .filter(([key, val]) => key.startsWith(cat.prefix) && val)
        .length;
      const catX = margin + (catWidth + 5) * idx;
      
      doc.setFillColor(...brandColors.cardBg);
      doc.roundedRect(catX, yPos, catWidth, 28, 2, 2, "F");
      
      doc.setFontSize(8);
      doc.setTextColor(...brandColors.muted);
      doc.text(cat.name, catX + 5, yPos + 10);
      
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      const catTextColor = catCompleted === cat.total ? brandColors.success : brandColors.white;
      doc.setTextColor(catTextColor[0], catTextColor[1], catTextColor[2]);
      doc.text(`${catCompleted}/${cat.total}`, catX + 5, yPos + 22);
    });
    
    yPos += 38;

    // ========== TOP VIDEOS ==========
    checkNewPage(80);
    addSectionTitle("TOP VIDEOS DO CANAL");

    analyticsData.topVideos?.slice(0, 5).forEach((video, idx) => {
      checkNewPage(25);
      
      doc.setFillColor(...brandColors.cardBg);
      doc.roundedRect(margin, yPos, pageWidth - margin * 2, 20, 2, 2, "F");
      
      // Rank badge
      doc.setFillColor(...brandColors.primary);
      doc.circle(margin + 12, yPos + 10, 6, "F");
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...brandColors.dark);
      doc.text(`${idx + 1}`, margin + 12, yPos + 13, { align: "center" });
      
      // Video title
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...brandColors.white);
      const truncatedTitle = video.title.length > 45 ? video.title.substring(0, 45) + "..." : video.title;
      doc.text(truncatedTitle, margin + 25, yPos + 9);
      
      // Stats
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...brandColors.muted);
      doc.text(`${formatNumber(video.views)} views • ${formatNumber(video.likes)} likes • ${video.engagementRate} eng.`, margin + 25, yPos + 16);
      
      yPos += 24;
    });

    // ========== INSIGHTS SECTION ==========
    checkNewPage(60);
    yPos += 5;
    addSectionTitle("INSIGHTS E RECOMENDACOES");

    const insights: string[] = [];
    
    if (analyticsData.recentMetrics.avgEngagementRate < 3) {
      insights.push("Taxa de engajamento abaixo da média. Considere adicionar mais CTAs e fazer perguntas nos vídeos.");
    }
    if (analyticsData.recentMetrics.avgViewsPerVideo < analyticsData.statistics.totalViews / analyticsData.statistics.totalVideos * 0.8) {
      insights.push("Views recentes abaixo da média histórica. Revise seus títulos e thumbnails.");
    }
    if (analyticsData.statistics.subscribers < 1000) {
      insights.push("Foco em crescimento de inscritos para atingir a monetização (1.000 mínimo).");
    }
    if (checklistProgress < 50) {
      insights.push("Complete mais tarefas do checklist de otimização para melhorar seu desempenho.");
    }
    if (insights.length === 0) {
      insights.push("Excelente performance! Continue mantendo a consistência e qualidade do conteúdo.");
    }

    insights.forEach((insight, idx) => {
      checkNewPage(18);
      doc.setFillColor(...brandColors.cardBg);
      doc.roundedRect(margin, yPos, pageWidth - margin * 2, 14, 2, 2, "F");
      
      doc.setFillColor(...brandColors.gold);
      doc.circle(margin + 10, yPos + 7, 3, "F");
      
      doc.setFontSize(9);
      doc.setTextColor(...brandColors.white);
      doc.text(insight, margin + 20, yPos + 9);
      
      yPos += 18;
    });

    // ========== ADD FOOTERS TO ALL PAGES ==========
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      addFooter(i, pageCount);
    }

    // Download
    const fileName = `LaCasa_Relatorio_${analyticsData.channel.name.replace(/[^a-z0-9]/gi, "_")}_${new Date().toISOString().split("T")[0]}.pdf`;
    doc.save(fileName);

    toast({
      title: "Relatório La Casa Core gerado!",
      description: "PDF profissional baixado com sucesso",
    });
  };

  type BadgeType = "good" | "warning" | "tip";
  
  const StatCard = ({
    icon: Icon,
    label,
    value,
    subvalue,
    color = "primary",
    tooltip,
    badge,
    badgeType = "tip",
  }: {
    icon: React.ElementType;
    label: string;
    value: string | number;
    subvalue?: string;
    color?: string;
    tooltip?: string;
    badge?: string;
    badgeType?: BadgeType;
  }) => {
    const badgeConfig = {
      good: { icon: CheckCircle2, color: "text-green-500", bg: "bg-green-500/10", border: "border-green-500/20" },
      warning: { icon: AlertTriangle, color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/20" },
      tip: { icon: Lightbulb, color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20" },
    };
    const config = badgeConfig[badgeType];
    const BadgeIcon = config.icon;

    return (
      <Card className="p-5 relative overflow-hidden">
        <div className="flex items-center gap-3 mb-3">
          <div className={`w-10 h-10 rounded-lg bg-${color}/10 flex items-center justify-center`}>
            <Icon className={`w-5 h-5 text-${color}`} />
          </div>
          <span className="text-muted-foreground text-sm flex items-center gap-1">
            {label}
            {tooltip && (
              <TooltipProvider>
                <UITooltip>
                  <TooltipTrigger asChild>
                    <Info className="w-3 h-3 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs text-xs">{tooltip}</p>
                  </TooltipContent>
                </UITooltip>
              </TooltipProvider>
            )}
          </span>
        </div>
        <p className="text-3xl font-bold text-foreground">{value}</p>
        {subvalue && <p className="text-sm text-muted-foreground mt-1">{subvalue}</p>}
        
        {badge && (
          <div className={`mt-3 flex items-center gap-2 p-2 rounded-lg ${config.bg} border ${config.border}`}>
            <BadgeIcon className={`w-4 h-4 ${config.color} flex-shrink-0`} />
            <span className="text-xs text-muted-foreground">{badge}</span>
          </div>
        )}
      </Card>
    );
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium text-foreground">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {formatNumber(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const hasApiKey = !!apiSettings?.youtube_api_key;

  return (
    <MainLayout>
      <div className="flex-1 overflow-auto p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Analytics do YouTube</h1>
            <p className="text-muted-foreground">
              Estatísticas e métricas do seu canal do YouTube
            </p>
          </div>

          {/* API Key Warning */}
          {!hasApiKey && (
            <Alert className="mb-6 border-warning bg-warning/10">
              <AlertCircle className="h-4 w-4 text-warning" />
              <AlertDescription className="flex items-center justify-between">
                <span>Configure sua chave de API do YouTube para acessar as estatísticas.</span>
                <Button asChild variant="outline" size="sm">
                  <Link to="/settings">
                    <Settings className="w-4 h-4 mr-2" />
                    Configurações
                  </Link>
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Saved Channels */}
          {savedChannels && savedChannels.length > 0 && (
            <Card className="p-6 mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <Star className="w-5 h-5 text-amber-500" />
                  Canais Fixados ({savedChannels.length}/5)
                </h2>
                <span className="text-xs text-muted-foreground">Arraste para reordenar</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {savedChannels.map((channel) => (
                  <div
                    key={channel.id}
                    draggable
                    onDragStart={() => handleDragStart(channel.id)}
                    onDragOver={handleDragOver}
                    onDrop={() => handleDrop(channel.id)}
                    onDragEnd={handleDragEnd}
                    className={`relative p-3 rounded-lg border cursor-grab active:cursor-grabbing transition-all hover:border-primary ${
                      channelUrl === channel.channel_url ? 'border-primary bg-primary/5' : 'border-border bg-secondary/30'
                    } ${draggedChannel === channel.id ? 'opacity-50 scale-95' : ''}`}
                    onClick={() => loadSavedChannel(channel)}
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive/10 hover:bg-destructive/20 text-destructive z-10"
                      onClick={(e) => {
                        e.stopPropagation();
                        unsaveChannel(channel.channel_url);
                      }}
                    >
                      <PinOff className="w-3 h-3" />
                    </Button>
                    <div className="absolute top-1 left-1 opacity-40 hover:opacity-100 transition-opacity">
                      <GripVertical className="w-3 h-3 text-muted-foreground" />
                    </div>
                    <div className="flex items-center gap-2 pl-3">
                      {channel.channel_thumbnail && (
                        <img
                          src={channel.channel_thumbnail}
                          alt={channel.channel_name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-foreground text-sm truncate">
                          {channel.channel_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatNumber(channel.subscribers || 0)} inscritos
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Channel Input */}
          <Card className="p-6 mb-8">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Youtube className="w-5 h-5 text-red-500" />
              Selecione o Canal
            </h2>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="https://www.youtube.com/@seucanal"
                  value={channelUrl}
                  onChange={(e) => setChannelUrl(e.target.value)}
                  className="bg-secondary border-border"
                />
              </div>
              {monitoredChannels && monitoredChannels.length > 0 && (
                <Select onValueChange={(value) => setChannelUrl(value)}>
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue placeholder="Canais monitorados" />
                  </SelectTrigger>
                  <SelectContent>
                    {monitoredChannels.map((channel) => (
                      <SelectItem key={channel.id} value={channel.channel_url}>
                        {channel.channel_name || "Canal"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <Button
                onClick={fetchAnalytics}
                disabled={isAnalyzing || !hasApiKey}
                className="flex items-center gap-2"
              >
                {isAnalyzing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                Buscar Analytics
              </Button>
            </div>
          </Card>

          {/* Analytics Content */}
          {analyticsData ? (
            <>
              {/* Channel Header */}
              <Card className="p-6 mb-8">
                <div className="flex items-start gap-4">
                  {analyticsData.channel.thumbnail && (
                    <img
                      src={analyticsData.channel.thumbnail}
                      alt={analyticsData.channel.name}
                      className="w-20 h-20 rounded-full object-cover"
                    />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h2 className="text-2xl font-bold text-foreground">
                        {analyticsData.channel.name}
                      </h2>
                      <a
                        href={`https://www.youtube.com/${analyticsData.channel.customUrl || `channel/${analyticsData.channel.id}`}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline flex items-center gap-1"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                      {/* Monetization Status Badge */}
                      {(() => {
                        const subs = analyticsData.statistics.subscribers;
                        const totalVideos = analyticsData.statistics.totalVideos;
                        // YouTube Partner Program: 1000 subs + 4000 watch hours (we estimate based on views)
                        // Estimate: avg view = 4 min watch = 0.067 hours. 4000h = ~60k views minimum
                        const estimatedWatchHours = Math.round((analyticsData.statistics.totalViews * 4) / 60);
                        const subsOk = subs >= 1000;
                        const hoursOk = estimatedWatchHours >= 4000;
                        const isMonetized = subsOk && hoursOk;

                        if (isMonetized) {
                          return (
                            <Badge className="bg-green-500/20 text-green-500 border-green-500/30 flex items-center gap-1">
                              <DollarSign className="w-3 h-3" />
                              Monetizado
                            </Badge>
                          );
                        }

                        const missing: string[] = [];
                        if (!subsOk) missing.push(`${formatNumber(1000 - subs)} inscritos`);
                        if (!hoursOk) missing.push(`~${formatNumber(4000 - estimatedWatchHours)}h de exibição`);

                        return (
                          <TooltipProvider>
                            <UITooltip>
                              <TooltipTrigger asChild>
                                <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/30 flex items-center gap-1 cursor-help">
                                  <AlertCircle className="w-3 h-3" />
                                  Não Monetizado
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent side="bottom" className="max-w-xs">
                                <p className="font-medium mb-1">Falta para monetizar:</p>
                                <ul className="text-xs space-y-1">
                                  {!subsOk && (
                                    <li className="flex items-center gap-1">
                                      <Users className="w-3 h-3" /> {formatNumber(1000 - subs)} inscritos (atual: {formatNumber(subs)}/1.000)
                                    </li>
                                  )}
                                  {!hoursOk && (
                                    <li className="flex items-center gap-1">
                                      <Clock className="w-3 h-3" /> ~{formatNumber(4000 - estimatedWatchHours)}h de exibição (estimado: {formatNumber(estimatedWatchHours)}/4.000h)
                                    </li>
                                  )}
                                </ul>
                                <p className="text-[10px] text-muted-foreground mt-2">*Horas estimadas com base em views × 4min média</p>
                              </TooltipContent>
                            </UITooltip>
                          </TooltipProvider>
                        );
                      })()}
                    </div>
                    {analyticsData.channel.customUrl && (
                      <p className="text-muted-foreground text-sm mb-2">
                        {analyticsData.channel.customUrl}
                      </p>
                    )}
                    <p className="text-muted-foreground text-sm line-clamp-2">
                      {analyticsData.channel.description || "Sem descrição"}
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      onClick={fetchAnalytics}
                      variant="outline"
                      size="sm"
                      disabled={isAnalyzing}
                      className="flex items-center gap-2"
                    >
                      {isAnalyzing ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4" />
                      )}
                      Recarregar
                    </Button>
                    <Button
                      onClick={isChannelSaved ? () => unsaveChannel(channelUrl) : saveChannel}
                      variant={isChannelSaved ? "secondary" : "default"}
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      {isChannelSaved ? (
                        <>
                          <PinOff className="w-4 h-4" />
                          Desfixar
                        </>
                      ) : (
                        <>
                          <Pin className="w-4 h-4" />
                          Fixar ({savedChannels?.length || 0}/5)
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={exportToCSV}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      CSV
                    </Button>
                    <Button
                      onClick={exportWeeklyPDF}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <FileText className="w-4 h-4" />
                      Relatório PDF
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Monetization Progress Card */}
              {(() => {
                const subs = analyticsData.statistics.subscribers;
                const totalViews = analyticsData.statistics.totalViews;
                // Estimate watch hours: avg view = 4 min = 0.067 hours
                const estimatedWatchHours = Math.round((totalViews * 4) / 60);
                const subsTarget = 1000;
                const hoursTarget = 4000;
                const subsProgress = Math.min(100, Math.round((subs / subsTarget) * 100));
                const hoursProgress = Math.min(100, Math.round((estimatedWatchHours / hoursTarget) * 100));
                const isMonetized = subs >= subsTarget && estimatedWatchHours >= hoursTarget;

                // Calculate growth rates based on channel age and trends
                const channelCreatedAt = new Date(analyticsData.channel.publishedAt);
                const now = new Date();
                const channelAgeMonths = Math.max(1, Math.round((now.getTime() - channelCreatedAt.getTime()) / (1000 * 60 * 60 * 24 * 30)));
                
                // Calculate monthly averages
                const avgSubsPerMonth = Math.round(subs / channelAgeMonths);
                const avgViewsPerMonth = Math.round(totalViews / channelAgeMonths);
                const avgWatchHoursPerMonth = Math.round((avgViewsPerMonth * 4) / 60);

                // Calculate months to reach targets
                const subsRemaining = Math.max(0, subsTarget - subs);
                const hoursRemaining = Math.max(0, hoursTarget - estimatedWatchHours);
                
                const monthsToSubsTarget = avgSubsPerMonth > 0 ? Math.ceil(subsRemaining / avgSubsPerMonth) : null;
                const monthsToHoursTarget = avgWatchHoursPerMonth > 0 ? Math.ceil(hoursRemaining / avgWatchHoursPerMonth) : null;
                
                // Determine limiting factor
                const monthsToMonetization = !isMonetized && monthsToSubsTarget !== null && monthsToHoursTarget !== null
                  ? Math.max(monthsToSubsTarget, monthsToHoursTarget)
                  : null;

                // Generate projection data for chart (next 12 months)
                const projectionData = [];
                for (let i = 0; i <= 12; i++) {
                  const projectedSubs = Math.min(subsTarget * 1.2, subs + (avgSubsPerMonth * i));
                  const projectedHours = Math.min(hoursTarget * 1.2, estimatedWatchHours + (avgWatchHoursPerMonth * i));
                  const monthDate = new Date(now);
                  monthDate.setMonth(monthDate.getMonth() + i);
                  projectionData.push({
                    month: monthDate.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }),
                    inscritos: Math.round(projectedSubs),
                    horas: Math.round(projectedHours),
                    metaSubs: subsTarget,
                    metaHoras: hoursTarget,
                  });
                }

                return (
                  <Card className="p-6 mb-8">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-foreground flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-primary" />
                        Progresso para Monetização
                      </h3>
                      {isMonetized ? (
                        <Badge className="bg-green-500/20 text-green-500 border-green-500/30 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Elegível para YPP
                        </Badge>
                      ) : (
                        <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/30 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          Ainda não elegível
                        </Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Subscribers Progress */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                              <Users className="w-5 h-5 text-blue-500" />
                            </div>
                            <div>
                              <p className="font-medium text-foreground">Inscritos</p>
                              <p className="text-xs text-muted-foreground">Mínimo: 1.000</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-foreground">{formatNumber(subs)}</p>
                            <p className="text-xs text-muted-foreground">{subsProgress}%</p>
                          </div>
                        </div>
                        <Progress 
                          value={subsProgress} 
                          className="h-3" 
                        />
                        {subs < subsTarget && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            Faltam <span className="font-medium text-foreground">{formatNumber(subsTarget - subs)}</span> inscritos
                          </p>
                        )}
                        {subs >= subsTarget && (
                          <p className="text-xs text-green-500 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Meta atingida!
                          </p>
                        )}
                      </div>

                      {/* Watch Hours Progress */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                              <Clock className="w-5 h-5 text-purple-500" />
                            </div>
                            <div>
                              <p className="font-medium text-foreground">Horas de Exibição</p>
                              <p className="text-xs text-muted-foreground">Mínimo: 4.000h (12 meses)</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-foreground">{formatNumber(estimatedWatchHours)}h</p>
                            <p className="text-xs text-muted-foreground">{hoursProgress}%</p>
                          </div>
                        </div>
                        <Progress 
                          value={hoursProgress} 
                          className="h-3" 
                        />
                        {estimatedWatchHours < hoursTarget && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            Faltam <span className="font-medium text-foreground">~{formatNumber(hoursTarget - estimatedWatchHours)}h</span> de exibição
                          </p>
                        )}
                        {estimatedWatchHours >= hoursTarget && (
                          <p className="text-xs text-green-500 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Meta atingida!
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Projection Summary */}
                    {!isMonetized && (
                      <div className="mt-6 p-4 rounded-lg bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                            <Calendar className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">Projeção de Monetização</p>
                            <p className="text-xs text-muted-foreground">Baseado no crescimento médio do canal</p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          <div className="text-center p-3 rounded-lg bg-background/50">
                            <p className="text-2xl font-bold text-primary">
                              {monthsToMonetization !== null ? (
                                monthsToMonetization <= 0 ? "🎉" : `~${monthsToMonetization}`
                              ) : "?"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {monthsToMonetization !== null && monthsToMonetization > 0 
                                ? monthsToMonetization === 1 ? "mês restante" : "meses restantes"
                                : "meses"}
                            </p>
                          </div>
                          <div className="text-center p-3 rounded-lg bg-background/50">
                            <p className="text-lg font-bold text-blue-500">+{formatNumber(avgSubsPerMonth)}</p>
                            <p className="text-xs text-muted-foreground">inscritos/mês</p>
                          </div>
                          <div className="text-center p-3 rounded-lg bg-background/50">
                            <p className="text-lg font-bold text-purple-500">+{formatNumber(avgWatchHoursPerMonth)}h</p>
                            <p className="text-xs text-muted-foreground">horas/mês</p>
                          </div>
                          <div className="text-center p-3 rounded-lg bg-background/50">
                            <p className="text-lg font-bold text-foreground">{channelAgeMonths}</p>
                            <p className="text-xs text-muted-foreground">meses de canal</p>
                          </div>
                        </div>

                        {/* Projection Chart */}
                        <div className="mt-4">
                          <p className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                            <BarChart3 className="w-4 h-4" />
                            Projeção dos Próximos 12 Meses
                          </p>
                          <Tabs defaultValue="inscritos" className="w-full">
                            <TabsList className="mb-3">
                              <TabsTrigger value="inscritos" className="text-xs">Inscritos</TabsTrigger>
                              <TabsTrigger value="horas" className="text-xs">Horas de Exibição</TabsTrigger>
                            </TabsList>
                            
                            <TabsContent value="inscritos">
                              <div className="h-48">
                                <ResponsiveContainer width="100%" height="100%">
                                  <AreaChart data={projectionData}>
                                    <defs>
                                      <linearGradient id="colorSubs" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                                      </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} />
                                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} tickFormatter={(v) => formatNumber(v)} />
                                    <Tooltip 
                                      contentStyle={{ 
                                        backgroundColor: "hsl(var(--background))", 
                                        border: "1px solid hsl(var(--border))",
                                        borderRadius: "8px",
                                        fontSize: "12px"
                                      }}
                                      formatter={(value: number) => [formatNumber(value), "Inscritos"]}
                                    />
                                    <Area 
                                      type="monotone" 
                                      dataKey="metaSubs" 
                                      stroke="hsl(142 76% 36%)" 
                                      strokeDasharray="5 5"
                                      fill="none"
                                      strokeWidth={2}
                                      name="Meta (1.000)"
                                    />
                                    <Area 
                                      type="monotone" 
                                      dataKey="inscritos" 
                                      stroke="hsl(var(--primary))" 
                                      fill="url(#colorSubs)"
                                      strokeWidth={2}
                                      name="Projeção"
                                    />
                                  </AreaChart>
                                </ResponsiveContainer>
                              </div>
                            </TabsContent>
                            
                            <TabsContent value="horas">
                              <div className="h-48">
                                <ResponsiveContainer width="100%" height="100%">
                                  <AreaChart data={projectionData}>
                                    <defs>
                                      <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="hsl(270 60% 50%)" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="hsl(270 60% 50%)" stopOpacity={0} />
                                      </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} />
                                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} tickFormatter={(v) => formatNumber(v)} />
                                    <Tooltip 
                                      contentStyle={{ 
                                        backgroundColor: "hsl(var(--background))", 
                                        border: "1px solid hsl(var(--border))",
                                        borderRadius: "8px",
                                        fontSize: "12px"
                                      }}
                                      formatter={(value: number) => [`${formatNumber(value)}h`, "Horas"]}
                                    />
                                    <Area 
                                      type="monotone" 
                                      dataKey="metaHoras" 
                                      stroke="hsl(142 76% 36%)" 
                                      strokeDasharray="5 5"
                                      fill="none"
                                      strokeWidth={2}
                                      name="Meta (4.000h)"
                                    />
                                    <Area 
                                      type="monotone" 
                                      dataKey="horas" 
                                      stroke="hsl(270 60% 50%)" 
                                      fill="url(#colorHours)"
                                      strokeWidth={2}
                                      name="Projeção"
                                    />
                                  </AreaChart>
                                </ResponsiveContainer>
                              </div>
                            </TabsContent>
                          </Tabs>
                        </div>
                      </div>
                    )}

                    {/* Personalized Growth Tips */}
                    {!isMonetized && (
                      <div className="mt-6 p-4 rounded-lg bg-gradient-to-r from-amber-500/5 to-amber-500/10 border border-amber-500/20">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                            <Lightbulb className="w-5 h-5 text-amber-500" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">Dicas Personalizadas de Crescimento</p>
                            <p className="text-xs text-muted-foreground">Baseado nas métricas do seu canal</p>
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          {(() => {
                            const tips: { icon: React.ElementType; title: string; description: string; priority: "high" | "medium" | "low" }[] = [];
                            const engagementRate = analyticsData.recentMetrics.avgEngagementRate;
                            const avgViews = analyticsData.recentMetrics.avgViewsPerVideo;
                            const totalVideos = analyticsData.statistics.totalVideos;
                            const videosPerMonth = totalVideos / Math.max(1, channelAgeMonths);
                            const subsToViewRatio = subs > 0 ? (analyticsData.statistics.totalViews / subs) : 0;

                            // Tip 1: Low engagement
                            if (engagementRate < 3) {
                              tips.push({
                                icon: ThumbsUp,
                                title: "Aumente o engajamento",
                                description: `Seu engajamento está em ${engagementRate.toFixed(1)}%. Peça curtidas e comentários nos primeiros 30 segundos do vídeo. Use perguntas para gerar discussão.`,
                                priority: "high"
                              });
                            }

                            // Tip 2: Low video frequency
                            if (videosPerMonth < 2) {
                              tips.push({
                                icon: Video,
                                title: "Publique com mais frequência",
                                description: `Você publica ${videosPerMonth.toFixed(1)} vídeos/mês. O algoritmo favorece canais consistentes. Tente publicar pelo menos 1 vídeo por semana.`,
                                priority: "high"
                              });
                            }

                            // Tip 3: Low views per video
                            if (avgViews < 500) {
                              tips.push({
                                icon: Eye,
                                title: "Melhore a descoberta",
                                description: `Média de ${formatNumber(avgViews)} views/vídeo. Otimize títulos com palavras-chave, crie thumbnails chamativas e use hashtags relevantes.`,
                                priority: "medium"
                              });
                            }

                            // Tip 4: Low subscriber conversion
                            if (subsToViewRatio > 100 && subs < 1000) {
                              tips.push({
                                icon: Users,
                                title: "Converta mais inscritos",
                                description: `Você tem muitas views mas poucos inscritos. Adicione CTAs claros pedindo inscrição e crie conteúdo em série para fidelizar.`,
                                priority: "medium"
                              });
                            }

                            // Tip 5: Shorts opportunity
                            if (avgViews < 1000 && subs < 500) {
                              tips.push({
                                icon: Flame,
                                title: "Experimente Shorts",
                                description: "Shorts podem viralizar rapidamente e trazer muitos inscritos novos. São ótimos para canais em crescimento inicial.",
                                priority: "medium"
                              });
                            }

                            // Tip 6: Channel age vs growth
                            if (channelAgeMonths > 6 && avgSubsPerMonth < 50) {
                              tips.push({
                                icon: TrendingUp,
                                title: "Analise o que funciona",
                                description: "Revise seus top vídeos e identifique padrões. Crie mais conteúdo similar ao que já performou bem.",
                                priority: "low"
                              });
                            }

                            // Tip 7: Collaboration
                            if (subs < 500) {
                              tips.push({
                                icon: Users,
                                title: "Colabore com outros canais",
                                description: "Parcerias com canais do seu nicho podem expor seu conteúdo a novas audiências interessadas.",
                                priority: "low"
                              });
                            }

                            // Default tip if no issues found
                            if (tips.length === 0) {
                              tips.push({
                                icon: CheckCircle2,
                                title: "Continue assim!",
                                description: "Suas métricas estão saudáveis. Mantenha a consistência e foque em qualidade.",
                                priority: "low"
                              });
                            }

                            // Sort by priority and take top 4
                            const priorityOrder = { high: 0, medium: 1, low: 2 };
                            const sortedTips = tips.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]).slice(0, 4);

                            return sortedTips.map((tip, index) => (
                              <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-background/50 border border-border/50">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                  tip.priority === "high" ? "bg-red-500/10" : 
                                  tip.priority === "medium" ? "bg-amber-500/10" : "bg-green-500/10"
                                }`}>
                                  <tip.icon className={`w-4 h-4 ${
                                    tip.priority === "high" ? "text-red-500" : 
                                    tip.priority === "medium" ? "text-amber-500" : "text-green-500"
                                  }`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <p className="font-medium text-sm text-foreground">{tip.title}</p>
                                    {tip.priority === "high" && (
                                      <Badge className="text-[10px] py-0 px-1 bg-red-500/20 text-red-500 border-red-500/30">Prioritário</Badge>
                                    )}
                                  </div>
                                  <p className="text-xs text-muted-foreground">{tip.description}</p>
                                </div>
                              </div>
                            ));
                          })()}
                        </div>
                      </div>
                    )}

                    {/* Info disclaimer */}
                    <div className="mt-4 p-3 rounded-lg bg-secondary/50 border border-border">
                      <p className="text-xs text-muted-foreground flex items-start gap-2">
                        <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span>
                          As horas de exibição são <strong>estimadas</strong> com base em views × 4 min de média. 
                          Para dados reais, consulte o <a href="https://studio.youtube.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">YouTube Studio</a>.
                          O YouTube também aceita 10M de views em Shorts nos últimos 90 dias como alternativa.
                        </span>
                      </p>
                    </div>
                  </Card>
                );
              })()}

              {/* Optimization Checklist - Personalizado */}
              <Card className="p-6 mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                    Checklist de Otimização
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {Object.values(checklistItems).filter(Boolean).length} de 17 concluídas
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setChecklistItems({})}
                      className="text-xs h-7"
                    >
                      <RefreshCw className="w-3 h-3 mr-1" />
                      Resetar
                    </Button>
                  </div>
                </div>

                {(() => {
                  // Generate personalized tips based on channel data
                  const channelName = analyticsData.channel.name;
                  const channelDescription = analyticsData.channel.description || "";
                  const topVideoTitles = analyticsData.topVideos?.slice(0, 5).map(v => v.title) || [];
                  const avgEngagement = analyticsData.recentMetrics.avgEngagementRate;
                  const avgViews = analyticsData.recentMetrics.avgViewsPerVideo;
                  const subs = analyticsData.statistics.subscribers;
                  const totalVideos = analyticsData.statistics.totalVideos;
                  
                  // Extract keywords from top videos and channel
                  const extractKeywords = (texts: string[]): string[] => {
                    const stopWords = new Set(['de', 'da', 'do', 'e', 'a', 'o', 'os', 'as', 'um', 'uma', 'para', 'com', 'em', 'que', 'por', 'mais', 'como', 'the', 'and', 'to', 'of', 'in', 'is', 'for', 'on', 'it', 'with', 'this', 'you', 'are', 'be', 'at', 'or', 'an', 'from', 'was', 'have', 'has', 'not', 'but']);
                    const allWords = texts.join(' ').toLowerCase()
                      .replace(/[^\w\sáàãâéêíóôõúç]/g, '')
                      .split(/\s+/)
                      .filter(w => w.length > 3 && !stopWords.has(w));
                    
                    const wordCount: Record<string, number> = {};
                    allWords.forEach(word => {
                      wordCount[word] = (wordCount[word] || 0) + 1;
                    });
                    
                    return Object.entries(wordCount)
                      .sort((a, b) => b[1] - a[1])
                      .slice(0, 10)
                      .map(([word]) => word);
                  };

                  const keywords = extractKeywords([channelName, channelDescription, ...topVideoTitles]);
                  
                  // Generate suggested tags
                  const suggestedTags = keywords.slice(0, 8).map(k => `#${k}`);
                  
                  // Generate suggested hashtags for description
                  const suggestedHashtags = keywords.slice(0, 5).map(k => `#${k.charAt(0).toUpperCase() + k.slice(1)}`);
                  
                  // Analyze top performing content patterns
                  const topVideoPatterns = topVideoTitles.length > 0 
                    ? topVideoTitles.slice(0, 3).map((t, i) => `"${t.slice(0, 40)}${t.length > 40 ? '...' : ''}"`)
                    : [];

                  // Generate title keyword suggestions
                  const titleKeywords = keywords.slice(0, 5).join(', ');
                  
                  // Calculate ideal posting frequency
                  const idealFrequency = subs < 1000 ? '2-3 vídeos/semana' : 
                                         subs < 10000 ? '1-2 vídeos/semana' : 
                                         '3-4 vídeos/semana';

                  // SEO Tasks with personalized suggestions
                  const seoTasks = [
                    { 
                      id: "seo_1", 
                      label: "Usar palavras-chave no título", 
                      desc: `Palavras-chave sugeridas para seu nicho: ${titleKeywords}`,
                      expanded: `Baseado nos seus vídeos de sucesso, use termos como: ${keywords.slice(0, 6).join(', ')}. Posicione a palavra-chave principal no início do título.`
                    },
                    { 
                      id: "seo_2", 
                      label: "Otimizar descrição dos vídeos", 
                      desc: `Modelo: [Resumo 2 linhas] + [Links] + [Timestamps] + [Tags]`,
                      expanded: `Comece com: "${channelName} apresenta..." seguido de resumo do vídeo. Inclua links para redes sociais e timestamps para vídeos longos.`
                    },
                    { 
                      id: "seo_3", 
                      label: "Adicionar tags relevantes", 
                      desc: `Tags sugeridas: ${suggestedTags.slice(0, 5).join(' ')}`,
                      expanded: `Use estas tags baseadas no seu conteúdo:\n${suggestedTags.join('\n')}\n\nAdicione também variações e sinônimos.`
                    },
                    { 
                      id: "seo_4", 
                      label: "Criar thumbnails chamativas", 
                      desc: avgViews < 1000 
                        ? "Prioridade ALTA: Suas views sugerem que thumbnails precisam melhorar"
                        : "Use rostos com emoção, texto grande e cores vibrantes",
                      expanded: `Dicas personalizadas:\n• Rostos com expressões fortes (surpresa, alegria)\n• Texto máximo 3-4 palavras grandes\n• Cores que contrastem: amarelo/preto, vermelho/branco\n• Evite thumbnails similares aos seus vídeos anteriores`
                    },
                    { 
                      id: "seo_5", 
                      label: "Usar hashtags estrategicamente", 
                      desc: `Hashtags sugeridas: ${suggestedHashtags.slice(0, 3).join(' ')}`,
                      expanded: `Coloque no final da descrição:\n${suggestedHashtags.join(' ')}\n\nLimite-se a 3-5 hashtags por vídeo para melhor alcance.`
                    },
                  ];

                  // Engagement Tasks with personalized suggestions
                  const engagementTasks = [
                    { 
                      id: "eng_1", 
                      label: "Pedir curtidas nos primeiros 30s", 
                      desc: avgEngagement < 3 
                        ? `URGENTE: Seu engajamento de ${avgEngagement.toFixed(1)}% está baixo`
                        : `Seu engajamento de ${avgEngagement.toFixed(1)}% pode melhorar com CTAs`,
                      expanded: `Frases que funcionam:\n• "Se você está gostando, deixa o like!"\n• "Curta se você também [situação relacionada]"\n• Faça isso antes da marca de 30 segundos`
                    },
                    { 
                      id: "eng_2", 
                      label: "Fazer perguntas para gerar comentários", 
                      desc: `Perguntas sugeridas: "Qual sua experiência com [${keywords[0] || 'tema'}]?"`,
                      expanded: `Exemplos personalizados:\n• "Vocês preferem [opção A] ou [opção B]?"\n• "Deixa nos comentários qual ${keywords[0] || 'assunto'} vocês querem ver"\n• "Me conta sua história com ${keywords[1] || 'isso'}"`
                    },
                    { 
                      id: "eng_3", 
                      label: "Responder comentários frequentemente", 
                      desc: subs < 1000 
                        ? "CRÍTICO para crescimento: Responda TODOS os comentários"
                        : "Responda pelo menos nas primeiras 2 horas",
                      expanded: `Estratégia de resposta:\n• Primeiras 2h: Responda todos\n• Faça perguntas nas respostas para continuar conversa\n• Fixe o melhor comentário\n• Use emojis para parecer mais amigável`
                    },
                    { 
                      id: "eng_4", 
                      label: "Usar cards e telas finais", 
                      desc: `Promova seu vídeo mais popular: ${topVideoTitles[0]?.slice(0, 30) || 'Top vídeo'}...`,
                      expanded: `Configure:\n• Card aos 50% do vídeo promovendo vídeo relacionado\n• Tela final com inscrição + 2 vídeos sugeridos\n• Link para playlist do canal`
                    },
                  ];

                  // Content Tasks with personalized suggestions
                  const contentTasks = [
                    { 
                      id: "cnt_1", 
                      label: "Gancho forte nos primeiros 5s", 
                      desc: `Exemplo: "Você sabia que ${keywords[0] || 'isso'} pode [benefício]?"`,
                      expanded: `Modelos de gancho para seu nicho:\n• "Vocês pediram e eu trouxe..."\n• "Isso mudou minha forma de ver ${keywords[0] || 'o assunto'}"\n• "3 erros que você está cometendo com ${keywords[1] || 'isso'}"\n• Mostre o resultado final primeiro`
                    },
                    { 
                      id: "cnt_2", 
                      label: "Manter vídeos concisos", 
                      desc: subs < 5000 
                        ? "Foque em vídeos de 5-10 min para reter audiência nova"
                        : "Vídeos de 10-20 min funcionam bem para audiências engajadas",
                      expanded: `Para seu tamanho de canal:\n• Corte pausas e "uhms"\n• Use jump cuts para manter ritmo\n• Cada minuto deve ter valor claro\n• Analise retenção no YouTube Studio`
                    },
                    { 
                      id: "cnt_3", 
                      label: "Criar séries de conteúdo", 
                      desc: `Sugiro série sobre: ${keywords[0] || 'seu principal tema'} - Partes 1, 2, 3...`,
                      expanded: `Ideias de séries baseadas no seu conteúdo:\n• "${keywords[0]?.toUpperCase() || 'TEMA'} - Parte [N]"\n• "Guia Completo de ${keywords[1] || 'assunto'}"\n• "Top 10 ${keywords[2] || 'coisas'} que você precisa saber"\nSéries aumentam tempo de sessão!`
                    },
                    { 
                      id: "cnt_4", 
                      label: "Publicar Shorts regularmente", 
                      desc: subs < 1000 
                        ? "ALTA PRIORIDADE: Shorts podem explodir seu crescimento"
                        : "Shorts complementam seu conteúdo principal",
                      expanded: `Estratégia de Shorts:\n• Recorte momentos virais dos seus vídeos longos\n• Trending topics do seu nicho\n• Dicas rápidas de 30-60 segundos\n• Publique 3-5 Shorts/semana`
                    },
                  ];

                  // Growth Tasks with personalized suggestions
                  const growthTasks = [
                    { 
                      id: "grw_1", 
                      label: "Publicar consistentemente", 
                      desc: `Meta recomendada: ${idealFrequency}`,
                      expanded: `Cronograma sugerido para ${formatNumber(subs)} inscritos:\n• ${idealFrequency}\n• Mesmos dias/horários toda semana\n• Use agendamento do YouTube Studio\n• Anuncie nos Community Posts`
                    },
                    { 
                      id: "grw_2", 
                      label: "Analisar Analytics semanalmente", 
                      desc: `Foque em: CTR (meta >5%), Retenção (meta >40%), e origem do tráfego`,
                      expanded: `Métricas prioritárias:\n• CTR atual: verifique se está acima de 5%\n• Retenção média: busque manter >40%\n• Identifique vídeos com picos e replique\n• Analise de onde vem seu tráfego`
                    },
                    { 
                      id: "grw_3", 
                      label: "Colaborar com outros criadores", 
                      desc: `Busque canais de ${formatNumber(Math.round(subs * 0.5))} a ${formatNumber(subs * 2)} inscritos`,
                      expanded: `Estratégia de colaboração:\n• Canais similares em tamanho (50%-200% do seu)\n• Nichos complementares\n• Proposta: "Posso trazer valor para sua audiência com [seu expertise]"\n• Comece com comentários e interações genuínas`
                    },
                    { 
                      id: "grw_4", 
                      label: "Promover em outras redes", 
                      desc: `Crie presença no Instagram, TikTok e Twitter sobre ${keywords[0] || 'seu nicho'}`,
                      expanded: `Cross-posting estratégico:\n• TikTok/Reels: Seus Shorts editados\n• Twitter/X: Discussões sobre ${keywords[0] || 'seu tema'}\n• Instagram: Bastidores e Stories\n• Sempre leve audiência de volta ao YouTube`
                    },
                  ];

                  const allTasks = [...seoTasks, ...engagementTasks, ...contentTasks, ...growthTasks];
                  const totalTasks = allTasks.length;
                  const completedCount = Object.values(checklistItems).filter(Boolean).length;

                  return (
                    <>
                      <Tabs defaultValue="seo" className="w-full">
                        <TabsList className="mb-4 flex-wrap h-auto gap-1">
                          <TabsTrigger value="seo" className="text-xs">
                            🔍 SEO & Descoberta
                          </TabsTrigger>
                          <TabsTrigger value="engagement" className="text-xs">
                            💬 Engajamento
                          </TabsTrigger>
                          <TabsTrigger value="content" className="text-xs">
                            🎬 Conteúdo
                          </TabsTrigger>
                          <TabsTrigger value="growth" className="text-xs">
                            📈 Crescimento
                          </TabsTrigger>
                        </TabsList>

                        {/* SEO & Discovery */}
                        <TabsContent value="seo" className="space-y-2">
                          {seoTasks.map((item) => (
                            <div key={item.id} className="group">
                              <label
                                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                                  checklistItems[item.id] 
                                    ? "bg-green-500/10 border-green-500/30" 
                                    : "bg-secondary/50 border-border hover:bg-secondary"
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={checklistItems[item.id] || false}
                                  onChange={(e) => setChecklistItems(prev => ({ ...prev, [item.id]: e.target.checked }))}
                                  className="mt-1 w-4 h-4 rounded border-border accent-green-500"
                                />
                                <div className="flex-1">
                                  <p className={`text-sm font-medium ${checklistItems[item.id] ? "text-green-500 line-through" : "text-foreground"}`}>
                                    {item.label}
                                  </p>
                                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                                  {item.expanded && (
                                    <div className="mt-2 p-2 rounded bg-background/50 border border-border/50 text-xs text-muted-foreground whitespace-pre-line hidden group-hover:block">
                                      {item.expanded}
                                    </div>
                                  )}
                                </div>
                              </label>
                            </div>
                          ))}
                        </TabsContent>

                        {/* Engagement */}
                        <TabsContent value="engagement" className="space-y-2">
                          {engagementTasks.map((item) => (
                            <div key={item.id} className="group">
                              <label
                                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                                  checklistItems[item.id] 
                                    ? "bg-green-500/10 border-green-500/30" 
                                    : "bg-secondary/50 border-border hover:bg-secondary"
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={checklistItems[item.id] || false}
                                  onChange={(e) => setChecklistItems(prev => ({ ...prev, [item.id]: e.target.checked }))}
                                  className="mt-1 w-4 h-4 rounded border-border accent-green-500"
                                />
                                <div className="flex-1">
                                  <p className={`text-sm font-medium ${checklistItems[item.id] ? "text-green-500 line-through" : "text-foreground"}`}>
                                    {item.label}
                                  </p>
                                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                                  {item.expanded && (
                                    <div className="mt-2 p-2 rounded bg-background/50 border border-border/50 text-xs text-muted-foreground whitespace-pre-line hidden group-hover:block">
                                      {item.expanded}
                                    </div>
                                  )}
                                </div>
                              </label>
                            </div>
                          ))}
                        </TabsContent>

                        {/* Content */}
                        <TabsContent value="content" className="space-y-2">
                          {contentTasks.map((item) => (
                            <div key={item.id} className="group">
                              <label
                                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                                  checklistItems[item.id] 
                                    ? "bg-green-500/10 border-green-500/30" 
                                    : "bg-secondary/50 border-border hover:bg-secondary"
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={checklistItems[item.id] || false}
                                  onChange={(e) => setChecklistItems(prev => ({ ...prev, [item.id]: e.target.checked }))}
                                  className="mt-1 w-4 h-4 rounded border-border accent-green-500"
                                />
                                <div className="flex-1">
                                  <p className={`text-sm font-medium ${checklistItems[item.id] ? "text-green-500 line-through" : "text-foreground"}`}>
                                    {item.label}
                                  </p>
                                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                                  {item.expanded && (
                                    <div className="mt-2 p-2 rounded bg-background/50 border border-border/50 text-xs text-muted-foreground whitespace-pre-line hidden group-hover:block">
                                      {item.expanded}
                                    </div>
                                  )}
                                </div>
                              </label>
                            </div>
                          ))}
                        </TabsContent>

                        {/* Growth */}
                        <TabsContent value="growth" className="space-y-2">
                          {growthTasks.map((item) => (
                            <div key={item.id} className="group">
                              <label
                                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                                  checklistItems[item.id] 
                                    ? "bg-green-500/10 border-green-500/30" 
                                    : "bg-secondary/50 border-border hover:bg-secondary"
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={checklistItems[item.id] || false}
                                  onChange={(e) => setChecklistItems(prev => ({ ...prev, [item.id]: e.target.checked }))}
                                  className="mt-1 w-4 h-4 rounded border-border accent-green-500"
                                />
                                <div className="flex-1">
                                  <p className={`text-sm font-medium ${checklistItems[item.id] ? "text-green-500 line-through" : "text-foreground"}`}>
                                    {item.label}
                                  </p>
                                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                                  {item.expanded && (
                                    <div className="mt-2 p-2 rounded bg-background/50 border border-border/50 text-xs text-muted-foreground whitespace-pre-line hidden group-hover:block">
                                      {item.expanded}
                                    </div>
                                  )}
                                </div>
                              </label>
                            </div>
                          ))}
                        </TabsContent>
                      </Tabs>

                      {/* Progress bar */}
                      <div className="mt-4 pt-4 border-t border-border">
                        <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                          <span>Progresso geral</span>
                          <span className="font-medium text-foreground">
                            {Math.round((completedCount / totalTasks) * 100)}%
                          </span>
                        </div>
                        <Progress 
                          value={(completedCount / totalTasks) * 100} 
                          className="h-2" 
                        />
                      </div>
                    </>
                  );
                })()}
              </Card>

              {/* Goals Section */}
              <Card className="p-6 mb-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    <Target className="w-5 h-5 text-primary" />
                    Metas de Crescimento
                  </h3>
                  <Dialog open={isGoalDialogOpen} onOpenChange={setIsGoalDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="flex items-center gap-2">
                        <Plus className="w-4 h-4" />
                        Nova Meta
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Criar Nova Meta</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label>Período</Label>
                          <Select
                            value={newGoal.period_type}
                            onValueChange={(v: "all_time" | "monthly") =>
                              setNewGoal((prev) => {
                                const monthlyTypes = ["videos", "views", "likes", "comments", "revenue"];
                                const allTimeTypes = ["subscribers", "views", "videos", "engagement", "likes", "comments", "revenue"];
                                const allowed = v === "monthly" ? monthlyTypes : allTimeTypes;
                                const goal_type = allowed.includes(prev.goal_type)
                                  ? prev.goal_type
                                  : v === "monthly"
                                    ? "videos"
                                    : "subscribers";
                                return { ...prev, period_type: v, goal_type };
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all_time">Total do Canal</SelectItem>
                              <SelectItem value="monthly">Este Mês</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Tipo de Meta</Label>
                          <Select
                            value={newGoal.goal_type}
                            onValueChange={(v) => setNewGoal((prev) => ({ ...prev, goal_type: v }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {newGoal.period_type === "monthly" ? (
                                <>
                                  <SelectItem value="videos">Vídeos Postados</SelectItem>
                                  <SelectItem value="views">Views do Mês</SelectItem>
                                  <SelectItem value="likes">Likes do Mês</SelectItem>
                                  <SelectItem value="comments">Comentários do Mês</SelectItem>
                                  <SelectItem value="revenue">Faturamento do Mês</SelectItem>
                                </>
                              ) : (
                                <>
                                  <SelectItem value="subscribers">Inscritos</SelectItem>
                                  <SelectItem value="views">Views Totais</SelectItem>
                                  <SelectItem value="videos">Total de Vídeos</SelectItem>
                                  <SelectItem value="likes">Likes Totais</SelectItem>
                                  <SelectItem value="comments">Comentários Totais</SelectItem>
                                  <SelectItem value="revenue">Faturamento</SelectItem>
                                  <SelectItem value="engagement">Engajamento (%)</SelectItem>
                                </>
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Valor Alvo</Label>
                          <Input
                            type="number"
                            value={newGoal.target_value}
                            onChange={(e) => setNewGoal((prev) => ({ ...prev, target_value: parseInt(e.target.value) || 0 }))}
                            placeholder={newGoal.period_type === "monthly" ? "Ex: 25" : "Ex: 10000"}
                          />
                          {newGoal.period_type === "monthly" && analyticsData && (
                            <p className="text-xs text-muted-foreground">
                              Este mês: {getMetricFromData(analyticsData, "videos", "monthly")} vídeos, {formatNumber(getMetricFromData(analyticsData, "views", "monthly"))} views, {formatNumber(getMetricFromData(analyticsData, "likes", "monthly"))} likes, {formatNumber(getMetricFromData(analyticsData, "comments", "monthly"))} comentários
                            </p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label>Prazo (opcional)</Label>
                          <Input
                            type="date"
                            value={newGoal.deadline}
                            onChange={(e) => setNewGoal((prev) => ({ ...prev, deadline: e.target.value }))}
                          />
                        </div>
                        <Button onClick={createGoal} className="w-full">
                          Criar Meta
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                <Tabs defaultValue="active" className="w-full">
                  <TabsList className="mb-4">
                    <TabsTrigger value="active" className="flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      Ativas ({channelGoals?.length || 0})
                    </TabsTrigger>
                    <TabsTrigger value="completed" className="flex items-center gap-2">
                      <Trophy className="w-4 h-4" />
                      Concluídas ({completedGoals?.length || 0})
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="active">
                    {channelGoals && channelGoals.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {channelGoals.map((goal) => {
                          const GoalIcon = goalTypeLabels[goal.goal_type]?.icon || Target;
                          const progress = goal.target_value > goal.start_value 
                            ? Math.min(100, Math.round(((goal.current_value - goal.start_value) / (goal.target_value - goal.start_value)) * 100))
                            : goal.current_value >= goal.target_value ? 100 : 0;
                          const remaining = goal.target_value - goal.current_value;
                          
                          return (
                            <div
                              key={goal.id}
                              className="p-4 rounded-lg border bg-secondary/50 border-border"
                            >
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                    <GoalIcon className="w-5 h-5 text-primary" />
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <p className="font-medium text-foreground">
                                        {goalTypeLabels[goal.goal_type]?.label || goal.goal_type}
                                      </p>
                                      {goal.period_type === "monthly" && (
                                        <Badge variant="outline" className="text-[10px] py-0 px-1 bg-blue-500/10 text-blue-500 border-blue-500/30">
                                          Mensal
                                        </Badge>
                                      )}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                      Meta: {formatGoalValue(goal.goal_type, goal.target_value)}
                                      {goal.goal_type === "engagement" ? "%" : ""}
                                      {goal.period_type === "monthly" && goal.period_key && (
                                        <span className="ml-1">({goal.period_key})</span>
                                      )}
                                    </p>
                                  </div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                  onClick={() => deleteGoal(goal.id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                              
                              <div className="mb-2">
                                <div className="flex justify-between text-sm mb-1">
                                  <span className="text-muted-foreground">Progresso</span>
                                  <span className="font-medium text-foreground">{progress}%</span>
                                </div>
                                <Progress value={progress} className="h-2" />
                              </div>
                              
                              <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>
                                  Atual: {formatGoalValue(goal.goal_type, goal.current_value)}
                                  {goal.goal_type === "engagement" ? "%" : ""}
                                </span>
                                {remaining > 0 && (
                                  <span className="text-primary">
                                    Faltam: {formatGoalValue(goal.goal_type, remaining)}
                                    {goal.goal_type === "engagement" ? "%" : ""}
                                  </span>
                                )}
                              </div>
                              
                              {goal.deadline && (
                                <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                                  <Calendar className="w-3 h-3" />
                                  Prazo: {new Date(goal.deadline).toLocaleDateString("pt-BR")}
                                  {new Date(goal.deadline) < new Date() && (
                                    <Badge variant="destructive" className="ml-2 text-[10px] py-0">Atrasada</Badge>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Target className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
                        <p className="text-muted-foreground text-sm">
                          Nenhuma meta ativa. Crie sua primeira meta de crescimento!
                        </p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="completed">
                    {completedStats && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className="p-4 rounded-lg bg-green-500/5 border border-green-500/20 text-center">
                          <Trophy className="w-8 h-8 mx-auto mb-2 text-green-500" />
                          <p className="text-2xl font-bold text-foreground">{completedStats.totalCompleted}</p>
                          <p className="text-xs text-muted-foreground">Metas Concluídas</p>
                        </div>
                        <div className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/20 text-center">
                          <Timer className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                          <p className="text-2xl font-bold text-foreground">{completedStats.avgDaysToComplete}</p>
                          <p className="text-xs text-muted-foreground">Média de Dias</p>
                        </div>
                        <div className="p-4 rounded-lg bg-amber-500/5 border border-amber-500/20 text-center">
                          <Award className="w-8 h-8 mx-auto mb-2 text-amber-500" />
                          <p className="text-2xl font-bold text-foreground">{completedStats.fastestCompletion}</p>
                          <p className="text-xs text-muted-foreground">Mais Rápida (dias)</p>
                        </div>
                        <div className="p-4 rounded-lg bg-purple-500/5 border border-purple-500/20 text-center">
                          <History className="w-8 h-8 mx-auto mb-2 text-purple-500" />
                          <div className="flex justify-center gap-2 text-xs text-muted-foreground mt-2">
                            {completedStats.byType.subscribers > 0 && <Badge variant="outline">{completedStats.byType.subscribers} Inscritos</Badge>}
                            {completedStats.byType.views > 0 && <Badge variant="outline">{completedStats.byType.views} Views</Badge>}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">Por Tipo</p>
                        </div>
                      </div>
                    )}

                    {completedGoals && completedGoals.length > 0 ? (
                      <div className="space-y-3">
                        {completedGoals.map((goal) => {
                          const GoalIcon = goalTypeLabels[goal.goal_type]?.icon || Target;
                          const startDate = new Date(goal.created_at);
                          const endDate = new Date(goal.completed_at!);
                          const daysToComplete = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
                          
                          return (
                            <div
                              key={goal.id}
                              className="p-4 rounded-lg bg-green-500/5 border border-green-500/20 flex items-center gap-4"
                            >
                              <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                                <CheckCircle2 className="w-6 h-6 text-green-500" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <GoalIcon className="w-4 h-4 text-muted-foreground" />
                                  <p className="font-medium text-foreground">
                                    {goalTypeLabels[goal.goal_type]?.label}
                                  </p>
                                  <Badge className="bg-green-500/20 text-green-500 border-green-500/30">
                                    {formatNumber(goal.target_value)}{goal.goal_type === "engagement" ? "%" : ""}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    Concluída em {endDate.toLocaleDateString("pt-BR")}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Timer className="w-3 h-3" />
                                    {daysToComplete} dia{daysToComplete !== 1 ? 's' : ''} para concluir
                                  </span>
                                </div>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <p className="text-sm text-muted-foreground">
                                  Início: {formatNumber(goal.start_value)}{goal.goal_type === "engagement" ? "%" : ""}
                                </p>
                                <p className="text-sm font-medium text-green-500">
                                  Final: {formatNumber(goal.current_value)}{goal.goal_type === "engagement" ? "%" : ""}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Trophy className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
                        <p className="text-muted-foreground text-sm">
                          Nenhuma meta concluída ainda. Continue trabalhando nas suas metas!
                        </p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </Card>

              {/* Main Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard
                  icon={Users}
                  label="Inscritos"
                  value={
                    analyticsData.statistics.hiddenSubscriberCount
                      ? "Oculto"
                      : formatNumber(analyticsData.statistics.subscribers)
                  }
                  badge={
                    analyticsData.statistics.subscribers >= 100000 
                      ? "Excelente base! Continue engajando" 
                      : analyticsData.statistics.subscribers >= 10000 
                        ? "Bom crescimento! Foque em SEO" 
                        : "Dica: Peça inscrições no início dos vídeos"
                  }
                  badgeType={analyticsData.statistics.subscribers >= 100000 ? "good" : analyticsData.statistics.subscribers >= 10000 ? "tip" : "warning"}
                />
                <StatCard
                  icon={Eye}
                  label="Views Totais"
                  value={formatNumber(analyticsData.statistics.totalViews)}
                  badge={
                    analyticsData.statistics.totalViews >= 10000000 
                      ? "Canal com alto alcance!" 
                      : "Dica: Otimize títulos e thumbnails"
                  }
                  badgeType={analyticsData.statistics.totalViews >= 10000000 ? "good" : "tip"}
                />
                <StatCard
                  icon={Video}
                  label="Total de Vídeos"
                  value={formatNumber(analyticsData.statistics.totalVideos)}
                  badge={
                    analyticsData.statistics.totalVideos >= 100 
                      ? "Boa consistência de uploads!" 
                      : "Dica: Poste pelo menos 2x por semana"
                  }
                  badgeType={analyticsData.statistics.totalVideos >= 100 ? "good" : "tip"}
                />
                <StatCard
                  icon={TrendingUp}
                  label="Engajamento Médio"
                  value={`${analyticsData.recentMetrics.avgEngagementRate}%`}
                  subvalue="Últimos 50 vídeos"
                  badge={
                    analyticsData.recentMetrics.avgEngagementRate >= 5 
                      ? "Engajamento excelente!" 
                      : analyticsData.recentMetrics.avgEngagementRate >= 2 
                        ? "Bom! Incentive comentários" 
                        : "Melhorar: CTAs e interação"
                  }
                  badgeType={analyticsData.recentMetrics.avgEngagementRate >= 5 ? "good" : analyticsData.recentMetrics.avgEngagementRate >= 2 ? "tip" : "warning"}
                />
              </div>

              {/* Monetization Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard
                  icon={DollarSign}
                  label="RPM Estimado"
                  value={`$${analyticsData.monetization?.estimatedRPM?.toFixed(2) || "2.50"}`}
                  subvalue="Por 1000 views"
                  tooltip="RPM médio estimado baseado em dados de mercado. Valores reais variam conforme nicho, região e tipo de conteúdo."
                  badge={
                    (analyticsData.monetization?.estimatedRPM || 2.5) >= 4 
                      ? "RPM acima da média!" 
                      : "Dica: Nichos de finanças e tech pagam mais"
                  }
                  badgeType={(analyticsData.monetization?.estimatedRPM || 2.5) >= 4 ? "good" : "tip"}
                />
                <StatCard
                  icon={DollarSign}
                  label="Faturamento Mensal Est."
                  value={`$${formatNumber(analyticsData.monetization?.estimatedTotalEarnings || 0)}`}
                  subvalue="Baseado em views mensais"
                  tooltip="Estimativa baseada nos views mensais recentes × RPM médio. Dados reais de monetização só estão disponíveis no YouTube Studio."
                  badge={
                    (analyticsData.monetization?.estimatedTotalEarnings || 0) >= 1000 
                      ? "Receita mensal sólida!" 
                      : "Dica: Diversifique com produtos/afiliados"
                  }
                  badgeType={(analyticsData.monetization?.estimatedTotalEarnings || 0) >= 1000 ? "good" : "tip"}
                />
                <StatCard
                  icon={DollarSign}
                  label="Faturamento Recente Est."
                  value={`$${formatNumber(analyticsData.monetization?.estimatedMonthlyEarnings || 0)}`}
                  subvalue={`Últimos ${analyticsData.recentMetrics.analyzedVideos} vídeos`}
                  tooltip="Estimativa baseada nos views dos últimos vídeos analisados."
                  badge="Aumente views = mais receita"
                  badgeType="tip"
                />
                <StatCard
                  icon={BarChart3}
                  label="Views Recentes"
                  value={formatNumber(analyticsData.recentMetrics.totalViewsRecent)}
                  subvalue={`${analyticsData.recentMetrics.analyzedVideos} vídeos`}
                  badge={
                    analyticsData.recentMetrics.avgViewsPerVideo >= analyticsData.statistics.totalViews / analyticsData.statistics.totalVideos 
                      ? "Performance acima da média!" 
                      : "Dica: Analise títulos dos top vídeos"
                  }
                  badgeType={
                    analyticsData.recentMetrics.avgViewsPerVideo >= analyticsData.statistics.totalViews / analyticsData.statistics.totalVideos 
                      ? "good" : "warning"
                  }
                />
              </div>

              {/* Recent Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard
                  icon={Eye}
                  label="Média de Views"
                  value={formatNumber(analyticsData.recentMetrics.avgViewsPerVideo)}
                  subvalue="Por vídeo"
                  badge={
                    analyticsData.recentMetrics.avgViewsPerVideo >= 50000 
                      ? "Excelente alcance!" 
                      : analyticsData.recentMetrics.avgViewsPerVideo >= 10000 
                        ? "Bom! Foque em retenção" 
                        : "Dica: Melhore CTR com thumbs"
                  }
                  badgeType={analyticsData.recentMetrics.avgViewsPerVideo >= 50000 ? "good" : analyticsData.recentMetrics.avgViewsPerVideo >= 10000 ? "tip" : "warning"}
                />
                <StatCard
                  icon={ThumbsUp}
                  label="Média de Likes"
                  value={formatNumber(analyticsData.recentMetrics.avgLikesPerVideo)}
                  subvalue="Por vídeo"
                  badge={
                    (analyticsData.recentMetrics.avgLikesPerVideo / analyticsData.recentMetrics.avgViewsPerVideo * 100) >= 4 
                      ? "Ótima taxa de likes!" 
                      : "Dica: Peça likes no meio do vídeo"
                  }
                  badgeType={(analyticsData.recentMetrics.avgLikesPerVideo / analyticsData.recentMetrics.avgViewsPerVideo * 100) >= 4 ? "good" : "tip"}
                />
                <StatCard
                  icon={MessageSquare}
                  label="Média de Comentários"
                  value={formatNumber(analyticsData.recentMetrics.avgCommentsPerVideo)}
                  subvalue="Por vídeo"
                  badge={
                    analyticsData.recentMetrics.avgCommentsPerVideo >= 100 
                      ? "Comunidade engajada!" 
                      : "Dica: Faça perguntas nos vídeos"
                  }
                  badgeType={analyticsData.recentMetrics.avgCommentsPerVideo >= 100 ? "good" : "tip"}
                />
                <StatCard
                  icon={TrendingUp}
                  label="Taxa de Engajamento"
                  value={`${analyticsData.recentMetrics.avgEngagementRate}%`}
                  subvalue="(Likes + Comments) / Views"
                  badge={
                    analyticsData.recentMetrics.avgEngagementRate >= 6 
                      ? "Top 10% em engajamento!" 
                      : analyticsData.recentMetrics.avgEngagementRate >= 3 
                        ? "Acima da média do YouTube" 
                        : "Melhore CTAs e storytelling"
                  }
                  badgeType={analyticsData.recentMetrics.avgEngagementRate >= 6 ? "good" : analyticsData.recentMetrics.avgEngagementRate >= 3 ? "tip" : "warning"}
                />
              </div>

              {/* Growth Analysis Section */}
              {analyticsData.trendsData.length >= 2 && (() => {
                const sortedTrends = [...analyticsData.trendsData].sort((a, b) => b.month.localeCompare(a.month));
                const currentMonth = sortedTrends[0];
                const previousMonth = sortedTrends[1];
                
                const calcGrowth = (current: number, previous: number) => {
                  if (previous === 0) return current > 0 ? 100 : 0;
                  return ((current - previous) / previous * 100);
                };
                
                const viewsGrowth = calcGrowth(currentMonth.views, previousMonth.views);
                const videosGrowth = calcGrowth(currentMonth.videos, previousMonth.videos);
                const likesGrowth = calcGrowth(currentMonth.likes, previousMonth.likes);
                const avgViewsGrowth = calcGrowth(currentMonth.avgViews, previousMonth.avgViews);
                
                const GrowthIndicator = ({ value, label, current, previous }: { value: number; label: string; current: number; previous: number }) => {
                  const isPositive = value > 0;
                  const isNeutral = value === 0;
                  
                  return (
                    <div className="flex flex-col p-4 rounded-lg bg-secondary/50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">{label}</span>
                        <div className={`flex items-center gap-1 ${isPositive ? 'text-green-500' : isNeutral ? 'text-muted-foreground' : 'text-red-500'}`}>
                          {isPositive ? <ArrowUpRight className="w-4 h-4" /> : isNeutral ? <Minus className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                          <span className="font-semibold">{Math.abs(value).toFixed(1)}%</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <p className="text-lg font-bold text-foreground">{formatNumber(current)}</p>
                          <p className="text-xs text-muted-foreground">Mês atual</p>
                        </div>
                        <TrendingDown className="w-4 h-4 text-muted-foreground rotate-90" />
                        <div className="flex-1 text-right">
                          <p className="text-lg font-medium text-muted-foreground">{formatNumber(previous)}</p>
                          <p className="text-xs text-muted-foreground">Mês anterior</p>
                        </div>
                      </div>
                    </div>
                  );
                };
                
                const overallGrowth = (viewsGrowth + likesGrowth + avgViewsGrowth) / 3;
                
                return (
                  <Card className="p-6 mb-8">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="font-semibold text-foreground flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-primary" />
                        Análise de Crescimento
                      </h3>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-muted-foreground">
                          {currentMonth.month} vs {previousMonth.month}
                        </Badge>
                        <Badge 
                          variant={overallGrowth >= 10 ? "default" : overallGrowth >= 0 ? "secondary" : "destructive"}
                          className={overallGrowth >= 10 ? "bg-green-500/20 text-green-500 border-green-500/30" : ""}
                        >
                          {overallGrowth >= 0 ? "+" : ""}{overallGrowth.toFixed(1)}% geral
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                      <GrowthIndicator 
                        value={viewsGrowth} 
                        label="Views" 
                        current={currentMonth.views} 
                        previous={previousMonth.views} 
                      />
                      <GrowthIndicator 
                        value={videosGrowth} 
                        label="Vídeos Postados" 
                        current={currentMonth.videos} 
                        previous={previousMonth.videos} 
                      />
                      <GrowthIndicator 
                        value={likesGrowth} 
                        label="Likes" 
                        current={currentMonth.likes} 
                        previous={previousMonth.likes} 
                      />
                      <GrowthIndicator 
                        value={avgViewsGrowth} 
                        label="Média Views/Vídeo" 
                        current={currentMonth.avgViews} 
                        previous={previousMonth.avgViews} 
                      />
                    </div>
                    
                    {/* Growth Tips */}
                    <div className={`p-4 rounded-lg border ${overallGrowth >= 10 ? 'bg-green-500/5 border-green-500/20' : overallGrowth >= 0 ? 'bg-blue-500/5 border-blue-500/20' : 'bg-amber-500/5 border-amber-500/20'}`}>
                      <div className="flex items-start gap-3">
                        {overallGrowth >= 10 ? (
                          <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        ) : overallGrowth >= 0 ? (
                          <Lightbulb className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                        ) : (
                          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                        )}
                        <div>
                          <p className="font-medium text-foreground mb-1">
                            {overallGrowth >= 10 
                              ? "🎉 Excelente crescimento!" 
                              : overallGrowth >= 0 
                                ? "📈 Canal em crescimento estável" 
                                : "⚠️ Oportunidade de melhoria"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {overallGrowth >= 10 
                              ? "Seu canal está crescendo acima da média. Continue com a estratégia atual e considere aumentar a frequência de uploads."
                              : overallGrowth >= 0 
                                ? "Crescimento positivo! Para acelerar, foque em títulos chamativos, thumbnails atrativas e SEO nos primeiros 48h do vídeo."
                                : viewsGrowth < 0 
                                  ? "Views em queda. Recomendações: 1) Analise os títulos dos vídeos que performaram bem; 2) Melhore suas thumbnails; 3) Poste em horários de maior audiência."
                                  : "Foque em engajamento: responda comentários, faça perguntas nos vídeos e incentive inscrições."}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })()}

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Views Trend */}
                <Card className="p-6">
                  <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    Tendência de Views por Mês
                  </h3>
                  <div className="h-64">
                    {analyticsData.trendsData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={analyticsData.trendsData}>
                          <defs>
                            <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis
                            dataKey="month"
                            stroke="hsl(var(--muted-foreground))"
                            fontSize={12}
                            tickLine={false}
                          />
                          <YAxis
                            stroke="hsl(var(--muted-foreground))"
                            fontSize={12}
                            tickLine={false}
                            tickFormatter={(v) => formatNumber(v)}
                          />
                          <Tooltip content={<CustomTooltip />} />
                          <Area
                            type="monotone"
                            dataKey="views"
                            name="Views"
                            stroke="hsl(var(--primary))"
                            fill="url(#colorViews)"
                            strokeWidth={2}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        Sem dados suficientes
                      </div>
                    )}
                  </div>
                </Card>

                {/* Videos per Month */}
                <Card className="p-6">
                  <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Video className="w-5 h-5 text-primary" />
                    Vídeos Publicados por Mês
                  </h3>
                  <div className="h-64">
                    {analyticsData.trendsData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={analyticsData.trendsData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis
                            dataKey="month"
                            stroke="hsl(var(--muted-foreground))"
                            fontSize={12}
                            tickLine={false}
                          />
                          <YAxis
                            stroke="hsl(var(--muted-foreground))"
                            fontSize={12}
                            tickLine={false}
                            allowDecimals={false}
                          />
                          <Tooltip content={<CustomTooltip />} />
                          <Bar
                            dataKey="videos"
                            name="Vídeos"
                            fill="hsl(var(--primary))"
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        Sem dados suficientes
                      </div>
                    )}
                  </div>
                </Card>
              </div>

              {/* Top Videos - Split into Most Viewed and Most Recent */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Most Viewed */}
                <Card className="p-6">
                  <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Flame className="w-5 h-5 text-orange-500" />
                    Top 5 Mais Vistos
                  </h3>
                  <div className="space-y-3">
                    {analyticsData.topVideos
                      .sort((a, b) => b.views - a.views)
                      .slice(0, 5)
                      .map((video, index) => (
                        <div
                          key={video.videoId}
                          className="flex gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                        >
                          <div className="relative flex-shrink-0">
                            <span className={`absolute -top-2 -left-2 w-6 h-6 rounded-full ${index === 0 ? 'bg-amber-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-amber-700' : 'bg-primary'} text-primary-foreground text-xs font-bold flex items-center justify-center`}>
                              {index + 1}
                            </span>
                            {video.thumbnail && (
                              <img
                                src={video.thumbnail}
                                alt={video.title}
                                className="w-24 h-14 object-cover rounded"
                              />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <a
                              href={`https://www.youtube.com/watch?v=${video.videoId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm font-medium text-foreground hover:text-primary line-clamp-2"
                            >
                              {video.title}
                            </a>
                            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Eye className="w-3 h-3" />
                                {formatNumber(video.views)}
                              </span>
                              <span className="flex items-center gap-1">
                                <ThumbsUp className="w-3 h-3" />
                                {formatNumber(video.likes)}
                              </span>
                              <span className="flex items-center gap-1">
                                <TrendingUp className="w-3 h-3" />
                                {video.engagementRate}%
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </Card>

                {/* Most Recent */}
                <Card className="p-6">
                  <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-blue-500" />
                    5 Vídeos Mais Recentes
                  </h3>
                    <div className="space-y-3">
                      {(analyticsData.allVideos?.length ? [...analyticsData.allVideos] : [...analyticsData.topVideos])
                        .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
                        .slice(0, 5)
                        .map((video, index) => (
                          <div
                            key={video.videoId}
                            className="flex gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                          >
                            <div className="relative flex-shrink-0">
                              <span className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-blue-500 text-white text-xs font-bold flex items-center justify-center">
                                {index + 1}
                              </span>
                              {video.thumbnail && (
                                <img
                                  src={video.thumbnail}
                                  alt={video.title}
                                  className="w-24 h-14 object-cover rounded"
                                  loading="lazy"
                                />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <a
                                href={`https://www.youtube.com/watch?v=${video.videoId}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm font-medium text-foreground hover:text-primary line-clamp-2"
                              >
                                {video.title}
                              </a>
                              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Eye className="w-3 h-3" />
                                  {formatNumber(video.views)}
                                </span>
                                <span className="flex items-center gap-1">
                                  <ThumbsUp className="w-3 h-3" />
                                  {formatNumber(video.likes)}
                                </span>
                                <span className="text-blue-400">
                                  {new Date(video.publishedAt).toLocaleDateString("pt-BR")}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                </Card>
              </div>
            </>
          ) : (
            <Card className="p-12 text-center">
              <Youtube className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                Nenhum canal selecionado
              </h3>
              <p className="text-muted-foreground text-sm max-w-md mx-auto">
                Insira a URL do seu canal do YouTube ou selecione um dos canais monitorados para visualizar as estatísticas.
              </p>
            </Card>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default Analytics;

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
  Star
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
    views: number;
    likes: number;
    comments: number;
    publishedAt: string;
    engagementRate: string;
  }>;
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
  const [newGoal, setNewGoal] = useState({
    goal_type: "subscribers",
    target_value: 10000,
    deadline: "",
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
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

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
    
    // Get current value based on goal type
    let startValue = 0;
    if (analyticsData) {
      switch (newGoal.goal_type) {
        case "subscribers":
          startValue = analyticsData.statistics.subscribers;
          break;
        case "views":
          startValue = analyticsData.statistics.totalViews;
          break;
        case "videos":
          startValue = analyticsData.statistics.totalVideos;
          break;
        case "engagement":
          startValue = Math.round(analyticsData.recentMetrics.avgEngagementRate * 100);
          break;
      }
    }

    const { error } = await supabase.from("channel_goals").insert({
      user_id: user.id,
      channel_url: channelUrl,
      goal_type: newGoal.goal_type,
      target_value: newGoal.target_value,
      start_value: startValue,
      current_value: startValue,
      deadline: newGoal.deadline || null,
    });

    if (error) {
      toast({ title: "Erro ao criar meta", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Meta criada!", description: "Sua meta foi adicionada com sucesso" });
    setIsGoalDialogOpen(false);
    setNewGoal({ goal_type: "subscribers", target_value: 10000, deadline: "" });
    refetchGoals();
  };

  const updateGoalProgress = async () => {
    if (!channelGoals || !analyticsData) return;

    const completedGoals: string[] = [];
    const nearDeadlineGoals: string[] = [];
    const today = new Date();
    const threeDaysFromNow = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000);

    for (const goal of channelGoals) {
      let currentValue = 0;
      switch (goal.goal_type) {
        case "subscribers":
          currentValue = analyticsData.statistics.subscribers;
          break;
        case "views":
          currentValue = analyticsData.statistics.totalViews;
          break;
        case "videos":
          currentValue = analyticsData.statistics.totalVideos;
          break;
        case "engagement":
          currentValue = Math.round(analyticsData.recentMetrics.avgEngagementRate * 100);
          break;
      }

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
    engagement: { label: "Engajamento %", icon: TrendingUp },
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
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {savedChannels.map((channel) => (
                  <div
                    key={channel.id}
                    className={`relative p-3 rounded-lg border cursor-pointer transition-all hover:border-primary ${
                      channelUrl === channel.channel_url ? 'border-primary bg-primary/5' : 'border-border bg-secondary/30'
                    }`}
                    onClick={() => loadSavedChannel(channel)}
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive/10 hover:bg-destructive/20 text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        unsaveChannel(channel.channel_url);
                      }}
                    >
                      <PinOff className="w-3 h-3" />
                    </Button>
                    <div className="flex items-center gap-2">
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
                    <div className="flex items-center gap-3 mb-2">
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
                      Exportar
                    </Button>
                  </div>
                </div>
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
                          <Label>Tipo de Meta</Label>
                          <Select
                            value={newGoal.goal_type}
                            onValueChange={(v) => setNewGoal((prev) => ({ ...prev, goal_type: v }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="subscribers">Inscritos</SelectItem>
                              <SelectItem value="views">Views Totais</SelectItem>
                              <SelectItem value="videos">Total de Vídeos</SelectItem>
                              <SelectItem value="engagement">Engajamento (%)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Valor Alvo</Label>
                          <Input
                            type="number"
                            value={newGoal.target_value}
                            onChange={(e) => setNewGoal((prev) => ({ ...prev, target_value: parseInt(e.target.value) || 0 }))}
                            placeholder="Ex: 10000"
                          />
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
                                    <p className="font-medium text-foreground">
                                      {goalTypeLabels[goal.goal_type]?.label || goal.goal_type}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      Meta: {formatNumber(goal.target_value)}
                                      {goal.goal_type === "engagement" ? "%" : ""}
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
                                  Atual: {formatNumber(goal.current_value)}
                                  {goal.goal_type === "engagement" ? "%" : ""}
                                </span>
                                {remaining > 0 && (
                                  <span className="text-primary">
                                    Faltam: {formatNumber(remaining)}
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
                    {[...analyticsData.topVideos]
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

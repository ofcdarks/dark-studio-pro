import { useState } from "react";
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
  Flame
} from "lucide-react";
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
  const [channelUrl, setChannelUrl] = usePersistedState("analytics_channel_url", "");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyticsData, setAnalyticsData] = usePersistedState<YouTubeAnalytics | null>("analytics_data", null);

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
                  <Button
                    onClick={exportToCSV}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Exportar CSV
                  </Button>
                </div>
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

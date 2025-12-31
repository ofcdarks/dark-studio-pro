import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart3, TrendingUp, Eye, Video, ThumbsUp, Calendar, Loader2, Image, Mic, FolderOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { format, subDays, startOfDay, eachDayOfInterval } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AnalyticsData {
  totalVideos: number;
  totalImages: number;
  totalAudios: number;
  totalFolders: number;
  avgEngagement: number;
  avgCtr: number;
  totalViews: number;
  totalLikes: number;
  videosPerDay: { date: string; count: number }[];
  imagesPerDay: { date: string; count: number }[];
  engagementTrend: { date: string; engagement: number; ctr: number }[];
  topVideos: { title: string; views: number; engagement: number }[];
  activityByType: { name: string; value: number }[];
}

const COLORS = ["hsl(var(--primary))", "hsl(var(--success))", "hsl(var(--warning))", "hsl(var(--destructive))", "hsl(var(--accent))"];

const Analytics = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("30");
  const [data, setData] = useState<AnalyticsData>({
    totalVideos: 0,
    totalImages: 0,
    totalAudios: 0,
    totalFolders: 0,
    avgEngagement: 0,
    avgCtr: 0,
    totalViews: 0,
    totalLikes: 0,
    videosPerDay: [],
    imagesPerDay: [],
    engagementTrend: [],
    topVideos: [],
    activityByType: [],
  });

  useEffect(() => {
    if (user) {
      fetchAnalytics();
    }
  }, [user, period]);

  const fetchAnalytics = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const days = parseInt(period);
      const startDate = subDays(new Date(), days);

      // Fetch all data in parallel
      const [videosRes, imagesRes, audiosRes, foldersRes, activityRes] = await Promise.all([
        supabase
          .from("video_analyses")
          .select("*")
          .eq("user_id", user.id)
          .gte("created_at", startDate.toISOString()),
        supabase
          .from("generated_images")
          .select("*")
          .eq("user_id", user.id)
          .gte("created_at", startDate.toISOString()),
        supabase
          .from("generated_audios")
          .select("*")
          .eq("user_id", user.id)
          .gte("created_at", startDate.toISOString()),
        supabase.from("folders").select("*").eq("user_id", user.id),
        supabase
          .from("activity_logs")
          .select("*")
          .eq("user_id", user.id)
          .gte("created_at", startDate.toISOString())
          .order("created_at", { ascending: true }),
      ]);

      const videos = videosRes.data || [];
      const images = imagesRes.data || [];
      const audios = audiosRes.data || [];
      const folders = foldersRes.data || [];
      const activities = activityRes.data || [];

      // Calculate totals
      const totalViews = videos.reduce((sum, v) => sum + (v.views || 0), 0);
      const totalLikes = videos.reduce((sum, v) => sum + (v.likes || 0), 0);
      const avgEngagement = videos.length > 0 
        ? videos.reduce((sum, v) => sum + (v.engagement_rate || 0), 0) / videos.length 
        : 0;
      const avgCtr = videos.length > 0 
        ? videos.reduce((sum, v) => sum + (v.ctr || 0), 0) / videos.length 
        : 0;

      // Generate date range
      const dateRange = eachDayOfInterval({
        start: startDate,
        end: new Date(),
      });

      // Videos per day
      const videosPerDay = dateRange.map((date) => {
        const dayStr = format(date, "yyyy-MM-dd");
        const count = videos.filter(
          (v) => format(new Date(v.created_at), "yyyy-MM-dd") === dayStr
        ).length;
        return { date: format(date, "dd/MM", { locale: ptBR }), count };
      });

      // Images per day
      const imagesPerDay = dateRange.map((date) => {
        const dayStr = format(date, "yyyy-MM-dd");
        const count = images.filter(
          (i) => format(new Date(i.created_at), "yyyy-MM-dd") === dayStr
        ).length;
        return { date: format(date, "dd/MM", { locale: ptBR }), count };
      });

      // Engagement trend
      const engagementTrend = dateRange.map((date) => {
        const dayStr = format(date, "yyyy-MM-dd");
        const dayVideos = videos.filter(
          (v) => format(new Date(v.created_at), "yyyy-MM-dd") === dayStr
        );
        const engagement = dayVideos.length > 0
          ? dayVideos.reduce((sum, v) => sum + (v.engagement_rate || 0), 0) / dayVideos.length
          : 0;
        const ctr = dayVideos.length > 0
          ? dayVideos.reduce((sum, v) => sum + (v.ctr || 0), 0) / dayVideos.length
          : 0;
        return { 
          date: format(date, "dd/MM", { locale: ptBR }), 
          engagement: parseFloat(engagement.toFixed(2)), 
          ctr: parseFloat(ctr.toFixed(2)) 
        };
      });

      // Top videos
      const topVideos = [...videos]
        .sort((a, b) => (b.views || 0) - (a.views || 0))
        .slice(0, 5)
        .map((v) => ({
          title: v.video_title || "Sem título",
          views: v.views || 0,
          engagement: v.engagement_rate || 0,
        }));

      // Activity by type
      const activityCounts: Record<string, number> = {};
      activities.forEach((a) => {
        activityCounts[a.action] = (activityCounts[a.action] || 0) + 1;
      });
      const activityByType = Object.entries(activityCounts).map(([name, value]) => ({
        name: name.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
        value,
      }));

      // If no activities, show content distribution
      const contentDistribution = activityByType.length > 0 ? activityByType : [
        { name: "Vídeos Analisados", value: videos.length },
        { name: "Imagens Geradas", value: images.length },
        { name: "Áudios Criados", value: audios.length },
        { name: "Pastas", value: folders.length },
      ];

      setData({
        totalVideos: videos.length,
        totalImages: images.length,
        totalAudios: audios.length,
        totalFolders: folders.length,
        avgEngagement,
        avgCtr,
        totalViews,
        totalLikes,
        videosPerDay,
        imagesPerDay,
        engagementTrend,
        topVideos,
        activityByType: contentDistribution,
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados de analytics.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({
    icon: Icon,
    label,
    value,
    change,
  }: {
    icon: React.ElementType;
    label: string;
    value: string | number;
    change?: string;
  }) => (
    <Card className="p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <span className="text-muted-foreground text-sm">{label}</span>
      </div>
      <p className="text-3xl font-bold text-foreground">{value}</p>
      {change && (
        <p className={`text-sm mt-1 ${change.startsWith("+") ? "text-success" : "text-destructive"}`}>
          {change}
        </p>
      )}
    </Card>
  );

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium text-foreground">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="flex-1 overflow-auto p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Analytics</h1>
              <p className="text-muted-foreground">
                Acompanhe o desempenho dos seus vídeos e conteúdos
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Últimos 7 dias</SelectItem>
                  <SelectItem value="14">Últimos 14 dias</SelectItem>
                  <SelectItem value="30">Últimos 30 dias</SelectItem>
                  <SelectItem value="90">Últimos 90 dias</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={fetchAnalytics} variant="outline">
                <Calendar className="w-4 h-4 mr-2" />
                Atualizar
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard icon={Video} label="Vídeos Analisados" value={data.totalVideos} />
            <StatCard icon={Image} label="Imagens Geradas" value={data.totalImages} />
            <StatCard icon={Mic} label="Áudios Criados" value={data.totalAudios} />
            <StatCard icon={FolderOpen} label="Pastas" value={data.totalFolders} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
              icon={Eye}
              label="Views Totais"
              value={data.totalViews.toLocaleString("pt-BR")}
            />
            <StatCard
              icon={ThumbsUp}
              label="Likes Totais"
              value={data.totalLikes.toLocaleString("pt-BR")}
            />
            <StatCard
              icon={TrendingUp}
              label="Engajamento Médio"
              value={`${data.avgEngagement.toFixed(1)}%`}
            />
            <StatCard
              icon={BarChart3}
              label="CTR Médio"
              value={`${data.avgCtr.toFixed(1)}%`}
            />
          </div>

          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Video className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold text-foreground">Vídeos Analisados por Dia</h3>
                </div>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.videosPerDay}>
                    <defs>
                      <linearGradient id="colorVideos" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="date"
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
                    <Area
                      type="monotone"
                      dataKey="count"
                      name="Vídeos"
                      stroke="hsl(var(--primary))"
                      fill="url(#colorVideos)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Image className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold text-foreground">Imagens Geradas por Dia</h3>
                </div>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.imagesPerDay}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="date"
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
                      dataKey="count"
                      name="Imagens"
                      fill="hsl(var(--primary))"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          {/* Charts Row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold text-foreground">Tendência de Engajamento</h3>
                </div>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.engagementTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="date"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickLine={false}
                    />
                    <YAxis
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickLine={false}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="engagement"
                      name="Engajamento %"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="ctr"
                      name="CTR %"
                      stroke="hsl(var(--success))"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold text-foreground">Distribuição de Conteúdo</h3>
                </div>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.activityByType}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {data.activityByType.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          {/* Top Videos Table */}
          {data.topVideos.length > 0 && (
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <Video className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-foreground">Top Vídeos Analisados</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-muted-foreground font-medium">
                        Título
                      </th>
                      <th className="text-right py-3 px-4 text-muted-foreground font-medium">
                        Views
                      </th>
                      <th className="text-right py-3 px-4 text-muted-foreground font-medium">
                        Engajamento
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.topVideos.map((video, index) => (
                      <tr
                        key={index}
                        className="border-b border-border/50 hover:bg-secondary/30"
                      >
                        <td className="py-3 px-4 text-foreground">
                          {video.title.length > 50
                            ? video.title.substring(0, 50) + "..."
                            : video.title}
                        </td>
                        <td className="py-3 px-4 text-right text-foreground">
                          {video.views.toLocaleString("pt-BR")}
                        </td>
                        <td className="py-3 px-4 text-right text-foreground">
                          {video.engagement.toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Empty State */}
          {data.totalVideos === 0 && data.totalImages === 0 && data.totalAudios === 0 && (
            <Card className="p-12 text-center">
              <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Nenhum dado disponível
              </h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Comece a analisar vídeos, gerar imagens e criar conteúdo para ver suas
                estatísticas aqui.
              </p>
            </Card>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default Analytics;

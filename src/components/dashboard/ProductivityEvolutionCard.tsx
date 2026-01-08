import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { TrendingUp, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { subMonths, startOfMonth, endOfMonth, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface MonthData {
  month: string;
  videos: number;
  scripts: number;
  images: number;
  titles: number;
}

export function ProductivityEvolutionCard() {
  const { user } = useAuth();
  const [data, setData] = useState<MonthData[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"3" | "6">("6");

  useEffect(() => {
    if (!user?.id) return;

    const fetchEvolution = async () => {
      setLoading(true);
      const months = parseInt(period);
      const now = new Date();
      const monthsData: MonthData[] = [];

      // Fetch data for each month
      for (let i = months - 1; i >= 0; i--) {
        const targetMonth = subMonths(now, i);
        const monthStart = startOfMonth(targetMonth);
        const monthEnd = endOfMonth(targetMonth);

        const [videos, scripts, images, titles] = await Promise.all([
          supabase.from("analyzed_videos").select("*", { count: "exact", head: true }).eq("user_id", user.id).gte("created_at", monthStart.toISOString()).lte("created_at", monthEnd.toISOString()),
          supabase.from("generated_scripts").select("*", { count: "exact", head: true }).eq("user_id", user.id).gte("created_at", monthStart.toISOString()).lte("created_at", monthEnd.toISOString()),
          supabase.from("generated_images").select("*", { count: "exact", head: true }).eq("user_id", user.id).gte("created_at", monthStart.toISOString()).lte("created_at", monthEnd.toISOString()),
          supabase.from("generated_titles").select("*", { count: "exact", head: true }).eq("user_id", user.id).gte("created_at", monthStart.toISOString()).lte("created_at", monthEnd.toISOString()),
        ]);

        monthsData.push({
          month: format(targetMonth, "MMM", { locale: ptBR }),
          videos: videos.count || 0,
          scripts: scripts.count || 0,
          images: images.count || 0,
          titles: titles.count || 0,
        });
      }

      setData(monthsData);
      setLoading(false);
    };

    fetchEvolution();
  }, [user?.id, period]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium text-foreground mb-2 capitalize">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-muted-foreground">{entry.name}:</span>
              <span className="font-medium text-foreground">{entry.value}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="border-border/50 bg-gradient-to-br from-card to-card/80">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            Evolução de Produtividade
          </CardTitle>
          <Select value={period} onValueChange={(v) => setPeriod(v as "3" | "6")}>
            <SelectTrigger className="w-[130px] h-8 text-xs">
              <Calendar className="w-3 h-3 mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3">Últimos 3 meses</SelectItem>
              <SelectItem value="6">Últimos 6 meses</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-40 flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground text-sm">Carregando gráfico...</div>
          </div>
        ) : (
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis 
                  dataKey="month" 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                  iconType="circle"
                  iconSize={8}
                />
                <Line 
                  type="monotone" 
                  dataKey="videos" 
                  name="Vídeos" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))', strokeWidth: 0, r: 4 }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="scripts" 
                  name="Roteiros" 
                  stroke="#22c55e" 
                  strokeWidth={2}
                  dot={{ fill: '#22c55e', strokeWidth: 0, r: 4 }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="images" 
                  name="Imagens" 
                  stroke="#f59e0b" 
                  strokeWidth={2}
                  dot={{ fill: '#f59e0b', strokeWidth: 0, r: 4 }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="titles" 
                  name="Títulos" 
                  stroke="#8b5cf6" 
                  strokeWidth={2}
                  dot={{ fill: '#8b5cf6', strokeWidth: 0, r: 4 }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

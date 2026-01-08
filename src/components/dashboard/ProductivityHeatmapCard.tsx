import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Flame, Calendar, Trophy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { format, subDays, startOfWeek, eachDayOfInterval } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DayActivity {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
}

export function ProductivityHeatmapCard() {
  const { user } = useAuth();
  const [heatmapData, setHeatmapData] = useState<DayActivity[]>([]);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;

    const fetchActivityData = async () => {
      const endDate = new Date();
      const startDate = subDays(endDate, 83); // ~12 weeks

      const { data: logs } = await supabase
        .from("activity_logs")
        .select("created_at")
        .eq("user_id", user.id)
        .gte("created_at", startDate.toISOString())
        .lte("created_at", endDate.toISOString());

      // Count activities per day
      const activityByDay: Record<string, number> = {};
      logs?.forEach(log => {
        const day = format(new Date(log.created_at!), "yyyy-MM-dd");
        activityByDay[day] = (activityByDay[day] || 0) + 1;
      });

      // Generate all days in range
      const days = eachDayOfInterval({ start: startDate, end: endDate });
      const maxCount = Math.max(...Object.values(activityByDay), 1);

      const data: DayActivity[] = days.map(day => {
        const dateStr = format(day, "yyyy-MM-dd");
        const count = activityByDay[dateStr] || 0;
        let level: 0 | 1 | 2 | 3 | 4 = 0;
        if (count > 0) {
          const ratio = count / maxCount;
          if (ratio >= 0.75) level = 4;
          else if (ratio >= 0.5) level = 3;
          else if (ratio >= 0.25) level = 2;
          else level = 1;
        }
        return { date: dateStr, count, level };
      });

      setHeatmapData(data);

      // Calculate streaks
      let currentStreak = 0;
      let maxStreak = 0;
      let tempStreak = 0;

      for (let i = data.length - 1; i >= 0; i--) {
        if (data[i].count > 0) {
          tempStreak++;
          if (i === data.length - 1 || i === data.length - 2) {
            currentStreak = tempStreak;
          }
        } else {
          if (tempStreak > maxStreak) maxStreak = tempStreak;
          tempStreak = 0;
          if (i === data.length - 1) currentStreak = 0;
        }
      }
      if (tempStreak > maxStreak) maxStreak = tempStreak;

      setStreak(currentStreak);
      setBestStreak(maxStreak);
      setLoading(false);
    };

    fetchActivityData();
  }, [user?.id]);

  // Group by weeks for display
  const weeks: DayActivity[][] = [];
  for (let i = 0; i < heatmapData.length; i += 7) {
    weeks.push(heatmapData.slice(i, i + 7));
  }

  const levelColors = [
    "bg-muted",
    "bg-primary/20",
    "bg-primary/40",
    "bg-primary/60",
    "bg-primary",
  ];

  return (
    <Card className="border-border/50 bg-gradient-to-br from-card to-card/80">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            Mapa de Produtividade
          </CardTitle>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs">
              <Flame className="w-4 h-4 text-orange-500" />
              <span className="text-muted-foreground">Streak:</span>
              <span className="font-bold text-foreground">{streak} dias</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <Trophy className="w-4 h-4 text-yellow-500" />
              <span className="text-muted-foreground">Recorde:</span>
              <span className="font-bold text-foreground">{bestStreak} dias</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-24 flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground text-sm">Carregando...</div>
          </div>
        ) : (
          <TooltipProvider>
            <div className="flex gap-1 overflow-x-auto pb-2">
              {weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="flex flex-col gap-1">
                  {week.map((day, dayIndex) => (
                    <Tooltip key={day.date}>
                      <TooltipTrigger asChild>
                        <div
                          className={`w-3 h-3 rounded-sm ${levelColors[day.level]} transition-all hover:scale-125 cursor-default`}
                        />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-xs">
                        <p className="font-medium">{format(new Date(day.date), "dd MMM yyyy", { locale: ptBR })}</p>
                        <p className="text-muted-foreground">{day.count} atividades</p>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              ))}
            </div>
            <div className="flex items-center justify-end gap-1.5 mt-2 text-xs text-muted-foreground">
              <span>Menos</span>
              {levelColors.map((color, i) => (
                <div key={i} className={`w-3 h-3 rounded-sm ${color}`} />
              ))}
              <span>Mais</span>
            </div>
          </TooltipProvider>
        )}
      </CardContent>
    </Card>
  );
}

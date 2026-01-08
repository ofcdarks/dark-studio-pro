import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Target, Zap, Award, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Progress } from "@/components/ui/progress";
import { subDays, startOfWeek, endOfWeek } from "date-fns";

interface WeeklyGoal {
  label: string;
  current: number;
  target: number;
  completed: boolean;
}

export function ConsistencyScoreCard() {
  const { user } = useAuth();
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState("");
  const [weeklyGoals, setWeeklyGoals] = useState<WeeklyGoal[]>([]);
  const [daysActive, setDaysActive] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;

    const calculateConsistency = async () => {
      const now = new Date();
      const weekStart = startOfWeek(now, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
      const thirtyDaysAgo = subDays(now, 30);

      // Fetch all activity in parallel
      const [
        weeklyVideos,
        weeklyScripts,
        weeklyImages,
        weeklyTitles,
        monthlyActivity,
      ] = await Promise.all([
        supabase.from("analyzed_videos").select("*", { count: "exact", head: true }).eq("user_id", user.id).gte("created_at", weekStart.toISOString()).lte("created_at", weekEnd.toISOString()),
        supabase.from("generated_scripts").select("*", { count: "exact", head: true }).eq("user_id", user.id).gte("created_at", weekStart.toISOString()).lte("created_at", weekEnd.toISOString()),
        supabase.from("generated_images").select("*", { count: "exact", head: true }).eq("user_id", user.id).gte("created_at", weekStart.toISOString()).lte("created_at", weekEnd.toISOString()),
        supabase.from("generated_titles").select("*", { count: "exact", head: true }).eq("user_id", user.id).gte("created_at", weekStart.toISOString()).lte("created_at", weekEnd.toISOString()),
        supabase.from("activity_logs").select("created_at").eq("user_id", user.id).gte("created_at", thirtyDaysAgo.toISOString()),
      ]);

      // Weekly goals (adjusted for realistic targets)
      const goals: WeeklyGoal[] = [
        { label: "Vídeos analisados", current: weeklyVideos.count || 0, target: 5, completed: (weeklyVideos.count || 0) >= 5 },
        { label: "Roteiros gerados", current: weeklyScripts.count || 0, target: 3, completed: (weeklyScripts.count || 0) >= 3 },
        { label: "Imagens criadas", current: weeklyImages.count || 0, target: 5, completed: (weeklyImages.count || 0) >= 5 },
        { label: "Títulos gerados", current: weeklyTitles.count || 0, target: 10, completed: (weeklyTitles.count || 0) >= 10 },
      ];

      setWeeklyGoals(goals);

      // Calculate days active in last 30 days
      const uniqueDays = new Set<string>();
      monthlyActivity.data?.forEach(log => {
        const day = log.created_at?.split("T")[0];
        if (day) uniqueDays.add(day);
      });
      setDaysActive(uniqueDays.size);

      // Calculate consistency score (0-100)
      const goalsCompleted = goals.filter(g => g.completed).length;
      const goalsProgress = goals.reduce((sum, g) => sum + Math.min(g.current / g.target, 1), 0) / goals.length;
      const daysRatio = uniqueDays.size / 30;

      const calculatedScore = Math.round((goalsProgress * 40) + (goalsCompleted / goals.length * 30) + (daysRatio * 30));
      setScore(calculatedScore);

      // Determine level
      if (calculatedScore >= 90) setLevel("Lendário");
      else if (calculatedScore >= 70) setLevel("Mestre");
      else if (calculatedScore >= 50) setLevel("Consistente");
      else if (calculatedScore >= 30) setLevel("Iniciante");
      else setLevel("Novato");

      setLoading(false);
    };

    calculateConsistency();
  }, [user?.id]);

  const getScoreColor = () => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-primary";
    if (score >= 40) return "text-yellow-500";
    return "text-red-500";
  };

  const getProgressColor = () => {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-primary";
    if (score >= 40) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <Card className="border-border/50 bg-gradient-to-br from-card to-card/80">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Target className="w-4 h-4 text-primary" />
          Score de Consistência
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-32 flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground text-sm">Carregando...</div>
          </div>
        ) : (
          <>
            {/* Main Score */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="flex items-baseline gap-2">
                  <span className={`text-4xl font-bold ${getScoreColor()}`}>{score}</span>
                  <span className="text-lg text-muted-foreground">/100</span>
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                  <Award className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-foreground">{level}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 text-sm">
                  <Zap className="w-4 h-4 text-yellow-500" />
                  <span className="font-medium">{daysActive}</span>
                  <span className="text-muted-foreground">dias ativos</span>
                </div>
                <p className="text-xs text-muted-foreground">últimos 30 dias</p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mb-4">
              <Progress value={score} className="h-2" />
            </div>

            {/* Weekly Goals */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Metas da Semana</p>
              <div className="grid grid-cols-2 gap-2">
                {weeklyGoals.map((goal) => (
                  <div
                    key={goal.label}
                    className={`p-2 rounded-lg border text-xs ${
                      goal.completed 
                        ? "bg-green-500/10 border-green-500/20" 
                        : "bg-muted/30 border-border/30"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-muted-foreground">{goal.label}</span>
                      {goal.completed && <CheckCircle2 className="w-3 h-3 text-green-500" />}
                    </div>
                    <div className="font-medium text-foreground">
                      {goal.current}/{goal.target}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

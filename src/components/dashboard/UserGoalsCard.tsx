import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Target, Plus, Trash2, CheckCircle2, Trophy, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface UserGoal {
  id: string;
  goal_type: string;
  period_type: string;
  target_value: number;
  current_value: number;
  start_date: string;
  end_date: string;
  is_completed: boolean;
}

const GOAL_TYPES = [
  { value: 'videos', label: 'Vídeos Analisados', icon: '🎬' },
  { value: 'scripts', label: 'Roteiros Gerados', icon: '📝' },
  { value: 'images', label: 'Imagens Geradas', icon: '🖼️' },
  { value: 'titles', label: 'Títulos Gerados', icon: '✍️' },
  { value: 'audios', label: 'Áudios Gerados', icon: '🎙️' },
];

const PERIOD_TYPES = [
  { value: 'weekly', label: 'Semanal' },
  { value: 'monthly', label: 'Mensal' },
];

export function UserGoalsCard() {
  const { user } = useAuth();
  const [goals, setGoals] = useState<UserGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Form state
  const [goalType, setGoalType] = useState('videos');
  const [periodType, setPeriodType] = useState('weekly');
  const [targetValue, setTargetValue] = useState('5');

  const fetchGoals = async () => {
    if (!user?.id) return;
    
    try {
      const today = new Date();
      
      const { data, error } = await (supabase
        .from('user_goals' as any)
        .select('*')
        .eq('user_id', user.id)
        .gte('end_date', format(today, 'yyyy-MM-dd'))
        .order('created_at', { ascending: false }) as any);

      if (error) throw error;

      // Update current values
      const updatedGoals = await Promise.all(
        (data || []).map(async (goal) => {
          const currentValue = await calculateCurrentValue(
            goal.goal_type,
            goal.start_date,
            goal.end_date
          );
          return { ...goal, current_value: currentValue };
        })
      );

      setGoals(updatedGoals);
    } catch (error) {
      console.error('Error fetching goals:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateCurrentValue = async (
    goalType: string,
    startDate: string,
    endDate: string
  ): Promise<number> => {
    if (!user?.id) return 0;

    let tableName = '';
    switch (goalType) {
      case 'videos':
        tableName = 'analyzed_videos';
        break;
      case 'scripts':
        tableName = 'generated_scripts';
        break;
      case 'images':
        tableName = 'generated_images';
        break;
      case 'titles':
        tableName = 'generated_titles';
        break;
      case 'audios':
        tableName = 'generated_audios';
        break;
      default:
        return 0;
    }

    const { count, error } = await (supabase
      .from(tableName as 'analyzed_videos')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', startDate)
      .lte('created_at', endDate + 'T23:59:59') as any);

    if (error) {
      console.error('Error calculating current value:', error);
      return 0;
    }

    return count || 0;
  };

  const handleCreateGoal = async () => {
    if (!user?.id) return;
    
    setSaving(true);
    try {
      const today = new Date();
      let startDate: Date;
      let endDate: Date;

      if (periodType === 'weekly') {
        startDate = startOfWeek(today, { weekStartsOn: 1 });
        endDate = endOfWeek(today, { weekStartsOn: 1 });
      } else {
        startDate = startOfMonth(today);
        endDate = endOfMonth(today);
      }

      // Check if goal already exists for this type and period
      // Check if goal already exists using type assertion for the new table
      const { data: existing } = await (supabase
        .from('user_goals' as any)
        .select('id')
        .eq('user_id', user.id)
        .eq('goal_type', goalType)
        .eq('period_type', periodType)
        .eq('start_date', format(startDate, 'yyyy-MM-dd'))
        .single() as any);

      if (existing) {
        toast.error('Você já tem uma meta deste tipo para este período');
        setSaving(false);
        return;
      }

      const { error } = await (supabase.from('user_goals' as any) as any).insert({
        user_id: user.id,
        goal_type: goalType,
        period_type: periodType,
        target_value: parseInt(targetValue),
        start_date: format(startDate, 'yyyy-MM-dd'),
        end_date: format(endDate, 'yyyy-MM-dd'),
      });

      if (error) throw error;

      toast.success('Meta criada com sucesso!');
      setIsDialogOpen(false);
      fetchGoals();
    } catch (error) {
      console.error('Error creating goal:', error);
      toast.error('Erro ao criar meta');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    try {
      const { error } = await (supabase
        .from('user_goals' as any)
        .delete()
        .eq('id', goalId) as any);

      if (error) throw error;

      toast.success('Meta removida');
      fetchGoals();
    } catch (error) {
      console.error('Error deleting goal:', error);
      toast.error('Erro ao remover meta');
    }
  };

  useEffect(() => {
    fetchGoals();
  }, [user?.id]);

  const getGoalTypeInfo = (type: string) => {
    return GOAL_TYPES.find(g => g.value === type) || { label: type, icon: '📌' };
  };

  const getProgressPercentage = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Target className="h-5 w-5 text-primary" />
            Minhas Metas
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Target className="h-5 w-5 text-primary" />
            Minhas Metas
          </CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="gap-1">
                <Plus className="h-4 w-4" />
                Nova Meta
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Nova Meta</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Tipo de Meta</Label>
                  <Select value={goalType} onValueChange={setGoalType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {GOAL_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.icon} {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Período</Label>
                  <Select value={periodType} onValueChange={setPeriodType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PERIOD_TYPES.map((period) => (
                        <SelectItem key={period.value} value={period.value}>
                          {period.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Quantidade Alvo</Label>
                  <Input
                    type="number"
                    min="1"
                    value={targetValue}
                    onChange={(e) => setTargetValue(e.target.value)}
                    placeholder="Ex: 10"
                  />
                </div>

                <Button 
                  onClick={handleCreateGoal} 
                  className="w-full"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Criando...
                    </>
                  ) : (
                    'Criar Meta'
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {goals.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Trophy className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhuma meta ativa</p>
            <p className="text-xs mt-1">Clique em "Nova Meta" para começar</p>
          </div>
        ) : (
          <div className="space-y-4">
            {goals.map((goal) => {
              const typeInfo = getGoalTypeInfo(goal.goal_type);
              const progress = getProgressPercentage(goal.current_value, goal.target_value);
              const isCompleted = goal.current_value >= goal.target_value;

              return (
                <div key={goal.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span>{typeInfo.icon}</span>
                      <div>
                        <p className="text-sm font-medium">{typeInfo.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {goal.period_type === 'weekly' ? 'Semanal' : 'Mensal'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isCompleted && (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      )}
                      <span className="text-sm font-medium">
                        {goal.current_value}/{goal.target_value}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleDeleteGoal(goal.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                      </Button>
                    </div>
                  </div>
                  <Progress
                    value={progress}
                    className={`h-2 ${isCompleted ? '[&>div]:bg-green-500' : ''}`}
                  />
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  LayoutGrid, 
  Plus, 
  GripVertical, 
  Trash2, 
  Edit3, 
  Check, 
  X,
  Video,
  FileText,
  Image,
  Mic,
  ChevronRight,
  ChevronLeft,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface BoardTask {
  id: string;
  title: string;
  task_type: 'video' | 'script' | 'thumbnail' | 'audio' | 'other';
  column_id: 'backlog' | 'todo' | 'doing' | 'review' | 'done';
  task_order: number;
  created_at: string;
}

const columns = [
  { id: 'backlog', title: 'Backlog', color: 'bg-zinc-800/80', headerColor: 'bg-zinc-700', icon: '📋', textColor: 'text-zinc-300' },
  { id: 'todo', title: 'A Fazer', color: 'bg-blue-900/40', headerColor: 'bg-blue-600', icon: '📝', textColor: 'text-blue-300' },
  { id: 'doing', title: 'Em Andamento', color: 'bg-amber-900/40', headerColor: 'bg-amber-600', icon: '🔥', textColor: 'text-amber-300' },
  { id: 'review', title: 'Revisão', color: 'bg-purple-900/40', headerColor: 'bg-purple-600', icon: '👀', textColor: 'text-purple-300' },
  { id: 'done', title: 'Concluído', color: 'bg-green-900/40', headerColor: 'bg-green-600', icon: '✅', textColor: 'text-green-300' },
] as const;

const taskTypes = [
  { id: 'video', label: 'Vídeo', icon: Video, color: 'text-red-400' },
  { id: 'script', label: 'Roteiro', icon: FileText, color: 'text-blue-400' },
  { id: 'thumbnail', label: 'Thumbnail', icon: Image, color: 'text-green-400' },
  { id: 'audio', label: 'Áudio', icon: Mic, color: 'text-purple-400' },
  { id: 'other', label: 'Outro', icon: LayoutGrid, color: 'text-muted-foreground' },
] as const;

export function ProductionBoardCard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskType, setNewTaskType] = useState<BoardTask['task_type']>('video');
  const [addingToColumn, setAddingToColumn] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [draggedTask, setDraggedTask] = useState<BoardTask | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [visibleColumnIndex, setVisibleColumnIndex] = useState(0);

  // Fetch tasks from database
  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['production-board-tasks', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('production_board_tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('task_order', { ascending: true });
      
      if (error) throw error;
      return data as BoardTask[];
    },
    enabled: !!user?.id,
  });

  // Add task mutation
  const addTaskMutation = useMutation({
    mutationFn: async (params: { title: string; task_type: string; column_id: string }) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const maxOrder = tasks.filter(t => t.column_id === params.column_id).length;
      
      const { data, error } = await supabase
        .from('production_board_tasks')
        .insert({
          user_id: user.id,
          title: params.title,
          task_type: params.task_type,
          column_id: params.column_id,
          task_order: maxOrder,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['production-board-tasks'] });
      toast.success('Tarefa adicionada!');
      setNewTaskTitle('');
      setAddingToColumn(null);
    },
    onError: () => {
      toast.error('Erro ao adicionar tarefa');
    },
  });

  // Update task mutation
  const updateTaskMutation = useMutation({
    mutationFn: async (params: { id: string; updates: Partial<BoardTask> }) => {
      const { error } = await supabase
        .from('production_board_tasks')
        .update(params.updates)
        .eq('id', params.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['production-board-tasks'] });
    },
  });

  // Delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase
        .from('production_board_tasks')
        .delete()
        .eq('id', taskId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['production-board-tasks'] });
      toast.success('Tarefa removida');
    },
    onError: () => {
      toast.error('Erro ao remover tarefa');
    },
  });

  const addTask = (columnId: string) => {
    if (!newTaskTitle.trim()) {
      toast.error('Digite um título para a tarefa');
      return;
    }
    addTaskMutation.mutate({
      title: newTaskTitle.trim(),
      task_type: newTaskType,
      column_id: columnId,
    });
  };

  const deleteTask = (taskId: string) => {
    deleteTaskMutation.mutate(taskId);
  };

  const updateTaskTitle = (taskId: string) => {
    if (!editTitle.trim()) return;
    updateTaskMutation.mutate({
      id: taskId,
      updates: { title: editTitle.trim() },
    });
    setEditingTask(null);
    setEditTitle('');
  };

  const moveTask = (taskId: string, newColumn: BoardTask['column_id']) => {
    updateTaskMutation.mutate({
      id: taskId,
      updates: { column_id: newColumn },
    });
    toast.success(`Movido para ${columns.find(c => c.id === newColumn)?.title}`);
  };

  const handleDragStart = (task: BoardTask) => {
    setDraggedTask(task);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (columnId: string) => {
    if (draggedTask && draggedTask.column_id !== columnId) {
      moveTask(draggedTask.id, columnId as BoardTask['column_id']);
    }
    setDraggedTask(null);
  };

  const getTasksByColumn = (columnId: string) => {
    return tasks.filter(t => t.column_id === columnId).sort((a, b) => a.task_order - b.task_order);
  };

  const getTaskIcon = (type: BoardTask['task_type']) => {
    const taskType = taskTypes.find(t => t.id === type);
    if (!taskType) return null;
    const Icon = taskType.icon;
    return <Icon className={`h-3 w-3 ${taskType.color}`} />;
  };

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.column_id === 'done').length;
  const inProgressTasks = tasks.filter(t => t.column_id === 'doing').length;
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <Card className="bg-card/50 backdrop-blur border-border/50 overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <LayoutGrid className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                Escada de Produção
                {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">Arraste tarefas entre as colunas</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {inProgressTasks > 0 && (
              <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs">
                🔥 {inProgressTasks} em andamento
              </Badge>
            )}
            <div className="flex items-center gap-2 bg-secondary/50 rounded-lg px-3 py-1.5">
              <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-primary to-green-500 transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <span className="text-xs font-medium text-foreground">{completedTasks}/{totalTasks}</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Mobile Navigation */}
        <div className="flex md:hidden items-center justify-between mb-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setVisibleColumnIndex(Math.max(0, visibleColumnIndex - 1))}
            disabled={visibleColumnIndex === 0}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium">{columns[visibleColumnIndex].title}</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setVisibleColumnIndex(Math.min(columns.length - 1, visibleColumnIndex + 1))}
            disabled={visibleColumnIndex === columns.length - 1}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid gap-3 md:grid-cols-5">
          {columns.map((column) => {
            const columnTasks = getTasksByColumn(column.id);
            const isEmpty = columnTasks.length === 0;
            
            return (
              <div
                key={column.id}
                className={`rounded-xl overflow-hidden ${column.color} min-h-[300px] transition-all duration-200 ${
                  draggedTask && draggedTask.column_id !== column.id 
                    ? 'ring-2 ring-primary/30 ring-dashed' 
                    : ''
                }`}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(column.id)}
              >
                {/* Column Header with solid color */}
                <div className={`flex items-center justify-between px-3 py-2.5 ${column.headerColor}`}>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{column.icon}</span>
                    <h4 className="text-sm font-bold text-white">{column.title}</h4>
                  </div>
                  <Badge className="bg-white/20 text-white border-white/30 text-xs h-5 px-2 font-bold">
                    {columnTasks.length}
                  </Badge>
                </div>
                
                <div className="p-3">

                <ScrollArea className="h-[250px]">
                  <div className="space-y-2 pr-2">
                    {isEmpty && !addingToColumn && (
                      <div className="flex flex-col items-center justify-center py-6 text-center">
                        <div className="text-2xl mb-2 opacity-50">{column.icon}</div>
                        <p className="text-xs text-muted-foreground">Nenhuma tarefa</p>
                      </div>
                    )}
                    
                    {columnTasks.map((task) => (
                      <div
                        key={task.id}
                        draggable
                        onDragStart={() => handleDragStart(task)}
                        className={`bg-background/90 rounded-lg p-2.5 cursor-grab active:cursor-grabbing border border-border/40 hover:border-primary/40 hover:shadow-md transition-all group ${
                          draggedTask?.id === task.id ? 'opacity-50 scale-95' : ''
                        }`}
                      >
                        {editingTask === task.id ? (
                          <div className="flex items-center gap-1">
                            <Input
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              className="h-7 text-xs"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') updateTaskTitle(task.id);
                                if (e.key === 'Escape') setEditingTask(null);
                              }}
                            />
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => updateTaskTitle(task.id)}>
                              <Check className="h-3.5 w-3.5 text-green-500" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditingTask(null)}>
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-start gap-2">
                            <GripVertical className="h-3.5 w-3.5 text-muted-foreground/50 mt-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 mb-1">
                                {getTaskIcon(task.task_type)}
                                <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
                                  {taskTypes.find(t => t.id === task.task_type)?.label}
                                </span>
                              </div>
                              <p className="text-sm font-medium text-foreground line-clamp-2">{task.title}</p>
                            </div>
                            <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6 hover:bg-primary/10"
                                onClick={() => {
                                  setEditingTask(task.id);
                                  setEditTitle(task.title);
                                }}
                              >
                                <Edit3 className="h-3 w-3" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6 hover:bg-destructive/10 text-destructive"
                                onClick={() => deleteTask(task.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}

                    {addingToColumn === column.id ? (
                      <div className="bg-background/90 rounded-lg p-3 border-2 border-primary/30 space-y-2.5">
                        <Input
                          value={newTaskTitle}
                          onChange={(e) => setNewTaskTitle(e.target.value)}
                          placeholder="O que você vai produzir?"
                          className="h-8 text-sm"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') addTask(column.id);
                            if (e.key === 'Escape') setAddingToColumn(null);
                          }}
                        />
                        <div className="flex flex-wrap gap-1">
                          {taskTypes.map((type) => (
                            <Button
                              key={type.id}
                              size="sm"
                              variant={newTaskType === type.id ? 'default' : 'outline'}
                              className={`h-7 text-xs px-2.5 ${newTaskType === type.id ? '' : 'hover:bg-secondary'}`}
                              onClick={() => setNewTaskType(type.id as BoardTask['task_type'])}
                            >
                              <type.icon className={`h-3 w-3 mr-1 ${newTaskType === type.id ? '' : type.color}`} />
                              {type.label}
                            </Button>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            className="h-7 text-xs flex-1" 
                            onClick={() => addTask(column.id)}
                            disabled={addTaskMutation.isPending}
                          >
                            {addTaskMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : '+ Adicionar'}
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 text-xs px-3" onClick={() => setAddingToColumn(null)}>
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full h-8 text-xs text-muted-foreground hover:text-foreground hover:bg-background/50 border border-dashed border-border/50 hover:border-primary/30"
                        onClick={() => setAddingToColumn(column.id)}
                      >
                        <Plus className="h-3.5 w-3.5 mr-1.5" />
                        Nova tarefa
                      </Button>
                    )}
                  </div>
                </ScrollArea>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

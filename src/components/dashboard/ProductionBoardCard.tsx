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
  ChevronLeft
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface BoardTask {
  id: string;
  title: string;
  type: 'video' | 'script' | 'thumbnail' | 'audio' | 'other';
  column: 'backlog' | 'todo' | 'doing' | 'review' | 'done';
  order: number;
  createdAt: string;
}

const columns = [
  { id: 'backlog', title: 'Backlog', color: 'bg-muted' },
  { id: 'todo', title: 'A Fazer', color: 'bg-blue-500/20' },
  { id: 'doing', title: 'Em Andamento', color: 'bg-amber-500/20' },
  { id: 'review', title: 'Revisão', color: 'bg-purple-500/20' },
  { id: 'done', title: 'Concluído', color: 'bg-green-500/20' },
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
  const [tasks, setTasks] = useState<BoardTask[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskType, setNewTaskType] = useState<BoardTask['type']>('video');
  const [addingToColumn, setAddingToColumn] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [draggedTask, setDraggedTask] = useState<BoardTask | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [visibleColumnIndex, setVisibleColumnIndex] = useState(0);

  // Load tasks from localStorage (can be upgraded to Supabase later)
  useEffect(() => {
    if (user?.id) {
      const saved = localStorage.getItem(`production-board-${user.id}`);
      if (saved) {
        setTasks(JSON.parse(saved));
      }
    }
  }, [user?.id]);

  // Save tasks to localStorage
  useEffect(() => {
    if (user?.id && tasks.length > 0) {
      localStorage.setItem(`production-board-${user.id}`, JSON.stringify(tasks));
    }
  }, [tasks, user?.id]);

  const addTask = (columnId: string) => {
    if (!newTaskTitle.trim()) {
      toast.error('Digite um título para a tarefa');
      return;
    }

    const newTask: BoardTask = {
      id: crypto.randomUUID(),
      title: newTaskTitle.trim(),
      type: newTaskType,
      column: columnId as BoardTask['column'],
      order: tasks.filter(t => t.column === columnId).length,
      createdAt: new Date().toISOString(),
    };

    setTasks(prev => [...prev, newTask]);
    setNewTaskTitle('');
    setAddingToColumn(null);
    toast.success('Tarefa adicionada!');
  };

  const deleteTask = (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
    toast.success('Tarefa removida');
  };

  const updateTaskTitle = (taskId: string) => {
    if (!editTitle.trim()) return;
    
    setTasks(prev => prev.map(t => 
      t.id === taskId ? { ...t, title: editTitle.trim() } : t
    ));
    setEditingTask(null);
    setEditTitle('');
  };

  const moveTask = (taskId: string, newColumn: BoardTask['column']) => {
    setTasks(prev => prev.map(t => 
      t.id === taskId ? { ...t, column: newColumn } : t
    ));
  };

  const handleDragStart = (task: BoardTask) => {
    setDraggedTask(task);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (columnId: string) => {
    if (draggedTask && draggedTask.column !== columnId) {
      moveTask(draggedTask.id, columnId as BoardTask['column']);
      toast.success(`Movido para ${columns.find(c => c.id === columnId)?.title}`);
    }
    setDraggedTask(null);
  };

  const getTasksByColumn = (columnId: string) => {
    return tasks.filter(t => t.column === columnId).sort((a, b) => a.order - b.order);
  };

  const getTaskIcon = (type: BoardTask['type']) => {
    const taskType = taskTypes.find(t => t.id === type);
    if (!taskType) return null;
    const Icon = taskType.icon;
    return <Icon className={`h-3 w-3 ${taskType.color}`} />;
  };

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.column === 'done').length;

  // Mobile column navigation
  const visibleColumns = isExpanded ? columns : [columns[visibleColumnIndex]];

  return (
    <Card className="bg-card/50 backdrop-blur border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LayoutGrid className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Escada de Produção</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {completedTasks}/{totalTasks} concluídas
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="hidden md:flex"
            >
              {isExpanded ? 'Compacto' : 'Expandir'}
            </Button>
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

        <div className={`grid gap-3 ${isExpanded ? 'md:grid-cols-5' : 'md:grid-cols-3'}`}>
          {(isExpanded ? columns : columns.slice(0, 3)).map((column) => (
            <div
              key={column.id}
              className={`rounded-lg p-2 ${column.color} min-h-[200px] ${
                !isExpanded && columns.indexOf(column) > 2 ? 'hidden md:block' : ''
              }`}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(column.id)}
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-semibold text-foreground/80">{column.title}</h4>
                <Badge variant="secondary" className="text-xs h-5 px-1.5">
                  {getTasksByColumn(column.id).length}
                </Badge>
              </div>

              <ScrollArea className="h-[180px]">
                <div className="space-y-2 pr-2">
                  {getTasksByColumn(column.id).map((task) => (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={() => handleDragStart(task)}
                      className={`bg-background/80 rounded-md p-2 cursor-grab active:cursor-grabbing border border-border/30 hover:border-primary/30 transition-colors group ${
                        draggedTask?.id === task.id ? 'opacity-50' : ''
                      }`}
                    >
                      {editingTask === task.id ? (
                        <div className="flex items-center gap-1">
                          <Input
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="h-6 text-xs"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') updateTaskTitle(task.id);
                              if (e.key === 'Escape') setEditingTask(null);
                            }}
                          />
                          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => updateTaskTitle(task.id)}>
                            <Check className="h-3 w-3" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setEditingTask(null)}>
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-start gap-2">
                          <GripVertical className="h-3 w-3 text-muted-foreground mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1 mb-1">
                              {getTaskIcon(task.type)}
                              <span className="text-xs text-muted-foreground">
                                {taskTypes.find(t => t.id === task.type)?.label}
                              </span>
                            </div>
                            <p className="text-xs font-medium truncate">{task.title}</p>
                          </div>
                          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-5 w-5"
                              onClick={() => {
                                setEditingTask(task.id);
                                setEditTitle(task.title);
                              }}
                            >
                              <Edit3 className="h-2.5 w-2.5" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-5 w-5 text-destructive"
                              onClick={() => deleteTask(task.id)}
                            >
                              <Trash2 className="h-2.5 w-2.5" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {addingToColumn === column.id ? (
                    <div className="bg-background/80 rounded-md p-2 border border-primary/30 space-y-2">
                      <Input
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        placeholder="Título da tarefa..."
                        className="h-7 text-xs"
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
                            className="h-6 text-xs px-2"
                            onClick={() => setNewTaskType(type.id as BoardTask['type'])}
                          >
                            <type.icon className="h-3 w-3 mr-1" />
                            {type.label}
                          </Button>
                        ))}
                      </div>
                      <div className="flex gap-1">
                        <Button size="sm" className="h-6 text-xs flex-1" onClick={() => addTask(column.id)}>
                          Adicionar
                        </Button>
                        <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => setAddingToColumn(null)}>
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full h-7 text-xs text-muted-foreground hover:text-foreground"
                      onClick={() => setAddingToColumn(column.id)}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Adicionar
                    </Button>
                  )}
                </div>
              </ScrollArea>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

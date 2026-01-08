import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isToday, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Clock, 
  Video, 
  Edit2, 
  Trash2, 
  Lightbulb,
  Film,
  Scissors,
  CheckCircle,
  Upload,
  AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type VideoStatus = 'planned' | 'recording' | 'editing' | 'ready' | 'published';
type VideoPriority = 'low' | 'normal' | 'high';

interface ScheduledVideo {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  scheduled_date: string;
  scheduled_time: string | null;
  status: VideoStatus;
  niche: string | null;
  video_url: string | null;
  notes: string | null;
  priority: VideoPriority;
}

interface NicheBestTime {
  niche: string;
  best_days: string[];
  best_hours: string[];
  reasoning: string | null;
}

const statusConfig = {
  planned: { label: 'Planejado', icon: Calendar, color: 'bg-muted text-muted-foreground' },
  recording: { label: 'Gravando', icon: Film, color: 'bg-blue-500/20 text-blue-400' },
  editing: { label: 'Editando', icon: Scissors, color: 'bg-yellow-500/20 text-yellow-400' },
  ready: { label: 'Pronto', icon: CheckCircle, color: 'bg-green-500/20 text-green-400' },
  published: { label: 'Publicado', icon: Upload, color: 'bg-primary/20 text-primary' },
};

const priorityConfig = {
  low: { label: 'Baixa', color: 'bg-muted text-muted-foreground' },
  normal: { label: 'Normal', color: 'bg-blue-500/20 text-blue-400' },
  high: { label: 'Alta', color: 'bg-red-500/20 text-red-400' },
};

const dayNames: Record<string, string> = {
  monday: 'Segunda',
  tuesday: 'Terça',
  wednesday: 'Quarta',
  thursday: 'Quinta',
  friday: 'Sexta',
  saturday: 'Sábado',
  sunday: 'Domingo',
};

export default function PublicationSchedule() {
  const { session } = useAuth();
  const { toast } = useToast();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [scheduledVideos, setScheduledVideos] = useState<ScheduledVideo[]>([]);
  const [nicheBestTimes, setNicheBestTimes] = useState<NicheBestTime[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<ScheduledVideo | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    scheduled_date: string;
    scheduled_time: string;
    status: VideoStatus;
    niche: string;
    notes: string;
    priority: VideoPriority;
  }>({
    title: '',
    description: '',
    scheduled_date: '',
    scheduled_time: '',
    status: 'planned',
    niche: '',
    notes: '',
    priority: 'normal',
  });

  useEffect(() => {
    if (session?.user?.id) {
      fetchScheduledVideos();
      fetchNicheBestTimes();
    }
  }, [session?.user?.id, currentMonth]);

  const fetchScheduledVideos = async () => {
    if (!session?.user?.id) return;
    
    const startDate = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
    const endDate = format(endOfMonth(currentMonth), 'yyyy-MM-dd');
    
    const { data, error } = await supabase
      .from('publication_schedule')
      .select('*')
      .eq('user_id', session.user.id)
      .gte('scheduled_date', startDate)
      .lte('scheduled_date', endDate)
      .order('scheduled_date', { ascending: true });

    if (error) {
      console.error('Error fetching schedule:', error);
    } else {
      setScheduledVideos((data || []) as ScheduledVideo[]);
    }
    setLoading(false);
  };

  const fetchNicheBestTimes = async () => {
    const { data, error } = await supabase
      .from('niche_best_times')
      .select('*');

    if (!error && data) {
      setNicheBestTimes(data);
    }
  };

  const handleSaveVideo = async () => {
    if (!session?.user?.id || !formData.title || !formData.scheduled_date) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha o título e a data",
        variant: "destructive",
      });
      return;
    }

    const videoData = {
      user_id: session.user.id,
      title: formData.title,
      description: formData.description || null,
      scheduled_date: formData.scheduled_date,
      scheduled_time: formData.scheduled_time || null,
      status: formData.status,
      niche: formData.niche || null,
      notes: formData.notes || null,
      priority: formData.priority,
    };

    if (editingVideo) {
      const { error } = await supabase
        .from('publication_schedule')
        .update(videoData)
        .eq('id', editingVideo.id);

      if (error) {
        toast({ title: "Erro ao atualizar", variant: "destructive" });
      } else {
        toast({ title: "Vídeo atualizado!" });
      }
    } else {
      const { error } = await supabase
        .from('publication_schedule')
        .insert(videoData);

      if (error) {
        toast({ title: "Erro ao salvar", variant: "destructive" });
      } else {
        toast({ title: "Vídeo agendado!" });
      }
    }

    resetForm();
    fetchScheduledVideos();
  };

  const handleDeleteVideo = async (id: string) => {
    const { error } = await supabase
      .from('publication_schedule')
      .delete()
      .eq('id', id);

    if (error) {
      toast({ title: "Erro ao excluir", variant: "destructive" });
    } else {
      toast({ title: "Vídeo removido" });
      fetchScheduledVideos();
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: ScheduledVideo['status']) => {
    const { error } = await supabase
      .from('publication_schedule')
      .update({ status: newStatus })
      .eq('id', id);

    if (!error) {
      fetchScheduledVideos();
      toast({ title: `Status atualizado para ${statusConfig[newStatus].label}` });
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      scheduled_date: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '',
      scheduled_time: '',
      status: 'planned',
      niche: '',
      notes: '',
      priority: 'normal',
    });
    setEditingVideo(null);
    setIsDialogOpen(false);
  };

  const openEditDialog = (video: ScheduledVideo) => {
    setEditingVideo(video);
    setFormData({
      title: video.title,
      description: video.description || '',
      scheduled_date: video.scheduled_date,
      scheduled_time: video.scheduled_time || '',
      status: video.status,
      niche: video.niche || '',
      notes: video.notes || '',
      priority: video.priority,
    });
    setIsDialogOpen(true);
  };

  const openNewDialog = (date?: Date) => {
    setEditingVideo(null);
    setFormData({
      title: '',
      description: '',
      scheduled_date: date ? format(date, 'yyyy-MM-dd') : '',
      scheduled_time: '',
      status: 'planned',
      niche: '',
      notes: '',
      priority: 'normal',
    });
    setIsDialogOpen(true);
  };

  const getVideosForDate = (date: Date) => {
    return scheduledVideos.filter(video => 
      isSameDay(parseISO(video.scheduled_date), date)
    );
  };

  const getSuggestionForNiche = (niche: string) => {
    return nicheBestTimes.find(n => n.niche.toLowerCase() === niche.toLowerCase());
  };

  // Calendar generation
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  // Add padding days for week alignment
  const startPadding = monthStart.getDay();
  const paddedDays = Array(startPadding).fill(null).concat(calendarDays);

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
              <Calendar className="h-7 w-7 text-primary" />
              Agenda de Publicação
            </h1>
            <p className="text-muted-foreground mt-1">
              Planeje e organize seus vídeos
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSuggestions(!showSuggestions)}
            >
              <Lightbulb className="h-4 w-4 mr-2" />
              Dicas de Horário
            </Button>
            <Button onClick={() => openNewDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Vídeo
            </Button>
          </div>
        </div>

        {/* Suggestions Panel */}
        <AnimatePresence>
          {showSuggestions && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6"
            >
              <Card className="border-primary/20 bg-primary/5">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-primary" />
                    Melhores Horários por Nicho
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {nicheBestTimes.map((niche) => (
                      <div key={niche.niche} className="p-3 rounded-lg bg-background/50 border">
                        <h4 className="font-semibold capitalize mb-2">{niche.niche}</h4>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p><strong>Dias:</strong> {niche.best_days.map(d => dayNames[d] || d).join(', ')}</p>
                          <p><strong>Horários:</strong> {niche.best_hours.join(', ')}</p>
                          {niche.reasoning && (
                            <p className="text-xs italic mt-2">{niche.reasoning}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Calendar Navigation */}
        <Card className="mb-6">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <h2 className="text-xl font-semibold capitalize">
                {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
              </h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Week Headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
                <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {paddedDays.map((day, index) => {
                if (!day) {
                  return <div key={`empty-${index}`} className="min-h-[100px]" />;
                }

                const dayVideos = getVideosForDate(day);
                const isCurrentDay = isToday(day);
                const isSelected = selectedDate && isSameDay(day, selectedDate);

                return (
                  <motion.div
                    key={day.toISOString()}
                    className={`
                      min-h-[100px] p-2 rounded-lg border cursor-pointer transition-all
                      ${isCurrentDay ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}
                      ${isSelected ? 'ring-2 ring-primary' : ''}
                    `}
                    onClick={() => setSelectedDate(day)}
                    onDoubleClick={() => openNewDialog(day)}
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className={`text-sm font-medium ${isCurrentDay ? 'text-primary' : ''}`}>
                        {format(day, 'd')}
                      </span>
                      {dayVideos.length > 0 && (
                        <Badge variant="secondary" className="text-xs px-1.5">
                          {dayVideos.length}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="space-y-1">
                      {dayVideos.slice(0, 2).map((video) => {
                        const StatusIcon = statusConfig[video.status].icon;
                        return (
                          <div
                            key={video.id}
                            className={`text-xs p-1 rounded truncate flex items-center gap-1 ${statusConfig[video.status].color}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditDialog(video);
                            }}
                          >
                            <StatusIcon className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">{video.title}</span>
                          </div>
                        );
                      })}
                      {dayVideos.length > 2 && (
                        <div className="text-xs text-muted-foreground">
                          +{dayVideos.length - 2} mais
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Selected Day Details */}
        {selectedDate && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  {format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
                </CardTitle>
                <Button size="sm" onClick={() => openNewDialog(selectedDate)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Adicionar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {getVideosForDate(selectedDate).length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Video className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhum vídeo agendado para este dia</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => openNewDialog(selectedDate)}
                  >
                    Agendar Vídeo
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {getVideosForDate(selectedDate).map((video) => {
                    const StatusIcon = statusConfig[video.status].icon;
                    const suggestion = video.niche ? getSuggestionForNiche(video.niche) : null;
                    
                    return (
                      <motion.div
                        key={video.id}
                        className="p-4 rounded-lg border bg-card hover:shadow-md transition-shadow"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-semibold truncate">{video.title}</h4>
                              <Badge className={priorityConfig[video.priority].color}>
                                {priorityConfig[video.priority].label}
                              </Badge>
                            </div>
                            
                            {video.description && (
                              <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                                {video.description}
                              </p>
                            )}
                            
                            <div className="flex flex-wrap items-center gap-3 text-sm">
                              <Badge className={statusConfig[video.status].color}>
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {statusConfig[video.status].label}
                              </Badge>
                              
                              {video.scheduled_time && (
                                <span className="flex items-center gap-1 text-muted-foreground">
                                  <Clock className="h-3 w-3" />
                                  {video.scheduled_time}
                                </span>
                              )}
                              
                              {video.niche && (
                                <Badge variant="outline" className="capitalize">
                                  {video.niche}
                                </Badge>
                              )}
                            </div>

                            {suggestion && video.scheduled_time && (
                              <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                                <AlertCircle className="h-3 w-3" />
                                Melhor horário para {video.niche}: {suggestion.best_hours.join(' ou ')}
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <Select
                              value={video.status}
                              onValueChange={(value) => handleUpdateStatus(video.id, value as ScheduledVideo['status'])}
                            >
                              <SelectTrigger className="w-[130px] h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.entries(statusConfig).map(([key, config]) => (
                                  <SelectItem key={key} value={key}>
                                    <div className="flex items-center gap-2">
                                      <config.icon className="h-3 w-3" />
                                      {config.label}
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => openEditDialog(video)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => handleDeleteVideo(video.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Add/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingVideo ? 'Editar Vídeo' : 'Agendar Novo Vídeo'}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Título *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Título do vídeo"
                />
              </div>
              
              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descrição breve do conteúdo"
                  rows={2}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="scheduled_date">Data *</Label>
                  <Input
                    id="scheduled_date"
                    type="date"
                    value={formData.scheduled_date}
                    onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                  />
                </div>
                
                <div>
                  <Label htmlFor="scheduled_time">Horário</Label>
                  <Input
                    id="scheduled_time"
                    type="time"
                    value={formData.scheduled_time}
                    onChange={(e) => setFormData({ ...formData, scheduled_time: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="niche">Nicho</Label>
                  <Select
                    value={formData.niche}
                    onValueChange={(value) => setFormData({ ...formData, niche: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {nicheBestTimes.map((n) => (
                        <SelectItem key={n.niche} value={n.niche} className="capitalize">
                          {n.niche}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="priority">Prioridade</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) => setFormData({ ...formData, priority: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(priorityConfig).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          {config.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(statusConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          <config.icon className="h-4 w-4" />
                          {config.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="notes">Anotações</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Notas, links, referências..."
                  rows={2}
                />
              </div>
              
              {/* Suggestion based on niche */}
              {formData.niche && getSuggestionForNiche(formData.niche) && (
                <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                  <div className="flex items-center gap-2 text-sm">
                    <Lightbulb className="h-4 w-4 text-primary" />
                    <span className="font-medium">Sugestão para {formData.niche}:</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Melhores horários: {getSuggestionForNiche(formData.niche)?.best_hours.join(', ')}
                  </p>
                </div>
              )}
              
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
                <Button onClick={handleSaveVideo}>
                  {editingVideo ? 'Salvar' : 'Agendar'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}

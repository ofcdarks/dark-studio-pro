import { MainLayout } from "@/components/layout/MainLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Film, Play, Clock, Download, Loader2, Trash2 } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface VideoJob {
  id: string;
  title: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number;
}

const VideoGenerator = () => {
  const [title, setTitle] = useState("");
  const [script, setScript] = useState("");
  const [style, setStyle] = useState("");
  const [duration, setDuration] = useState("");
  const [loading, setLoading] = useState(false);
  const [videoJobs, setVideoJobs] = useState<VideoJob[]>([]);

  const handleGenerateVideo = async () => {
    if (!script.trim()) {
      toast.error('Digite ou cole o roteiro do vídeo');
      return;
    }

    setLoading(true);
    const jobId = Date.now().toString();
    
    const newJob: VideoJob = {
      id: jobId,
      title: title || 'Vídeo sem título',
      status: 'processing',
      progress: 0
    };

    setVideoJobs(prev => [newJob, ...prev]);

    try {
      // Simulate video generation process
      const { data, error } = await supabase.functions.invoke('ai-assistant', {
        body: {
          action: 'generate_video_script',
          title: title,
          script: script,
          style: style,
          duration: duration
        }
      });

      if (error) throw error;

      // Simulate progress
      for (let i = 0; i <= 100; i += 10) {
        await new Promise(resolve => setTimeout(resolve, 500));
        setVideoJobs(prev => prev.map(job => 
          job.id === jobId ? { ...job, progress: i } : job
        ));
      }

      setVideoJobs(prev => prev.map(job => 
        job.id === jobId ? { ...job, status: 'completed', progress: 100 } : job
      ));

      toast.success('Vídeo gerado com sucesso!');
      setTitle('');
      setScript('');
    } catch (error) {
      console.error('Error generating video:', error);
      setVideoJobs(prev => prev.map(job => 
        job.id === jobId ? { ...job, status: 'error' } : job
      ));
      toast.error('Erro ao gerar vídeo');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveJob = (jobId: string) => {
    setVideoJobs(prev => prev.filter(job => job.id !== jobId));
  };

  return (
    <MainLayout>
      <div className="flex-1 overflow-auto p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Gerador de Vídeo</h1>
            <p className="text-muted-foreground">
              Crie vídeos automaticamente a partir de roteiros usando IA
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Film className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold text-foreground">Configuração do Vídeo</h3>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-muted-foreground mb-2 block">Título do Vídeo</label>
                    <Input 
                      placeholder="Digite o título do seu vídeo..."
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="bg-secondary border-border"
                    />
                  </div>

                  <div>
                    <label className="text-sm text-muted-foreground mb-2 block">Roteiro</label>
                    <Textarea
                      placeholder="Cole ou digite o roteiro do vídeo..."
                      value={script}
                      onChange={(e) => setScript(e.target.value)}
                      className="bg-secondary border-border min-h-40"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-muted-foreground mb-2 block">Estilo Visual</label>
                      <Select value={style} onValueChange={setStyle}>
                        <SelectTrigger className="bg-secondary border-border">
                          <SelectValue placeholder="Selecione o estilo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="documentary">Documentário</SelectItem>
                          <SelectItem value="cinematic">Cinemático</SelectItem>
                          <SelectItem value="dark">Dark/Mistério</SelectItem>
                          <SelectItem value="educational">Educacional</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground mb-2 block">Duração Alvo</label>
                      <Select value={duration} onValueChange={setDuration}>
                        <SelectTrigger className="bg-secondary border-border">
                          <SelectValue placeholder="Selecione a duração" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="short">Curto (5-10 min)</SelectItem>
                          <SelectItem value="medium">Médio (10-20 min)</SelectItem>
                          <SelectItem value="long">Longo (20-30 min)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button 
                      className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                      onClick={handleGenerateVideo}
                      disabled={loading || !script.trim()}
                    >
                      {loading ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Film className="w-4 h-4 mr-2" />
                      )}
                      Gerar Vídeo
                    </Button>
                  </div>
                </div>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold text-foreground">Fila de Renderização</h3>
                </div>
                {videoJobs.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhum vídeo na fila
                  </p>
                ) : (
                  <div className="space-y-3">
                    {videoJobs.filter(j => j.status !== 'completed').map((job) => (
                      <div key={job.id} className="p-3 bg-secondary/50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-foreground truncate max-w-[120px]">
                            {job.title}
                          </span>
                          <span className={`text-xs ${
                            job.status === 'processing' ? 'text-primary' : 
                            job.status === 'error' ? 'text-destructive' : 'text-muted-foreground'
                          }`}>
                            {job.status === 'processing' ? 'Processando...' : 
                             job.status === 'error' ? 'Erro' : 'Pendente'}
                          </span>
                        </div>
                        <div className="h-1.5 bg-secondary rounded-full">
                          <div 
                            className={`h-full rounded-full transition-all ${
                              job.status === 'error' ? 'bg-destructive' : 'bg-primary'
                            }`}
                            style={{ width: `${job.progress}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Play className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold text-foreground">Vídeos Recentes</h3>
                </div>
                {videoJobs.filter(j => j.status === 'completed').length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhum vídeo gerado
                  </p>
                ) : (
                  <div className="space-y-3">
                    {videoJobs.filter(j => j.status === 'completed').map((job) => (
                      <div key={job.id} className="p-3 bg-secondary/50 rounded-lg">
                        <div className="aspect-video bg-secondary rounded mb-2 flex items-center justify-center">
                          <Play className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-foreground truncate">{job.title}</span>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                              <Download className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-destructive"
                              onClick={() => handleRemoveJob(job.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default VideoGenerator;

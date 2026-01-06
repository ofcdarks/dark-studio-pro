import { MainLayout } from "@/components/layout/MainLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Film, Play, Clock, Download, Loader2, Trash2, ChevronDown, Zap, RefreshCw } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface VideoJob {
  id: string;
  prompt: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number;
  video_url?: string;
  model: string;
  resolution: string;
  aspect_ratio: string;
  task_id?: string;
}

// Custos por modelo (baseado na API Laozhang)
const MODEL_COSTS: Record<string, number> = {
  'sora2': 10,        // $0.15/video ≈ 10 créditos
  'kling': 15,        // Kling API
};

const VideoGenerator = () => {
  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState<"sora2" | "kling">("sora2");
  const [aspectRatio, setAspectRatio] = useState<"16:9" | "9:16" | "1:1">("16:9");
  const [resolution, setResolution] = useState<"720p" | "1080p">("720p");
  const [loading, setLoading] = useState(false);
  const [videoJobs, setVideoJobs] = useState<VideoJob[]>([]);
  const [advancedOpen, setAdvancedOpen] = useState(true);

  const estimatedCost = MODEL_COSTS[model] || 10;

  const handleGenerateVideo = async () => {
    if (!prompt.trim()) {
      toast.error('Descreva o vídeo que você quer criar');
      return;
    }

    setLoading(true);
    const jobId = Date.now().toString();
    
    const newJob: VideoJob = {
      id: jobId,
      prompt: prompt.substring(0, 50) + (prompt.length > 50 ? '...' : ''),
      status: 'processing',
      progress: 0,
      model: model,
      resolution: resolution,
      aspect_ratio: aspectRatio,
    };

    setVideoJobs(prev => [newJob, ...prev]);

    try {
      const { data, error } = await supabase.functions.invoke('generate-video-laozhang', {
        body: {
          prompt: prompt,
          model: model,
          aspect_ratio: aspectRatio,
          resolution: resolution,
        }
      });

      if (error) throw error;

      if (data.status === 'processing' && data.task_id) {
        // Vídeo está sendo processado - salvar task_id para polling
        setVideoJobs(prev => prev.map(job => 
          job.id === jobId ? { ...job, task_id: data.task_id, progress: 30 } : job
        ));
        toast.info('Vídeo está sendo gerado. Isso pode levar alguns minutos...');
        
        // Simular progresso enquanto processa
        let progress = 30;
        const interval = setInterval(() => {
          progress += 10;
          if (progress >= 90) {
            clearInterval(interval);
          }
          setVideoJobs(prev => prev.map(job => 
            job.id === jobId && job.status === 'processing' ? { ...job, progress } : job
          ));
        }, 3000);
        
      } else if (data.status === 'completed' && data.video_url) {
        setVideoJobs(prev => prev.map(job => 
          job.id === jobId ? { 
            ...job, 
            status: 'completed', 
            progress: 100,
            video_url: data.video_url 
          } : job
        ));
        toast.success('Vídeo gerado com sucesso!');
      } else {
        // Status intermediário
        setVideoJobs(prev => prev.map(job => 
          job.id === jobId ? { ...job, progress: 50 } : job
        ));
        toast.info('Vídeo em processamento...');
      }

      setPrompt('');
    } catch (error) {
      console.error('Error generating video:', error);
      setVideoJobs(prev => prev.map(job => 
        job.id === jobId ? { ...job, status: 'error' } : job
      ));
      toast.error('Erro ao gerar vídeo. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleClearAll = () => {
    setPrompt('');
    setModel('sora2');
    setAspectRatio('16:9');
    setResolution('720p');
  };

  const handleRemoveJob = (jobId: string) => {
    setVideoJobs(prev => prev.filter(job => job.id !== jobId));
  };

  const handleDownload = (videoUrl: string) => {
    window.open(videoUrl, '_blank');
  };

  return (
    <MainLayout>
      <div className="flex-1 overflow-auto p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8 flex items-center gap-3">
            <Film className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold text-foreground">Gerador de Vídeo</h1>
              <p className="text-muted-foreground">
                Crie vídeos incríveis com IA usando Sora 2 e Kling
              </p>
            </div>
          </div>

          {/* Main Card */}
          <Card className="p-6 mb-6">
            {/* Modo de Geração */}
            <div className="mb-6">
              <label className="text-sm text-muted-foreground mb-2 block">Modo de Geração</label>
              <div className="bg-secondary/50 border border-border rounded-lg px-4 py-3">
                <span className="text-foreground">Texto para Vídeo</span>
              </div>
            </div>

            {/* Descrição do Vídeo */}
            <div className="mb-6">
              <label className="text-sm text-muted-foreground mb-2 block">Descrição do Vídeo</label>
              <Textarea
                placeholder="Descreva o vídeo que você quer criar..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="bg-secondary/50 border-border min-h-32 resize-none"
              />
            </div>

            {/* Configurações Avançadas */}
            <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen} className="mb-6">
              <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <span>Configurações Avançadas</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${advancedOpen ? 'rotate-180' : ''}`} />
              </CollapsibleTrigger>
              
              <CollapsibleContent className="pt-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Modelo */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <label className="text-sm text-muted-foreground">Modelo</label>
                      <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30">
                        <Zap className="w-3 h-3 mr-1" />
                        Custo estimado: {estimatedCost} créditos
                      </Badge>
                    </div>
                    <Select value={model} onValueChange={(v: "sora2" | "kling") => setModel(v)}>
                      <SelectTrigger className="bg-secondary/50 border-border">
                        <SelectValue placeholder="Selecione o modelo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sora2">Sora 2 (Alta Qualidade)</SelectItem>
                        <SelectItem value="kling">Kling (Rápido)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Proporção */}
                  <div>
                    <label className="text-sm text-muted-foreground mb-2 block">Proporção</label>
                    <Select value={aspectRatio} onValueChange={(v: "16:9" | "9:16" | "1:1") => setAspectRatio(v)}>
                      <SelectTrigger className="bg-secondary/50 border-border">
                        <SelectValue placeholder="Selecione a proporção" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="16:9">Landscape (16:9)</SelectItem>
                        <SelectItem value="9:16">Portrait (9:16)</SelectItem>
                        <SelectItem value="1:1">Square (1:1)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Resolução */}
                  <div>
                    <label className="text-sm text-muted-foreground mb-2 block">Resolução</label>
                    <Select value={resolution} onValueChange={(v: "720p" | "1080p") => setResolution(v)}>
                      <SelectTrigger className="bg-secondary/50 border-border">
                        <SelectValue placeholder="Selecione a resolução" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="720p">720p</SelectItem>
                        <SelectItem value="1080p">1080p</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Botões */}
            <div className="flex gap-3">
              <Button 
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={handleGenerateVideo}
                disabled={loading || !prompt.trim()}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Film className="w-4 h-4 mr-2" />
                )}
                Gerar Vídeo
              </Button>
              <Button 
                variant="secondary"
                onClick={handleClearAll}
                className="px-6"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Limpar Tudo
              </Button>
            </div>
          </Card>

          {/* Fila e Vídeos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Fila de Renderização */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-foreground">Fila de Renderização</h3>
              </div>
              {videoJobs.filter(j => j.status !== 'completed').length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Nenhum vídeo na fila
                </p>
              ) : (
                <div className="space-y-3">
                  {videoJobs.filter(j => j.status !== 'completed').map((job) => (
                    <div key={job.id} className="p-4 bg-secondary/50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <span className="text-sm font-medium text-foreground block truncate max-w-[200px]">
                            {job.prompt}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {job.model.toUpperCase()} • {job.resolution} • {job.aspect_ratio}
                          </span>
                        </div>
                        <span className={`text-xs font-medium ${
                          job.status === 'processing' ? 'text-primary' : 
                          job.status === 'error' ? 'text-destructive' : 'text-muted-foreground'
                        }`}>
                          {job.status === 'processing' ? 'Processando...' : 
                           job.status === 'error' ? 'Erro' : 'Pendente'}
                        </span>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            job.status === 'error' ? 'bg-destructive' : 'bg-primary'
                          }`}
                          style={{ width: `${job.progress}%` }}
                        />
                      </div>
                      {job.status === 'error' && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="mt-2 text-destructive"
                          onClick={() => handleRemoveJob(job.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Remover
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Vídeos Recentes */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Play className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-foreground">Vídeos Recentes</h3>
              </div>
              {videoJobs.filter(j => j.status === 'completed').length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Nenhum vídeo gerado
                </p>
              ) : (
                <div className="space-y-3">
                  {videoJobs.filter(j => j.status === 'completed').map((job) => (
                    <div key={job.id} className="p-4 bg-secondary/50 rounded-lg">
                      <div className="aspect-video bg-secondary rounded mb-3 flex items-center justify-center overflow-hidden">
                        {job.video_url ? (
                          <video 
                            src={job.video_url} 
                            className="w-full h-full object-cover"
                            controls
                          />
                        ) : (
                          <Play className="w-8 h-8 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-sm text-foreground block truncate max-w-[150px]">
                            {job.prompt}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {job.model.toUpperCase()} • {job.resolution}
                          </span>
                        </div>
                        <div className="flex gap-1">
                          {job.video_url && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-muted-foreground hover:text-foreground"
                              onClick={() => handleDownload(job.video_url!)}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          )}
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
    </MainLayout>
  );
};

export default VideoGenerator;

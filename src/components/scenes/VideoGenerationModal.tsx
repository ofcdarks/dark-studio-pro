import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Video, Loader2, Sparkles, Download, Play, AlertCircle, Coins, RefreshCw, Clock, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useCreditDeduction } from "@/hooks/useCreditDeduction";

interface VideoGenerationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sceneNumber: number;
  sceneText: string;
  sceneImage?: string;
  onVideoGenerated?: (sceneNumber: number, videoUrl: string) => void;
}

const VIDEO_MODELS = [
  { id: 'veo31-fast', name: 'Veo 3.1 Fast', description: 'Rápido (~2min)', credits: 50, duration: '~8s' },
  { id: 'veo31', name: 'Veo 3.1 Pro', description: 'Alta qualidade (~5min)', credits: 80, duration: '~8s' },
  { id: 'sora2', name: 'Sora 2 (10s)', description: 'OpenAI Sora', credits: 60, duration: '10s' },
  { id: 'sora2-15s', name: 'Sora 2 (15s)', description: 'OpenAI Sora longo', credits: 80, duration: '15s' },
];

type GenerationStatus = 'idle' | 'submitting' | 'processing' | 'completed' | 'failed';

export function VideoGenerationModal({
  open,
  onOpenChange,
  sceneNumber,
  sceneText,
  sceneImage,
  onVideoGenerated
}: VideoGenerationModalProps) {
  const { deduct, usePlatformCredits } = useCreditDeduction();
  
  const [selectedModel, setSelectedModel] = useState('veo31-fast');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16' | '1:1'>('16:9');
  const [customPrompt, setCustomPrompt] = useState('');
  const [status, setStatus] = useState<GenerationStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const selectedModelData = VIDEO_MODELS.find(m => m.id === selectedModel);
  const creditCost = selectedModelData?.credits || 50;

  // Timer para mostrar tempo decorrido
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (status === 'processing') {
      interval = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    } else {
      setElapsedSeconds(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [status]);

  // Polling para verificar status do job
  const pollJobStatus = useCallback(async (id: string) => {
    let attempts = 0;
    const maxAttempts = 120; // 10 minutos (5s x 120)
    
    const poll = async () => {
      if (attempts >= maxAttempts) {
        setStatus('failed');
        setError('Timeout: O vídeo está demorando mais que o esperado. Tente novamente.');
        return;
      }

      try {
        const { data, error: fnError } = await supabase.functions.invoke('n8n-video-status', {
          body: {},
        });

        // Buscar pelo job_id específico via query param
        const response = await supabase.functions.invoke('n8n-video-status', {
          body: { job_id: id },
        });

        if (response.error) {
          attempts++;
          setTimeout(poll, 5000);
          return;
        }

        const job = response.data?.job;
        if (!job) {
          attempts++;
          setTimeout(poll, 5000);
          return;
        }

        if (job.status === 'completed' && job.video_url) {
          setStatus('completed');
          setGeneratedVideo(job.video_url);
          setProgress(100);
          toast.success('Vídeo gerado com sucesso!');
          onVideoGenerated?.(sceneNumber, job.video_url);
          return;
        }

        if (job.status === 'failed') {
          setStatus('failed');
          setError(job.error_message || 'Falha na geração do vídeo');
          return;
        }

        // Ainda processando
        const elapsed = job.elapsed_seconds || 0;
        const estimatedTotal = selectedModel.includes('fast') ? 120 : 300;
        setProgress(Math.min(95, Math.round((elapsed / estimatedTotal) * 100)));
        
        attempts++;
        setTimeout(poll, 5000);
      } catch (err) {
        console.error('[VideoGeneration] Poll error:', err);
        attempts++;
        setTimeout(poll, 5000);
      }
    };

    poll();
  }, [selectedModel, sceneNumber, onVideoGenerated]);

  const generateVideoPrompt = () => {
    if (customPrompt.trim()) return customPrompt;
    return `Cinematic video scene: ${sceneText}. High quality, smooth motion, professional cinematography, 4K resolution.`;
  };

  const handleGenerate = async () => {
    setError(null);
    setStatus('submitting');
    setProgress(5);

    try {
      // Deduzir créditos
      const deductResult = await deduct({
        operationType: 'video_generation',
        customAmount: creditCost,
        details: { model: selectedModel, sceneNumber },
        showToast: false
      });

      if (!deductResult.success) {
        throw new Error('Créditos insuficientes para gerar vídeo');
      }

      setProgress(15);

      const prompt = generateVideoPrompt();

      // Chamar edge function
      const { data, error: fnError } = await supabase.functions.invoke('generate-video-laozhang', {
        body: {
          prompt,
          model: selectedModel,
          aspect_ratio: aspectRatio,
          resolution: '1080p'
        }
      });

      setProgress(30);

      if (fnError) {
        throw new Error(fnError.message || 'Erro ao gerar vídeo');
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      // Se está processando via n8n, iniciar polling
      if (data?.status === 'processing' && data?.job_id) {
        setStatus('processing');
        setJobId(data.job_id);
        setProgress(35);
        toast.info('Vídeo em processamento no n8n. Acompanhe o progresso...');
        pollJobStatus(data.job_id);
        return;
      }

      // Se retornou vídeo diretamente
      if (data?.video_url) {
        setStatus('completed');
        setGeneratedVideo(data.video_url);
        setProgress(100);
        toast.success('Vídeo gerado com sucesso!');
        onVideoGenerated?.(sceneNumber, data.video_url);
      }

    } catch (err: any) {
      console.error('[VideoGeneration] Error:', err);
      setStatus('failed');
      setError(err.message || 'Erro ao gerar vídeo');
      toast.error(err.message || 'Erro ao gerar vídeo');
    }
  };

  const handleDownload = () => {
    if (!generatedVideo) return;
    const a = document.createElement('a');
    a.href = generatedVideo;
    a.download = `cena_${sceneNumber}_video.mp4`;
    a.click();
  };

  const formatElapsed = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

  const resetState = () => {
    setStatus('idle');
    setProgress(0);
    setGeneratedVideo(null);
    setError(null);
    setJobId(null);
    setElapsedSeconds(0);
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Video className="w-5 h-5 text-primary" />
            Gerar Vídeo - Cena {sceneNumber}
            <Badge variant="secondary" className="ml-2">
              <Sparkles className="w-3 h-3 mr-1" />
              AI Video
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Preview da cena */}
          <div className="flex gap-4">
            {sceneImage && (
              <img 
                src={sceneImage} 
                alt={`Cena ${sceneNumber}`}
                className="w-40 h-24 object-cover rounded-lg border border-border/50"
              />
            )}
            <div className="flex-1">
              <p className="text-sm text-muted-foreground line-clamp-3">
                {sceneText}
              </p>
            </div>
          </div>

          {/* Seleção de modelo */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Modelo de IA</Label>
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VIDEO_MODELS.map(model => (
                    <SelectItem key={model.id} value={model.id}>
                      <div className="flex items-center justify-between w-full gap-2">
                        <span>{model.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {model.credits} créditos
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedModelData && (
                <p className="text-xs text-muted-foreground">
                  {selectedModelData.description} • Duração: {selectedModelData.duration}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Proporção</Label>
              <Select value={aspectRatio} onValueChange={(v: '16:9' | '9:16' | '1:1') => setAspectRatio(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="16:9">16:9 (Paisagem)</SelectItem>
                  <SelectItem value="9:16">9:16 (Retrato/Shorts)</SelectItem>
                  <SelectItem value="1:1">1:1 (Quadrado)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Prompt customizado */}
          <div className="space-y-2">
            <Label>Prompt personalizado (opcional)</Label>
            <Textarea
              placeholder="Deixe vazio para gerar automaticamente baseado na cena..."
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Custo */}
          <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
            <div className="flex items-center gap-2">
              <Coins className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Custo estimado</span>
            </div>
            <div className="flex items-center gap-2">
              {usePlatformCredits === false ? (
                <Badge variant="outline" className="text-emerald-400 border-emerald-500/50">
                  Usando sua API - Sem consumo
                </Badge>
              ) : (
                <Badge variant="default">
                  {creditCost} créditos
                </Badge>
              )}
            </div>
          </div>

          {/* Progress - Status based */}
          {(status === 'submitting' || status === 'processing') && (
            <div className="space-y-3 p-4 bg-primary/10 rounded-lg border border-primary/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 text-primary animate-spin" />
                  <span className="text-sm font-medium text-foreground">
                    {status === 'submitting' ? 'Enviando para n8n...' : 'Processando vídeo...'}
                  </span>
                </div>
                {status === 'processing' && (
                  <div className="flex items-center gap-2 px-2 py-1 bg-primary/20 rounded-md">
                    <Clock className="w-3.5 h-3.5 text-primary" />
                    <span className="text-sm font-mono font-bold text-primary">
                      {formatElapsed(elapsedSeconds)}
                    </span>
                  </div>
                )}
              </div>
              <Progress value={progress} className="h-2" />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{progress}% concluído</span>
                {jobId && (
                  <span className="font-mono text-[10px] opacity-70">Job: {jobId.slice(0, 8)}...</span>
                )}
              </div>
              {status === 'processing' && (
                <p className="text-xs text-muted-foreground text-center">
                  ⏱️ Tempo estimado: {selectedModel.includes('fast') ? '~2 minutos' : '~5 minutos'}
                </p>
              )}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
              <AlertCircle className="w-4 h-4 text-destructive" />
              <p className="text-sm text-destructive flex-1">{error}</p>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={resetState}
                className="text-xs"
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Tentar novamente
              </Button>
            </div>
          )}

          {/* Video preview - Success */}
          {status === 'completed' && generatedVideo && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <Label className="text-green-400">Vídeo gerado com sucesso!</Label>
              </div>
              <div className="relative aspect-video bg-black rounded-lg overflow-hidden border border-green-500/30">
                <video 
                  src={generatedVideo} 
                  controls 
                  autoPlay
                  className="w-full h-full"
                  poster={sceneImage}
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          {status === 'completed' && generatedVideo ? (
            <>
              <Button variant="outline" onClick={resetState}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Gerar Novo
              </Button>
              <Button onClick={handleDownload} className="bg-green-600 hover:bg-green-700">
                <Download className="w-4 h-4 mr-2" />
                Baixar Vídeo
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleGenerate} 
                disabled={status === 'submitting' || status === 'processing'}
                className="bg-gradient-to-r from-primary to-purple-500"
              >
                {status === 'submitting' || status === 'processing' ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {status === 'submitting' ? 'Enviando...' : 'Processando...'}
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Gerar Vídeo
                  </>
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

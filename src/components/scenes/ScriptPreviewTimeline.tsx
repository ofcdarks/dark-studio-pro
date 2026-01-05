import { useMemo, useState } from "react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Clock, FileText, Scissors, Timer, AlertTriangle, CheckCircle2, TrendingDown, Sparkles, Loader2, RefreshCw, ImagePlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";

interface GeneratedScene {
  number: number;
  text: string;
  wordCount: number;
  durationSeconds: number;
  generatedImage?: string;
  emotion?: string;
  retentionTrigger?: string;
}

interface ScriptPreviewTimelineProps {
  script: string;
  wordsPerScene: number;
  wpm: number;
  className?: string;
  onSyncAudio?: (newWpm: number) => void;
  generatedScenes?: GeneratedScene[];
  onImproveScenes?: (sceneNumbers: number[], improvementType: string, regenerateImages?: boolean) => void;
  onGenerateMissingImages?: (sceneNumbers: number[]) => void;
  isGeneratingImages?: boolean;
}

interface PreviewScene {
  number: number;
  text: string;
  wordCount: number;
  durationSeconds: number;
  startTime: number;
  endTime: number;
  generatedImage?: string;
  emotion?: string;
  retentionTrigger?: string;
}

// Mapeamento de emoções para cores
const EMOTION_COLORS: Record<string, { bg: string; text: string; icon: string }> = {
  tensão: { bg: 'bg-red-500/20', text: 'text-red-400', icon: '🔥' },
  tension: { bg: 'bg-red-500/20', text: 'text-red-400', icon: '🔥' },
  surpresa: { bg: 'bg-amber-500/20', text: 'text-amber-400', icon: '😲' },
  surprise: { bg: 'bg-amber-500/20', text: 'text-amber-400', icon: '😲' },
  medo: { bg: 'bg-purple-500/20', text: 'text-purple-400', icon: '😨' },
  fear: { bg: 'bg-purple-500/20', text: 'text-purple-400', icon: '😨' },
  admiração: { bg: 'bg-blue-500/20', text: 'text-blue-400', icon: '✨' },
  admiration: { bg: 'bg-blue-500/20', text: 'text-blue-400', icon: '✨' },
  choque: { bg: 'bg-rose-500/20', text: 'text-rose-400', icon: '⚡' },
  shock: { bg: 'bg-rose-500/20', text: 'text-rose-400', icon: '⚡' },
  curiosidade: { bg: 'bg-cyan-500/20', text: 'text-cyan-400', icon: '🔍' },
  curiosity: { bg: 'bg-cyan-500/20', text: 'text-cyan-400', icon: '🔍' },
  neutral: { bg: 'bg-gray-500/20', text: 'text-gray-400', icon: '○' },
};

// Mapeamento de gatilhos de retenção para cores
const TRIGGER_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  curiosidade: { bg: 'bg-cyan-500/30', text: 'text-cyan-300', label: 'Curiosidade' },
  curiosity: { bg: 'bg-cyan-500/30', text: 'text-cyan-300', label: 'Curiosidade' },
  quebra_padrão: { bg: 'bg-amber-500/30', text: 'text-amber-300', label: 'Quebra' },
  pattern_break: { bg: 'bg-amber-500/30', text: 'text-amber-300', label: 'Quebra' },
  antecipação: { bg: 'bg-purple-500/30', text: 'text-purple-300', label: 'Antecipação' },
  anticipation: { bg: 'bg-purple-500/30', text: 'text-purple-300', label: 'Antecipação' },
  revelação: { bg: 'bg-rose-500/30', text: 'text-rose-300', label: 'Revelação' },
  revelation: { bg: 'bg-rose-500/30', text: 'text-rose-300', label: 'Revelação' },
  mistério: { bg: 'bg-indigo-500/30', text: 'text-indigo-300', label: 'Mistério' },
  mystery: { bg: 'bg-indigo-500/30', text: 'text-indigo-300', label: 'Mistério' },
  continuity: { bg: 'bg-gray-500/30', text: 'text-gray-300', label: 'Continua' },
};

const getEmotionStyle = (emotion?: string) => {
  if (!emotion) return EMOTION_COLORS.neutral;
  const key = emotion.toLowerCase().trim();
  return EMOTION_COLORS[key] || EMOTION_COLORS.neutral;
};

const getTriggerStyle = (trigger?: string) => {
  if (!trigger) return TRIGGER_COLORS.continuity;
  const key = trigger.toLowerCase().trim().replace(/ /g, '_');
  return TRIGGER_COLORS[key] || TRIGGER_COLORS.continuity;
};

const formatTime = (seconds: number): string => {
  // Mostra mais precisão em cenas curtas para evitar que tudo pareça igual
  if (seconds < 60) {
    return `${seconds.toFixed(1)}s`;
  }
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${mins}m${String(secs).padStart(2, "0")}s`;
};

const formatTimecode = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

// Dividir script em cenas estimadas baseado em palavras
function estimateScenes(script: string, wordsPerScene: number, wpm: number): PreviewScene[] {
  const words = script.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];

  const scenes: PreviewScene[] = [];
  let currentTime = 0;
  let sceneNumber = 1;
  
  // Dividir em chunks de aproximadamente wordsPerScene palavras
  for (let i = 0; i < words.length; i += wordsPerScene) {
    const sceneWords = words.slice(i, i + wordsPerScene);
    const text = sceneWords.join(' ');
    const wordCount = sceneWords.length;
    const durationSeconds = (wordCount / wpm) * 60;
    
    scenes.push({
      number: sceneNumber++,
      text,
      wordCount,
      durationSeconds,
      startTime: currentTime,
      endTime: currentTime + durationSeconds,
    });
    
    currentTime += durationSeconds;
  }
  
  return scenes;
}

export function ScriptPreviewTimeline({ 
  script, 
  wordsPerScene, 
  wpm, 
  className = "",
  onSyncAudio,
  generatedScenes = [],
  onImproveScenes,
  onGenerateMissingImages,
  isGeneratingImages = false
}: ScriptPreviewTimelineProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [audioDuration, setAudioDuration] = useState("");
  const [isImproving, setIsImproving] = useState(false);
  const [regenerateAfterImprove, setRegenerateAfterImprove] = useState(true);
  
  // Se há cenas geradas, usa elas (com timecodes corretos)
  // Senão, estima baseado em palavras por cena
  const previewScenes = useMemo(() => {
    if (generatedScenes.length > 0) {
      // Usar as cenas geradas com seus timecodes reais
      let currentTime = 0;
      return generatedScenes.map((scene, index) => {
        const startTime = currentTime;
        const endTime = currentTime + scene.durationSeconds;
        currentTime = endTime;
        return {
          number: scene.number,
          text: scene.text,
          wordCount: scene.wordCount,
          durationSeconds: scene.durationSeconds,
          startTime,
          endTime,
          generatedImage: scene.generatedImage,
          emotion: scene.emotion,
          retentionTrigger: scene.retentionTrigger
        };
      });
    }
    return estimateScenes(script, wordsPerScene, wpm);
  }, [script, wordsPerScene, wpm, generatedScenes]);
  
  const totalDuration = useMemo(() => 
    previewScenes.reduce((acc, scene) => acc + scene.durationSeconds, 0), 
    [previewScenes]
  );
  
  const totalWords = useMemo(() => 
    previewScenes.reduce((acc, scene) => acc + scene.wordCount, 0), 
    [previewScenes]
  );

  const timelineData = useMemo(() => {
    return previewScenes.map(scene => ({
      ...scene,
      widthPercent: Math.max((scene.durationSeconds / totalDuration) * 100, 2),
    }));
  }, [previewScenes, totalDuration]);

  // Gerar marcadores de tempo
  const timeMarkers = useMemo(() => {
    if (totalDuration === 0) return [0];
    const markers: number[] = [0];
    const interval = totalDuration <= 60 ? 10 : totalDuration <= 180 ? 30 : 60;
    for (let t = interval; t < totalDuration; t += interval) {
      markers.push(t);
    }
    markers.push(totalDuration);
    return markers;
  }, [totalDuration]);

  // ANÁLISE DE RETENÇÃO - Detectar problemas
  const retentionAnalysis = useMemo(() => {
    if (previewScenes.length === 0) return null;
    
    const issues: Array<{
      type: 'warning' | 'danger';
      message: string;
      scenes: number[];
      suggestion: string;
      improvementType: string;
    }> = [];
    
    // Detectar cenas sem emoção ou com emoção neutral consecutivas
    let neutralStreak: number[] = [];
    previewScenes.forEach((scene, index) => {
      const emotion = scene.emotion?.toLowerCase().trim();
      const isNeutral = !emotion || emotion === 'neutral' || emotion === '';
      
      if (isNeutral) {
        neutralStreak.push(scene.number);
      } else {
        if (neutralStreak.length >= 2) {
          issues.push({
            type: neutralStreak.length >= 3 ? 'danger' : 'warning',
            message: `${neutralStreak.length} cenas consecutivas sem emoção definida`,
            scenes: [...neutralStreak],
            suggestion: 'Adicionar tensão, surpresa ou curiosidade nestas cenas',
            improvementType: 'add_emotion'
          });
        }
        neutralStreak = [];
      }
    });
    // Verificar streak final
    if (neutralStreak.length >= 2) {
      issues.push({
        type: neutralStreak.length >= 3 ? 'danger' : 'warning',
        message: `${neutralStreak.length} cenas sem emoção no final do vídeo`,
        scenes: [...neutralStreak],
        suggestion: 'Adicionar clímax emocional ou reflexão impactante',
        improvementType: 'add_emotion_ending'
      });
    }
    
    // Detectar cenas sem gatilho de retenção consecutivas
    let noTriggerStreak: number[] = [];
    previewScenes.forEach((scene, index) => {
      const trigger = scene.retentionTrigger?.toLowerCase().trim();
      const hasTrigger = trigger && trigger !== 'continuity' && trigger !== '';
      
      if (!hasTrigger) {
        noTriggerStreak.push(scene.number);
      } else {
        if (noTriggerStreak.length >= 3) {
          issues.push({
            type: 'warning',
            message: `${noTriggerStreak.length} cenas sem gatilhos de retenção`,
            scenes: [...noTriggerStreak],
            suggestion: 'Inserir micro-cliffhangers ou perguntas retóricas',
            improvementType: 'add_triggers'
          });
        }
        noTriggerStreak = [];
      }
    });
    if (noTriggerStreak.length >= 3) {
      issues.push({
        type: 'warning',
        message: `${noTriggerStreak.length} cenas finais sem gatilhos`,
        scenes: [...noTriggerStreak],
        suggestion: 'Criar antecipação ou deixar pergunta aberta',
        improvementType: 'add_triggers_ending'
      });
    }
    
    // Detectar cenas muito longas (>10s)
    const longScenes = previewScenes.filter(s => s.durationSeconds > 10);
    if (longScenes.length > 0) {
      issues.push({
        type: 'warning',
        message: `${longScenes.length} cena(s) com mais de 10 segundos`,
        scenes: longScenes.map(s => s.number),
        suggestion: 'Dividir em cortes mais rápidos de 5-8 segundos',
        improvementType: 'split_long_scenes'
      });
    }
    
    // Detectar introdução sem impacto (primeiras 3 cenas sem emoção forte)
    const first3Scenes = previewScenes.slice(0, 3);
    const strongEmotions = ['tensão', 'tension', 'choque', 'shock', 'surpresa', 'surprise', 'curiosidade', 'curiosity'];
    const hasStrongHook = first3Scenes.some(s => 
      s.emotion && strongEmotions.includes(s.emotion.toLowerCase().trim())
    );
    if (!hasStrongHook && previewScenes.length >= 3) {
      issues.push({
        type: 'danger',
        message: 'As 3 primeiras cenas não têm emoção de impacto',
        scenes: [1, 2, 3],
        suggestion: 'Criar hook com choque, mistério ou promessa ousada',
        improvementType: 'improve_hook'
      });
    }
    
    // Calcular score de retenção estimado
    const scenesWithEmotion = previewScenes.filter(s => s.emotion && s.emotion !== 'neutral').length;
    const scenesWithTrigger = previewScenes.filter(s => s.retentionTrigger && s.retentionTrigger !== 'continuity').length;
    const scenesInGoodDuration = previewScenes.filter(s => s.durationSeconds >= 3 && s.durationSeconds <= 8).length;
    
    const emotionScore = (scenesWithEmotion / previewScenes.length) * 40;
    const triggerScore = (scenesWithTrigger / previewScenes.length) * 35;
    const durationScore = (scenesInGoodDuration / previewScenes.length) * 25;
    const totalScore = Math.round(emotionScore + triggerScore + durationScore);
    
    return {
      issues,
      score: totalScore,
      scenesWithEmotion,
      scenesWithTrigger,
      scenesInGoodDuration,
      totalScenes: previewScenes.length
    };
  }, [previewScenes]);

  // As imagens já estão incluídas no previewScenes quando há cenas geradas

  // Formatar input de tempo enquanto digita (máscara MM:SS) e sincronizar automaticamente
  const handleDurationChange = (value: string) => {
    // Remove tudo que não for número
    const numbersOnly = value.replace(/\D/g, '');
    
    let formattedValue = numbersOnly;
    if (numbersOnly.length > 2) {
      // Formata como MM:SS
      const mins = numbersOnly.slice(0, -2) || '0';
      const secs = numbersOnly.slice(-2);
      formattedValue = `${mins}:${secs}`;
    }
    
    setAudioDuration(formattedValue);
    
    // Auto-sincronizar se tiver formato válido (pelo menos 3 dígitos = M:SS)
    if (numbersOnly.length >= 3 && onSyncAudio) {
      const mins = parseInt(numbersOnly.slice(0, -2)) || 0;
      const secs = parseInt(numbersOnly.slice(-2)) || 0;
      const durationSeconds = mins * 60 + secs;
      
      if (durationSeconds > 0 && totalWords > 0) {
        const calculatedWpm = Math.round(totalWords / (durationSeconds / 60));
        const clampedWpm = Math.max(80, Math.min(250, calculatedWpm));
        onSyncAudio(clampedWpm);
      }
    }
  };

  // Limpar e mostrar toast de confirmação
  const handleApplySync = () => {
    if (!audioDuration.trim()) {
      toast.error("Insira a duração do áudio");
      return;
    }

    let durationSeconds = 0;
    
    if (audioDuration.includes(":")) {
      const parts = audioDuration.split(":");
      const mins = parseInt(parts[0]) || 0;
      const secs = parseInt(parts[1]) || 0;
      durationSeconds = mins * 60 + secs;
    } else {
      durationSeconds = parseFloat(audioDuration) || 0;
    }
    
    if (durationSeconds <= 0) {
      toast.error("Duração inválida");
      return;
    }
    
    const calculatedWpm = Math.round(totalWords / (durationSeconds / 60));
    const clampedWpm = Math.max(80, Math.min(250, calculatedWpm));
    
    toast.success(`WPM sincronizado: ${clampedWpm} (${totalWords} palavras em ${formatTimecode(durationSeconds)})`);
  };

  if (!script.trim() || previewScenes.length === 0) {
    return null;
  }

  // Calcular cenas sem imagem
  const missingScenesCount = useMemo(() => {
    if (generatedScenes.length === 0) return 0;
    return generatedScenes.filter(s => !s.generatedImage).length;
  }, [generatedScenes]);

  const missingSceneNumbers = useMemo(() => {
    if (generatedScenes.length === 0) return [];
    return generatedScenes.filter(s => !s.generatedImage).map(s => s.number);
  }, [generatedScenes]);

  return (
    <Card className={`p-4 border-dashed border-primary/30 bg-primary/5 ${className}`}>
      {/* Header com Sync integrado */}
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Scissors className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-foreground">Preview da Timeline</span>
          <Badge variant="outline" className="text-xs">
            {generatedScenes.length > 0 ? `${generatedScenes.filter(s => s.generatedImage).length}/${generatedScenes.length} imagens` : 'Estimativa'}
          </Badge>
          {missingScenesCount > 0 && (
            <Badge variant="outline" className="text-xs bg-amber-500/20 text-amber-400 border-amber-500/40">
              {missingScenesCount} faltando
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Botão Gerar 100% */}
          {missingScenesCount > 0 && onGenerateMissingImages && (
            <Button
              size="sm"
              className="h-7 text-xs bg-green-600 hover:bg-green-700 text-white"
              disabled={isGeneratingImages}
              onClick={() => {
                onGenerateMissingImages(missingSceneNumbers);
                toast.success(`Gerando ${missingScenesCount} imagens faltantes para completar 100%...`);
              }}
            >
              {isGeneratingImages ? (
                <>
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <ImagePlus className="w-3 h-3 mr-1" />
                  Gerar 100%
                </>
              )}
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? <EyeOff className="w-3 h-3 mr-1" /> : <Eye className="w-3 h-3 mr-1" />}
            {showDetails ? "Ocultar" : "Detalhes"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? "Recolher" : "Expandir"}
          </Button>
        </div>
      </div>

      {/* Sync Audio Input - sempre visível */}
      {onSyncAudio && (
        <div className="mb-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <Label className="text-xs text-muted-foreground mb-1 block">
                <Timer className="w-3 h-3 inline mr-1" />
                Sincronizar com duração do áudio (MM:SS)
              </Label>
              <Input
                placeholder="Ex: 05:30"
                value={audioDuration}
                onChange={(e) => handleDurationChange(e.target.value)}
                className="h-8 text-sm bg-background"
                onKeyDown={(e) => e.key === 'Enter' && handleApplySync()}
              />
            </div>
            <Button
              size="sm"
              onClick={handleApplySync}
              className="h-8 bg-amber-500 hover:bg-amber-600 text-black"
              disabled={!audioDuration.trim()}
            >
              Confirmar
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground mt-2">
            Digite a duração e o WPM será recalculado automaticamente para encaixar o roteiro no tempo do áudio.
          </p>
        </div>
      )}

      {/* Stats + Score de Retenção */}
      <div className="flex flex-wrap items-center gap-6 mb-4 py-2 px-3 bg-secondary/50 rounded-lg border border-border/30">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-foreground">{totalWords}</span>
          <span className="text-sm text-muted-foreground">palavras</span>
        </div>
        <div className="flex items-center gap-2">
          <Scissors className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-foreground">~{previewScenes.length}</span>
          <span className="text-sm text-muted-foreground">cenas</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary" />
          <span className="text-sm font-bold text-primary">{formatTime(totalDuration)}</span>
          <span className="text-sm text-muted-foreground">@ {wpm} WPM</span>
        </div>
        
        {/* Score de Retenção */}
        {retentionAnalysis && generatedScenes.length > 0 && (
          <div className="flex items-center gap-3 ml-auto">
            <span className="text-sm text-muted-foreground">Retenção:</span>
            <Badge 
              className={`text-sm font-bold px-3 py-1 ${
                retentionAnalysis.score >= 80 
                  ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                  : retentionAnalysis.score >= 60 
                    ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                    : 'bg-red-500/20 text-red-400 border-red-500/30'
              }`}
            >
              {retentionAnalysis.score >= 80 ? <CheckCircle2 className="w-4 h-4 mr-1" /> : 
               retentionAnalysis.score >= 60 ? <AlertTriangle className="w-4 h-4 mr-1" /> :
               <TrendingDown className="w-4 h-4 mr-1" />}
              {retentionAnalysis.score}%
            </Badge>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-muted-foreground cursor-help">ⓘ</span>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <p className="font-medium mb-1">Análise de Retenção</p>
                  <ul className="text-xs space-y-0.5">
                    <li>✓ {retentionAnalysis.scenesWithEmotion}/{retentionAnalysis.totalScenes} cenas com emoção</li>
                    <li>✓ {retentionAnalysis.scenesWithTrigger}/{retentionAnalysis.totalScenes} cenas com gatilho</li>
                    <li>✓ {retentionAnalysis.scenesInGoodDuration}/{retentionAnalysis.totalScenes} cenas com duração ideal (3-8s)</li>
                  </ul>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}
      </div>

      {/* Alertas de Retenção com Sugestões */}
      {retentionAnalysis && retentionAnalysis.issues.length > 0 && generatedScenes.length > 0 && (
        <div className="mb-4 space-y-3">
          {/* Opção de regenerar imagens */}
          {onImproveScenes && (
            <div className="flex items-center justify-between p-3 bg-primary/10 border border-primary/30 rounded-lg">
              <div className="flex items-center gap-3">
                <Checkbox
                  id="regenerate-images"
                  checked={regenerateAfterImprove}
                  onCheckedChange={(checked) => setRegenerateAfterImprove(checked === true)}
                  className="w-5 h-5"
                />
                <label htmlFor="regenerate-images" className="text-sm text-foreground cursor-pointer flex items-center gap-2 font-medium">
                  <RefreshCw className="w-4 h-4 text-primary" />
                  Regenerar imagens automaticamente após melhorar
                </label>
              </div>
              <Badge variant="outline" className="text-xs text-primary border-primary/40 px-3 py-1">
                Sincronizado com narração
              </Badge>
            </div>
          )}
          
          {retentionAnalysis.issues.slice(0, 3).map((issue, index) => (
            <Alert 
              key={index} 
              className={`py-3 px-4 ${
                issue.type === 'danger' 
                  ? 'border-red-500/50 bg-red-500/15' 
                  : 'border-amber-500/50 bg-amber-500/15'
              }`}
            >
              <div className="flex items-center justify-between w-full gap-4">
                <div className="flex items-center gap-3 flex-1">
                  <AlertTriangle className={`w-5 h-5 flex-shrink-0 ${issue.type === 'danger' ? 'text-red-400' : 'text-amber-400'}`} />
                  <div className="flex-1 min-w-0">
                    <AlertDescription className="text-sm font-medium">
                      <span className={issue.type === 'danger' ? 'text-red-300' : 'text-amber-300'}>
                        {issue.message}
                      </span>
                      <span className="text-muted-foreground ml-2 text-sm">
                        (Cenas {issue.scenes.slice(0, 5).join(', ')}{issue.scenes.length > 5 ? '...' : ''})
                      </span>
                    </AlertDescription>
                    <p className="text-xs text-cyan-400 mt-1 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      💡 {issue.suggestion}
                    </p>
                  </div>
                </div>
                {onImproveScenes && (
                  <Button
                    size="sm"
                    variant="outline"
                    className={`h-9 text-xs px-4 flex-shrink-0 font-medium ${
                      issue.type === 'danger'
                        ? 'border-red-500/50 text-red-300 hover:bg-red-500/20'
                        : 'border-amber-500/50 text-amber-300 hover:bg-amber-500/20'
                    }`}
                    disabled={isImproving}
                    onClick={() => {
                      setIsImproving(true);
                      onImproveScenes(issue.scenes, issue.improvementType, regenerateAfterImprove);
                      toast.info(
                        regenerateAfterImprove 
                          ? `Melhorando e regenerando imagens das cenas ${issue.scenes.slice(0, 3).join(', ')}...`
                          : `Melhorando cenas ${issue.scenes.slice(0, 3).join(', ')}...`
                      );
                      setTimeout(() => setIsImproving(false), regenerateAfterImprove ? 10000 : 3000);
                    }}
                  >
                    {isImproving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        {regenerateAfterImprove ? <RefreshCw className="w-4 h-4 mr-1.5" /> : <Sparkles className="w-4 h-4 mr-1.5" />}
                        {regenerateAfterImprove ? 'Melhorar + Gerar' : 'Melhorar'}
                      </>
                    )}
                  </Button>
                )}
              </div>
            </Alert>
          ))}
          
          {/* Botão para melhorar todas as cenas com problemas */}
          {retentionAnalysis.issues.length > 1 && onImproveScenes && (
            <div className="flex justify-end gap-2 mt-2">
              <Button
                size="sm"
                variant="outline"
                className="h-9 text-sm font-medium border-primary/50 text-primary hover:bg-primary/20"
                disabled={isImproving}
                onClick={() => {
                  setIsImproving(true);
                  const allScenes = [...new Set(retentionAnalysis.issues.flatMap(i => i.scenes))];
                  onImproveScenes(allScenes, 'improve_all', regenerateAfterImprove);
                  toast.info(
                    regenerateAfterImprove
                      ? `Melhorando e regenerando ${allScenes.length} cenas...`
                      : `Melhorando ${allScenes.length} cenas com problemas...`
                  );
                  setTimeout(() => setIsImproving(false), regenerateAfterImprove ? 15000 : 5000);
                }}
              >
                {isImproving ? (
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                ) : regenerateAfterImprove ? (
                  <RefreshCw className="w-4 h-4 mr-1.5" />
                ) : (
                  <Sparkles className="w-4 h-4 mr-1.5" />
                )}
                {regenerateAfterImprove ? 'Melhorar + Regenerar Todas' : 'Melhorar Todas'} ({retentionAnalysis.issues.length})
              </Button>
            </div>
          )}
          
          {retentionAnalysis.issues.length > 3 && (
            <p className="text-xs text-muted-foreground mt-2">
              +{retentionAnalysis.issues.length - 3} outros alertas...
            </p>
          )}
        </div>
      )}

      {/* Timeline visual */}
      <ScrollArea className="w-full">
        <div className="min-w-[400px] pb-3">
          {/* Barra de cenas com preview de imagens */}
          <TooltipProvider delayDuration={100}>
            <div className={`flex rounded-xl overflow-hidden border-2 border-border/50 bg-background/30 shadow-lg ${isExpanded ? 'h-32' : 'h-20'}`}>
              {timelineData.map((scene, index) => {
                const sceneImage = previewScenes[index]?.generatedImage;
                const sceneEmotion = previewScenes[index]?.emotion;
                const sceneTrigger = previewScenes[index]?.retentionTrigger;
                const emotionStyle = getEmotionStyle(sceneEmotion);
                const triggerStyle = getTriggerStyle(sceneTrigger);
                
                // Cores baseadas na emoção se não houver imagem
                const emotionGradients: Record<string, string> = {
                  tensão: 'from-red-500/60 to-red-600/40',
                  tension: 'from-red-500/60 to-red-600/40',
                  surpresa: 'from-amber-500/60 to-amber-600/40',
                  surprise: 'from-amber-500/60 to-amber-600/40',
                  medo: 'from-purple-500/60 to-purple-600/40',
                  fear: 'from-purple-500/60 to-purple-600/40',
                  admiração: 'from-blue-500/60 to-blue-600/40',
                  admiration: 'from-blue-500/60 to-blue-600/40',
                  choque: 'from-rose-500/60 to-rose-600/40',
                  shock: 'from-rose-500/60 to-rose-600/40',
                  curiosidade: 'from-cyan-500/60 to-cyan-600/40',
                  curiosity: 'from-cyan-500/60 to-cyan-600/40',
                };
                
                const emotionKey = sceneEmotion?.toLowerCase().trim() || '';
                const colorClass = emotionGradients[emotionKey] || [
                  'from-primary/60 to-primary/40',
                  'from-blue-500/60 to-blue-500/40',
                  'from-green-500/60 to-green-500/40',
                  'from-amber-500/60 to-amber-500/40',
                  'from-purple-500/60 to-purple-500/40',
                ][index % 5];
                
                return (
                  <Tooltip key={scene.number}>
                    <TooltipTrigger asChild>
                      <div
                        className={`
                          relative flex flex-col items-center justify-end
                          ${sceneImage ? '' : `bg-gradient-to-b ${colorClass}`}
                          border-r border-background/20 last:border-r-0
                          cursor-pointer hover:brightness-125 transition-all
                          overflow-hidden
                        `}
                        style={{ width: `${scene.widthPercent}%`, minWidth: '32px' }}
                      >
                        {/* Imagem de fundo se existir */}
                        {sceneImage && (
                          <img 
                            src={sceneImage} 
                            alt={`Cena ${scene.number}`}
                            className="absolute inset-0 w-full h-full object-cover"
                          />
                        )}
                        
                        {/* Badge de emoção no topo */}
                        {sceneEmotion && isExpanded && (
                          <div className={`absolute top-0.5 left-0.5 right-0.5 z-20 flex justify-center`}>
                            <span className={`text-[9px] px-1.5 py-0.5 rounded ${emotionStyle.bg} ${emotionStyle.text} font-medium truncate`}>
                              {emotionStyle.icon}
                            </span>
                          </div>
                        )}
                        
                        {/* Indicador de imagem faltando */}
                        {!sceneImage && (
                          <div className="absolute top-1 right-1 z-20">
                            <ImagePlus className="w-3 h-3 text-white/60" />
                          </div>
                        )}
                        
                        {/* Overlay com info */}
                        <div className={`relative z-10 w-full text-center px-1 pb-1.5 ${sceneImage ? 'bg-gradient-to-t from-black/85 to-transparent pt-8' : ''}`}>
                          <span className={`font-bold text-white drop-shadow-lg ${isExpanded ? 'text-base' : 'text-xs'}`}>
                            {scene.number}
                          </span>
                          <span className={`block text-white/95 font-medium drop-shadow-md ${isExpanded ? 'text-xs' : 'text-[10px]'}`}>
                            {formatTime(scene.durationSeconds)}
                          </span>
                          {isExpanded && (
                            <>
                              <span className="block text-[10px] text-white/85 drop-shadow font-mono">
                                {formatTimecode(scene.startTime)}
                              </span>
                              {/* Badge de gatilho de retenção */}
                              {sceneTrigger && (
                                <span className={`inline-block mt-0.5 text-[8px] px-1.5 py-0.5 rounded ${triggerStyle.bg} ${triggerStyle.text} font-medium`}>
                                  {triggerStyle.label}
                                </span>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-lg p-0 overflow-hidden shadow-xl border-primary/30">
                      <div className="flex gap-0">
                        {/* Preview da imagem no tooltip - MAIOR */}
                        {sceneImage && (
                          <img 
                            src={sceneImage} 
                            alt={`Cena ${scene.number}`}
                            className="w-44 h-28 object-cover flex-shrink-0"
                          />
                        )}
                        <div className="p-3 space-y-2 min-w-[220px] max-w-[280px]">
                          {/* Header com número e emoção */}
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-bold text-base text-foreground">
                              Cena {scene.number}
                            </p>
                            {sceneEmotion && (
                              <span className={`text-xs px-2 py-1 rounded-full font-medium ${emotionStyle.bg} ${emotionStyle.text}`}>
                                {emotionStyle.icon} {sceneEmotion}
                              </span>
                            )}
                          </div>
                          
                          {/* Timecode */}
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-muted-foreground">⏱️</span>
                            <span className="text-foreground font-medium">
                              {formatTimecode(scene.startTime)} → {formatTimecode(scene.endTime)}
                            </span>
                          </div>
                          
                          {/* Duração e palavras */}
                          <div className="flex items-center gap-3 text-sm">
                            <span className="text-primary font-bold">{formatTime(scene.durationSeconds)}</span>
                            <span className="text-muted-foreground">•</span>
                            <span className="text-muted-foreground">{scene.wordCount} palavras</span>
                          </div>
                          
                          {/* Gatilho de retenção */}
                          {sceneTrigger && (
                            <div className="flex items-center gap-2 pt-1">
                              <span className="text-xs text-muted-foreground">Gatilho:</span>
                              <span className={`text-xs px-2 py-1 rounded ${triggerStyle.bg} ${triggerStyle.text} font-medium`}>
                                🔁 {triggerStyle.label}
                              </span>
                            </div>
                          )}
                          
                          {/* Texto da narração */}
                          <div className="border-t border-border/50 pt-2 mt-2">
                            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                              "{scene.text.substring(0, 120)}{scene.text.length > 120 ? '...' : ''}"
                            </p>
                          </div>
                        </div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          </TooltipProvider>

          {/* Marcadores de tempo */}
          <div className="relative h-4 mt-1">
            {timeMarkers.map((time, i) => {
              const position = (time / totalDuration) * 100;
              return (
                <div 
                  key={i}
                  className="absolute flex flex-col items-center"
                  style={{ 
                    left: `${position}%`,
                    transform: i === timeMarkers.length - 1 ? 'translateX(-100%)' : 
                               i === 0 ? 'translateX(0)' : 'translateX(-50%)'
                  }}
                >
                  <div className="w-px h-1 bg-muted-foreground/40" />
                  <span className="text-[8px] text-muted-foreground">
                    {formatTimecode(time)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {/* Detalhes expandidos - mostra duração, emoção e gatilho de cada cena */}
      {showDetails && (
        <div className="mt-3 pt-3 border-t border-border/50 max-h-72 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
            {previewScenes.map((scene) => {
              const emotionStyle = getEmotionStyle(scene.emotion);
              const triggerStyle = getTriggerStyle(scene.retentionTrigger);
              
              return (
                <div 
                  key={scene.number}
                  className="flex items-start gap-2 p-2 rounded bg-secondary/30 border border-border/30"
                >
                  {/* Mini preview da imagem */}
                  <div className="relative flex-shrink-0">
                    {scene.generatedImage ? (
                      <img 
                        src={scene.generatedImage} 
                        alt={`Cena ${scene.number}`}
                        className="w-14 h-10 object-cover rounded"
                      />
                    ) : (
                      <div className="w-14 h-10 bg-muted/50 rounded flex items-center justify-center">
                        <span className="text-lg font-bold text-primary">{scene.number}</span>
                      </div>
                    )}
                    {/* Badge de emoção sobreposto */}
                    {scene.emotion && (
                      <span className={`absolute -top-1 -right-1 text-[9px] px-1 py-0.5 rounded ${emotionStyle.bg} border border-background`}>
                        {emotionStyle.icon}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-foreground">#{scene.number}</span>
                      <Badge variant="outline" className="text-[9px] px-1 py-0">
                        {formatTimecode(scene.startTime)}
                      </Badge>
                      <span className="text-primary font-medium text-[10px]">{formatTime(scene.durationSeconds)}</span>
                    </div>
                    
                    {/* Badges de emoção e gatilho */}
                    <div className="flex items-center gap-1 flex-wrap">
                      {scene.emotion && (
                        <span className={`text-[9px] px-1.5 py-0.5 rounded ${emotionStyle.bg} ${emotionStyle.text}`}>
                          {emotionStyle.icon} {scene.emotion}
                        </span>
                      )}
                      {scene.retentionTrigger && (
                        <span className={`text-[9px] px-1.5 py-0.5 rounded ${triggerStyle.bg} ${triggerStyle.text}`}>
                          🔁 {triggerStyle.label}
                        </span>
                      )}
                    </div>
                    
                    <p className="text-muted-foreground line-clamp-1 text-[10px]">
                      {scene.wordCount}w • {scene.text.substring(0, 40)}...
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Info */}
      <p className="text-[10px] text-muted-foreground mt-2">
        💡 Esta é uma estimativa. A IA ajustará os cortes baseada em transições narrativas naturais.
      </p>
    </Card>
  );
}
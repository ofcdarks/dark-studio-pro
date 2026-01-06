import { MainLayout } from "@/components/layout/MainLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import JSZip from "jszip";
import { Textarea } from "@/components/ui/textarea";
import { CAPCUT_TEMPLATES, TEMPLATE_CATEGORIES, CapcutTemplate } from "@/lib/capcutTemplates";
import { generateNarrationSrt } from "@/lib/srtGenerator";
import { generateFcp7XmlWithTransitions, generateXmlTutorial, TRANSITION_OPTIONS, TransitionType } from "@/lib/xmlGenerator";
import { TemplatePreview } from "@/components/capcut/TemplatePreview";
import { TransitionPreview } from "@/components/transitions/TransitionPreview";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { 
  Image as ImageIcon, 
  Wand2, 
  Copy, 
  Save, 
  History, 
  Loader2, 
  Film, 
  Clock, 
  FileText, 
  Rocket,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Eye,
  Download,
  ImagePlus,
  RefreshCw,
  Edit3,
  Check,
  X,
  DownloadCloud,
  Video,
  RotateCcw,
  Layout,
  FolderSearch,
  Timer,
  Play,
  Music,
  Volume2,
  Type
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { usePersistedState } from "@/hooks/usePersistedState";
import { useBackgroundImageGeneration } from "@/hooks/useBackgroundImageGeneration";
import { useFFmpegVideoGenerator } from "@/hooks/useFFmpegVideoGenerator";
import { SessionIndicator } from "@/components/ui/session-indicator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useActivityLog } from "@/hooks/useActivityLog";
import { THUMBNAIL_STYLES, THUMBNAIL_STYLE_CATEGORIES } from "@/lib/thumbnailStyles";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import logoGif from "@/assets/logo.gif";
import { SceneTimeline } from "@/components/scenes/SceneTimeline";
import { ScriptPreviewTimeline } from "@/components/scenes/ScriptPreviewTimeline";
import { SUBTITLE_STYLES, SubtitleStyle, generateSubtitleInstructions } from "@/lib/subtitleStyles";
import { DEFAULT_AUDIO_MIX, AudioMixSettings, generateAudioFolderStructure, generateAudioMixReadme } from "@/lib/audioMixConfig";
import { Slider } from "@/components/ui/slider";
import { getAllCachedImages, getCacheStats, cleanupOldCacheEntries } from "@/lib/imageCache";

// Cleanup old cache entries on app load (runs once)
cleanupOldCacheEntries();

interface CharacterDescription {
  name: string;
  description: string;
  seed: number;
}

interface ScenePrompt {
  number: number;
  text: string;
  imagePrompt: string;
  wordCount: number;
  estimatedTime?: string;
  timecode?: string; // início
  endTimecode?: string; // fim
  generatedImage?: string;
  generatingImage?: boolean;
  characterName?: string; // Personagem principal nesta cena
  emotion?: string; // Emoção dominante: tensão, surpresa, medo, admiração, choque, curiosidade
  retentionTrigger?: string; // Gatilho de retenção: curiosidade, quebra_padrão, antecipação, revelação, mistério
}

interface SceneHistory {
  id: string;
  title: string | null;
  script: string;
  total_scenes: number;
  total_words: number;
  estimated_duration: string | null;
  model_used: string | null;
  style: string | null;
  scenes: ScenePrompt[];
  credits_used: number;
  created_at: string;
}

const AI_MODELS = [
  { value: "gpt-4o", label: "GPT-4o" },
  { value: "claude-sonnet-4-20250514", label: "Claude 4 Sonnet" },
  { value: "gemini-2.5-pro-preview-06-05", label: "Gemini 2.5 Pro" },
];

// Opções de velocidade de narração (WPM)
const NARRATION_SPEEDS = [
  { value: "120", label: "Lenta (120 WPM)", description: "Narração pausada, mais tempo por cena" },
  { value: "140", label: "Normal (140 WPM)", description: "Ritmo natural de fala" },
  { value: "150", label: "Padrão SRT (150 WPM)", description: "Velocidade padrão para legendas" },
  { value: "160", label: "Rápida (160 WPM)", description: "Narração dinâmica" },
  { value: "180", label: "Muito Rápida (180 WPM)", description: "Locução acelerada" },
  { value: "custom", label: "Personalizado", description: "Definir WPM manualmente" },
];

// Calcular tempo estimado baseado em palavras e WPM configurável
const calculateEstimatedTimeWithWpm = (wordCount: number, wpm: number): string => {
  const minutes = wordCount / wpm;
  if (minutes < 1) {
    return `${Math.round(minutes * 60)}s`;
  }
  const mins = Math.floor(minutes);
  const secs = Math.round((minutes - mins) * 60);
  return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
};

// Função legada para compatibilidade (usa WPM padrão)
const calculateEstimatedTime = (wordCount: number): string => {
  return calculateEstimatedTimeWithWpm(wordCount, 150);
};

const formatTimecode = (totalSeconds: number): string => {
  const s = Math.max(0, Math.floor(totalSeconds));
  const mins = Math.floor(s / 60);
  const secs = s % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
};

// Calcular timecode baseado em posição no roteiro com WPM configurável
const calculateTimecodeWithWpm = (scenes: ScenePrompt[], currentIndex: number, wpm: number): string => {
  let totalSeconds = 0;
  for (let i = 0; i < currentIndex; i++) {
    totalSeconds += (scenes[i].wordCount / wpm) * 60;
  }
  return formatTimecode(totalSeconds);
};

// Converter word count para segundos com WPM configurável
const wordCountToSecondsWithWpm = (wordCount: number, wpm: number): number => (wordCount / wpm) * 60;

const PromptsImages = () => {
  // Background image generation hook
  const { 
    state: bgState, 
    startGeneration: startBgGeneration, 
    cancelGeneration: cancelBgGeneration,
    getUpdatedScenes,
    syncScenes,
    setCharacters: setBgCharacters
  } = useBackgroundImageGeneration();

  // Estado para personagens detectados
  const [detectedCharacters, setDetectedCharacters] = usePersistedState<CharacterDescription[]>("prompts_characters", []);

  // Persisted states (sem imagens - muito grandes para localStorage)
  const [script, setScript] = usePersistedState("prompts_script", "");
  const [style, setStyle] = usePersistedState("prompts_style", "cinematic");
  const [model, setModel] = usePersistedState("prompts_model", "gpt-4o");
  const [wordsPerScene, setWordsPerScene] = usePersistedState("prompts_wordsPerScene", "80");
  
  // Cenas - persistimos apenas os prompts, não as imagens (base64 muito grande)
  const [persistedScenes, setPersistedScenes] = usePersistedState<Omit<ScenePrompt, 'generatedImage' | 'generatingImage'>[]>("prompts_scenes_meta", []);
  
  // Estado local com imagens (não persistido)
  const [generatedScenes, setGeneratedScenes] = useState<ScenePrompt[]>([]);
  
  // Sincronizar persistedScenes com generatedScenes
  useEffect(() => {
    if (persistedScenes.length > 0 && generatedScenes.length === 0) {
      setGeneratedScenes(persistedScenes.map(s => ({ ...s })));
    }
  }, [persistedScenes]);

  // Sincronizar com o estado do background quando estiver gerando ou quando voltar para a página
  useEffect(() => {
    if (bgState.isGenerating || bgState.scenes.length > 0) {
      // Atualizar cenas locais com as do background (que contém as imagens geradas)
      if (bgState.scenes.length > 0) {
        setGeneratedScenes(bgState.scenes);
        // Persistir metadados
        setPersistedScenes(bgState.scenes.map(({ generatedImage, generatingImage, ...rest }) => rest));
      }
    }
  }, [bgState.scenes, bgState.isGenerating]);
  
  // Atualizar persistedScenes quando generatedScenes mudar (sem imagens)
  const updateScenes = (scenes: ScenePrompt[]) => {
    setGeneratedScenes(scenes);
    // Persistir apenas metadados (sem imagens base64)
    setPersistedScenes(scenes.map(({ generatedImage, generatingImage, ...rest }) => rest));
    // Sincronizar com background se não estiver gerando
    if (!bgState.isGenerating) {
      syncScenes(scenes);
    }
  };
  
  // Non-persisted states
  const [generating, setGenerating] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [expandedScene, setExpandedScene] = useState<number | null>(null);
  const [expandedHistory, setExpandedHistory] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("generator");
  const [filterPending, setFilterPending] = useState(false);
  const [previewScene, setPreviewScene] = useState<ScenePrompt | null>(null);
  const [previewIndex, setPreviewIndex] = useState<number>(0);
  const [previewEditPrompt, setPreviewEditPrompt] = useState<string>("");
  const [regeneratingPreview, setRegeneratingPreview] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [progress, setProgress] = useState(0);
  const [chunkProgress, setChunkProgress] = useState<{ current: number; total: number; scenesProcessed: number }>({ current: 0, total: 0, scenesProcessed: 0 });
  const [sceneProgress, setSceneProgress] = useState<{ done: number; total: number }>({ done: 0, total: 0 });
  const [editingPromptIndex, setEditingPromptIndex] = useState<number | null>(null);
  const [editingPromptText, setEditingPromptText] = useState("");
  const [downloadingAll, setDownloadingAll] = useState(false);
  const [selectedImages, setSelectedImages] = useState<Set<number>>(() => new Set());
  
  const [showCapcutInstructions, setShowCapcutInstructions] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("clean");
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [projectName, setProjectName] = usePersistedState("prompts_project_name", "Meu Projeto");
  const [narrationSpeed, setNarrationSpeed] = usePersistedState("prompts_narration_speed", "150");
  const [customWpm, setCustomWpm] = usePersistedState("prompts_custom_wpm", "");
  const [audioDurationInput, setAudioDurationInput] = useState("");
  const [showDurationModal, setShowDurationModal] = useState(false);
  const [edlFps, setEdlFps] = usePersistedState("prompts_edl_fps", "24");
  
  // FFmpeg Video Generation states
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [videoKenBurns, setVideoKenBurns] = useState(true);
  const [videoTransitionEnabled, setVideoTransitionEnabled] = useState(true);
  const [videoTransitionType, setVideoTransitionType] = useState<"fade" | "wipeleft" | "wiperight" | "wipeup" | "wipedown" | "slideleft" | "slideright" | "zoomin" | "circleopen" | "dissolve">("fade");
  const [videoTransitionDuration, setVideoTransitionDuration] = useState("0.5");
  const [videoColorFilter, setVideoColorFilter] = useState<"warm" | "cool" | "cinematic" | "vintage" | "none">("cinematic");
  const [videoResolution, setVideoResolution] = useState<"720p" | "1080p">("1080p");
  const [generatedVideoBlob, setGeneratedVideoBlob] = useState<Blob | null>(null);
  
  // Subtitle & Audio settings
  const [selectedSubtitleStyle, setSelectedSubtitleStyle] = usePersistedState("prompts_subtitle_style", "clean-white");
  const [showSubtitleSelector, setShowSubtitleSelector] = useState(false);
  const [audioMixSettings, setAudioMixSettings] = usePersistedState<AudioMixSettings>("prompts_audio_mix", DEFAULT_AUDIO_MIX);
  const [showAudioSettings, setShowAudioSettings] = useState(false);
  const [editingCharacterIndex, setEditingCharacterIndex] = useState<number | null>(null);
  const [timecodesUpdated, setTimecodesUpdated] = useState(false);
  const [recoveringFromCache, setRecoveringFromCache] = useState(false);
  
  // SRT Preview Modal
  const [showSrtPreview, setShowSrtPreview] = useState(false);
  const [srtPreviewData, setSrtPreviewData] = useState<{ content: string; blocks: Array<{ index: number; start: string; end: string; text: string; charCount: number }> } | null>(null);
  
  // EDL Validation Modal
  const [showEdlValidationModal, setShowEdlValidationModal] = useState(false);
  const [edlValidationData, setEdlValidationData] = useState<{ missingScenes: number[]; percentage: number; totalScenes: number; withImages: number } | null>(null);
  const [selectedTransition, setSelectedTransition] = useState<TransitionType>('cross_dissolve');
  
  // FFmpeg hook
  const { generateVideo, downloadVideo, isGenerating: isGeneratingVideo, progress: videoProgress } = useFFmpegVideoGenerator();
  
  // Derivar estados de geração do background
  const generatingImages = bgState.isGenerating;
  const currentGeneratingIndex = bgState.currentSceneIndex;
  const imageBatchTotal = bgState.totalImages;
  const imageBatchDone = bgState.completedImages;
  const generationStartTime = bgState.startTime;
  
  // WPM atual baseado na velocidade selecionada ou valor personalizado
  const currentWpm = narrationSpeed === "custom" 
    ? (parseInt(customWpm) || 150) 
    : (parseInt(narrationSpeed) || 150);
  
  // Função para converter palavras em segundos usando o WPM atual
  const wordCountToSeconds = (wordCount: number): number => (wordCount / currentWpm) * 60;
  
  // Calcular total de palavras das cenas geradas
  const totalWords = generatedScenes.reduce((acc, scene) => acc + scene.wordCount, 0);
  
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { logActivity } = useActivityLog();

  // Buscar histórico de prompts de cenas
  const { data: sceneHistory, isLoading: loadingHistory } = useQuery({
    queryKey: ["scene-prompts-history", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("scene_prompts")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data || []).map(item => ({
        ...item,
        scenes: (item.scenes as unknown as ScenePrompt[]) || []
      })) as SceneHistory[];
    },
    enabled: !!user,
  });

  // Buscar prompts salvos (mantendo funcionalidade existente)
  const { data: savedPrompts } = useQuery({
    queryKey: ["saved-prompts", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("saved_prompts")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Função auxiliar para dividir texto em partes de até maxWords palavras
  const splitScriptIntoChunks = (text: string, maxWords: number): string[] => {
    const words = text.split(/\s+/).filter(Boolean);
    if (words.length <= maxWords) {
      return [text];
    }
    
    const chunks: string[] = [];
    for (let i = 0; i < words.length; i += maxWords) {
      chunks.push(words.slice(i, i + maxWords).join(' '));
    }
    return chunks;
  };

  const handleGenerate = async () => {
    if (!script.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, insira um roteiro",
        variant: "destructive",
      });
      return;
    }

    setGenerating(true);
    setGeneratedScenes([]);
    setDetectedCharacters([]);
    setBgCharacters([]);
    setProgress(0);
    
    const wordCount = script.split(/\s+/).filter(Boolean).length;
    const wordsPerSceneNum = parseInt(wordsPerScene) || 80;
    const estimatedTotalScenes = Math.ceil(wordCount / wordsPerSceneNum);
    setSceneProgress({ done: 0, total: estimatedTotalScenes });

    // Para evitar timeouts quando há 100+ cenas, limitamos o tamanho por "cenas estimadas" e por palavras
    const MAX_ESTIMATED_SCENES_PER_CHUNK = 45; // ~4-5 batches (mais seguro)
    const MAX_WORDS_PER_CHUNK = Math.min(2000, wordsPerSceneNum * MAX_ESTIMATED_SCENES_PER_CHUNK);
    
    // Dividir roteiro em partes se necessário
    const scriptChunks = splitScriptIntoChunks(script, MAX_WORDS_PER_CHUNK);
    const totalChunks = scriptChunks.length;
    
    if (totalChunks > 1) {
      toast({
        title: `Roteiro grande detectado (${wordCount} palavras)`,
        description: `Dividindo em ${totalChunks} partes para processamento...`,
      });
    }
    
    setLoadingMessage(`Analisando ${wordCount} palavras${totalChunks > 1 ? ` em ${totalChunks} partes` : ''}...`);
    setProgress(5);
    setChunkProgress({ current: 0, total: totalChunks, scenesProcessed: 0 });

    try {
      let allScenes: ScenePrompt[] = [];
      let allCharacters: CharacterDescription[] = [];
      let totalCreditsUsed = 0;
      let globalSceneNumber = 1;

      const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
      const invokeGenerateScenesWithRetry = async (body: any) => {
        for (let attempt = 1; attempt <= 2; attempt++) {
          try {
            return await supabase.functions.invoke("generate-scenes", { body });
          } catch (err: any) {
            const msg = err?.message || String(err);
            const retryable = msg.includes("Failed to fetch") || msg.includes("Failed to send") || msg.includes("timeout");
            if (attempt === 2 || !retryable) throw err;
            await sleep(1500 * attempt);
          }
        }
      };

      for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
        const chunk = scriptChunks[chunkIndex];
        const chunkWordCount = chunk.split(/\s+/).filter(Boolean).length;
        const estimatedScenesInChunk = Math.ceil(chunkWordCount / (parseInt(wordsPerScene) || 80));
        
        // Atualizar progresso de chunks
        setChunkProgress({ current: chunkIndex + 1, total: totalChunks, scenesProcessed: allScenes.length });
        
        const baseDone = allScenes.length;
        let simulatedPrompt = 0;

        const updateSceneProgress = (done: number) => {
          const total = Math.max(1, estimatedTotalScenes);
          const clampedDone = Math.min(done, total);
          setSceneProgress({ done: clampedDone, total });
          const pct = 10 + (clampedDone / total) * 80;
          setProgress(Math.min(90, Math.round(pct)));
          setLoadingMessage(`Gerando cenas ${clampedDone}/${total}...`);
        };

        updateSceneProgress(baseDone);

        const progressInterval = setInterval(() => {
          if (simulatedPrompt < estimatedScenesInChunk) {
            simulatedPrompt++;
            updateSceneProgress(baseDone + simulatedPrompt);
          }
        }, 600);

        let response: any;
        try {
          response = await invokeGenerateScenesWithRetry({
            script: chunk,
            model,
            style,
            wordsPerScene: parseInt(wordsPerScene) || 80,
            maxScenes: 500,
            wpm: currentWpm,
            // Passar contexto de personagens já detectados para consistência
            existingCharacters: allCharacters.length > 0 ? allCharacters : undefined,
            startSceneNumber: globalSceneNumber
          });
        } finally {
          clearInterval(progressInterval);
        }

        if (response.error) {
          throw new Error(response.error.message || `Erro na parte ${chunkIndex + 1}`);
        }

        if (response.data?.error) {
          throw new Error(response.data.error);
        }

        const { scenes, creditsUsed, characters } = response.data;
        
        if (!scenes || scenes.length === 0) {
          console.warn(`Parte ${chunkIndex + 1}: Nenhuma cena gerada`);
          continue;
        }
        
        // Ajustar números das cenas para sequência global
        const adjustedScenes = scenes.map((scene: ScenePrompt, idx: number) => ({
          ...scene,
          number: globalSceneNumber + idx
        }));
        
        globalSceneNumber += scenes.length;
        allScenes = [...allScenes, ...adjustedScenes];
        setChunkProgress({ current: chunkIndex + 1, total: totalChunks, scenesProcessed: allScenes.length });
        setSceneProgress(prev => ({ ...prev, done: Math.min(allScenes.length, Math.max(1, prev.total)) }));
        setProgress(() => {
          const total = Math.max(1, estimatedTotalScenes);
          const clampedDone = Math.min(allScenes.length, total);
          const pct = 10 + (clampedDone / total) * 80;
          return Math.min(90, Math.round(pct));
        });
        totalCreditsUsed += creditsUsed || 0;
        
        // Mesclar personagens únicos
        if (characters && characters.length > 0) {
          for (const char of characters) {
            if (!allCharacters.some(c => c.name.toLowerCase() === char.name.toLowerCase())) {
              allCharacters.push(char);
            }
          }
        }
        
        // Toast de progresso para cada parte concluída
        if (totalChunks > 1) {
          toast({
            title: `Parte ${chunkIndex + 1}/${totalChunks} concluída`,
            description: `${scenes.length} cenas geradas`,
          });
        }
      }

      setProgress(90);
      setSceneProgress({ done: allScenes.length, total: allScenes.length });
      setLoadingMessage(`Finalizando ${allScenes.length} cenas...`);

      // Armazenar personagens detectados
      if (allCharacters.length > 0) {
        setDetectedCharacters(allCharacters);
        setBgCharacters(allCharacters);
        toast({
          title: `${allCharacters.length} personagem(ns) detectado(s)`,
          description: allCharacters.map((c: CharacterDescription) => c.name).join(", "),
        });
      } else {
        setDetectedCharacters([]);
      }
      
      if (allScenes.length === 0) {
        throw new Error("Nenhuma cena foi gerada. Tente novamente.");
      }
      
      // Enriquecer cenas com tempo e timecode
      let cumulativeSeconds = 0;
      const enrichedScenes: ScenePrompt[] = allScenes.map((scene: ScenePrompt) => {
        const startSeconds = cumulativeSeconds;
        const durationSeconds = wordCountToSeconds(scene.wordCount);
        const endSeconds = startSeconds + durationSeconds;
        cumulativeSeconds = endSeconds;

        return {
          ...scene,
          estimatedTime: calculateEstimatedTime(scene.wordCount),
          timecode: formatTimecode(startSeconds),
          endTimecode: formatTimecode(endSeconds),
        };
      });

      updateScenes(enrichedScenes);
      setProgress(100);

      // Calcular duração total
      const totalWords = enrichedScenes.reduce((acc: number, s: ScenePrompt) => acc + s.wordCount, 0);
      const estimatedDuration = calculateEstimatedTime(totalWords);

      // Salvar no histórico
      if (user) {
        await supabase.from("scene_prompts").insert([{
          user_id: user.id,
          title: `Roteiro ${new Date().toLocaleDateString('pt-BR')}`,
          script,
          total_scenes: enrichedScenes.length,
          total_words: totalWords,
          estimated_duration: estimatedDuration,
          model_used: model,
          style,
          scenes: JSON.parse(JSON.stringify(enrichedScenes)),
          credits_used: totalCreditsUsed
        }]);
      }

      queryClient.invalidateQueries({ queryKey: ["scene-prompts-history"] });

      // Log activity
      await logActivity({
        action: 'scene_generated',
        description: `${enrichedScenes.length} cenas geradas a partir do roteiro${totalChunks > 1 ? ` (${totalChunks} partes)` : ''}`,
      });

      toast({
        title: "Prompts gerados!",
        description: `${enrichedScenes.length} cenas analisadas${totalChunks > 1 ? ` em ${totalChunks} partes` : ''}. Créditos: ${totalCreditsUsed}`,
      });
    } catch (error: any) {
      console.error("Error generating scenes:", error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível gerar os prompts",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  // Gerar TODAS as imagens pendentes em BACKGROUND (continua mesmo ao navegar)
  const handleGenerateAllImages = async () => {
    if (generatedScenes.length === 0) return;

    const pendingIndexes = generatedScenes
      .map((s, idx) => ({ s, idx }))
      .filter(({ s }) => !s.generatedImage)
      .map(({ idx }) => idx);

    if (pendingIndexes.length === 0) {
      toast({ title: "Todas as imagens já foram geradas!" });
      return;
    }

    // Usar o sistema de background para geração
    // Usar o sistema de background para geração com personagens
    startBgGeneration(generatedScenes, style, pendingIndexes, detectedCharacters);
  };

  // Cancelar geração
  const handleCancelGeneration = () => {
    cancelBgGeneration();
  };

  // Recuperar imagens do cache IndexedDB
  const handleRecoverFromCache = async () => {
    if (generatedScenes.length === 0) {
      toast({ title: "Nenhuma cena para recuperar", description: "Gere as cenas primeiro" });
      return;
    }

    setRecoveringFromCache(true);
    
    try {
      const cacheStats = await getCacheStats();
      
      if (cacheStats.count === 0) {
        toast({ 
          title: "Cache vazio", 
          description: "Nenhuma imagem encontrada no cache do navegador",
          variant: "destructive" 
        });
        setRecoveringFromCache(false);
        return;
      }

      const cachedImages = await getAllCachedImages();
      let recoveredCount = 0;

      const updatedScenes = generatedScenes.map(scene => {
        // Só recuperar se a cena não tem imagem
        if (!scene.generatedImage && cachedImages.has(scene.number)) {
          recoveredCount++;
          return { ...scene, generatedImage: cachedImages.get(scene.number) };
        }
        return scene;
      });

      if (recoveredCount > 0) {
        updateScenes(updatedScenes);
        toast({ 
          title: "Imagens recuperadas!", 
          description: `${recoveredCount} imagem(ns) recuperada(s) do cache` 
        });
      } else {
        toast({ 
          title: "Nenhuma imagem recuperável", 
          description: `Cache tem ${cacheStats.count} imagens, mas nenhuma corresponde às cenas sem imagem`,
        });
      }
    } catch (error) {
      console.error("Erro ao recuperar do cache:", error);
      toast({ 
        title: "Erro ao recuperar", 
        description: "Não foi possível acessar o cache do navegador",
        variant: "destructive" 
      });
    } finally {
      setRecoveringFromCache(false);
    }
  };

  // Estado local para regeneração individual
  const [regeneratingIndex, setRegeneratingIndex] = useState<number | null>(null);

  const downloadScenesAsZip = async (scenes: ScenePrompt[], zipFileName: string) => {
    const zip = new JSZip();

    let added = 0;
    for (const scene of scenes) {
      if (!scene.generatedImage) continue;

      try {
        const response = await fetch(scene.generatedImage);
        const blob = await response.blob();
        zip.file(`cena_${String(scene.number).padStart(3, "0")}.png`, blob);
        added++;
      } catch (e) {
        console.warn("Falha ao incluir imagem no ZIP:", scene.number, e);
      }
    }

    if (added === 0) {
      throw new Error("Nenhuma imagem pôde ser adicionada ao ZIP");
    }

    const zipBlob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(zipBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = zipFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return added;
  };

  // Baixar todas as imagens geradas (ZIP) — evita bloqueio do navegador e corrige CORS
  const handleDownloadAllImages = async () => {
    const scenesWithImages = generatedScenes.filter(s => s.generatedImage);

    if (scenesWithImages.length === 0) {
      toast({ title: "Nenhuma imagem para baixar" });
      return;
    }

    setDownloadingAll(true);

    try {
      const fileName = `Imagens_${new Date().toISOString().split("T")[0]}.zip`;
      const added = await downloadScenesAsZip(scenesWithImages, fileName);
      toast({
        title: "Download iniciado!",
        description: `ZIP com ${added} imagens`,
      });
    } catch (error) {
      toast({
        title: "Erro no download",
        description: "Não foi possível gerar o ZIP das imagens",
        variant: "destructive",
      });
    } finally {
      setDownloadingAll(false);
    }
  };

  const handleSelectAllImages = () => {
    const all = generatedScenes.filter(s => s.generatedImage).map(s => s.number);
    setSelectedImages(new Set(all));
  };

  const handleClearSelection = () => {
    setSelectedImages(new Set());
  };

  const handleDownloadSelectedImages = async () => {
    const selectedScenes = generatedScenes.filter(s => s.generatedImage && selectedImages.has(s.number));

    if (selectedScenes.length === 0) {
      toast({ title: "Nenhuma imagem selecionada" });
      return;
    }

    setDownloadingAll(true);
    try {
      const fileName = `Imagens_selecionadas_${new Date().toISOString().split("T")[0]}.zip`;
      const added = await downloadScenesAsZip(selectedScenes, fileName);
      toast({
        title: "Download iniciado!",
        description: `ZIP com ${added} imagens selecionadas`,
      });
    } catch (error) {
      toast({
        title: "Erro no download",
        description: "Não foi possível gerar o ZIP das selecionadas",
        variant: "destructive",
      });
    } finally {
      setDownloadingAll(false);
    }
  };

  const handleClearSelectedImages = () => {
    if (selectedImages.size === 0) return;

    const clearedCount = Array.from(selectedImages).length;
    updateScenes(
      generatedScenes.map((s) =>
        selectedImages.has(s.number)
          ? { ...s, generatedImage: undefined, generatingImage: false }
          : s
      )
    );
    setSelectedImages(new Set());

    toast({
      title: "Imagens removidas",
      description: `${clearedCount} imagens foram limpas`,
    });
  };

  // IndexedDB para persistir o handle do diretório (localStorage não suporta FileSystemDirectoryHandle)
  const saveCapcutDirHandle = async (handle: FileSystemDirectoryHandle) => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('capcut-settings', 1);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      request.onupgradeneeded = () => {
        request.result.createObjectStore('handles');
      };
    });
    
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('handles', 'readwrite');
      tx.objectStore('handles').put(handle, 'lastCapcutDir');
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  };

  const getCapcutDirHandle = async (): Promise<FileSystemDirectoryHandle | null> => {
    try {
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open('capcut-settings', 1);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        request.onupgradeneeded = () => {
          request.result.createObjectStore('handles');
        };
      });
      
      const handle = await new Promise<FileSystemDirectoryHandle | null>((resolve, reject) => {
        const tx = db.transaction('handles', 'readonly');
        const request = tx.objectStore('handles').get('lastCapcutDir');
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
      });
      db.close();
      return handle;
    } catch {
      return null;
    }
  };

  // Limpar o handle salvo do IndexedDB
  const clearCapcutDirHandle = async () => {
    try {
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open('capcut-settings', 1);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        request.onupgradeneeded = () => {
          // Garantir que o object store exista
          if (!request.result.objectStoreNames.contains('handles')) {
            request.result.createObjectStore('handles');
          }
        };
      });

      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction('handles', 'readwrite');
        const request = tx.objectStore('handles').delete('lastCapcutDir');
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });

      db.close();
    } catch (e) {
      console.log("Erro ao limpar handle:", e);
    }
  };

  // Salvar diretamente na pasta do CapCut usando File System Access API
  const handleSaveToCapcutFolder = async () => {
    const scenesWithImages = generatedScenes.filter(s => s.generatedImage);
    
    if (scenesWithImages.length === 0) {
      toast({ title: "Nenhuma imagem para exportar", variant: "destructive" });
      return;
    }

    // Verificar suporte à API de forma mais robusta
    const hasFileSystemAPI = typeof window !== 'undefined' && 
                              'showDirectoryPicker' in window &&
                              typeof (window as any).showDirectoryPicker === 'function';
    
    console.log("File System Access API disponível:", hasFileSystemAPI);
    
    if (!hasFileSystemAPI) {
      console.log("API não suportada, baixando ZIP...");
      toast({ 
        title: "Navegador não suportado", 
        description: "Use Chrome, Edge ou outro navegador moderno. Baixando ZIP como alternativa...",
        variant: "destructive"
      });
      await handleExportAsZip();
      return;
    }

    try {
      let dirHandle: FileSystemDirectoryHandle | null = null;
      
      // Tentar recuperar o último diretório usado
      let savedHandle: FileSystemDirectoryHandle | null = null;
      try {
        savedHandle = await getCapcutDirHandle();
        console.log("Handle salvo encontrado:", savedHandle?.name || "nenhum");
      } catch (e) {
        console.log("Erro ao recuperar handle:", e);
      }
      
      if (savedHandle) {
        // Verificar se ainda temos permissão
        try {
          const permission = await (savedHandle as any).queryPermission({ mode: 'readwrite' });
          console.log("Permissão atual:", permission);
          if (permission === 'granted') {
            dirHandle = savedHandle;
            toast({ 
              title: "📁 Pasta anterior encontrada!", 
              description: `Usando "${savedHandle.name}". Clique em "Cancelar" para escolher outra pasta.`,
            });
          } else if (permission === 'prompt') {
            // Pedir permissão novamente
            const newPermission = await (savedHandle as any).requestPermission({ mode: 'readwrite' });
            console.log("Nova permissão:", newPermission);
            if (newPermission === 'granted') {
              dirHandle = savedHandle;
              toast({ 
                title: "📁 Pasta restaurada!", 
                description: `Usando "${savedHandle.name}"`,
              });
            }
          }
        } catch (e) {
          console.log("Erro ao verificar permissão:", e);
          // Handle inválido, ignorar e pedir nova pasta
        }
      }

      // Se não temos um handle válido, pedir para escolher
      if (!dirHandle) {
        toast({ 
          title: "📁 Selecione a pasta do CapCut", 
          description: "Caminho típico: Documentos > CapCut > User Data > Projects > [Seu Projeto]",
        });

        console.log("Abrindo seletor de pasta...");
        dirHandle = await (window as any).showDirectoryPicker({
          id: 'capcut-project',
          mode: 'readwrite',
          startIn: 'documents'
        });
        console.log("Pasta selecionada:", dirHandle.name);
      }

      // Salvar o handle para uso futuro
      await saveCapcutDirHandle(dirHandle);

      // Verificar se parece ser uma pasta do CapCut (heurística simples)
      const folderName = dirHandle.name.toLowerCase();
      const isCapcutFolder = folderName.includes('capcut') || 
                             folderName.includes('project') || 
                             folderName.includes('draft');
      
      if (!isCapcutFolder) {
        toast({ 
          title: "⚠️ Pasta selecionada", 
          description: `"${dirHandle.name}" - Os arquivos serão salvos aqui.`,
        });
      } else {
        toast({ 
          title: "✅ Pasta do CapCut detectada!", 
          description: `Salvando em "${dirHandle.name}"...`,
        });
      }

      // Calcular durações
      const scenesWithDurations = generatedScenes.map((scene) => {
        const startSeconds = scene.timecode ? 
          parseInt(scene.timecode.split(":")[0]) * 60 + parseInt(scene.timecode.split(":")[1]) : 0;
        const endSeconds = scene.endTimecode ? 
          parseInt(scene.endTimecode.split(":")[0]) * 60 + parseInt(scene.endTimecode.split(":")[1]) : startSeconds;
        const durationSeconds = Math.max(1, endSeconds - startSeconds);
        return { ...scene, startSeconds, endSeconds, durationSeconds };
      });

      // Função auxiliar para converter para JPG
      const convertToJpg = async (imageUrl: string): Promise<Blob> => {
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        
        // Criar canvas para conversão
        const img = new window.Image();
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        return new Promise((resolve, reject) => {
          img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx?.drawImage(img, 0, 0);
            canvas.toBlob((jpgBlob) => {
              if (jpgBlob) resolve(jpgBlob);
              else reject(new Error('Falha ao converter para JPG'));
            }, 'image/jpeg', 0.92);
          };
          img.onerror = reject;
          img.src = imageUrl;
        });
      };

      // Salvar cada imagem diretamente na pasta selecionada (em JPG)
      let savedCount = 0;
      for (const scene of scenesWithImages) {
        if (scene.generatedImage) {
          try {
            const jpgBlob = await convertToJpg(scene.generatedImage);
            const fileName = `cena_${String(scene.number).padStart(3, "0")}.jpg`;
            
            const fileHandle = await dirHandle.getFileHandle(fileName, { create: true });
            const writable = await fileHandle.createWritable();
            await writable.write(jpgBlob);
            await writable.close();
            savedCount++;
          } catch (err) {
            console.warn(`Erro ao salvar cena ${scene.number}`, err);
          }
        }
      }

      // Salvar draft_cover.jpg usando a primeira imagem
      if (scenesWithImages.length > 0 && scenesWithImages[0].generatedImage) {
        try {
          const coverBlob = await convertToJpg(scenesWithImages[0].generatedImage);
          const coverHandle = await dirHandle.getFileHandle("draft_cover.jpg", { create: true });
          const coverWritable = await coverHandle.createWritable();
          await coverWritable.write(coverBlob);
          await coverWritable.close();
        } catch (err) {
          console.warn("Erro ao salvar draft_cover.jpg", err);
        }
      }

      // Salvar arquivo de durações
      const totalDuration = scenesWithDurations.length > 0 
        ? scenesWithDurations[scenesWithDurations.length - 1].endTimecode 
        : "00:00";

      const instructions = `DURAÇÕES DAS CENAS - ${totalDuration} total\n` +
        `Gerado em: ${new Date().toLocaleString('pt-BR')}\n\n` +
        scenesWithDurations.map(s => 
          `Cena ${String(s.number).padStart(2, "0")}: ${s.durationSeconds}s (${s.timecode} → ${s.endTimecode})`
        ).join("\n") +
        `\n\n--- INSTRUÇÕES PARA CAPCUT ---\n` +
        `1. Abra o CapCut e crie um novo projeto ou abra um existente\n` +
        `2. Importe as imagens desta pasta (cena_001.png, cena_002.png, etc.)\n` +
        `3. Ajuste a duração de cada imagem conforme as durações acima\n` +
        `4. As imagens já estão ordenadas por número de cena`;

      const instructionsHandle = await dirHandle.getFileHandle("DURACOES.txt", { create: true });
      const instructionsWritable = await instructionsHandle.createWritable();
      await instructionsWritable.write(instructions);
      await instructionsWritable.close();


      toast({
        title: "✅ Arquivos salvos com sucesso!",
        description: `${savedCount} imagens + DURACOES.txt salvos em "${dirHandle.name}".`,
      });

    } catch (error: any) {
      console.error("Erro na exportação CapCut:", error);
      
      if (error.name === 'AbortError') {
        toast({ title: "Cancelado", description: "Nenhum arquivo foi salvo" });
      } else if (error.name === 'SecurityError' || error.message?.includes('cross-origin') || error.message?.includes('sandboxed')) {
        // Erro de segurança do iframe - comum no preview do Lovable
        console.log("Erro de segurança detectado, API bloqueada no iframe");
        toast({ 
          title: "⚠️ Acesso bloqueado no preview", 
          description: "Para usar esta função, abra o app publicado. Baixando ZIP...",
          variant: "destructive" 
        });
        await handleExportAsZip();
      } else if (error.name === 'NotAllowedError' || error.message?.includes('system') || error.message?.includes('arquivos do sistema')) {
        // Pasta protegida do sistema - o navegador bloqueia o acesso
        console.log("Pasta do sistema detectada, fallback para ZIP");
        toast({ 
          title: "⚠️ Pasta protegida (bloqueio do navegador)", 
          description: "Sem problemas: baixei um ZIP para você extrair manualmente. Extraia em uma SUBPASTA do projeto: Documentos > CapCut > User Data > Projects > [Seu Projeto]. Leia README_CAPCUT.txt dentro do ZIP.",
          variant: "destructive" 
        });
        await clearCapcutDirHandle();
        await handleExportAsZip();
      } else {
        toast({ 
          title: "Erro ao salvar na pasta", 
          description: error.message || "Baixando ZIP como alternativa...",
          variant: "destructive" 
        });
        await handleExportAsZip();
      }
    }
  };

  // Exportar como ZIP (fallback)
  const handleExportAsZip = async () => {
    const scenesWithImages = generatedScenes.filter(s => s.generatedImage);
    
    if (scenesWithImages.length === 0) {
      toast({ title: "Nenhuma imagem para exportar", variant: "destructive" });
      return;
    }

    toast({ title: "Preparando ZIP...", description: "Aguarde" });

    try {
      const zip = new JSZip();

      // Calcular durações
      const scenesWithDurations = generatedScenes.map((scene) => {
        const startSeconds = scene.timecode ? 
          parseInt(scene.timecode.split(":")[0]) * 60 + parseInt(scene.timecode.split(":")[1]) : 0;
        const endSeconds = scene.endTimecode ? 
          parseInt(scene.endTimecode.split(":")[0]) * 60 + parseInt(scene.endTimecode.split(":")[1]) : startSeconds;
        const durationSeconds = Math.max(1, endSeconds - startSeconds);
        return { ...scene, startSeconds, endSeconds, durationSeconds };
      });

      // Função auxiliar para converter para JPG no ZIP
      const convertToJpgBlob = async (imageUrl: string): Promise<Blob> => {
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        
        const img = new window.Image();
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        return new Promise((resolve, reject) => {
          img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx?.drawImage(img, 0, 0);
            canvas.toBlob((jpgBlob) => {
              if (jpgBlob) resolve(jpgBlob);
              else reject(new Error('Falha ao converter para JPG'));
            }, 'image/jpeg', 0.92);
          };
          img.onerror = reject;
          img.src = imageUrl;
        });
      };

      // Criar pasta Resources e adicionar imagens em JPG
      const resourcesFolder = zip.folder("Resources");
      let firstImageBlob: Blob | null = null;
      
      for (const scene of scenesWithImages) {
        if (scene.generatedImage && resourcesFolder) {
          try {
            const jpgBlob = await convertToJpgBlob(scene.generatedImage);
            resourcesFolder.file(`cena_${String(scene.number).padStart(3, "0")}.jpg`, jpgBlob);
            
            // Guardar a primeira imagem para usar como capa
            if (!firstImageBlob) {
              firstImageBlob = jpgBlob;
            }
          } catch (err) {
            console.warn(`Erro cena ${scene.number}`, err);
          }
        }
      }

      // Adicionar instruções e arquivos de suporte
      const totalDuration = scenesWithDurations.length > 0 
        ? scenesWithDurations[scenesWithDurations.length - 1].endTimecode 
        : "00:00";

      // DURACOES.txt melhorado com formato visual para consulta rápida
      const durationsTxt = [
        "═══════════════════════════════════════════════════════════════",
        "          DURAÇÕES DAS CENAS - GUIA PARA CAPCUT",
        "═══════════════════════════════════════════════════════════════",
        "",
        `⏱️  Duração Total: ${totalDuration}`,
        `📅 Gerado em: ${new Date().toLocaleString('pt-BR')}`,
        `🎬 Total de cenas: ${scenesWithDurations.length}`,
        "",
        "═══════════════════════════════════════════════════════════════",
        "   ARQUIVO    │ DURAÇÃO │  INÍCIO  →   FIM   │ TIMECODE",
        "═══════════════════════════════════════════════════════════════",
        ...scenesWithDurations.map(s => {
          const fileName = `cena_${String(s.number).padStart(3, "0")}.jpg`;
          const duration = `${s.durationSeconds.toFixed(1)}s`.padStart(6);
          const timecode = `${s.timecode} → ${s.endTimecode}`;
          return `   ${fileName} │ ${duration} │ ${timecode.padEnd(18)} │ ${s.timecode}`;
        }),
        "═══════════════════════════════════════════════════════════════",
        "",
        "💡 COMO AJUSTAR DURAÇÕES NO CAPCUT:",
        "",
        "1. Clique no clipe na timeline",
        "2. Olhe o nome do arquivo (cena_001.jpg, cena_002.jpg...)",
        "3. Consulte esta tabela para ver a duração correta",
        "4. Arraste a borda direita do clipe para ajustar",
        "",
        "📌 DICA: O CapCut mostra o timecode no canto. Use a coluna",
        "   'INÍCIO' para posicionar cada cena corretamente.",
        "",
        "═══════════════════════════════════════════════════════════════",
      ].join("\n");

      // Gerar SRT inteligente (max 499 chars, sem cortar palavras, 10s gap)
      const scenesForSrt = scenesWithDurations.map(s => ({
        number: s.number,
        text: s.text,
        startSeconds: s.startSeconds,
        endSeconds: s.endSeconds
      }));
      const srtContent = generateNarrationSrt(scenesForSrt, {
        maxCharsPerBlock: 499,
        gapBetweenScenes: 10
      });

      // Obter template selecionado
      const template = CAPCUT_TEMPLATES.find(t => t.id === selectedTemplate) || CAPCUT_TEMPLATES[0];

      const readme = [
        "╔═══════════════════════════════════════════════════════════════════════════╗",
        "║         📁 PACOTE DE PRODUÇÃO - IMAGENS PARA VÍDEO                       ║",
        "║         Projeto: " + (projectName.trim() || "Meu Projeto").substring(0,50).padEnd(55) + "║",
        "╚═══════════════════════════════════════════════════════════════════════════╝",
        "",
        "",
        "═══════════════════════════════════════════════════════════════════════════",
        "                    📂 ENTENDA OS ARQUIVOS DESTE PACOTE",
        "═══════════════════════════════════════════════════════════════════════════",
        "",
        "Este pacote contém tudo que você precisa para montar seu vídeo:",
        "",
        "┌─────────────────────────────────────────────────────────────────────────┐",
        "│  ARQUIVO              │  O QUE É                │  PARA QUE SERVE       │",
        "├─────────────────────────────────────────────────────────────────────────┤",
        "│  📁 Resources/        │  Pasta com imagens     │  As cenas do vídeo    │",
        "│                       │  (cena_001.jpg, etc)   │  Importe no editor    │",
        "├─────────────────────────────────────────────────────────────────────────┤",
        "│  📄 DURACOES.txt      │  Tempo de cada cena    │  Saber quanto tempo   │",
        "│                       │  em segundos           │  cada imagem fica     │",
        "├─────────────────────────────────────────────────────────────────────────┤",
        "│  📄 NARRACOES.srt     │  Arquivo de legendas   │  Adicionar legendas   │",
        "│                       │  com timecodes         │  sincronizadas        │",
        "├─────────────────────────────────────────────────────────────────────────┤",
        "│  📄 concat.txt        │  Lista de arquivos     │  O FFmpeg lê este     │",
        "│                       │  para o FFmpeg         │  arquivo para montar  │",
        "├─────────────────────────────────────────────────────────────────────────┤",
        "│  🖥️  FFMPEG_COMANDO.bat│  Script Windows        │  Clique 2x para gerar │",
        "│                       │  (arquivo de lote)     │  o vídeo automático   │",
        "├─────────────────────────────────────────────────────────────────────────┤",
        "│  🖥️  FFMPEG_COMANDO.sh │  Script Mac/Linux      │  Execute no terminal  │",
        "│                       │  (shell script)        │  para gerar vídeo     │",
        "├─────────────────────────────────────────────────────────────────────────┤",
        "│  📄 README_CAPCUT.txt │  Este arquivo!         │  Instruções de uso    │",
        "└─────────────────────────────────────────────────────────────────────────┘",
        "",
        "",
        "═══════════════════════════════════════════════════════════════════════════",
        "                    🚀 MÉTODO RECOMENDADO: FFMPEG AUTOMÁTICO",
        "═══════════════════════════════════════════════════════════════════════════",
        "",
        "Com o FFmpeg instalado, você gera o vídeo com 1 CLIQUE!",
        "",
        "  ✅ Windows: Clique 2x em FFMPEG_COMANDO.bat",
        "  ✅ Mac/Linux: Execute ./FFMPEG_COMANDO.sh no terminal",
        "",
        "O vídeo é gerado em poucos segundos com todas as durações corretas!",
        "",
        "",
        "═══════════════════════════════════════════════════════════════════════════",
        "            📥 COMO INSTALAR O FFMPEG (TUTORIAL COMPLETO)",
        "═══════════════════════════════════════════════════════════════════════════",
        "",
        "─────────────────────────────────────────────────────────────────────────",
        "🪟 WINDOWS - Opção 1: Instalador Automático (Mais Fácil)",
        "─────────────────────────────────────────────────────────────────────────",
        "",
        "  1) Abra o PowerShell como Administrador:",
        "     - Clique com botão direito no Menu Iniciar",
        "     - Clique em 'Terminal (Admin)' ou 'PowerShell (Admin)'",
        "",
        "  2) Cole este comando e pressione Enter:",
        "",
        "     winget install FFmpeg",
        "",
        "  3) Feche e reabra o terminal. Digite 'ffmpeg -version' para testar.",
        "",
        "─────────────────────────────────────────────────────────────────────────",
        "🪟 WINDOWS - Opção 2: Download Manual",
        "─────────────────────────────────────────────────────────────────────────",
        "",
        "  1) Acesse: https://www.gyan.dev/ffmpeg/builds/",
        "",
        "  2) Baixe: 'ffmpeg-release-essentials.zip' (link em verde)",
        "",
        "  3) Extraia o ZIP em C:\\ffmpeg",
        "",
        "  4) Adicione ao PATH:",
        "     - Pesquise 'Variáveis de Ambiente' no Windows",
        "     - Clique em 'Variáveis de Ambiente'",
        "     - Em 'Variáveis do Sistema', selecione 'Path' e clique 'Editar'",
        "     - Clique 'Novo' e adicione: C:\\ffmpeg\\bin",
        "     - Clique OK em todas as janelas",
        "",
        "  5) Reinicie o computador e teste: ffmpeg -version",
        "",
        "─────────────────────────────────────────────────────────────────────────",
        "🍎 MAC - Instalação via Homebrew",
        "─────────────────────────────────────────────────────────────────────────",
        "",
        "  1) Se não tem Homebrew, instale primeiro:",
        "",
        "     /bin/bash -c \"$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\"",
        "",
        "  2) Instale o FFmpeg:",
        "",
        "     brew install ffmpeg",
        "",
        "  3) Teste: ffmpeg -version",
        "",
        "─────────────────────────────────────────────────────────────────────────",
        "🐧 LINUX (Ubuntu/Debian)",
        "─────────────────────────────────────────────────────────────────────────",
        "",
        "  Execute no terminal:",
        "",
        "     sudo apt update && sudo apt install ffmpeg -y",
        "",
        "  Teste: ffmpeg -version",
        "",
        "─────────────────────────────────────────────────────────────────────────",
        "🐧 LINUX (Fedora/CentOS)",
        "─────────────────────────────────────────────────────────────────────────",
        "",
        "  Execute no terminal:",
        "",
        "     sudo dnf install ffmpeg -y",
        "",
        "═══════════════════════════════════════════════════════════════════════════",
        "",
        "",
        "═══════════════════════════════════════════════════════════════════════════",
        "            🎨 MÉTODO MANUAL: IMPORTAR NO CAPCUT/DAVINCI",
        "═══════════════════════════════════════════════════════════════════════════",
        "",
        "Se preferir editar manualmente:",
        "",
        "CAPCUT DESKTOP:",
        "  1) Abra o CapCut Desktop",
        "  2) Crie um novo projeto",
        "  3) Clique em 'Importar' ou arraste a pasta Resources/",
        "  4) Selecione TODAS as imagens (Ctrl+A)",
        "  5) Arraste para a timeline (serão importadas em ordem)",
        "  6) Use DURACOES.txt para ajustar o tempo de cada cena",
        "",
        "DAVINCI RESOLVE:",
        "  1) File > Import Media > selecione a pasta Resources/",
        "  2) Arraste as imagens para a timeline",
        "  3) Ajuste as durações conforme DURACOES.txt",
        "",
        "",
        "═══════════════════════════════════════════════════════════════════════════",
        "          📋 DURAÇÕES DAS CENAS (REFERÊNCIA RÁPIDA)",
        "═══════════════════════════════════════════════════════════════════════════",
        "",
      ].join("\n") + "\n" + scenesWithDurations.map(s => 
        `  Cena ${String(s.number).padStart(3, "0")}: ${s.durationSeconds.toFixed(1)}s`
      ).join("\n") + "\n" + [
        "",
        "═══════════════════════════════════════════════════════════════════════════",
        "          ❓ PROBLEMAS COMUNS",
        "═══════════════════════════════════════════════════════════════════════════",
        "",
        "❌ 'FFmpeg não encontrado'",
        "   → Reinstale seguindo o tutorial acima e reinicie o computador",
        "",
        "❌ 'Arquivo concat.txt não encontrado'",
        "   → Execute o script na mesma pasta onde extraiu o ZIP",
        "",
        "❌ 'Permissão negada' (Mac/Linux)",
        "   → Execute: chmod +x FFMPEG_COMANDO.sh",
        "",
        "",
        "Template usado: " + template.name,
        template.transitionType !== 'none' 
          ? "Transição sugerida: " + template.transitionType + " (" + template.transitionDuration + "s)"
          : "Sem transições (cortes diretos)",
        "",
        "═══════════════════════════════════════════════════════════════════════════",
        "        Gerado em " + new Date().toLocaleString('pt-BR'),
        "═══════════════════════════════════════════════════════════════════════════",
      ].join("\n");

      // Gerar arquivo concat.txt para FFmpeg (formato de lista de arquivos)
      const ffmpegConcat = scenesWithDurations.map(s => {
        const fileName = `cena_${String(s.number).padStart(3, "0")}.jpg`;
        return `file 'Resources/${fileName}'\nduration ${s.durationSeconds.toFixed(2)}`;
      }).join("\n") + `\nfile 'Resources/cena_${String(scenesWithDurations.length).padStart(3, "0")}.jpg'`; // Última imagem precisa repetir

      // Script BAT para Windows
      const ffmpegBat = `@echo off
echo ========================================
echo   Gerando video com FFmpeg...
echo ========================================
echo.

REM Verificar se FFmpeg esta instalado
where ffmpeg >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERRO] FFmpeg nao encontrado!
    echo.
    echo Instale o FFmpeg: https://ffmpeg.org/download.html
    echo Ou use: winget install FFmpeg
    echo.
    pause
    exit /b 1
)

REM Gerar video
ffmpeg -f concat -safe 0 -i concat.txt -vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1" -c:v libx264 -preset medium -crf 23 -pix_fmt yuv420p -r 30 "${projectName.trim() || 'video'}_montado.mp4"

echo.
echo ========================================
echo   Video gerado com sucesso!
echo   Arquivo: ${projectName.trim() || 'video'}_montado.mp4
echo ========================================
echo.
echo Agora importe o video no CapCut!
pause
`;

      // Script SH para Mac/Linux
      const ffmpegSh = `#!/bin/bash
echo "========================================"
echo "  Gerando video com FFmpeg..."
echo "========================================"
echo

# Verificar se FFmpeg esta instalado
if ! command -v ffmpeg &> /dev/null; then
    echo "[ERRO] FFmpeg nao encontrado!"
    echo
    echo "Instale o FFmpeg:"
    echo "  Mac: brew install ffmpeg"
    echo "  Linux: sudo apt install ffmpeg"
    echo
    exit 1
fi

# Gerar video
ffmpeg -f concat -safe 0 -i concat.txt -vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1" -c:v libx264 -preset medium -crf 23 -pix_fmt yuv420p -r 30 "${projectName.trim() || 'video'}_montado.mp4"

echo
echo "========================================"
echo "  Video gerado com sucesso!"
echo "  Arquivo: ${projectName.trim() || 'video'}_montado.mp4"
echo "========================================"
echo
echo "Agora importe o video no CapCut!"
`;

      // Arquivos de documentação + FFmpeg
      zip.file("DURACOES.txt", durationsTxt);
      zip.file("NARRACOES.srt", srtContent);
      zip.file("README_CAPCUT.txt", readme);
      zip.file("concat.txt", ffmpegConcat);
      zip.file("FFMPEG_COMANDO.bat", ffmpegBat);
      zip.file("FFMPEG_COMANDO.sh", ffmpegSh);
      
      // Criar pastas de áudio com READMEs
      const audioFolders = generateAudioFolderStructure();
      for (const folder of audioFolders) {
        const audioFolder = zip.folder(folder.path.replace(/\/$/, ''));
        if (audioFolder) {
          audioFolder.file("LEIA-ME.txt", folder.readme);
        }
      }
      
      // Adicionar guia de mixagem de áudio
      zip.file("AUDIO_MIXAGEM.txt", generateAudioMixReadme(audioMixSettings));
      
      // Adicionar instruções de estilo de legenda
      const selectedStyle = SUBTITLE_STYLES.find(s => s.id === selectedSubtitleStyle) || SUBTITLE_STYLES[0];
      zip.file("LEGENDA_ESTILO.txt", generateSubtitleInstructions(selectedStyle));

      // Baixar ZIP
      const zipBlob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement("a");
      link.href = url;
      const safeFileName = (projectName.trim() || "Projeto").replace(/[^a-zA-Z0-9_-]/g, "_");
      link.download = `${safeFileName}_capcut_${new Date().toISOString().split("T")[0]}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({ 
        title: "✅ Pacote de Produção baixado!", 
        description: "Inclui pastas de áudio, legendas e imagens. Leia README_CAPCUT.txt" 
      });
    } catch (error) {
      console.error("Erro ZIP:", error);
      toast({ title: "Erro ao gerar ZIP", variant: "destructive" });
    }
  };

  // Handler principal do CapCut - abre modal de instruções primeiro
  const handleExportForCapcut = () => {
    setShowCapcutInstructions(true);
  };

  // Executa a exportação após confirmação
  const handleConfirmCapcutExport = async () => {
    setShowCapcutInstructions(false);
    await handleSaveToCapcutFolder();
  };

  // Preparar dados para EDL
  const getScenesForEdl = () => {
    return generatedScenes.map(scene => {
      const durationSeconds = Math.max(1, wordCountToSeconds(scene.wordCount));
      const imagePath = scene.generatedImage 
        ? `cena_${String(scene.number).padStart(3, "0")}.jpg`
        : undefined;
      return {
        number: scene.number,
        text: scene.text,
        durationSeconds,
        imagePath
      };
    });
  };

  // Validar cenas antes de exportar EDL - retorna também lista de cenas faltantes
  const validateScenesForEdl = (scenes: ScenePrompt[]): { 
    valid: boolean; 
    warnings: string[]; 
    errors: string[]; 
    missingScenes: number[];
    percentage: number;
    totalScenes: number;
    withImages: number;
  } => {
    const warnings: string[] = [];
    const errors: string[] = [];
    const missingScenes: number[] = [];
    
    // Verificar se há cenas com imagens
    const scenesWithImages = scenes.filter(s => s.generatedImage);
    const totalScenes = scenes.length;
    const withImages = scenesWithImages.length;
    
    if (scenesWithImages.length === 0) {
      errors.push("Nenhuma cena possui imagem gerada");
      // Todas as cenas estão faltando
      scenes.forEach(s => missingScenes.push(s.number));
      return { valid: false, warnings, errors, missingScenes, percentage: 0, totalScenes, withImages };
    }
    
    // Identificar TODAS as cenas sem imagem
    scenes.forEach(scene => {
      if (!scene.generatedImage) {
        missingScenes.push(scene.number);
      }
    });
    
    // Verificar numeração quebrada (ex: pula do 018 para 020)
    const sceneNumbers = scenesWithImages.map(s => s.number).sort((a, b) => a - b);
    const gapNumbers: number[] = [];
    for (let i = 0; i < sceneNumbers.length - 1; i++) {
      const current = sceneNumbers[i];
      const next = sceneNumbers[i + 1];
      for (let j = current + 1; j < next; j++) {
        gapNumbers.push(j);
      }
    }
    if (gapNumbers.length > 0) {
      const missing = gapNumbers.length > 5 
        ? `${gapNumbers.slice(0, 5).join(', ')}... (+${gapNumbers.length - 5} mais)`
        : gapNumbers.join(', ');
      warnings.push(`Numeração quebrada: cenas ${missing} não possuem imagem`);
    }
    
    // Verificar se a numeração começa do 1
    if (sceneNumbers.length > 0 && sceneNumbers[0] > 1) {
      const firstMissing = Array.from({ length: sceneNumbers[0] - 1 }, (_, i) => i + 1);
      const missing = firstMissing.length > 3
        ? `${firstMissing.slice(0, 3).join(', ')}...`
        : firstMissing.join(', ');
      warnings.push(`Cenas iniciais ${missing} não possuem imagem`);
    }
    
    // Verificar % de cenas com imagem
    const percentage = Math.round((withImages / totalScenes) * 100);
    if (percentage < 100) {
      warnings.push(`Apenas ${percentage}% das cenas (${withImages}/${totalScenes}) possuem imagem`);
    }
    
    return { valid: true, warnings, errors, missingScenes, percentage, totalScenes, withImages };
  };

  // Função para executar a exportação XML de fato
  const executeXmlExport = () => {
    const scenesWithImages = generatedScenes.filter(s => s.generatedImage);
    const scenesForXml = getScenesForEdl(); // Reutiliza a mesma estrutura
    const fpsValue = parseInt(edlFps) || 24;
    const transitionFrames = Math.round(fpsValue * 0.5);
    const xmlContent = generateFcp7XmlWithTransitions(scenesForXml, {
      title: projectName || "Projeto_Video",
      fps: fpsValue,
      transitionFrames,
      transitionType: selectedTransition
    });

    const blob = new Blob([xmlContent], { type: "application/xml" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const safeFileName = (projectName.trim() || "projeto").replace(/[^a-zA-Z0-9_-]/g, "_");
    link.download = `${safeFileName}_davinci.xml`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    const transitionName = TRANSITION_OPTIONS.find(t => t.id === selectedTransition)?.name || 'Cross Dissolve';
    toast({ 
      title: "✅ XML exportado!", 
      description: `${scenesWithImages.length} cenas com ${transitionName}. Importe no DaVinci: File > Import > Timeline...` 
    });
    
    setShowEdlValidationModal(false);
  };

  // Handler para gerar imagens faltantes do modal de validação EDL
  const handleGenerateMissingFromEdlModal = () => {
    if (!edlValidationData || edlValidationData.missingScenes.length === 0) return;
    
    const pendingIndexes = edlValidationData.missingScenes.map(num => num - 1);
    const updatedScenes = generatedScenes.map((scene, idx) => {
      if (pendingIndexes.includes(idx)) {
        return { ...scene, generatingImage: true, generatedImage: undefined };
      }
      return scene;
    });
    setGeneratedScenes(updatedScenes);
    
    // Sincronizar e iniciar geração em background
    syncScenes(updatedScenes);
    startBgGeneration(updatedScenes, style, pendingIndexes, detectedCharacters);
    
    logActivity({ action: 'image_generated', description: `Gerando ${edlValidationData.missingScenes.length} imagens faltantes do modal EDL` });
    
    setShowEdlValidationModal(false);
    
    toast({
      title: "🎨 Gerando imagens faltantes",
      description: `${edlValidationData.missingScenes.length} cenas serão processadas em segundo plano`,
    });
  };

  // Exportar XML para DaVinci Resolve - sempre abre modal para escolher transição
  const handleExportXml = () => {
    // Validação
    const validation = validateScenesForEdl(generatedScenes);
    
    if (!validation.valid) {
      toast({ 
        title: "❌ Não é possível exportar", 
        description: validation.errors.join(". "),
        variant: "destructive" 
      });
      return;
    }
    
    // Se houver cenas faltantes, mostrar modal com dados de validação
    if (validation.missingScenes.length > 0) {
      setEdlValidationData({
        missingScenes: validation.missingScenes,
        percentage: validation.percentage,
        totalScenes: validation.totalScenes,
        withImages: validation.withImages
      });
    } else {
      // Limpar dados de validação se todas as cenas têm imagem
      setEdlValidationData(null);
    }
    
    // Sempre abrir modal para escolher transição
    setShowEdlValidationModal(true);
  };

  // Exportar Tutorial XML
  const handleExportXmlTutorial = () => {
    const scenesForXml = getScenesForEdl();
    const tutorialContent = generateXmlTutorial(scenesForXml, projectName || "Meu Projeto");

    const blob = new Blob([tutorialContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const safeFileName = (projectName.trim() || "projeto").replace(/[^a-zA-Z0-9_-]/g, "_");
    link.download = `${safeFileName}_TUTORIAL_DAVINCI.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({ 
      title: "📖 Tutorial exportado!", 
      description: "Guia completo para importar XML no DaVinci Resolve" 
    });
  };

  // Gerar vídeo MP4 com FFmpeg.wasm
  const handleGenerateVideo = async () => {
    const scenesWithImages = generatedScenes.filter(s => s.generatedImage);
    
    if (scenesWithImages.length === 0) {
      toast({ 
        title: "Nenhuma imagem disponível", 
        description: "Gere as imagens primeiro antes de criar o vídeo.",
        variant: "destructive" 
      });
      return;
    }

    // Preparar cenas com durações
    const scenesForVideo = generatedScenes
      .filter(s => s.generatedImage)
      .map(scene => ({
        number: scene.number,
        text: scene.text,
        generatedImage: scene.generatedImage,
        durationSeconds: Math.max(2, wordCountToSeconds(scene.wordCount))
      }));

    const blob = await generateVideo({
      scenes: scenesForVideo,
      projectName: projectName || "video",
      fps: 30,
      resolution: videoResolution,
      kenBurnsEnabled: videoKenBurns,
      transitionEnabled: videoTransitionEnabled,
      transitionType: videoTransitionType,
      transitionDuration: parseFloat(videoTransitionDuration) || 0.5,
      colorFilterEnabled: videoColorFilter !== "none",
      colorFilter: videoColorFilter
    });

    if (blob) {
      setGeneratedVideoBlob(blob);
    }
  };

  // Baixar vídeo gerado
  const handleDownloadGeneratedVideo = () => {
    if (generatedVideoBlob) {
      const safeFileName = (projectName.trim() || "video").replace(/[^a-zA-Z0-9_-]/g, "_");
      downloadVideo(generatedVideoBlob, `${safeFileName}_com_efeitos.mp4`);
    }
  };

  // Ref para o input de arquivos oculto
  const importImagesInputRef = useRef<HTMLInputElement>(null);

  // Importar imagens via input file (compatível com todos navegadores)
  const handleImportImagesFromFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    let importedCount = 0;
    const updatedScenes = [...generatedScenes];

    // Mapear arquivos por nome
    const fileMap = new Map<string, File>();
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      fileMap.set(file.name.toLowerCase(), file);
    }

    // Iterar pelas cenas e procurar imagens correspondentes
    for (let i = 0; i < updatedScenes.length; i++) {
      const scene = updatedScenes[i];
      const jpgFileName = `cena_${String(scene.number).padStart(3, "0")}.jpg`;
      const pngFileName = `cena_${String(scene.number).padStart(3, "0")}.png`;
      
      const file = fileMap.get(jpgFileName.toLowerCase()) || fileMap.get(pngFileName.toLowerCase());

      if (file) {
        const url = URL.createObjectURL(file);
        updatedScenes[i] = { ...updatedScenes[i], generatedImage: url };
        importedCount++;
      }
    }

    if (importedCount > 0) {
      setGeneratedScenes(updatedScenes);
      toast({ 
        title: "✅ Imagens importadas!", 
        description: `${importedCount} imagens foram carregadas.`
      });
    } else {
      toast({ 
        title: "Nenhuma imagem correspondente", 
        description: "Nenhum arquivo cena_001.jpg/png encontrado. Verifique os nomes.",
        variant: "destructive" 
      });
    }

    // Limpar input para permitir reimportação
    e.target.value = "";
  };

  // Detectar sistema operacional
  const isWindows = typeof navigator !== 'undefined' && navigator.platform?.toLowerCase().includes('win');
  const isMac = typeof navigator !== 'undefined' && (navigator.platform?.toLowerCase().includes('mac') || navigator.userAgent?.toLowerCase().includes('mac'));

  // Texto das instruções para copiar
  const capcutInstructionsText = `COMO IMPORTAR NO CAPCUT

⚠️ IMPORTANTE: O CapCut NÃO aceita "relink" de mídias externas.
Você precisa IMPORTAR as imagens diretamente no CapCut.

=== PASSO A PASSO (FUNCIONA 100%) ===

1. Extraia o ZIP para uma pasta no seu computador

2. Abra o CapCut e crie um NOVO PROJETO (16:9, 1080p)

3. Na aba "Mídia", clique em "Importar"

4. Vá até a pasta Resources/ e selecione TODAS as imagens
   (Ctrl+A para selecionar todas)

5. Clique em "Abrir" para importar

6. Selecione todas as imagens importadas na biblioteca (Ctrl+A)

7. Arraste TODAS para a timeline de uma vez
   (Elas serão colocadas em ordem alfabética = ordem correta!)

8. Ajuste as durações conforme o arquivo DURACOES.txt

=== DICAS ===
• As imagens são nomeadas: cena_001.jpg, cena_002.jpg...
• Use DURACOES.txt para ver quanto tempo cada cena deve ter
• Aplique transições manualmente: clique entre dois clipes → Transições
• Use "Importar Imagens de Pasta" para carregar imagens já baixadas`;


  // Editar prompt de uma cena
  const handleEditPrompt = (index: number) => {
    setEditingPromptIndex(index);
    setEditingPromptText(generatedScenes[index].imagePrompt);
  };

  const handleSavePrompt = (index: number) => {
    setGeneratedScenes(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        imagePrompt: editingPromptText,
        generatedImage: undefined, // Limpar imagem antiga ao editar prompt
      };
      return updated;
    });
    setEditingPromptIndex(null);
    setEditingPromptText("");
    toast({ title: "Prompt atualizado!", description: "Gere a imagem novamente." });
  };

  const handleCancelEdit = () => {
    setEditingPromptIndex(null);
    setEditingPromptText("");
  };

  // Regenerar imagem individual
  const handleRegenerateImage = async (index: number) => {
    const scene = generatedScenes[index];
    if (!scene) return;

    setRegeneratingIndex(index);
    
    try {
      const stylePrefix = THUMBNAIL_STYLES.find(s => s.id === style)?.promptPrefix || "";
      const fullPrompt = stylePrefix 
        ? `${stylePrefix} ${scene.imagePrompt}`
        : scene.imagePrompt;

      // Verificar se a cena tem um personagem e obter a seed correspondente
      const characterSeed = scene.characterName 
        ? detectedCharacters.find(c => c.name.toLowerCase() === scene.characterName?.toLowerCase())?.seed
        : undefined;

      const { data, error } = await supabase.functions.invoke("generate-imagefx", {
        body: {
          prompt: fullPrompt,
          aspectRatio: "LANDSCAPE",
          numberOfImages: 1,
          seed: characterSeed // Usar seed fixa se houver personagem
        }
      });

      if (error) {
        const bodyText = (error as any)?.context?.body;
        if (bodyText) {
          try {
            const parsed = JSON.parse(bodyText);
            throw new Error(parsed?.error || error.message);
          } catch {
            throw new Error(error.message);
          }
        }
        throw new Error(error.message);
      }

      if ((data as any)?.error) {
        throw new Error((data as any).error);
      }

      const url = (data as any)?.images?.[0]?.url;
      if (url) {
        const updatedScenes = [...generatedScenes];
        updatedScenes[index] = {
          ...updatedScenes[index],
          generatedImage: url
        };
        updateScenes(updatedScenes);
        
        toast({
          title: "Imagem regenerada!",
          description: `Cena ${scene.number} atualizada`,
        });
      }
    } catch (error: any) {
      console.error(`Error regenerating image for scene ${index + 1}:`, error);
      toast({
        title: "Erro",
        description: error?.message || "Não foi possível regenerar a imagem",
        variant: "destructive",
      });
    } finally {
      setRegeneratingIndex(null);
    }
  };

  // Copiar prompt individual
  const copyPrompt = (prompt: string, index: number) => {
    navigator.clipboard.writeText(prompt);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
    toast({
      title: "Copiado!",
      description: "Prompt copiado para a área de transferência",
    });
  };

  // Copiar todos os prompts
  const copyAllPrompts = () => {
    const allPrompts = generatedScenes
      .map(s => `[Cena ${s.number} - ${s.timecode}]\n${s.imagePrompt}`)
      .join("\n\n---\n\n");
    navigator.clipboard.writeText(allPrompts);
    toast({
      title: "Copiado!",
      description: "Todos os prompts copiados",
    });
  };

  // Baixar prompts como TXT
  const downloadPrompts = () => {
    const content = generatedScenes
      .map(s => `=== CENA ${s.number} ===\nTimecode: ${s.timecode}\nDuração: ${s.estimatedTime}\nPalavras: ${s.wordCount}\n\nTexto:\n${s.text}\n\nPrompt de Imagem:\n${s.imagePrompt}`)
      .join("\n\n" + "=".repeat(50) + "\n\n");
    
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `prompts-cenas-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Download iniciado!",
      description: "Arquivo TXT com os prompts",
    });
  };

  // Preparar e mostrar preview do SRT
  const openSrtPreview = () => {
    // Usar o roteiro completo da "Análise de Roteiro" se disponível
    const fullScript = script.trim();
    
    if (!fullScript && generatedScenes.length === 0) {
      toast({ title: "Nenhum roteiro para exportar", variant: "destructive" });
      return;
    }

    // Se temos o roteiro completo, usá-lo diretamente
    // Caso contrário, concatenar os textos das cenas
    const textToUse = fullScript || generatedScenes.map(s => s.text).join(' ');
    const totalWords = textToUse.split(/\s+/).filter(Boolean).length;
    const totalDurationSeconds = (totalWords / currentWpm) * 60;

    // Criar uma única "cena" com o roteiro completo para o SRT
    const scenesForSrt = [{
      number: 1,
      text: textToUse,
      startSeconds: 0,
      endSeconds: totalDurationSeconds
    }];

    // Gerar SRT com o roteiro completo (será dividido em blocos de até 499 chars)
    // Com 10 segundos de intervalo entre cada bloco
    const srtContent = generateNarrationSrt(scenesForSrt, {
      maxCharsPerBlock: 499,
      gapBetweenScenes: 10
    });

    // Parsear blocos para exibir no preview
    const rawBlocks = srtContent.split('\n\n').filter(b => b.trim());
    const blocks = rawBlocks.map(block => {
      const lines = block.split('\n');
      const index = parseInt(lines[0]) || 0;
      const timeLine = lines[1] || '';
      const [start, end] = timeLine.split(' --> ');
      const text = lines.slice(2).join(' ');
      return {
        index,
        start: start || '00:00:00,000',
        end: end || '00:00:00,000',
        text,
        charCount: text.length
      };
    });

    setSrtPreviewData({ content: srtContent, blocks });
    setShowSrtPreview(true);
  };

  // Baixar SRT do preview
  const downloadSrtFromPreview = () => {
    if (!srtPreviewData) return;
    
    const blob = new Blob([srtPreviewData.content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `legendas-${new Date().toISOString().split('T')[0]}.srt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "SRT baixado!",
      description: `${srtPreviewData.blocks.length} blocos | ${currentWpm} WPM`,
    });
    setShowSrtPreview(false);
  };

  // Copiar SRT do preview
  const copySrtFromPreview = () => {
    if (!srtPreviewData) return;
    navigator.clipboard.writeText(srtPreviewData.content);
    toast({ title: "SRT copiado para a área de transferência!" });
  };

  // Exportar Plano de Produção para CapCut
  const downloadProductionPlan = () => {
    if (generatedScenes.length === 0) return;

    // Palavras-chave que indicam ação/movimento na cena
    const MOTION_KEYWORDS = [
      'caminha', 'corre', 'anda', 'move', 'dirige', 'voa', 'nada', 'pula', 'salta',
      'walks', 'runs', 'moves', 'drives', 'flies', 'swims', 'jumps',
      'pan', 'zoom', 'dolly', 'tracking', 'movimento', 'motion',
      'água', 'water', 'fogo', 'fire', 'vento', 'wind', 'nuvens', 'clouds',
      'carro', 'car', 'veículo', 'vehicle', 'trem', 'train', 'avião', 'plane',
      'multidão', 'crowd', 'pessoas', 'people', 'animais', 'animals',
      'explosão', 'explosion', 'queda', 'fall', 'subida', 'rise',
      'dança', 'dance', 'luta', 'fight', 'perseguição', 'chase',
      'oceano', 'ocean', 'rio', 'river', 'cachoeira', 'waterfall',
      'floresta', 'forest', 'tempestade', 'storm', 'chuva', 'rain'
    ];

    const shouldRecommendMotion = (text: string, emotion?: string, durationSeconds?: number): boolean => {
      // Só recomendar movimento para cenas de até 11 segundos
      if (durationSeconds !== undefined && durationSeconds > 11) return false;
      
      const lowerText = text.toLowerCase();
      const hasMotionKeyword = MOTION_KEYWORDS.some(kw => lowerText.includes(kw));
      const hasActionEmotion = emotion && ['tension', 'tensão', 'shock', 'choque', 'surprise', 'surpresa'].includes(emotion.toLowerCase());
      return hasMotionKeyword || !!hasActionEmotion;
    };

    // Calcular duração total
    const totalDurationSeconds = generatedScenes.reduce((acc, s) => {
      const startSec = s.timecode ? parseInt(s.timecode.split(":")[0]) * 60 + parseInt(s.timecode.split(":")[1]) : 0;
      const endSec = s.endTimecode ? parseInt(s.endTimecode.split(":")[0]) * 60 + parseInt(s.endTimecode.split(":")[1]) : startSec;
      return acc + (endSec - startSec);
    }, 0);
    
    const formatDuration = (sec: number) => {
      const m = Math.floor(sec / 60);
      const s = Math.floor(sec % 60);
      return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    };

    // Identificar cenas com movimento recomendado (apenas cenas de até 11s)
    const motionScenes = generatedScenes.filter(s => {
      const startSec = s.timecode ? parseInt(s.timecode.split(":")[0]) * 60 + parseInt(s.timecode.split(":")[1]) : 0;
      const endSec = s.endTimecode ? parseInt(s.endTimecode.split(":")[0]) * 60 + parseInt(s.endTimecode.split(":")[1]) : startSec;
      const duration = endSec - startSec;
      return shouldRecommendMotion(s.text + ' ' + s.imagePrompt, s.emotion, duration);
    });

    // Agrupar cenas por intervalos de ~30 segundos ou ~1 minuto
    const groups: { start: number; end: number; scenes: typeof generatedScenes }[] = [];
    const INTERVAL = totalDurationSeconds > 180 ? 60 : 30; // 1 min se > 3min, senão 30s
    
    let currentGroup: typeof groups[0] | null = null;
    let currentGroupEnd = INTERVAL;
    
    generatedScenes.forEach((scene) => {
      const startSec = scene.timecode ? parseInt(scene.timecode.split(":")[0]) * 60 + parseInt(scene.timecode.split(":")[1]) : 0;
      
      if (!currentGroup || startSec >= currentGroupEnd) {
        if (currentGroup) groups.push(currentGroup);
        const groupStart = Math.floor(startSec / INTERVAL) * INTERVAL;
        currentGroupEnd = groupStart + INTERVAL;
        currentGroup = { start: groupStart, end: currentGroupEnd, scenes: [] };
      }
      currentGroup.scenes.push(scene);
    });
    if (currentGroup && currentGroup.scenes.length > 0) groups.push(currentGroup);

    // Gerar documento
    const header = `
╔══════════════════════════════════════════════════════════════════════════════╗
║                         PLANO DE PRODUÇÃO - CAPCUT                            ║
╚══════════════════════════════════════════════════════════════════════════════╝

📅 Data: ${new Date().toLocaleDateString("pt-BR")}
⏱️ Duração Total: ${formatDuration(totalDurationSeconds)}
🎬 Total de Cenas: ${generatedScenes.length}
📝 Total de Palavras: ${totalWords}
🎙️ Velocidade de Narração: ${currentWpm} WPM
🎥 Cenas para Animar: ${motionScenes.length} (recomendado movimento até 11s)

================================================================================
                         INSTRUÇÕES PARA O CAPCUT
================================================================================

1. IMPORTE TODAS AS IMAGENS
   - Arraste a pasta com as imagens (cena_001.jpg, cena_002.jpg, etc.) para a biblioteca do CapCut

2. IMPORTE O ÁUDIO/NARRAÇÃO
   - Adicione o arquivo de áudio da narração na timeline

3. ORGANIZE AS CENAS EM BLOCOS
   - Use os agrupamentos abaixo para facilitar a edição
   - Arraste as cenas em lotes conforme as instruções

`;

    const groupsText = groups.map((group, idx) => {
      const sceneNumbers = group.scenes.map(s => s.number);
      const firstScene = sceneNumbers[0];
      const lastScene = sceneNumbers[sceneNumbers.length - 1];
      const sceneRange = firstScene === lastScene ? `Cena ${firstScene}` : `Cenas ${firstScene} a ${lastScene}`;
      
      return `
┌──────────────────────────────────────────────────────────────────────────────┐
│ BLOCO ${idx + 1}: ${formatDuration(group.start)} → ${formatDuration(group.end)}                                          
├──────────────────────────────────────────────────────────────────────────────┤
│ 📁 Arraste: ${sceneRange} (${group.scenes.length} arquivo${group.scenes.length > 1 ? "s" : ""})
│ 📍 Posicione em: ${formatDuration(group.start)} na timeline
│ 
│ DETALHES:
${group.scenes.map(s => {
  const startSec = s.timecode ? parseInt(s.timecode.split(":")[0]) * 60 + parseInt(s.timecode.split(":")[1]) : 0;
  const endSec = s.endTimecode ? parseInt(s.endTimecode.split(":")[0]) * 60 + parseInt(s.endTimecode.split(":")[1]) : startSec;
  const duration = endSec - startSec;
  const hasMotion = shouldRecommendMotion(s.text + ' ' + s.imagePrompt, s.emotion, duration);
  return `│   • Cena ${String(s.number).padStart(2, " ")}: ${s.timecode} → ${s.endTimecode} (${s.estimatedTime}) - ${s.wordCount}w${hasMotion ? " 🎬" : ""}`;
}).join("\n")}
└──────────────────────────────────────────────────────────────────────────────┘`;
    }).join("\n");

    // Seção de cenas com movimento recomendado
    const motionSection = motionScenes.length > 0 ? `

================================================================================
                    🎬 CENAS PARA ADICIONAR MOVIMENTO (até 11s)
================================================================================

As cenas abaixo contêm elementos de ação, emoção intensa ou elementos naturais
que se beneficiam de animação. Use efeitos como:
  • Ken Burns (zoom lento 5-10%)
  • Pan horizontal/vertical suave
  • Parallax em camadas
  • Movimento de partículas/água/fogo

${motionScenes.map(s => `CENA ${String(s.number).padStart(2, "0")} | ${s.timecode} → ${s.endTimecode}
   Motivo: ${s.emotion ? `Emoção ${s.emotion}` : 'Elemento de ação detectado'}
   Prompt: ${s.imagePrompt.substring(0, 80)}...
`).join("\n")}
` : "";

    const scenesDetail = `

================================================================================
                         LISTA COMPLETA DE CENAS
================================================================================

${generatedScenes.map(s => {
  const startSec = s.timecode ? parseInt(s.timecode.split(":")[0]) * 60 + parseInt(s.timecode.split(":")[1]) : 0;
  const endSec = s.endTimecode ? parseInt(s.endTimecode.split(":")[0]) * 60 + parseInt(s.endTimecode.split(":")[1]) : startSec;
  const duration = endSec - startSec;
  const hasMotion = shouldRecommendMotion(s.text + ' ' + s.imagePrompt, s.emotion, duration);
  return `
CENA ${String(s.number).padStart(2, "0")} | ${s.timecode} → ${s.endTimecode} | ${s.estimatedTime} | ${s.wordCount} palavras${hasMotion ? " | 🎬 MOVIMENTO" : ""}
${"─".repeat(78)}
📝 Texto: ${s.text.substring(0, 150)}${s.text.length > 150 ? "..." : ""}
🎨 Prompt: ${s.imagePrompt.substring(0, 120)}${s.imagePrompt.length > 120 ? "..." : ""}
${s.characterName ? `👤 Personagem: ${s.characterName}` : ""}
`;
}).join("\n")}
`;

    const tips = `

================================================================================
                         DICAS DE EDIÇÃO
================================================================================

💡 AJUSTE FINO:
   - Use a forma de onda do áudio para ajustar os cortes precisos
   - O início de cada cena deve coincidir com o início da frase correspondente

💡 TRANSIÇÕES:
   - Use Cross Dissolve (0.3s) entre cenas do mesmo assunto
   - Use corte seco para mudanças bruscas de assunto

💡 KEN BURNS (para cenas marcadas com 🎬):
   - Adicione zoom lento (5-10%) em cenas com movimento recomendado
   - Limite a 11 segundos de animação para não distrair

💡 VERIFICAÇÃO:
   - Assista o vídeo 1x e anote dessincronia
   - Ajuste cenas individuais arrastando as bordas

================================================================================
                    Gerado por Prompts para Cenas • ${new Date().toLocaleString("pt-BR")}
================================================================================
`;

    const fullContent = header + groupsText + motionSection + scenesDetail + tips;
    
    const blob = new Blob([fullContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `PLANO_PRODUCAO_${projectName.trim().replace(/\s+/g, "_") || "video"}_${new Date().toISOString().split("T")[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Plano de Produção exportado!",
      description: "Arquivo TXT com instruções para o CapCut",
    });
  };

  // Estado para modal de marcadores do YouTube
  const [showYouTubeChapters, setShowYouTubeChapters] = useState(false);
  const [youtubeChapters, setYoutubeChapters] = useState("");

  // Gerar marcadores de capítulo para YouTube
  const generateYouTubeChapters = () => {
    if (generatedScenes.length === 0) return;

    // Calcular duração total
    const totalDurationSeconds = generatedScenes.reduce((acc, s) => {
      const startSec = s.timecode ? parseInt(s.timecode.split(":")[0]) * 60 + parseInt(s.timecode.split(":")[1]) : 0;
      const endSec = s.endTimecode ? parseInt(s.endTimecode.split(":")[0]) * 60 + parseInt(s.endTimecode.split(":")[1]) : startSec;
      return acc + (endSec - startSec);
    }, 0);

    // Determinar intervalo de capítulos baseado na duração
    // YouTube requer mínimo 10 segundos entre capítulos
    let CHAPTER_INTERVAL: number;
    if (totalDurationSeconds <= 60) {
      CHAPTER_INTERVAL = 15; // 15s para vídeos curtos
    } else if (totalDurationSeconds <= 180) {
      CHAPTER_INTERVAL = 30; // 30s para vídeos médios
    } else if (totalDurationSeconds <= 600) {
      CHAPTER_INTERVAL = 60; // 1min para vídeos longos
    } else {
      CHAPTER_INTERVAL = 120; // 2min para vídeos muito longos
    }

    // Agrupar cenas em capítulos
    const chapters: { time: string; title: string; scenes: number[] }[] = [];
    let currentChapter: typeof chapters[0] | null = null;
    let currentChapterEndSec = CHAPTER_INTERVAL;

    // Sempre começar com 00:00
    chapters.push({ time: "00:00", title: "Início", scenes: [] });

    generatedScenes.forEach((scene) => {
      const startSec = scene.timecode 
        ? parseInt(scene.timecode.split(":")[0]) * 60 + parseInt(scene.timecode.split(":")[1]) 
        : 0;

      // Se passou do intervalo, criar novo capítulo
      if (startSec >= currentChapterEndSec) {
        const chapterStartSec = Math.floor(startSec / CHAPTER_INTERVAL) * CHAPTER_INTERVAL;
        currentChapterEndSec = chapterStartSec + CHAPTER_INTERVAL;
        
        // Formatar timecode
        const mins = Math.floor(chapterStartSec / 60);
        const secs = chapterStartSec % 60;
        const timeStr = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
        
        // Extrair título do primeiro trecho significativo da cena
        const sceneText = scene.text.trim();
        let chapterTitle = sceneText.split(/[.!?]/)[0].trim();
        if (chapterTitle.length > 50) {
          chapterTitle = chapterTitle.substring(0, 47) + "...";
        }
        if (!chapterTitle) {
          chapterTitle = `Parte ${chapters.length}`;
        }
        
        currentChapter = { time: timeStr, title: chapterTitle, scenes: [scene.number] };
        chapters.push(currentChapter);
      } else if (currentChapter) {
        currentChapter.scenes.push(scene.number);
      } else {
        chapters[0].scenes.push(scene.number);
      }
    });

    // Atualizar título do primeiro capítulo baseado nas cenas
    if (chapters[0].scenes.length > 0) {
      const firstScene = generatedScenes.find(s => s.number === chapters[0].scenes[0]);
      if (firstScene) {
        const firstText = firstScene.text.trim().split(/[.!?]/)[0].trim();
        if (firstText && firstText.length < 50) {
          chapters[0].title = firstText;
        }
      }
    }

    // Gerar texto formatado para YouTube
    const chaptersText = chapters
      .map(ch => `${ch.time} ${ch.title}`)
      .join("\n");

    setYoutubeChapters(chaptersText);
    setShowYouTubeChapters(true);
  };

  // Copiar marcadores do YouTube
  const copyYouTubeChapters = () => {
    navigator.clipboard.writeText(youtubeChapters);
    toast({
      title: "Copiado!",
      description: "Marcadores de capítulo copiados para a área de transferência",
    });
  };

  // Carregar histórico
  const loadFromHistory = (history: SceneHistory, loadPrompts = false) => {
    setScript(history.script);
    setStyle(history.style || "cinematic");
    
    if (loadPrompts) {
      // Carregar prompts para regenerar imagens
      setGeneratedScenes(history.scenes.map(scene => ({
        ...scene,
        generatedImage: undefined, // Limpa imagens para regenerar
        generatingImage: false
      })));
      setActiveTab("generator");
      toast({
        title: "Prompts carregados!",
        description: `${history.scenes.length} prompts prontos para gerar imagens`,
      });
    } else {
      setGeneratedScenes(history.scenes);
      toast({
        title: "Carregado!",
        description: "Roteiro carregado do histórico",
      });
    }
  };

  // Deletar do histórico
  const deleteFromHistory = async (id: string) => {
    try {
      await supabase.from("scene_prompts").delete().eq("id", id);
      queryClient.invalidateQueries({ queryKey: ["scene-prompts-history"] });
      toast({
        title: "Excluído!",
        description: "Removido do histórico",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível excluir",
        variant: "destructive",
      });
    }
  };

  // Estatísticas do roteiro atual (usando WPM configurado)
  const scriptStats = {
    words: script.split(/\s+/).filter(Boolean).length,
    estimatedScenes: Math.ceil(script.split(/\s+/).filter(Boolean).length / (parseInt(wordsPerScene) || 80)),
    estimatedDuration: calculateEstimatedTimeWithWpm(script.split(/\s+/).filter(Boolean).length, currentWpm)
  };

  const computeScenesWithWpm = (scenes: ScenePrompt[], wpm: number): ScenePrompt[] => {
    let cumulativeSeconds = 0;

    return scenes.map((scene) => {
      const startSeconds = cumulativeSeconds;
      const durationSeconds = (scene.wordCount / wpm) * 60;
      const endSeconds = startSeconds + durationSeconds;
      cumulativeSeconds = endSeconds;

      return {
        ...scene,
        estimatedTime: calculateEstimatedTimeWithWpm(scene.wordCount, wpm),
        timecode: formatTimecode(startSeconds),
        endTimecode: formatTimecode(endSeconds),
      };
    });
  };

  // Recalcular timecodes quando WPM muda
  const recalculateTimecodes = () => {
    if (generatedScenes.length === 0) return;

    const recalculatedScenes = computeScenesWithWpm(generatedScenes, currentWpm);
    updateScenes(recalculatedScenes);

    toast({ title: "Timecodes recalculados", description: `Usando ${currentWpm} palavras/minuto` });
  };

  // Calcular WPM baseado na duração real do áudio (input: "MM:SS" ou segundos)
  const handleCalculateFromDuration = () => {
    if (!audioDurationInput.trim() || totalWords === 0) {
      toast({ title: "Erro", description: "Insira a duração do áudio e tenha cenas geradas", variant: "destructive" });
      return;
    }
    
    let durationSeconds = 0;
    
    // Parse input: aceita "MM:SS" ou apenas segundos
    if (audioDurationInput.includes(":")) {
      const parts = audioDurationInput.split(":");
      const mins = parseInt(parts[0]) || 0;
      const secs = parseInt(parts[1]) || 0;
      durationSeconds = mins * 60 + secs;
    } else {
      durationSeconds = parseFloat(audioDurationInput) || 0;
    }
    
    if (durationSeconds <= 0) {
      toast({ title: "Erro", description: "Duração inválida. Use formato MM:SS ou segundos", variant: "destructive" });
      return;
    }
    
    // Calcular WPM: palavras / (duração em minutos)
    const calculatedWpm = Math.round(totalWords / (durationSeconds / 60));
    
    // Limitar a faixa razoável
    const clampedWpm = Math.max(80, Math.min(250, calculatedWpm));
    
    // Atualizar o WPM
    setNarrationSpeed(clampedWpm.toString());
    setShowDurationModal(false);
    setAudioDurationInput("");
    
    // Recalcular timecodes com o novo WPM
    const recalculatedScenes = computeScenesWithWpm(generatedScenes, clampedWpm);
    updateScenes(recalculatedScenes);

    toast({ 
      title: "✅ WPM calculado!", 
      description: `${totalWords} palavras em ${Math.floor(durationSeconds/60)}:${String(durationSeconds%60).padStart(2,'0')} = ${clampedWpm} WPM`
    });
  };

  // Handler para melhorar cenas com problemas de retenção
  const handleImproveScenes = async (sceneNumbers: number[], improvementType: string, regenerateImages: boolean = false) => {
    if (!user || sceneNumbers.length === 0) return;
    
    try {
      // Pegar as cenas que precisam de melhoria
      const scenesToImprove = generatedScenes.filter((_, index) => 
        sceneNumbers.includes(index + 1)
      );
      
      if (scenesToImprove.length === 0) return;

      // Atualizar as cenas com prompts melhorados
      let updatedScenes = [...generatedScenes];
      const improvedIndexes: number[] = [];
      
      // CASO ESPECIAL: Cenas longas - DIVIDIR automaticamente em cenas menores
      if (improvementType === 'split_long_scenes') {
        const idealDurationMax = 8; // segundos máximo por cena
        const idealDurationMin = 5; // segundos mínimo por cena
        
        // Encontrar cenas longas que precisam ser divididas
        const longSceneIndexes = updatedScenes
          .map((s, i) => ({ scene: s, index: i, duration: (s.wordCount / currentWpm) * 60 }))
          .filter(item => item.duration > 10)
          .map(item => item.index);
        
        if (longSceneIndexes.length > 0) {
          // Criar array de novas cenas
          const newScenes: ScenePrompt[] = [];
          let newSceneNumber = 1;
          let currentTime = 0;
          
          updatedScenes.forEach((scene, originalIndex) => {
            const duration = (scene.wordCount / currentWpm) * 60;
            
            if (duration > 10) {
              // Dividir esta cena em partes menores
              const targetDuration = 6; // segundos por parte
              const numParts = Math.ceil(duration / targetDuration);
              const wordsPerPart = Math.ceil(scene.wordCount / numParts);
              const words = scene.text.split(/\s+/);
              
              for (let i = 0; i < numParts; i++) {
                const partWords = words.slice(i * wordsPerPart, (i + 1) * wordsPerPart);
                const partText = partWords.join(' ');
                const partWordCount = partWords.length;
                const partDuration = (partWordCount / currentWpm) * 60;
                
                // Gerar prompt adaptado para a parte
                const partPrompt = `${scene.imagePrompt}, scene ${i + 1} of ${numParts}, dynamic angle variation, ${
                  i === 0 ? 'establishing shot, wide angle' : 
                  i === numParts - 1 ? 'closing shot, emotional climax' : 
                  'medium shot, character focus'
                }`;
                
                const startTimecode = `${String(Math.floor(currentTime / 60)).padStart(2, '0')}:${String(Math.floor(currentTime % 60)).padStart(2, '0')}`;
                currentTime += partDuration;
                const endTimecode = `${String(Math.floor(currentTime / 60)).padStart(2, '0')}:${String(Math.floor(currentTime % 60)).padStart(2, '0')}`;
                
                newScenes.push({
                  number: newSceneNumber++,
                  text: partText,
                  wordCount: partWordCount,
                  imagePrompt: partPrompt,
                  timecode: startTimecode,
                  endTimecode: endTimecode,
                  estimatedTime: `${partDuration.toFixed(1)}s`,
                  emotion: ['tension', 'curiosity', 'surprise', 'shock'][i % 4],
                  retentionTrigger: ['anticipation', 'curiosity', 'mystery', 'revelation'][i % 4],
                  generatedImage: undefined,
                  generatingImage: true,
                  characterName: scene.characterName
                });
                
                improvedIndexes.push(newSceneNumber - 2);
              }
            } else {
              // Manter cena original mas atualizar número e timecodes
              const startTimecode = `${String(Math.floor(currentTime / 60)).padStart(2, '0')}:${String(Math.floor(currentTime % 60)).padStart(2, '0')}`;
              currentTime += duration;
              const endTimecode = `${String(Math.floor(currentTime / 60)).padStart(2, '0')}:${String(Math.floor(currentTime % 60)).padStart(2, '0')}`;
              
              newScenes.push({
                ...scene,
                number: newSceneNumber++,
                timecode: startTimecode,
                endTimecode: endTimecode,
                estimatedTime: `${duration.toFixed(1)}s`
              });
            }
          });
          
          updatedScenes = newScenes;
          
          toast({
            title: "🎬 Cenas divididas automaticamente!",
            description: `${longSceneIndexes.length} cena(s) longa(s) dividida(s). Total: ${newScenes.length} cenas. Gerando ${improvedIndexes.length} novas imagens...`,
          });
        }
      }
      
      // Para outros tipos de melhoria OU se split não foi necessário
      if (improvementType !== 'split_long_scenes') {
        for (const sceneNum of sceneNumbers) {
          const index = sceneNum - 1;
          if (index >= 0 && index < updatedScenes.length) {
            const scene = updatedScenes[index];
            
            // Melhorar o prompt localmente (rápido, sem API)
            let improvedPrompt = scene.imagePrompt;
            let improvedEmotion = scene.emotion || 'neutral';
            let improvedTrigger = scene.retentionTrigger || 'continuity';
            
            // Adicionar elementos de melhoria baseado no tipo
            if (improvementType === 'add_emotion' || improvementType === 'add_emotion_ending' || improvementType === 'improve_all') {
              const emotions = ['tension', 'curiosity', 'surprise', 'shock'];
              improvedEmotion = emotions[index % emotions.length];
              
              // Adicionar termos cinematográficos ao prompt baseado no roteiro
              const cinematicEnhancements = [
                'dramatic lighting, intense atmosphere, emotional storytelling',
                'cinematic composition, powerful visual impact, high tension',
                'striking imagery, high contrast lighting, narrative tension',
                'epic visual storytelling, dramatic shadows, emotional depth'
              ];
              if (!improvedPrompt.toLowerCase().includes('dramatic') && !improvedPrompt.toLowerCase().includes('cinematic')) {
                improvedPrompt = `${improvedPrompt}, ${cinematicEnhancements[index % cinematicEnhancements.length]}`;
              }
            }
            
            if (improvementType === 'add_triggers' || improvementType === 'add_triggers_ending' || improvementType === 'improve_all') {
              const triggers = ['curiosity', 'anticipation', 'mystery', 'revelation'];
              improvedTrigger = triggers[index % triggers.length];
            }
            
            if (improvementType === 'improve_hook' && sceneNum <= 3) {
              improvedEmotion = 'shock';
              improvedTrigger = 'curiosity';
              if (!improvedPrompt.toLowerCase().includes('dramatic close-up') && !improvedPrompt.toLowerCase().includes('intense')) {
                improvedPrompt = `${improvedPrompt}, dramatic close-up, intense gaze, high stakes moment, ultra cinematic, powerful hook`;
              }
            }
            
            // Para cenas longas, SEMPRE forçar melhorias visuais para compensar a duração
            if (improvementType === 'split_long_scenes') {
              const strongEmotions = ['tension', 'shock', 'curiosity', 'surprise'];
              const strongTriggers = ['anticipation', 'revelation', 'mystery', 'pattern_break'];
              improvedEmotion = strongEmotions[index % strongEmotions.length];
              improvedTrigger = strongTriggers[index % strongTriggers.length];
              
              // FORÇAR adição de elementos dinâmicos mesmo se já existirem
              const dynamicEnhancements = [
                'dynamic composition, fast visual rhythm, engaging close-up, dramatic angle',
                'striking perspective, intense movement, high energy framing, powerful contrast',
                'bold visual storytelling, cinematic movement, impactful composition, dramatic lighting',
                'epic scale, intense action framing, dynamic camera movement, high stakes tension'
              ];
              improvedPrompt = `${scene.imagePrompt}, ${dynamicEnhancements[index % dynamicEnhancements.length]}`;
            }
            
            // Se vai regenerar OU se não tem imagem, marca para gerar
            const needsImage = regenerateImages || !scene.generatedImage;
            
            updatedScenes[index] = {
              ...scene,
              imagePrompt: improvedPrompt,
              emotion: improvedEmotion,
              retentionTrigger: improvedTrigger,
              generatedImage: needsImage ? undefined : scene.generatedImage,
              generatingImage: needsImage ? true : false
            };
            
            if (needsImage) {
              improvedIndexes.push(index);
            }
          }
        }
      }
      
      // ADICIONAR: Verificar todas as cenas sem imagem e incluir na geração
      if (regenerateImages) {
        updatedScenes.forEach((scene, index) => {
          if (!scene.generatedImage && !improvedIndexes.includes(index)) {
            improvedIndexes.push(index);
            updatedScenes[index] = {
              ...scene,
              generatingImage: true
            };
          }
        });
        
        // Ordenar índices
        improvedIndexes.sort((a, b) => a - b);
      }
      
      setGeneratedScenes(updatedScenes);
      setPersistedScenes(updatedScenes.map(({ generatedImage, generatingImage, ...rest }) => rest));
      
      // Se deve regenerar imagens, iniciar geração em background
      if (improvedIndexes.length > 0) {
        const missingCount = updatedScenes.filter(s => !s.generatedImage).length;
        const improvedCount = sceneNumbers.length;
        
        toast({
          title: "🎬 Otimizando vídeo para 100% cobertura...",
          description: `${improvedCount} cena(s) melhoradas + ${missingCount > improvedCount ? missingCount - improvedCount : 0} imagem(ns) faltante(s) serão geradas`,
        });
        
        // Sincronizar cenas com o hook de background e iniciar geração
        syncScenes(updatedScenes);
        
        // Pequeno delay para garantir sincronização
        setTimeout(() => {
          startBgGeneration(updatedScenes, style, improvedIndexes, detectedCharacters);
        }, 100);
        
      } else {
        toast({
          title: "✅ Cenas melhoradas!",
          description: `${sceneNumbers.length} cena(s) otimizada(s) para maior retenção`,
        });
      }
      
      // Log activity
      await logActivity({
        action: 'scenes_improved',
        description: `${sceneNumbers.length} cenas melhoradas (${improvementType})${improvedIndexes.length > 0 ? ` + ${improvedIndexes.length} imagens geradas` : ''}`,
      });
      
    } catch (error) {
      console.error('Error improving scenes:', error);
      toast({
        title: "Erro",
        description: "Não foi possível melhorar as cenas",
        variant: "destructive"
      });
    }
  };

  return (
    <MainLayout>
      <div className="flex-1 overflow-auto p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Session Indicator */}
          <SessionIndicator 
            storageKeys={["prompts_script", "prompts_scenes_meta"]}
            label="Roteiro anterior"
            onClear={() => {
              setScript("");
              setGeneratedScenes([]);
              setPersistedScenes([]);
            }}
          />

          <div className="mb-8 mt-4">
            <h1 className="text-3xl font-bold text-foreground mb-2">Prompts para Cenas</h1>
            <p className="text-muted-foreground">
              Analise seu roteiro e gere prompts de imagem otimizados para cada cena com direção de produção audiovisual
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="bg-secondary">
              <TabsTrigger value="generator" className="gap-2">
                <Film className="w-4 h-4" />
                Gerador
              </TabsTrigger>
              <TabsTrigger value="history" className="gap-2">
                <History className="w-4 h-4" />
                Histórico
              </TabsTrigger>
            </TabsList>

            <TabsContent value="generator" className="space-y-6">
              {/* Layout: sempre usa largura total */}
              <div className="space-y-6">
                <div className="space-y-6">
                  <Card className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Wand2 className="w-5 h-5 text-primary" />
                      <h3 className="font-semibold text-foreground">Análise de Roteiro</h3>
                    </div>

                    <Textarea
                      placeholder="Cole seu roteiro aqui... A IA irá analisar e dividir em cenas com prompts de imagem otimizados."
                      value={script}
                      onChange={(e) => setScript(e.target.value)}
                      className="bg-secondary border-border min-h-48 mb-4 font-mono text-sm"
                    />

                    {/* Estatísticas em tempo real */}
                    {script.trim() && (
                      <div className="flex flex-wrap gap-4 mb-4 p-3 bg-secondary/50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            <strong className="text-foreground">{scriptStats.words}</strong> palavras
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Film className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            ~<strong className="text-foreground">{scriptStats.estimatedScenes}</strong> cenas
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            ~<strong className="text-foreground">{scriptStats.estimatedDuration}</strong> 
                            <span className="text-xs ml-1">({currentWpm} WPM)</span>
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
                      <Select value={style} onValueChange={setStyle}>
                        <SelectTrigger className="bg-secondary border-border">
                          <SelectValue placeholder="Estilo" />
                        </SelectTrigger>
                        <SelectContent className="max-h-80">
                          {THUMBNAIL_STYLE_CATEGORIES.map((category) => (
                            <div key={category.id}>
                              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                                {category.icon} {category.name}
                              </div>
                              {THUMBNAIL_STYLES.filter(s => s.category === category.id).map((s) => (
                                <SelectItem key={s.id} value={s.id}>
                                  <div className="flex items-center gap-2">
                                    <span>{s.icon}</span>
                                    <span>{s.name}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </div>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select value={model} onValueChange={setModel}>
                        <SelectTrigger className="bg-secondary border-border">
                          <SelectValue placeholder="Modelo IA" />
                        </SelectTrigger>
                        <SelectContent>
                          {AI_MODELS.map((m) => (
                            <SelectItem key={m.value} value={m.value}>
                              {m.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Input
                        type="number"
                        placeholder="Palavras/cena"
                        value={wordsPerScene}
                        onChange={(e) => setWordsPerScene(e.target.value)}
                        className="bg-secondary border-border"
                        min={30}
                        max={200}
                      />

                      <Select value={narrationSpeed} onValueChange={(val) => {
                        setNarrationSpeed(val);
                        if (val !== "custom") {
                          setCustomWpm(""); // Limpar WPM personalizado quando usar preset
                        }
                      }}>
                        <SelectTrigger className="bg-secondary border-border">
                          <SelectValue placeholder="Velocidade" />
                        </SelectTrigger>
                        <SelectContent>
                          {NARRATION_SPEEDS.map((speed) => (
                            <SelectItem key={speed.value} value={speed.value}>
                              <div className="flex flex-col">
                                <span>{speed.label}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {/* Input manual de WPM quando personalizado */}
                      {narrationSpeed === "custom" && (
                        <Input
                          type="number"
                          placeholder="WPM"
                          value={customWpm}
                          onChange={(e) => setCustomWpm(e.target.value)}
                          className="bg-secondary border-border w-20"
                          min={80}
                          max={250}
                        />
                      )}

                      <Button 
                        onClick={handleGenerate}
                        disabled={generating || !script.trim()}
                        className="bg-primary text-primary-foreground hover:bg-primary/90"
                      >
                        {generating ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Rocket className="w-4 h-4 mr-2" />
                        )}
                        Analisar
                      </Button>
                    </div>
                  </Card>

                  {/* Preview de Timeline - Sempre visível e atualiza em tempo real */}
                  {script.trim() && (
                    <ScriptPreviewTimeline
                      script={script}
                      wordsPerScene={parseInt(wordsPerScene) || 80}
                      wpm={currentWpm}
                      onSyncAudio={generating ? undefined : (newWpm) => {
                        setNarrationSpeed(newWpm.toString());
                        if (generatedScenes.length > 0) {
                          const recalculatedScenes = computeScenesWithWpm(generatedScenes, newWpm);
                          updateScenes(recalculatedScenes);
                          setTimecodesUpdated(true);
                          // Limpar indicador após 5 segundos
                          setTimeout(() => setTimecodesUpdated(false), 5000);
                        }
                      }}
                      onImproveScenes={handleImproveScenes}
                      onGenerateMissingImages={(sceneNumbers) => {
                        // Marcar cenas como gerando e converter para índices 0-based
                        const pendingIndexes = sceneNumbers.map(num => num - 1);
                        const updatedScenes = generatedScenes.map((scene, idx) => {
                          if (pendingIndexes.includes(idx)) {
                            return { ...scene, generatingImage: true, generatedImage: undefined };
                          }
                          return scene;
                        });
                        setGeneratedScenes(updatedScenes);
                        
                        // Sincronizar e iniciar geração em background
                        syncScenes(updatedScenes);
                        startBgGeneration(updatedScenes, style, pendingIndexes, detectedCharacters);
                        
                        logActivity({ action: 'image_generated', description: `Gerando ${sceneNumbers.length} imagens faltantes (100%)` });
                      }}
                      isGeneratingImages={bgState.isGenerating || generatedScenes.some(s => s.generatingImage)}
                      generatedScenes={generatedScenes.length > 0 ? generatedScenes.map((scene, index) => ({
                        number: index + 1,
                        text: scene.text,
                        wordCount: scene.wordCount,
                        durationSeconds: (scene.wordCount / currentWpm) * 60,
                        generatedImage: scene.generatedImage,
                        emotion: scene.emotion,
                        retentionTrigger: scene.retentionTrigger
                      })) : []}
                    />
                  )}

                  {/* Personagens Detectados */}
                  {detectedCharacters.length > 0 && (
                    <Card className="p-4 border-primary/30 bg-primary/5">
                      <div className="flex items-center gap-2 mb-3">
                        <Rocket className="w-4 h-4 text-primary" />
                        <h3 className="font-semibold text-sm text-foreground">
                          {detectedCharacters.length} Personagem(ns) Detectado(s)
                        </h3>
                        <Badge variant="outline" className="text-xs">
                          Seed fixa ativada
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setDetectedCharacters([]);
                            setBgCharacters([]);
                            toast({ title: "Personagens limpos", description: "Seeds fixas desativadas" });
                          }}
                          className="ml-auto h-6 text-xs text-muted-foreground hover:text-destructive"
                        >
                          <X className="w-3 h-3 mr-1" />
                          Limpar
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {detectedCharacters.map((char, idx) => (
                          <div 
                            key={idx}
                            className="flex items-start gap-2 bg-secondary rounded-lg p-3 text-xs"
                          >
                            {editingCharacterIndex === idx ? (
                              // Modo edição
                              <div className="flex-1 space-y-2">
                                <div className="flex items-center gap-2">
                                  <Input
                                    value={char.name}
                                    onChange={(e) => {
                                      const updated = [...detectedCharacters];
                                      updated[idx] = { ...updated[idx], name: e.target.value };
                                      setDetectedCharacters(updated);
                                      setBgCharacters(updated);
                                    }}
                                    className="h-7 text-xs font-medium"
                                    placeholder="Nome"
                                  />
                                  <Input
                                    type="number"
                                    value={char.seed}
                                    onChange={(e) => {
                                      const updated = [...detectedCharacters];
                                      updated[idx] = { ...updated[idx], seed: parseInt(e.target.value) || 0 };
                                      setDetectedCharacters(updated);
                                      setBgCharacters(updated);
                                    }}
                                    className="h-7 w-32 text-xs font-mono"
                                    placeholder="Seed"
                                  />
                                </div>
                                <Textarea
                                  value={char.description}
                                  onChange={(e) => {
                                    const updated = [...detectedCharacters];
                                    updated[idx] = { ...updated[idx], description: e.target.value };
                                    setDetectedCharacters(updated);
                                    setBgCharacters(updated);
                                  }}
                                  className="text-xs min-h-[60px]"
                                  placeholder="Descrição visual do personagem em inglês..."
                                />
                                <div className="flex gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setEditingCharacterIndex(null)}
                                    className="h-6 text-xs"
                                  >
                                    <Check className="w-3 h-3 mr-1" />
                                    Salvar
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      const updated = detectedCharacters.filter((_, i) => i !== idx);
                                      setDetectedCharacters(updated);
                                      setBgCharacters(updated);
                                      setEditingCharacterIndex(null);
                                      toast({ title: "Personagem removido" });
                                    }}
                                    className="h-6 text-xs text-destructive hover:text-destructive"
                                  >
                                    <Trash2 className="w-3 h-3 mr-1" />
                                    Remover
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              // Modo visualização
                              <>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-medium text-foreground">{char.name}</span>
                                    <span className="text-muted-foreground font-mono">seed: {char.seed}</span>
                                  </div>
                                  <p className="text-muted-foreground line-clamp-2">{char.description}</p>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setEditingCharacterIndex(idx)}
                                  className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                                >
                                  <Edit3 className="w-3 h-3" />
                                </Button>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Clique no ícone de edição para ajustar nome, descrição ou seed de cada personagem.
                      </p>
                    </Card>
                  )}

                  {/* Cenas Geradas */}
                  {generatedScenes.length > 0 && (
                    <Card className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Film className="w-5 h-5 text-primary" />
                          <h3 className="font-semibold text-foreground">
                            {generatedScenes.length} Cenas Analisadas
                          </h3>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={recalculateTimecodes}
                            title={`Recalcular com ${currentWpm} WPM`}
                          >
                            <Clock className="w-4 h-4 mr-2" />
                            {currentWpm} WPM
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={downloadProductionPlan}
                            title="Plano de produção com instruções para CapCut"
                            className={cn(
                              "border-green-500/50 text-green-500 hover:bg-green-500/10 relative",
                              timecodesUpdated && "ring-2 ring-green-400 ring-offset-1 ring-offset-background"
                            )}
                          >
                            <FileText className="w-4 h-4 mr-2" />
                            Plano
                            {timecodesUpdated && (
                              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
                              </span>
                            )}
                          </Button>
                          <Button variant="outline" size="sm" onClick={downloadPrompts}>
                            <Download className="w-4 h-4 mr-2" />
                            TXT
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={openSrtPreview}
                            className="border-cyan-500/50 text-cyan-500 hover:bg-cyan-500/10"
                            title="Preview e download de legendas SRT"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            SRT
                          </Button>
                          <Button variant="outline" size="sm" onClick={copyAllPrompts}>
                            <Copy className="w-4 h-4 mr-2" />
                            Copiar
                          </Button>
                          <Button 
                            variant="outline"
                            size="sm" 
                            onClick={handleDownloadAllImages}
                            disabled={downloadingAll || !generatedScenes.some(s => s.generatedImage)}
                          >
                            {downloadingAll ? (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              <DownloadCloud className="w-4 h-4 mr-2" />
                            )}
                            Imagens ({generatedScenes.filter(s => s.generatedImage).length})
                          </Button>
                          <Button 
                            variant="outline"
                            size="sm" 
                            onClick={generateYouTubeChapters}
                            title="Gerar marcadores de capítulo para descrição do YouTube"
                            className="border-red-500/50 text-red-500 hover:bg-red-500/10"
                          >
                            <Film className="w-4 h-4 mr-2" />
                            YouTube
                          </Button>
                          <Button 
                            variant="outline"
                            size="sm" 
                            onClick={handleExportForCapcut}
                            disabled={!generatedScenes.some(s => s.generatedImage)}
                            className="border-primary/50 text-primary hover:bg-primary/10"
                          >
                            <Video className="w-4 h-4 mr-2" />
                            CapCut
                          </Button>
                          <Button 
                            size="sm" 
                            onClick={handleGenerateAllImages}
                            disabled={generatingImages || generatedScenes.every(s => s.generatedImage)}
                            className="bg-primary text-primary-foreground"
                          >
                            {generatingImages ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                {imageBatchDone}/{imageBatchTotal}
                              </>
                            ) : (
                              <>
                                <ImagePlus className="w-4 h-4 mr-2" />
                                Gerar Todas ({generatedScenes.filter(s => !s.generatedImage).length})
                              </>
                            )}
                          </Button>
                        </div>
                      </div>

                      <div className="mb-6">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-medium text-muted-foreground">
                              Imagens das Cenas ({generatedScenes.filter(s => s.generatedImage).length}/{generatedScenes.length})
                            </h4>
                            {selectedImages.size > 0 && (
                              <Badge variant="outline" className="text-xs">
                                {selectedImages.size} selecionadas
                              </Badge>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-2 justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleSelectAllImages}
                              disabled={!generatedScenes.some(s => s.generatedImage)}
                              className="h-7 text-xs"
                            >
                              <Check className="w-3.5 h-3.5 mr-1.5" />
                              Selecionar todas
                            </Button>
                            {/* Selecionar apenas mídias perdidas */}
                            {generatedScenes.some(s => !s.generatedImage) && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const lost = generatedScenes.filter(s => !s.generatedImage).map(s => s.number);
                                  setSelectedImages(new Set(lost));
                                  toast({ title: `${lost.length} mídias perdidas selecionadas` });
                                }}
                                className="h-7 text-xs border-destructive/50 text-destructive hover:bg-destructive/10"
                              >
                                <X className="w-3.5 h-3.5 mr-1.5" />
                                Selecionar perdidas ({generatedScenes.filter(s => !s.generatedImage).length})
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleClearSelection}
                              disabled={selectedImages.size === 0}
                              className="h-7 text-xs"
                            >
                              Limpar seleção
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleDownloadSelectedImages}
                              disabled={downloadingAll || selectedImages.size === 0}
                              className="h-7 text-xs"
                            >
                              {downloadingAll ? (
                                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                              ) : (
                                <DownloadCloud className="w-3.5 h-3.5 mr-1.5" />
                              )}
                              Baixar
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleClearSelectedImages}
                              disabled={selectedImages.size === 0}
                              className="h-7 text-xs"
                            >
                              <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                              Limpar
                            </Button>

                            <Button
                              variant={filterPending ? "default" : "outline"}
                              size="sm"
                              onClick={() => setFilterPending(!filterPending)}
                              className="h-7 text-xs"
                            >
                              {filterPending ? "Ver Geradas" : "Só Pendentes"}
                            </Button>
                            
                            {/* Botão para recuperar imagens do cache */}
                            {generatedScenes.some(s => !s.generatedImage) && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={handleRecoverFromCache}
                                disabled={recoveringFromCache || generatingImages}
                                className="h-7 text-xs border-amber-500/50 text-amber-500 hover:bg-amber-500/10"
                                title="Tenta recuperar imagens da sessão anterior do cache do navegador"
                              >
                                {recoveringFromCache ? (
                                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                                ) : (
                                  <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                                )}
                                Recuperar Cache
                              </Button>
                            )}
                            
                            {/* Botão para regenerar apenas mídias perdidas */}
                            {generatedScenes.some(s => !s.generatedImage) && (
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={handleGenerateAllImages}
                                disabled={generatingImages}
                                className="h-7 text-xs"
                              >
                                {generatingImages ? (
                                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                                ) : (
                                  <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                                )}
                                Regenerar Perdidas ({generatedScenes.filter(s => !s.generatedImage).length})
                              </Button>
                            )}
                          </div>
                        </div>
                        <div className="relative">
                        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                          {generatedScenes
                            .map((scene, index) => ({ scene, index }))
                            .filter(({ scene }) => {
                              // Filtro: mostrar apenas com imagem, ou se estiver gerando, ou se filterPending está ativo
                              if (filterPending) return !scene.generatedImage;
                              // Por padrão, ocultar "Mídia perdida" (sem imagem e não gerando)
                              if (!scene.generatedImage && !generatingImages) return false;
                              return true;
                            })
                            .map(({ scene, index }) => {
                            // Verificar se este card está na fila de processamento
                            const isPending = !scene.generatedImage && generatingImages;
                            const isCurrentlyGenerating = currentGeneratingIndex === index;
                            
                            return (
                            <div 
                              key={`img-${scene.number}`}
                              className={cn(
                                "group relative aspect-video rounded-lg overflow-hidden bg-secondary border transition-all duration-300",
                                isCurrentlyGenerating 
                                  ? "border-primary shadow-lg shadow-primary/20 ring-2 ring-primary/30" 
                                  : isPending 
                                    ? "border-primary/30" 
                                    : "border-border"
                              )}
                            >
                              {scene.generatedImage ? (
                                <>
                                  <div
                                    className="absolute top-1 left-1 z-10"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <Checkbox
                                      checked={selectedImages.has(scene.number)}
                                      onCheckedChange={(checked) => {
                                        setSelectedImages((prev) => {
                                          const next = new Set(prev);
                                          if (checked) next.add(scene.number);
                                          else next.delete(scene.number);
                                          return next;
                                        });
                                      }}
                                      aria-label={`Selecionar cena ${scene.number}`}
                                    />
                                  </div>

                                  <img 
                                    src={scene.generatedImage} 
                                    alt={`Cena ${scene.number}`}
                                    className="w-full h-full object-cover cursor-pointer"
                                    onClick={() => {
                                      setPreviewScene(scene);
                                      setPreviewIndex(index);
                                      setPreviewEditPrompt(scene.imagePrompt);
                                    }}
                                  />
                                  {/* Duração da cena no canto superior direito */}
                                  <div className="absolute top-1 right-1 z-10 flex items-center gap-1">
                                    <span className="px-1.5 py-0.5 rounded bg-black/70 text-white text-[10px] font-bold backdrop-blur-sm">
                                      {((scene.wordCount / currentWpm) * 60).toFixed(1)}s
                                    </span>
                                    <Button
                                      variant="secondary"
                                      size="icon"
                                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleRegenerateImage(index);
                                      }}
                                      disabled={regeneratingIndex === index || currentGeneratingIndex === index}
                                    >
                                      {regeneratingIndex === index ? (
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                      ) : (
                                        <RefreshCw className="w-3 h-3" />
                                      )}
                                    </Button>
                                  </div>
                                </>
                              ) : isCurrentlyGenerating ? (
                                <div className="w-full h-full flex flex-col items-center justify-center gap-1 bg-gradient-to-br from-primary/10 to-primary/5">
                                  <div className="relative">
                                    <div className="absolute inset-0 bg-primary/30 rounded-full animate-ping" />
                                    <Loader2 className="w-6 h-6 animate-spin text-primary relative z-10" />
                                  </div>
                                  <span className="text-[10px] text-primary font-medium">Gerando...</span>
                                </div>
                              ) : isPending ? (
                                <div className="w-full h-full flex flex-col items-center justify-center gap-1 bg-gradient-to-br from-secondary to-secondary/50">
                                  <div className="w-5 h-5 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
                                  <span className="text-[10px] text-muted-foreground">Na fila...</span>
                                </div>
                              ) : (
                                <button 
                                  className="w-full h-full flex flex-col items-center justify-center gap-0.5 bg-destructive/20 border-2 border-destructive/50 hover:bg-destructive/30 transition-colors"
                                  onClick={() => handleRegenerateImage(index)}
                                  disabled={generatingImages}
                                  title="Clique para gerar ou use 'Importar Imagens de Pasta (Relink)'"
                                >
                                  <div className="absolute top-0 left-0 right-0 bg-destructive text-destructive-foreground text-[7px] font-bold py-0.5 px-1 flex justify-between items-center">
                                    <span>cena_{String(scene.number).padStart(3, '0')}.jpg</span>
                                    <span>{scene.timecode || "00:00:00"}</span>
                                  </div>
                                  <X className="w-6 h-6 text-destructive" />
                                  <span className="text-[10px] text-destructive font-semibold">Mídia perdida</span>
                                  <span className="text-[9px] text-destructive/80">Media Not Found</span>
                                </button>
                              )}
                              <div className={cn(
                                "absolute bottom-1 left-1 px-1.5 py-0.5 rounded transition-colors",
                                isCurrentlyGenerating 
                                  ? "bg-primary text-primary-foreground" 
                                  : "bg-background/80"
                              )}>
                                <div className="text-xs font-bold leading-none">{scene.number}</div>
                                {scene.timecode && (
                                  <div className="text-[9px] text-muted-foreground font-mono leading-none mt-0.5">
                                    {scene.timecode}{scene.endTimecode ? `–${scene.endTimecode}` : ""}
                                  </div>
                                )}
                              </div>
                            </div>
                          )})}
                        </div>
                        
                        {/* Modal de progresso centralizado no grid */}
                        {generatingImages && (() => {
                          const elapsed = generationStartTime ? (Date.now() - generationStartTime) : 0;
                          const avgTimePerImage = imageBatchDone > 0 ? elapsed / imageBatchDone : 0;
                          const remaining = imageBatchTotal - imageBatchDone;
                          const estimatedRemainingMs = remaining * avgTimePerImage;
                          
                          const formatTime = (ms: number): string => {
                            if (ms <= 0) return "Calculando...";
                            const totalSeconds = Math.ceil(ms / 1000);
                            if (totalSeconds < 60) return `~${totalSeconds}s`;
                            const minutes = Math.floor(totalSeconds / 60);
                            const seconds = totalSeconds % 60;
                            return seconds > 0 ? `~${minutes}m ${seconds}s` : `~${minutes}m`;
                          };
                          
                          const timeEstimate = imageBatchDone > 0 ? formatTime(estimatedRemainingMs) : "Calculando...";
                          const avgPerImage = imageBatchDone > 0 ? `${(avgTimePerImage / 1000).toFixed(1)}s/img` : "";
                          
                          return (
                            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
                              <div className="bg-card border-2 border-primary/60 rounded-2xl shadow-2xl shadow-primary/20 px-6 py-5 min-w-[420px] max-w-lg">
                                <div className="flex items-center gap-5">
                                  {/* Logo maior */}
                                  <div className="relative w-16 h-16 flex-shrink-0">
                                    <div className="absolute inset-0 bg-primary/20 rounded-full animate-pulse" />
                                    <div className="relative w-16 h-16 rounded-full border-2 border-primary overflow-hidden">
                                      <img 
                                        src={logoGif} 
                                        alt="Loading" 
                                        className="w-full h-full object-cover scale-110"
                                      />
                                    </div>
                                  </div>
                                  
                                  {/* Progresso */}
                                  <div className="flex-1 space-y-2">
                                    <div className="flex items-center justify-between">
                                      <span className="text-base font-bold text-foreground">
                                        Gerando Imagens
                                      </span>
                                      <span className="text-lg font-bold text-primary">
                                        {imageBatchDone}/{imageBatchTotal}
                                      </span>
                                    </div>
                                    <Progress 
                                      value={imageBatchTotal > 0 ? (imageBatchDone / imageBatchTotal) * 100 : 0} 
                                      className="h-3 bg-secondary" 
                                    />
                                    {/* Estimativa de tempo */}
                                    <div className="flex items-center justify-between text-sm">
                                      <span className="text-muted-foreground flex items-center gap-1.5 font-medium">
                                        <Clock className="w-4 h-4" />
                                        {timeEstimate}
                                      </span>
                                      {avgPerImage && (
                                        <span className="text-muted-foreground">
                                          {avgPerImage}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  
                                  {/* Botão Cancelar */}
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={handleCancelGeneration}
                                    className="flex-shrink-0 h-10 w-10 text-destructive border-destructive/50 hover:bg-destructive/10"
                                    title="Cancelar"
                                  >
                                    <X className="w-5 h-5" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                        </div>
                      </div>
                      <ScrollArea className="h-[400px] pr-4">
                        <div className="space-y-4">
                          {generatedScenes.map((scene, index) => (
                            <div 
                              key={scene.number}
                              className="p-4 bg-secondary/50 rounded-lg border border-border/50"
                            >
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                  <Badge className="bg-primary/20 text-primary">
                                    Cena {scene.number}
                                  </Badge>
                                  <Badge variant="outline" className="font-mono">
                                    {scene.timecode}{scene.endTimecode ? `–${scene.endTimecode}` : ""}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">
                                    {scene.wordCount} palavras • {scene.estimatedTime}
                                  </span>
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => setExpandedScene(expandedScene === index ? null : index)}
                                  >
                                    {expandedScene === index ? (
                                      <ChevronUp className="w-4 h-4" />
                                    ) : (
                                      <ChevronDown className="w-4 h-4" />
                                    )}
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className={cn("h-8 w-8", copiedIndex === index && "text-green-500")}
                                    onClick={() => copyPrompt(scene.imagePrompt, index)}
                                  >
                                    <Copy className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => handleEditPrompt(index)}
                                    title="Editar prompt"
                                  >
                                    <Edit3 className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => handleRegenerateImage(index)}
                                    disabled={regeneratingIndex === index || currentGeneratingIndex === index}
                                    title="Regenerar imagem"
                                  >
                                    {regeneratingIndex === index ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <RefreshCw className="w-4 h-4" />
                                    )}
                                  </Button>
                                </div>
                              </div>

                              {expandedScene === index && (
                                <div className="mb-3 p-3 bg-background rounded border border-border">
                                  <p className="text-xs text-muted-foreground mb-1">Texto da Cena:</p>
                                  <p className="text-sm text-foreground">{scene.text}</p>
                                </div>
                              )}

                              <div className="p-3 bg-background rounded border border-border">
                                <div className="flex items-center justify-between mb-1">
                                  <p className="text-xs text-muted-foreground">Prompt de Imagem:</p>
                                  {editingPromptIndex === index ? (
                                    <div className="flex gap-1">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 text-green-500"
                                        onClick={() => handleSavePrompt(index)}
                                      >
                                        <Check className="w-3 h-3" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 text-destructive"
                                        onClick={handleCancelEdit}
                                      >
                                        <X className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  ) : null}
                                </div>
                                {editingPromptIndex === index ? (
                                  <Textarea
                                    value={editingPromptText}
                                    onChange={(e) => setEditingPromptText(e.target.value)}
                                    className="bg-secondary border-border font-mono text-sm min-h-24"
                                  />
                                ) : (
                                  <p className="text-sm text-foreground font-mono leading-relaxed">
                                    {scene.imagePrompt}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </Card>
                  )}
                </div>

              </div>
            </TabsContent>

            <TabsContent value="history" className="space-y-6">
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-6">
                  <History className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold text-foreground">Histórico de Análises</h3>
                </div>

                {loadingHistory ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : sceneHistory && sceneHistory.length > 0 ? (
                  <div className="space-y-4">
                    {sceneHistory.map((history) => (
                      <div 
                        key={history.id}
                        className="p-4 bg-secondary/50 rounded-lg border border-border/50"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-medium text-foreground mb-1">
                              {history.title || "Roteiro sem título"}
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              <Badge variant="outline" className="text-xs">
                                {history.total_scenes} cenas
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {history.total_words} palavras
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {history.estimated_duration}
                              </Badge>
                              {history.model_used && (
                                <Badge className="text-xs bg-primary/20 text-primary">
                                  {AI_MODELS.find(m => m.value === history.model_used)?.label || history.model_used}
                                </Badge>
                              )}
                              {history.style && (
                                <Badge variant="secondary" className="text-xs">
                                  {THUMBNAIL_STYLES.find(s => s.id === history.style)?.name || history.style}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => setExpandedHistory(expandedHistory === history.id ? null : history.id)}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Visualizar prompts</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10"
                                  onClick={() => loadFromHistory(history, true)}
                                >
                                  <ImageIcon className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Carregar prompts e gerar imagens</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => loadFromHistory(history, false)}
                                >
                                  <Copy className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Copiar roteiro</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive hover:text-destructive"
                                  onClick={() => deleteFromHistory(history.id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Excluir do histórico</TooltipContent>
                            </Tooltip>
                          </div>
                        </div>

                        <p className="text-xs text-muted-foreground mb-2">
                          {new Date(history.created_at).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>

                        {expandedHistory === history.id && (
                          <div className="mt-4 space-y-3">
                            <div className="p-3 bg-background rounded border border-border">
                              <p className="text-xs text-muted-foreground mb-1">Roteiro Original:</p>
                              <p className="text-sm text-foreground line-clamp-4">{history.script}</p>
                            </div>
                            
                            <div className="grid gap-3">
                              {history.scenes.slice(0, 3).map((scene) => (
                                <div key={scene.number} className="p-3 bg-background rounded border border-border">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Badge className="bg-primary/20 text-primary text-xs">
                                      Cena {scene.number}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground">
                                      {scene.wordCount} palavras
                                    </span>
                                  </div>
                                  <p className="text-xs text-foreground font-mono line-clamp-2">
                                    {scene.imagePrompt}
                                  </p>
                                </div>
                              ))}
                              {history.scenes.length > 3 && (
                                <p className="text-xs text-muted-foreground text-center">
                                  + {history.scenes.length - 3} cenas...
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Film className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Nenhuma análise no histórico</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Suas análises de roteiro aparecerão aqui
                    </p>
                  </div>
                )}
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Modal de Preview da Imagem */}
      <Dialog open={!!previewScene} onOpenChange={() => setPreviewScene(null)}>
        <DialogContent className="max-w-5xl bg-card border-primary/50 rounded-xl shadow-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Badge className="bg-primary/20 text-primary">Cena {previewScene?.number}</Badge>
                <span className="text-sm text-muted-foreground font-mono">
                  {previewScene?.timecode}{previewScene?.endTimecode ? `–${previewScene?.endTimecode}` : ""}
                </span>
                <span className="text-sm text-muted-foreground">
                  {previewScene?.wordCount} palavras • {previewScene?.estimatedTime}
                </span>
              </div>
              {/* Navegação entre cenas */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={previewIndex <= 0}
                  onClick={() => {
                    const newIndex = previewIndex - 1;
                    if (newIndex >= 0) {
                      setPreviewIndex(newIndex);
                      setPreviewScene(generatedScenes[newIndex]);
                      setPreviewEditPrompt(generatedScenes[newIndex].imagePrompt);
                    }
                  }}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm text-muted-foreground min-w-[60px] text-center">
                  {previewIndex + 1} / {generatedScenes.length}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={previewIndex >= generatedScenes.length - 1}
                  onClick={() => {
                    const newIndex = previewIndex + 1;
                    if (newIndex < generatedScenes.length) {
                      setPreviewIndex(newIndex);
                      setPreviewScene(generatedScenes[newIndex]);
                      setPreviewEditPrompt(generatedScenes[newIndex].imagePrompt);
                    }
                  }}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Imagem ampliada */}
            <div className="relative aspect-video rounded-lg overflow-hidden bg-secondary">
              {previewScene?.generatedImage ? (
                <img 
                  src={previewScene.generatedImage} 
                  alt={`Cena ${previewScene.number}`}
                  className="w-full h-full object-contain"
                />
              ) : regeneratingPreview ? (
                <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground">Gerando imagem...</span>
                </div>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                  <ImagePlus className="w-12 h-12 text-muted-foreground/30" />
                  <span className="text-sm text-muted-foreground">Nenhuma imagem gerada</span>
                </div>
              )}
            </div>

            {/* Editar Prompt e Regenerar */}
            <div className="p-4 bg-secondary/50 rounded-lg border border-border space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground">Prompt de Imagem</p>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => {
                      navigator.clipboard.writeText(previewEditPrompt);
                      toast({ title: "Copiado!", description: "Prompt copiado" });
                    }}
                  >
                    <Copy className="w-3 h-3 mr-1" />
                    Copiar
                  </Button>
                </div>
              </div>
              <Textarea
                value={previewEditPrompt}
                onChange={(e) => setPreviewEditPrompt(e.target.value)}
                className="bg-background border-border min-h-20 text-sm font-mono"
                placeholder="Edite o prompt aqui..."
              />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  disabled={regeneratingPreview || previewEditPrompt === previewScene?.imagePrompt}
                  onClick={() => {
                    // Salvar o prompt editado
                    setGeneratedScenes(prev => {
                      const updated = [...prev];
                      updated[previewIndex] = {
                        ...updated[previewIndex],
                        imagePrompt: previewEditPrompt,
                        generatedImage: undefined, // Limpar imagem antiga
                      };
                      return updated;
                    });
                    setPreviewScene(prev => prev ? { ...prev, imagePrompt: previewEditPrompt, generatedImage: undefined } : null);
                    toast({ title: "Prompt atualizado!", description: "Clique em Regenerar para criar nova imagem." });
                  }}
                >
                  <Check className="w-3 h-3 mr-1" />
                  Salvar Prompt
                </Button>
                <Button
                  size="sm"
                  className="flex-1 bg-primary text-primary-foreground"
                  disabled={regeneratingPreview}
                  onClick={async () => {
                    setRegeneratingPreview(true);
                    try {
                      const stylePrefix = THUMBNAIL_STYLES.find(s => s.id === style)?.promptPrefix || "";
                      const fullPrompt = stylePrefix ? `${stylePrefix} ${previewEditPrompt}` : previewEditPrompt;

                      const { data, error } = await supabase.functions.invoke("generate-imagefx", {
                        body: { prompt: fullPrompt, aspectRatio: "LANDSCAPE", numberOfImages: 1 }
                      });

                      if (error) throw error;
                      if ((data as any)?.error) throw new Error((data as any).error);

                      const url = (data as any)?.images?.[0]?.url;
                      if (url) {
                        // Atualizar cena com novo prompt e imagem
                        setGeneratedScenes(prev => {
                          const updated = [...prev];
                          updated[previewIndex] = {
                            ...updated[previewIndex],
                            imagePrompt: previewEditPrompt,
                            generatedImage: url,
                          };
                          return updated;
                        });
                        setPreviewScene(prev => prev ? { ...prev, imagePrompt: previewEditPrompt, generatedImage: url } : null);
                        toast({ title: "Imagem regenerada!", description: `Cena ${previewScene?.number} atualizada` });
                      }
                    } catch (err: any) {
                      toast({ title: "Erro", description: err.message || "Falha ao regenerar", variant: "destructive" });
                    } finally {
                      setRegeneratingPreview(false);
                    }
                  }}
                >
                  {regeneratingPreview ? (
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  ) : (
                    <RefreshCw className="w-3 h-3 mr-1" />
                  )}
                  Regenerar
                </Button>
              </div>
            </div>

            {/* Texto da cena */}
            <div className="p-4 bg-secondary/50 rounded-lg border border-border">
              <p className="text-xs font-medium text-muted-foreground mb-2">Texto da Cena</p>
              <p className="text-sm text-foreground leading-relaxed">
                {previewScene?.text}
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Loading - Análise de Roteiro */}
      <Dialog open={generating} onOpenChange={() => {}}>
        <DialogContent className="max-w-sm bg-card border-primary/50 rounded-2xl shadow-xl" hideCloseButton>
          <div className="flex flex-col items-center justify-center py-10 space-y-6">
            {/* Logo com efeito de pulso - PADRONIZADO */}
            <div className="relative w-24 h-24">
              <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
              <div className="absolute inset-0 bg-primary/10 rounded-full animate-pulse" />
              <div className="relative w-24 h-24 rounded-full border-2 border-primary/50 overflow-hidden">
                <img 
                  src={logoGif} 
                  alt="Loading" 
                  className="w-full h-full object-cover scale-110"
                />
              </div>
            </div>
            
            {/* Mensagem de progresso */}
            <div className="text-center space-y-1">
              <h3 className="text-lg font-semibold text-foreground">
                {chunkProgress.total > 1 ? 'Processando Roteiro' : 'Analisando Roteiro'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {loadingMessage}
              </p>
            </div>

            {/* Contador de partes (se houver mais de 1) */}
            {chunkProgress.total > 1 && (
              <div className="flex items-center gap-2">
                {Array.from({ length: chunkProgress.total }).map((_, idx) => (
                  <div 
                    key={idx}
                    className={cn(
                      "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300",
                      idx < chunkProgress.current
                        ? "bg-primary text-primary-foreground"
                        : idx === chunkProgress.current - 1
                          ? "bg-primary/80 text-primary-foreground animate-pulse"
                          : "bg-muted-foreground/20 text-muted-foreground"
                    )}
                  >
                    {idx < chunkProgress.current ? (
                      <Check className="w-3 h-3" />
                    ) : (
                      idx + 1
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Barra de progresso */}
            <div className="w-full space-y-2">
              <Progress value={progress} className="h-1.5 bg-secondary" />
              <p className="text-xs text-center text-muted-foreground">
                {sceneProgress.total > 0 ? `${progress}% • ${sceneProgress.done}/${sceneProgress.total}` : `${progress}%`}
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>


      {/* Modal de Instruções CapCut */}
      <Dialog open={showCapcutInstructions} onOpenChange={setShowCapcutInstructions}>
        <DialogContent className="max-w-2xl bg-card border-primary/50 rounded-xl shadow-xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="pb-2">
            <DialogTitle className="flex items-center gap-2 text-foreground text-base">
              <Video className="w-4 h-4 text-primary" />
              Exportar para CapCut
            </DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="flex-1 pr-2">
            <div className="space-y-3">
              {/* Nome do Projeto */}
              <div className="space-y-1">
                <Label className="text-xs font-medium flex items-center gap-1.5">
                  <FileText className="w-3 h-3 text-primary" />
                  Nome do Projeto
                </Label>
                <Input
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="Meu Projeto"
                  className="bg-secondary/50 h-8 text-sm"
                />
              </div>

              {/* Seletor de Templates - Compacto */}
              <div className="space-y-2">
                <Label className="text-xs font-medium flex items-center gap-1.5">
                  <Layout className="w-3 h-3 text-primary" />
                  Template
                </Label>
                
                <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                  <SelectTrigger className="h-8 bg-secondary/50 text-xs">
                    <SelectValue placeholder="Selecione um template" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {TEMPLATE_CATEGORIES.map((category) => (
                      <div key={category.id}>
                        <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground">
                          {category.icon} {category.name}
                        </div>
                        {CAPCUT_TEMPLATES.filter(t => t.category === category.id).map((template) => (
                          <SelectItem key={template.id} value={template.id} className="text-xs">
                            <span className="flex items-center gap-2">
                              <span>{template.preview}</span>
                              <span>{template.name}</span>
                            </span>
                          </SelectItem>
                        ))}
                      </div>
                    ))}
                  </SelectContent>
                </Select>

                {/* Preview compacto */}
                {selectedTemplate && (
                  <div className="p-2 bg-secondary/30 rounded-lg border border-border">
                    <TemplatePreview 
                      template={CAPCUT_TEMPLATES.find(t => t.id === selectedTemplate) || CAPCUT_TEMPLATES[0]}
                      isActive={true}
                    />
                  </div>
                )}
              </div>
              
              {/* Seletor de Estilo de Legenda */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium flex items-center gap-1.5">
                    <Type className="w-3 h-3 text-cyan-400" />
                    Estilo de Legenda
                  </Label>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setShowSubtitleSelector(!showSubtitleSelector)}
                    className="h-6 text-[10px] px-2"
                  >
                    {showSubtitleSelector ? 'Ocultar' : 'Ver Todos'}
                  </Button>
                </div>
                
                <Select value={selectedSubtitleStyle} onValueChange={setSelectedSubtitleStyle}>
                  <SelectTrigger className="h-8 bg-secondary/50 text-xs">
                    <SelectValue placeholder="Selecione um estilo" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {SUBTITLE_STYLES.map((style) => (
                      <SelectItem key={style.id} value={style.id} className="text-xs">
                        <span className="flex items-center gap-2">
                          <span 
                            className="w-4 h-4 rounded text-[8px] flex items-center justify-center font-bold"
                            style={{ 
                              backgroundColor: style.preview.bgColor === 'transparent' ? '#1a1a2e' : style.preview.bgColor,
                              color: style.preview.textColor === 'transparent' ? '#fff' : style.preview.textColor,
                              textShadow: style.preview.textShadow
                            }}
                          >
                            A
                          </span>
                          <span>{style.name}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {/* Preview de legenda expandido */}
                {showSubtitleSelector && (
                  <div className="grid grid-cols-2 gap-2 p-2 bg-secondary/30 rounded-lg border border-border">
                    {SUBTITLE_STYLES.map((style) => (
                      <button
                        key={style.id}
                        onClick={() => setSelectedSubtitleStyle(style.id)}
                        className={cn(
                          "relative p-3 rounded-lg border-2 transition-all text-left",
                          selectedSubtitleStyle === style.id 
                            ? "border-cyan-400 bg-cyan-400/10" 
                            : "border-border hover:border-cyan-400/50"
                        )}
                      >
                        <div 
                          className="relative h-8 bg-gradient-to-br from-gray-800 to-gray-900 rounded flex items-center justify-center overflow-hidden"
                        >
                          <span 
                            className={cn(
                              "text-xs font-medium px-2 py-0.5",
                              style.preview.fontSize,
                              style.preview.fontWeight,
                              style.preview.borderRadius,
                              style.preview.padding
                            )}
                            style={{ 
                              backgroundColor: style.preview.bgColor,
                              color: style.preview.textColor === 'transparent' ? '#fff' : style.preview.textColor,
                              textShadow: style.preview.textShadow,
                              WebkitTextStroke: style.preview.border ? '1px white' : undefined
                            }}
                          >
                            Exemplo
                          </span>
                        </div>
                        <p className="text-[10px] font-medium mt-1.5">{style.name}</p>
                        <p className="text-[9px] text-muted-foreground line-clamp-1">{style.description}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Configurações de Áudio */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium flex items-center gap-1.5">
                    <Music className="w-3 h-3 text-green-400" />
                    Áudio & Mixagem
                  </Label>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setShowAudioSettings(!showAudioSettings)}
                    className="h-6 text-[10px] px-2"
                  >
                    {showAudioSettings ? 'Ocultar' : 'Configurar'}
                  </Button>
                </div>
                
                <div className="p-2 bg-secondary/30 rounded-lg border border-border">
                  <p className="text-[10px] text-muted-foreground mb-2">
                    O pacote inclui pastas para você adicionar seus áudios:
                  </p>
                  <div className="grid grid-cols-2 gap-1 text-[9px]">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <span className="text-green-400">📁</span> Narração
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <span className="text-yellow-400">📁</span> Música Intro
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <span className="text-blue-400">📁</span> Background
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <span className="text-purple-400">📁</span> Outro / SFX
                    </div>
                  </div>
                </div>
                
                {/* Configurações de volume expandidas */}
                {showAudioSettings && (
                  <div className="space-y-3 p-3 bg-secondary/30 rounded-lg border border-border">
                    <p className="text-[10px] text-muted-foreground">
                      Configure os volumes recomendados para a mixagem:
                    </p>
                    
                    {/* Narração */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] flex items-center gap-1">
                          <Volume2 className="w-3 h-3 text-green-400" />
                          Narração
                        </span>
                        <span className="text-[10px] font-mono text-green-400">{audioMixSettings.narrationVolume}%</span>
                      </div>
                      <Slider
                        value={[audioMixSettings.narrationVolume]}
                        onValueChange={([v]) => setAudioMixSettings({...audioMixSettings, narrationVolume: v})}
                        max={100}
                        step={5}
                        className="h-1"
                      />
                    </div>
                    
                    {/* Intro */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] flex items-center gap-1">
                          <Music className="w-3 h-3 text-yellow-400" />
                          Música Intro
                        </span>
                        <span className="text-[10px] font-mono text-yellow-400">{audioMixSettings.introVolume}%</span>
                      </div>
                      <Slider
                        value={[audioMixSettings.introVolume]}
                        onValueChange={([v]) => setAudioMixSettings({...audioMixSettings, introVolume: v})}
                        max={100}
                        step={5}
                        className="h-1"
                      />
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] text-muted-foreground">Duração antes de fade:</span>
                        <Input
                          type="number"
                          value={audioMixSettings.introDuration}
                          onChange={(e) => setAudioMixSettings({...audioMixSettings, introDuration: parseInt(e.target.value) || 5})}
                          className="h-5 w-14 text-[10px] text-center"
                          min={1}
                          max={30}
                        />
                        <span className="text-[9px] text-muted-foreground">segundos</span>
                      </div>
                    </div>
                    
                    {/* Background */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] flex items-center gap-1">
                          <Music className="w-3 h-3 text-blue-400" />
                          Background
                        </span>
                        <span className="text-[10px] font-mono text-blue-400">{audioMixSettings.backgroundVolume}%</span>
                      </div>
                      <Slider
                        value={[audioMixSettings.backgroundVolume]}
                        onValueChange={([v]) => setAudioMixSettings({...audioMixSettings, backgroundVolume: v})}
                        max={100}
                        step={5}
                        className="h-1"
                      />
                      <div className="flex items-center gap-2">
                        <Checkbox 
                          id="ducking"
                          checked={audioMixSettings.backgroundDucking}
                          onCheckedChange={(c) => setAudioMixSettings({...audioMixSettings, backgroundDucking: !!c})}
                        />
                        <label htmlFor="ducking" className="text-[9px] text-muted-foreground">
                          Ativar Ducking (reduz para {audioMixSettings.backgroundDuckingLevel}% durante narração)
                        </label>
                      </div>
                    </div>
                    
                    {/* Outro */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] flex items-center gap-1">
                          <Music className="w-3 h-3 text-purple-400" />
                          Música Outro
                        </span>
                        <span className="text-[10px] font-mono text-purple-400">{audioMixSettings.outroVolume}%</span>
                      </div>
                      <Slider
                        value={[audioMixSettings.outroVolume]}
                        onValueChange={([v]) => setAudioMixSettings({...audioMixSettings, outroVolume: v})}
                        max={100}
                        step={5}
                        className="h-1"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Timeline Visual compacta */}
              {generatedScenes.length > 0 && (
                <SceneTimeline
                  scenes={generatedScenes.map(scene => ({
                    number: scene.number,
                    text: scene.text,
                    wordCount: scene.wordCount,
                    durationSeconds: Math.max(1, wordCountToSeconds(scene.wordCount)),
                    generatedImage: scene.generatedImage
                  }))}
                  className="p-2 bg-secondary/30 rounded-lg border border-border"
                />
              )}
            </div>
          </ScrollArea>

          <div className="space-y-2 pt-2 border-t border-border">
            {/* Botões principais */}
            <div className="flex gap-2">
              {/* Input oculto para importar arquivos */}
              <input
                ref={importImagesInputRef}
                type="file"
                accept="image/jpeg,image/png"
                multiple
                className="hidden"
                onChange={handleImportImagesFromFiles}
              />
              <Button
                variant="outline"
                onClick={() => importImagesInputRef.current?.click()}
                className="flex-1 h-8 text-xs"
              >
                <FolderSearch className="w-3 h-3 mr-1" />
                Importar
              </Button>
              <Button
                variant="outline"
                onClick={handleConfirmCapcutExport}
                className="flex-1 h-8 text-xs"
              >
                <Download className="w-3 h-3 mr-1" />
                Baixar ZIP
              </Button>
              <Button
                variant="outline"
                onClick={openSrtPreview}
                disabled={generatedScenes.length === 0}
                className="flex-1 h-8 text-xs border-cyan-500/50 text-cyan-500 hover:bg-cyan-500/10"
              >
                <Eye className="w-3 h-3 mr-1" />
                Preview SRT
              </Button>
            </div>

            {/* Exportar EDL para DaVinci Resolve */}
            <div className="p-2 bg-secondary/50 rounded-lg border border-border">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">🎬</span>
                  <span className="font-medium text-xs text-foreground">DaVinci Resolve</span>
                </div>
                <Badge variant="outline" className="text-[9px] h-4">EDL</Badge>
              </div>
              
              {/* Seletor de FPS + Botões */}
              <div className="flex items-center gap-2 mb-2">
                <Select value={edlFps} onValueChange={setEdlFps}>
                  <SelectTrigger className="h-7 w-24 bg-background border-border text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="24">24 fps</SelectItem>
                    <SelectItem value="25">25 fps</SelectItem>
                    <SelectItem value="30">30 fps</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportXml}
                  disabled={generatedScenes.filter(s => s.generatedImage).length === 0}
                  className="flex-1 h-7 text-xs"
                >
                  <FileText className="w-3 h-3 mr-1" />
                  XML
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportXmlTutorial}
                  disabled={generatedScenes.length === 0}
                  className="h-7 text-xs border-amber-500/50 text-amber-500 hover:bg-amber-500/10"
                  title="Tutorial passo a passo para importar no DaVinci"
                >
                  <Eye className="w-3 h-3 mr-1" />
                  Tutorial
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground">
                Baixe o Tutorial para ver como importar o XML e as mídias
              </p>
            </div>

            {/* Gerar MP4 com FFmpeg - Em Breve */}
            <div className="p-2 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-lg border border-purple-500/30 opacity-60">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <Play className="w-4 h-4 text-purple-400" />
                  <span className="font-medium text-xs text-foreground">Gerar Vídeo MP4</span>
                </div>
                <Badge className="bg-amber-500/20 text-amber-300 text-[9px] h-4">EM BREVE</Badge>
              </div>
              <p className="text-[10px] text-muted-foreground mb-2">
                Vídeo com narração sincronizada às imagens - aguarde nova versão
              </p>
              <Button
                variant="outline"
                size="sm"
                disabled={true}
                className="w-full h-7 text-xs border-purple-500/30 cursor-not-allowed"
              >
                <Video className="w-3 h-3 mr-1" />
                Em Breve
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Sincronização com Áudio */}
      <Dialog open={showDurationModal} onOpenChange={setShowDurationModal}>
        <DialogContent className="max-w-md bg-card border-primary/50 rounded-xl shadow-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <Timer className="w-5 h-5 text-amber-500" />
              Sincronizar com Áudio do CapCut
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Informe a duração real do áudio gerado no CapCut para calcular o WPM correto
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Info das palavras */}
            <div className="p-3 bg-secondary/50 rounded-lg border border-border">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total de palavras no roteiro:</span>
                <span className="font-bold text-foreground">{totalWords} palavras</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-1">
                <span className="text-muted-foreground">WPM atual:</span>
                <span className="font-bold text-primary">{currentWpm} WPM</span>
              </div>
            </div>

            {/* Input de duração com formatação automática */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Duração do áudio (MM:SS)
              </Label>
              <Input
                placeholder="Ex: 3:45"
                value={audioDurationInput}
                onChange={(e) => {
                  // Remover tudo que não é dígito
                  let digits = e.target.value.replace(/\D/g, "");
                  
                  // Limitar a 4 dígitos (99:59 máximo)
                  digits = digits.slice(0, 4);
                  
                  // Formatar automaticamente com ":"
                  if (digits.length >= 3) {
                    // Separar minutos e segundos
                    const secs = digits.slice(-2);
                    const mins = digits.slice(0, -2);
                    setAudioDurationInput(`${mins}:${secs}`);
                  } else if (digits.length > 0) {
                    setAudioDurationInput(digits);
                  } else {
                    setAudioDurationInput("");
                  }
                }}
                className="bg-secondary/50 text-lg font-mono text-center"
                maxLength={5}
              />
              <p className="text-xs text-muted-foreground">
                Digite apenas números (ex: 345 → 3:45)
              </p>
            </div>

            {/* Preview do cálculo */}
            {audioDurationInput.trim() && (() => {
              let durationSeconds = 0;
              if (audioDurationInput.includes(":")) {
                const parts = audioDurationInput.split(":");
                const mins = parseInt(parts[0]) || 0;
                const secs = parseInt(parts[1]) || 0;
                durationSeconds = mins * 60 + secs;
              } else {
                durationSeconds = parseFloat(audioDurationInput) || 0;
              }
              
              if (durationSeconds > 0 && totalWords > 0) {
                const previewWpm = Math.round(totalWords / (durationSeconds / 60));
                const clampedWpm = Math.max(80, Math.min(250, previewWpm));
                
                return (
                  <div className="p-3 bg-amber-500/10 rounded-lg border border-amber-500/30">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">WPM calculado:</span>
                      <span className="font-bold text-amber-500 text-lg">{clampedWpm} WPM</span>
                    </div>
                    {previewWpm !== clampedWpm && (
                      <p className="text-xs text-muted-foreground mt-1">
                        (Ajustado de {previewWpm} para faixa válida 80-250)
                      </p>
                    )}
                  </div>
                );
              }
              return null;
            })()}

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDurationModal(false);
                  setAudioDurationInput("");
                }}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleCalculateFromDuration}
                className="flex-1 bg-amber-500 text-white hover:bg-amber-600"
                disabled={!audioDurationInput.trim() || totalWords === 0}
              >
                <Timer className="w-4 h-4 mr-2" />
                Calcular e Aplicar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Marcadores do YouTube */}
      <Dialog open={showYouTubeChapters} onOpenChange={setShowYouTubeChapters}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Film className="w-5 h-5 text-red-500" />
              Marcadores de Capítulo
            </DialogTitle>
            <DialogDescription>
              Cole na descrição do seu vídeo no YouTube
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-secondary/50 rounded-lg p-4 max-h-64 overflow-y-auto">
              <pre className="text-sm text-foreground whitespace-pre-wrap font-mono">
                {youtubeChapters}
              </pre>
            </div>
            
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
              <p className="text-xs text-amber-600 dark:text-amber-400">
                <strong>💡 Dica:</strong> O YouTube exige que o primeiro capítulo comece em 00:00 
                e que cada capítulo tenha no mínimo 10 segundos.
              </p>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowYouTubeChapters(false)}
                className="flex-1"
              >
                Fechar
              </Button>
              <Button
                onClick={copyYouTubeChapters}
                className="flex-1 bg-red-500 text-white hover:bg-red-600"
              >
                <Copy className="w-4 h-4 mr-2" />
                Copiar Marcadores
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Geração de Vídeo MP4 */}
      <Dialog open={showVideoModal} onOpenChange={setShowVideoModal}>
        <DialogContent className="max-w-lg bg-card border-purple-500/30 rounded-xl shadow-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <Play className="w-5 h-5 text-purple-400" />
              Gerar Vídeo MP4 com Efeitos
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Configure os efeitos e gere um vídeo diretamente no navegador
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Resolução */}
            <div className="flex items-center justify-between">
              <Label className="text-sm">Resolução</Label>
              <Select value={videoResolution} onValueChange={(v) => setVideoResolution(v as "720p" | "1080p")}>
                <SelectTrigger className="w-32 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="720p">720p HD</SelectItem>
                  <SelectItem value="1080p">1080p Full HD</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Efeito Ken Burns */}
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm">Efeito Ken Burns</Label>
                <p className="text-xs text-muted-foreground">Zoom suave nas imagens</p>
              </div>
              <Switch checked={videoKenBurns} onCheckedChange={setVideoKenBurns} />
            </div>

            {/* Transição */}
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm">Transição entre cenas</Label>
                <p className="text-xs text-muted-foreground">Efeito visual entre cenas</p>
              </div>
              <Switch checked={videoTransitionEnabled} onCheckedChange={setVideoTransitionEnabled} />
            </div>

            {videoTransitionEnabled && (
              <div className="space-y-3 pl-4 border-l-2 border-purple-500/30">
                <div className="space-y-2">
                  <Label className="text-sm">Tipo de transição</Label>
                  <Select value={videoTransitionType} onValueChange={(v) => setVideoTransitionType(v as any)}>
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fade">✨ Dissolve (Fade)</SelectItem>
                      <SelectItem value="wipeleft">⬅️ Wipe Left</SelectItem>
                      <SelectItem value="wiperight">➡️ Wipe Right</SelectItem>
                      <SelectItem value="wipeup">⬆️ Wipe Up</SelectItem>
                      <SelectItem value="wipedown">⬇️ Wipe Down</SelectItem>
                      <SelectItem value="slideleft">📤 Slide Left</SelectItem>
                      <SelectItem value="slideright">📥 Slide Right</SelectItem>
                      <SelectItem value="zoomin">🔍 Zoom In</SelectItem>
                      <SelectItem value="circleopen">⭕ Circle Open</SelectItem>
                      <SelectItem value="dissolve">🌀 Dissolve</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Duração</Label>
                  <Select value={videoTransitionDuration} onValueChange={setVideoTransitionDuration}>
                    <SelectTrigger className="w-24 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0.3">0.3s</SelectItem>
                      <SelectItem value="0.5">0.5s</SelectItem>
                      <SelectItem value="0.8">0.8s</SelectItem>
                      <SelectItem value="1">1.0s</SelectItem>
                      <SelectItem value="1.5">1.5s</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Filtro de cor */}
            <div className="space-y-2">
              <Label className="text-sm">Filtro de Cor</Label>
              <Select value={videoColorFilter} onValueChange={(v) => setVideoColorFilter(v as any)}>
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem filtro</SelectItem>
                  <SelectItem value="cinematic">🎬 Cinemático</SelectItem>
                  <SelectItem value="warm">🌅 Quente</SelectItem>
                  <SelectItem value="cool">❄️ Frio</SelectItem>
                  <SelectItem value="vintage">📼 Vintage</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Info */}
            <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3">
              <p className="text-xs text-purple-300">
                <strong>ℹ️ Info:</strong> {generatedScenes.filter(s => s.generatedImage).length} cenas serão processadas. 
                O vídeo será gerado no navegador usando FFmpeg.wasm. 
                Isso pode levar alguns minutos dependendo do tamanho.
              </p>
            </div>

            {/* Progress */}
            {isGeneratingVideo && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{videoProgress.message}</span>
                  <span className="font-mono text-purple-400">{Math.round(videoProgress.progress)}%</span>
                </div>
                <Progress value={videoProgress.progress} className="h-2" />
                
                {/* Detalhes de download */}
                {videoProgress.stage === "loading" && videoProgress.downloadedMB !== undefined && videoProgress.totalMB !== undefined && videoProgress.totalMB > 0 && (
                  <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground bg-background/50 rounded-lg p-2">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                      <span className="font-medium">{videoProgress.downloadedMB.toFixed(1)}MB</span>
                      <span>/</span>
                      <span>{videoProgress.totalMB.toFixed(1)}MB</span>
                    </div>
                    <span className="text-muted-foreground/60">•</span>
                    <span className="text-muted-foreground/80">
                      {Math.round((videoProgress.downloadedMB / videoProgress.totalMB) * 100)}% baixado
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Video Preview */}
            {generatedVideoBlob && !isGeneratingVideo && (
              <div className="space-y-2">
                <Label className="text-sm text-green-400">✅ Vídeo gerado com sucesso!</Label>
                <video 
                  controls 
                  className="w-full rounded-lg border border-border"
                  src={URL.createObjectURL(generatedVideoBlob)}
                />
              </div>
            )}

            {/* Botões */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowVideoModal(false)}
                className="flex-1"
                disabled={isGeneratingVideo}
              >
                Fechar
              </Button>
              
              {generatedVideoBlob && !isGeneratingVideo ? (
                <Button
                  onClick={handleDownloadGeneratedVideo}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:opacity-90"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Baixar MP4
                </Button>
              ) : (
                <Button
                  onClick={handleGenerateVideo}
                  disabled={isGeneratingVideo || generatedScenes.filter(s => s.generatedImage).length === 0}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:opacity-90"
                >
                  {isGeneratingVideo ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Gerando...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Gerar Vídeo
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Preview do SRT */}
      <Dialog open={showSrtPreview} onOpenChange={setShowSrtPreview}>
        <DialogContent className="max-w-2xl max-h-[85vh] bg-card border-cyan-500/30 rounded-xl shadow-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <Type className="w-5 h-5 text-cyan-500" />
              Preview de Legendas SRT
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Revise os blocos de legenda antes de baixar
            </DialogDescription>
          </DialogHeader>
          
          {srtPreviewData && (
            <div className="space-y-4">
              {/* Estatísticas */}
              {(() => {
                const fullText = srtPreviewData.blocks.map(b => b.text).join(' ');
                const totalWords = fullText.split(/\s+/).filter(Boolean).length;
                const totalChars = fullText.length;
                const lastEnd = srtPreviewData.blocks.length > 0 ? srtPreviewData.blocks[srtPreviewData.blocks.length - 1].end.split(',')[0] : '00:00:00';
                return (
                  <div className="grid grid-cols-5 gap-2">
                    <div className="bg-secondary/50 rounded-lg p-3 text-center">
                      <p className="text-xl font-bold text-cyan-500">{srtPreviewData.blocks.length}</p>
                      <p className="text-xs text-muted-foreground">Blocos</p>
                    </div>
                    <div className="bg-secondary/50 rounded-lg p-3 text-center">
                      <p className="text-xl font-bold text-purple-500">{totalWords.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">Palavras</p>
                    </div>
                    <div className="bg-secondary/50 rounded-lg p-3 text-center">
                      <p className="text-xl font-bold text-amber-500">{totalChars.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">Caracteres</p>
                    </div>
                    <div className="bg-secondary/50 rounded-lg p-3 text-center">
                      <p className="text-xl font-bold text-primary">{currentWpm}</p>
                      <p className="text-xs text-muted-foreground">WPM</p>
                    </div>
                    <div className="bg-secondary/50 rounded-lg p-3 text-center">
                      <p className="text-xl font-bold text-green-500">{lastEnd}</p>
                      <p className="text-xs text-muted-foreground">Duração</p>
                    </div>
                  </div>
                );
              })()}

              {/* Lista de blocos */}
              <ScrollArea className="h-[45vh] pr-4">
                <div className="space-y-2">
                  {srtPreviewData.blocks.map((block, idx) => (
                    <div key={idx}>
                      <div 
                        className={cn(
                          "p-3 rounded-lg border transition-colors",
                          block.charCount > 499 
                            ? "bg-red-500/10 border-red-500/30" 
                            : block.charCount > 400 
                              ? "bg-amber-500/10 border-amber-500/30"
                              : "bg-secondary/50 border-border"
                        )}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs font-mono">
                              #{block.index}
                            </Badge>
                            <span className="text-xs font-mono text-muted-foreground">
                              {block.start.split(',')[0]} → {block.end.split(',')[0]}
                            </span>
                          </div>
                          <Badge 
                            variant={block.charCount > 499 ? "destructive" : block.charCount > 400 ? "outline" : "secondary"}
                            className="text-xs"
                          >
                            {block.charCount} chars
                          </Badge>
                        </div>
                        <p className="text-sm text-foreground leading-relaxed">
                          {block.text}
                        </p>
                      </div>
                      
                      {/* Separador visual de 10s entre blocos */}
                      {idx < srtPreviewData.blocks.length - 1 && (
                        <div className="flex items-center gap-2 py-2">
                          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
                          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20">
                            <Timer className="w-3 h-3 text-primary" />
                            <span className="text-[10px] font-mono text-primary">+10s</span>
                          </div>
                          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {/* Legenda de cores */}
              <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-secondary/50 border border-border" />
                  <span>≤400 chars</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-amber-500/10 border border-amber-500/30" />
                  <span>401-499 chars</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-red-500/10 border border-red-500/30" />
                  <span>&gt;499 chars</span>
                </div>
              </div>

              {/* Botões de ação */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowSrtPreview(false)}
                  className="flex-1"
                >
                  Fechar
                </Button>
                <Button
                  variant="outline"
                  onClick={copySrtFromPreview}
                  className="flex-1"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copiar
                </Button>
                <Button
                  onClick={downloadSrtFromPreview}
                  className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:opacity-90"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Baixar SRT
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Validação EDL - Cenas Faltantes */}
      <Dialog open={showEdlValidationModal} onOpenChange={setShowEdlValidationModal}>
        <DialogContent className="max-w-lg max-h-[85vh] bg-card border-amber-500/30 rounded-xl shadow-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <Film className="w-5 h-5 text-amber-500" />
              Exportar XML para DaVinci
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {edlValidationData ? 'Algumas cenas não possuem imagem gerada' : 'Configure as transições do projeto'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Preview Animado da Transição */}
            <div className="flex justify-center">
              <TransitionPreview 
                transitionType={selectedTransition} 
                className="w-full max-w-xs"
              />
            </div>

            {/* Seletor de Transição */}
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Tipo de Transição:</p>
              <div className="grid grid-cols-3 gap-2">
                {TRANSITION_OPTIONS.map((transition) => (
                  <button
                    key={transition.id}
                    onClick={() => setSelectedTransition(transition.id)}
                    className={cn(
                      "flex flex-col items-center gap-1 p-2 rounded-lg border text-center transition-all",
                      selectedTransition === transition.id
                        ? "border-amber-500 bg-amber-500/10 text-foreground"
                        : "border-border/50 bg-secondary/30 text-muted-foreground hover:bg-secondary/50"
                    )}
                  >
                    <span className="text-xl">{transition.icon}</span>
                    <p className="text-[10px] font-medium truncate w-full">{transition.name}</p>
                  </button>
                ))}
              </div>
            </div>

            {edlValidationData && (
              <>
                {/* Estatísticas */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-secondary/50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-green-500">{edlValidationData.withImages}</p>
                    <p className="text-xs text-muted-foreground">Com Imagem</p>
                  </div>
                  <div className="bg-secondary/50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-red-500">{edlValidationData.missingScenes.length}</p>
                    <p className="text-xs text-muted-foreground">Sem Imagem</p>
                  </div>
                  <div className="bg-secondary/50 rounded-lg p-3 text-center">
                    <p className={cn(
                      "text-2xl font-bold",
                      edlValidationData.percentage >= 80 ? "text-amber-500" : "text-red-500"
                    )}>
                      {edlValidationData.percentage}%
                    </p>
                    <p className="text-xs text-muted-foreground">Cobertura</p>
                  </div>
                </div>

                {/* Alerta visual */}
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <ImagePlus className="w-5 h-5 text-amber-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-amber-500">
                        {edlValidationData.missingScenes.length} cena{edlValidationData.missingScenes.length > 1 ? 's' : ''} sem imagem
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        O XML incluirá apenas as cenas que possuem imagem. Cenas faltantes criarão gaps na timeline do DaVinci.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Lista de cenas faltantes */}
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">Cenas sem imagem:</p>
                  <ScrollArea className="max-h-32">
                    <div className="flex flex-wrap gap-1.5">
                      {edlValidationData.missingScenes.map((sceneNum) => (
                        <Badge 
                          key={sceneNum} 
                          variant="outline" 
                          className="text-xs font-mono bg-red-500/10 border-red-500/30 text-red-400"
                        >
                          #{String(sceneNum).padStart(3, '0')}
                        </Badge>
                      ))}
                    </div>
                  </ScrollArea>
                </div>

                {/* Botões de ação - com cenas faltantes */}
                <div className="flex flex-col gap-2 pt-2">
                  <Button
                    onClick={handleGenerateMissingFromEdlModal}
                    disabled={bgState.isGenerating}
                    className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:opacity-90"
                  >
                    <Wand2 className="w-4 h-4 mr-2" />
                    Gerar {edlValidationData.missingScenes.length} Imagens Faltantes
                  </Button>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowEdlValidationModal(false)}
                      className="flex-1"
                    >
                      Cancelar
                    </Button>
                    <Button
                      variant="outline"
                      onClick={executeXmlExport}
                      className="flex-1 border-amber-500/50 text-amber-500 hover:bg-amber-500/10"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Exportar Mesmo Assim
                    </Button>
                  </div>
                </div>
              </>
            )}

            {/* Botões de ação - sem cenas faltantes */}
            {!edlValidationData && (
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setShowEdlValidationModal(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={executeXmlExport}
                  className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:opacity-90"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Exportar XML
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default PromptsImages;

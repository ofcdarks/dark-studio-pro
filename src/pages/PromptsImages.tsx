import { MainLayout } from "@/components/layout/MainLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import JSZip from "jszip";
import { Textarea } from "@/components/ui/textarea";
import { generateCapcutDraftContentWithTemplate, generateCapcutDraftMetaInfoWithTemplate, CAPCUT_TEMPLATES, TEMPLATE_CATEGORIES, CapcutTemplate } from "@/lib/capcutTemplates";
import { generateNarrationSrt } from "@/lib/srtGenerator";
import { TemplatePreview } from "@/components/capcut/TemplatePreview";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { 
  Image, 
  Wand2, 
  Copy, 
  Save, 
  History, 
  Loader2, 
  Film, 
  Clock, 
  FileText, 
  Sparkles,
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
  Layout
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { usePersistedState } from "@/hooks/usePersistedState";
import { SessionIndicator } from "@/components/ui/session-indicator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { THUMBNAIL_STYLES, THUMBNAIL_STYLE_CATEGORIES } from "@/lib/thumbnailStyles";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import logoGif from "@/assets/logo.gif";

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

// Calcular tempo estimado baseado em palavras (média 150 palavras/min para narração)
const calculateEstimatedTime = (wordCount: number): string => {
  const minutes = wordCount / 150;
  if (minutes < 1) {
    return `${Math.round(minutes * 60)}s`;
  }
  const mins = Math.floor(minutes);
  const secs = Math.round((minutes - mins) * 60);
  return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
};

const WORDS_PER_MINUTE = 150;

const wordCountToSeconds = (wordCount: number): number => (wordCount / WORDS_PER_MINUTE) * 60;

const formatTimecode = (totalSeconds: number): string => {
  const s = Math.max(0, Math.floor(totalSeconds));
  const mins = Math.floor(s / 60);
  const secs = s % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
};

// Calcular timecode baseado em posição no roteiro
const calculateTimecode = (scenes: ScenePrompt[], currentIndex: number): string => {
  let totalSeconds = 0;
  for (let i = 0; i < currentIndex; i++) {
    totalSeconds += wordCountToSeconds(scenes[i].wordCount);
  }
  return formatTimecode(totalSeconds);
};

const PromptsImages = () => {
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
  
  // Atualizar persistedScenes quando generatedScenes mudar (sem imagens)
  const updateScenes = (scenes: ScenePrompt[]) => {
    setGeneratedScenes(scenes);
    // Persistir apenas metadados (sem imagens base64)
    setPersistedScenes(scenes.map(({ generatedImage, generatingImage, ...rest }) => rest));
  };
  
  // Non-persisted states
  const [generating, setGenerating] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [expandedScene, setExpandedScene] = useState<number | null>(null);
  const [expandedHistory, setExpandedHistory] = useState<string | null>(null);
  const [filterPending, setFilterPending] = useState(false);
  const [generatingImages, setGeneratingImages] = useState(false);
  const [currentGeneratingIndex, setCurrentGeneratingIndex] = useState<number | null>(null);
  const [imageBatchTotal, setImageBatchTotal] = useState(0);
  const [imageBatchDone, setImageBatchDone] = useState(0);
  const [previewScene, setPreviewScene] = useState<ScenePrompt | null>(null);
  const [previewIndex, setPreviewIndex] = useState<number>(0);
  const [previewEditPrompt, setPreviewEditPrompt] = useState<string>("");
  const [regeneratingPreview, setRegeneratingPreview] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [progress, setProgress] = useState(0);
  const [editingPromptIndex, setEditingPromptIndex] = useState<number | null>(null);
  const [editingPromptText, setEditingPromptText] = useState("");
  const [downloadingAll, setDownloadingAll] = useState(false);
  const [selectedImages, setSelectedImages] = useState<Set<number>>(() => new Set());
  const [savedCapcutFolder, setSavedCapcutFolder] = useState<string | null>(null);
  const [showCapcutInstructions, setShowCapcutInstructions] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("clean");
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [projectName, setProjectName] = usePersistedState("prompts_project_name", "Meu Projeto");
  const [generationStartTime, setGenerationStartTime] = useState<number | null>(null);
  const cancelGenerationRef = useRef(false);
  
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  // Carregar nome da pasta CapCut salva
  useEffect(() => {
    const loadSavedFolder = async () => {
      try {
        const handle = await getCapcutDirHandle();
        if (handle) {
          setSavedCapcutFolder(handle.name);
        }
      } catch {
        setSavedCapcutFolder(null);
      }
    };
    loadSavedFolder();
  }, []);
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
    setProgress(0);
    
    const wordCount = script.split(/\s+/).filter(Boolean).length;
    const estimatedScenes = Math.ceil(wordCount / (parseInt(wordsPerScene) || 80));
    const totalBatches = Math.ceil(estimatedScenes / 10);
    
    setLoadingMessage(`Analisando ${wordCount} palavras...`);
    setProgress(10);

    try {
      // Simular progresso gradual dos prompts
      let simulatedPrompt = 1;
      const progressInterval = setInterval(() => {
        if (simulatedPrompt < estimatedScenes) {
          simulatedPrompt++;
          setLoadingMessage(`Gerando prompt ${simulatedPrompt} de ~${estimatedScenes}...`);
          // Progresso vai de 20% a 80% durante a simulação
          const progressPercent = 20 + Math.min(60, (simulatedPrompt / estimatedScenes) * 60);
          setProgress(Math.round(progressPercent));
        }
      }, 800); // Atualiza a cada 800ms
      
      setLoadingMessage(`Gerando prompt 1 de ~${estimatedScenes}...`);
      setProgress(20);
      
      const response = await supabase.functions.invoke("generate-scenes", {
        body: { 
          script,
          model,
          style,
          wordsPerScene: parseInt(wordsPerScene) || 80,
          maxScenes: 500
        },
      });

      clearInterval(progressInterval);
      setLoadingMessage(`Finalizando ${estimatedScenes} prompts...`);
      setProgress(90);

      // Check for errors in response
      if (response.error) {
        throw new Error(response.error.message || "Erro na função");
      }

      // Check for error in data
      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      const { scenes, totalScenes, creditsUsed } = response.data;
      
      if (!scenes || scenes.length === 0) {
        throw new Error("Nenhuma cena foi gerada. Tente novamente.");
      }
      
      // Enriquecer cenas com tempo e timecode
      let cumulativeSeconds = 0;
      const enrichedScenes: ScenePrompt[] = scenes.map((scene: ScenePrompt) => {
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
          total_scenes: totalScenes,
          total_words: totalWords,
          estimated_duration: estimatedDuration,
          model_used: model,
          style,
          scenes: JSON.parse(JSON.stringify(enrichedScenes)),
          credits_used: creditsUsed
        }]);
      }

      queryClient.invalidateQueries({ queryKey: ["scene-prompts-history"] });

      toast({
        title: "Prompts gerados!",
        description: `${totalScenes} cenas analisadas. Créditos: ${creditsUsed}`,
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

  // Gerar TODAS as imagens pendentes em PARALELO (lotes de 5)
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

    cancelGenerationRef.current = false; // Reset cancel flag
    setGeneratingImages(true);
    setImageBatchTotal(pendingIndexes.length);
    setImageBatchDone(0);
    setGenerationStartTime(Date.now()); // Iniciar contagem de tempo

    const BATCH_SIZE = 5; // Processar 5 imagens por vez
    let processed = 0;
    let errorOccurred = false;

    // Função para gerar uma única imagem com retry - atualiza UI imediatamente
    const generateSingleImage = async (sceneIndex: number): Promise<{ index: number; success: boolean }> => {
      const maxRetries = 2;
      let retries = 0;

      while (retries <= maxRetries) {
        try {
          const stylePrefix = THUMBNAIL_STYLES.find(s => s.id === style)?.promptPrefix || "";
          const fullPrompt = stylePrefix
            ? `${stylePrefix} ${generatedScenes[sceneIndex].imagePrompt}`
            : generatedScenes[sceneIndex].imagePrompt;

          const { data, error } = await supabase.functions.invoke("generate-imagefx", {
            body: {
              prompt: fullPrompt,
              aspectRatio: "LANDSCAPE",
              numberOfImages: 1,
            },
          });

          if (error) {
            const bodyText = (error as any)?.context?.body;
            let errMsg = error.message;
            if (bodyText) {
              try {
                const parsed = JSON.parse(bodyText);
                errMsg = parsed?.error || error.message;
              } catch {}
            }
            
            if (errMsg.includes("autenticação") || errMsg.includes("cookies")) {
              throw new Error("AUTH_ERROR");
            }
            
            retries++;
            continue;
          }

          if ((data as any)?.error) {
            const errMsg = (data as any).error;
            if (errMsg.includes("autenticação") || errMsg.includes("cookies")) {
              throw new Error("AUTH_ERROR");
            }
            retries++;
            continue;
          }

          const url = (data as any)?.images?.[0]?.url;
          if (url) {
            // Atualizar UI IMEDIATAMENTE quando a imagem é gerada
            setGeneratedScenes(prev => {
              const updated = [...prev];
              updated[sceneIndex] = { ...updated[sceneIndex], generatedImage: url };
              return updated;
            });
            processed++;
            setImageBatchDone(processed);
            setCurrentGeneratingIndex(sceneIndex); // Mostrar qual cena acabou
            return { index: sceneIndex, success: true };
          }
          retries++;
        } catch (error: any) {
          if (error.message === "AUTH_ERROR") throw error;
          retries++;
        }
      }
      return { index: sceneIndex, success: false };
    };

    // Processar em lotes de 5
    for (let batchStart = 0; batchStart < pendingIndexes.length && !errorOccurred && !cancelGenerationRef.current; batchStart += BATCH_SIZE) {
      const batchIndexes = pendingIndexes.slice(batchStart, batchStart + BATCH_SIZE);

      // Verificar cancelamento antes de iniciar o lote
      if (cancelGenerationRef.current) break;

      try {
        // Executar 5 requisições em paralelo - cada uma atualiza UI ao terminar
        const results = await Promise.allSettled(
          batchIndexes.map(idx => generateSingleImage(idx))
        );

        // Verificar cancelamento após o lote
        if (cancelGenerationRef.current) break;

        // Verificar erros de autenticação
        for (const result of results) {
          if (result.status === "rejected" && result.reason?.message === "AUTH_ERROR") {
            toast({
              title: "Erro de autenticação",
              description: "Atualize os cookies do ImageFX nas configurações.",
              variant: "destructive",
            });
            errorOccurred = true;
            break;
          }
        }
      } catch (error: any) {
        if (error.message === "AUTH_ERROR") {
          toast({
            title: "Erro de autenticação",
            description: "Atualize os cookies do ImageFX nas configurações.",
            variant: "destructive",
          });
          errorOccurred = true;
        }
      }
    }

    setCurrentGeneratingIndex(null);
    setGeneratingImages(false);
    setGenerationStartTime(null); // Reset tempo

    if (cancelGenerationRef.current) {
      toast({
        title: "Geração cancelada",
        description: `${processed} imagens foram geradas antes do cancelamento`,
      });
    } else {
      toast({
        title: processed === pendingIndexes.length ? "Todas as imagens geradas!" : "Geração concluída",
        description: `${processed}/${pendingIndexes.length} imagens criadas`,
      });
    }
  };

  // Cancelar geração
  const handleCancelGeneration = () => {
    cancelGenerationRef.current = true;
    toast({ title: "Cancelando...", description: "Aguarde o lote atual finalizar" });
  };

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

      // Salvar cada imagem diretamente na pasta selecionada
      let savedCount = 0;
      for (const scene of scenesWithImages) {
        if (scene.generatedImage) {
          try {
            const response = await fetch(scene.generatedImage);
            const blob = await response.blob();
            const fileName = `cena_${String(scene.number).padStart(3, "0")}.png`;
            
            const fileHandle = await dirHandle.getFileHandle(fileName, { create: true });
            const writable = await fileHandle.createWritable();
            await writable.write(blob);
            await writable.close();
            savedCount++;
          } catch (err) {
            console.warn(`Erro ao salvar cena ${scene.number}`, err);
          }
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

      // Atualizar estado da pasta salva
      setSavedCapcutFolder(dirHandle.name);

      toast({
        title: "✅ Arquivos salvos com sucesso!",
        description: `${savedCount} imagens + DURACOES.txt salvos em "${dirHandle.name}". Pasta será lembrada para próxima vez!`,
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

      // Criar pasta Resources e adicionar imagens dentro dela
      const resourcesFolder = zip.folder("Resources");
      for (const scene of scenesWithImages) {
        if (scene.generatedImage && resourcesFolder) {
          try {
            const response = await fetch(scene.generatedImage);
            const blob = await response.blob();
            resourcesFolder.file(`cena_${String(scene.number).padStart(3, "0")}.png`, blob);
          } catch (err) {
            console.warn(`Erro cena ${scene.number}`, err);
          }
        }
      }

      // Adicionar instruções e arquivos de suporte
      const totalDuration = scenesWithDurations.length > 0 
        ? scenesWithDurations[scenesWithDurations.length - 1].endTimecode 
        : "00:00";

      const durationsTxt = `DURAÇÕES DAS CENAS - ${totalDuration} total\n` +
        `Gerado em: ${new Date().toLocaleString('pt-BR')}\n\n` +
        scenesWithDurations.map(s => 
          `Cena ${String(s.number).padStart(2, "0")}: ${s.durationSeconds}s (${s.timecode} → ${s.endTimecode})`
        ).join("\n");

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
        "═══════════════════════════════════════════════════════════════",
        "          PROJETO CAPCUT - GUIA DE IMPORTAÇÃO",
        "═══════════════════════════════════════════════════════════════",
        "",
        `📋 TEMPLATE USADO: ${template.name}`,
        `   ${template.description}`,
        "",
        "📁 CONTEÚDO DO ZIP:",
        "  • Resources/ - Pasta com as imagens das cenas",
        "  • draft_content.json - Timeline com durações corretas",
        "  • draft_meta_info.json - Metadados do projeto",
        "  • DURACOES.txt - Tempo de cada cena (referência)",
        "  • NARRACOES.srt - Texto para narração",
        "",
        "═══════════════════════════════════════════════════════════════",
        "          PASSO A PASSO",
        "═══════════════════════════════════════════════════════════════",
        "",
        "1) Abra o CapCut e crie um NOVO PROJETO (projeto vazio)",
        "",
        "2) FECHE o CapCut completamente",
        "",
        "3) Localize a pasta do projeto:",
        "   Windows: C:\\Users\\[Você]\\AppData\\Local\\CapCut\\User Data\\Projects\\com.lveditor.draft\\[ID]",
        "   (A pasta tem números/letras aleatórios como nome)",
        "",
        "4) Extraia TODO o conteúdo deste ZIP para dentro dessa pasta",
        "   (sobrescreva draft_content.json e draft_meta_info.json)",
        "",
        "5) Abra o CapCut - você verá os clipes na timeline com ícones vermelhos",
        "",
        "═══════════════════════════════════════════════════════════════",
        "          RELINK DAS IMAGENS (IMPORTANTE!)",
        "═══════════════════════════════════════════════════════════════",
        "",
        "6) Clique com o BOTÃO DIREITO em qualquer clipe vermelho",
        "",
        "7) Selecione 'Localizar arquivo...' ou 'Relink media'",
        "",
        "8) Navegue até a pasta Resources/ dentro do projeto e selecione",
        "   a imagem correspondente (cena_001.png, cena_002.png, etc.)",
        "",
        "9) O CapCut irá vincular automaticamente as outras imagens!",
        "",
        "10) Pronto! As imagens estarão na timeline com as durações corretas.",
        "",
        "═══════════════════════════════════════════════════════════════",
      ].join("\n");

      // Gerar dados para o JSON do CapCut
      const scenesForCapcut = scenesWithDurations.map(s => ({
        number: s.number,
        fileName: `cena_${String(s.number).padStart(3, "0")}.png`,
        durationSeconds: s.durationSeconds,
        startSeconds: s.startSeconds,
        text: s.text
      }));

      // Gerar JSONs do projeto CapCut COM TEMPLATE
      const sanitizedProjectName = projectName.trim() || "Meu Projeto";
      const draftContentJson = generateCapcutDraftContentWithTemplate(scenesForCapcut, template, sanitizedProjectName);
      const draftMetaInfoJson = generateCapcutDraftMetaInfoWithTemplate(scenesForCapcut, sanitizedProjectName);
      
      // Arquivos de documentação
      zip.file("DURACOES.txt", durationsTxt);
      zip.file("NARRACOES.srt", srtContent);
      zip.file("README_CAPCUT.txt", readme);
      
      // Arquivos do projeto CapCut (estrutura exata igual projeto real)
      zip.file("draft_content.json", draftContentJson);
      zip.file("draft_meta_info.json", draftMetaInfoJson);
      
      // Arquivos auxiliares obrigatórios (conteúdo real do CapCut)
      const draftAgencyConfig = JSON.stringify({
        is_auto_agency_enabled: false,
        is_auto_agency_popup: false,
        is_single_agency_mode: false,
        marterials: null,
        use_converter: false,
        video_resolution: 720
      });
      
      const performanceOptInfo = JSON.stringify({
        manual_cancle_precombine_segs: null,
        need_auto_precombine_segs: null
      });
      
      const attachmentEditing = JSON.stringify({
        editing_draft: {
          ai_remove_filter_words: { enter_source: "", right_id: "" },
          ai_shorts_info: { report_params: "", type: 0 },
          crop_info_extra: { crop_mirror_type: 0, crop_rotate: 0.0, crop_rotate_total: 0.0 },
          digital_human_template_to_video_info: { has_upload_material: false, template_type: 0 },
          draft_used_recommend_function: "",
          edit_type: 0,
          is_open_expand_player: false,
          is_use_adjust: false,
          version: "1.0.0"
        }
      });
      
      const attachmentPcCommon = JSON.stringify({
        ai_packaging_infos: [],
        ai_packaging_report_info: { caption_id_list: [], commercial_material: "", material_source: "", method: "", page_from: "", style: "", task_id: "", text_style: "", tos_id: "", video_category: "" },
        broll: { ai_packaging_infos: [], ai_packaging_report_info: { caption_id_list: [], commercial_material: "", material_source: "", method: "", page_from: "", style: "", task_id: "", text_style: "", tos_id: "", video_category: "" } },
        commercial_music_category_ids: [],
        pc_feature_flag: 0,
        recognize_tasks: [],
        reference_lines_config: { horizontal_lines: [], is_lock: false, is_visible: false, vertical_lines: [] },
        safe_area_type: 0,
        template_item_infos: [],
        unlock_template_ids: []
      });
      
      const nowSeconds = Math.floor(Date.now() / 1000);
      const draftSettings = `[General]\ndraft_create_time=${nowSeconds}\ndraft_last_edit_time=${nowSeconds}\nreal_edit_seconds=0\nreal_edit_keys=0\n`;
      
      zip.file("draft_agency_config.json", draftAgencyConfig);
      zip.file("draft_biz_config.json", "");
      zip.file("draft_settings", draftSettings);
      zip.file("attachment_editing.json", attachmentEditing);
      zip.file("attachment_pc_common.json", attachmentPcCommon);
      zip.file("performance_opt_info.json", performanceOptInfo);
      zip.file("template.tmp", "");
      zip.file("template-2.tmp", "");
      
      // Imagem de capa placeholder (1x1 pixel transparente em base64)
      const draftCoverBase64 = "/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoHBwYIDAoMCwsKCwsNDhIQDQ4RDgsLEBYQERMUFRUVDA8XGBYUGBIUFRT/2wBDAQMEBAUEBQkFBQkUDQsNFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBT/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAn/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBEQCEAwEPwAB//9k=";
      zip.file("draft_cover.jpg", draftCoverBase64, { base64: true });
      
      // Pastas vazias (estrutura exata do CapCut)
      zip.folder("adjust_mask");
      zip.folder("matting");
      zip.folder("qr_upload");
      zip.folder("smart_crop");
      zip.folder("subdraft");
      
      // Subpastas dentro de Resources (imagens já foram adicionadas acima)
      const resFolder = zip.folder("Resources");
      if (resFolder) {
        resFolder.folder("audioAlg");
        resFolder.folder("digitalHuman");
        resFolder.folder("videoAlg");
      }
      
      // Arquivos dentro de common_attachment
      const commonAttachment = zip.folder("common_attachment");
      if (commonAttachment) {
        commonAttachment.file("aigc_aigc_generate.json", "{}");
        commonAttachment.file("attachment_gen_ai_info.json", "{}");
        commonAttachment.file("attachment_script_video.json", "{}");
      }

      // Baixar ZIP
      const zipBlob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement("a");
      link.href = url;
      const safeFileName = (projectName.trim() || "Projeto").replace(/[^a-zA-Z0-9_-]/g, "_");
      link.download = `${safeFileName}_${new Date().toISOString().split("T")[0]}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({ 
        title: "✅ Projeto CapCut baixado!", 
        description: "Extraia na pasta do projeto CapCut para importar automaticamente. Leia README_CAPCUT.txt" 
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

  // Detectar sistema operacional
  const isWindows = typeof navigator !== 'undefined' && navigator.platform?.toLowerCase().includes('win');
  const isMac = typeof navigator !== 'undefined' && (navigator.platform?.toLowerCase().includes('mac') || navigator.userAgent?.toLowerCase().includes('mac'));

  // Texto das instruções para copiar
  const capcutInstructionsText = `COMO EXPORTAR PARA O CAPCUT

=== MÉTODO 1: SELEÇÃO DE PASTA (RECOMENDADO) ===
Ao clicar em "Exportar Agora", você escolhe uma pasta e os arquivos são salvos diretamente.

Caminho típico no Windows:
  C:\\Users\\[SeuUsuário]\\Documents\\CapCut\\User Data\\Projects\\[NomeDoProjeto]

Caminho típico no macOS:
  ~/Documents/CapCut/User Data/Projects/[NomeDoProjeto]

IMPORTANTE: Escolha uma SUBPASTA do projeto, não a pasta "Documentos" raiz.

=== MÉTODO 2: DOWNLOAD ZIP (ALTERNATIVA) ===
Se o navegador bloquear a pasta, um ZIP será baixado automaticamente.
1. Extraia o ZIP em qualquer pasta
2. No CapCut, importe as imagens manualmente
3. Use DURACOES.txt para ajustar a duração de cada cena

=== DICAS ===
• As imagens são nomeadas em ordem: cena_001.png, cena_002.png...
• O arquivo DURACOES.txt contém os tempos de cada cena
• Após escolher uma pasta, ela será lembrada para próximas exportações`;


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

    setCurrentGeneratingIndex(index);
    
    try {
      const stylePrefix = THUMBNAIL_STYLES.find(s => s.id === style)?.promptPrefix || "";
      const fullPrompt = stylePrefix 
        ? `${stylePrefix} ${scene.imagePrompt}`
        : scene.imagePrompt;

      const { data, error } = await supabase.functions.invoke("generate-imagefx", {
        body: {
          prompt: fullPrompt,
          aspectRatio: "LANDSCAPE",
          numberOfImages: 1
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
        setGeneratedScenes(updatedScenes);
        
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
      setCurrentGeneratingIndex(null);
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

  // Carregar histórico
  const loadFromHistory = (history: SceneHistory) => {
    setScript(history.script);
    setStyle(history.style || "cinematic");
    setGeneratedScenes(history.scenes);
    toast({
      title: "Carregado!",
      description: "Roteiro carregado do histórico",
    });
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

  // Estatísticas do roteiro atual
  const scriptStats = {
    words: script.split(/\s+/).filter(Boolean).length,
    estimatedScenes: Math.ceil(script.split(/\s+/).filter(Boolean).length / (parseInt(wordsPerScene) || 80)),
    estimatedDuration: calculateEstimatedTime(script.split(/\s+/).filter(Boolean).length)
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

          <Tabs defaultValue="generator" className="space-y-6">
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
              {/* Layout adaptável: quando há cenas geradas, grid de imagens ocupa toda largura */}
              <div className={generatedScenes.length > 0 ? "space-y-6" : "grid grid-cols-1 lg:grid-cols-3 gap-6"}>
                {/* Área de Input */}
                <div className={generatedScenes.length > 0 ? "" : "lg:col-span-2 space-y-6"}>
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
                            ~<strong className="text-foreground">{scriptStats.estimatedDuration}</strong> duração
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
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

                      <Button 
                        onClick={handleGenerate}
                        disabled={generating || !script.trim()}
                        className="bg-primary text-primary-foreground hover:bg-primary/90"
                      >
                        {generating ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Sparkles className="w-4 h-4 mr-2" />
                        )}
                        Analisar
                      </Button>
                    </div>
                  </Card>

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
                          <Button variant="outline" size="sm" onClick={downloadPrompts}>
                            <Download className="w-4 h-4 mr-2" />
                            TXT
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
                          <div className="flex items-center gap-1">
                            <Button 
                              variant="outline"
                              size="sm" 
                              onClick={handleExportForCapcut}
                              disabled={!generatedScenes.some(s => s.generatedImage)}
                              className="border-primary/50 text-primary hover:bg-primary/10"
                              title={savedCapcutFolder ? `Salvar em: ${savedCapcutFolder}` : "Escolher pasta do CapCut"}
                            >
                              <Video className="w-4 h-4 mr-2" />
                              CapCut
                              {savedCapcutFolder && (
                                <span className="ml-1 text-xs opacity-70 max-w-[80px] truncate">
                                  ({savedCapcutFolder})
                                </span>
                              )}
                            </Button>
                            <Button 
                              variant="ghost"
                              size="sm" 
                              onClick={async () => {
                                await clearCapcutDirHandle();
                                setSavedCapcutFolder(null);
                                toast({ title: "Pasta resetada", description: "Na próxima exportação você poderá escolher uma nova pasta." });
                              }}
                              disabled={!savedCapcutFolder}
                              className="text-muted-foreground hover:text-destructive px-2"
                              title="Esquecer pasta CapCut salva"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </Button>
                          </div>
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
                              {filterPending ? "Ver Todas" : "Só Pendentes"}
                            </Button>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                          {generatedScenes
                            .map((scene, index) => ({ scene, index }))
                            .filter(({ scene }) => !filterPending || !scene.generatedImage)
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
                                  <Button
                                    variant="secondary"
                                    size="icon"
                                    className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRegenerateImage(index);
                                    }}
                                    disabled={currentGeneratingIndex === index}
                                  >
                                    {currentGeneratingIndex === index ? (
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                      <RefreshCw className="w-3 h-3" />
                                    )}
                                  </Button>
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
                                  className="w-full h-full flex flex-col items-center justify-center gap-1 hover:bg-secondary/80 transition-colors"
                                  onClick={() => handleRegenerateImage(index)}
                                  disabled={generatingImages}
                                >
                                  <ImagePlus className="w-5 h-5 text-muted-foreground/50" />
                                  <span className="text-[10px] text-muted-foreground">Gerar</span>
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
                                    disabled={currentGeneratingIndex === index}
                                    title="Regenerar imagem"
                                  >
                                    {currentGeneratingIndex === index ? (
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

                {/* Sidebar - Prompts Salvos (oculto quando há cenas geradas para dar mais espaço) */}
                {generatedScenes.length === 0 && (
                  <div>
                    <Card className="p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <Save className="w-5 h-5 text-primary" />
                        <h3 className="font-semibold text-foreground">Prompts Salvos</h3>
                      </div>
                      <ScrollArea className="h-[400px]">
                        <div className="space-y-3 pr-2">
                          {savedPrompts && savedPrompts.length > 0 ? (
                            savedPrompts.map((item) => (
                              <div 
                                key={item.id} 
                                className="p-3 bg-secondary/50 rounded-lg cursor-pointer hover:bg-secondary transition-colors"
                              >
                                <h4 className="font-medium text-foreground text-sm mb-1">{item.title}</h4>
                                <p className="text-xs text-muted-foreground line-clamp-2">{item.prompt}</p>
                              </div>
                            ))
                          ) : (
                            <p className="text-center text-muted-foreground py-8 text-sm">
                              Nenhum prompt salvo
                            </p>
                          )}
                        </div>
                      </ScrollArea>
                    </Card>
                  </div>
                )}
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
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => setExpandedHistory(expandedHistory === history.id ? null : history.id)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => loadFromHistory(history)}
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => deleteFromHistory(history.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
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
        <DialogContent className="max-w-md bg-card border-primary/50 rounded-xl shadow-xl" hideCloseButton>
          <div className="flex flex-col items-center justify-center py-8 space-y-6">
            {/* Logo com efeito de pulso */}
            <div className="relative w-20 h-20">
              <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
              <div className="absolute inset-0 bg-primary/10 rounded-full animate-pulse" />
              <div className="relative w-20 h-20 rounded-full border-2 border-primary/50 overflow-hidden">
                <img 
                  src={logoGif} 
                  alt="Loading" 
                  className="w-full h-full object-cover scale-110"
                />
              </div>
            </div>
            
            {/* Mensagem de progresso */}
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold text-foreground">
                Analisando Roteiro
              </h3>
              <p className="text-sm text-muted-foreground">
                {loadingMessage}
              </p>
            </div>

            {/* Barra de progresso */}
            <div className="w-full space-y-2">
              <Progress value={progress} className="h-2 bg-secondary" />
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">
                  Processando com IA
                </span>
                <span className="text-xs font-medium text-primary">
                  {progress}%
                </span>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Barra de progresso flutuante quando gerando (sem modal) */}
      {generatingImages && (() => {
        // Calcular estimativa de tempo restante
        const elapsedMs = generationStartTime ? Date.now() - generationStartTime : 0;
        const avgTimePerImage = imageBatchDone > 0 ? elapsedMs / imageBatchDone : 0;
        const remainingImages = imageBatchTotal - imageBatchDone;
        const estimatedRemainingMs = avgTimePerImage * remainingImages;
        
        // Formatar tempo
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
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-card border-2 border-primary/60 rounded-2xl shadow-2xl shadow-primary/20 px-6 py-5 min-w-[420px] max-w-lg">
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
        );
      })()}

      {/* Modal de Instruções CapCut */}
      <Dialog open={showCapcutInstructions} onOpenChange={setShowCapcutInstructions}>
        <DialogContent className="max-w-xl bg-card border-primary/50 rounded-xl shadow-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <Video className="w-5 h-5 text-primary" />
              Exportar para CapCut
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Escolha um template com transições pré-configuradas
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-4 pr-2">
              {/* Nome do Projeto */}
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  Nome do Projeto
                </Label>
                <Input
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="Meu Projeto"
                  className="bg-secondary/50"
                />
                <p className="text-xs text-muted-foreground">
                  Este nome será usado no arquivo ZIP e dentro do CapCut
                </p>
              </div>

              {/* Seletor de Templates por Categoria */}
              <div className="space-y-3">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Layout className="w-4 h-4 text-primary" />
                  Template do Projeto
                </Label>
                
                <RadioGroup 
                  value={selectedTemplate} 
                  onValueChange={setSelectedTemplate}
                  className="space-y-4"
                >
                  {TEMPLATE_CATEGORIES.map((category) => (
                    <div key={category.id} className="space-y-2">
                      <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                        <span>{category.icon}</span>
                        <span>{category.name}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {CAPCUT_TEMPLATES.filter(t => t.category === category.id).map((template) => (
                          <div key={template.id}>
                            <RadioGroupItem
                              value={template.id}
                              id={`template-${template.id}`}
                              className="peer sr-only"
                            />
                            <Label
                              htmlFor={`template-${template.id}`}
                              className={cn(
                                "flex flex-col items-start gap-1 p-2.5 rounded-lg border-2 cursor-pointer transition-all",
                                "hover:border-primary/50 hover:bg-primary/5",
                                selectedTemplate === template.id
                                  ? "border-primary bg-primary/10"
                                  : "border-border bg-secondary/30"
                              )}
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-lg">{template.preview}</span>
                                <span className="font-semibold text-foreground text-xs">{template.name}</span>
                              </div>
                              <p className="text-[10px] text-muted-foreground line-clamp-1">{template.description}</p>
                              <div className="flex flex-wrap gap-1 mt-0.5">
                                {template.transitionType !== 'none' && (
                                  <Badge variant="outline" className="text-[9px] px-1 py-0 h-4">
                                    {template.transitionType}
                                  </Badge>
                                )}
                                {template.hasColorGrading && (
                                  <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 border-amber-500/50 text-amber-500">
                                    🎨
                                  </Badge>
                                )}
                                {template.hasSlowMotion && (
                                  <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 border-purple-500/50 text-purple-500">
                                    🐌
                                  </Badge>
                                )}
                                {template.hasBlur && (
                                  <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 border-blue-500/50 text-blue-500">
                                    💫
                                  </Badge>
                                )}
                              </div>
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </RadioGroup>

                {/* Preview visual do template selecionado */}
                {selectedTemplate && (
                  <div className="mt-4 p-3 bg-secondary/30 rounded-lg border border-border">
                    <div className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-2">
                      <Eye className="w-3 h-3" />
                      Preview do Template
                    </div>
                    <TemplatePreview 
                      template={CAPCUT_TEMPLATES.find(t => t.id === selectedTemplate) || CAPCUT_TEMPLATES[0]}
                      isActive={true}
                    />
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>

          <div className="space-y-4 pt-2">
            {/* SRT */}
            <div className="p-3 bg-secondary/50 rounded-lg border border-border">
              <h4 className="font-semibold text-foreground text-sm mb-1 flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                SRT
              </h4>
              <p className="text-xs text-muted-foreground">
                O arquivo <strong>NARRACOES.srt</strong> também será gerado junto com o projeto.
              </p>
            </div>

            {/* Pasta salva */}
            {savedCapcutFolder && (
              <div className="p-3 bg-primary/10 rounded-lg border border-primary/30 flex items-center gap-2">
                <Check className="w-4 h-4 text-primary" />
                <span className="text-sm text-foreground">
                  Pasta salva: <strong>{savedCapcutFolder}</strong>
                </span>
              </div>
            )}

            {/* Botões */}
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(capcutInstructionsText);
                  toast({ title: "Instruções copiadas!", description: "Cole em um bloco de notas para referência." });
                }}
                className="flex-1"
              >
                <Copy className="w-4 h-4 mr-2" />
                Copiar Instruções
              </Button>
              <Button
                onClick={handleConfirmCapcutExport}
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Video className="w-4 h-4 mr-2" />
                Exportar Agora
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default PromptsImages;

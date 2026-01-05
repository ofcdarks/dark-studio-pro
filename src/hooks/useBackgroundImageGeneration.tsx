import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { THUMBNAIL_STYLES } from "@/lib/thumbnailStyles";
import { useToast } from "@/hooks/use-toast";

interface ScenePrompt {
  number: number;
  text: string;
  imagePrompt: string;
  wordCount: number;
  estimatedTime?: string;
  timecode?: string;
  endTimecode?: string;
  generatedImage?: string;
  generatingImage?: boolean;
}

interface BackgroundGenerationState {
  isGenerating: boolean;
  totalImages: number;
  completedImages: number;
  currentSceneIndex: number | null;
  currentPrompt: string | null;
  startTime: number | null;
  scenes: ScenePrompt[];
  style: string;
}

interface BackgroundImageGenerationContextType {
  state: BackgroundGenerationState;
  startGeneration: (scenes: ScenePrompt[], style: string, pendingIndexes: number[]) => void;
  cancelGeneration: () => void;
  getUpdatedScenes: () => ScenePrompt[];
  clearState: () => void;
  syncScenes: (scenes: ScenePrompt[]) => void;
}

const initialState: BackgroundGenerationState = {
  isGenerating: false,
  totalImages: 0,
  completedImages: 0,
  currentSceneIndex: null,
  currentPrompt: null,
  startTime: null,
  scenes: [],
  style: 'cinematic',
};

const BackgroundImageGenerationContext = createContext<BackgroundImageGenerationContextType | null>(null);

export const BackgroundImageGenerationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<BackgroundGenerationState>(initialState);
  const cancelRef = useRef(false);
  const scenesRef = useRef<ScenePrompt[]>([]);
  const { toast } = useToast();

  // Manter ref sincronizada
  useEffect(() => {
    scenesRef.current = state.scenes;
  }, [state.scenes]);

  const generateSingleImage = useCallback(async (
    sceneIndex: number, 
    scenes: ScenePrompt[], 
    style: string
  ): Promise<{ index: number; success: boolean; imageUrl?: string }> => {
    const maxRetries = 3;
    let retries = 0;
    let lastError = "";

    while (retries <= maxRetries) {
      if (cancelRef.current) {
        return { index: sceneIndex, success: false };
      }

      try {
        const stylePrefix = THUMBNAIL_STYLES.find(s => s.id === style)?.promptPrefix || "";
        const fullPrompt = stylePrefix
          ? `${stylePrefix} ${scenes[sceneIndex].imagePrompt}`
          : scenes[sceneIndex].imagePrompt;

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
          
          lastError = errMsg;
          
          if (errMsg.includes("autenticação") || errMsg.includes("cookies")) {
            throw new Error("AUTH_ERROR");
          }
          
          if (errMsg.includes("Limite de requisições") || errMsg.includes("429")) {
            const waitTime = 5000 + retries * 3000;
            await new Promise(resolve => setTimeout(resolve, waitTime));
            retries++;
            continue;
          }
          
          const waitTime = 2000 + retries * 1000;
          await new Promise(resolve => setTimeout(resolve, waitTime));
          retries++;
          continue;
        }

        if ((data as any)?.error) {
          const errMsg = (data as any).error;
          lastError = errMsg;
          
          if (errMsg.includes("autenticação") || errMsg.includes("cookies")) {
            throw new Error("AUTH_ERROR");
          }
          
          if (errMsg.includes("Limite de requisições")) {
            const waitTime = 5000 + retries * 3000;
            await new Promise(resolve => setTimeout(resolve, waitTime));
            retries++;
            continue;
          }
          
          retries++;
          await new Promise(resolve => setTimeout(resolve, 2000));
          continue;
        }

        const url = (data as any)?.images?.[0]?.url;
        if (url) {
          return { index: sceneIndex, success: true, imageUrl: url };
        }
        
        retries++;
        await new Promise(resolve => setTimeout(resolve, 1500));
      } catch (error: any) {
        if (error.message === "AUTH_ERROR") throw error;
        lastError = error.message;
        retries++;
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    console.warn(`[Background] Scene ${sceneIndex} failed after ${maxRetries} retries: ${lastError}`);
    return { index: sceneIndex, success: false };
  }, []);

  const startGeneration = useCallback(async (
    scenes: ScenePrompt[], 
    style: string, 
    pendingIndexes: number[]
  ) => {
    if (state.isGenerating) {
      toast({ 
        title: "Geração já em andamento", 
        description: "Aguarde a conclusão ou cancele a geração atual" 
      });
      return;
    }

    cancelRef.current = false;
    scenesRef.current = [...scenes];
    
    setState({
      isGenerating: true,
      totalImages: pendingIndexes.length,
      completedImages: 0,
      currentSceneIndex: pendingIndexes[0] ?? null,
      currentPrompt: scenes[pendingIndexes[0]]?.imagePrompt ?? null,
      startTime: Date.now(),
      scenes: [...scenes],
      style,
    });

    const BATCH_SIZE = 5;
    let processed = 0;
    let errorOccurred = false;

    for (let batchStart = 0; batchStart < pendingIndexes.length && !errorOccurred && !cancelRef.current; batchStart += BATCH_SIZE) {
      const batchIndexes = pendingIndexes.slice(batchStart, batchStart + BATCH_SIZE);

      if (cancelRef.current) break;

      try {
        const results = await Promise.allSettled(
          batchIndexes.map(idx => generateSingleImage(idx, scenesRef.current, style))
        );

        if (cancelRef.current) break;

        for (const result of results) {
          if (result.status === "fulfilled" && result.value.success && result.value.imageUrl) {
            const { index, imageUrl } = result.value;
            processed++;
            
            // Atualizar estado global
            setState(prev => {
              const updatedScenes = [...prev.scenes];
              updatedScenes[index] = { ...updatedScenes[index], generatedImage: imageUrl };
              scenesRef.current = updatedScenes;
              
              return {
                ...prev,
                scenes: updatedScenes,
                completedImages: processed,
                currentSceneIndex: batchIndexes[batchIndexes.length - 1] ?? null,
                currentPrompt: prev.scenes[batchIndexes[batchIndexes.length - 1]]?.imagePrompt ?? null,
              };
            });
          } else if (result.status === "rejected" && result.reason?.message === "AUTH_ERROR") {
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

    setState(prev => ({
      ...prev,
      isGenerating: false,
      currentSceneIndex: null,
      currentPrompt: null,
      startTime: null,
    }));

    if (cancelRef.current) {
      toast({
        title: "Geração cancelada",
        description: `${processed} imagens foram geradas antes do cancelamento`,
      });
    } else if (!errorOccurred) {
      toast({
        title: processed === pendingIndexes.length ? "Todas as imagens geradas!" : "Geração concluída",
        description: `${processed}/${pendingIndexes.length} imagens criadas`,
      });
    }
  }, [state.isGenerating, generateSingleImage, toast]);

  const cancelGeneration = useCallback(() => {
    cancelRef.current = true;
    toast({ title: "Cancelando...", description: "Aguarde o lote atual finalizar" });
  }, [toast]);

  const getUpdatedScenes = useCallback(() => {
    return scenesRef.current;
  }, []);

  const clearState = useCallback(() => {
    cancelRef.current = true;
    setState(initialState);
    scenesRef.current = [];
  }, []);

  const syncScenes = useCallback((scenes: ScenePrompt[]) => {
    if (!state.isGenerating) {
      scenesRef.current = scenes;
      setState(prev => ({ ...prev, scenes }));
    }
  }, [state.isGenerating]);

  return (
    <BackgroundImageGenerationContext.Provider value={{
      state,
      startGeneration,
      cancelGeneration,
      getUpdatedScenes,
      clearState,
      syncScenes,
    }}>
      {children}
    </BackgroundImageGenerationContext.Provider>
  );
};

export const useBackgroundImageGeneration = () => {
  const context = useContext(BackgroundImageGenerationContext);
  if (!context) {
    throw new Error('useBackgroundImageGeneration must be used within BackgroundImageGenerationProvider');
  }
  return context;
};

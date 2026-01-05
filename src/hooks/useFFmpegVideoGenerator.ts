import { useState, useRef, useCallback } from "react";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile } from "@ffmpeg/util";
import { toast } from "@/hooks/use-toast";

export interface VideoScene {
  number: number;
  text: string;
  generatedImage?: string;
  durationSeconds: number;
}

export type TransitionType = "fade" | "wipeleft" | "wiperight" | "wipeup" | "wipedown" | "slideleft" | "slideright" | "zoomin" | "circleopen" | "dissolve";

export interface VideoGenerationOptions {
  scenes: VideoScene[];
  projectName: string;
  fps?: number;
  resolution?: "720p" | "1080p";
  kenBurnsEnabled?: boolean;
  transitionEnabled?: boolean;
  transitionType?: TransitionType;
  transitionDuration?: number;
  colorFilterEnabled?: boolean;
  colorFilter?: "warm" | "cool" | "cinematic" | "vintage" | "none";
}

export interface VideoGenerationProgress {
  stage: "loading" | "processing" | "encoding" | "done" | "error" | "cancelled";
  progress: number;
  currentScene?: number;
  totalScenes?: number;
  message: string;
}

export function useFFmpegVideoGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState<VideoGenerationProgress>({
    stage: "loading",
    progress: 0,
    message: "Aguardando...",
  });
  const ffmpegRef = useRef<FFmpeg | null>(null);
  const loadedRef = useRef(false);
  const cancelledRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const cancelGeneration = useCallback(() => {
    cancelledRef.current = true;
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    if (ffmpegRef.current) {
      try {
        ffmpegRef.current.terminate();
        ffmpegRef.current = null;
        loadedRef.current = false;
      } catch (e) {
        console.warn("Error terminating FFmpeg:", e);
      }
    }
    setProgress({
      stage: "cancelled",
      progress: 0,
      message: "Geração cancelada",
    });
    setIsGenerating(false);
    toast({
      title: "Cancelado",
      description: "Geração de vídeo foi cancelada.",
    });
  }, []);

  const loadFFmpeg = useCallback(async () => {
    if (loadedRef.current && ffmpegRef.current) return ffmpegRef.current;

    cancelledRef.current = false;
    abortControllerRef.current = new AbortController();

    setProgress({
      stage: "loading",
      progress: 5,
      message: "Iniciando FFmpeg...",
    });

    const ffmpeg = new FFmpeg();
    ffmpegRef.current = ffmpeg;

    ffmpeg.on("progress", ({ progress: p }) => {
      if (cancelledRef.current) return;
      setProgress((prev) => ({
        ...prev,
        progress: Math.min(90, 30 + p * 60),
        message: `Codificando vídeo... ${Math.round(p * 100)}%`,
      }));
    });

    ffmpeg.on("log", ({ message }) => {
      console.log("[FFmpeg]", message);
    });

    // CDNs to try - using multi-threaded version for better performance
    const cdnConfigs = [
      {
        base: "https://unpkg.com/@ffmpeg/core-mt@0.12.6/dist/esm",
        isMultiThread: true,
      },
      {
        base: "https://cdn.jsdelivr.net/npm/@ffmpeg/core-mt@0.12.6/dist/esm",
        isMultiThread: true,
      },
      {
        base: "https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm",
        isMultiThread: false,
      },
      {
        base: "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/esm",
        isMultiThread: false,
      },
    ];

    const fetchWithProgress = async (url: string, label: string): Promise<Blob> => {
      const response = await fetch(url, { signal: abortControllerRef.current?.signal });
      if (!response.ok) throw new Error(`Failed to fetch ${url}`);
      
      const reader = response.body?.getReader();
      const contentLength = Number(response.headers.get("Content-Length")) || 0;
      
      if (!reader) {
        return await response.blob();
      }

      const chunks: Uint8Array[] = [];
      let receivedLength = 0;

      while (true) {
        if (cancelledRef.current) throw new Error("Cancelled");
        
        const { done, value } = await reader.read();
        if (done) break;
        
        chunks.push(value);
        receivedLength += value.length;
        
        if (contentLength > 0) {
          const pct = Math.round((receivedLength / contentLength) * 100);
          setProgress((prev) => ({
            ...prev,
            progress: Math.min(20, 10 + pct * 0.1),
            message: `${label} ${pct}%`,
          }));
        }
      }

      const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
      const result = new Uint8Array(totalLength);
      let offset = 0;
      for (const chunk of chunks) {
        result.set(chunk, offset);
        offset += chunk.length;
      }
      return new Blob([result]);
    };

    for (const config of cdnConfigs) {
      if (cancelledRef.current) throw new Error("Cancelled");
      
      try {
        setProgress({
          stage: "loading",
          progress: 8,
          message: config.isMultiThread ? "Carregando FFmpeg Multi-Thread..." : "Carregando FFmpeg...",
        });

        const coreBlob = await fetchWithProgress(`${config.base}/ffmpeg-core.js`, "Core JS:");
        const coreURL = URL.createObjectURL(new Blob([await coreBlob.text()], { type: "text/javascript" }));

        setProgress({
          stage: "loading",
          progress: 12,
          message: "Baixando WASM (~30MB)...",
        });

        const wasmBlob = await fetchWithProgress(`${config.base}/ffmpeg-core.wasm`, "WASM:");
        const wasmURL = URL.createObjectURL(wasmBlob);

        let workerURL: string | undefined;
        if (config.isMultiThread) {
          try {
            setProgress({
              stage: "loading",
              progress: 18,
              message: "Baixando Worker...",
            });
            const workerBlob = await fetchWithProgress(`${config.base}/ffmpeg-core.worker.js`, "Worker:");
            workerURL = URL.createObjectURL(new Blob([await workerBlob.text()], { type: "text/javascript" }));
          } catch {
            // Worker optional, continue without multi-thread
            console.warn("Worker not available, using single-thread");
          }
        }

        setProgress({
          stage: "loading",
          progress: 22,
          message: "Inicializando FFmpeg...",
        });

        if (cancelledRef.current) throw new Error("Cancelled");

        await ffmpeg.load({
          coreURL,
          wasmURL,
          workerURL,
        });

        loadedRef.current = true;
        setProgress({
          stage: "loading",
          progress: 25,
          message: config.isMultiThread && workerURL ? "FFmpeg Multi-Thread carregado! 🚀" : "FFmpeg carregado!",
        });

        console.log(`[FFmpeg] Loaded from ${config.base}, multi-thread: ${config.isMultiThread && !!workerURL}`);
        return ffmpeg;
      } catch (e: any) {
        if (e.message === "Cancelled" || cancelledRef.current) throw e;
        console.warn(`CDN ${config.base} failed:`, e);
        continue;
      }
    }

    throw new Error("Não foi possível baixar FFmpeg. Verifique sua conexão.");
  }, []);

  const getColorFilterString = (filter: string): string => {
    switch (filter) {
      case "warm":
        return "colorbalance=rs=0.1:gs=0.05:bs=-0.1";
      case "cool":
        return "colorbalance=rs=-0.1:gs=0.05:bs=0.15";
      case "cinematic":
        return "eq=contrast=1.1:brightness=0.02:saturation=0.9,colorbalance=rs=0.05:gs=0:bs=0.08";
      case "vintage":
        return "eq=contrast=1.05:saturation=0.7,colorbalance=rs=0.1:gs=0.05:bs=-0.05";
      default:
        return "";
    }
  };

  const generateVideo = useCallback(
    async (options: VideoGenerationOptions): Promise<Blob | null> => {
      const {
        scenes,
        projectName,
        fps = 30,
        resolution = "1080p",
        kenBurnsEnabled = true,
        transitionEnabled = true,
        transitionType = "fade",
        transitionDuration = 0.5,
        colorFilterEnabled = true,
        colorFilter = "cinematic",
      } = options;

      const validScenes = scenes.filter((s) => s.generatedImage);
      if (validScenes.length === 0) {
        toast({
          title: "Sem imagens",
          description: "Nenhuma cena possui imagem gerada.",
          variant: "destructive",
        });
        return null;
      }

      cancelledRef.current = false;
      setIsGenerating(true);

      try {
        const ffmpeg = await loadFFmpeg();
        if (!ffmpeg || cancelledRef.current) return null;

        const width = resolution === "1080p" ? 1920 : 1280;
        const height = resolution === "1080p" ? 1080 : 720;

        setProgress({
          stage: "processing",
          progress: 30,
          currentScene: 0,
          totalScenes: validScenes.length,
          message: "Processando imagens...",
        });

        for (let i = 0; i < validScenes.length; i++) {
          if (cancelledRef.current) return null;
          
          const scene = validScenes[i];
          const imageData = scene.generatedImage!;

          setProgress({
            stage: "processing",
            progress: 30 + (i / validScenes.length) * 20,
            currentScene: i + 1,
            totalScenes: validScenes.length,
            message: `Carregando imagem ${i + 1}/${validScenes.length}...`,
          });

          let fileData: Uint8Array;
          if (imageData.startsWith("data:")) {
            const base64 = imageData.split(",")[1];
            const binaryString = atob(base64);
            const bytes = new Uint8Array(binaryString.length);
            for (let j = 0; j < binaryString.length; j++) {
              bytes[j] = binaryString.charCodeAt(j);
            }
            fileData = bytes;
          } else {
            fileData = await fetchFile(imageData);
          }

          await ffmpeg.writeFile(`img_${String(i).padStart(3, "0")}.jpg`, fileData);
        }

        if (cancelledRef.current) return null;

        setProgress({
          stage: "encoding",
          progress: 50,
          message: "Gerando vídeo com efeitos...",
        });

        const filterParts: string[] = [];
        const concatInputs: string[] = [];

        for (let i = 0; i < validScenes.length; i++) {
          const scene = validScenes[i];
          const duration = scene.durationSeconds;
          const totalFrames = Math.round(duration * fps);

          const zoomStart = 1.0;
          const zoomEnd = kenBurnsEnabled ? 1.15 : 1.0;
          const panX = kenBurnsEnabled ? (i % 2 === 0 ? 0.02 : -0.02) : 0;
          const panY = kenBurnsEnabled ? (i % 3 === 0 ? 0.01 : -0.01) : 0;

          let imageFilter = `[${i}:v]loop=loop=${totalFrames}:size=1:start=0,setpts=N/${fps}/TB,`;
          imageFilter += `scale=${width * 1.2}:${height * 1.2},`;
          
          if (kenBurnsEnabled) {
            const zoomExpr = `${zoomStart}+(${zoomEnd - zoomStart})*on/${totalFrames}`;
            const xExpr = `(iw-ow)/2+iw*${panX}*on/${totalFrames}`;
            const yExpr = `(ih-oh)/2+ih*${panY}*on/${totalFrames}`;
            imageFilter += `zoompan=z='${zoomExpr}':x='${xExpr}':y='${yExpr}':d=${totalFrames}:s=${width}x${height}:fps=${fps},`;
          } else {
            imageFilter += `scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2,`;
          }

          if (colorFilterEnabled && colorFilter !== "none") {
            const colorFilterStr = getColorFilterString(colorFilter);
            if (colorFilterStr) {
              imageFilter += `${colorFilterStr},`;
            }
          }

          imageFilter += `trim=duration=${duration},setpts=PTS-STARTPTS`;
          imageFilter += `[v${i}]`;

          filterParts.push(imageFilter);
          concatInputs.push(`[v${i}]`);
        }

        let finalFilter = filterParts.join("; ");

        if (validScenes.length > 1 && transitionEnabled) {
          let currentInput = "[v0]";
          for (let i = 1; i < validScenes.length; i++) {
            const outputLabel = i === validScenes.length - 1 ? "[vout]" : `[xf${i}]`;
            const offset = validScenes
              .slice(0, i)
              .reduce((sum, s) => sum + s.durationSeconds, 0) - transitionDuration * i;
            
            finalFilter += `; ${currentInput}[v${i}]xfade=transition=${transitionType}:duration=${transitionDuration}:offset=${Math.max(0, offset).toFixed(2)}${outputLabel}`;
            currentInput = outputLabel.replace("]", "").replace("[", "");
            currentInput = `[${currentInput}]`;
          }
        } else {
          finalFilter += `; ${concatInputs.join("")}concat=n=${validScenes.length}:v=1:a=0[vout]`;
        }

        const inputArgs: string[] = [];
        for (let i = 0; i < validScenes.length; i++) {
          inputArgs.push("-loop", "1", "-t", validScenes[i].durationSeconds.toFixed(2), "-i", `img_${String(i).padStart(3, "0")}.jpg`);
        }

        const outputFilename = `${projectName.replace(/[^a-zA-Z0-9_-]/g, "_")}_video.mp4`;

        await ffmpeg.exec([
          ...inputArgs,
          "-filter_complex",
          finalFilter,
          "-map",
          "[vout]",
          "-c:v",
          "libx264",
          "-preset",
          "fast",
          "-crf",
          "23",
          "-pix_fmt",
          "yuv420p",
          "-r",
          String(fps),
          "-y",
          outputFilename,
        ]);

        if (cancelledRef.current) return null;

        setProgress({
          stage: "done",
          progress: 95,
          message: "Finalizando...",
        });

        const data = await ffmpeg.readFile(outputFilename);
        const uint8Array = data instanceof Uint8Array ? data : new TextEncoder().encode(data as string);
        const blob = new Blob([new Uint8Array(uint8Array)], { type: "video/mp4" });

        for (let i = 0; i < validScenes.length; i++) {
          try {
            await ffmpeg.deleteFile(`img_${String(i).padStart(3, "0")}.jpg`);
          } catch {}
        }
        try {
          await ffmpeg.deleteFile(outputFilename);
        } catch {}

        setProgress({
          stage: "done",
          progress: 100,
          message: "Vídeo gerado com sucesso!",
        });

        toast({
          title: "🎬 Vídeo gerado!",
          description: `${validScenes.length} cenas processadas com efeitos.`,
        });

        return blob;
      } catch (error: any) {
        if (cancelledRef.current || error.message === "Cancelled") {
          return null;
        }
        console.error("FFmpeg error:", error);
        setProgress({
          stage: "error",
          progress: 0,
          message: error.message || "Erro ao gerar vídeo",
        });
        toast({
          title: "Erro ao gerar vídeo",
          description: error.message || "Falha no processamento FFmpeg",
          variant: "destructive",
        });
        return null;
      } finally {
        setIsGenerating(false);
      }
    },
    [loadFFmpeg]
  );

  const downloadVideo = useCallback((blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename.endsWith(".mp4") ? filename : `${filename}.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  return {
    generateVideo,
    downloadVideo,
    cancelGeneration,
    isGenerating,
    progress,
  };
}

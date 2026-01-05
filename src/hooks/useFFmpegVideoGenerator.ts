import { useState, useRef, useCallback } from "react";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";
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
  transitionDuration?: number; // in seconds
  colorFilterEnabled?: boolean;
  colorFilter?: "warm" | "cool" | "cinematic" | "vintage" | "none";
}

export interface VideoGenerationProgress {
  stage: "loading" | "processing" | "encoding" | "done" | "error";
  progress: number; // 0-100
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

  const loadFFmpeg = useCallback(async () => {
    if (loadedRef.current && ffmpegRef.current) return ffmpegRef.current;

    setProgress({
      stage: "loading",
      progress: 5,
      message: "Iniciando FFmpeg...",
    });

    const ffmpeg = new FFmpeg();
    ffmpegRef.current = ffmpeg;

    ffmpeg.on("progress", ({ progress: p }) => {
      setProgress((prev) => ({
        ...prev,
        progress: Math.min(90, 30 + p * 60),
        message: `Codificando vídeo... ${Math.round(p * 100)}%`,
      }));
    });

    ffmpeg.on("log", ({ message }) => {
      console.log("[FFmpeg]", message);
    });

    // Use esm.sh with proper CORS headers - more reliable than unpkg
    const baseURL = "https://esm.sh/@ffmpeg/core@0.12.6/dist/esm";

    try {
      setProgress({
        stage: "loading",
        progress: 10,
        message: "Baixando FFmpeg Core...",
      });

      // Fetch with timeout wrapper
      const fetchWithTimeout = async (url: string, timeout = 30000): Promise<Response> => {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), timeout);
        try {
          const response = await fetch(url, { signal: controller.signal });
          clearTimeout(id);
          return response;
        } catch (error) {
          clearTimeout(id);
          throw error;
        }
      };

      // Try primary CDN first, then fallback
      const cdns = [
        "https://esm.sh/@ffmpeg/core@0.12.6/dist/esm",
        "https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm",
        "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/esm"
      ];

      let coreURL: string | null = null;
      let wasmURL: string | null = null;

      for (const cdn of cdns) {
        try {
          setProgress({
            stage: "loading",
            progress: 12,
            message: `Tentando CDN...`,
          });

          const coreResponse = await fetchWithTimeout(`${cdn}/ffmpeg-core.js`, 15000);
          if (!coreResponse.ok) continue;
          const coreBlob = await coreResponse.blob();
          coreURL = URL.createObjectURL(new Blob([await coreBlob.text()], { type: "text/javascript" }));

          setProgress({
            stage: "loading",
            progress: 18,
            message: "Baixando WASM (~30MB)...",
          });

          const wasmResponse = await fetchWithTimeout(`${cdn}/ffmpeg-core.wasm`, 60000);
          if (!wasmResponse.ok) {
            URL.revokeObjectURL(coreURL);
            coreURL = null;
            continue;
          }
          const wasmBlob = await wasmResponse.blob();
          wasmURL = URL.createObjectURL(wasmBlob);

          break; // Success!
        } catch (e) {
          console.warn(`CDN ${cdn} failed:`, e);
          continue;
        }
      }

      if (!coreURL || !wasmURL) {
        throw new Error("Não foi possível baixar FFmpeg de nenhum CDN. Verifique sua conexão.");
      }

      setProgress({
        stage: "loading",
        progress: 22,
        message: "Inicializando FFmpeg...",
      });

      await ffmpeg.load({
        coreURL,
        wasmURL,
      });

      loadedRef.current = true;
      setProgress({
        stage: "loading",
        progress: 25,
        message: "FFmpeg carregado!",
      });
      return ffmpeg;
    } catch (error: any) {
      console.error("Error loading FFmpeg:", error);
      loadedRef.current = false;
      ffmpegRef.current = null;
      throw new Error(error.message || "Falha ao carregar FFmpeg. Tente recarregar a página.");
    }
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

      // Filter scenes that have images
      const validScenes = scenes.filter((s) => s.generatedImage);
      if (validScenes.length === 0) {
        toast({
          title: "Sem imagens",
          description: "Nenhuma cena possui imagem gerada.",
          variant: "destructive",
        });
        return null;
      }

      setIsGenerating(true);

      try {
        const ffmpeg = await loadFFmpeg();
        if (!ffmpeg) throw new Error("FFmpeg não carregou");

        const width = resolution === "1080p" ? 1920 : 1280;
        const height = resolution === "1080p" ? 1080 : 720;

        setProgress({
          stage: "processing",
          progress: 30,
          currentScene: 0,
          totalScenes: validScenes.length,
          message: "Processando imagens...",
        });

        // Write all images to FFmpeg filesystem
        for (let i = 0; i < validScenes.length; i++) {
          const scene = validScenes[i];
          const imageData = scene.generatedImage!;

          setProgress({
            stage: "processing",
            progress: 30 + (i / validScenes.length) * 20,
            currentScene: i + 1,
            totalScenes: validScenes.length,
            message: `Carregando imagem ${i + 1}/${validScenes.length}...`,
          });

          // Convert base64 or URL to file
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

        setProgress({
          stage: "encoding",
          progress: 50,
          message: "Gerando vídeo com efeitos...",
        });

        // Build complex filter for Ken Burns + transitions + color
        const filterParts: string[] = [];
        const concatInputs: string[] = [];

        for (let i = 0; i < validScenes.length; i++) {
          const scene = validScenes[i];
          const duration = scene.durationSeconds;
          const totalFrames = Math.round(duration * fps);

          // Ken Burns effect parameters - random zoom direction
          const zoomStart = 1.0;
          const zoomEnd = kenBurnsEnabled ? 1.15 : 1.0;
          const panX = kenBurnsEnabled ? (i % 2 === 0 ? 0.02 : -0.02) : 0;
          const panY = kenBurnsEnabled ? (i % 3 === 0 ? 0.01 : -0.01) : 0;

          // Build filter for this image
          let imageFilter = `[${i}:v]loop=loop=${totalFrames}:size=1:start=0,setpts=N/${fps}/TB,`;
          
          // Scale to proper resolution
          imageFilter += `scale=${width * 1.2}:${height * 1.2},`;
          
          // Ken Burns zoom and pan effect
          if (kenBurnsEnabled) {
            const zoomExpr = `${zoomStart}+(${zoomEnd - zoomStart})*on/${totalFrames}`;
            const xExpr = `(iw-ow)/2+iw*${panX}*on/${totalFrames}`;
            const yExpr = `(ih-oh)/2+ih*${panY}*on/${totalFrames}`;
            imageFilter += `zoompan=z='${zoomExpr}':x='${xExpr}':y='${yExpr}':d=${totalFrames}:s=${width}x${height}:fps=${fps},`;
          } else {
            imageFilter += `scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2,`;
          }

          // Color filter
          if (colorFilterEnabled && colorFilter !== "none") {
            const colorFilterStr = getColorFilterString(colorFilter);
            if (colorFilterStr) {
              imageFilter += `${colorFilterStr},`;
            }
          }

          // Trim and set duration
          imageFilter += `trim=duration=${duration},setpts=PTS-STARTPTS`;
          imageFilter += `[v${i}]`;

          filterParts.push(imageFilter);
          concatInputs.push(`[v${i}]`);
        }

        // Build the concat or xfade chain
        let finalFilter = filterParts.join("; ");

        if (validScenes.length > 1 && transitionEnabled) {
          // Add transitions between scenes
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
          // Simple concat
          finalFilter += `; ${concatInputs.join("")}concat=n=${validScenes.length}:v=1:a=0[vout]`;
        }

        // Build input arguments
        const inputArgs: string[] = [];
        for (let i = 0; i < validScenes.length; i++) {
          inputArgs.push("-loop", "1", "-t", validScenes[i].durationSeconds.toFixed(2), "-i", `img_${String(i).padStart(3, "0")}.jpg`);
        }

        // Execute FFmpeg command
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

        setProgress({
          stage: "done",
          progress: 95,
          message: "Finalizando...",
        });

        // Read the output file
        const data = await ffmpeg.readFile(outputFilename);
        const uint8Array = data instanceof Uint8Array ? data : new TextEncoder().encode(data as string);
        const blob = new Blob([new Uint8Array(uint8Array)], { type: "video/mp4" });

        // Cleanup
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
    isGenerating,
    progress,
  };
}

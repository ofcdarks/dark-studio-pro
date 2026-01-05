import { useState, useRef, useCallback } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';

interface SceneForVideo {
  imageUrl: string;
  durationSeconds: number;
  number: number;
}

interface VideoProgress {
  phase: 'loading' | 'processing' | 'encoding' | 'done' | 'error';
  progress: number;
  message: string;
  currentScene?: number;
  totalScenes?: number;
  estimatedTimeRemaining?: string;
  elapsedTime?: number;
}

export type ProcessingMode = 'single' | 'multi' | 'auto';

// Verificar se o navegador suporta SharedArrayBuffer (necessário para multithreading)
export function supportsMultiThread(): boolean {
  try {
    return typeof SharedArrayBuffer !== 'undefined';
  } catch {
    return false;
  }
}

export function useFFmpegVideo() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [videoProgress, setVideoProgress] = useState<VideoProgress | null>(null);
  const [currentMode, setCurrentMode] = useState<ProcessingMode>('auto');
  const ffmpegRef = useRef<FFmpeg | null>(null);
  const loadedModeRef = useRef<ProcessingMode | null>(null);
  const abortRef = useRef(false);
  const startTimeRef = useRef<number>(0);

  // Controla fetches durante o carregamento do FFmpeg (para permitir cancelamento)
  const loadAbortControllerRef = useRef<AbortController | null>(null);
  const loadPromiseRef = useRef<Promise<FFmpeg> | null>(null);

  // Formatar tempo em formato legível
  const formatTimeRemaining = (ms: number): string => {
    if (ms <= 0) return "Calculando...";
    const totalSeconds = Math.ceil(ms / 1000);
    if (totalSeconds < 60) return `~${totalSeconds}s`;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return seconds > 0 ? `~${minutes}m ${seconds}s` : `~${minutes}m`;
  };

  const toBlobURLWithSignal = async (
    url: string,
    mimeType: string,
    signal: AbortSignal
  ): Promise<string> => {
    const res = await fetch(url, { signal, cache: 'force-cache' });
    if (!res.ok) {
      throw new Error(`Falha ao baixar FFmpeg (${res.status})`);
    }
    const blob = await res.blob();
    return URL.createObjectURL(new Blob([blob], { type: mimeType }));
  };

  const withTimeout = async <T,>(
    promise: Promise<T>,
    ms: number,
    timeoutMessage: string
  ): Promise<T> => {
    let timeoutId: number | undefined;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = window.setTimeout(() => reject(new Error(timeoutMessage)), ms);
    });

    try {
      return await Promise.race([promise, timeoutPromise]);
    } finally {
      if (timeoutId) window.clearTimeout(timeoutId);
    }
  };

  const loadFFmpeg = async (mode: ProcessingMode) => {
    // Determinar modo efetivo
    const useMultiThread = mode === 'multi' || (mode === 'auto' && supportsMultiThread());
    const effectiveMode: ProcessingMode = useMultiThread ? 'multi' : 'single';

    // Se já carregou com o mesmo modo, reutilizar
    if (ffmpegRef.current?.loaded && loadedModeRef.current === effectiveMode) {
      return ffmpegRef.current;
    }

    // Se já está carregando, reutilizar a promessa
    if (loadPromiseRef.current) {
      return loadPromiseRef.current;
    }

    // Cancelar qualquer carregamento anterior
    loadAbortControllerRef.current?.abort();
    loadAbortControllerRef.current = new AbortController();

    // Se mudou de modo, recriar
    if (ffmpegRef.current) {
      try {
        ffmpegRef.current.terminate();
      } catch {
        // Ignorar
      }
      ffmpegRef.current = null;
    }

    const ffmpeg = new FFmpeg();
    // Disponibilizar o instance cedo para o cancelamento conseguir terminar o worker
    ffmpegRef.current = ffmpeg;
    loadedModeRef.current = null;

    ffmpeg.on('log', ({ message }) => {
      console.log('[FFmpeg]', message);
    });

    ffmpeg.on('progress', ({ progress }) => {
      const elapsed = Date.now() - startTimeRef.current;
      const estimatedTotal = progress > 0 ? elapsed / progress : 0;
      const remaining = estimatedTotal - elapsed;

      setVideoProgress((prev) =>
        prev
          ? {
              ...prev,
              progress: Math.min(50 + Math.round(progress * 50), 99),
              message: `Codificando vídeo... ${Math.min(50 + Math.round(progress * 50), 99)}%`,
              elapsedTime: elapsed,
              estimatedTimeRemaining: progress > 0.05 ? formatTimeRemaining(remaining) : 'Calculando...'
            }
          : null
      );
    });

    const modeLabel = useMultiThread ? 'Multi-thread (CPU rápido)' : 'Single-thread (compatível)';
    setVideoProgress({
      phase: 'loading',
      progress: 0,
      message: `Carregando FFmpeg ${modeLabel}...`
    });

    const signal = loadAbortControllerRef.current.signal;

    const attemptLoad = async (baseURL: string, includeWorker: boolean) => {
      const coreURL = await toBlobURLWithSignal(`${baseURL}/ffmpeg-core.js`, 'text/javascript', signal);
      const wasmURL = await toBlobURLWithSignal(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm', signal);

      const loadOptions: Parameters<FFmpeg['load']>[0] = includeWorker
        ? {
            coreURL,
            wasmURL,
            workerURL: await toBlobURLWithSignal(
              `${baseURL}/ffmpeg-core.worker.js`,
              'text/javascript',
              signal
            )
          }
        : { coreURL, wasmURL };

      await withTimeout(ffmpeg.load(loadOptions), 90_000, 'Tempo limite ao carregar FFmpeg');
    };

    const loadPromise = (async () => {
      try {
        if (useMultiThread) {
          // Versão multi-thread (mais rápida)
          const candidates = [
            'https://unpkg.com/@ffmpeg/core-mt@0.12.6/dist/esm',
            'https://cdn.jsdelivr.net/npm/@ffmpeg/core-mt@0.12.6/dist/esm'
          ];

          let lastError: unknown = null;
          for (const baseURL of candidates) {
            if (abortRef.current || signal.aborted) throw new DOMException('Aborted', 'AbortError');
            try {
              await attemptLoad(baseURL, true);
              loadedModeRef.current = 'multi';
              return ffmpeg;
            } catch (e) {
              lastError = e;
            }
          }

          // fallback para single-thread se o multi falhar
          console.log('[FFmpeg] Multi-thread failed, falling back to single-thread');
          setVideoProgress({
            phase: 'loading',
            progress: 0,
            message: 'Multi-thread não suportado, usando single-thread...'
          });

          const candidatesSingle = [
            'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm',
            'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/esm'
          ];

          for (const baseURL of candidatesSingle) {
            if (abortRef.current || signal.aborted) throw new DOMException('Aborted', 'AbortError');
            try {
              await attemptLoad(baseURL, true);
              loadedModeRef.current = 'single';
              return ffmpeg;
            } catch (e) {
              lastError = e;
            }
          }

          throw lastError ?? new Error('Falha ao carregar FFmpeg');
        }

        // Versão single-thread (compatibilidade máxima)
        const candidatesSingle = [
          'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm',
          'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/esm'
        ];

        let lastError: unknown = null;
        for (const baseURL of candidatesSingle) {
          if (abortRef.current || signal.aborted) throw new DOMException('Aborted', 'AbortError');
          try {
            await attemptLoad(baseURL, true);
            loadedModeRef.current = 'single';
            return ffmpeg;
          } catch (e) {
            lastError = e;
          }
        }

        throw lastError ?? new Error('Falha ao carregar FFmpeg');
      } catch (error) {
        // Se foi cancelado, não transformar em erro visível
        if (abortRef.current || signal.aborted) {
          return ffmpeg;
        }

        console.error('[FFmpeg] Load error:', error);
        throw error;
      } finally {
        loadPromiseRef.current = null;
      }
    })();

    loadPromiseRef.current = loadPromise;
    return loadPromise;
  };

  const generateVideo = useCallback(async (
    scenes: SceneForVideo[],
    projectName: string = 'video',
    fps: number = 30,
    mode: ProcessingMode = 'auto'
  ): Promise<Blob | null> => {
    if (scenes.length === 0) return null;
    
    setIsGenerating(true);
    setCurrentMode(mode);
    abortRef.current = false;
    startTimeRef.current = Date.now();

    try {
      const ffmpeg = await loadFFmpeg(mode);
      
      if (abortRef.current) return null;

      // Fase 1: Carregar imagens
      setVideoProgress({
        phase: 'processing',
        progress: 0,
        message: 'Preparando imagens...',
        currentScene: 0,
        totalScenes: scenes.length
      });

      // Criar arquivo de concat para FFmpeg
      let concatContent = '';
      
      for (let i = 0; i < scenes.length; i++) {
        if (abortRef.current) return null;
        
        const scene = scenes[i];
        const fileName = `img_${String(i).padStart(4, '0')}.jpg`;
        
        setVideoProgress({
          phase: 'processing',
          progress: Math.round((i / scenes.length) * 50),
          message: `Carregando cena ${i + 1} de ${scenes.length}...`,
          currentScene: i + 1,
          totalScenes: scenes.length
        });

        // Baixar e converter imagem para arquivo
        const imageData = await fetchFile(scene.imageUrl);
        await ffmpeg.writeFile(fileName, imageData);
        
        // Adicionar ao arquivo concat
        concatContent += `file '${fileName}'\n`;
        concatContent += `duration ${scene.durationSeconds.toFixed(3)}\n`;
      }
      
      // Adicionar última imagem novamente (requisito do FFmpeg concat)
      const lastFileName = `img_${String(scenes.length - 1).padStart(4, '0')}.jpg`;
      concatContent += `file '${lastFileName}'\n`;

      // Escrever arquivo concat
      await ffmpeg.writeFile('concat.txt', concatContent);

      if (abortRef.current) return null;

      // Fase 2: Gerar vídeo
      const modeLabel = loadedModeRef.current === 'multi' ? '(multi-thread)' : '(single-thread)';
      setVideoProgress({
        phase: 'encoding',
        progress: 50,
        message: `Gerando vídeo ${modeLabel}...`,
        totalScenes: scenes.length
      });

      // Executar FFmpeg
      // Configuração otimizada para velocidade
      const ffmpegArgs = [
        '-f', 'concat',
        '-safe', '0',
        '-i', 'concat.txt',
        '-vf', 'scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:black,setsar=1',
        '-c:v', 'libx264',
        '-preset', 'ultrafast',
        '-crf', '28',
        '-pix_fmt', 'yuv420p',
        '-r', String(fps),
        '-movflags', '+faststart',
        'output.mp4'
      ];

      // Multi-thread: adicionar opção de threads
      if (loadedModeRef.current === 'multi') {
        // Usar até 4 threads para encoding
        ffmpegArgs.splice(ffmpegArgs.indexOf('-c:v') + 2, 0, '-threads', '4');
      }

      await ffmpeg.exec(ffmpegArgs);

      if (abortRef.current) return null;

      // Fase 3: Ler resultado
      setVideoProgress({
        phase: 'done',
        progress: 100,
        message: 'Vídeo gerado com sucesso!'
      });

      const data = await ffmpeg.readFile('output.mp4');
      // Converter FileData para Blob de forma compatível
      let videoBlob: Blob;
      if (typeof data === 'string') {
        videoBlob = new Blob([data], { type: 'video/mp4' });
      } else {
        const buffer = new ArrayBuffer(data.byteLength);
        new Uint8Array(buffer).set(data);
        videoBlob = new Blob([buffer], { type: 'video/mp4' });
      }

      // Limpar arquivos temporários
      for (let i = 0; i < scenes.length; i++) {
        try {
          await ffmpeg.deleteFile(`img_${String(i).padStart(4, '0')}.jpg`);
        } catch (e) {
          // Ignorar erros de limpeza
        }
      }
      try {
        await ffmpeg.deleteFile('concat.txt');
        await ffmpeg.deleteFile('output.mp4');
      } catch (e) {
        // Ignorar
      }

      return videoBlob;

    } catch (error) {
      // Se foi cancelado, não exibir erro
      if (abortRef.current) {
        return null;
      }

      console.error('[FFmpeg Video] Error:', error);
      setVideoProgress({
        phase: 'error',
        progress: 0,
        message: error instanceof Error ? error.message : 'Erro ao gerar vídeo'
      });
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const cancelGeneration = useCallback(() => {
    abortRef.current = true;

    // Abortar downloads do core/wasm durante o load
    loadAbortControllerRef.current?.abort();
    loadAbortControllerRef.current = null;

    // Tentar encerrar worker imediatamente (inclusive durante load)
    try {
      ffmpegRef.current?.terminate();
    } catch {
      // Ignorar
    }

    ffmpegRef.current = null;
    loadedModeRef.current = null;
    loadPromiseRef.current = null;

    setIsGenerating(false);
    setVideoProgress(null);
  }, []);

  const downloadVideo = useCallback((blob: Blob, fileName: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName.endsWith('.mp4') ? fileName : `${fileName}.mp4`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, []);

  return {
    isGenerating,
    videoProgress,
    currentMode,
    supportsMultiThread: supportsMultiThread(),
    generateVideo,
    cancelGeneration,
    downloadVideo
  };
}

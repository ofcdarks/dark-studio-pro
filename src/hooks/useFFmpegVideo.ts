import { useState, useRef, useCallback } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

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

  const loadFFmpeg = async (mode: ProcessingMode) => {
    // Determinar modo efetivo
    const useMultiThread = mode === 'multi' || (mode === 'auto' && supportsMultiThread());
    const effectiveMode = useMultiThread ? 'multi' : 'single';
    
    // Se já carregou com o mesmo modo, reutilizar
    if (ffmpegRef.current?.loaded && loadedModeRef.current === effectiveMode) {
      return ffmpegRef.current;
    }

    // Se mudou de modo, recriar
    if (ffmpegRef.current) {
      try {
        ffmpegRef.current.terminate();
      } catch (e) {
        // Ignorar
      }
      ffmpegRef.current = null;
    }

    const ffmpeg = new FFmpeg();
    
    ffmpeg.on('log', ({ message }) => {
      console.log('[FFmpeg]', message);
    });

    ffmpeg.on('progress', ({ progress }) => {
      setVideoProgress(prev => prev ? {
        ...prev,
        progress: Math.min(50 + Math.round(progress * 50), 99),
        message: `Codificando vídeo... ${Math.min(50 + Math.round(progress * 50), 99)}%`
      } : null);
    });

    const modeLabel = useMultiThread ? 'Multi-thread (CPU rápido)' : 'Single-thread (compatível)';
    setVideoProgress({
      phase: 'loading',
      progress: 0,
      message: `Carregando FFmpeg ${modeLabel}...`
    });

    try {
      if (useMultiThread) {
        // Versão multi-thread (mais rápida, usa múltiplos cores)
        const baseURL = 'https://unpkg.com/@ffmpeg/core-mt@0.12.6/dist/esm';
        
        await ffmpeg.load({
          coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
          wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
          workerURL: await toBlobURL(`${baseURL}/ffmpeg-core.worker.js`, 'text/javascript'),
        });
      } else {
        // Versão single-thread (compatibilidade máxima)
        const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
        
        await ffmpeg.load({
          coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
          wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
        });
      }

      ffmpegRef.current = ffmpeg;
      loadedModeRef.current = effectiveMode;
      return ffmpeg;
    } catch (error) {
      console.error('[FFmpeg] Load error:', error);
      
      // Se multi-thread falhou, tentar single-thread como fallback
      if (useMultiThread) {
        console.log('[FFmpeg] Multi-thread failed, falling back to single-thread');
        setVideoProgress({
          phase: 'loading',
          progress: 0,
          message: 'Multi-thread não suportado, usando single-thread...'
        });
        
        const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
        
        await ffmpeg.load({
          coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
          wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
        });
        
        ffmpegRef.current = ffmpeg;
        loadedModeRef.current = 'single';
        return ffmpeg;
      }
      
      throw error;
    }
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

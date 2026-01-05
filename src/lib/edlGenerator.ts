/**
 * Gerador de EDL (Edit Decision List) para DaVinci Resolve
 * Formato CMX 3600 compatível com DaVinci Resolve 16+
 */

interface SceneForEdl {
  number: number;
  text: string;
  durationSeconds: number;
  imagePath?: string;
}

/**
 * Formata segundos para formato timecode (HH:MM:SS:FF)
 * Assume 24fps para compatibilidade máxima
 */
const formatEdlTimecode = (seconds: number, fps: number = 24): string => {
  const totalFrames = Math.floor(seconds * fps);
  const h = Math.floor(totalFrames / (fps * 3600));
  const m = Math.floor((totalFrames % (fps * 3600)) / (fps * 60));
  const s = Math.floor((totalFrames % (fps * 60)) / fps);
  const f = totalFrames % fps;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}:${String(f).padStart(2, '0')}`;
};

/**
 * Gera conteúdo EDL no formato CMX 3600
 * Compatível com DaVinci Resolve, Premiere Pro, Final Cut Pro
 */
export const generateEdl = (
  scenes: SceneForEdl[],
  options: {
    title?: string;
    fps?: number;
    dropFrame?: boolean;
  } = {}
): string => {
  const title = options.title || 'PROJETO_VIDEO';
  const fps = options.fps || 24;
  const dropFrame = options.dropFrame ?? false;
  
  // Header do EDL
  let edl = `TITLE: ${title.toUpperCase().replace(/\s+/g, '_')}\n`;
  edl += `FCM: ${dropFrame ? 'DROP FRAME' : 'NON-DROP FRAME'}\n\n`;
  
  let currentTimeSeconds = 0;
  
  scenes.forEach((scene, index) => {
    const editNumber = String(index + 1).padStart(3, '0');
    
    // Source IN/OUT (começando do 0)
    const sourceIn = formatEdlTimecode(0, fps);
    const sourceOut = formatEdlTimecode(scene.durationSeconds, fps);
    
    // Record IN/OUT (posição na timeline)
    const recordIn = formatEdlTimecode(currentTimeSeconds, fps);
    const recordOut = formatEdlTimecode(currentTimeSeconds + scene.durationSeconds, fps);
    
    // Nome do reel/clip baseado na imagem ou número da cena
    const reelName = scene.imagePath 
      ? scene.imagePath.split('/').pop()?.replace(/\.[^/.]+$/, '')?.substring(0, 8).toUpperCase() || `CENA_${String(scene.number).padStart(2, '0')}`
      : `CENA_${String(scene.number).padStart(2, '0')}`;
    
    // Linha principal do EDL
    // Formato: EDIT# REEL TRACK TRANS SOURCE_IN SOURCE_OUT REC_IN REC_OUT
    edl += `${editNumber}  ${reelName.padEnd(8, ' ')} V     C        ${sourceIn} ${sourceOut} ${recordIn} ${recordOut}\n`;
    
    // Comentário com o nome do arquivo original (FROM CLIP NAME)
    if (scene.imagePath) {
      const fileName = scene.imagePath.split('/').pop() || `cena_${scene.number}.jpg`;
      edl += `* FROM CLIP NAME: ${fileName}\n`;
    }
    
    // Comentário com texto da cena (opcional, para referência)
    if (scene.text) {
      const shortText = scene.text.length > 60 ? scene.text.substring(0, 57) + '...' : scene.text;
      edl += `* COMMENT: ${shortText.replace(/\n/g, ' ')}\n`;
    }
    
    edl += '\n';
    
    currentTimeSeconds += scene.durationSeconds;
  });
  
  return edl;
};

/**
 * Gera EDL com transições de dissolve entre cenas
 */
export const generateEdlWithTransitions = (
  scenes: SceneForEdl[],
  options: {
    title?: string;
    fps?: number;
    transitionFrames?: number; // Duração da transição em frames
  } = {}
): string => {
  const title = options.title || 'PROJETO_VIDEO';
  const fps = options.fps || 24;
  const transitionFrames = options.transitionFrames || 12; // 0.5s em 24fps
  const transitionSeconds = transitionFrames / fps;
  
  // Header do EDL
  let edl = `TITLE: ${title.toUpperCase().replace(/\s+/g, '_')}\n`;
  edl += `FCM: NON-DROP FRAME\n\n`;
  
  let currentTimeSeconds = 0;
  
  scenes.forEach((scene, index) => {
    const editNumber = String(index + 1).padStart(3, '0');
    
    // Source timecodes
    const sourceIn = formatEdlTimecode(0, fps);
    const sourceOut = formatEdlTimecode(scene.durationSeconds, fps);
    
    // Record timecodes
    const recordIn = formatEdlTimecode(currentTimeSeconds, fps);
    const recordOut = formatEdlTimecode(currentTimeSeconds + scene.durationSeconds, fps);
    
    // Nome do reel
    const reelName = scene.imagePath 
      ? scene.imagePath.split('/').pop()?.replace(/\.[^/.]+$/, '')?.substring(0, 8).toUpperCase() || `CENA_${String(scene.number).padStart(2, '0')}`
      : `CENA_${String(scene.number).padStart(2, '0')}`;
    
    // Tipo de transição: C = Cut, D = Dissolve
    const transType = index === 0 ? 'C' : `D    ${String(transitionFrames).padStart(3, '0')}`;
    
    edl += `${editNumber}  ${reelName.padEnd(8, ' ')} V     ${transType.padEnd(9, ' ')} ${sourceIn} ${sourceOut} ${recordIn} ${recordOut}\n`;
    
    if (scene.imagePath) {
      const fileName = scene.imagePath.split('/').pop() || `cena_${scene.number}.jpg`;
      edl += `* FROM CLIP NAME: ${fileName}\n`;
    }
    
    edl += '\n';
    
    currentTimeSeconds += scene.durationSeconds;
  });
  
  return edl;
};

/**
 * Calcula a duração total do EDL
 */
export const calculateEdlDuration = (scenes: SceneForEdl[]): number => {
  return scenes.reduce((total, scene) => total + scene.durationSeconds, 0);
};

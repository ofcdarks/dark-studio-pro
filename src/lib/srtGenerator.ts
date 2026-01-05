/**
 * Gerador de SRT inteligente para narração
 * - Blocos de no máximo 499 caracteres
 * - Não corta palavras
 * - 10 segundos de espaço entre blocos
 */

interface SrtBlock {
  index: number;
  startSeconds: number;
  endSeconds: number;
  text: string;
}

/**
 * Formata segundos para formato SRT (HH:MM:SS,mmm)
 */
const formatSrtTime = (seconds: number): string => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.round((seconds % 1) * 1000);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
};

/**
 * Divide texto em blocos de no máximo maxChars caracteres
 * sem cortar palavras
 */
const splitTextIntoBlocks = (text: string, maxChars: number = 499): string[] => {
  if (text.length <= maxChars) {
    return [text.trim()];
  }

  const blocks: string[] = [];
  const words = text.split(/\s+/).filter(w => w.length > 0);
  let currentBlock = '';

  for (const word of words) {
    const testBlock = currentBlock ? `${currentBlock} ${word}` : word;
    
    if (testBlock.length <= maxChars) {
      currentBlock = testBlock;
    } else {
      // Se a palavra sozinha é maior que o limite, força inclusão
      if (currentBlock.length === 0) {
        blocks.push(word);
      } else {
        blocks.push(currentBlock.trim());
        currentBlock = word;
      }
    }
  }

  if (currentBlock.trim().length > 0) {
    blocks.push(currentBlock.trim());
  }

  return blocks;
};

/**
 * Calcula duração estimada de leitura (150 palavras por minuto)
 */
const calculateReadingDuration = (text: string): number => {
  const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;
  const wordsPerSecond = 150 / 60; // 2.5 palavras por segundo
  return Math.max(2, wordCount / wordsPerSecond); // Mínimo 2 segundos
};

interface SceneForSrt {
  number: number;
  text: string;
  startSeconds: number;
  endSeconds: number;
}

/**
 * Gera conteúdo SRT a partir de cenas
 * Cada cena pode ser dividida em múltiplos blocos se exceder 499 caracteres
 * Com 10 segundos de espaço entre blocos de cenas diferentes
 */
export const generateNarrationSrt = (
  scenes: SceneForSrt[],
  options: {
    maxCharsPerBlock?: number;
    gapBetweenScenes?: number;
  } = {}
): string => {
  const maxChars = options.maxCharsPerBlock ?? 499;
  const gapBetweenScenes = options.gapBetweenScenes ?? 10; // 10 segundos entre cenas

  const srtBlocks: SrtBlock[] = [];
  let blockIndex = 1;
  let currentTime = 0;

  scenes.forEach((scene, sceneIndex) => {
    const textBlocks = splitTextIntoBlocks(scene.text, maxChars);
    const sceneDuration = scene.endSeconds - scene.startSeconds;
    
    // Divide o tempo da cena proporcionalmente entre os blocos
    const totalWords = scene.text.split(/\s+/).filter(w => w.length > 0).length;
    
    textBlocks.forEach((blockText, blockIdx) => {
      const blockWords = blockText.split(/\s+/).filter(w => w.length > 0).length;
      const blockDuration = (blockWords / totalWords) * sceneDuration;
      
      const startSeconds = currentTime;
      const endSeconds = currentTime + blockDuration;

      srtBlocks.push({
        index: blockIndex++,
        startSeconds,
        endSeconds,
        text: blockText
      });

      currentTime = endSeconds;
    });

    // Adiciona gap de 10 segundos após cada cena (exceto a última)
    if (sceneIndex < scenes.length - 1) {
      currentTime += gapBetweenScenes;
    }
  });

  // Gera o conteúdo SRT
  return srtBlocks.map(block => 
    `${block.index}\n${formatSrtTime(block.startSeconds)} --> ${formatSrtTime(block.endSeconds)}\n${block.text}\n`
  ).join('\n');
};

/**
 * Gera SRT simples (sem divisão por caracteres, uma entrada por cena)
 * Para compatibilidade com o formato antigo
 */
export const generateSimpleSrt = (scenes: SceneForSrt[]): string => {
  return scenes.map((scene, idx) => {
    const startSrt = formatSrtTime(scene.startSeconds);
    const endSrt = formatSrtTime(scene.endSeconds);
    return `${idx + 1}\n${startSrt} --> ${endSrt}\n${scene.text}\n`;
  }).join('\n');
};

/**
 * Valida se todos os blocos respeitam o limite de caracteres
 */
export const validateSrtBlocks = (srt: string, maxChars: number = 499): boolean => {
  const blocks = srt.split('\n\n').filter(b => b.trim().length > 0);
  
  for (const block of blocks) {
    const lines = block.split('\n');
    if (lines.length >= 3) {
      const textLines = lines.slice(2).join(' ');
      if (textLines.length > maxChars) {
        return false;
      }
    }
  }
  
  return true;
};

/**
 * Conta o número de blocos no SRT
 */
export const countSrtBlocks = (srt: string): number => {
  const blocks = srt.split('\n\n').filter(b => b.trim().length > 0);
  return blocks.length;
};

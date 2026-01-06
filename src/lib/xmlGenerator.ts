/**
 * Gerador de XML (Final Cut Pro 7 XML) para DaVinci Resolve
 * Formato compatível com DaVinci Resolve 16+ e outros NLEs
 * Versão Cinematográfica Profissional
 */

interface SceneForXml {
  number: number;
  text: string;
  durationSeconds: number;
  imagePath?: string;
  kenBurnsMotion?: KenBurnsMotion;
}

/**
 * Tipos de movimento Ken Burns
 */
export type KenBurnsMotionType = 
  | 'zoom_in' 
  | 'zoom_out' 
  | 'pan_left' 
  | 'pan_right' 
  | 'pan_up' 
  | 'pan_down'
  | 'zoom_in_pan_right'
  | 'zoom_in_pan_left'
  | 'zoom_out_pan_right'
  | 'zoom_out_pan_left'
  | 'static';

export interface KenBurnsMotion {
  type: KenBurnsMotionType;
  intensity: 'subtle' | 'normal' | 'dramatic';
  reason?: string;
}

export interface KenBurnsOption {
  id: KenBurnsMotionType;
  name: string;
  description: string;
  icon: string;
}

export const KEN_BURNS_OPTIONS: KenBurnsOption[] = [
  { id: 'zoom_in', name: 'Zoom In', description: 'Aproximar - foco, tensão, intimidade', icon: '🔍' },
  { id: 'zoom_out', name: 'Zoom Out', description: 'Afastar - revelação, contexto, épico', icon: '🔭' },
  { id: 'pan_left', name: 'Pan Esquerda', description: 'Movimento lateral - transição, passagem de tempo', icon: '⬅️' },
  { id: 'pan_right', name: 'Pan Direita', description: 'Movimento lateral - progressão, avanço', icon: '➡️' },
  { id: 'pan_up', name: 'Pan Cima', description: 'Movimento vertical - grandeza, esperança', icon: '⬆️' },
  { id: 'pan_down', name: 'Pan Baixo', description: 'Movimento vertical - introspecção, peso', icon: '⬇️' },
  { id: 'zoom_in_pan_right', name: 'Zoom + Pan Direita', description: 'Combinado - ação intensa, perseguição', icon: '↗️' },
  { id: 'zoom_in_pan_left', name: 'Zoom + Pan Esquerda', description: 'Combinado - descoberta dramática', icon: '↖️' },
  { id: 'zoom_out_pan_right', name: 'Zoom Out + Pan Direita', description: 'Combinado - épico revelador', icon: '↘️' },
  { id: 'zoom_out_pan_left', name: 'Zoom Out + Pan Esquerda', description: 'Combinado - conclusão grandiosa', icon: '↙️' },
  { id: 'static', name: 'Estático', description: 'Sem movimento - momento de pausa', icon: '⏸️' },
];

/**
 * Palavras-chave para análise de movimento de câmera baseada no conteúdo
 */
const MOTION_KEYWORDS = {
  zoom_in: [
    'foco', 'detalhe', 'olha', 'veja', 'observe', 'atenção', 'importante', 'crucial',
    'segredo', 'mistério', 'tensão', 'medo', 'terror', 'surpresa', 'choque', 'rosto',
    'olhos', 'expressão', 'emoção', 'intimidade', 'perto', 'aproximar', 'revelar',
    'descobrir', 'perceber', 'notar', 'examinar', 'analisar', 'estudar', 'entender',
    'focus', 'detail', 'look', 'watch', 'attention', 'important', 'crucial', 'secret',
    'mystery', 'tension', 'fear', 'terror', 'surprise', 'shock', 'face', 'eyes'
  ],
  zoom_out: [
    'panorama', 'visão geral', 'contexto', 'mundo', 'universo', 'tudo', 'inteiro',
    'completo', 'épico', 'grandioso', 'imenso', 'vasto', 'horizonte', 'paisagem',
    'natureza', 'montanha', 'oceano', 'céu', 'espaço', 'multidão', 'cidade', 'país',
    'revelação', 'conclusão', 'final', 'resultado', 'consequência', 'magnitude',
    'overview', 'context', 'world', 'universe', 'everything', 'complete', 'epic',
    'grand', 'immense', 'vast', 'horizon', 'landscape', 'nature', 'mountain'
  ],
  pan_left: [
    'passado', 'antes', 'anterior', 'memória', 'lembrança', 'recordar', 'voltar',
    'retorno', 'origem', 'início', 'começo', 'tradição', 'história', 'legado',
    'past', 'before', 'memory', 'remember', 'return', 'origin', 'beginning', 'start'
  ],
  pan_right: [
    'futuro', 'depois', 'próximo', 'adiante', 'avançar', 'progresso', 'evolução',
    'crescimento', 'desenvolvimento', 'inovação', 'novo', 'moderno', 'tecnologia',
    'destino', 'objetivo', 'meta', 'sonho', 'ambição', 'esperança', 'possibilidade',
    'future', 'next', 'forward', 'progress', 'evolution', 'growth', 'development'
  ],
  pan_up: [
    'céu', 'alto', 'subir', 'ascender', 'elevar', 'voar', 'sonho', 'esperança',
    'liberdade', 'sucesso', 'vitória', 'conquista', 'poder', 'força', 'divino',
    'espiritual', 'transcender', 'inspiração', 'motivação', 'potencial', 'glória',
    'sky', 'high', 'rise', 'ascend', 'fly', 'dream', 'hope', 'freedom', 'success'
  ],
  pan_down: [
    'terra', 'chão', 'baixo', 'descer', 'cair', 'peso', 'gravidade', 'realidade',
    'fundação', 'base', 'raiz', 'origem', 'profundo', 'introspectivo', 'sombra',
    'tristeza', 'derrota', 'fracasso', 'perda', 'luto', 'reflexão', 'humildade',
    'ground', 'down', 'fall', 'weight', 'gravity', 'reality', 'foundation', 'deep'
  ],
  action_intense: [
    'ação', 'velocidade', 'rápido', 'urgente', 'emergência', 'perseguição', 'fuga',
    'luta', 'batalha', 'guerra', 'conflito', 'explosão', 'impacto', 'colisão',
    'corrida', 'correr', 'saltar', 'pular', 'atacar', 'defender', 'destruir',
    'action', 'speed', 'fast', 'urgent', 'emergency', 'chase', 'escape', 'fight'
  ],
  dramatic_reveal: [
    'mas', 'porém', 'entretanto', 'contudo', 'surpreendente', 'incrível', 'chocante',
    'inesperado', 'plot twist', 'virada', 'reviravolta', 'revelação', 'verdade',
    'but', 'however', 'surprising', 'incredible', 'shocking', 'unexpected', 'twist'
  ]
};

/**
 * Analisa o texto da cena e sugere movimento Ken Burns apropriado
 */
export const analyzeSceneForKenBurns = (
  text: string,
  sceneIndex: number,
  totalScenes: number,
  previousMotion?: KenBurnsMotionType
): KenBurnsMotion => {
  const lowerText = text.toLowerCase();
  const words = lowerText.split(/\s+/);
  
  // Scoring para cada tipo de movimento
  const scores: Record<string, number> = {
    zoom_in: 0,
    zoom_out: 0,
    pan_left: 0,
    pan_right: 0,
    pan_up: 0,
    pan_down: 0,
    action_intense: 0,
    dramatic_reveal: 0,
  };
  
  // Calcular scores baseado em palavras-chave
  for (const [motionType, keywords] of Object.entries(MOTION_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowerText.includes(keyword)) {
        scores[motionType] += keyword.length > 5 ? 2 : 1;
      }
    }
  }
  
  // Determinar o movimento baseado nos scores
  let selectedMotion: KenBurnsMotionType = 'zoom_in';
  let intensity: 'subtle' | 'normal' | 'dramatic' = 'normal';
  let reason = '';
  
  // Ação intensa = combinação de zoom + pan
  if (scores.action_intense >= 3) {
    selectedMotion = previousMotion === 'zoom_in_pan_right' ? 'zoom_in_pan_left' : 'zoom_in_pan_right';
    intensity = 'dramatic';
    reason = 'Cena de ação intensa detectada';
  }
  // Revelação dramática = zoom out
  else if (scores.dramatic_reveal >= 2) {
    selectedMotion = 'zoom_out';
    intensity = 'dramatic';
    reason = 'Momento de revelação dramática';
  }
  // Primeira cena = zoom in para capturar atenção
  else if (sceneIndex === 0) {
    selectedMotion = 'zoom_in';
    intensity = 'normal';
    reason = 'Abertura - capturar atenção do espectador';
  }
  // Última cena = zoom out para conclusão épica
  else if (sceneIndex === totalScenes - 1) {
    selectedMotion = 'zoom_out';
    intensity = 'dramatic';
    reason = 'Conclusão - revelação final';
  }
  // Baseado no score mais alto
  else {
    const maxScore = Math.max(
      scores.zoom_in,
      scores.zoom_out,
      scores.pan_left,
      scores.pan_right,
      scores.pan_up,
      scores.pan_down
    );
    
    if (maxScore > 0) {
      if (scores.zoom_in === maxScore) {
        selectedMotion = 'zoom_in';
        reason = 'Foco em detalhes/emoção';
      } else if (scores.zoom_out === maxScore) {
        selectedMotion = 'zoom_out';
        reason = 'Contexto/visão geral';
      } else if (scores.pan_up === maxScore) {
        selectedMotion = 'pan_up';
        reason = 'Elevação/esperança';
      } else if (scores.pan_down === maxScore) {
        selectedMotion = 'pan_down';
        reason = 'Introspecção/peso';
      } else if (scores.pan_left === maxScore) {
        selectedMotion = 'pan_left';
        reason = 'Referência ao passado';
      } else if (scores.pan_right === maxScore) {
        selectedMotion = 'pan_right';
        reason = 'Progressão/futuro';
      }
      
      intensity = maxScore >= 4 ? 'dramatic' : maxScore >= 2 ? 'normal' : 'subtle';
    } else {
      // Alternar entre zoom in e zoom out se não houver keywords
      selectedMotion = previousMotion === 'zoom_in' ? 'zoom_out' : 'zoom_in';
      intensity = 'subtle';
      reason = 'Variação para manter dinamismo';
    }
  }
  
  // Evitar repetição excessiva do mesmo movimento
  if (selectedMotion === previousMotion && sceneIndex > 1) {
    const alternatives: KenBurnsMotionType[] = ['zoom_in', 'zoom_out', 'pan_right', 'pan_left'];
    const alternativeIndex = sceneIndex % alternatives.length;
    selectedMotion = alternatives[alternativeIndex];
    reason = 'Variação para evitar repetição';
  }
  
  return {
    type: selectedMotion,
    intensity,
    reason,
  };
};

/**
 * Aplica análise Ken Burns a todas as cenas
 * Respeita movimentos já configurados manualmente
 */
export const applyKenBurnsToScenes = (scenes: SceneForXml[]): SceneForXml[] => {
  let previousMotion: KenBurnsMotionType | undefined;
  
  return scenes.map((scene, index) => {
    // Se já tem Ken Burns configurado manualmente, manter
    if (scene.kenBurnsMotion) {
      previousMotion = scene.kenBurnsMotion.type;
      return scene;
    }
    
    // Caso contrário, analisar automaticamente
    const motion = analyzeSceneForKenBurns(scene.text, index, scenes.length, previousMotion);
    previousMotion = motion.type;
    
    return {
      ...scene,
      kenBurnsMotion: motion,
    };
  });
};

/**
 * Gera os parâmetros de keyframe para o movimento Ken Burns
 */
const getKenBurnsKeyframeParams = (
  motion: KenBurnsMotion,
  durationFrames: number
): { startScale: number; endScale: number; startX: number; endX: number; startY: number; endY: number } => {
  const intensityMultiplier = motion.intensity === 'dramatic' ? 1.5 : motion.intensity === 'subtle' ? 0.5 : 1.0;
  
  const baseZoom = 0.08 * intensityMultiplier;
  const basePan = 0.1 * intensityMultiplier;
  
  let params = {
    startScale: 1.0,
    endScale: 1.0,
    startX: 0,
    endX: 0,
    startY: 0,
    endY: 0,
  };
  
  switch (motion.type) {
    case 'zoom_in':
      params.startScale = 1.0;
      params.endScale = 1.0 + baseZoom;
      break;
    case 'zoom_out':
      params.startScale = 1.0 + baseZoom;
      params.endScale = 1.0;
      break;
    case 'pan_left':
      params.startX = basePan;
      params.endX = -basePan;
      break;
    case 'pan_right':
      params.startX = -basePan;
      params.endX = basePan;
      break;
    case 'pan_up':
      params.startY = basePan;
      params.endY = -basePan;
      break;
    case 'pan_down':
      params.startY = -basePan;
      params.endY = basePan;
      break;
    case 'zoom_in_pan_right':
      params.startScale = 1.0;
      params.endScale = 1.0 + baseZoom;
      params.startX = -basePan * 0.5;
      params.endX = basePan * 0.5;
      break;
    case 'zoom_in_pan_left':
      params.startScale = 1.0;
      params.endScale = 1.0 + baseZoom;
      params.startX = basePan * 0.5;
      params.endX = -basePan * 0.5;
      break;
    case 'zoom_out_pan_right':
      params.startScale = 1.0 + baseZoom;
      params.endScale = 1.0;
      params.startX = -basePan * 0.5;
      params.endX = basePan * 0.5;
      break;
    case 'zoom_out_pan_left':
      params.startScale = 1.0 + baseZoom;
      params.endScale = 1.0;
      params.startX = basePan * 0.5;
      params.endX = -basePan * 0.5;
      break;
    case 'static':
    default:
      // Sem movimento
      break;
  }
  
  return params;
};

/**
 * Gera XML de keyframes para efeito Ken Burns
 */
const generateKenBurnsKeyframesXml = (
  motion: KenBurnsMotion | undefined,
  durationFrames: number,
  fps: number
): string => {
  if (!motion || motion.type === 'static') {
    return '';
  }
  
  const params = getKenBurnsKeyframeParams(motion, durationFrames);
  
  // Gerar XML de keyframes para transformação
  return `                <filter>
                  <effect>
                    <name>Basic Motion</name>
                    <effectid>basic</effectid>
                    <effectcategory>motion</effectcategory>
                    <effecttype>motion</effecttype>
                    <mediatype>video</mediatype>
                    <parameter authoringApp="FCP">
                      <parameterid>scale</parameterid>
                      <name>Scale</name>
                      <valuemin>0</valuemin>
                      <valuemax>10000</valuemax>
                      <value>${(params.startScale * 100).toFixed(1)}</value>
                      <keyframe>
                        <when>0</when>
                        <value>${(params.startScale * 100).toFixed(1)}</value>
                        <interpolation>
                          <name>bezier</name>
                        </interpolation>
                      </keyframe>
                      <keyframe>
                        <when>${durationFrames}</when>
                        <value>${(params.endScale * 100).toFixed(1)}</value>
                        <interpolation>
                          <name>bezier</name>
                        </interpolation>
                      </keyframe>
                    </parameter>
                    <parameter authoringApp="FCP">
                      <parameterid>center</parameterid>
                      <name>Center</name>
                      <value>
                        <horiz>${params.startX.toFixed(4)}</horiz>
                        <vert>${params.startY.toFixed(4)}</vert>
                      </value>
                      <keyframe>
                        <when>0</when>
                        <value>
                          <horiz>${params.startX.toFixed(4)}</horiz>
                          <vert>${params.startY.toFixed(4)}</vert>
                        </value>
                        <interpolation>
                          <name>bezier</name>
                        </interpolation>
                      </keyframe>
                      <keyframe>
                        <when>${durationFrames}</when>
                        <value>
                          <horiz>${params.endX.toFixed(4)}</horiz>
                          <vert>${params.endY.toFixed(4)}</vert>
                        </value>
                        <interpolation>
                          <name>bezier</name>
                        </interpolation>
                      </keyframe>
                    </parameter>
                  </effect>
                </filter>
`;
};

/**
 * Tipos de transição disponíveis
 */
export type TransitionType = 'cross_dissolve' | 'fade_to_black' | 'dip_to_color' | 'wipe' | 'push' | 'none';

export interface TransitionOption {
  id: TransitionType;
  name: string;
  description: string;
  icon: string;
}

export const TRANSITION_OPTIONS: TransitionOption[] = [
  { id: 'cross_dissolve', name: 'Cross Dissolve', description: 'Dissolução suave entre cenas', icon: '🔄' },
  { id: 'fade_to_black', name: 'Fade to Black', description: 'Fade para preto entre cenas', icon: '⬛' },
  { id: 'dip_to_color', name: 'Dip to White', description: 'Flash branco entre cenas', icon: '⬜' },
  { id: 'wipe', name: 'Wipe', description: 'Cortina lateral entre cenas', icon: '➡️' },
  { id: 'push', name: 'Push', description: 'Empurra a cena anterior', icon: '👉' },
  { id: 'none', name: 'Sem Transição', description: 'Corte seco direto', icon: '✂️' },
];

/**
 * Durações de transição disponíveis
 */
export type TransitionDuration = 0.25 | 0.5 | 1 | 1.5 | 2;

export interface TransitionDurationOption {
  value: TransitionDuration;
  label: string;
  description: string;
}

export const TRANSITION_DURATION_OPTIONS: TransitionDurationOption[] = [
  { value: 0.25, label: '0.25s', description: 'Corte rápido' },
  { value: 0.5, label: '0.5s', description: 'Padrão' },
  { value: 1, label: '1s', description: 'Suave' },
  { value: 1.5, label: '1.5s', description: 'Dramático' },
  { value: 2, label: '2s', description: 'Cinematográfico' },
];

/**
 * Aspect Ratios cinematográficos
 */
export type AspectRatio = '16:9' | '2.35:1' | '2.39:1' | '1.85:1' | '4:3' | '9:16';

export interface AspectRatioOption {
  id: AspectRatio;
  name: string;
  description: string;
  width: number;
  height: number;
}

export const ASPECT_RATIO_OPTIONS: AspectRatioOption[] = [
  { id: '16:9', name: '16:9 HD', description: 'YouTube/TV padrão', width: 1920, height: 1080 },
  { id: '2.35:1', name: '2.35:1 Cinemascope', description: 'Cinema épico (Star Wars)', width: 1920, height: 817 },
  { id: '2.39:1', name: '2.39:1 Anamórfico', description: 'Cinema moderno (Marvel)', width: 1920, height: 803 },
  { id: '1.85:1', name: '1.85:1 Flat', description: 'Cinema clássico americano', width: 1920, height: 1038 },
  { id: '4:3', name: '4:3 Academy', description: 'Estilo retrô/documentário', width: 1440, height: 1080 },
  { id: '9:16', name: '9:16 Vertical', description: 'TikTok/Reels/Shorts', width: 1080, height: 1920 },
];

/**
 * Presets de color grading
 */
export type ColorGrading = 'neutral' | 'cinematic_warm' | 'cinematic_cool' | 'film_look' | 'teal_orange' | 'noir' | 'vintage';

export interface ColorGradingOption {
  id: ColorGrading;
  name: string;
  description: string;
  icon: string;
}

export const COLOR_GRADING_OPTIONS: ColorGradingOption[] = [
  { id: 'neutral', name: 'Neutro', description: 'Cores originais', icon: '⚪' },
  { id: 'cinematic_warm', name: 'Cinematic Warm', description: 'Tons dourados (Dune, Blade Runner)', icon: '🌅' },
  { id: 'cinematic_cool', name: 'Cinematic Cool', description: 'Tons azulados (The Revenant)', icon: '🌊' },
  { id: 'film_look', name: 'Film Look', description: 'Estética de película 35mm', icon: '🎞️' },
  { id: 'teal_orange', name: 'Teal & Orange', description: 'Hollywood blockbuster', icon: '🎬' },
  { id: 'noir', name: 'Noir', description: 'Alto contraste dramático', icon: '🖤' },
  { id: 'vintage', name: 'Vintage', description: 'Estilo anos 70-80', icon: '📼' },
];

/**
 * Configurações detalhadas de Color Grading para DaVinci Resolve
 */
export interface ColorGradingConfig {
  lift: { r: number; g: number; b: number; master: number };
  gamma: { r: number; g: number; b: number; master: number };
  gain: { r: number; g: number; b: number; master: number };
  offset: { r: number; g: number; b: number; master: number };
  saturation: number;
  contrast: number;
  pivot: number;
  highlights: number;
  shadows: number;
  midtones: number;
  colorTemp: number;
  tint: number;
  curves?: {
    luma: string;
    red: string;
    green: string;
    blue: string;
  };
  description: string;
  references: string[];
}

export const COLOR_GRADING_CONFIGS: Record<ColorGrading, ColorGradingConfig> = {
  neutral: {
    lift: { r: 0, g: 0, b: 0, master: 0 },
    gamma: { r: 0, g: 0, b: 0, master: 0 },
    gain: { r: 1.0, g: 1.0, b: 1.0, master: 1.0 },
    offset: { r: 0, g: 0, b: 0, master: 0 },
    saturation: 1.0,
    contrast: 1.0,
    pivot: 0.435,
    highlights: 0,
    shadows: 0,
    midtones: 0,
    colorTemp: 0,
    tint: 0,
    description: 'Cores originais sem alteração. Ideal para material que já foi tratado ou requer fidelidade cromática.',
    references: ['Documentários', 'Entrevistas', 'Conteúdo técnico'],
  },
  cinematic_warm: {
    lift: { r: 0.02, g: 0.01, b: -0.01, master: -0.005 },
    gamma: { r: 0.03, g: 0.02, b: -0.02, master: 0 },
    gain: { r: 1.08, g: 1.02, b: 0.92, master: 1.0 },
    offset: { r: 0.01, g: 0.005, b: -0.01, master: 0 },
    saturation: 0.95,
    contrast: 1.15,
    pivot: 0.40,
    highlights: 5,
    shadows: -5,
    midtones: 3,
    colorTemp: 15,
    tint: 3,
    curves: {
      luma: 'S-curve suave: Shadows (-8, -12), Mids (128, 130), Highlights (230, 225)',
      red: 'Levante levemente os mids: (128, 135)',
      green: 'Neutro ou leve boost: (128, 130)',
      blue: 'Reduza em highlights: (200, 190)',
    },
    description: 'Look dourado e quente inspirado em Dune, Blade Runner 2049, e Mad Max. Transmite calor, nostalgia e épico.',
    references: ['Dune (2021)', 'Blade Runner 2049', 'Mad Max: Fury Road', 'The Martian'],
  },
  cinematic_cool: {
    lift: { r: -0.02, g: 0, b: 0.03, master: -0.01 },
    gamma: { r: -0.01, g: 0, b: 0.02, master: 0 },
    gain: { r: 0.95, g: 1.0, b: 1.08, master: 1.0 },
    offset: { r: -0.01, g: 0, b: 0.01, master: 0 },
    saturation: 0.85,
    contrast: 1.20,
    pivot: 0.42,
    highlights: -3,
    shadows: 8,
    midtones: -2,
    colorTemp: -20,
    tint: -5,
    curves: {
      luma: 'S-curve moderado: Shadows (-10, -5), Highlights (235, 220)',
      red: 'Reduza levemente: (128, 120)',
      green: 'Neutro: (128, 128)',
      blue: 'Boost em shadows e mids: (40, 50), (128, 140)',
    },
    description: 'Look frio e dramático inspirado em The Revenant, Interstellar. Transmite isolamento, tensão e grandeza.',
    references: ['The Revenant', 'Interstellar', 'The Hateful Eight', 'Dunkirk'],
  },
  film_look: {
    lift: { r: 0.01, g: 0.01, b: 0.02, master: 0.015 },
    gamma: { r: 0, g: -0.01, b: 0.01, master: 0 },
    gain: { r: 1.02, g: 1.0, b: 0.98, master: 0.98 },
    offset: { r: 0.005, g: 0.003, b: 0.008, master: 0.005 },
    saturation: 0.90,
    contrast: 1.08,
    pivot: 0.45,
    highlights: -8,
    shadows: 10,
    midtones: 0,
    colorTemp: 5,
    tint: 2,
    curves: {
      luma: 'Levante shadows para look lavado: (0, 15), (255, 245)',
      red: 'Leve S-curve: (50, 55), (200, 195)',
      green: 'Quase neutro: (128, 126)',
      blue: 'Boost em shadows: (30, 45)',
    },
    description: 'Simula película 35mm com pretos elevados, highlights suaves e grão sutil. Estética orgânica de cinema.',
    references: ['La La Land', 'Moonlight', 'Her', 'Call Me By Your Name'],
  },
  teal_orange: {
    lift: { r: -0.02, g: 0.01, b: 0.04, master: 0 },
    gamma: { r: 0.02, g: -0.01, b: -0.02, master: 0 },
    gain: { r: 1.10, g: 0.98, b: 0.88, master: 1.0 },
    offset: { r: 0.01, g: 0, b: -0.01, master: 0 },
    saturation: 1.10,
    contrast: 1.25,
    pivot: 0.38,
    highlights: 8,
    shadows: -8,
    midtones: 5,
    colorTemp: 0,
    tint: 0,
    curves: {
      luma: 'S-curve agressivo: Shadows (-15, -25), Highlights (240, 220)',
      red: 'Boost em highlights: (180, 200), (255, 255)',
      green: 'Reduzir levemente: (128, 120)',
      blue: 'Boost forte em shadows: (30, 60), Reduzir em highlights: (220, 190)',
    },
    description: 'Look clássico de Hollywood blockbuster com skin tones laranjas e backgrounds teal. Alto impacto visual.',
    references: ['Transformers', 'Mad Max', 'Marvel MCU', 'Michael Bay films'],
  },
  noir: {
    lift: { r: 0, g: 0, b: 0, master: -0.02 },
    gamma: { r: 0, g: 0, b: 0, master: -0.05 },
    gain: { r: 1.0, g: 1.0, b: 1.0, master: 1.15 },
    offset: { r: 0, g: 0, b: 0, master: 0 },
    saturation: 0.30,
    contrast: 1.50,
    pivot: 0.35,
    highlights: 15,
    shadows: -20,
    midtones: -5,
    colorTemp: 0,
    tint: 0,
    curves: {
      luma: 'S-curve extremo: Shadows (0, 0), (40, 15), Highlights (200, 230), (255, 255)',
      red: 'Igual ao Luma para B&W',
      green: 'Igual ao Luma para B&W',
      blue: 'Igual ao Luma para B&W',
    },
    description: 'Alto contraste dramático, quase P&B. Sombras profundas e highlights estourados. Tensão máxima.',
    references: ['Sin City', 'The Dark Knight', 'Se7en', 'Mank'],
  },
  vintage: {
    lift: { r: 0.03, g: 0.02, b: 0.01, master: 0.02 },
    gamma: { r: 0.02, g: 0.01, b: -0.02, master: 0.01 },
    gain: { r: 1.05, g: 1.02, b: 0.90, master: 0.95 },
    offset: { r: 0.02, g: 0.01, b: -0.01, master: 0.01 },
    saturation: 0.75,
    contrast: 0.90,
    pivot: 0.48,
    highlights: -12,
    shadows: 15,
    midtones: 5,
    colorTemp: 12,
    tint: 5,
    curves: {
      luma: 'Comprimir range: (0, 20), (255, 235)',
      red: 'Boost geral: (128, 140)',
      green: 'Leve fade: (0, 10), (255, 245)',
      blue: 'Reduzir bastante: (128, 100), (255, 220)',
    },
    description: 'Estilo desbotado anos 70-80 com pretos elevados, saturação reduzida e tint amarelado. Nostalgia.',
    references: ['Stranger Things', 'Joker', 'Once Upon a Time in Hollywood', 'Mindhunter'],
  },
};

/**
 * Gera arquivo de instruções de Color Grading para DaVinci Resolve
 */
export const generateColorGradingInstructions = (
  colorGrading: ColorGrading,
  settings: CinematicSettings
): string => {
  const config = COLOR_GRADING_CONFIGS[colorGrading];
  const option = COLOR_GRADING_OPTIONS.find(o => o.id === colorGrading);
  
  const formatValue = (v: number) => v >= 0 ? `+${v.toFixed(3)}` : v.toFixed(3);
  const formatGain = (v: number) => v.toFixed(2);
  
  let instructions = `
╔══════════════════════════════════════════════════════════════════════════════╗
║                    INSTRUÇÕES DE COLOR GRADING - DAVINCI RESOLVE              ║
║                              Preset: ${option?.name.toUpperCase().padEnd(20)}                    ║
╚══════════════════════════════════════════════════════════════════════════════╝

📋 INFORMAÇÕES DO PRESET
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${config.description}

🎬 Filmes de Referência:
${config.references.map(r => `   • ${r}`).join('\n')}

═══════════════════════════════════════════════════════════════════════════════
                              VALORES EXATOS PARA APLICAR
═══════════════════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. COLOR WHEELS (Aba Color)                                                  │
└─────────────────────────────────────────────────────────────────────────────┘

  🔴 LIFT (Shadows/Sombras)
  ├── Red:    ${formatValue(config.lift.r)}
  ├── Green:  ${formatValue(config.lift.g)}
  ├── Blue:   ${formatValue(config.lift.b)}
  └── Master: ${formatValue(config.lift.master)}

  🟡 GAMMA (Midtones/Meios-Tons)
  ├── Red:    ${formatValue(config.gamma.r)}
  ├── Green:  ${formatValue(config.gamma.g)}
  ├── Blue:   ${formatValue(config.gamma.b)}
  └── Master: ${formatValue(config.gamma.master)}

  🔵 GAIN (Highlights/Altas-Luzes)
  ├── Red:    ${formatGain(config.gain.r)}
  ├── Green:  ${formatGain(config.gain.g)}
  ├── Blue:   ${formatGain(config.gain.b)}
  └── Master: ${formatGain(config.gain.master)}

  ⚫ OFFSET (Geral)
  ├── Red:    ${formatValue(config.offset.r)}
  ├── Green:  ${formatValue(config.offset.g)}
  ├── Blue:   ${formatValue(config.offset.b)}
  └── Master: ${formatValue(config.offset.master)}

┌─────────────────────────────────────────────────────────────────────────────┐
│ 2. PRIMARIES (Ajustes Primários)                                             │
└─────────────────────────────────────────────────────────────────────────────┘

  📊 Saturation:    ${(config.saturation * 100).toFixed(0)}%  (valor: ${config.saturation.toFixed(2)})
  📊 Contrast:      ${(config.contrast * 100 - 100).toFixed(0)}%  (valor: ${config.contrast.toFixed(2)})
  📊 Pivot:         ${(config.pivot * 100).toFixed(1)}%  (valor: ${config.pivot.toFixed(3)})

┌─────────────────────────────────────────────────────────────────────────────┐
│ 3. SHADOW/HIGHLIGHT/MIDTONE ADJUSTMENTS                                      │
└─────────────────────────────────────────────────────────────────────────────┘

  🌙 Shadows:       ${config.shadows >= 0 ? '+' : ''}${config.shadows}
  ☀️  Highlights:    ${config.highlights >= 0 ? '+' : ''}${config.highlights}
  🔆 Midtones:      ${config.midtones >= 0 ? '+' : ''}${config.midtones}

┌─────────────────────────────────────────────────────────────────────────────┐
│ 4. WHITE BALANCE                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

  🌡️  Color Temp:    ${config.colorTemp >= 0 ? '+' : ''}${config.colorTemp} (${config.colorTemp > 0 ? 'mais quente' : config.colorTemp < 0 ? 'mais frio' : 'neutro'})
  💜 Tint:          ${config.tint >= 0 ? '+' : ''}${config.tint} (${config.tint > 0 ? 'mais magenta' : config.tint < 0 ? 'mais verde' : 'neutro'})

`;

  if (config.curves) {
    instructions += `
┌─────────────────────────────────────────────────────────────────────────────┐
│ 5. CURVES (Curvas Personalizadas)                                            │
└─────────────────────────────────────────────────────────────────────────────┘

  📈 Luma (Y):
     ${config.curves.luma}

  🔴 Red:
     ${config.curves.red}

  🟢 Green:
     ${config.curves.green}

  🔵 Blue:
     ${config.curves.blue}

`;
  }

  instructions += `
═══════════════════════════════════════════════════════════════════════════════
                           COMO APLICAR NO DAVINCI RESOLVE
═══════════════════════════════════════════════════════════════════════════════

📍 PASSO A PASSO:

1. Vá para a aba "Color" (ícone de pincel colorido na parte inferior)

2. Na seção "Color Wheels", digite os valores de LIFT, GAMMA e GAIN
   • Clique no número abaixo de cada wheel para editar
   • Use os valores RGB e Master listados acima

3. Para ajustar Saturation e Contrast:
   • No painel à direita, encontre "Primaries - Adjust"
   • Digite os valores exatos

4. Para as Curves:
   • Clique na aba "Curves" no painel Color
   • Adicione pontos de controle conforme especificado

5. Para Color Temp e Tint:
   • Use o painel "Primaries - Bars" ou "Primaries - Wheels"
   • Ajuste os sliders de Temp e Tint

💡 DICA PRO: Crie um Power Grade deste look para reusar em outros projetos!
   • Clique direito no node → "Grab Still"
   • Na Gallery, clique direito → "Create Power Grade"

═══════════════════════════════════════════════════════════════════════════════
                              CONFIGURAÇÕES DO PROJETO
═══════════════════════════════════════════════════════════════════════════════

  🎬 FPS:           ${settings.fps}
  📐 Aspect Ratio:  ${settings.aspectRatio}
  🔄 Transição:     ${TRANSITION_OPTIONS.find(t => t.id === settings.transitionType)?.name} (${settings.transitionDuration}s)
  
  Efeitos Cinematográficos:
  ${settings.fadeInOut ? '  ✅ Fade In/Out' : '  ⬜ Fade In/Out'}
  ${settings.kenBurnsEffect ? '  ✅ Ken Burns Effect' : '  ⬜ Ken Burns Effect'}
  ${settings.addVignette ? '  ✅ Vignette' : '  ⬜ Vignette'}
  ${settings.letterbox ? '  ✅ Letterbox' : '  ⬜ Letterbox'}

═══════════════════════════════════════════════════════════════════════════════
                              EFEITOS ADICIONAIS
═══════════════════════════════════════════════════════════════════════════════
`;

  if (settings.addVignette) {
    instructions += `
🔲 VIGNETTE (Vinheta):
   1. No node de Color, vá para "Window" → "Vignette"
   2. Configurações sugeridas:
      • Inner Radius: 0.75
      • Outer Radius: 0.95
      • Roundness: 0.7
      • Soft Edge: 0.8
   3. Reduza o Gain Master do node de Vignette para 0.85

`;
  }

  if (settings.kenBurnsEffect) {
    instructions += `
📷 KEN BURNS EFFECT (Movimento em imagens):
   1. Na aba "Edit", selecione o clip
   2. Vá para "Inspector" → "Transform"
   3. Para Zoom In suave:
      • Frame 1: Zoom 1.00, Position X/Y: 0
      • Último Frame: Zoom 1.08, Position: ajuste conforme composição
   4. Use "Ease In/Out" nas keyframes para movimento orgânico

`;
  }

  if (settings.letterbox) {
    instructions += `
🎬 LETTERBOX (Barras Cinematográficas):
   1. Em "Effects Library" → "Open FX" → busque "Blanking Fill"
   2. Ou crie manualmente:
      • Adicione um "Solid Color" preto em track acima
      • Faça crop para criar as barras (altura = diferença do aspect ratio)
   3. Para ${settings.aspectRatio}:
      ${settings.aspectRatio === '2.35:1' ? '• Barras de ~132px em cima e embaixo (1080p)' : ''}
      ${settings.aspectRatio === '2.39:1' ? '• Barras de ~138px em cima e embaixo (1080p)' : ''}
      ${settings.aspectRatio === '1.85:1' ? '• Barras de ~21px em cima e embaixo (1080p)' : ''}

`;
  }

  if (settings.fadeInOut) {
    instructions += `
🌅 FADE IN/OUT:
   1. No primeiro clip: clique direito → "Add Transition" → "Cross Dissolve"
      • Ajuste duração para 1-2 segundos
   2. No último clip: adicione "Cross Dissolve" no final
   3. Alternativa: Use "Dip to Color" (preto) para efeito mais dramático

`;
  }

  instructions += `
═══════════════════════════════════════════════════════════════════════════════
                              DICAS PROFISSIONAIS
═══════════════════════════════════════════════════════════════════════════════

🎯 WORKFLOW RECOMENDADO:
   1. Primeiro normalize as imagens (exposure, balance)
   2. Aplique o color grade como segundo node
   3. Adicione vinheta/efeitos em nodes separados
   4. Use "Qualifier" para ajustar skin tones se necessário

📺 PARA YOUTUBE:
   • Exporte em H.264 com bitrate 15-25 Mbps
   • Mantenha níveis de vídeo em "Full" (0-255)
   • Adicione 1-2% de saturação extra (YT comprime cores)

🔧 TROUBLESHOOTING:
   • Se as cores parecerem muito fortes, reduza Saturation para 0.85
   • Se os pretos estiverem lavados, reduza Lift Master
   • Se os brancos estiverem estourados, reduza Gain Master

═══════════════════════════════════════════════════════════════════════════════
  Gerado automaticamente pelo Viral Visions Pro • ${new Date().toLocaleDateString('pt-BR')}
═══════════════════════════════════════════════════════════════════════════════
`;

  return instructions;
};

/**
 * Gera instruções de efeitos cinematográficos (independente de Color Grading)
 * Usado quando há efeitos selecionados mas colorGrading é neutro
 */
export const generateCinematicEffectsInstructions = (settings: CinematicSettings): string | null => {
  // Só gerar se houver algum efeito ativo
  const hasEffects = settings.addVignette || settings.letterbox || settings.fadeInOut || settings.kenBurnsEffect;
  if (!hasEffects) return null;
  
  let instructions = `
╔══════════════════════════════════════════════════════════════════════════════╗
║               INSTRUÇÕES DE EFEITOS CINEMATOGRÁFICOS - DAVINCI RESOLVE        ║
╚══════════════════════════════════════════════════════════════════════════════╝

📋 CONFIGURAÇÕES DO PROJETO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  🎬 FPS:           ${settings.fps}
  📐 Aspect Ratio:  ${settings.aspectRatio}
  🔄 Transição:     ${TRANSITION_OPTIONS.find(t => t.id === settings.transitionType)?.name} (${settings.transitionDuration}s)
  
  Efeitos Selecionados:
  ${settings.fadeInOut ? '  ✅ Fade In/Out' : '  ⬜ Fade In/Out'}
  ${settings.kenBurnsEffect ? '  ✅ Ken Burns Effect (keyframes automáticos via XML!)' : '  ⬜ Ken Burns Effect'}
  ${settings.addVignette ? '  ✅ Vignette (Vinheta)' : '  ⬜ Vignette'}
  ${settings.letterbox ? '  ✅ Letterbox (Barras Cinema)' : '  ⬜ Letterbox'}

═══════════════════════════════════════════════════════════════════════════════
                         COMO APLICAR OS EFEITOS
═══════════════════════════════════════════════════════════════════════════════
`;

  if (settings.addVignette) {
    instructions += `
🔲 VIGNETTE (Vinheta):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   1. Vá para a aba "Color" (ícone de pincel colorido)
   2. Crie um novo node (Alt+S) para a vinheta
   3. Vá para "Window" → "Vignette"
   4. Configurações recomendadas:
      • Inner Radius: 0.75
      • Outer Radius: 0.95
      • Roundness: 0.7
      • Soft Edge: 0.8
   5. Reduza o Gain Master desse node para 0.85
   
   💡 DICA: Aplique a vinheta em TODOS os clips selecionando-os juntos

`;
  }

  if (settings.kenBurnsEffect) {
    instructions += `
📷 KEN BURNS EFFECT (Movimento de Câmera):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   ✅ KEYFRAMES JÁ INCLUÍDOS NO XML!
   
   A IA analisou cada cena e aplicou movimentos automáticos:
   • Zoom In/Out baseado no conteúdo emocional
   • Pan Left/Right para cenas com movimento
   • Intensidades variadas (subtle, normal, dramatic)
   
   Consulte o arquivo KEN_BURNS_MOVIMENTOS.txt para detalhes de cada cena.
   
   Para ajustar manualmente:
   1. Na aba "Edit", selecione o clip
   2. Vá para "Inspector" → "Transform"
   3. Modifique os keyframes existentes conforme necessário

`;
  }

  if (settings.letterbox) {
    instructions += `
🎬 LETTERBOX (Barras Cinematográficas):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Método 1 - Blanking Fill (Recomendado):
   1. Em "Effects Library" → "Open FX" → busque "Blanking Fill"
   2. Arraste para a timeline sobre todos os clips
   3. Ajuste o aspect ratio para ${settings.aspectRatio}
   
   Método 2 - Manual:
   1. Adicione um "Solid Color" preto em uma track acima
   2. Faça crop para criar as barras
   3. Tamanhos para ${settings.aspectRatio} em 1080p:
      ${settings.aspectRatio === '2.35:1' ? '• Barras de 132px em cima e embaixo' : ''}
      ${settings.aspectRatio === '2.39:1' ? '• Barras de 138px em cima e embaixo' : ''}
      ${settings.aspectRatio === '1.85:1' ? '• Barras de 21px em cima e embaixo' : ''}
      ${settings.aspectRatio === '16:9' ? '• Sem barras necessárias (nativo)' : ''}

`;
  }

  if (settings.fadeInOut) {
    instructions += `
🌅 FADE IN/OUT:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Fade In (Início do vídeo):
   1. Selecione o PRIMEIRO clip da timeline
   2. Clique direito → "Add Transition" → "Cross Dissolve"
   3. Posicione a transição no INÍCIO do clip
   4. Ajuste duração para 1-2 segundos
   
   Fade Out (Final do vídeo):
   1. Selecione o ÚLTIMO clip da timeline
   2. Clique direito → "Add Transition" → "Cross Dissolve"
   3. Posicione a transição no FINAL do clip
   4. Ajuste duração para 1-2 segundos
   
   💡 ALTERNATIVA: Use "Dip to Color Dissolve" (preto) para efeito mais dramático

`;
  }

  instructions += `
═══════════════════════════════════════════════════════════════════════════════
                            ORDEM DE APLICAÇÃO
═══════════════════════════════════════════════════════════════════════════════

   1. ✅ Importe o XML e reconecte as mídias
   2. ✅ Aplique os fades de entrada/saída
   3. ✅ Adicione letterbox (se desejado)
   4. ✅ Na aba Color, aplique a vinheta em um node dedicado
   5. ✅ Ajuste keyframes de Ken Burns se necessário
   6. ✅ Exporte em H.264 para YouTube (15-25 Mbps)

Gerado automaticamente por Viral Video AI
`;

  return instructions;
};

/**
 * FPS options
 */
export type FpsOption = 24 | 25 | 30 | 60;

export interface FpsOptionConfig {
  value: FpsOption;
  name: string;
  description: string;
}

export const FPS_OPTIONS: FpsOptionConfig[] = [
  { value: 24, name: '24 fps', description: 'Cinema (padrão Netflix/Hollywood)' },
  { value: 25, name: '25 fps', description: 'PAL (Europa/Brasil broadcast)' },
  { value: 30, name: '30 fps', description: 'NTSC (YouTube otimizado)' },
  { value: 60, name: '60 fps', description: 'Alta fluidez (gaming/esportes)' },
];

/**
 * Configurações cinematográficas completas
 */
export interface CinematicSettings {
  transitionType: TransitionType;
  transitionDuration: TransitionDuration;
  aspectRatio: AspectRatio;
  colorGrading: ColorGrading;
  fps: FpsOption;
  fadeInOut: boolean; // Fade in no início e fade out no final
  addVignette: boolean; // Adicionar vinheta cinematográfica
  kenBurnsEffect: boolean; // Efeito de movimento suave nas imagens
  letterbox: boolean; // Adicionar barras pretas para aspect ratio
}

export const DEFAULT_CINEMATIC_SETTINGS: CinematicSettings = {
  transitionType: 'cross_dissolve',
  transitionDuration: 0.5,
  aspectRatio: '16:9',
  colorGrading: 'neutral',
  fps: 24,
  fadeInOut: true,
  addVignette: false,
  kenBurnsEffect: true,
  letterbox: false,
};

/**
 * Presets cinematográficos para diferentes gêneros de vídeo
 */
export type CinematicPreset = 'custom' | 'documentary' | 'action' | 'drama' | 'horror' | 'comedy';

export interface CinematicPresetOption {
  id: CinematicPreset;
  name: string;
  icon: string;
  description: string;
  settings: CinematicSettings;
}

export const CINEMATIC_PRESETS: CinematicPresetOption[] = [
  {
    id: 'custom',
    name: 'Personalizado',
    icon: '⚙️',
    description: 'Configure cada opção manualmente',
    settings: DEFAULT_CINEMATIC_SETTINGS,
  },
  {
    id: 'documentary',
    name: 'Documentário',
    icon: '🎥',
    description: 'Ken Burns suave, cores naturais, transições lentas',
    settings: {
      transitionType: 'cross_dissolve',
      transitionDuration: 1,
      aspectRatio: '16:9',
      colorGrading: 'neutral',
      fps: 24,
      fadeInOut: true,
      addVignette: false,
      kenBurnsEffect: true,
      letterbox: false,
    },
  },
  {
    id: 'action',
    name: 'Ação',
    icon: '💥',
    description: 'Cortes rápidos, alto contraste, ritmo intenso',
    settings: {
      transitionType: 'push',
      transitionDuration: 0.25,
      aspectRatio: '2.39:1',
      colorGrading: 'teal_orange',
      fps: 30,
      fadeInOut: false,
      addVignette: true,
      kenBurnsEffect: true,
      letterbox: true,
    },
  },
  {
    id: 'drama',
    name: 'Drama',
    icon: '🎭',
    description: 'Tons quentes, vinheta profunda, cinematográfico',
    settings: {
      transitionType: 'fade_to_black',
      transitionDuration: 1,
      aspectRatio: '2.35:1',
      colorGrading: 'cinematic_warm',
      fps: 24,
      fadeInOut: true,
      addVignette: true,
      kenBurnsEffect: true,
      letterbox: true,
    },
  },
  {
    id: 'horror',
    name: 'Terror/Suspense',
    icon: '👻',
    description: 'Tons frios, alto contraste, atmosfera tensa',
    settings: {
      transitionType: 'dip_to_color',
      transitionDuration: 0.5,
      aspectRatio: '2.35:1',
      colorGrading: 'cinematic_cool',
      fps: 24,
      fadeInOut: true,
      addVignette: true,
      kenBurnsEffect: true,
      letterbox: true,
    },
  },
  {
    id: 'comedy',
    name: 'Comédia/Leve',
    icon: '😄',
    description: 'Cores vibrantes, transições suaves, sem barras',
    settings: {
      transitionType: 'cross_dissolve',
      transitionDuration: 0.5,
      aspectRatio: '16:9',
      colorGrading: 'neutral',
      fps: 30,
      fadeInOut: true,
      addVignette: false,
      kenBurnsEffect: true,
      letterbox: false,
    },
  },
];

/**
 * Converte segundos para frames
 */
const secondsToFrames = (seconds: number, fps: number): number => {
  return Math.round(seconds * fps);
};

/**
 * Escapa caracteres XML
 */
const escapeXml = (text: string): string => {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
};

/**
 * Gera o XML da transição baseado no tipo
 */
const getTransitionXml = (transitionType: TransitionType, transitionFrames: number): string => {
  if (transitionType === 'none') return '';
  
  const transitionConfigs: Record<Exclude<TransitionType, 'none'>, { name: string; effectId: string; category: string }> = {
    cross_dissolve: { name: 'Cross Dissolve', effectId: 'Cross Dissolve', category: 'Dissolve' },
    fade_to_black: { name: 'Fade In/Fade Out Dissolve', effectId: 'Fade In/Fade Out Dissolve', category: 'Dissolve' },
    dip_to_color: { name: 'Dip to Color Dissolve', effectId: 'Dip to Color Dissolve', category: 'Dissolve' },
    wipe: { name: 'Wipe', effectId: 'Wipe', category: 'Wipe' },
    push: { name: 'Push', effectId: 'Push', category: 'Wipe' },
  };
  
  const config = transitionConfigs[transitionType];
  
  return `                <transitionitem>
                  <start>0</start>
                  <end>${transitionFrames}</end>
                  <alignment>start-black</alignment>
                  <effect>
                    <name>${config.name}</name>
                    <effectid>${config.effectId}</effectid>
                    <effectcategory>${config.category}</effectcategory>
                    <effecttype>transition</effecttype>
                    <mediatype>video</mediatype>
                  </effect>
                </transitionitem>
`;
}

/**
 * Gera XML no formato FCP7 para DaVinci Resolve
 * Este formato tem melhor suporte para reconexão de mídias
 */
export const generateFcp7Xml = (
  scenes: SceneForXml[],
  options: {
    title?: string;
    fps?: number;
    width?: number;
    height?: number;
  } = {}
): string => {
  const title = options.title || 'Projeto_Video';
  const fps = options.fps || 24;
  const width = options.width || 1920;
  const height = options.height || 1080;
  const safeTitle = escapeXml(title.replace(/[^a-zA-Z0-9_-]/g, '_'));
  
  // Calcular duração total em frames
  const totalDurationFrames = scenes.reduce(
    (acc, scene) => acc + secondsToFrames(scene.durationSeconds, fps),
    0
  );
  
  // Gerar ID único para o projeto
  const projectId = `project-${Date.now()}`;
  const sequenceId = `sequence-${Date.now()}`;
  
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE xmeml>
<xmeml version="5">
  <project>
    <name>${safeTitle}</name>
    <children>
      <sequence id="${sequenceId}">
        <uuid>${crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`}</uuid>
        <name>${safeTitle}</name>
        <duration>${totalDurationFrames}</duration>
        <rate>
          <timebase>${fps}</timebase>
          <ntsc>FALSE</ntsc>
        </rate>
        <timecode>
          <rate>
            <timebase>${fps}</timebase>
            <ntsc>FALSE</ntsc>
          </rate>
          <string>00:00:00:00</string>
          <frame>0</frame>
          <displayformat>NDF</displayformat>
        </timecode>
        <in>-1</in>
        <out>-1</out>
        <media>
          <video>
            <format>
              <samplecharacteristics>
                <width>${width}</width>
                <height>${height}</height>
                <anamorphic>FALSE</anamorphic>
                <pixelaspectratio>square</pixelaspectratio>
                <fielddominance>none</fielddominance>
                <rate>
                  <timebase>${fps}</timebase>
                  <ntsc>FALSE</ntsc>
                </rate>
                <colordepth>24</colordepth>
                <codec>
                  <name>Apple ProRes 422</name>
                  <appspecificdata>
                    <appname>Final Cut Pro</appname>
                    <appmanufacturer>Apple Inc.</appmanufacturer>
                    <data>
                      <qtcodec/>
                    </data>
                  </appspecificdata>
                </codec>
              </samplecharacteristics>
            </format>
            <track>
`;

  let currentFrame = 0;
  
  scenes.forEach((scene, index) => {
    const durationFrames = secondsToFrames(scene.durationSeconds, fps);
    const fileName = `cena_${String(scene.number).padStart(3, '0')}.jpg`;
    const clipId = `clip-${scene.number}`;
    const fileId = `file-${scene.number}`;
    const masterId = `master-${scene.number}`;
    const shortText = scene.text ? escapeXml(scene.text.substring(0, 100)) : '';
    
    xml += `              <clipitem id="${clipId}">
                <name>${fileName}</name>
                <duration>${durationFrames}</duration>
                <rate>
                  <timebase>${fps}</timebase>
                  <ntsc>FALSE</ntsc>
                </rate>
                <start>${currentFrame}</start>
                <end>${currentFrame + durationFrames}</end>
                <in>0</in>
                <out>${durationFrames}</out>
                <masterclipid>${masterId}</masterclipid>
                <file id="${fileId}">
                  <name>${fileName}</name>
                  <pathurl>file://./${fileName}</pathurl>
                  <rate>
                    <timebase>${fps}</timebase>
                    <ntsc>FALSE</ntsc>
                  </rate>
                  <duration>${durationFrames}</duration>
                  <timecode>
                    <rate>
                      <timebase>${fps}</timebase>
                      <ntsc>FALSE</ntsc>
                    </rate>
                    <string>00:00:00:00</string>
                    <frame>0</frame>
                    <displayformat>NDF</displayformat>
                  </timecode>
                  <media>
                    <video>
                      <samplecharacteristics>
                        <width>${width}</width>
                        <height>${height}</height>
                      </samplecharacteristics>
                    </video>
                  </media>
                </file>
                <sourcetrack>
                  <mediatype>video</mediatype>
                  <trackindex>1</trackindex>
                </sourcetrack>
`;
    
    // Adicionar comentário com texto da cena
    if (shortText) {
      xml += `                <comments>
                  <mastercomment1>${shortText}</mastercomment1>
                </comments>
`;
    }
    
    xml += `              </clipitem>
`;
    
    currentFrame += durationFrames;
  });

  xml += `            </track>
          </video>
        </media>
      </sequence>
    </children>
  </project>
</xmeml>`;

  return xml;
};

/**
 * Gera XML com transições entre cenas e keyframes Ken Burns opcionais
 */
export const generateFcp7XmlWithTransitions = (
  scenes: SceneForXml[],
  options: {
    title?: string;
    fps?: number;
    width?: number;
    height?: number;
    transitionFrames?: number;
    transitionType?: TransitionType;
    enableKenBurns?: boolean;
  } = {}
): string => {
  const title = options.title || 'Projeto_Video';
  const fps = options.fps || 24;
  const width = options.width || 1920;
  const height = options.height || 1080;
  const transitionFrames = options.transitionFrames || Math.round(fps * 0.5);
  const transitionType = options.transitionType || 'cross_dissolve';
  const enableKenBurns = options.enableKenBurns !== false; // Habilitado por padrão
  const safeTitle = escapeXml(title.replace(/[^a-zA-Z0-9_-]/g, '_'));
  
  // Aplicar análise Ken Burns se habilitado
  const processedScenes = enableKenBurns ? applyKenBurnsToScenes(scenes) : scenes;
  
  // Calcular duração total em frames
  const totalDurationFrames = processedScenes.reduce(
    (acc, scene) => acc + secondsToFrames(scene.durationSeconds, fps),
    0
  );
  
  const sequenceId = `sequence-${Date.now()}`;
  
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE xmeml>
<xmeml version="5">
  <project>
    <name>${safeTitle}</name>
    <children>
      <sequence id="${sequenceId}">
        <uuid>${crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`}</uuid>
        <name>${safeTitle}</name>
        <duration>${totalDurationFrames}</duration>
        <rate>
          <timebase>${fps}</timebase>
          <ntsc>FALSE</ntsc>
        </rate>
        <timecode>
          <rate>
            <timebase>${fps}</timebase>
            <ntsc>FALSE</ntsc>
          </rate>
          <string>00:00:00:00</string>
          <frame>0</frame>
          <displayformat>NDF</displayformat>
        </timecode>
        <in>-1</in>
        <out>-1</out>
        <media>
          <video>
            <format>
              <samplecharacteristics>
                <width>${width}</width>
                <height>${height}</height>
                <anamorphic>FALSE</anamorphic>
                <pixelaspectratio>square</pixelaspectratio>
                <fielddominance>none</fielddominance>
                <rate>
                  <timebase>${fps}</timebase>
                  <ntsc>FALSE</ntsc>
                </rate>
                <colordepth>24</colordepth>
              </samplecharacteristics>
            </format>
            <track>
`;

  let currentFrame = 0;
  
  processedScenes.forEach((scene, index) => {
    const durationFrames = secondsToFrames(scene.durationSeconds, fps);
    const fileName = `cena_${String(scene.number).padStart(3, '0')}.jpg`;
    const clipId = `clip-${scene.number}`;
    const fileId = `file-${scene.number}`;
    const masterId = `master-${scene.number}`;
    const shortText = scene.text ? escapeXml(scene.text.substring(0, 100)) : '';
    const motionInfo = scene.kenBurnsMotion ? ` [${KEN_BURNS_OPTIONS.find(o => o.id === scene.kenBurnsMotion?.type)?.name || scene.kenBurnsMotion.type}]` : '';
    
    xml += `              <clipitem id="${clipId}">
                <name>${fileName}</name>
                <duration>${durationFrames}</duration>
                <rate>
                  <timebase>${fps}</timebase>
                  <ntsc>FALSE</ntsc>
                </rate>
                <start>${currentFrame}</start>
                <end>${currentFrame + durationFrames}</end>
                <in>0</in>
                <out>${durationFrames}</out>
                <masterclipid>${masterId}</masterclipid>
                <file id="${fileId}">
                  <name>${fileName}</name>
                  <pathurl>file://./${fileName}</pathurl>
                  <rate>
                    <timebase>${fps}</timebase>
                    <ntsc>FALSE</ntsc>
                  </rate>
                  <duration>${durationFrames}</duration>
                  <media>
                    <video>
                      <samplecharacteristics>
                        <width>${width}</width>
                        <height>${height}</height>
                      </samplecharacteristics>
                    </video>
                  </media>
                </file>
`;
    
    // Adicionar transição de entrada (exceto para o primeiro clip)
    if (index > 0 && transitionType !== 'none') {
      xml += getTransitionXml(transitionType, transitionFrames);
    }
    
    // Adicionar keyframes Ken Burns se disponível
    if (enableKenBurns && scene.kenBurnsMotion) {
      xml += generateKenBurnsKeyframesXml(scene.kenBurnsMotion, durationFrames, fps);
    }
    
    if (shortText) {
      xml += `                <comments>
                  <mastercomment1>${escapeXml(shortText + motionInfo)}</mastercomment1>
                </comments>
`;
    }
    
    xml += `              </clipitem>
`;
    
    currentFrame += durationFrames;
  });

  xml += `            </track>
          </video>
        </media>
      </sequence>
    </children>
  </project>
</xmeml>`;

  return xml;
};

/**
 * Gera relatório de movimentos Ken Burns aplicados
 */
export const generateKenBurnsReport = (scenes: SceneForXml[]): string => {
  const processedScenes = applyKenBurnsToScenes(scenes);
  
  let report = `
╔══════════════════════════════════════════════════════════════════════════════╗
║                    RELATÓRIO DE MOVIMENTOS KEN BURNS                          ║
║                          Análise Automática por IA                            ║
╚══════════════════════════════════════════════════════════════════════════════╝

📊 RESUMO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total de Cenas: ${scenes.length}
`;

  // Contagem por tipo de movimento
  const motionCounts: Record<string, number> = {};
  processedScenes.forEach(scene => {
    const type = scene.kenBurnsMotion?.type || 'static';
    motionCounts[type] = (motionCounts[type] || 0) + 1;
  });

  report += `\n📈 DISTRIBUIÇÃO DE MOVIMENTOS:\n`;
  Object.entries(motionCounts).forEach(([type, count]) => {
    const option = KEN_BURNS_OPTIONS.find(o => o.id === type);
    const percentage = ((count / scenes.length) * 100).toFixed(1);
    report += `   ${option?.icon || '❓'} ${option?.name || type}: ${count} cenas (${percentage}%)\n`;
  });

  report += `
═══════════════════════════════════════════════════════════════════════════════
                              DETALHES POR CENA
═══════════════════════════════════════════════════════════════════════════════
`;

  processedScenes.forEach((scene, index) => {
    const motion = scene.kenBurnsMotion;
    const option = motion ? KEN_BURNS_OPTIONS.find(o => o.id === motion.type) : null;
    const textPreview = scene.text.substring(0, 60) + (scene.text.length > 60 ? '...' : '');
    
    report += `
┌─────────────────────────────────────────────────────────────────────────────┐
│ CENA ${String(scene.number).padStart(3, '0')} │ ${scene.durationSeconds.toFixed(1)}s │ ${option?.icon || '⏸️'} ${option?.name || 'Estático'}
├─────────────────────────────────────────────────────────────────────────────┤
│ Texto: "${textPreview}"
│ Intensidade: ${motion?.intensity || 'N/A'}
│ Razão: ${motion?.reason || 'Sem análise'}
└─────────────────────────────────────────────────────────────────────────────┘`;
  });

  report += `

═══════════════════════════════════════════════════════════════════════════════
                              DICAS DE APLICAÇÃO
═══════════════════════════════════════════════════════════════════════════════

💡 COMO AJUSTAR NO DAVINCI RESOLVE:
   1. Importe o XML que já contém os keyframes
   2. Na aba "Edit", selecione o clip
   3. Vá para "Inspector" → "Transform"
   4. Os keyframes já estarão aplicados automaticamente
   5. Use "Ease In/Out" para suavizar os movimentos

🎬 PARA MOVIMENTOS MAIS DRAMÁTICOS:
   1. Selecione o clip na timeline
   2. Abra "Keyframe Editor" (clique no ícone de diamante)
   3. Ajuste a curva de interpolação para "Bezier"
   4. Modifique os valores de Scale e Position

⚠️ NOTA: Os keyframes foram calculados para:
   - Zoom: 8% de variação (ajustável para mais intensidade)
   - Pan: 10% de deslocamento (ajustável conforme necessidade)
   - Intensidade varia por cena baseado na análise do texto

═══════════════════════════════════════════════════════════════════════════════
  Gerado automaticamente pelo Viral Visions Pro • ${new Date().toLocaleDateString('pt-BR')}
═══════════════════════════════════════════════════════════════════════════════
`;

  return report;
};

/**
 * Calcula a duração total do projeto
 */
export const calculateXmlDuration = (scenes: SceneForXml[]): number => {
  return scenes.reduce((total, scene) => total + scene.durationSeconds, 0);
};

/**
 * Gera tutorial de como usar o XML no DaVinci Resolve
 */
export const generateXmlTutorial = (
  scenes: SceneForXml[],
  projectTitle: string = 'MEU_PROJETO'
): string => {
  const totalScenes = scenes.length;
  const totalDuration = calculateXmlDuration(scenes);
  const minutes = Math.floor(totalDuration / 60);
  const seconds = Math.round(totalDuration % 60);

  // Lista de arquivos de mídia esperados - nomes EXATOS que devem ser usados
  const mediaFiles = scenes.map((scene, index) => {
    const fileName = `cena_${String(scene.number).padStart(3, '0')}.jpg`;
    return `   ${index + 1}. ${fileName}`;
  }).join('\n');

  return `
================================================================================
                    TUTORIAL: IMPORTAR XML NO DAVINCI RESOLVE
================================================================================

Projeto: ${projectTitle.toUpperCase()}
Total de Cenas: ${totalScenes}
Duração Estimada: ${minutes}m ${seconds}s

================================================================================
                              PASSO A PASSO
================================================================================

📁 PASSO 1: PREPARAR AS MÍDIAS
-------------------------------
Crie uma pasta no seu computador e coloque TODAS as imagens das cenas.

Arquivos necessários (na ordem):
${mediaFiles}

⚠️ IMPORTANTE: 
   - Os nomes dos arquivos DEVEM ser EXATAMENTE como listados acima!
   - Use underline (_) e não hífen (-)
   - Use 3 dígitos: cena_001.jpg, cena_002.jpg, etc.
   - Extensão .jpg (minúsculo)
   - Coloque o arquivo XML na MESMA PASTA das imagens!


📂 PASSO 2: IMPORTAR MÍDIAS NO DAVINCI RESOLVE
-----------------------------------------------
1. Abra o DaVinci Resolve
2. Crie um novo projeto ou abra um existente
3. Vá para a aba "Media" (canto inferior esquerdo)
4. Navegue até a pasta onde salvou as imagens
5. Selecione todas as mídias e arraste para o Media Pool


⚙️ PASSO 3: CONFIGURAR O PROJETO
----------------------------------
1. Clique em File → Project Settings (Shift+9)
2. Em "Master Settings", configure:
   - Timeline Resolution: 1920x1080 (ou sua preferência)
   - Timeline Frame Rate: 24 fps (mesmo FPS do XML)
   - Playback Frame Rate: 24 fps
3. Clique em "Save"


📥 PASSO 4: IMPORTAR O ARQUIVO XML
-----------------------------------
1. Vá para File → Import → Timeline...
2. Selecione o arquivo .xml que você baixou
3. Na janela "Load Settings":
   - Marque "Automatically import source clips into media pool"
   - Selecione "Link and import existing files"
4. Clique em "OK"

💡 DICA: Se o XML estiver na mesma pasta das imagens, o DaVinci
   reconecta automaticamente todas as mídias!


🔗 PASSO 5: RECONECTAR MÍDIAS (SE NECESSÁRIO)
----------------------------------------------
Se as mídias aparecerem offline (ícone vermelho):

1. Na timeline, selecione todos os clipes (Ctrl+A)
2. Clique com botão direito
3. Selecione "Relink Selected Clips..."
4. Navegue até a pasta onde estão suas mídias
5. Clique em "OK" - O DaVinci irá reconectar pelos nomes


✅ PASSO 6: VERIFICAR E AJUSTAR
--------------------------------
1. Verifique se todas as cenas estão na ordem correta
2. Cada imagem deve ter a duração correta conforme o roteiro
3. As transições Cross Dissolve já estão aplicadas


================================================================================
                              VANTAGENS DO XML
================================================================================

✓ Melhor reconexão de mídias que o EDL
✓ Preserva transições (Cross Dissolve)
✓ Inclui comentários/textos das cenas
✓ Compatível com DaVinci, Premiere, Final Cut
✓ Mantém metadados do projeto


================================================================================
                              DICAS EXTRAS
================================================================================

🎬 ADICIONAR NARRAÇÃO:
   - Importe seu arquivo de áudio para o Media Pool
   - Arraste para a track de áudio abaixo do vídeo
   - Use a sincronização de WPM definida no projeto

🎨 APLICAR EFEITO KEN BURNS:
   - Selecione um clipe na timeline
   - Vá para Inspector → Transform
   - Use keyframes em Position e Zoom para criar movimento

📝 ADICIONAR LEGENDAS:
   - Importe o arquivo .srt gerado
   - File → Import → Subtitle...
   - As legendas serão sincronizadas automaticamente

🎵 ADICIONAR TRILHA SONORA:
   - Importe a música para o Media Pool
   - Arraste para uma track de áudio separada
   - Ajuste o volume para não competir com a narração


================================================================================
                           RESOLUÇÃO DE PROBLEMAS
================================================================================

❌ "Media Offline":
   → Coloque o XML na mesma pasta das imagens
   → Use "Relink Clips" para reconectar manualmente

❌ "Wrong frame rate":
   → Ajuste o frame rate do projeto para 24fps
   → Reimporte o XML

❌ "Clips too short/long":
   → O XML define duração exata
   → Imagens são automaticamente estendidas para a duração definida

❌ "Import Failed":
   → Verifique se o XML não está corrompido
   → Tente importar via Media Pool arrastando o arquivo


================================================================================
                              EXPORTAÇÃO FINAL
================================================================================

Quando a edição estiver pronta:

1. Vá para a aba "Deliver"
2. Escolha um preset (YouTube, Vimeo, etc.) ou configure:
   - Format: MP4
   - Codec: H.264 ou H.265
   - Resolution: 1920x1080
   - Frame Rate: 24fps
3. Defina o local de saída
4. Clique em "Add to Render Queue"
5. Clique em "Render All"


================================================================================
              Gerado automaticamente | ${new Date().toLocaleDateString('pt-BR')}
================================================================================
`;
};

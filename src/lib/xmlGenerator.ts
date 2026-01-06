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
}

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
 * Gera XML com transições entre cenas
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
  } = {}
): string => {
  const title = options.title || 'Projeto_Video';
  const fps = options.fps || 24;
  const width = options.width || 1920;
  const height = options.height || 1080;
  const transitionFrames = options.transitionFrames || Math.round(fps * 0.5); // 0.5s por padrão
  const transitionType = options.transitionType || 'cross_dissolve';
  const safeTitle = escapeXml(title.replace(/[^a-zA-Z0-9_-]/g, '_'));
  
  // Calcular duração total em frames
  const totalDurationFrames = scenes.reduce(
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

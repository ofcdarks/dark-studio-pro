// Mapeamento de tipos de operação para nomes legíveis das ferramentas
export const CREDIT_TOOLS_MAP: Record<string, { name: string; icon: string; description: string }> = {
  // Análise de Títulos
  'title_analysis': { 
    name: 'Análise de Títulos', 
    icon: '📊', 
    description: 'Análise de título de vídeo com IA' 
  },
  'analyze_titles': { 
    name: 'Análise de Títulos', 
    icon: '📊', 
    description: 'Análise de título de vídeo com IA' 
  },
  
  // Gerador de Thumbnails
  'thumbnail_generation': { 
    name: 'Gerador de Thumbnails', 
    icon: '🖼️', 
    description: 'Geração de thumbnail com IA' 
  },
  'generate_thumbnail': { 
    name: 'Gerador de Thumbnails', 
    icon: '🖼️', 
    description: 'Geração de thumbnail com IA' 
  },
  
  // Gerador de Scripts
  'script_generation': { 
    name: 'Gerador de Scripts', 
    icon: '📝', 
    description: 'Geração de roteiro para vídeo' 
  },
  'generate_script': { 
    name: 'Gerador de Scripts', 
    icon: '📝', 
    description: 'Geração de roteiro para vídeo' 
  },
  
  // Gerador de Cenas
  'scene_generation': { 
    name: 'Gerador de Cenas', 
    icon: '🎬', 
    description: 'Geração de descrição de cenas' 
  },
  'generate_scenes': { 
    name: 'Gerador de Cenas', 
    icon: '🎬', 
    description: 'Geração de descrição de cenas' 
  },
  
  // Gerador de Voz (TTS)
  'voice_generation': { 
    name: 'Gerador de Voz', 
    icon: '🎙️', 
    description: 'Conversão de texto para áudio (TTS)' 
  },
  'generate_tts': { 
    name: 'Gerador de Voz', 
    icon: '🎙️', 
    description: 'Conversão de texto para áudio (TTS)' 
  },
  'tts': { 
    name: 'Gerador de Voz', 
    icon: '🎙️', 
    description: 'Conversão de texto para áudio (TTS)' 
  },
  
  // Gerador de Imagens
  'image_generation': { 
    name: 'Gerador de Imagens', 
    icon: '🎨', 
    description: 'Geração de imagem com IA' 
  },
  'generate_image': { 
    name: 'Gerador de Imagens', 
    icon: '🎨', 
    description: 'Geração de imagem com IA' 
  },
  
  // Transcrição de Vídeo
  'transcription': { 
    name: 'Transcrição de Vídeo', 
    icon: '📃', 
    description: 'Transcrição automática de vídeo' 
  },
  'transcribe_video': { 
    name: 'Transcrição de Vídeo', 
    icon: '📃', 
    description: 'Transcrição automática de vídeo' 
  },
  
  // Análise de Canal
  'channel_analysis': { 
    name: 'Análise de Canal', 
    icon: '📺', 
    description: 'Análise completa de canal do YouTube' 
  },
  'analyze_channel': { 
    name: 'Análise de Canal', 
    icon: '📺', 
    description: 'Análise completa de canal do YouTube' 
  },
  
  // Análise de Transcrição
  'transcript_analysis': { 
    name: 'Análise de Transcrição', 
    icon: '📄', 
    description: 'Análise de transcrição com IA' 
  },
  'analyze_transcript': { 
    name: 'Análise de Transcrição', 
    icon: '📄', 
    description: 'Análise de transcrição com IA' 
  },
  
  // Assistente IA
  'ai_assistant': { 
    name: 'Assistente IA', 
    icon: '🤖', 
    description: 'Consulta ao assistente de IA' 
  },
  
  // Imagens em Lote
  'batch_images': { 
    name: 'Imagens em Lote', 
    icon: '🖼️', 
    description: 'Geração de múltiplas imagens' 
  },
  
  // Gerador de Vídeo
  'video_generation': { 
    name: 'Gerador de Vídeo', 
    icon: '🎥', 
    description: 'Geração de vídeo com IA' 
  },
  
  // Transações administrativas
  'add': { 
    name: 'Adição de Créditos', 
    icon: '➕', 
    description: 'Créditos adicionados manualmente ou por compra' 
  },
  'deduct': { 
    name: 'Dedução de Créditos', 
    icon: '➖', 
    description: 'Créditos deduzidos' 
  },
  'purchase': { 
    name: 'Compra de Créditos', 
    icon: '💳', 
    description: 'Compra de pacote de créditos' 
  },
  'bonus': { 
    name: 'Bônus de Créditos', 
    icon: '🎁', 
    description: 'Créditos de bônus' 
  },
  'subscription': { 
    name: 'Créditos de Assinatura', 
    icon: '⭐', 
    description: 'Créditos mensais do plano' 
  },
};

// Custos padrão por ferramenta (em créditos)
export const CREDIT_COSTS: Record<string, number> = {
  // Análise de Títulos - 1 crédito por análise
  'title_analysis': 1,
  'analyze_titles': 1,
  
  // Gerador de Thumbnails - 5 créditos por thumbnail
  'thumbnail_generation': 5,
  'generate_thumbnail': 5,
  
  // Gerador de Scripts - 2 créditos por minuto
  'script_generation': 2, // base, multiplicado pela duração
  'generate_script': 2,
  
  // Gerador de Cenas - 3 créditos por cena
  'scene_generation': 3,
  'generate_scenes': 3,
  
  // Gerador de Voz (TTS) - 1 crédito por 100 caracteres
  'voice_generation': 1,
  'generate_tts': 1,
  'tts': 1,
  
  // Gerador de Imagens - 5 créditos por imagem
  'image_generation': 5,
  'generate_image': 5,
  
  // Transcrição de Vídeo - 2 créditos por minuto
  'transcription': 2,
  'transcribe_video': 2,
  
  // Análise de Canal - 3 créditos por análise
  'channel_analysis': 3,
  'analyze_channel': 3,
  
  // Análise de Transcrição - 2 créditos por análise
  'transcript_analysis': 2,
  'analyze_transcript': 2,
  
  // Assistente IA - 1 crédito por consulta
  'ai_assistant': 1,
  
  // Imagens em Lote - 4 créditos por imagem
  'batch_images': 4,
  
  // Gerador de Vídeo - 10 créditos por vídeo
  'video_generation': 10,
};

export function getToolInfo(operationType: string): { name: string; icon: string; description: string } {
  return CREDIT_TOOLS_MAP[operationType] || { 
    name: operationType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), 
    icon: '🔧', 
    description: 'Operação na plataforma' 
  };
}

export function getToolCost(operationType: string): number {
  return CREDIT_COSTS[operationType] || 1;
}

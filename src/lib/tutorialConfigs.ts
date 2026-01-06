import type { TutorialStep } from "@/hooks/useTutorial";

export interface TutorialConfig {
  id: string;
  title: string;
  description: string;
  steps: TutorialStep[];
}

// Tutorial: Prompts para Cenas
export const PROMPTS_IMAGES_TUTORIAL: TutorialConfig = {
  id: "prompts-images",
  title: "Gerador de Cenas",
  description: "Aprenda a criar prompts visuais profissionais",
  steps: [
    {
      title: "Cole seu Roteiro",
      description: "Comece colando o texto do seu roteiro no campo principal. O sistema analisará automaticamente o conteúdo para gerar prompts de imagem para cada cena.",
      icon: "📝",
    },
    {
      title: "Configure o Estilo Visual",
      description: "Escolha o modelo de IA, estilo visual (cinematográfico, fotorealista, etc.) e defina quantas palavras por cena para controlar o ritmo do vídeo.",
      icon: "🎨",
    },
    {
      title: "Gere os Prompts",
      description: "Clique em 'Gerar Prompts' e aguarde a IA criar prompts detalhados para cada cena. Você pode editar qualquer prompt individualmente depois.",
      icon: "✨",
    },
    {
      title: "Gere as Imagens",
      description: "Use o botão 'Gerar Imagens' para criar todas as imagens automaticamente em background. Você pode navegar para outras páginas enquanto gera!",
      icon: "🖼️",
    },
    {
      title: "Exporte para Edição",
      description: "Baixe o pacote ZIP com XML, imagens e guia de produção para importar diretamente no DaVinci Resolve ou outro editor profissional.",
      icon: "📦",
    },
  ],
};

// Tutorial: Analisador de Vídeos
export const VIDEO_ANALYZER_TUTORIAL: TutorialConfig = {
  id: "video-analyzer",
  title: "Analisador de Vídeos",
  description: "Descubra os segredos de vídeos virais",
  steps: [
    {
      title: "Cole a URL do Vídeo",
      description: "Insira o link de qualquer vídeo do YouTube que você quer analisar. Pode ser um vídeo viral do seu nicho ou de um concorrente.",
      icon: "🔗",
    },
    {
      title: "Análise Automática",
      description: "O sistema extrai métricas, thumbnail, título e transcrição automaticamente para fazer uma análise completa do vídeo.",
      icon: "🔍",
    },
    {
      title: "Gere Títulos Virais",
      description: "Com base na análise, gere variações de títulos otimizados para CTR usando fórmulas comprovadas de copywriting.",
      icon: "💡",
    },
    {
      title: "Salve na Biblioteca",
      description: "Guarde as melhores análises e títulos na sua biblioteca para usar como referência em futuros projetos.",
      icon: "📚",
    },
  ],
};

// Tutorial: Agentes Virais
export const VIRAL_AGENTS_TUTORIAL: TutorialConfig = {
  id: "viral-agents",
  title: "Agentes Virais",
  description: "Crie agentes especializados para seu nicho",
  steps: [
    {
      title: "O que são Agentes?",
      description: "Agentes são assistentes de IA personalizados que aprendem o estilo do seu canal e geram roteiros seguindo suas fórmulas específicas.",
      icon: "🤖",
    },
    {
      title: "Crie seu Agente",
      description: "Configure o nicho, sub-nicho, gatilhos mentais preferidos e a estrutura de roteiro que funciona para seu canal.",
      icon: "⚙️",
    },
    {
      title: "Adicione Documentos",
      description: "Faça upload de roteiros anteriores, referências e materiais para que o agente aprenda seu estilo único de escrita.",
      icon: "📄",
    },
    {
      title: "Gere Roteiros",
      description: "Converse com seu agente para gerar roteiros personalizados que seguem exatamente o padrão do seu canal.",
      icon: "✍️",
    },
  ],
};

// Tutorial: Canais Monitorados
export const MONITORED_CHANNELS_TUTORIAL: TutorialConfig = {
  id: "monitored-channels",
  title: "Canais Monitorados",
  description: "Monitore a concorrência automaticamente",
  steps: [
    {
      title: "Adicione Canais",
      description: "Insira a URL de canais do YouTube que você quer acompanhar. Podem ser concorrentes, inspirações ou canais do seu nicho.",
      icon: "📺",
    },
    {
      title: "Notificações Automáticas",
      description: "Ative as notificações para receber alertas sempre que um canal monitorado publicar um novo vídeo.",
      icon: "🔔",
    },
    {
      title: "Analise Rapidamente",
      description: "Com um clique, envie qualquer vídeo novo diretamente para o Analisador e descubra por que está performando bem.",
      icon: "⚡",
    },
  ],
};

// Tutorial: Biblioteca Viral
export const VIRAL_LIBRARY_TUTORIAL: TutorialConfig = {
  id: "viral-library",
  title: "Biblioteca Viral",
  description: "Organize seus títulos e análises",
  steps: [
    {
      title: "Seus Títulos Salvos",
      description: "Aqui ficam todos os títulos que você gerou e salvou. Use tags e pastas para organizar por nicho ou projeto.",
      icon: "📁",
    },
    {
      title: "Filtre e Busque",
      description: "Use os filtros para encontrar rapidamente títulos por pontuação, fórmula utilizada, ou palavras-chave específicas.",
      icon: "🔍",
    },
    {
      title: "Marque Favoritos",
      description: "Destaque os melhores títulos como favoritos para acesso rápido quando for criar seu próximo vídeo.",
      icon: "⭐",
    },
  ],
};

// Tutorial: Gerador de Cenas (SceneGenerator)
export const SCENE_GENERATOR_TUTORIAL: TutorialConfig = {
  id: "scene-generator",
  title: "Gerador de Cenas",
  description: "Transforme roteiros em prompts de imagem",
  steps: [
    {
      title: "Insira o Roteiro",
      description: "Cole o texto completo do seu roteiro. Quanto mais detalhado, melhores serão os prompts gerados.",
      icon: "📝",
    },
    {
      title: "Defina o Estilo",
      description: "Escolha o estilo visual das imagens: fotorealista, cinematográfico, anime, dark/moody, etc.",
      icon: "🎨",
    },
    {
      title: "Copie os Prompts",
      description: "Use os prompts gerados em qualquer ferramenta de geração de imagens como Midjourney, DALL-E ou ImageFX.",
      icon: "📋",
    },
  ],
};

// Tutorial: Conversor SRT
export const SRT_CONVERTER_TUTORIAL: TutorialConfig = {
  id: "srt-converter",
  title: "Conversor SRT",
  description: "Crie legendas profissionais",
  steps: [
    {
      title: "Cole o Texto",
      description: "Insira a transcrição ou roteiro que você quer converter para o formato de legenda SRT.",
      icon: "📝",
    },
    {
      title: "Configure a Velocidade",
      description: "Ajuste o WPM (palavras por minuto) para controlar o timing das legendas de acordo com sua narração.",
      icon: "⏱️",
    },
    {
      title: "Baixe o SRT",
      description: "Exporte o arquivo .srt pronto para importar em qualquer editor de vídeo.",
      icon: "💾",
    },
  ],
};

// Tutorial: Dashboard
export const DASHBOARD_TUTORIAL: TutorialConfig = {
  id: "dashboard",
  title: "Dashboard",
  description: "Seu centro de comando",
  steps: [
    {
      title: "Visão Geral",
      description: "O Dashboard mostra um resumo das suas atividades, créditos disponíveis e ações recentes na plataforma.",
      icon: "📊",
    },
    {
      title: "Acesso Rápido",
      description: "Use os cards para acessar rapidamente as ferramentas mais utilizadas e continuar trabalhos em andamento.",
      icon: "🚀",
    },
    {
      title: "Citação Diária",
      description: "Todo dia uma nova citação motivacional para inspirar sua jornada como criador de conteúdo.",
      icon: "💭",
    },
  ],
};

// Tutorial: Analytics
export const ANALYTICS_TUTORIAL: TutorialConfig = {
  id: "analytics",
  title: "Analytics de Canais",
  description: "Analise performance de canais",
  steps: [
    {
      title: "Adicione Canais",
      description: "Salve canais do YouTube para acompanhar suas métricas de performance e crescimento ao longo do tempo.",
      icon: "📈",
    },
    {
      title: "Visualize Métricas",
      description: "Veja inscritos, views totais, quantidade de vídeos e taxa de crescimento de cada canal.",
      icon: "📊",
    },
    {
      title: "Compare Canais",
      description: "Analise múltiplos canais lado a lado para entender o que funciona melhor no seu nicho.",
      icon: "⚖️",
    },
  ],
};

// Export all tutorials as a map
export const TUTORIALS: Record<string, TutorialConfig> = {
  "prompts-images": PROMPTS_IMAGES_TUTORIAL,
  "video-analyzer": VIDEO_ANALYZER_TUTORIAL,
  "viral-agents": VIRAL_AGENTS_TUTORIAL,
  "monitored-channels": MONITORED_CHANNELS_TUTORIAL,
  "viral-library": VIRAL_LIBRARY_TUTORIAL,
  "scene-generator": SCENE_GENERATOR_TUTORIAL,
  "srt-converter": SRT_CONVERTER_TUTORIAL,
  "dashboard": DASHBOARD_TUTORIAL,
  "analytics": ANALYTICS_TUTORIAL,
};

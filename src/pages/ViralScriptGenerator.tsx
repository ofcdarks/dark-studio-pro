import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Sparkles, 
  Clock, 
  Target, 
  Zap, 
  Brain, 
  TrendingUp, 
  Copy, 
  Download,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Flame,
  MessageSquare,
  Youtube,
  Star,
  Rocket,
  BookOpen,
  Film,
  Mic,
  Users,
  Lock
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCreditDeduction } from "@/hooks/useCreditDeduction";
import { useActivityLog } from "@/hooks/useActivityLog";
import logoGif from "@/assets/logo.gif";

// Extended viral formulas based on proven YouTube patterns
const VIRAL_FORMULAS = [
  {
    id: "curiosity-gap",
    name: "Curiosity Gap",
    description: "Cria lacunas de curiosidade que mantêm o espectador grudado até o final",
    icon: "🎯",
    retention: 85,
    category: "engagement"
  },
  {
    id: "storytelling",
    name: "Storytelling Épico",
    description: "Narrativa envolvente com arcos dramáticos e plot twists inesperados",
    icon: "📖",
    retention: 92,
    category: "narrativa"
  },
  {
    id: "problem-solution",
    name: "Problema → Solução",
    description: "Apresenta dor intensa e entrega transformação clara e aplicável",
    icon: "💡",
    retention: 82,
    category: "educacional"
  },
  {
    id: "controversy",
    name: "Polêmica Controlada",
    description: "Opiniões fortes que geram debate intenso e compartilhamento",
    icon: "🔥",
    retention: 88,
    category: "engagement"
  },
  {
    id: "mystery",
    name: "Mistério Revelado",
    description: "Segredos e revelações que prendem até o último segundo",
    icon: "🔮",
    retention: 94,
    category: "narrativa"
  },
  {
    id: "challenge",
    name: "Desafio Extremo",
    description: "Situações impossíveis com superação épica e emocional",
    icon: "⚡",
    retention: 87,
    category: "entertainment"
  },
  {
    id: "before-after",
    name: "Antes e Depois",
    description: "Transformações visuais e emocionais que geram impacto",
    icon: "✨",
    retention: 86,
    category: "transformacao"
  },
  {
    id: "countdown",
    name: "Countdown/Ranking",
    description: "Listas numeradas que criam antecipação a cada item",
    icon: "🔢",
    retention: 83,
    category: "entertainment"
  },
  {
    id: "expose",
    name: "Exposé/Revelação",
    description: "Expõe verdades ocultas ou bastidores desconhecidos",
    icon: "🕵️",
    retention: 91,
    category: "investigativo"
  },
  {
    id: "tutorial-viral",
    name: "Tutorial que Vende",
    description: "Ensina algo valioso enquanto vende sua autoridade",
    icon: "🎓",
    retention: 80,
    category: "educacional"
  },
  {
    id: "reaction-chain",
    name: "Reação em Cadeia",
    description: "Uma ação leva a outra, criando efeito dominó narrativo",
    icon: "🎲",
    retention: 85,
    category: "narrativa"
  },
  {
    id: "underdog",
    name: "Jornada do Herói",
    description: "História de superação do zero ao sucesso",
    icon: "🦸",
    retention: 93,
    category: "narrativa"
  },
  {
    id: "fear-escape",
    name: "Medo → Escape",
    description: "Apresenta perigo/risco e mostra a saída segura",
    icon: "😱",
    retention: 89,
    category: "engagement"
  },
  {
    id: "behind-scenes",
    name: "Bastidores Exclusivos",
    description: "Revela o que ninguém mostra, acesso VIP",
    icon: "🎬",
    retention: 84,
    category: "entertainment"
  },
  {
    id: "time-pressure",
    name: "Contra o Tempo",
    description: "Urgência e deadline criam tensão constante",
    icon: "⏰",
    retention: 87,
    category: "engagement"
  },
  {
    id: "channel-based",
    name: "Baseado no Seu Canal",
    description: "IA analisa seus 100 últimos vídeos + tendências do nicho para máxima viralização",
    icon: "🎯",
    retention: 95,
    category: "personalizado",
    isPremium: true
  }
];

// Mental triggers - AI will auto-select based on niche and formula
const MENTAL_TRIGGERS = [
  { id: "urgency", name: "Urgência", icon: "⏰", description: "Cria senso de tempo limitado" },
  { id: "scarcity", name: "Escassez", icon: "💎", description: "Algo raro e exclusivo" },
  { id: "social-proof", name: "Prova Social", icon: "👥", description: "Outros já fizeram/aprovaram" },
  { id: "authority", name: "Autoridade", icon: "🏆", description: "Expertise e credibilidade" },
  { id: "reciprocity", name: "Reciprocidade", icon: "🎁", description: "Dar antes de pedir" },
  { id: "fear", name: "Medo de Perder", icon: "😨", description: "FOMO e consequências" },
  { id: "curiosity", name: "Curiosidade", icon: "🤔", description: "Gaps de conhecimento" },
  { id: "anticipation", name: "Antecipação", icon: "🎬", description: "Expectativa do que vem" },
  { id: "contrast", name: "Contraste", icon: "⚖️", description: "Antes vs depois" },
  { id: "belonging", name: "Pertencimento", icon: "🤝", description: "Fazer parte do grupo" },
  { id: "exclusivity", name: "Exclusividade", icon: "👑", description: "Acesso VIP/limitado" },
  { id: "novelty", name: "Novidade", icon: "🆕", description: "Algo nunca visto" }
];

// Structured niches with subniches and microniches
const NICHE_STRUCTURE: Record<string, { subniches: Record<string, string[]>; keywords: string[] }> = {
  "Dark/Mistério": {
    subniches: {
      "Casos Não Resolvidos": ["Desaparecimentos", "Mortes Misteriosas", "Cold Cases", "Investigações Abertas"],
      "Histórias Sobrenaturais": ["Paranormal", "Fantasmas", "Assombrações", "Fenômenos Inexplicáveis"],
      "Conspirações": ["Teorias Alternativas", "Sociedades Secretas", "Governo Oculto", "Deep State"],
      "Lugares Sombrios": ["Locais Abandonados", "Prisões", "Manicômios", "Cemitérios"]
    },
    keywords: ["mistério", "dark", "assombr", "paranormal", "desaparec", "morte", "assassin", "crime", "oculto", "secreto", "fantasma", "terror", "horror", "macabro", "sinistro", "inexplicável"]
  },
  "True Crime": {
    subniches: {
      "Serial Killers": ["Psicopatas Famosos", "Assassinos em Série", "Perfil Criminal", "Mente Criminosa"],
      "Casos Famosos": ["Crimes de Celebridades", "Casos Midiáticos", "Julgamentos Históricos"],
      "Crimes Reais Brasileiros": ["Casos BR", "Investigação Policial BR", "Tribunais BR"],
      "Golpes e Fraudes": ["Estelionatários", "Pirâmides Financeiras", "Golpistas Famosos"]
    },
    keywords: ["crime", "assassin", "serial killer", "golpe", "fraude", "prisão", "julgamento", "investigação", "policial", "vítima", "criminoso", "tribunal", "sentença", "matar", "morte"]
  },
  "Civilizações Antigas": {
    subniches: {
      "Egito Antigo": ["Faraós", "Pirâmides", "Múmias", "Hieróglifos"],
      "Mesopotâmia": ["Sumérios", "Babilônia", "Assírios", "Acádios"],
      "Impérios Perdidos": ["Maias", "Astecas", "Incas", "Atlântida"],
      "Roma e Grécia": ["Império Romano", "Grécia Antiga", "Mitologia", "Gladiadores"]
    },
    keywords: ["egito", "faraó", "pirâmide", "roma", "grécia", "antigo", "civilização", "império", "maia", "asteca", "inca", "suméri", "babilôn", "mesopotâm", "múmia", "arqueolog"]
  },
  "Histórias Reais": {
    subniches: {
      "Biografias": ["Celebridades", "Líderes Históricos", "Empresários", "Artistas"],
      "Superação": ["Sobreviventes", "Transformações", "De Zero ao Sucesso"],
      "Tragédias": ["Acidentes", "Desastres", "Perdas"],
      "Relacionamentos": ["Casamentos Famosos", "Divórcios", "Traições"]
    },
    keywords: ["história real", "verdade", "biografia", "vida de", "quem foi", "superação", "tragédia", "sobreviv", "acidente", "desastre", "família", "casament"]
  },
  "Bíblico/Religioso": {
    subniches: {
      "Estudos Bíblicos": ["Livros da Bíblia", "Personagens Bíblicos", "Profecias"],
      "Mistérios da Bíblia": ["Arqueologia Bíblica", "Lugares Santos", "Relíquias"],
      "Espiritualidade": ["Anjos", "Milagres", "Fé", "Oração"],
      "Apocalipse": ["Fim dos Tempos", "Revelações", "Sinais"]
    },
    keywords: ["bíblia", "deus", "jesus", "santo", "profecia", "apocalipse", "anjo", "demônio", "milagre", "oração", "igreja", "cristão", "evangél", "fé", "espírito"]
  },
  "Psicologia": {
    subniches: {
      "Comportamento Humano": ["Linguagem Corporal", "Manipulação", "Persuasão"],
      "Transtornos Mentais": ["Narcisismo", "Psicopatia", "Ansiedade", "Depressão"],
      "Relacionamentos": ["Amor", "Toxicidade", "Apego", "Separação"],
      "Desenvolvimento Pessoal": ["Autoconhecimento", "Inteligência Emocional", "Mentalidade"]
    },
    keywords: ["psicolog", "mente", "cérebro", "comportamento", "narcis", "psicopat", "manipula", "emocional", "ansiedade", "depressão", "trauma", "terapia", "mental"]
  },
  "Finanças": {
    subniches: {
      "Investimentos": ["Ações", "Criptomoedas", "Fundos Imobiliários", "Renda Fixa"],
      "Renda Extra": ["Negócios Online", "Freelance", "Infoprodutos"],
      "Educação Financeira": ["Organização", "Dívidas", "Poupar Dinheiro"],
      "Histórias de Riqueza": ["Bilionários", "Empresas Famosas", "Falências"]
    },
    keywords: ["dinheiro", "investir", "finan", "rico", "pobre", "milhão", "bilhão", "cripto", "bitcoin", "ação", "bolsa", "renda", "lucro", "prejuízo", "empresa"]
  },
  "Tecnologia": {
    subniches: {
      "IA e Futuro": ["Inteligência Artificial", "Robôs", "Singularidade"],
      "Big Tech": ["Apple", "Google", "Meta", "Microsoft", "Tesla"],
      "Gadgets": ["Smartphones", "Computadores", "Wearables"],
      "Internet": ["Redes Sociais", "Hackers", "Dark Web"]
    },
    keywords: ["tecnologia", "ia", "inteligência artificial", "robot", "app", "smartphone", "google", "apple", "tesla", "elon", "hacker", "internet", "computador", "software"]
  },
  "Saúde": {
    subniches: {
      "Doenças": ["Câncer", "Doenças Raras", "Epidemias", "Diagnósticos"],
      "Nutrição": ["Dietas", "Alimentação", "Suplementos"],
      "Fitness": ["Musculação", "Emagrecimento", "Exercícios"],
      "Medicina": ["Tratamentos", "Cirurgias", "Descobertas Médicas"]
    },
    keywords: ["saúde", "doença", "câncer", "médico", "hospital", "dieta", "emagrec", "treino", "academia", "músculo", "alimentação", "nutrição", "vitamina"]
  },
  "Curiosidades": {
    subniches: {
      "Fatos Surpreendentes": ["Recordes", "Números", "Estatísticas Chocantes"],
      "Países e Culturas": ["Tradições", "Costumes", "Lugares Exóticos"],
      "Ciência Divertida": ["Experimentos", "Descobertas", "Física"],
      "Natureza": ["Animais", "Fenômenos Naturais", "Planeta Terra"]
    },
    keywords: ["curioso", "incrível", "surpreend", "recorde", "mundo", "país", "animal", "natureza", "fenômeno", "descoberta", "fato", "sabia que"]
  },
  "Documentário": {
    subniches: {
      "Histórico": ["Guerras", "Revoluções", "Eventos Históricos"],
      "Natureza/Wildlife": ["Animais Selvagens", "Oceanos", "Florestas"],
      "Social": ["Pobreza", "Desigualdade", "Questões Sociais"],
      "Científico": ["Espaço", "Física", "Biologia"]
    },
    keywords: ["documentário", "história", "guerra", "revolução", "natureza", "wildlife", "selvagem", "social", "científico", "universo", "espaço"]
  },
  "Entretenimento": {
    subniches: {
      "Celebridades": ["Fofocas", "Bastidores", "Polêmicas"],
      "Filmes/Séries": ["Análises", "Teorias", "Easter Eggs"],
      "Música": ["Artistas", "Indústria Musical", "Histórias"],
      "Reality/TV": ["BBB", "Programas", "Bastidores"]
    },
    keywords: ["celebridade", "famoso", "filme", "série", "netflix", "música", "artista", "cantor", "ator", "bbb", "tv", "reality", "polêmica", "fofoca"]
  },
  "Motivacional": {
    subniches: {
      "Sucesso": ["Mentalidade Vencedora", "Hábitos de Sucesso", "Produtividade"],
      "Superação": ["Histórias Inspiradoras", "Resiliência", "Transformação"],
      "Mindset": ["Pensamento Positivo", "Lei da Atração", "Visualização"],
      "Carreira": ["Liderança", "Empreendedorismo", "Crescimento Profissional"]
    },
    keywords: ["motivação", "sucesso", "vencer", "superar", "mentalidade", "mindset", "inspiração", "hábito", "produtividade", "líder", "empreendedor", "sonho", "objetivo"]
  },
  "Terror/Horror": {
    subniches: {
      "Creepypasta": ["Histórias de Terror", "Lendas Urbanas", "SCP"],
      "Filmes de Terror": ["Análises", "Bastidores", "Franquias"],
      "Casos Reais": ["Assassinos", "Lugares Assombrados", "Eventos Macabros"],
      "Sobrenatural": ["Demônios", "Exorcismos", "Possessões"]
    },
    keywords: ["terror", "horror", "medo", "assustador", "creepy", "lenda urbana", "demônio", "exorcismo", "possessão", "assombra", "fantasma", "pesadelo"]
  },
  "Gaming": {
    subniches: {
      "Análises": ["Reviews", "Dicas", "Walkthroughs"],
      "Histórias de Jogos": ["Lore", "Teorias", "Easter Eggs"],
      "Indústria": ["Empresas", "Desenvolvedores", "Polêmicas"],
      "Competitivo": ["eSports", "Campeonatos", "Pro Players"]
    },
    keywords: ["jogo", "game", "gamer", "playstation", "xbox", "nintendo", "pc", "streamer", "esport", "gameplay", "review"]
  }
};

// Flatten niches for dropdown
const NICHES = Object.keys(NICHE_STRUCTURE);

// Function to detect niche/subniche/microniche from titles
const detectDetailedNiche = (titles: string[], existingNiche?: string): { niche: string; subniche: string; microniche: string } => {
  const allText = titles.join(' ').toLowerCase();
  
  let bestNiche = '';
  let bestScore = 0;
  let bestSubniche = '';
  let bestMicroniche = '';
  
  // Score each niche based on keyword matches
  for (const [nicheName, nicheData] of Object.entries(NICHE_STRUCTURE)) {
    let score = 0;
    
    // Count keyword matches
    for (const keyword of nicheData.keywords) {
      const regex = new RegExp(keyword.toLowerCase(), 'gi');
      const matches = (allText.match(regex) || []).length;
      score += matches * 2; // Weight keyword matches
    }
    
    // Check subniches for more specific matches
    for (const [subnicheName, microniches] of Object.entries(nicheData.subniches)) {
      const subnicheKeywords = subnicheName.toLowerCase().split(/\s+/);
      for (const keyword of subnicheKeywords) {
        if (keyword.length > 3 && allText.includes(keyword)) {
          score += 5; // Higher weight for subniche matches
          if (!bestSubniche || score > bestScore) {
            bestSubniche = subnicheName;
          }
        }
      }
      
      // Check microniches
      for (const microniche of microniches) {
        const microKeywords = microniche.toLowerCase().split(/\s+/);
        for (const keyword of microKeywords) {
          if (keyword.length > 3 && allText.includes(keyword)) {
            score += 10; // Highest weight for microniche matches
            if (!bestMicroniche || score > bestScore) {
              bestMicroniche = microniche;
            }
          }
        }
      }
    }
    
    if (score > bestScore) {
      bestScore = score;
      bestNiche = nicheName;
    }
  }
  
  // Use existing niche if detection fails
  if (!bestNiche && existingNiche) {
    bestNiche = existingNiche;
  }
  
  // Find matching subniche/microniche if we have a niche but not sub/micro
  if (bestNiche && (!bestSubniche || !bestMicroniche)) {
    const nicheData = NICHE_STRUCTURE[bestNiche];
    if (nicheData) {
      // Find best subniche
      let subScore = 0;
      for (const [subnicheName, microniches] of Object.entries(nicheData.subniches)) {
        let currentScore = 0;
        const subnicheKeywords = subnicheName.toLowerCase().split(/\s+/);
        for (const keyword of subnicheKeywords) {
          if (keyword.length > 3 && allText.includes(keyword)) {
            currentScore += 5;
          }
        }
        if (currentScore > subScore) {
          subScore = currentScore;
          if (!bestSubniche) bestSubniche = subnicheName;
          
          // Find best microniche within this subniche
          for (const microniche of microniches) {
            if (allText.includes(microniche.toLowerCase().split(' ')[0])) {
              bestMicroniche = microniche;
              break;
            }
          }
        }
      }
      
      // If still no subniche, pick the first one
      if (!bestSubniche) {
        const subniches = Object.keys(nicheData.subniches);
        bestSubniche = subniches[0] || '';
        const microniches = nicheData.subniches[bestSubniche] || [];
        bestMicroniche = microniches[0] || '';
      }
    }
  }
  
  return {
    niche: bestNiche || 'Não detectado',
    subniche: bestSubniche || 'Geral',
    microniche: bestMicroniche || 'Não especificado'
  };
};

const AI_MODELS = [
  { id: "gpt-4o", name: "GPT-4o", provider: "OpenAI", premium: true },
  { id: "claude-4-sonnet", name: "Claude 4 Sonnet", provider: "Anthropic", premium: true },
  { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro", provider: "Google", premium: true }
];

const LANGUAGES = [
  { id: "pt-BR", name: "Português (Brasil)", flag: "🇧🇷" },
  { id: "pt-PT", name: "Português (Portugal)", flag: "🇵🇹" },
  { id: "es", name: "Español", flag: "🇪🇸" },
  { id: "en", name: "English", flag: "🇺🇸" },
  { id: "fr", name: "Français", flag: "🇫🇷" },
  { id: "de", name: "Deutsch", flag: "🇩🇪" },
  { id: "it", name: "Italiano", flag: "🇮🇹" },
];

// Auto-detect target audience from title and niche
const detectTargetAudience = (titleText: string, nicheText: string): string => {
  const text = `${titleText} ${nicheText}`.toLowerCase();
  
  // Age-based detection
  let ageRange = "";
  let interests: string[] = [];
  
  // Ancient Civilizations / Archaeology - PRIORITY for this niche
  if (/civiliza|maia|asteca|inca|egito|egíp|piramide|pirâmide|templo|ruína|arqueolog|chichen|itzá|faraó|mumia|múmia|antiga|ancient|roma|grécia|grecia|imperio|império|babilon|sumér|olmeca|tolteca|teotihuacan|machu picchu|stonehenge|deuses|gods|mitolog/.test(text)) {
    ageRange = "25-55 anos";
    interests.push("interessados em história antiga e arqueologia");
    if (/maia|asteca|inca|chichen|olmeca|teotihuacan/.test(text)) {
      interests.push("entusiastas de civilizações pré-colombianas");
    }
    if (/mistér|segredo|oculto|descobert/.test(text)) {
      interests.push("curiosos por mistérios históricos");
    }
  }
  
  // Gaming / Tech / Young audience
  else if (/gamer|gaming|jogo|game|minecraft|fortnite|valorant|lol|cs|fps|rpg|streamer/.test(text)) {
    ageRange = "14-28 anos";
    interests.push("gamers e entusiastas de jogos");
  }
  
  // Horror / Dark content
  else if (/terror|horror|dark|mistério|crime|serial killer|assassino|sobrenatural|paranormal|fantasma|assombr/.test(text)) {
    ageRange = "18-45 anos";
    interests.push("entusiastas de mistério e terror");
  }
  
  // History / War / Documentary
  else if (/história|history|guerra|war|batalha|battle|mundial|world war|nazist|hitler|2ª guerra|1ª guerra/.test(text)) {
    ageRange = "20-55 anos";
    interests.push("interessados em história e documentários de guerra");
  }
  
  // Finance / Business
  else if (/dinheiro|money|rico|milionário|investir|invest|negócio|business|renda|patrimônio|cripto|bitcoin|financ|bolsa|ações/.test(text)) {
    ageRange = "22-45 anos";
    interests.push("buscando independência financeira");
  }
  
  // Self-improvement
  else if (/motivação|sucesso|hábito|produtiv|mentalidade|mindset|crescimento|desenvolvimento|auto-ajuda|superação/.test(text)) {
    ageRange = "18-40 anos";
    interests.push("focados em desenvolvimento pessoal");
  }
  
  // Conspiracy / Alternative
  else if (/conspiração|illuminati|sociedade secreta|governo|elite|nova ordem|verdade oculta|reptilian|area 51/.test(text)) {
    ageRange = "20-50 anos";
    interests.push("questionadores e teóricos alternativos");
  }
  
  // Science / Space
  else if (/ciência|science|espaço|nasa|universo|planeta|estrela|alien|ovni|ufo|tecnologia|cosmos|galáxia/.test(text)) {
    ageRange = "16-45 anos";
    interests.push("entusiastas de ciência e astronomia");
  }
  
  // True crime
  else if (/caso real|true crime|investigação|desaparecimento|assassinato|policial|fbi|detetive|serial|crime real/.test(text)) {
    ageRange = "20-50 anos";
    interests.push("fãs de true crime e casos reais");
  }
  
  // Nature / Animals
  else if (/natureza|animal|wildlife|selva|oceano|predador|shark|tubarão|leão|lion|safari|floresta/.test(text)) {
    ageRange = "16-50 anos";
    interests.push("amantes da natureza e vida selvagem");
  }
  
  // Lifestyle / Beauty
  else if (/beleza|moda|fashion|lifestyle|rotina|dia a dia|make|maquiagem/.test(text)) {
    ageRange = "16-35 anos";
    interests.push("interessados em lifestyle e tendências");
  }
  
  // Religion / Spirituality
  else if (/religião|bíblia|biblia|jesus|deus|espiritual|fé|igreja|profecia|apocalipse|anjos/.test(text)) {
    ageRange = "25-60 anos";
    interests.push("interessados em espiritualidade e religião");
  }
  
  // Default with niche-based interest
  if (!ageRange) {
    ageRange = "18-45 anos";
  }
  
  if (interests.length === 0) {
    // Try to extract interest from niche name
    if (nicheText) {
      interests.push(`interessados em ${nicheText.toLowerCase()}`);
    } else {
      interests.push("público geral interessado no tema");
    }
  }
  
  return `${ageRange}, ${interests.join(", ")}`;
};

export default function ViralScriptGenerator() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { deduct, checkBalance } = useCreditDeduction();
  const { logActivity } = useActivityLog();

  // Form state
  const [title, setTitle] = useState("");
  const [niche, setNiche] = useState("");
  const [customNiche, setCustomNiche] = useState("");
  const [duration, setDuration] = useState(10);
  const [selectedFormula, setSelectedFormula] = useState("storytelling");
  const [additionalContext, setAdditionalContext] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [aiModel, setAiModel] = useState("gpt-4o");
  const [language, setLanguage] = useState("pt-BR");
  const [channelUrl, setChannelUrl] = useState("");
  const [formulaTab, setFormulaTab] = useState("all");
  
  // Channel analysis data
  const [channelAnalysisData, setChannelAnalysisData] = useState<{
    topVideos: Array<{title: string; views: number; nicho: string}>;
    patterns: string[];
    avgViews: number;
    channelNiche: string;
    channelSubniche: string;
    channelMicroniche: string;
    nicheViralVideos?: Array<{title: string; views: number}>;
  } | null>(null);
  const [isLoadingChannelData, setIsLoadingChannelData] = useState(false);
  const [userChannels, setUserChannels] = useState<Array<{id: string; channel_url: string; channel_name: string | null}>>([]);

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedScript, setGeneratedScript] = useState("");
  const [currentPart, setCurrentPart] = useState(0);
  const [totalParts, setTotalParts] = useState(0);
  const [progress, setProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [selectedTriggersAI, setSelectedTriggersAI] = useState<string[]>([]);

  // Retention analysis
  const [retentionScore, setRetentionScore] = useState<number | null>(null);
  const [retentionTips, setRetentionTips] = useState<string[]>([]);

  // Credits
  const [hasEnoughCredits, setHasEnoughCredits] = useState(true);
  const [estimatedCredits, setEstimatedCredits] = useState(0);

  // Loading messages rotation
  const loadingMessages = [
    "🎬 Analisando fórmulas virais...",
    "🧠 Selecionando gatilhos mentais ideais...",
    "📈 Otimizando para retenção máxima...",
    "✍️ Escrevendo narrativa envolvente...",
    "🔥 Adicionando hooks poderosos...",
    "⚡ Criando momentos de tensão...",
    "🎯 Inserindo CTAs estratégicos...",
    "💎 Polindo cada palavra...",
    "🚀 Maximizando potencial viral..."
  ];

  useEffect(() => {
    if (isGenerating) {
      const interval = setInterval(() => {
        setLoadingMessage(loadingMessages[Math.floor(Math.random() * loadingMessages.length)]);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [isGenerating]);

  // Calculate estimated credits based on duration
  useEffect(() => {
    const wordsPerMinute = 150;
    const totalWords = duration * wordsPerMinute;
    const creditsPerWord = 0.02;
    const modelMultiplier = aiModel === "gpt-4o" ? 1.5 : aiModel === "claude-4-sonnet" ? 1.3 : 1.0;
    const formulaMultiplier = selectedFormula === "channel-based" ? 1.5 : 1.0;
    const estimated = Math.ceil(totalWords * creditsPerWord * modelMultiplier * formulaMultiplier);
    setEstimatedCredits(estimated);
  }, [duration, aiModel, selectedFormula]);

  // Check credits on mount
  useEffect(() => {
    const checkCredits = async () => {
      if (user) {
        const result = await checkBalance(estimatedCredits);
        setHasEnoughCredits(result.hasBalance);
      }
    };
    checkCredits();
  }, [user, estimatedCredits]);

  // Fetch user's channels on mount
  useEffect(() => {
    const fetchUserChannels = async () => {
      if (!user) return;
      
      // Get YouTube connections
      const { data: ytConnections } = await supabase
        .from('youtube_connections')
        .select('channel_id, channel_name')
        .eq('user_id', user.id);
      
      // Get monitored channels
      const { data: monitoredChannels } = await supabase
        .from('monitored_channels')
        .select('id, channel_url, channel_name')
        .eq('user_id', user.id);
      
      // Get saved analytics channels
      const { data: analyticsChannels } = await supabase
        .from('saved_analytics_channels')
        .select('id, channel_url, channel_name')
        .eq('user_id', user.id);
      
      const channels: Array<{id: string; channel_url: string; channel_name: string | null}> = [];
      const seenNames = new Set<string>();
      const seenUrls = new Set<string>();
      
      const addChannel = (c: {id: string; channel_url: string; channel_name: string | null}) => {
        const normalizedName = c.channel_name?.toLowerCase().trim() || '';
        const normalizedUrl = c.channel_url.toLowerCase().trim();
        
        // Skip if we already have this channel by name or URL
        if ((normalizedName && seenNames.has(normalizedName)) || seenUrls.has(normalizedUrl)) {
          return;
        }
        
        if (normalizedName) seenNames.add(normalizedName);
        seenUrls.add(normalizedUrl);
        channels.push(c);
      };
      
      if (ytConnections) {
        ytConnections.forEach(c => {
          addChannel({ 
            id: c.channel_id, 
            channel_url: `https://youtube.com/channel/${c.channel_id}`, 
            channel_name: c.channel_name 
          });
        });
      }
      
      if (monitoredChannels) {
        monitoredChannels.forEach(c => addChannel(c));
      }
      
      if (analyticsChannels) {
        analyticsChannels.forEach(c => addChannel(c));
      }
      
      setUserChannels(channels);
      
      // Auto-select first channel if available
      if (channels.length > 0 && !channelUrl) {
        setChannelUrl(channels[0].channel_url);
      }
    };
    
    fetchUserChannels();
  }, [user]);

  // Auto-detect target audience when title changes
  useEffect(() => {
    if (title.trim().length >= 10) {
      const finalNiche = niche === "custom" ? customNiche : niche;
      const detectedAudience = detectTargetAudience(title, finalNiche);
      setTargetAudience(detectedAudience);
    }
  }, [title, niche, customNiche]);

  // Fetch channel analysis data when channel URL changes
  useEffect(() => {
    const fetchChannelAnalysisData = async () => {
      if (!user || !channelUrl || selectedFormula !== "channel-based") {
        setChannelAnalysisData(null);
        return;
      }
      
      setIsLoadingChannelData(true);
      
      try {
        // Check if it's a connected YouTube channel (can fetch real data)
        const selectedChannel = userChannels.find(c => c.channel_url === channelUrl);
        const channelIdFromUrl = channelUrl.match(/\/channel\/([^/?]+)/)?.[1];
        const channelId = channelIdFromUrl || (selectedChannel?.id?.startsWith('UC') ? selectedChannel.id : undefined);
        
        // Try to fetch real YouTube analytics first
        let realChannelVideos: Array<{title: string; views: number; nicho: string}> = [];
        let detectedNiche = '';
        
        // Check if user has YouTube connection for this channel
        const { data: ytConnection } = channelId
          ? await supabase
              .from('youtube_connections')
              .select('channel_id')
              .eq('user_id', user.id)
              .eq('channel_id', channelId)
              .maybeSingle()
          : { data: null };
        
        if (ytConnection && channelId) {
          // Fetch real analytics from connected YouTube channel
          try {
            const { data: analyticsData, error: analyticsError } = await supabase.functions.invoke(
              'youtube-channel-analytics',
              { body: { channelId } }
            );
            
            if (!analyticsError && analyticsData?.topVideos) {
              const seenTitles = new Set<string>();
              realChannelVideos = analyticsData.topVideos
                .filter((v: any) => {
                  const normalizedTitle = (v.title || '').toLowerCase().trim();
                  if (seenTitles.has(normalizedTitle)) return false;
                  seenTitles.add(normalizedTitle);
                  return true;
                })
                .slice(0, 20)
                .map((v: any) => ({
                  title: v.title || '',
                  views: v.views || 0,
                  nicho: ''
                }));
            }
          } catch (e) {
            console.log('YouTube analytics not available, using analyzed videos');
          }
        }
        
        // Fetch analyzed videos to get niche and supplement data
        const { data: analyzedVideos } = await supabase
          .from('analyzed_videos')
          .select('original_title, original_views, detected_niche, detected_subniche, analysis_data_json')
          .eq('user_id', user.id)
          .not('original_views', 'is', null)
          .order('original_views', { ascending: false })
          .limit(100);
        
        // Detect main niche from analyzed videos
        if (analyzedVideos && analyzedVideos.length > 0) {
          const nicheCount: Record<string, number> = {};
          analyzedVideos.forEach(v => {
            if (v.detected_niche) {
              nicheCount[v.detected_niche] = (nicheCount[v.detected_niche] || 0) + 1;
            }
          });
          detectedNiche = Object.entries(nicheCount)
            .sort((a, b) => b[1] - a[1])[0]?.[0] || '';
        }
        
        // Fetch cached data from saved analytics channels
        const { data: savedChannel } = await supabase
          .from('saved_analytics_channels')
          .select('cached_data, notes, channel_name, subscribers, total_views')
          .eq('user_id', user.id)
          .ilike('channel_url', `%${channelUrl.replace('https://', '').replace('http://', '')}%`)
          .maybeSingle();
        
        // Use cached analytics data if available
        if (savedChannel?.cached_data && typeof savedChannel.cached_data === 'object') {
          const cachedData = savedChannel.cached_data as any;
          if (cachedData.topVideos && realChannelVideos.length === 0) {
            const seenTitles = new Set<string>();
            realChannelVideos = cachedData.topVideos
              .filter((v: any) => {
                const normalizedTitle = (v.title || '').toLowerCase().trim();
                if (seenTitles.has(normalizedTitle)) return false;
                seenTitles.add(normalizedTitle);
                return true;
              })
              .slice(0, 20)
              .map((v: any) => ({
                title: v.title || '',
                views: typeof v.views === 'number' ? v.views : parseInt(v.views) || 0,
                nicho: ''
              }));
          }
        }
        
        // Fallback to analyzed videos if no real data available
        if (realChannelVideos.length === 0 && analyzedVideos && analyzedVideos.length > 0) {
          const seenTitles = new Set<string>();
          realChannelVideos = analyzedVideos
            .filter(v => v.original_views && v.original_title)
            .sort((a, b) => (b.original_views || 0) - (a.original_views || 0))
            .filter(v => {
              const normalizedTitle = (v.original_title || '').toLowerCase().trim();
              if (seenTitles.has(normalizedTitle)) return false;
              seenTitles.add(normalizedTitle);
              return true;
            })
            .slice(0, 20)
            .map(v => ({
              title: v.original_title || '',
              views: v.original_views || 0,
              nicho: v.detected_niche || ''
            }));
        }
        
        // Fetch viral videos from the SAME NICHE (not user's own videos)
        let nicheViralVideos: Array<{title: string; views: number}> = [];
        if (detectedNiche) {
          const { data: nicheVideos } = await supabase
            .from('analyzed_videos')
            .select('original_title, original_views')
            .eq('detected_niche', detectedNiche)
            .neq('user_id', user.id) // Other users' videos in same niche
            .not('original_views', 'is', null)
            .order('original_views', { ascending: false })
            .limit(50);
          
          if (nicheVideos && nicheVideos.length > 0) {
            const seenTitles = new Set<string>();
            nicheViralVideos = nicheVideos
              .filter(v => {
                const normalizedTitle = (v.original_title || '').toLowerCase().trim();
                if (seenTitles.has(normalizedTitle)) return false;
                seenTitles.add(normalizedTitle);
                return true;
              })
              .slice(0, 10)
              .map(v => ({
                title: v.original_title || '',
                views: v.original_views || 0
              }));
          }
        }
        
        if (realChannelVideos.length > 0) {
          const avgViews = Math.round(
            realChannelVideos.reduce((sum, v) => sum + v.views, 0) / realChannelVideos.length
          );
          
          // Extract patterns from top videos
          const patterns: string[] = [];
          const titles = realChannelVideos.map(v => v.title.toLowerCase());
          
          // Detect common patterns
          const hasNumbers = titles.filter(t => /\d/.test(t)).length > titles.length * 0.5;
          if (hasNumbers) patterns.push("Usa números nos títulos para CTR alto");
          
          const hasQuestions = titles.filter(t => t.includes('?')).length > titles.length * 0.3;
          if (hasQuestions) patterns.push("Perguntas nos títulos geram curiosidade");
          
          const hasEmotionalWords = titles.filter(t => 
            /(incrível|chocante|surpreendente|nunca|segredo|verdade|revelação|amazing|shocking|secret)/i.test(t)
          ).length > titles.length * 0.3;
          if (hasEmotionalWords) patterns.push("Palavras emocionais impulsionam engajamento");
          
          const hasListFormat = titles.filter(t => /^\d+|top \d+/i.test(t)).length > titles.length * 0.2;
          if (hasListFormat) patterns.push("Formato de lista (Top X) performa bem");
          
          // Add patterns from saved notes
          if (savedChannel?.notes) {
            patterns.push(`Notas do canal: ${savedChannel.notes.slice(0, 200)}`);
          }
          
          // Add niche viral insights
          if (nicheViralVideos.length > 0) {
            patterns.push(`${nicheViralVideos.length} vídeos virais do nicho analisados`);
          }
          
          // Use detailed niche detection with titles
          const allTitles = realChannelVideos.map(v => v.title);
          const detailedNiche = detectDetailedNiche(allTitles, detectedNiche);
          
          setChannelAnalysisData({
            topVideos: realChannelVideos,
            patterns,
            avgViews,
            channelNiche: detailedNiche.niche,
            channelSubniche: detailedNiche.subniche,
            channelMicroniche: detailedNiche.microniche,
            nicheViralVideos
          });
          
          // Auto-set niche based on channel analysis
          if (detailedNiche.niche && detailedNiche.niche !== 'Não detectado' && !niche) {
            const matchingNiche = NICHES.find(n => 
              n.toLowerCase().includes(detailedNiche.niche.toLowerCase()) ||
              detailedNiche.niche.toLowerCase().includes(n.toLowerCase())
            );
            if (matchingNiche) {
              setNiche(matchingNiche);
            }
          }
        } else {
          setChannelAnalysisData(null);
        }
      } catch (error) {
        console.error('Error fetching channel data:', error);
        setChannelAnalysisData(null);
      } finally {
        setIsLoadingChannelData(false);
      }
    };
    
    fetchChannelAnalysisData();
  }, [channelUrl, selectedFormula, user, userChannels]);

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} minutos`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (mins === 0) return `${hours} hora${hours > 1 ? 's' : ''}`;
    return `${hours}h ${mins}min`;
  };

  const cleanScriptForCopy = (script: string) => {
    return script
      .replace(/\[PARTE \d+\/\d+\]/g, '')
      .replace(/\[INÍCIO\]|\[FIM\]/g, '')
      .replace(/---+/g, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  };

  const handleCopyScript = () => {
    const cleanedScript = cleanScriptForCopy(generatedScript);
    navigator.clipboard.writeText(cleanedScript);
    toast.success("Roteiro copiado!");
  };

  const handleDownloadScript = () => {
    const cleanedScript = cleanScriptForCopy(generatedScript);
    const blob = new Blob([cleanedScript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `roteiro-viral-${title.slice(0, 30).replace(/[^a-z0-9]/gi, '-')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Roteiro baixado!");
  };

  const getAutoTriggers = (formulaId: string, nicheValue: string) => {
    // AI selects optimal triggers based on formula and niche
    const triggerMap: Record<string, string[]> = {
      "curiosity-gap": ["curiosity", "anticipation", "fear"],
      "storytelling": ["anticipation", "belonging", "contrast"],
      "problem-solution": ["fear", "authority", "reciprocity"],
      "controversy": ["curiosity", "social-proof", "novelty"],
      "mystery": ["curiosity", "anticipation", "exclusivity"],
      "challenge": ["anticipation", "social-proof", "fear"],
      "before-after": ["contrast", "social-proof", "novelty"],
      "countdown": ["anticipation", "curiosity", "scarcity"],
      "expose": ["curiosity", "authority", "fear"],
      "tutorial-viral": ["authority", "reciprocity", "scarcity"],
      "reaction-chain": ["curiosity", "anticipation", "novelty"],
      "underdog": ["belonging", "anticipation", "contrast"],
      "fear-escape": ["fear", "urgency", "authority"],
      "behind-scenes": ["exclusivity", "curiosity", "belonging"],
      "time-pressure": ["urgency", "fear", "scarcity"],
      "channel-based": ["authority", "belonging", "exclusivity"]
    };

    const nicheModifiers: Record<string, string[]> = {
      "Dark/Mistério": ["fear", "curiosity"],
      "True Crime": ["fear", "curiosity", "anticipation"],
      "Motivacional": ["belonging", "contrast", "authority"],
      "Finanças": ["fear", "scarcity", "authority"],
      "Terror/Horror": ["fear", "anticipation", "curiosity"]
    };

    let triggers = triggerMap[formulaId] || ["curiosity", "anticipation", "fear"];
    
    // Add niche-specific triggers
    const nicheExtra = nicheModifiers[nicheValue];
    if (nicheExtra) {
      triggers = [...new Set([...triggers, ...nicheExtra])].slice(0, 5);
    }

    return triggers;
  };

  const buildViralPrompt = () => {
    const formula = VIRAL_FORMULAS.find(f => f.id === selectedFormula);
    const finalNiche = niche === "custom" ? customNiche : niche;
    const wordsTarget = duration * 150;
    
    // Auto-select triggers
    const autoTriggers = getAutoTriggers(selectedFormula, finalNiche);
    setSelectedTriggersAI(autoTriggers);
    const triggerNames = autoTriggers.map(t => MENTAL_TRIGGERS.find(m => m.id === t)?.name).filter(Boolean);

    // Build channel context with REAL data from analyzed videos
    let channelContext = '';
    if (selectedFormula === "channel-based" && channelAnalysisData) {
      const topTitles = channelAnalysisData.topVideos.slice(0, 10).map((v, i) => 
        `${i + 1}. "${v.title}" - ${v.views.toLocaleString()} views`
      ).join('\n');
      
      const nicheViralTitles = channelAnalysisData.nicheViralVideos?.slice(0, 5).map((v, i) => 
        `${i + 1}. "${v.title}" - ${v.views.toLocaleString()} views`
      ).join('\n') || 'Nenhum vídeo viral do nicho encontrado';
      
      channelContext = `
## 📊 ANÁLISE REAL DO SEU CANAL (DADOS DOS ÚLTIMOS 100 VÍDEOS)

### Top 10 Vídeos Mais Virais do SEU CANAL:
${topTitles}

### Média de Views dos Seus Top Vídeos: ${channelAnalysisData.avgViews.toLocaleString()}

### 🎯 CLASSIFICAÇÃO DETALHADA DO CANAL:
- **Nicho Principal**: ${channelAnalysisData.channelNiche}
- **Sub-Nicho**: ${channelAnalysisData.channelSubniche}
- **Micro-Nicho**: ${channelAnalysisData.channelMicroniche}

### Padrões de Sucesso do SEU CANAL Identificados pela IA:
${channelAnalysisData.patterns.map(p => `- ${p}`).join('\n')}

## 🔥 VÍDEOS VIRAIS DO MESMO NICHO (CONCORRÊNCIA)
${nicheViralTitles}

### INSTRUÇÕES DE OTIMIZAÇÃO BASEADA NO SEU CANAL + NICHO:
1. **Focar no Micro-Nicho "${channelAnalysisData.channelMicroniche}"**: Este é seu diferencial específico
2. **Dominar o Sub-Nicho "${channelAnalysisData.channelSubniche}"**: Explore todas as variações deste tema
3. **Expandir no Nicho "${channelAnalysisData.channelNiche}"**: Use referências do nicho maior para atrair novos públicos
4. **Replicar SEUS Padrões de Sucesso**: Mantenha a identidade do seu canal
5. **Meta de Views**: Otimizar para superar ${channelAnalysisData.avgViews.toLocaleString()} views (sua média atual)
6. **Diferenciação**: Combine seu micro-nicho único com tendências do momento`;
    } else if (selectedFormula === "channel-based" && channelUrl) {
      channelContext = `
## ANÁLISE DO CANAL
Analise o padrão de sucesso do canal ${channelUrl} e adapte o roteiro para seguir:
- Tom de voz e linguagem similar
- Estrutura de narrativa que funciona no canal
- Estilo de hooks e aberturas
- Padrões de retenção específicos do nicho`;
    }

    return `Você é um ESPECIALISTA ELITE em roteiros virais para YouTube com mais de 10 anos criando conteúdo que quebra a internet. Seu trabalho é criar roteiros que:
- Mantêm retenção ACIMA de 70%
- Geram milhões de visualizações
- Viralizam organicamente
- Prendem do primeiro ao último segundo

## MISSÃO CRÍTICA
Crie um roteiro COMPLETO e PROFISSIONAL para um vídeo de ${formatDuration(duration)} (aproximadamente ${wordsTarget} palavras).

## DADOS DO VÍDEO
- **Título/Tema**: ${title}
- **Nicho**: ${finalNiche}
- **Público-alvo**: ${targetAudience || "Geral"}
- **Fórmula Viral**: ${formula?.name} - ${formula?.description}
- **Gatilhos Mentais Selecionados pela IA**: ${triggerNames.join(", ")}
${additionalContext ? `- **Contexto Adicional**: ${additionalContext}` : ''}
${channelContext}

## ESTRUTURA OBRIGATÓRIA DE RETENÇÃO

### 🎯 HOOK INICIAL (0-30 segundos) - CRÍTICO!
- Primeira frase EXPLOSIVA que para o scroll instantaneamente
- Promessa clara e irresistível do que o espectador vai ganhar
- Elemento de curiosidade, choque ou polêmica controlada
- NUNCA comece com "Olá pessoal", "E aí galera" ou saudações genéricas
- Use números, estatísticas chocantes ou afirmações controversas

### 📈 DESENVOLVIMENTO (corpo do vídeo)
Divida em blocos de 2-3 minutos, cada um com:
- Mini-hook no início de cada bloco
- Tensão crescente e escalonada
- Micro-revelações para manter engajamento constante
- Transições que criam expectativa e curiosidade
- "Open loops" que só fecham depois

### 🔥 PONTOS DE RETENÇÃO (a cada 2-3 minutos)
- Pattern interrupts visuais e narrativos
- Perguntas retóricas que fazem pensar
- Teasers do que vem a seguir ("mas o pior ainda está por vir...")
- Momentos de emoção intensa
- Plot twists e revelações inesperadas

### 💎 CLÍMAX E RESOLUÇÃO
- Build-up emocional máximo antes da revelação
- Revelação principal épica e impactante
- Momento de transformação/insight profundo
- Fechamento que ressoa emocionalmente

### 📢 CTA ESTRATÉGICO
- CTA integrado naturalmente na narrativa
- Chamada para inscrição contextualizada com benefício claro
- Teaser do próximo vídeo para criar antecipação

## GATILHOS MENTAIS APLICADOS AUTOMATICAMENTE
${triggerNames.map(t => `- **${t}**: Aplique naturalmente ao longo do roteiro de forma sutil mas efetiva`).join('\n')}

## REGRAS DE OURO
1. CADA FRASE deve ter um propósito estratégico
2. Use linguagem conversacional, íntima e envolvente
3. Crie "open loops" (ganchos que só fecham depois)
4. Alterne entre momentos de tensão extrema e alívio
5. Inclua dados/números chocantes para credibilidade
6. Use metáforas poderosas e histórias para ilustrar
7. Faça o espectador SENTIR intensamente, não apenas ouvir
8. Cada parágrafo deve terminar com um gancho para o próximo

## FORMATO DE ENTREGA
Entregue APENAS o roteiro narrado (voice-over), sem instruções técnicas.
Não inclua: [CENA], [CORTE], [B-ROLL] ou qualquer marcação técnica.
O texto deve fluir naturalmente como uma narração contínua e envolvente.

## IMPORTANTE
- O roteiro DEVE ter aproximadamente ${wordsTarget} palavras
- Mantenha parágrafos curtos (2-3 frases máximo)
- Use quebras naturais para respiração do narrador
- Cada minuto = ~150 palavras faladas

COMECE O ROTEIRO AGORA COM UM HOOK EXPLOSIVO:`;
  };

  const generateScript = async () => {
    if (!title.trim()) {
      toast.error("Digite o título ou tema do vídeo");
      return;
    }

    if (!niche && !customNiche) {
      toast.error("Selecione ou digite um nicho");
      return;
    }

    if (selectedFormula === "channel-based" && !channelAnalysisData && !channelUrl.trim()) {
      toast.error("Selecione um canal ou adicione vídeos analisados para usar esta fórmula");
      return;
    }

    if (!hasEnoughCredits) {
      toast.error("Créditos insuficientes");
      return;
    }

    setIsGenerating(true);
    setGeneratedScript("");
    setProgress(0);
    setRetentionScore(null);
    setRetentionTips([]);

    try {
      const wordsPerPart = 2000;
      const totalWords = duration * 150;
      const partsNeeded = Math.ceil(totalWords / wordsPerPart);
      setTotalParts(partsNeeded);

      let fullScript = "";

      for (let part = 1; part <= partsNeeded; part++) {
        setCurrentPart(part);
        setProgress(((part - 1) / partsNeeded) * 100);

        const partPrompt = partsNeeded > 1 
          ? `${buildViralPrompt()}\n\n[PARTE ${part}/${partsNeeded}] ${part === 1 ? 'Comece do início do roteiro com hook explosivo.' : `Continue de onde parou. Texto anterior terminava em: "${fullScript.slice(-200)}"`} ${part === partsNeeded ? 'Finalize o roteiro com clímax e CTA épico.' : 'Pare em um ponto de tensão para continuar.'}`
          : buildViralPrompt();

        const { data, error } = await supabase.functions.invoke('ai-assistant', {
          body: {
            messages: [{ role: 'user', content: partPrompt }],
            model: aiModel,
            type: 'viral-script'
          }
        });

        if (error) throw error;

        const partContent = data?.content || data?.message || "";
        fullScript += (part > 1 ? "\n\n" : "") + partContent;
        setGeneratedScript(fullScript);
      }

      setProgress(100);

      await deduct({
        operationType: 'script_generation',
        customAmount: estimatedCredits,
        modelUsed: aiModel,
        details: {
          title,
          duration,
          formula: selectedFormula
        }
      });

      await logActivity({
        action: 'script_generated',
        description: `Roteiro viral: ${title} (${formatDuration(duration)})`,
        metadata: {
          duration,
          formula: selectedFormula,
          triggers: selectedTriggersAI
        }
      });

      analyzeRetention(fullScript);
      await saveScript(fullScript);

      toast.success("Roteiro viral gerado com sucesso!");

    } catch (error) {
      console.error('Error generating script:', error);
      toast.error("Erro ao gerar roteiro. Tente novamente.");
    } finally {
      setIsGenerating(false);
    }
  };

  const analyzeRetention = (script: string) => {
    const tips: string[] = [];
    let score = 75;

    const firstSentence = script.split('.')[0] || "";
    if (firstSentence.length > 100) {
      tips.push("Primeira frase muito longa. Hooks devem ser impactantes e curtos.");
      score -= 5;
    } else {
      score += 5;
    }

    const questionCount = (script.match(/\?/g) || []).length;
    if (questionCount < 5) {
      tips.push("Adicione mais perguntas retóricas para engajar o espectador.");
      score -= 3;
    } else {
      score += 5;
    }

    const emotionalWords = ['incrível', 'chocante', 'surpreendente', 'impressionante', 'nunca', 'sempre', 'segredo', 'revelação', 'explosivo', 'devastador'];
    const emotionalCount = emotionalWords.reduce((acc, word) => 
      acc + (script.toLowerCase().match(new RegExp(word, 'g')) || []).length, 0
    );
    if (emotionalCount < 10) {
      tips.push("Use mais palavras emocionais para criar impacto.");
      score -= 3;
    } else {
      score += 5;
    }

    const paragraphs = script.split('\n\n').filter(p => p.trim());
    const longParagraphs = paragraphs.filter(p => p.length > 500);
    if (longParagraphs.length > 3) {
      tips.push("Alguns parágrafos estão muito longos. Quebre em blocos menores.");
      score -= 5;
    }

    score = Math.min(100, Math.max(0, score));
    
    setRetentionScore(score);
    setRetentionTips(tips);
  };

  const saveScript = async (script: string) => {
    if (!user) return;

    try {
      await supabase.from('generated_scripts').insert({
        user_id: user.id,
        title: title,
        content: script,
        duration: duration,
        language: language,
        model_used: aiModel,
        credits_used: estimatedCredits
      });
    } catch (error) {
      console.error('Error saving script:', error);
    }
  };

  const filteredFormulas = formulaTab === "all" 
    ? VIRAL_FORMULAS 
    : VIRAL_FORMULAS.filter(f => f.category === formulaTab);

  return (
    <MainLayout>
      <SEOHead 
        title="Gerador de Roteiros Virais | Retenção Máxima"
        description="Crie roteiros virais otimizados para retenção máxima no YouTube"
      />

      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-gradient-to-br from-primary to-primary/80 rounded-xl shadow-lg shadow-primary/20">
              <Rocket className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Gerador de Roteiros Virais
              </h1>
              <p className="text-muted-foreground text-sm">
                Roteiros de 5min a 3h com foco em retenção e viralização máxima
              </p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-5 gap-6">
          {/* Configuration Panel - 3 columns */}
          <div className="lg:col-span-3 space-y-6">
            {/* Basic Info */}
            <Card className="border-primary/20">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Target className="h-5 w-5 text-primary" />
                  Informações do Vídeo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title" className="text-sm font-medium">Título ou Tema *</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: A história por trás do maior golpe do século"
                    className="mt-1.5"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="niche" className="text-sm font-medium">Nicho</Label>
                    <Select value={niche} onValueChange={setNiche}>
                      <SelectTrigger className="mt-1.5">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {NICHES.map((n) => (
                          <SelectItem key={n} value={n}>{n}</SelectItem>
                        ))}
                        <SelectItem value="custom">Outro (digitar)</SelectItem>
                      </SelectContent>
                    </Select>
                    {niche === "custom" && (
                      <Input
                        value={customNiche}
                        onChange={(e) => setCustomNiche(e.target.value)}
                        placeholder="Digite o nicho"
                        className="mt-2"
                      />
                    )}
                  </div>

                  <div>
                    <Label htmlFor="audience" className="text-sm font-medium flex items-center gap-2">
                      Público-alvo
                      {title.trim().length >= 10 && (
                        <Badge variant="outline" className="text-xs text-green-500 border-green-500/30">
                          <Sparkles className="h-3 w-3 mr-1" />
                          Auto
                        </Badge>
                      )}
                    </Label>
                    <Input
                      id="audience"
                      value={targetAudience}
                      onChange={(e) => setTargetAudience(e.target.value)}
                      placeholder="Digite o título para detecção automática..."
                      className="mt-1.5"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Idioma do Roteiro</Label>
                    <Select value={language} onValueChange={setLanguage}>
                      <SelectTrigger className="mt-1.5">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {LANGUAGES.map((lang) => (
                          <SelectItem key={lang.id} value={lang.id}>
                            <div className="flex items-center gap-2">
                              <span>{lang.flag}</span>
                              <span>{lang.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-sm font-medium">Duração do Vídeo</Label>
                      <Badge variant="secondary" className="text-primary font-semibold">
                        {formatDuration(duration)}
                      </Badge>
                    </div>
                    <div className="px-1">
                      <Slider
                        value={[duration]}
                        onValueChange={(v) => setDuration(v[0])}
                        min={5}
                        max={180}
                        step={5}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground mt-2">
                        <span>5 min</span>
                        <span>1h</span>
                        <span>3h</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Viral Formula */}
            <Card className="border-primary/20">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Zap className="h-5 w-5 text-primary" />
                  Fórmula Viral
                </CardTitle>
                <CardDescription>
                  Escolha a estrutura narrativa para máxima viralização
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Category Tabs */}
                <Tabs value={formulaTab} onValueChange={setFormulaTab}>
                  <TabsList className="grid grid-cols-6 w-full">
                    <TabsTrigger value="all" className="text-xs">Todas</TabsTrigger>
                    <TabsTrigger value="narrativa" className="text-xs">Narrativa</TabsTrigger>
                    <TabsTrigger value="engagement" className="text-xs">Engagement</TabsTrigger>
                    <TabsTrigger value="educacional" className="text-xs">Educacional</TabsTrigger>
                    <TabsTrigger value="entertainment" className="text-xs">Entretenimento</TabsTrigger>
                    <TabsTrigger value="personalizado" className="text-xs">Seu Canal</TabsTrigger>
                  </TabsList>
                </Tabs>

                <div className="grid grid-cols-2 gap-3 max-h-[320px] overflow-y-auto pr-2">
                  {filteredFormulas.map((formula) => (
                    <button
                      key={formula.id}
                      onClick={() => setSelectedFormula(formula.id)}
                      className={`p-3 rounded-xl border-2 text-left transition-all relative ${
                        selectedFormula === formula.id
                          ? 'border-primary bg-primary/10 shadow-lg shadow-primary/10'
                          : 'border-border hover:border-primary/50 hover:bg-secondary/50'
                      }`}
                    >
                      {formula.isPremium && (
                        <Badge className="absolute -top-2 -right-2 bg-gradient-to-r from-primary to-primary/80 text-xs">
                          <Star className="h-3 w-3 mr-1" />
                          PRO
                        </Badge>
                      )}
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-xl">{formula.icon}</span>
                        <span className="font-medium text-sm">{formula.name}</span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                        {formula.description}
                      </p>
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3 text-green-500" />
                        <span className="text-xs text-green-500 font-medium">{formula.retention}% retenção</span>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Channel URL for channel-based formula */}
                {selectedFormula === "channel-based" && (
                  <div className="mt-4 space-y-4">
                    <div className="p-4 bg-primary/5 rounded-xl border border-primary/20">
                      <Label className="text-sm font-medium flex items-center gap-2 mb-2">
                        <Youtube className="h-4 w-4 text-red-500" />
                        Selecione seu Canal
                      </Label>
                      
                      {userChannels.length > 0 ? (
                        <Select value={channelUrl} onValueChange={setChannelUrl}>
                          <SelectTrigger className="bg-background">
                            <SelectValue placeholder="Selecione um canal" />
                          </SelectTrigger>
                          <SelectContent>
                            {userChannels.map((channel) => (
                              <SelectItem key={channel.id} value={channel.channel_url}>
                                {channel.channel_name || channel.channel_url}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          value={channelUrl}
                          onChange={(e) => setChannelUrl(e.target.value)}
                          placeholder="https://youtube.com/@seucanal"
                          className="bg-background"
                        />
                      )}
                      
                      <p className="text-xs text-muted-foreground mt-2">
                        {userChannels.length > 0 
                          ? "Canais detectados do seu perfil. A IA vai analisar os vídeos já salvos."
                          : "Adicione canais no Monitoramento ou Analytics para análise automática."
                        }
                      </p>
                    </div>
                    
                    {/* Channel Analysis Results */}
                    {isLoadingChannelData && (
                      <div className="p-4 bg-secondary/50 rounded-xl border border-border">
                        <div className="flex items-center gap-2">
                          <RefreshCw className="h-4 w-4 animate-spin text-primary" />
                          <span className="text-sm text-muted-foreground">
                            Analisando dados do canal...
                          </span>
                        </div>
                      </div>
                    )}
                    
                    {channelAnalysisData && !isLoadingChannelData && (
                      <div className="p-4 bg-gradient-to-br from-green-500/10 to-primary/5 rounded-xl border border-green-500/20">
                        <div className="flex items-center gap-2 mb-3">
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                          <span className="font-medium text-sm text-green-500">
                            Análise do Canal Completa!
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <div className="p-2 bg-background/50 rounded-lg">
                            <p className="text-xs text-muted-foreground">Vídeos Analisados</p>
                            <p className="font-bold text-lg">{channelAnalysisData.topVideos.length}</p>
                          </div>
                          <div className="p-2 bg-background/50 rounded-lg">
                            <p className="text-xs text-muted-foreground">Média de Views</p>
                            <p className="font-bold text-lg">{channelAnalysisData.avgViews.toLocaleString()}</p>
                          </div>
                        </div>
                        
                        <div className="mb-3 space-y-2">
                          <p className="text-xs text-muted-foreground mb-1">🎯 Classificação do Canal</p>
                          <div className="flex flex-wrap gap-1">
                            <Badge variant="secondary" className="bg-primary/20 text-xs">
                              {channelAnalysisData.channelNiche}
                            </Badge>
                            {channelAnalysisData.channelSubniche && channelAnalysisData.channelSubniche !== 'Geral' && (
                              <Badge variant="outline" className="text-xs border-primary/30">
                                {channelAnalysisData.channelSubniche}
                              </Badge>
                            )}
                          </div>
                          {channelAnalysisData.channelMicroniche && channelAnalysisData.channelMicroniche !== 'Não especificado' && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Target className="w-3 h-3 text-orange-500" />
                              <span>Micro-Nicho: </span>
                              <span className="text-orange-500 font-medium">{channelAnalysisData.channelMicroniche}</span>
                            </div>
                          )}
                        </div>
                        
                        <div>
                          <p className="text-xs text-muted-foreground mb-2">Padrões de Sucesso</p>
                          <div className="space-y-1">
                            {channelAnalysisData.patterns.slice(0, 4).map((pattern, i) => (
                              <div key={i} className="flex items-start gap-2 text-xs">
                                <CheckCircle2 className="h-3 w-3 text-green-500 mt-0.5 shrink-0" />
                                <span className="text-muted-foreground">{pattern}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        {channelAnalysisData.topVideos.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-border/50">
                            <p className="text-xs text-muted-foreground mb-2">
                              <Youtube className="w-3 h-3 inline mr-1" />
                              Top 3 Vídeos do Seu Canal
                            </p>
                            <div className="space-y-1">
                              {channelAnalysisData.topVideos.slice(0, 3).map((video, i) => (
                                <div key={i} className="flex items-center gap-2 text-xs">
                                  <span className="font-bold text-primary">#{i + 1}</span>
                                  <span className="truncate flex-1">{video.title}</span>
                                  <span className="text-green-500 shrink-0">
                                    {video.views.toLocaleString()} views
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {channelAnalysisData.nicheViralVideos && channelAnalysisData.nicheViralVideos.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-border/50">
                            <p className="text-xs text-muted-foreground mb-2">
                              <Flame className="w-3 h-3 inline mr-1 text-orange-500" />
                              Virais do Mesmo Nicho (Concorrência)
                            </p>
                            <div className="space-y-1">
                              {channelAnalysisData.nicheViralVideos.slice(0, 3).map((video, i) => (
                                <div key={i} className="flex items-center gap-2 text-xs">
                                  <span className="font-bold text-orange-500">#{i + 1}</span>
                                  <span className="truncate flex-1">{video.title}</span>
                                  <span className="text-green-500 shrink-0">
                                    {video.views.toLocaleString()} views
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {!channelAnalysisData && !isLoadingChannelData && channelUrl && (
                      <div className="p-4 bg-yellow-500/10 rounded-xl border border-yellow-500/20">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-yellow-500">
                              Nenhum dado encontrado
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Analise alguns vídeos deste canal primeiro no "Analisador de Vídeo" ou adicione à sua lista de Analytics para coletar dados.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Mental Triggers - Auto Selected */}
            <Card className="border-primary/20 bg-gradient-to-br from-card to-primary/5">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Brain className="h-5 w-5 text-primary" />
                  Gatilhos Mentais
                  <Badge variant="secondary" className="ml-auto text-xs">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Seleção Automática
                  </Badge>
                </CardTitle>
                <CardDescription>
                  A IA seleciona automaticamente os melhores gatilhos baseado na fórmula e nicho
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {MENTAL_TRIGGERS.map((trigger) => {
                    const finalNiche = niche === "custom" ? customNiche : niche;
                    const autoSelected = getAutoTriggers(selectedFormula, finalNiche).includes(trigger.id);
                    return (
                      <div
                        key={trigger.id}
                        className={`px-3 py-2 rounded-full text-sm flex items-center gap-1.5 transition-all ${
                          autoSelected
                            ? 'bg-primary text-primary-foreground shadow-md'
                            : 'bg-secondary/50 text-muted-foreground'
                        }`}
                      >
                        <span>{trigger.icon}</span>
                        <span>{trigger.name}</span>
                        {autoSelected && <CheckCircle2 className="h-3 w-3 ml-1" />}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* AI Model & Context */}
            <Card className="border-primary/20">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Configurações Avançadas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Modelo de IA</Label>
                  <Select value={aiModel} onValueChange={setAiModel}>
                    <SelectTrigger className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {AI_MODELS.map((model) => (
                        <SelectItem key={model.id} value={model.id}>
                          <div className="flex items-center gap-2">
                            <span>{model.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {model.provider}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="context" className="text-sm font-medium">Contexto Adicional (opcional)</Label>
                  <Textarea
                    id="context"
                    value={additionalContext}
                    onChange={(e) => setAdditionalContext(e.target.value)}
                    placeholder="Informações extras, referências, estilo específico, dados importantes..."
                    className="mt-1.5 min-h-[80px] resize-none"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Output Panel - 2 columns */}
          <div className="lg:col-span-2 space-y-6">
            {/* Generate Button Card */}
            <Card className="border-primary/50 bg-gradient-to-br from-card to-primary/10 sticky top-4">
              <CardContent className="p-5">
                <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                  <div className="flex items-center gap-2 p-2 bg-background/50 rounded-lg">
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">~{Math.ceil(duration * 150)} palavras</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-background/50 rounded-lg">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span className="font-semibold text-primary">{estimatedCredits} créditos</span>
                  </div>
                </div>

                <Button
                  onClick={generateScript}
                  disabled={isGenerating || !hasEnoughCredits}
                  className="w-full h-14 text-lg font-bold shadow-lg shadow-primary/20"
                  size="lg"
                >
                  {isGenerating ? (
                    <div className="flex items-center gap-2">
                      <RefreshCw className="h-5 w-5 animate-spin" />
                      <span>Gerando... {Math.round(progress)}%</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Rocket className="h-5 w-5" />
                      <span>Gerar Roteiro Viral</span>
                    </div>
                  )}
                </Button>

                {!hasEnoughCredits && (
                  <p className="text-xs text-destructive text-center mt-3">
                    Créditos insuficientes. Recarregue para continuar.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Loading State */}
            {isGenerating && (
              <Card className="border-primary/50 bg-card">
                <CardContent className="p-8 flex flex-col items-center justify-center min-h-[350px] relative">
                  <div className="relative w-24 h-24 mb-6">
                    <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
                    <div className="absolute inset-0 bg-primary/10 rounded-full animate-pulse" />
                    <div className="relative w-24 h-24 rounded-full border-2 border-primary/50 overflow-hidden">
                      <img 
                        src={logoGif} 
                        alt="Loading" 
                        className="w-full h-full object-cover scale-110"
                      />
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-bold text-foreground mb-1">Gerando Roteiro</h3>
                  
                  <p className="text-sm text-muted-foreground mb-4 text-center">
                    {loadingMessage}
                  </p>

                  {totalParts > 1 && (
                    <div className="flex items-center gap-2 mb-4">
                      {Array.from({ length: totalParts }, (_, i) => (
                        <div
                          key={i}
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-all duration-300 ${
                            i < currentPart
                              ? "bg-primary text-primary-foreground"
                              : i === currentPart - 1
                              ? "bg-primary/80 text-primary-foreground animate-pulse"
                              : "bg-muted-foreground/20 text-muted-foreground"
                          }`}
                        >
                          {i + 1}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="w-full max-w-xs space-y-2">
                    <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <p className="text-xs text-center text-muted-foreground">
                      {Math.round(progress)}%
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Script Output */}
            {generatedScript && !isGenerating && (
              <>
                {/* Retention Analysis */}
                {retentionScore !== null && (
                  <Card className={`border-2 ${
                    retentionScore >= 80 ? 'border-green-500/50 bg-green-500/5' :
                    retentionScore >= 60 ? 'border-yellow-500/50 bg-yellow-500/5' :
                    'border-red-500/50 bg-red-500/5'
                  }`}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <TrendingUp className={`h-5 w-5 ${
                            retentionScore >= 80 ? 'text-green-500' :
                            retentionScore >= 60 ? 'text-yellow-500' :
                            'text-red-500'
                          }`} />
                          <span className="font-semibold">Análise de Retenção</span>
                        </div>
                        <Badge variant={
                          retentionScore >= 80 ? 'default' :
                          retentionScore >= 60 ? 'secondary' :
                          'destructive'
                        } className="text-lg px-3">
                          {retentionScore}%
                        </Badge>
                      </div>

                      {retentionTips.length > 0 && (
                        <div className="space-y-2">
                          {retentionTips.map((tip, i) => (
                            <div key={i} className="flex items-start gap-2 text-sm">
                              <AlertTriangle className="h-4 w-4 text-yellow-500 shrink-0 mt-0.5" />
                              <span className="text-muted-foreground">{tip}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {retentionTips.length === 0 && (
                        <div className="flex items-center gap-2 text-sm text-green-600">
                          <CheckCircle2 className="h-4 w-4" />
                          <span>Roteiro otimizado para alta retenção!</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* AI Selected Triggers */}
                {selectedTriggersAI.length > 0 && (
                  <Card className="border-primary/20">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Brain className="h-4 w-4 text-primary" />
                        <span className="font-medium text-sm">Gatilhos Aplicados</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {selectedTriggersAI.map(triggerId => {
                          const trigger = MENTAL_TRIGGERS.find(t => t.id === triggerId);
                          return trigger && (
                            <Badge key={triggerId} variant="secondary" className="text-xs">
                              {trigger.icon} {trigger.name}
                            </Badge>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Script Content */}
                <Card className="border-primary/20">
                  <CardHeader className="flex flex-row items-center justify-between pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <MessageSquare className="h-5 w-5 text-primary" />
                      Seu Roteiro Viral
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={handleCopyScript}>
                        <Copy className="h-4 w-4 mr-1" />
                        Copiar
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleDownloadScript}>
                        <Download className="h-4 w-4 mr-1" />
                        Baixar
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[400px] w-full rounded-lg border bg-background/50 p-4">
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                          {generatedScript}
                        </pre>
                      </div>
                    </ScrollArea>

                    <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <MessageSquare className="h-4 w-4" />
                          {generatedScript.split(/\s+/).length} palavras
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          ~{Math.ceil(generatedScript.split(/\s+/).length / 150)} min
                        </span>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={generateScript}
                        disabled={isGenerating}
                      >
                        <RefreshCw className="h-4 w-4 mr-1" />
                        Regenerar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {/* Empty State */}
            {!isGenerating && !generatedScript && (
              <Card className="border-dashed border-2 border-muted-foreground/20">
                <CardContent className="p-8 flex flex-col items-center justify-center min-h-[350px] text-center">
                  <div className="p-4 bg-primary/10 rounded-full mb-4">
                    <Film className="h-10 w-10 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Seu roteiro aparecerá aqui</h3>
                  <p className="text-sm text-muted-foreground max-w-xs">
                    Configure as opções ao lado e clique em "Gerar Roteiro Viral" para criar um roteiro otimizado para máxima retenção
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

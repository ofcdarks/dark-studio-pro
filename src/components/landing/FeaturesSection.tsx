import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { 
  Wand2, 
  Image, 
  FileText, 
  Sparkles, 
  Subtitles,
  Film,
  Bot,
  BarChart3,
  LineChart,
  Brain,
  Palette,
  Key
} from "lucide-react";

const features = [
  {
    icon: Wand2,
    title: "Analisador de Títulos Virais",
    description: "Análise de títulos com métricas de viralidade e sugestões de otimização.",
    color: "from-yellow-500 to-orange-500",
    badge: "Popular",
  },
  {
    icon: Image,
    title: "Gerador de Thumbnails 4x",
    description: "Crie 4 variações de thumbnails otimizadas para CTR máximo.",
    color: "from-orange-500 to-red-500",
    badge: "Novo",
  },
  {
    icon: FileText,
    title: "Gerador de Roteiros",
    description: "Roteiros completos com estrutura viral e ganchos de retenção.",
    color: "from-blue-500 to-cyan-500",
  },
  {
    icon: Sparkles,
    title: "Gerador de Prompts Cenas",
    description: "Prompts detalhados para cada cena do seu vídeo.",
    color: "from-purple-500 to-pink-500",
  },
  {
    icon: Image,
    title: "Gerador de Imagens Ilimitado",
    description: "Criação ilimitada de imagens com IA para seus vídeos.",
    color: "from-pink-500 to-rose-500",
    badge: "∞",
  },
  {
    icon: Subtitles,
    title: "Gerador de SRT",
    description: "Legendas sincronizadas automaticamente em formato SRT.",
    color: "from-teal-500 to-emerald-500",
  },
  {
    icon: Film,
    title: "Geração de Vídeo VO3 & Sora",
    description: "Integração com VO3 e Sora para geração de vídeos com IA.",
    color: "from-indigo-500 to-violet-500",
    badge: "Pro",
  },
  {
    icon: Bot,
    title: "Criação de Agente Automático",
    description: "Agentes que trabalham 24/7 automatizando suas operações.",
    color: "from-primary to-orange-500",
    badge: "IA",
  },
  {
    icon: BarChart3,
    title: "Analytics Avançado",
    description: "Métricas em tempo real: CTR, views, likes, comentários e RPM.",
    color: "from-green-500 to-emerald-500",
  },
  {
    icon: LineChart,
    title: "Análise de Canais Virais",
    description: "Monitore e analise os canais mais virais do seu nicho.",
    color: "from-cyan-500 to-blue-500",
  },
  {
    icon: Brain,
    title: "Modelagem de Roteiro com Agente",
    description: "IA avançada que modela roteiros baseados em padrões virais.",
    color: "from-violet-500 to-purple-500",
    badge: "IA",
  },
  {
    icon: Key,
    title: "Integração com APIs Próprias",
    description: "Use suas próprias chaves de API para maior controle.",
    color: "from-gray-500 to-zinc-500",
  },
];

const FeaturesSection = () => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="features" ref={ref} className="py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-card/50 to-background" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-2 rounded-full bg-primary/10 border border-primary/30 text-primary text-sm font-medium mb-4">
            ⚡ FUNCIONALIDADES PREMIUM
          </span>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Ferramentas de
            <span className="text-gradient"> Elite</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Todas as ferramentas que você precisa para dominar o YouTube em uma única plataforma.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: index * 0.05 }}
              whileHover={{ y: -8, scale: 1.02 }}
              className="group relative"
            >
              {/* Glow effect */}
              <div className={`absolute inset-0 bg-gradient-to-r ${feature.color} opacity-0 group-hover:opacity-20 rounded-2xl blur-xl transition-all duration-500`} />
              
              {/* Card */}
              <div className="relative p-6 h-full rounded-2xl bg-card/80 backdrop-blur-sm border border-border/50 hover:border-primary/40 transition-all duration-300">
                {/* Badge */}
                {feature.badge && (
                  <span className="absolute top-4 right-4 px-2 py-1 rounded-full bg-primary/20 text-primary text-xs font-bold">
                    {feature.badge}
                  </span>
                )}

                {/* Icon */}
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${feature.color} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>

                {/* Content */}
                <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;

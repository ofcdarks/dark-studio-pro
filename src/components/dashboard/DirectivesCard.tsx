import { Lightbulb, Rocket, TrendingUp, Target, Zap, Brain } from "lucide-react";
import { motion } from "framer-motion";
import { useMemo } from "react";

interface DirectivesCardProps {
  stats?: {
    totalVideos: number;
    totalViews: number;
    scriptsGenerated: number;
    imagesGenerated: number;
    audiosGenerated: number;
    titlesGenerated: number;
    viralVideos: number;
  };
}

// AI Expert tips for YouTube Dark channel viralization
const getAIDirective = (stats: DirectivesCardProps['stats']) => {
  const s = stats || { totalVideos: 0, totalViews: 0, scriptsGenerated: 0, imagesGenerated: 0, audiosGenerated: 0, titlesGenerated: 0, viralVideos: 0 };
  
  // Priority-based directives based on user activity
  const directives = [];

  // No videos analyzed yet
  if (s.totalVideos === 0) {
    directives.push({
      icon: Target,
      title: "Inicie sua Pesquisa Viral",
      tip: "Canais Dark precisam de padrões. Analise 5-10 vídeos virais do seu nicho para identificar thumbnails, hooks e estruturas que geram milhões de views.",
      priority: 1,
    });
  }

  // Has videos but no scripts
  if (s.totalVideos > 0 && s.scriptsGenerated === 0) {
    directives.push({
      icon: Brain,
      title: "Crie seu Primeiro Roteiro",
      tip: `Você analisou ${s.totalVideos} vídeos. Use os Agentes de Roteiro para transformar esses padrões virais em scripts otimizados para narração Dark.`,
      priority: 2,
    });
  }

  // Has scripts but no audio
  if (s.scriptsGenerated > 0 && s.audiosGenerated === 0) {
    directives.push({
      icon: Zap,
      title: "Gere Narração Profissional",
      tip: `${s.scriptsGenerated} roteiros prontos! Canais Dark dependem de voz grave e envolvente. Use o Gerador de Voz para criar narrações impactantes.`,
      priority: 3,
    });
  }

  // Active user - give advanced tips
  if (s.totalVideos >= 5 && s.scriptsGenerated >= 3) {
    const avgViews = s.totalViews / Math.max(s.totalVideos, 1);
    if (avgViews < 50000) {
      directives.push({
        icon: TrendingUp,
        title: "Otimize para Algoritmo",
        tip: "Foque em thumbnails com rostos, expressões intensas e texto bold. Títulos Dark com palavras como 'Proibido', 'Segredo' e 'Nunca Revelado' têm 3x mais CTR.",
        priority: 4,
      });
    } else {
      directives.push({
        icon: Rocket,
        title: "Escale sua Produção",
        tip: `Excelente! Média de ${(avgViews / 1000).toFixed(0)}K views. Mantenha consistência: 3-4 vídeos/semana é o sweet spot para canais Dark viralizarem.`,
        priority: 4,
      });
    }
  }

  // Low on titles
  if (s.totalVideos > 0 && s.titlesGenerated < s.totalVideos * 3) {
    directives.push({
      icon: Target,
      title: "Maximize seus Títulos",
      tip: "Gere pelo menos 10-15 variações de título por vídeo. Teste diferentes gatilhos emocionais: medo, curiosidade e urgência funcionam melhor em Dark.",
      priority: 5,
    });
  }

  // Default advanced tip for active users
  if (directives.length === 0) {
    directives.push({
      icon: Rocket,
      title: "Dica do Especialista",
      tip: "Canais Dark com melhor performance postam às 18h-21h (horário do público). Hook nos primeiros 3 segundos retém 40% mais viewers.",
      priority: 10,
    });
  }

  // Sort by priority and return the top directive
  return directives.sort((a, b) => a.priority - b.priority)[0];
};

export function DirectivesCard({ stats }: DirectivesCardProps) {
  const directive = useMemo(() => getAIDirective(stats), [stats]);
  const IconComponent = directive.icon;

  return (
    <div className="group h-full bg-card/60 backdrop-blur-sm border border-border/50 rounded-xl p-5 transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Lightbulb className="w-4 h-4 text-primary" />
          </div>
          <h3 className="font-semibold text-foreground text-sm">Diretivas IA</h3>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
          Especialista Dark
        </span>
      </div>
      <motion.div 
        className="bg-gradient-to-br from-primary/5 to-transparent border border-primary/10 rounded-lg p-4"
        whileHover={{ scale: 1.01 }}
        transition={{ duration: 0.2 }}
      >
        <div className="flex items-start gap-3">
          <div className="w-7 h-7 rounded-full bg-primary/15 border border-primary/25 flex items-center justify-center flex-shrink-0 mt-0.5">
            <IconComponent className="w-3.5 h-3.5 text-primary" />
          </div>
          <div>
            <h4 className="font-medium text-primary text-sm mb-2">
              {directive.title}
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {directive.tip}
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
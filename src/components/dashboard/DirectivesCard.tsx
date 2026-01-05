import { Lightbulb, Rocket, TrendingUp, Target, Zap, Brain, RefreshCw, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

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

interface AIDirective {
  title: string;
  tip: string;
  icon: 'target' | 'brain' | 'zap' | 'trending' | 'rocket';
}

const iconMap = {
  target: Target,
  brain: Brain,
  zap: Zap,
  trending: TrendingUp,
  rocket: Rocket,
};

export function DirectivesCard({ stats }: DirectivesCardProps) {
  const { user } = useAuth();
  const [directive, setDirective] = useState<AIDirective | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);

  const fetchAIDirective = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const s = stats || { totalVideos: 0, totalViews: 0, scriptsGenerated: 0, imagesGenerated: 0, audiosGenerated: 0, titlesGenerated: 0, viralVideos: 0 };
      
      const { data, error } = await supabase.functions.invoke('ai-assistant', {
        body: {
          type: 'dashboard_insight',
          stats: {
            totalVideos: s.totalVideos,
            totalViews: s.totalViews,
            scriptsGenerated: s.scriptsGenerated,
            imagesGenerated: s.imagesGenerated,
            audiosGenerated: s.audiosGenerated,
            titlesGenerated: s.titlesGenerated,
            viralVideos: s.viralVideos,
          }
        }
      });

      if (error) throw error;

      if (data?.directive) {
        setDirective(data.directive);
        setLastFetch(new Date());
      }
    } catch (error) {
      console.error('Error fetching AI directive:', error);
      // Fallback to local directive
      setDirective(getLocalDirective(stats));
    } finally {
      setLoading(false);
    }
  };

  // Local fallback
  const getLocalDirective = (stats: DirectivesCardProps['stats']): AIDirective => {
    const s = stats || { totalVideos: 0, totalViews: 0, scriptsGenerated: 0, imagesGenerated: 0, audiosGenerated: 0, titlesGenerated: 0, viralVideos: 0 };
    
    if (s.totalVideos === 0) {
      return {
        icon: 'target',
        title: "Inicie sua Pesquisa Viral",
        tip: "Canais Dark precisam de padrões. Analise 5-10 vídeos virais do seu nicho para identificar thumbnails, hooks e estruturas que geram milhões de views.",
      };
    }
    
    if (s.totalVideos > 0 && s.scriptsGenerated === 0) {
      return {
        icon: 'brain',
        title: "Crie seu Primeiro Roteiro",
        tip: `Você analisou ${s.totalVideos} vídeos. Use os Agentes de Roteiro para transformar esses padrões virais em scripts otimizados para narração Dark.`,
      };
    }
    
    if (s.scriptsGenerated > 0 && s.audiosGenerated === 0) {
      return {
        icon: 'zap',
        title: "Gere Narração Profissional",
        tip: `${s.scriptsGenerated} roteiros prontos! Canais Dark dependem de voz grave e envolvente. Use o Gerador de Voz para criar narrações impactantes.`,
      };
    }
    
    const avgViews = s.totalViews / Math.max(s.totalVideos, 1);
    if (avgViews >= 50000) {
      return {
        icon: 'rocket',
        title: "Escale sua Produção",
        tip: `Excelente! Média de ${(avgViews / 1000).toFixed(0)}K views. Mantenha consistência: 3-4 vídeos/semana é o sweet spot para canais Dark viralizarem.`,
      };
    }
    
    return {
      icon: 'trending',
      title: "Otimize para Algoritmo",
      tip: "Foque em thumbnails com rostos, expressões intensas e texto bold. Títulos Dark com palavras como 'Proibido', 'Segredo' e 'Nunca Revelado' têm 3x mais CTR.",
    };
  };

  useEffect(() => {
    // Fetch on mount or when stats change significantly
    if (!directive) {
      fetchAIDirective();
    }
  }, [user, stats?.totalVideos, stats?.scriptsGenerated]);

  const currentDirective = directive || getLocalDirective(stats);
  const IconComponent = iconMap[currentDirective.icon] || Rocket;

  return (
    <div className="group h-full bg-card/60 backdrop-blur-sm border border-border/50 rounded-xl p-5 transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Lightbulb className="w-4 h-4 text-primary" />
          </div>
          <h3 className="font-semibold text-foreground text-sm">Diretivas IA</h3>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={fetchAIDirective}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
            ) : (
              <RefreshCw className="w-3 h-3 text-muted-foreground hover:text-primary" />
            )}
          </Button>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
            Especialista Dark
          </span>
        </div>
      </div>
      <motion.div 
        className="bg-gradient-to-br from-primary/5 to-transparent border border-primary/10 rounded-lg p-4"
        whileHover={{ scale: 1.01 }}
        transition={{ duration: 0.2 }}
        key={currentDirective.title}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-start gap-3">
          <div className="w-7 h-7 rounded-full bg-primary/15 border border-primary/25 flex items-center justify-center flex-shrink-0 mt-0.5">
            <IconComponent className="w-3.5 h-3.5 text-primary" />
          </div>
          <div>
            <h4 className="font-medium text-primary text-sm mb-2">
              {currentDirective.title}
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {currentDirective.tip}
            </p>
          </div>
        </div>
      </motion.div>
      {lastFetch && (
        <p className="text-[10px] text-muted-foreground/50 mt-2 text-right">
          Atualizado às {lastFetch.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
        </p>
      )}
    </div>
  );
}

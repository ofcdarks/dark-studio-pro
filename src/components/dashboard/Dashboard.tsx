import { Video, Eye, Coins, TrendingUp, Type, Image, Sparkles } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";
import { useCredits } from "@/hooks/useCredits";
import { useDashboardData } from "@/hooks/useDashboardData";
import { StatsCard } from "./StatsCard";
import { MetricsCard } from "./MetricsCard";
import { DirectivesCard } from "./DirectivesCard";
import { NextStepsCard } from "./NextStepsCard";
import { DailyQuoteCard } from "./DailyQuoteCard";
import { RecentVideosCard } from "./RecentVideosCard";
import { OperationalLogsCard } from "./OperationalLogsCard";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

export function Dashboard() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { balance: credits, loading: creditsLoading } = useCredits();
  const { stats, recentVideos, activityLogs, loading } = useDashboardData();
  const navigate = useNavigate();

  const isLowCredits = credits < 100;

  const displayName = profile?.full_name || user?.email?.split("@")[0] || "Usuário";

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <div className="flex-1 overflow-auto bg-background relative">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div 
          className="absolute top-0 right-1/4 w-[500px] h-[500px] rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, hsl(var(--primary) / 0.03) 0%, transparent 60%)' }}
          animate={{ x: [0, 30, 0], y: [0, 20, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div className="p-6 lg:p-8 max-w-7xl mx-auto relative z-10">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            <motion.div className="w-2 h-2 rounded-full bg-primary" animate={{ scale: [1, 1.3, 1], opacity: [1, 0.6, 1] }} transition={{ duration: 2, repeat: Infinity }} />
            <span className="text-xs font-medium text-primary uppercase tracking-wider">Painel de Controle</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
            Bem-vindo, <span className="text-primary">{displayName}</span>
          </h1>
          <p className="text-muted-foreground">Visão geral da sua execução ativa</p>
        </motion.div>

        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-10">
          <motion.div variants={itemVariants}>
            <StatsCard icon={Video} label="Vídeos Analisados" value={stats.totalVideos} subLabel={stats.totalVideos > 0 ? "ATIVO" : "INÍCIO"} />
          </motion.div>
          <motion.div variants={itemVariants}>
            <StatsCard icon={Eye} label="Views Totais" value={formatNumber(stats.totalViews)} subLabel={stats.totalViews > 0 ? "ANALISADOS" : "SEM DADOS"} />
          </motion.div>
          <motion.div variants={itemVariants}>
            <StatsCard icon={Type} label="Títulos Gerados" value={stats.titlesGenerated} subLabel={stats.titlesGenerated > 0 ? "CRIADOS" : "INÍCIO"} />
          </motion.div>
          <motion.div variants={itemVariants}>
            <StatsCard 
              icon={Coins} 
              label="Créditos" 
              value={credits.toLocaleString()} 
              status={isLowCredits ? undefined : "active"} 
              action={
                <Button 
                  size="sm" 
                  onClick={() => navigate('/plans')} 
                  className={`w-full gradient-button text-primary-foreground text-xs ${isLowCredits ? 'animate-pulse' : ''}`}
                >
                  <Sparkles className="w-3 h-3 mr-1" />
                  Comprar Créditos
                </Button>
              }
            />
          </motion.div>
          <motion.div variants={itemVariants}>
            <StatsCard icon={Image} label="Imagens Geradas" value={stats.imagesGenerated} subLabel={stats.imagesGenerated > 0 ? "CRIADAS" : "INÍCIO"} />
          </motion.div>
          <motion.div variants={itemVariants}>
            <StatsCard icon={TrendingUp} label="Vídeos Virais" value={stats.viralVideos} subLabel="100K+ views" />
          </motion.div>
        </motion.div>

        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <motion.div variants={itemVariants}>
              <MetricsCard title="Produção de Conteúdo" metrics={[
                { label: "Roteiros Gerados", value: stats.scriptsGenerated },
                { label: "Imagens Criadas", value: stats.imagesGenerated },
                { label: "Áudios Gerados", value: stats.audiosGenerated },
                { label: "Total Comentários", value: formatNumber(stats.totalComments) },
              ]} />
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <motion.div variants={itemVariants}><DirectivesCard stats={stats} /></motion.div>
              <motion.div variants={itemVariants}><NextStepsCard stats={stats} /></motion.div>
            </div>
            <motion.div variants={itemVariants}><DailyQuoteCard /></motion.div>
            <motion.div variants={itemVariants}><RecentVideosCard videos={recentVideos} /></motion.div>
          </div>
          <div className="space-y-6">
            <motion.div variants={itemVariants}><OperationalLogsCard logs={activityLogs} /></motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
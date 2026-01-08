import { Video, Eye, Coins, TrendingUp, Type, Image, Crown, Rocket } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";
import { useCredits } from "@/hooks/useCredits";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useTutorial } from "@/hooks/useTutorial";
import { useSubscription } from "@/hooks/useSubscription";
import { TutorialModal, TutorialHelpButton } from "@/components/tutorial/TutorialModal";
import { DASHBOARD_TUTORIAL } from "@/lib/tutorialConfigs";
import { StatsCard } from "./StatsCard";
import { MetricsCard } from "./MetricsCard";
import { DirectivesCard } from "./DirectivesCard";
import { NextStepsCard } from "./NextStepsCard";
import { DailyQuoteCard } from "./DailyQuoteCard";
import { RecentVideosCard } from "./RecentVideosCard";
import { OperationalLogsCard } from "./OperationalLogsCard";
import { ProductivityHeatmapCard } from "./ProductivityHeatmapCard";
import { MonthlyComparisonCard } from "./MonthlyComparisonCard";
import { SmartAlertsCard } from "./SmartAlertsCard";
import { ConsistencyScoreCard } from "./ConsistencyScoreCard";
import { CreditsROICard } from "./CreditsROICard";
import { NicheSuggestionsCard } from "./NicheSuggestionsCard";

import { UserGoalsCard } from "./UserGoalsCard";
import { ProductionBoardCard } from "./ProductionBoardCard";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export function Dashboard() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { balance: credits, loading: creditsLoading } = useCredits();
  const { stats, recentVideos, activityLogs, loading, refetch } = useDashboardData();
  const { isSubscribed, planName, subscription, loading: subscriptionLoading } = useSubscription();
  const navigate = useNavigate();
  
  // Tutorial
  const { showTutorial, completeTutorial, openTutorial } = useTutorial(DASHBOARD_TUTORIAL.id);

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
    <div className="flex-1 overflow-auto relative">
      {/* Premium Background Layer */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Radial gradient base */}
        <div 
          className="absolute inset-0"
          style={{ 
            background: 'radial-gradient(ellipse 80% 50% at 50% 0%, hsl(var(--primary) / 0.08) 0%, transparent 50%), radial-gradient(circle at center, #111 0%, #0b0b0b 40%, #050505 100%)' 
          }}
        />
        {/* Golden glow - top right */}
        <div 
          className="absolute top-0 right-1/4 w-[600px] h-[600px] rounded-full blur-[120px]"
          style={{ background: 'radial-gradient(circle, hsl(var(--primary) / 0.12) 0%, transparent 60%)' }}
        />
        {/* Secondary glow - bottom left */}
        <div 
          className="absolute bottom-0 left-1/4 w-[400px] h-[400px] rounded-full blur-[100px]"
          style={{ background: 'radial-gradient(circle, hsl(var(--primary) / 0.06) 0%, transparent 60%)' }}
        />
        {/* Noise/grain overlay */}
        <div 
          className="absolute inset-0 opacity-[0.015]"
          style={{ 
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'repeat'
          }}
        />
      </div>

      <div className="p-6 lg:p-8 max-w-[1400px] mx-auto relative z-10">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-10">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-xs font-medium text-primary uppercase tracking-wider">Painel de Controle</span>
            </div>
            <div className="flex items-center gap-3">
              {!subscriptionLoading && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge 
                        variant={isSubscribed ? "default" : "secondary"}
                        className={`flex items-center gap-1.5 px-3 py-1 cursor-default ${
                          isSubscribed 
                            ? "bg-gradient-to-r from-primary/90 to-primary text-primary-foreground shadow-lg shadow-primary/20" 
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {isSubscribed ? (
                          <Crown className="w-3.5 h-3.5" />
                        ) : (
                          <Rocket className="w-3.5 h-3.5" />
                        )}
                        <span className="font-semibold text-xs uppercase tracking-wide">{planName}</span>
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="bg-card border-border">
                      {isSubscribed && subscription?.subscriptionEnd ? (
                        <p className="text-sm">
                          Expira em: <span className="font-semibold text-primary">
                            {format(new Date(subscription.subscriptionEnd), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                          </span>
                        </p>
                      ) : (
                        <p className="text-sm">Plano gratuito - Faça upgrade para desbloquear recursos</p>
                      )}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              <TutorialHelpButton onClick={openTutorial} />
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
            Bem-vindo, <span className="text-primary">{displayName}</span>
          </h1>
          <p className="text-muted-foreground">Visão geral da sua execução ativa</p>
        </motion.div>

        <motion.div 
          variants={containerVariants} 
          initial="hidden" 
          animate="visible" 
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-10"
          data-tutorial="stats-cards"
        >
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
            />
          </motion.div>
          <motion.div variants={itemVariants}>
            <StatsCard icon={Image} label="Imagens Geradas" value={stats.imagesGenerated} subLabel={stats.imagesGenerated > 0 ? "CRIADAS" : "INÍCIO"} />
          </motion.div>
          <motion.div variants={itemVariants}>
            <StatsCard icon={TrendingUp} label="Vídeos Virais" value={stats.viralVideos} subLabel="100K+ views" />
          </motion.div>
        </motion.div>


        {/* Production Board - Full Width */}
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="mb-6">
          <motion.div variants={itemVariants}>
            <ProductionBoardCard />
          </motion.div>
        </motion.div>

        {/* Insights Row */}
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <motion.div variants={itemVariants} className="h-full">
            <ProductivityHeatmapCard />
          </motion.div>
          <motion.div variants={itemVariants} className="h-full">
            <MonthlyComparisonCard />
          </motion.div>
        </motion.div>

        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <motion.div variants={itemVariants} className="h-full">
            <UserGoalsCard />
          </motion.div>
          <motion.div variants={itemVariants} className="h-full">
            <SmartAlertsCard />
          </motion.div>
          <motion.div variants={itemVariants} className="h-full">
            <ConsistencyScoreCard />
          </motion.div>
          <motion.div variants={itemVariants} className="h-full">
            <CreditsROICard />
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
            <motion.div variants={itemVariants} data-tutorial="recent-activity">
              <RecentVideosCard videos={recentVideos} onRefresh={refetch} />
            </motion.div>
          </div>
          <div className="space-y-6" data-tutorial="sidebar-nav">
            <motion.div variants={itemVariants}><NicheSuggestionsCard /></motion.div>
            <motion.div variants={itemVariants}><OperationalLogsCard logs={activityLogs} /></motion.div>
          </div>
        </motion.div>
      </div>
      
      {/* Tutorial Modal */}
      <TutorialModal
        open={showTutorial}
        onOpenChange={(open) => !open && completeTutorial()}
        title={DASHBOARD_TUTORIAL.title}
        description={DASHBOARD_TUTORIAL.description}
        steps={DASHBOARD_TUTORIAL.steps}
        onComplete={completeTutorial}
      />
    </div>
  );
}
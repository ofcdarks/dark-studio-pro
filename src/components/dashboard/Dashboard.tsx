import { Video, Eye, DollarSign, Coins, HardDrive, TrendingUp } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";
import { StatsCard } from "./StatsCard";
import { MetricsCard } from "./MetricsCard";
import { DirectivesCard } from "./DirectivesCard";
import { NextStepsCard } from "./NextStepsCard";
import { DailyQuoteCard } from "./DailyQuoteCard";
import { RecentVideosCard } from "./RecentVideosCard";
import { OperationalLogsCard } from "./OperationalLogsCard";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export function Dashboard() {
  const { user } = useAuth();
  const { profile } = useProfile();

  const displayName = profile?.full_name || user?.email?.split("@")[0] || "Usuário";
  const credits = profile?.credits ?? 0;
  const storageUsed = profile?.storage_used ?? 0;
  const storageLimit = profile?.storage_limit ?? 1;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.4 }
    },
  };

  return (
    <div className="flex-1 overflow-auto bg-background relative">
      {/* Subtle background effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div 
          className="absolute top-0 right-1/4 w-[500px] h-[500px] rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, hsl(var(--primary) / 0.03) 0%, transparent 60%)' }}
          animate={{ x: [0, 30, 0], y: [0, 20, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, hsl(var(--primary) / 0.02) 0%, transparent 60%)' }}
          animate={{ x: [0, -20, 0], y: [0, -15, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div className="p-6 lg:p-8 max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-10"
        >
          <div className="flex items-center gap-3 mb-2">
            <motion.div 
              className="w-2 h-2 rounded-full bg-primary"
              animate={{ scale: [1, 1.3, 1], opacity: [1, 0.6, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <span className="text-xs font-medium text-primary uppercase tracking-wider">Painel de Controle</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
            Bem-vindo, <span className="text-primary">{displayName}</span>
          </h1>
          <p className="text-muted-foreground">
            Visão geral da sua execução ativa
          </p>
        </motion.div>

        {/* Stats Grid */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-10"
        >
          <motion.div variants={itemVariants}>
            <StatsCard
              icon={Video}
              label="Total de Vídeos"
              value={0}
              subLabel="SEM DADOS"
            />
          </motion.div>
          <motion.div variants={itemVariants}>
            <StatsCard
              icon={Eye}
              label="Total de Views"
              value="0"
              subLabel="SEM DADOS"
            />
          </motion.div>
          <motion.div variants={itemVariants}>
            <StatsCard
              icon={DollarSign}
              label="Receita Total"
              value="$0"
              subLabel="SEM DADOS"
            />
          </motion.div>
          <motion.div variants={itemVariants}>
            <StatsCard
              icon={Coins}
              label="Créditos Disponíveis"
              value={credits.toLocaleString()}
              status="active"
              action={
                <Button size="sm" className="w-full gradient-button text-primary-foreground text-xs">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Rebalancear
                </Button>
              }
            />
          </motion.div>
          <motion.div variants={itemVariants}>
            <StatsCard
              icon={HardDrive}
              label="Armazenamento"
              value={`${storageUsed.toFixed(1)} GB`}
              progress={{ value: storageUsed, max: storageLimit }}
            />
          </motion.div>
          <motion.div variants={itemVariants}>
            <StatsCard
              icon={TrendingUp}
              label="Vídeos Virais"
              value={0}
            />
          </motion.div>
        </motion.div>

        {/* Main Content Grid */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Metrics */}
            <motion.div variants={itemVariants}>
              <MetricsCard
                title="Métricas de Performance"
                metrics={[
                  { label: "CTR Médio", value: "0.0%" },
                  { label: "Total de Likes", value: "0" },
                  { label: "Total de Comentários", value: "0" },
                  { label: "RPM Médio", value: "$0.00" },
                ]}
              />
            </motion.div>

            {/* Directives and Next Steps */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <motion.div variants={itemVariants}>
                <DirectivesCard />
              </motion.div>
              <motion.div variants={itemVariants}>
                <NextStepsCard />
              </motion.div>
            </div>

            {/* Daily Quote */}
            <motion.div variants={itemVariants}>
              <DailyQuoteCard />
            </motion.div>

            {/* Recent Videos */}
            <motion.div variants={itemVariants}>
              <RecentVideosCard />
            </motion.div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <motion.div variants={itemVariants}>
              <OperationalLogsCard />
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
import { Video, Eye, DollarSign, Coins, HardDrive, TrendingUp } from "lucide-react";
import { StatsCard } from "./StatsCard";
import { MetricsCard } from "./MetricsCard";
import { DirectivesCard } from "./DirectivesCard";
import { NextStepsCard } from "./NextStepsCard";
import { DailyQuoteCard } from "./DailyQuoteCard";
import { RecentVideosCard } from "./RecentVideosCard";
import { OperationalLogsCard } from "./OperationalLogsCard";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

export function Dashboard() {
  return (
    <div className="flex-1 overflow-auto">
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Bem-vindo, Admin!
          </h1>
          <p className="text-muted-foreground">
            Visão geral da sua execução ativa
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <StatsCard
            icon={Video}
            label="Total de Vídeos"
            value={170}
            subLabel="SEM DADOS"
          />
          <StatsCard
            icon={Eye}
            label="Total de Views"
            value="5.6K"
            subLabel="SEM DADOS"
          />
          <StatsCard
            icon={DollarSign}
            label="Receita Total"
            value="$17"
            subLabel="SEM DADOS"
          />
          <StatsCard
            icon={Coins}
            label="Créditos Disponíveis"
            value="9018"
            status="active"
            action={
              <Button size="sm" className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                <Sparkles className="w-4 h-4 mr-2" />
                Rebalancear Créditos
              </Button>
            }
          />
          <StatsCard
            icon={HardDrive}
            label="Armazenamento"
            value="0.18 GB"
            progress={{ value: 0.18, max: 1 }}
          />
          <StatsCard
            icon={TrendingUp}
            label="Vídeos Virais"
            value={0}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Metrics */}
            <MetricsCard
              title="Métricas de Performance"
              metrics={[
                { label: "CTR Médio", value: "0.0%" },
                { label: "Total de Likes", value: "129" },
                { label: "Total de Comentários", value: "7" },
                { label: "RPM Médio", value: "$3.11" },
              ]}
            />

            {/* Directives and Next Steps */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <DirectivesCard />
              <NextStepsCard />
            </div>

            {/* Daily Quote */}
            <DailyQuoteCard />

            {/* Recent Videos */}
            <RecentVideosCard />
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <OperationalLogsCard />
          </div>
        </div>
      </div>
    </div>
  );
}

import { MainLayout } from "@/components/layout/MainLayout";
import { Card } from "@/components/ui/card";
import { BarChart3, TrendingUp, Eye, DollarSign, ThumbsUp, Calendar } from "lucide-react";

const Analytics = () => {
  return (
    <MainLayout>
      <div className="flex-1 overflow-auto p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Analytics</h1>
            <p className="text-muted-foreground">
              Acompanhe o desempenho dos seus vídeos e canal
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                  <Eye className="w-5 h-5 text-primary" />
                </div>
                <span className="text-muted-foreground text-sm">Views Totais</span>
              </div>
              <p className="text-3xl font-bold text-foreground">5.6K</p>
              <p className="text-sm text-success mt-1">+12% vs mês anterior</p>
            </Card>
            <Card className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-primary" />
                </div>
                <span className="text-muted-foreground text-sm">Receita</span>
              </div>
              <p className="text-3xl font-bold text-foreground">$17</p>
              <p className="text-sm text-success mt-1">+8% vs mês anterior</p>
            </Card>
            <Card className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                  <ThumbsUp className="w-5 h-5 text-primary" />
                </div>
                <span className="text-muted-foreground text-sm">Engajamento</span>
              </div>
              <p className="text-3xl font-bold text-foreground">2.3%</p>
              <p className="text-sm text-destructive mt-1">-2% vs mês anterior</p>
            </Card>
            <Card className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-primary" />
                </div>
                <span className="text-muted-foreground text-sm">CTR Médio</span>
              </div>
              <p className="text-3xl font-bold text-foreground">4.5%</p>
              <p className="text-sm text-success mt-1">+5% vs mês anterior</p>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold text-foreground">Views por Dia</h3>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  Últimos 30 dias
                </div>
              </div>
              <div className="h-64 flex items-center justify-center bg-secondary/30 rounded-lg">
                <p className="text-muted-foreground">Gráfico de views</p>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold text-foreground">Receita por Dia</h3>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  Últimos 30 dias
                </div>
              </div>
              <div className="h-64 flex items-center justify-center bg-secondary/30 rounded-lg">
                <p className="text-muted-foreground">Gráfico de receita</p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Analytics;

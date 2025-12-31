import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, TrendingUp, Users, DollarSign, Percent, Download, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface SubscriptionStats {
  mrr: number;
  arr: number;
  activeSubscribers: number;
  churnRate: number;
  newSubscriptions: number;
  cancellations: number;
  avgTicket: number;
  avgDays: number;
}

export function AdminSubscriptionsTab() {
  const [period, setPeriod] = useState("30");
  const [status, setStatus] = useState("all");
  const [stats, setStats] = useState<SubscriptionStats>({
    mrr: 424.72,
    arr: 5096.6,
    activeSubscribers: 3,
    churnRate: 0,
    newSubscriptions: 3,
    cancellations: 0,
    avgTicket: 141.57,
    avgDays: 36,
  });
  const [loading, setLoading] = useState(false);
  const [subscribers, setSubscribers] = useState<any[]>([]);

  useEffect(() => {
    fetchSubscribers();
  }, []);

  const fetchSubscribers = async () => {
    setLoading(true);
    // For now, we'll show sample data since subscriptions are managed externally
    setSubscribers([
      {
        id: "1",
        email: "juniopedromartins21@gmail.com",
        whatsapp: "94439788521",
        plan: "RE 149,90",
        status: "Ativo",
        start_date: "20/12/2024",
        renewal_date: "20/01/2025",
      },
      {
        id: "2",
        email: "edson.te189@gmail.com",
        whatsapp: "MA27995921",
        plan: "RE 149,90",
        status: "Ativo",
        start_date: "15/12/2024",
        renewal_date: "15/01/2025",
      },
    ]);
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div>
          <label className="text-sm text-muted-foreground mb-1 block">Período</label>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-40 bg-secondary border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="90">Últimos 90 dias</SelectItem>
              <SelectItem value="365">Último ano</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm text-muted-foreground mb-1 block">Status</label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-40 bg-secondary border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="active">Ativos</SelectItem>
              <SelectItem value="cancelled">Cancelados</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2 ml-auto mt-5">
          <Button variant="outline" onClick={fetchSubscribers}>
            <RefreshCw className="w-4 h-4 mr-1" />
            Atualizar
          </Button>
          <Button className="bg-destructive text-destructive-foreground">
            <Download className="w-4 h-4 mr-1" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <Card className="p-6">
        <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          Resumo Geral
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-secondary/50 rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Receita Total</p>
            <p className="text-2xl font-bold text-foreground">
              R$ {stats.mrr.toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground">+0% vs anterior</p>
          </div>
          <div className="p-4 bg-secondary/50 rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Receita Média</p>
            <p className="text-2xl font-bold text-foreground">
              R$ {stats.mrr.toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground">Por período</p>
          </div>
          <div className="p-4 bg-secondary/50 rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Total Assinaturas</p>
            <p className="text-2xl font-bold text-foreground">{stats.activeSubscribers}</p>
          </div>
          <div className="p-4 bg-secondary/50 rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Taxa de Conversão</p>
            <p className="text-2xl font-bold text-foreground">15.00%</p>
          </div>
        </div>
      </Card>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 border-l-4 border-l-green-500">
          <p className="text-xs text-muted-foreground mb-1">MRR</p>
          <p className="text-xl font-bold text-foreground">R$ {stats.mrr.toFixed(2)}</p>
          <p className="text-xs text-green-500">Receita recorrente mensal</p>
        </Card>
        <Card className="p-4 border-l-4 border-l-blue-500">
          <p className="text-xs text-muted-foreground mb-1">ARR</p>
          <p className="text-xl font-bold text-foreground">R$ {stats.arr.toFixed(2)}</p>
          <p className="text-xs text-blue-500">Receita recorrente anual</p>
        </Card>
        <Card className="p-4 border-l-4 border-l-purple-500">
          <p className="text-xs text-muted-foreground mb-1">Assinantes Ativos</p>
          <p className="text-xl font-bold text-foreground">{stats.activeSubscribers}</p>
          <p className="text-xs text-purple-500">Total de assinantes ativos</p>
        </Card>
        <Card className="p-4 border-l-4 border-l-red-500">
          <p className="text-xs text-muted-foreground mb-1">Churn Rate</p>
          <p className="text-xl font-bold text-foreground">{stats.churnRate.toFixed(2)}%</p>
          <p className="text-xs text-red-500">Taxa de cancelamento</p>
        </Card>
      </div>

      {/* Additional Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Novas Assinaturas</p>
          <p className="text-xl font-bold text-foreground">{stats.newSubscriptions}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Cancelamentos</p>
          <p className="text-xl font-bold text-foreground">{stats.cancellations}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Ticket Médio</p>
          <p className="text-xl font-bold text-foreground">R$ {stats.avgTicket.toFixed(2)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Média de Dias</p>
          <p className="text-xl font-bold text-foreground">{stats.avgDays} dias</p>
        </Card>
      </div>

      {/* Monthly Analysis */}
      <Card className="p-6">
        <h3 className="font-semibold text-foreground mb-4">Análise Mensal</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Receita Mês</p>
            <p className="text-lg font-bold text-foreground">R$ {stats.mrr.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Lucro Real</p>
            <p className="text-lg font-bold text-foreground">R$ 0</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Variação %</p>
            <p className="text-lg font-bold text-foreground">-50.00%</p>
          </div>
        </div>
      </Card>

      {/* Subscribers List */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-foreground">Lista de Assinantes</h3>
          <div className="flex gap-2">
            <Input placeholder="Buscar email ou nome..." className="w-64 bg-secondary" />
            <Button className="bg-success text-success-foreground">Exportar</Button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>EMAIL</TableHead>
                <TableHead>WHATSAPP</TableHead>
                <TableHead>PLANO</TableHead>
                <TableHead>STATUS</TableHead>
                <TableHead>ÚLTIMA ATUALIZAÇÃO</TableHead>
                <TableHead>AÇÕES</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subscribers.map((sub) => (
                <TableRow key={sub.id}>
                  <TableCell className="text-primary">{sub.email}</TableCell>
                  <TableCell className="text-muted-foreground">{sub.whatsapp}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{sub.plan}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={sub.status === "Ativo" ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"}>
                      {sub.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{sub.start_date}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" className="text-primary">
                        Zerar
                      </Button>
                      <Button size="sm" variant="secondary">
                        Histórico
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Reports */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">Relatório de Receitas</h3>
            <Button variant="destructive" size="sm">
              <Download className="w-4 h-4 mr-1" />
              Exportar
            </Button>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Receita Total (mês corrente)</span>
              <span className="font-medium text-foreground">R$ {stats.mrr.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Reembolsos (últimos 30 dias)</span>
              <span className="font-medium text-foreground">R$ 0.00</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Receita Líquida</span>
              <span className="font-medium text-foreground">R$ 0.00</span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="text-sm font-semibold text-foreground">Total Médio</span>
              <span className="font-bold text-foreground">R$ {stats.avgTicket.toFixed(2)}</span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">Relatório de Assinantes</h3>
            <Button variant="destructive" size="sm">
              <Download className="w-4 h-4 mr-1" />
              Exportar
            </Button>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Assinantes ativos</span>
              <span className="font-medium text-foreground">{stats.activeSubscribers}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Novas assinaturas (últimos 30 dias)</span>
              <span className="font-medium text-foreground">{stats.newSubscriptions}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Taxa de Conversão</span>
              <span className="font-medium text-foreground">100.00%</span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="text-sm font-semibold text-foreground">Taxa de Churn</span>
              <span className="font-bold text-foreground">{stats.churnRate.toFixed(2)}%</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

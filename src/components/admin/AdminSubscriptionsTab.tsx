import { useState, useEffect, useMemo } from "react";
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
import { Loader2, TrendingUp, Download, RefreshCw, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { toast } from "sonner";

interface Subscriber {
  id: string;
  email: string;
  whatsapp: string | null;
  plan: string;
  status: string;
  start_date: string;
  renewal_date: string;
}

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
  const [searchTerm, setSearchTerm] = useState("");
  const [stats, setStats] = useState<SubscriptionStats>({
    mrr: 424.72,
    arr: 5096.6,
    activeSubscribers: 0,
    churnRate: 0,
    newSubscriptions: 0,
    cancellations: 0,
    avgTicket: 141.57,
    avgDays: 36,
  });
  const [loading, setLoading] = useState(false);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);

  useEffect(() => {
    fetchSubscribers();
  }, []);

  const fetchSubscribers = async () => {
    setLoading(true);
    try {
      // Get users with Pro role
      const { data: proUsers } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "pro");

      if (proUsers && proUsers.length > 0) {
        const userIds = proUsers.map((u) => u.user_id);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, email, whatsapp, created_at, status")
          .in("id", userIds);

        const subs: Subscriber[] = (profiles || []).map((p) => ({
          id: p.id,
          email: p.email || "",
          whatsapp: p.whatsapp,
          plan: "PRO",
          status: p.status === "active" ? "Ativo" : "Inativo",
          start_date: p.created_at ? format(new Date(p.created_at), "dd/MM/yyyy") : "N/A",
          renewal_date: p.created_at
            ? format(new Date(new Date(p.created_at).setMonth(new Date(p.created_at).getMonth() + 1)), "dd/MM/yyyy")
            : "N/A",
        }));

        setSubscribers(subs);
        setStats((prev) => ({
          ...prev,
          activeSubscribers: subs.filter((s) => s.status === "Ativo").length,
          newSubscriptions: subs.length,
        }));
      }
    } catch (error) {
      console.error("Error fetching subscribers:", error);
    } finally {
      setLoading(false);
    }
  };

  // Dynamic search
  const filteredSubscribers = useMemo(() => {
    let filtered = subscribers;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.email.toLowerCase().includes(term) ||
          s.whatsapp?.toLowerCase().includes(term)
      );
    }

    if (status !== "all") {
      filtered = filtered.filter((s) =>
        status === "active" ? s.status === "Ativo" : s.status !== "Ativo"
      );
    }

    return filtered;
  }, [subscribers, searchTerm, status]);

  const handleExport = () => {
    const csvContent = filteredSubscribers
      .map((s) => `${s.email},${s.whatsapp || ""},${s.plan},${s.status},${s.start_date}`)
      .join("\n");

    const blob = new Blob([`Email,WhatsApp,Plano,Status,Data Início\n${csvContent}`], {
      type: "text/csv",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `assinaturas_${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    toast.success("Arquivo exportado!");
  };

  const handleCancelSubscription = async (userId: string) => {
    const { error } = await supabase
      .from("user_roles")
      .update({ role: "free" })
      .eq("user_id", userId);

    if (error) {
      toast.error("Erro ao cancelar assinatura");
    } else {
      toast.success("Assinatura cancelada!");
      fetchSubscribers();
    }
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
          <Button variant="outline" onClick={fetchSubscribers} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-1 ${loading ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
          <Button className="bg-destructive text-destructive-foreground" onClick={handleExport}>
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
            <p className="text-2xl font-bold text-foreground">R$ {stats.mrr.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">+0% vs anterior</p>
          </div>
          <div className="p-4 bg-secondary/50 rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Receita Média</p>
            <p className="text-2xl font-bold text-foreground">R$ {stats.mrr.toFixed(2)}</p>
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

      {/* Subscribers List */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-foreground">Lista de Assinantes</h3>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar email ou whatsapp..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64 bg-secondary pl-10"
              />
            </div>
            <Button className="bg-success text-success-foreground" onClick={handleExport}>
              Exportar
            </Button>
          </div>
        </div>

        {searchTerm && (
          <p className="text-xs text-muted-foreground mb-4">
            {filteredSubscribers.length} resultado(s) encontrado(s)
          </p>
        )}

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
                <TableHead>DATA INÍCIO</TableHead>
                <TableHead>AÇÕES</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSubscribers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    {searchTerm ? "Nenhum assinante encontrado" : "Nenhum assinante cadastrado"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredSubscribers.map((sub) => (
                  <TableRow key={sub.id}>
                    <TableCell className="text-primary">{sub.email}</TableCell>
                    <TableCell className="text-muted-foreground">{sub.whatsapp || "N/A"}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{sub.plan}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          sub.status === "Ativo"
                            ? "bg-success/20 text-success"
                            : "bg-destructive/20 text-destructive"
                        }
                      >
                        {sub.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{sub.start_date}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-destructive"
                          onClick={() => handleCancelSubscription(sub.id)}
                        >
                          Cancelar
                        </Button>
                        <Button size="sm" variant="secondary">
                          Histórico
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Reports */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">Relatório de Receitas</h3>
            <Button variant="destructive" size="sm" onClick={handleExport}>
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
            <Button variant="destructive" size="sm" onClick={handleExport}>
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

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
import { Loader2, TrendingUp, Download, RefreshCw, Search, Crown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays, differenceInDays } from "date-fns";
import { toast } from "sonner";

interface PlanInfo {
  plan_name: string;
  price_amount: number;
  monthly_credits: number;
  is_annual: boolean;
}

interface Subscriber {
  id: string;
  email: string;
  full_name: string | null;
  whatsapp: string | null;
  plan: string;
  planPrice: number;
  status: string;
  start_date: string;
  created_at: string;
  credits: number;
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
  totalUsers: number;
  freeUsers: number;
}

export function AdminSubscriptionsTab() {
  const [period, setPeriod] = useState("30");
  const [status, setStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [stats, setStats] = useState<SubscriptionStats>({
    mrr: 0,
    arr: 0,
    activeSubscribers: 0,
    churnRate: 0,
    newSubscriptions: 0,
    cancellations: 0,
    avgTicket: 0,
    avgDays: 0,
    totalUsers: 0,
    freeUsers: 0,
  });
  const [loading, setLoading] = useState(false);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [plans, setPlans] = useState<PlanInfo[]>([]);

  useEffect(() => {
    fetchPlans();
  }, []);

  useEffect(() => {
    if (plans.length > 0) {
      fetchSubscribers();
    }
  }, [plans, period]);

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from("plan_permissions")
        .select("plan_name, price_amount, monthly_credits, is_annual")
        .eq("is_annual", false);

      if (error) throw error;
      setPlans((data || []) as PlanInfo[]);
    } catch (error) {
      console.error("Error fetching plans:", error);
    }
  };

  const fetchSubscribers = async () => {
    setLoading(true);
    try {
      const periodDays = parseInt(period);
      const startDate = subDays(new Date(), periodDays);

      // Get all users with roles (excluding admin)
      const { data: userRoles } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .neq("role", "admin");

      if (!userRoles) {
        setLoading(false);
        return;
      }

      // Get pro users
      const proUserIds = userRoles.filter(u => u.role === "pro").map(u => u.user_id);
      const freeUserIds = userRoles.filter(u => u.role === "free").map(u => u.user_id);

      // Get profiles for pro users
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, email, full_name, whatsapp, created_at, status")
        .in("id", proUserIds);

      // Get credits for pro users
      const { data: userCredits } = await supabase
        .from("user_credits")
        .select("user_id, balance")
        .in("user_id", proUserIds);

      // Get credit transactions to determine plan
      const { data: transactions } = await supabase
        .from("credit_transactions")
        .select("user_id, amount, description, created_at")
        .in("user_id", proUserIds)
        .eq("transaction_type", "add")
        .order("created_at", { ascending: false });

      // Map subscribers with plan info
      const subs: Subscriber[] = (profiles || []).map((p) => {
        const credits = userCredits?.find(c => c.user_id === p.id)?.balance || 0;
        
        // Try to determine plan from transactions
        const userTx = transactions?.find(t => t.user_id === p.id);
        let planName = "PRO";
        let planPrice = 79.90; // Default to START CREATOR
        
        if (userTx?.description) {
          if (userTx.description.includes("MASTER")) {
            planName = "MASTER PRO";
            planPrice = 149.90;
          } else if (userTx.description.includes("TURBO")) {
            planName = "TURBO MAKER";
            planPrice = 99.90;
          } else if (userTx.description.includes("START")) {
            planName = "START CREATOR";
            planPrice = 79.90;
          }
        } else {
          // Fallback: determine by credits amount
          const plan = plans.find(pl => pl.monthly_credits === credits);
          if (plan) {
            planName = plan.plan_name;
            planPrice = plan.price_amount || 79.90;
          }
        }

        return {
          id: p.id,
          email: p.email || "",
          full_name: p.full_name,
          whatsapp: p.whatsapp,
          plan: planName,
          planPrice,
          status: p.status === "active" ? "Ativo" : p.status === "blocked" ? "Bloqueado" : "Inativo",
          start_date: p.created_at ? format(new Date(p.created_at), "dd/MM/yyyy") : "N/A",
          created_at: p.created_at || "",
          credits,
        };
      });

      // Calculate stats
      const activeSubscribers = subs.filter(s => s.status === "Ativo").length;
      const mrr = subs
        .filter(s => s.status === "Ativo")
        .reduce((sum, s) => sum + s.planPrice, 0);
      
      const newSubscriptions = subs.filter(s => {
        if (!s.created_at) return false;
        const createdDate = new Date(s.created_at);
        return createdDate >= startDate;
      }).length;

      const avgTicket = activeSubscribers > 0 ? mrr / activeSubscribers : 0;
      
      // Calculate average days as subscriber
      const avgDays = subs.length > 0
        ? Math.round(
            subs.reduce((sum, s) => {
              if (!s.created_at) return sum;
              return sum + differenceInDays(new Date(), new Date(s.created_at));
            }, 0) / subs.length
          )
        : 0;

      // Calculate churn (cancelled in period / total at start)
      const totalWithAdmin = userRoles.length;
      const conversionRate = totalWithAdmin > 0 
        ? ((activeSubscribers / totalWithAdmin) * 100) 
        : 0;

      setSubscribers(subs);
      setStats({
        mrr,
        arr: mrr * 12,
        activeSubscribers,
        churnRate: 0, // Would need historical data to calculate properly
        newSubscriptions,
        cancellations: 0, // Would need to track cancellation events
        avgTicket,
        avgDays,
        totalUsers: totalWithAdmin,
        freeUsers: freeUserIds.length,
      });
    } catch (error) {
      console.error("Error fetching subscribers:", error);
      toast.error("Erro ao carregar assinantes");
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
          s.full_name?.toLowerCase().includes(term) ||
          s.whatsapp?.toLowerCase().includes(term) ||
          s.plan.toLowerCase().includes(term)
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
      .map((s) => `${s.email},${s.full_name || ""},${s.whatsapp || ""},${s.plan},R$ ${s.planPrice.toFixed(2)},${s.status},${s.start_date},${s.credits}`)
      .join("\n");

    const blob = new Blob([`Email,Nome,WhatsApp,Plano,Valor,Status,Data Início,Créditos\n${csvContent}`], {
      type: "text/csv",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `assinaturas_${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    toast.success("Arquivo exportado!");
  };

  const handleCancelSubscription = async (userId: string, email: string) => {
    if (!confirm(`Tem certeza que deseja cancelar a assinatura de ${email}?`)) return;
    
    const { error } = await supabase
      .from("user_roles")
      .update({ role: "free" })
      .eq("user_id", userId);

    if (error) {
      toast.error("Erro ao cancelar assinatura");
    } else {
      toast.success("Assinatura cancelada! Usuário rebaixado para plano Free.");
      fetchSubscribers();
    }
  };

  const getPlanBadgeColor = (plan: string) => {
    if (plan.includes("MASTER")) return "bg-purple-500/20 text-purple-400 border-purple-500/50";
    if (plan.includes("TURBO")) return "bg-primary/20 text-primary border-primary/50";
    if (plan.includes("START")) return "bg-blue-500/20 text-blue-400 border-blue-500/50";
    return "bg-muted text-muted-foreground border-border";
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
              <SelectItem value="cancelled">Inativos</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2 ml-auto mt-5">
          <Button variant="outline" onClick={fetchSubscribers} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-1 ${loading ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
          <Button variant="secondary" onClick={handleExport}>
            <Download className="w-4 h-4 mr-1" />
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <Card className="p-6">
        <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          Resumo Geral (excluindo admins)
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-secondary/50 rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">MRR (Receita Mensal)</p>
            <p className="text-2xl font-bold text-success">R$ {stats.mrr.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">{stats.activeSubscribers} assinantes ativos</p>
          </div>
          <div className="p-4 bg-secondary/50 rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">ARR (Receita Anual)</p>
            <p className="text-2xl font-bold text-foreground">R$ {stats.arr.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">Projeção anual</p>
          </div>
          <div className="p-4 bg-secondary/50 rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Total Usuários</p>
            <p className="text-2xl font-bold text-foreground">{stats.totalUsers}</p>
            <p className="text-xs text-muted-foreground">{stats.freeUsers} gratuitos</p>
          </div>
          <div className="p-4 bg-secondary/50 rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Taxa de Conversão</p>
            <p className="text-2xl font-bold text-primary">
              {stats.totalUsers > 0 ? ((stats.activeSubscribers / stats.totalUsers) * 100).toFixed(1) : 0}%
            </p>
            <p className="text-xs text-muted-foreground">Free → Pago</p>
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
          <p className="text-xs text-muted-foreground mb-1">Ticket Médio</p>
          <p className="text-xl font-bold text-foreground">R$ {stats.avgTicket.toFixed(2)}</p>
          <p className="text-xs text-blue-500">Por assinante</p>
        </Card>
        <Card className="p-4 border-l-4 border-l-purple-500">
          <p className="text-xs text-muted-foreground mb-1">Assinantes Ativos</p>
          <p className="text-xl font-bold text-foreground">{stats.activeSubscribers}</p>
          <p className="text-xs text-purple-500">Planos pagos ativos</p>
        </Card>
        <Card className="p-4 border-l-4 border-l-primary">
          <p className="text-xs text-muted-foreground mb-1">Novos no Período</p>
          <p className="text-xl font-bold text-foreground">{stats.newSubscriptions}</p>
          <p className="text-xs text-primary">Últimos {period} dias</p>
        </Card>
      </div>

      {/* Subscribers List */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <Crown className="w-5 h-5 text-primary" />
            Lista de Assinantes Pro
          </h3>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar email, nome, plano..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64 bg-secondary pl-10"
              />
            </div>
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
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>EMAIL</TableHead>
                  <TableHead>NOME</TableHead>
                  <TableHead>WHATSAPP</TableHead>
                  <TableHead>PLANO</TableHead>
                  <TableHead>VALOR</TableHead>
                  <TableHead>CRÉDITOS</TableHead>
                  <TableHead>STATUS</TableHead>
                  <TableHead>DESDE</TableHead>
                  <TableHead>AÇÕES</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubscribers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                      {searchTerm ? "Nenhum assinante encontrado" : "Nenhum assinante Pro cadastrado"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSubscribers.map((sub) => (
                    <TableRow key={sub.id}>
                      <TableCell className="text-primary font-medium">{sub.email}</TableCell>
                      <TableCell className="text-foreground">{sub.full_name || "N/A"}</TableCell>
                      <TableCell className="text-muted-foreground">{sub.whatsapp || "N/A"}</TableCell>
                      <TableCell>
                        <Badge className={getPlanBadgeColor(sub.plan)}>{sub.plan}</Badge>
                      </TableCell>
                      <TableCell className="text-success font-medium">
                        R$ {sub.planPrice.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono">
                          {sub.credits.toLocaleString()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            sub.status === "Ativo"
                              ? "bg-success/20 text-success border-success/50"
                              : "bg-destructive/20 text-destructive border-destructive/50"
                          }
                        >
                          {sub.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{sub.start_date}</TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-destructive hover:bg-destructive/10"
                          onClick={() => handleCancelSubscription(sub.id, sub.email)}
                        >
                          Cancelar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* Reports */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">Distribuição por Plano</h3>
          </div>
          <div className="space-y-3">
            {["MASTER PRO", "TURBO MAKER", "START CREATOR"].map((planName) => {
              const count = subscribers.filter(s => s.plan === planName && s.status === "Ativo").length;
              const revenue = subscribers
                .filter(s => s.plan === planName && s.status === "Ativo")
                .reduce((sum, s) => sum + s.planPrice, 0);
              const percentage = stats.activeSubscribers > 0 
                ? ((count / stats.activeSubscribers) * 100).toFixed(0) 
                : 0;
              
              return (
                <div key={planName} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge className={getPlanBadgeColor(planName)}>{planName}</Badge>
                    <span className="text-sm text-muted-foreground">{count} assinantes</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-foreground">R$ {revenue.toFixed(2)}/mês</p>
                    <p className="text-xs text-muted-foreground">{percentage}% do total</p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">Métricas de Retenção</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Tempo médio como assinante</span>
              <span className="font-medium text-foreground">{stats.avgDays} dias</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Usuários Free</span>
              <span className="font-medium text-foreground">{stats.freeUsers}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Usuários Pro</span>
              <span className="font-medium text-foreground">{stats.activeSubscribers}</span>
            </div>
            <div className="flex justify-between border-t border-border pt-2 mt-2">
              <span className="text-sm font-semibold text-foreground">LTV Estimado</span>
              <span className="font-bold text-success">
                R$ {(stats.avgTicket * (stats.avgDays / 30)).toFixed(2)}
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

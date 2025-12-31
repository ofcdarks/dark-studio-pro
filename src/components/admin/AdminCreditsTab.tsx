import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { Settings, Search, Plus, RefreshCw, Loader2, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

interface UserCredit {
  id: string;
  user_id: string;
  balance: number;
  updated_at: string | null;
  email?: string;
  full_name?: string;
}

export function AdminCreditsTab() {
  const [initialBalance, setInitialBalance] = useState("50");
  const [costMultiplier, setCostMultiplier] = useState("2");
  const [searchBalance, setSearchBalance] = useState("");
  const [searchUser, setSearchUser] = useState("");
  const [addCreditsSearch, setAddCreditsSearch] = useState("");
  const [creditsAmount, setCreditsAmount] = useState("1000");
  const [creditsReason, setCreditsReason] = useState("");
  const [minBalance, setMinBalance] = useState("0");
  const [usersWithCredits, setUsersWithCredits] = useState<UserCredit[]>([]);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    fetchUsersWithCredits();
    loadGlobalSettings();
  }, []);

  const loadGlobalSettings = async () => {
    const { data } = await supabase
      .from("admin_settings")
      .select("value")
      .eq("key", "global_credits")
      .single();
    if (data?.value) {
      const settings = data.value as { initial_balance?: number; cost_multiplier?: number };
      setInitialBalance(String(settings.initial_balance || 50));
      setCostMultiplier(String(settings.cost_multiplier || 2));
    }
  };

  const saveGlobalSettings = async () => {
    const { error } = await supabase
      .from("admin_settings")
      .update({
        value: { initial_balance: Number(initialBalance), cost_multiplier: Number(costMultiplier) },
        updated_at: new Date().toISOString(),
      })
      .eq("key", "global_credits");

    if (error) {
      toast.error("Erro ao salvar configurações");
    } else {
      toast.success("Configurações salvas!");
    }
  };

  const fetchUsersWithCredits = async () => {
    setLoading(true);
    try {
      const { data: credits } = await supabase
        .from("user_credits")
        .select("*")
        .gte("balance", Number(minBalance) || 0)
        .order("balance", { ascending: false })
        .limit(20);

      if (credits) {
        const userIds = credits.map((c) => c.user_id);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, email, full_name")
          .in("id", userIds);

        const enriched = credits.map((credit) => {
          const profile = profiles?.find((p) => p.id === credit.user_id);
          return {
            ...credit,
            email: profile?.email || "",
            full_name: profile?.full_name || "",
          };
        });
        setUsersWithCredits(enriched);
      }
    } catch (error) {
      console.error("Error fetching credits:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCredits = async () => {
    if (!addCreditsSearch.trim() || !creditsAmount) {
      toast.error("Preencha email e quantidade");
      return;
    }

    // Find user by email
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", addCreditsSearch.trim())
      .single();

    if (!profile) {
      toast.error("Usuário não encontrado");
      return;
    }

    // Get current balance
    const { data: currentCredits } = await supabase
      .from("user_credits")
      .select("balance")
      .eq("user_id", profile.id)
      .single();

    const newBalance = (currentCredits?.balance || 0) + Number(creditsAmount);

    // Update or insert credits
    const { error } = await supabase
      .from("user_credits")
      .upsert({
        user_id: profile.id,
        balance: newBalance,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      toast.error("Erro ao adicionar créditos");
    } else {
      // Log transaction
      await supabase.from("credit_transactions").insert({
        user_id: profile.id,
        amount: Number(creditsAmount),
        transaction_type: "add",
        description: creditsReason || "Créditos adicionados pelo admin",
      });

      toast.success(`${creditsAmount} créditos adicionados!`);
      setAddCreditsSearch("");
      setCreditsAmount("1000");
      setCreditsReason("");
      fetchUsersWithCredits();
    }
  };

  const handleViewBalance = async () => {
    if (!searchBalance.trim()) return;
    
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, email")
      .or(`email.ilike.%${searchBalance}%,full_name.ilike.%${searchBalance}%`)
      .limit(1)
      .single();

    if (!profile) {
      toast.error("Usuário não encontrado");
      return;
    }

    const { data: credits } = await supabase
      .from("user_credits")
      .select("balance")
      .eq("user_id", profile.id)
      .single();

    toast.info(`Saldo de ${profile.email}: ${credits?.balance || 0} créditos`);
  };

  return (
    <div className="space-y-6">
      {/* Global Configs */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Settings className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Configurações Globais</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">
              Saldo inicial (créditos dados automaticamente a novos usuários)
            </label>
            <Input
              value={initialBalance}
              onChange={(e) => setInitialBalance(e.target.value)}
              className="bg-secondary border-border"
              type="number"
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">
              Multiplicador de Custo para Geração de Voz (TTS)
            </label>
            <Input
              value={costMultiplier}
              onChange={(e) => setCostMultiplier(e.target.value)}
              className="bg-secondary border-border"
              type="number"
              step="0.1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Ex: 2.0 = dobra o custo, 0.5 = metade do custo
            </p>
          </div>
        </div>
        <Button onClick={saveGlobalSettings} className="w-full bg-primary">
          Salvar Configurações
        </Button>
      </Card>

      {/* Check Balance */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Search className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Consultar Saldo</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-2">Buscar por Email, Nome ou WhatsApp</p>
        <div className="flex gap-2">
          <Input
            placeholder="Ex: usuario@gmail.com, nome ou 5517999999999"
            value={searchBalance}
            onChange={(e) => setSearchBalance(e.target.value)}
            className="bg-secondary border-border flex-1"
          />
          <Button onClick={handleViewBalance} className="bg-primary">
            Ver Saldo
          </Button>
        </div>
      </Card>

      {/* Search Users */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Search className="w-5 h-5 text-muted-foreground" />
          <h3 className="font-semibold text-foreground">Buscar Usuários</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-2">Buscar por Email, Nome ou WhatsApp</p>
        <div className="flex gap-2">
          <Input
            placeholder="Digite para buscar..."
            value={searchUser}
            onChange={(e) => setSearchUser(e.target.value)}
            className="bg-secondary border-border flex-1"
          />
          <Button variant="secondary">Buscar Usuários</Button>
        </div>
      </Card>

      {/* Add Credits */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Plus className="w-5 h-5 text-muted-foreground" />
          <h3 className="font-semibold text-foreground">Adicionar Créditos (Individual)</h3>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">
              Buscar Usuário (Email, Nome ou WhatsApp)
            </label>
            <Input
              placeholder="Digite para buscar..."
              value={addCreditsSearch}
              onChange={(e) => setAddCreditsSearch(e.target.value)}
              className="bg-secondary border-border"
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">
              Quantidade de Créditos ou Recorte
            </label>
            <Select defaultValue="custom">
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue placeholder="Valor Personalizado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="custom">Valor Personalizado</SelectItem>
                <SelectItem value="100">100 créditos</SelectItem>
                <SelectItem value="500">500 créditos</SelectItem>
                <SelectItem value="1000">1000 créditos</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Input
              placeholder="Ex: 1000"
              value={creditsAmount}
              onChange={(e) => setCreditsAmount(e.target.value)}
              className="bg-secondary border-border"
              type="number"
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Descrição (opcional)</label>
            <Input
              placeholder="Ex: Bônus inicial"
              value={creditsReason}
              onChange={(e) => setCreditsReason(e.target.value)}
              className="bg-secondary border-border"
            />
          </div>
          <Button onClick={handleAddCredits} className="w-full bg-primary">
            Adicionar Créditos
          </Button>
        </div>
      </Card>

      {/* Users with Balance */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">Usuários com Saldo Disponível</h3>
          </div>
          <Button size="sm" variant="outline" onClick={fetchUsersWithCredits}>
            <RefreshCw className="w-4 h-4 mr-1" />
            Atualizar
          </Button>
        </div>
        <div className="flex items-center gap-2 mb-4">
          <label className="text-sm text-muted-foreground">Saldo Mínimo</label>
          <Input
            value={minBalance}
            onChange={(e) => setMinBalance(e.target.value)}
            className="w-24 bg-secondary border-border"
            type="number"
          />
        </div>

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
                  <TableHead>WHATSAPP</TableHead>
                  <TableHead>NOME</TableHead>
                  <TableHead>SALDO</TableHead>
                  <TableHead>ÚLTIMA ATUALIZAÇÃO</TableHead>
                  <TableHead>AÇÕES</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usersWithCredits.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="text-primary">{user.email}</TableCell>
                    <TableCell className="text-muted-foreground">N/A</TableCell>
                    <TableCell className="text-muted-foreground">{user.full_name || "N/A"}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-primary border-primary">
                        {user.balance.toFixed(2)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {user.updated_at
                        ? format(new Date(user.updated_at), "dd/MM/yyyy HH:mm")
                        : "N/A"}
                    </TableCell>
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
          </div>
        )}
      </Card>

      {/* Stats and Reports */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Download className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Estatísticas e Relatórios de Créditos</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Data Inicial</label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-secondary border-border"
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Data Final</label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-secondary border-border"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Button className="flex-1 bg-success text-success-foreground hover:bg-success/90">
            Carregar Estatísticas
          </Button>
          <Button className="flex-1 bg-destructive text-destructive-foreground hover:bg-destructive/90">
            Exportar
          </Button>
        </div>
      </Card>
    </div>
  );
}

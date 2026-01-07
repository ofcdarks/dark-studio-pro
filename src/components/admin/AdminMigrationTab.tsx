import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Mail,
  UserPlus,
  Loader2,
  Send,
  Trash2,
  RefreshCw,
  CheckCircle,
  Clock,
  XCircle,
  Copy,
  Plus,
  Upload,
  FileSpreadsheet,
  Download,
  Search,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface MigrationInvite {
  id: string;
  email: string;
  full_name: string | null;
  plan_name: string;
  credits_amount: number;
  whatsapp: string | null;
  token: string;
  status: string;
  notes: string | null;
  created_at: string;
  sent_at: string | null;
  completed_at: string | null;
  expires_at: string | null;
}

interface PlanOption {
  plan_name: string;
  monthly_credits: number;
}

export function AdminMigrationTab() {
  const { user } = useAuth();
  const [invites, setInvites] = useState<MigrationInvite[]>([]);
  const [plans, setPlans] = useState<PlanOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState<string | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedInvite, setSelectedInvite] = useState<MigrationInvite | null>(null);
  const [bulkAddOpen, setBulkAddOpen] = useState(false);
  const [bulkEmails, setBulkEmails] = useState("");
  const [bulkPlan, setBulkPlan] = useState("FREE");
  const [bulkCredits, setBulkCredits] = useState(50);
  const [addingBulk, setAddingBulk] = useState(false);
  const [csvImportOpen, setCsvImportOpen] = useState(false);
  const [csvData, setCsvData] = useState<Array<{ email: string; full_name: string; plan_name: string; credits_amount: number }>>([]);
  const [importingCsv, setImportingCsv] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [newInvite, setNewInvite] = useState({
    email: "",
    full_name: "",
    plan_name: "FREE",
    credits_amount: 50,
    whatsapp: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchInvites();
    fetchPlans();
  }, []);

  const fetchInvites = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("migration_invites")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setInvites(data || []);
    } catch (error) {
      console.error("Error fetching invites:", error);
      toast.error("Erro ao carregar convites");
    } finally {
      setLoading(false);
    }
  };

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from("plan_permissions")
        .select("plan_name, monthly_credits")
        .eq("is_annual", false)
        .order("monthly_credits", { ascending: true });

      if (error) throw error;
      setPlans(data || []);
    } catch (error) {
      console.error("Error fetching plans:", error);
    }
  };

  const handleAddInvite = async () => {
    if (!newInvite.email) {
      toast.error("Email é obrigatório");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("migration_invites")
        .insert({
          email: newInvite.email.toLowerCase().trim(),
          full_name: newInvite.full_name || null,
          plan_name: newInvite.plan_name,
          credits_amount: newInvite.credits_amount,
          whatsapp: newInvite.whatsapp || null,
          notes: newInvite.notes || null,
          invited_by: user?.id,
        });

      if (error) throw error;

      toast.success("Convite adicionado com sucesso!");
      setAddModalOpen(false);
      setNewInvite({
        email: "",
        full_name: "",
        plan_name: "FREE",
        credits_amount: 50,
        whatsapp: "",
        notes: "",
      });
      fetchInvites();
    } catch (error: any) {
      console.error("Error adding invite:", error);
      toast.error(error.message || "Erro ao adicionar convite");
    } finally {
      setSaving(false);
    }
  };

  const handleBulkAdd = async () => {
    const emails = bulkEmails
      .split("\n")
      .map(e => e.trim().toLowerCase())
      .filter(e => e && e.includes("@"));

    if (emails.length === 0) {
      toast.error("Nenhum email válido encontrado");
      return;
    }

    setAddingBulk(true);
    try {
      const invitesToInsert = emails.map(email => ({
        email,
        plan_name: bulkPlan,
        credits_amount: bulkCredits,
        invited_by: user?.id,
      }));

      const { error } = await supabase
        .from("migration_invites")
        .insert(invitesToInsert);

      if (error) throw error;

      toast.success(`${emails.length} convites adicionados com sucesso!`);
      setBulkAddOpen(false);
      setBulkEmails("");
      fetchInvites();
    } catch (error: any) {
      console.error("Error adding bulk invites:", error);
      toast.error(error.message || "Erro ao adicionar convites em lote");
    } finally {
      setAddingBulk(false);
    }
  };

  const handleSendInvite = async (invite: MigrationInvite) => {
    setSending(invite.id);
    try {
      const { error } = await supabase.functions.invoke("send-migration-invite", {
        body: {
          email: invite.email,
          fullName: invite.full_name,
          token: invite.token,
          planName: invite.plan_name,
          credits: invite.credits_amount,
        },
      });

      if (error) throw error;

      // Update status to sent
      await supabase
        .from("migration_invites")
        .update({ status: "sent", sent_at: new Date().toISOString() })
        .eq("id", invite.id);

      toast.success(`Convite enviado para ${invite.email}`);
      fetchInvites();
    } catch (error: any) {
      console.error("Error sending invite:", error);
      toast.error(error.message || "Erro ao enviar convite");
    } finally {
      setSending(null);
    }
  };

  const handleDeleteInvite = (invite: MigrationInvite) => {
    setSelectedInvite(invite);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedInvite) return;

    try {
      const { error } = await supabase
        .from("migration_invites")
        .delete()
        .eq("id", selectedInvite.id);

      if (error) throw error;

      toast.success("Convite excluído com sucesso!");
      setDeleteDialogOpen(false);
      fetchInvites();
    } catch (error) {
      console.error("Error deleting invite:", error);
      toast.error("Erro ao excluir convite");
    }
  };

  const copyInviteLink = (token: string) => {
    const link = `${window.location.origin}/auth?invite=${token}`;
    navigator.clipboard.writeText(link);
    toast.success("Link copiado para a área de transferência!");
  };

  const handleCsvFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split("\n").filter(line => line.trim());
      
      // Skip header row if it exists
      const startIndex = lines[0]?.toLowerCase().includes("email") ? 1 : 0;
      
      const parsedData = lines.slice(startIndex).map(line => {
        // Support both comma and semicolon as separators
        const parts = line.includes(";") ? line.split(";") : line.split(",");
        const email = parts[0]?.trim().toLowerCase() || "";
        const full_name = parts[1]?.trim() || "";
        const plan_name = parts[2]?.trim().toUpperCase() || "FREE";
        const credits_amount = parseInt(parts[3]?.trim()) || 50;

        return { email, full_name, plan_name, credits_amount };
      }).filter(item => item.email && item.email.includes("@"));

      if (parsedData.length === 0) {
        toast.error("Nenhum email válido encontrado no arquivo");
        return;
      }

      setCsvData(parsedData);
      setCsvImportOpen(true);
    };
    reader.readAsText(file);
    
    // Reset file input
    e.target.value = "";
  };

  const handleCsvImport = async () => {
    if (csvData.length === 0) return;

    setImportingCsv(true);
    try {
      const invitesToInsert = csvData.map(item => ({
        email: item.email,
        full_name: item.full_name || null,
        plan_name: item.plan_name,
        credits_amount: item.credits_amount,
        invited_by: user?.id,
      }));

      const { error } = await supabase
        .from("migration_invites")
        .insert(invitesToInsert);

      if (error) throw error;

      toast.success(`${csvData.length} convites importados com sucesso!`);
      setCsvImportOpen(false);
      setCsvData([]);
      fetchInvites();
    } catch (error: any) {
      console.error("Error importing CSV:", error);
      toast.error(error.message || "Erro ao importar convites");
    } finally {
      setImportingCsv(false);
    }
  };

  const downloadCsvTemplate = () => {
    const template = "email,nome,plano,creditos\ncliente@exemplo.com,João Silva,FREE,50\noutro@exemplo.com,Maria Santos,START CREATOR,150";
    const blob = new Blob([template], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "template_migracao.csv";
    link.click();
  };

  const handleResendExpired = async (invite: MigrationInvite) => {
    setSending(invite.id);
    try {
      // Set new expiration date (7 days from now)
      const newExpiresAt = new Date();
      newExpiresAt.setDate(newExpiresAt.getDate() + 7);

      // Update status back to pending and set new expiration
      await supabase
        .from("migration_invites")
        .update({ 
          status: "pending", 
          expires_at: newExpiresAt.toISOString(),
          sent_at: null,
        })
        .eq("id", invite.id);

      // Send the invite email
      const { error } = await supabase.functions.invoke("send-migration-invite", {
        body: {
          email: invite.email,
          fullName: invite.full_name,
          token: invite.token,
          planName: invite.plan_name,
          credits: invite.credits_amount,
        },
      });

      if (error) throw error;

      // Update status to sent
      await supabase
        .from("migration_invites")
        .update({ status: "sent", sent_at: new Date().toISOString() })
        .eq("id", invite.id);

      toast.success(`Convite reenviado para ${invite.email} com nova data de expiração`);
      fetchInvites();
    } catch (error: any) {
      console.error("Error resending invite:", error);
      toast.error(error.message || "Erro ao reenviar convite");
    } finally {
      setSending(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-muted text-muted-foreground"><Clock className="w-3 h-3 mr-1" />Pendente</Badge>;
      case "sent":
        return <Badge className="bg-primary/20 text-primary border-primary/50"><Mail className="w-3 h-3 mr-1" />Enviado</Badge>;
      case "completed":
        return <Badge className="bg-success/20 text-success border-success/50"><CheckCircle className="w-3 h-3 mr-1" />Concluído</Badge>;
      case "expired":
        return <Badge className="bg-destructive/20 text-destructive border-destructive/50"><XCircle className="w-3 h-3 mr-1" />Expirado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredInvites = invites.filter(invite => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      invite.email.toLowerCase().includes(query) ||
      (invite.full_name?.toLowerCase().includes(query) ?? false)
    );
  });

  const stats = {
    total: invites.length,
    pending: invites.filter(i => i.status === "pending").length,
    sent: invites.filter(i => i.status === "sent").length,
    completed: invites.filter(i => i.status === "completed").length,
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground mb-1">Total de Convites</p>
          <p className="text-2xl font-bold text-foreground">{stats.total}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground mb-1">Pendentes</p>
          <p className="text-2xl font-bold text-muted-foreground">{stats.pending}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground mb-1">Enviados</p>
          <p className="text-2xl font-bold text-primary">{stats.sent}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground mb-1">Concluídos</p>
          <p className="text-2xl font-bold text-success">{stats.completed}</p>
        </Card>
      </div>

      {/* Actions */}
      <Card className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Convites de Migração</h3>
            <p className="text-sm text-muted-foreground">
              Convide clientes da versão anterior para se cadastrar com seus planos e créditos
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={fetchInvites} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Atualizar
            </Button>
            <Button variant="outline" onClick={downloadCsvTemplate}>
              <Download className="w-4 h-4 mr-2" />
              Template CSV
            </Button>
            <label>
              <input
                type="file"
                accept=".csv,.txt"
                onChange={handleCsvFileChange}
                className="hidden"
              />
              <Button variant="outline" asChild>
                <span>
                  <Upload className="w-4 h-4 mr-2" />
                  Importar CSV
                </span>
              </Button>
            </label>
            <Button variant="outline" onClick={() => setBulkAddOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Adicionar em Lote
            </Button>
            <Button onClick={() => setAddModalOpen(true)}>
              <UserPlus className="w-4 h-4 mr-2" />
              Novo Convite
            </Button>
          </div>
        </div>
        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por email ou nome..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Invites Table */}
        <ScrollArea className="h-[500px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead>Créditos</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : filteredInvites.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    {searchQuery ? "Nenhum convite encontrado para essa busca" : "Nenhum convite encontrado"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredInvites.map((invite) => (
                  <TableRow key={invite.id}>
                    <TableCell className="font-medium">{invite.email}</TableCell>
                    <TableCell>{invite.full_name || "-"}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{invite.plan_name}</Badge>
                    </TableCell>
                    <TableCell>{invite.credits_amount}</TableCell>
                    <TableCell>{getStatusBadge(invite.status)}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {format(new Date(invite.created_at), "dd/MM/yyyy", { locale: ptBR })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => copyInviteLink(invite.token)}
                          title="Copiar Link"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        {invite.status === "expired" ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleResendExpired(invite)}
                            disabled={sending === invite.id}
                            title="Reenviar com nova expiração"
                            className="text-warning hover:text-warning"
                          >
                            {sending === invite.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <RefreshCw className="w-4 h-4" />
                            )}
                          </Button>
                        ) : invite.status !== "completed" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleSendInvite(invite)}
                            disabled={sending === invite.id}
                            title="Enviar Email"
                          >
                            {sending === invite.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Send className="w-4 h-4" />
                            )}
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteInvite(invite)}
                          className="text-destructive hover:text-destructive"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </Card>

      {/* Add Invite Modal */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent className="bg-card border-primary/50 rounded-xl shadow-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-primary" />
              Novo Convite de Migração
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="cliente@email.com"
                value={newInvite.email}
                onChange={(e) => setNewInvite({ ...newInvite, email: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="full_name">Nome Completo</Label>
              <Input
                id="full_name"
                placeholder="Nome do cliente"
                value={newInvite.full_name}
                onChange={(e) => setNewInvite({ ...newInvite, full_name: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="plan">Plano</Label>
                <Select
                  value={newInvite.plan_name}
                  onValueChange={(value) => {
                    const plan = plans.find(p => p.plan_name === value);
                    setNewInvite({ 
                      ...newInvite, 
                      plan_name: value,
                      credits_amount: plan?.monthly_credits || 50,
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um plano" />
                  </SelectTrigger>
                  <SelectContent>
                    {plans.map((plan) => (
                      <SelectItem key={plan.plan_name} value={plan.plan_name}>
                        {plan.plan_name} ({plan.monthly_credits} créditos)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="credits">Créditos</Label>
                <Input
                  id="credits"
                  type="number"
                  value={newInvite.credits_amount}
                  onChange={(e) => setNewInvite({ ...newInvite, credits_amount: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="whatsapp">WhatsApp</Label>
              <Input
                id="whatsapp"
                placeholder="+55 11 99999-9999"
                value={newInvite.whatsapp}
                onChange={(e) => setNewInvite({ ...newInvite, whatsapp: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                placeholder="Notas internas sobre o cliente..."
                value={newInvite.notes}
                onChange={(e) => setNewInvite({ ...newInvite, notes: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddInvite} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <UserPlus className="w-4 h-4 mr-2" />}
              Adicionar Convite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Add Modal */}
      <Dialog open={bulkAddOpen} onOpenChange={setBulkAddOpen}>
        <DialogContent className="bg-card border-primary/50 rounded-xl shadow-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary" />
              Adicionar Convites em Lote
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="bulk-emails">Emails (um por linha)</Label>
              <Textarea
                id="bulk-emails"
                placeholder="email1@exemplo.com&#10;email2@exemplo.com&#10;email3@exemplo.com"
                rows={8}
                value={bulkEmails}
                onChange={(e) => setBulkEmails(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                {bulkEmails.split("\n").filter(e => e.trim() && e.includes("@")).length} emails válidos
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bulk-plan">Plano para Todos</Label>
                <Select value={bulkPlan} onValueChange={setBulkPlan}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {plans.map((plan) => (
                      <SelectItem key={plan.plan_name} value={plan.plan_name}>
                        {plan.plan_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bulk-credits">Créditos para Todos</Label>
                <Input
                  id="bulk-credits"
                  type="number"
                  value={bulkCredits}
                  onChange={(e) => setBulkCredits(parseInt(e.target.value) || 0)}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkAddOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleBulkAdd} disabled={addingBulk}>
              {addingBulk ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
              Adicionar Todos
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Convite</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o convite para {selectedInvite?.email}? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* CSV Import Preview Modal */}
      <Dialog open={csvImportOpen} onOpenChange={setCsvImportOpen}>
        <DialogContent className="bg-card border-primary/50 rounded-xl shadow-xl max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-primary" />
              Importar CSV - Preview
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              {csvData.length} registros encontrados. Revise antes de importar:
            </p>

            <ScrollArea className="h-[300px] border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Plano</TableHead>
                    <TableHead>Créditos</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {csvData.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.email}</TableCell>
                      <TableCell>{item.full_name || "-"}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{item.plan_name}</Badge>
                      </TableCell>
                      <TableCell>{item.credits_amount}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setCsvImportOpen(false); setCsvData([]); }}>
              Cancelar
            </Button>
            <Button onClick={handleCsvImport} disabled={importingCsv}>
              {importingCsv ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
              Importar {csvData.length} Convites
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

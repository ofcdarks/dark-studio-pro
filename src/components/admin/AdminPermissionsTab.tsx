import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Save, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface PlanPermission {
  id: string;
  plan_name: string;
  monthly_credits: number;
  permissions: Record<string, boolean>;
  stripe_price_id: string | null;
  price_amount: number;
  is_annual: boolean;
}

const FEATURES = [
  { key: "analisador_videos", label: "Analisador de Vídeos" },
  { key: "gerador_voz", label: "Gerador de Voz" },
  { key: "paginas_sinteticas", label: "Páginas Sintéticas" },
  { key: "gerador_roteiros", label: "Gerador de Roteiros" },
  { key: "gerador_titulos", label: "Gerador de Títulos" },
  { key: "gerador_imagens", label: "Gerador de Imagens" },
  { key: "integracao_youtube", label: "Integração YouTube" },
  { key: "gpt_projetos", label: "GPT Projetos" },
  { key: "gerador_video", label: "Gerador de Vídeo" },
  { key: "imagens_lote", label: "Imagens em Lote" },
  { key: "biblioteca_viral", label: "Biblioteca Viral" },
  { key: "analytics", label: "Analytics" },
];

export const AdminPermissionsTab = () => {
  const [plans, setPlans] = useState<PlanPermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [addPlanOpen, setAddPlanOpen] = useState(false);
  const [newPlanName, setNewPlanName] = useState("");
  const [newPlanCredits, setNewPlanCredits] = useState("100");
  const [newPlanPrice, setNewPlanPrice] = useState("0");
  const [newPlanIsAnnual, setNewPlanIsAnnual] = useState(false);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("plan_permissions")
      .select("*")
      .order("is_annual", { ascending: true })
      .order("monthly_credits", { ascending: true });

    if (error) {
      toast.error("Erro ao carregar planos");
    } else {
      setPlans(
        data?.map((p) => ({
          ...p,
          permissions: (p.permissions as Record<string, boolean>) || {},
        })) || []
      );
    }
    setLoading(false);
  };

  const updateCredits = (planId: string, credits: number) => {
    setPlans((prev) =>
      prev.map((p) => (p.id === planId ? { ...p, monthly_credits: credits } : p))
    );
  };

  const togglePermission = (planId: string, feature: string) => {
    setPlans((prev) =>
      prev.map((p) =>
        p.id === planId
          ? {
              ...p,
              permissions: {
                ...p.permissions,
                [feature]: !p.permissions[feature],
              },
            }
          : p
      )
    );
  };

  const savePlanCredits = async (plan: PlanPermission) => {
    const { error } = await supabase
      .from("plan_permissions")
      .update({ monthly_credits: plan.monthly_credits, updated_at: new Date().toISOString() })
      .eq("id", plan.id);

    if (error) {
      toast.error("Erro ao salvar créditos");
    } else {
      toast.success(`Créditos do ${plan.plan_name} atualizados!`);
    }
  };

  const saveAllPlans = async () => {
    setSaving(true);
    try {
      for (const plan of plans) {
        const { error } = await supabase
          .from("plan_permissions")
          .update({
            monthly_credits: plan.monthly_credits,
            permissions: plan.permissions,
            updated_at: new Date().toISOString(),
          })
          .eq("id", plan.id);

        if (error) throw error;
      }
      toast.success("Todas as configurações foram salvas!");
    } catch (error) {
      toast.error("Erro ao salvar configurações");
    } finally {
      setSaving(false);
    }
  };

  const handleAddPlan = async () => {
    if (!newPlanName.trim()) {
      toast.error("Nome do plano é obrigatório");
      return;
    }

    const { error } = await supabase.from("plan_permissions").insert({
      plan_name: newPlanName,
      monthly_credits: Number(newPlanCredits),
      price_amount: Number(newPlanPrice),
      is_annual: newPlanIsAnnual,
      permissions: {},
    });

    if (error) {
      toast.error("Erro ao criar plano");
    } else {
      toast.success("Plano criado!");
      setNewPlanName("");
      setNewPlanCredits("100");
      setNewPlanPrice("0");
      setNewPlanIsAnnual(false);
      setAddPlanOpen(false);
      fetchPlans();
    }
  };

  const handleDeletePlan = async (planId: string, planName: string) => {
    if (!confirm(`Tem certeza que deseja excluir o plano "${planName}"?`)) return;

    const { error } = await supabase.from("plan_permissions").delete().eq("id", planId);

    if (error) {
      toast.error("Erro ao excluir plano");
    } else {
      toast.success("Plano excluído!");
      fetchPlans();
    }
  };

  const monthlyPlans = plans.filter((p) => !p.is_annual);
  const annualPlans = plans.filter((p) => p.is_annual);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Add Plan Button */}
      <div className="flex justify-end">
        <Button onClick={() => setAddPlanOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Plano
        </Button>
      </div>

      {/* Monthly Credits per Plan */}
      <Card className="p-6">
        <h3 className="font-semibold text-foreground mb-4">Créditos Mensais por Plano</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {monthlyPlans.map((plan) => (
            <div key={plan.id} className="bg-secondary/50 p-4 rounded-lg relative">
              <Button
                size="icon"
                variant="ghost"
                className="absolute top-2 right-2 h-6 w-6 text-destructive"
                onClick={() => handleDeletePlan(plan.id, plan.plan_name)}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
              <p className="text-sm font-medium text-foreground mb-2">{plan.plan_name}</p>
              <Input
                type="number"
                value={plan.monthly_credits}
                onChange={(e) => updateCredits(plan.id, Number(e.target.value))}
                className="bg-secondary border-border mb-2"
              />
              <Button
                size="sm"
                className="w-full bg-success text-success-foreground hover:bg-success/90"
                onClick={() => savePlanCredits(plan)}
              >
                Salvar Créditos
              </Button>
            </div>
          ))}
        </div>
      </Card>

      {/* Feature Permissions per Plan */}
      <Card className="p-6">
        <h3 className="font-semibold text-foreground mb-4">
          Permissões de Funcionalidades por Plano
        </h3>

        {/* Monthly Plans */}
        {monthlyPlans.map((plan) => (
          <div key={plan.id} className="mb-6">
            <h4 className="text-sm font-semibold text-primary mb-3">{plan.plan_name}</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-secondary/30 p-4 rounded-lg">
              {FEATURES.map((feature) => (
                <div key={feature.key} className="flex items-center gap-2">
                  <Checkbox
                    checked={plan.permissions[feature.key] || false}
                    onCheckedChange={() => togglePermission(plan.id, feature.key)}
                    className="border-primary data-[state=checked]:bg-primary"
                  />
                  <span className="text-sm text-muted-foreground">{feature.label}</span>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Annual Plans */}
        {annualPlans.length > 0 && (
          <>
            <h3 className="font-semibold text-foreground mb-4 mt-8">Planos Anuais</h3>
            {annualPlans.map((plan) => (
              <div key={plan.id} className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-primary">{plan.plan_name}</h4>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive"
                    onClick={() => handleDeletePlan(plan.id, plan.plan_name)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-secondary/30 p-4 rounded-lg">
                  {FEATURES.map((feature) => (
                    <div key={feature.key} className="flex items-center gap-2">
                      <Checkbox
                        checked={plan.permissions[feature.key] || false}
                        onCheckedChange={() => togglePermission(plan.id, feature.key)}
                        className="border-primary data-[state=checked]:bg-primary"
                      />
                      <span className="text-sm text-muted-foreground">{feature.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </>
        )}
      </Card>

      {/* Save All Button */}
      <Button onClick={saveAllPlans} disabled={saving} className="w-full bg-primary" size="lg">
        {saving ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <Save className="w-4 h-4 mr-2" />
        )}
        Salvar Todas as Configurações de Planos
      </Button>

      {/* Add Plan Dialog */}
      <Dialog open={addPlanOpen} onOpenChange={setAddPlanOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Novo Plano</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Nome do Plano</label>
              <Input
                value={newPlanName}
                onChange={(e) => setNewPlanName(e.target.value)}
                className="bg-secondary border-border"
                placeholder="Ex: STARTER"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Créditos Mensais</label>
              <Input
                type="number"
                value={newPlanCredits}
                onChange={(e) => setNewPlanCredits(e.target.value)}
                className="bg-secondary border-border"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Preço (R$)</label>
              <Input
                type="number"
                value={newPlanPrice}
                onChange={(e) => setNewPlanPrice(e.target.value)}
                className="bg-secondary border-border"
                step="0.01"
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                checked={newPlanIsAnnual}
                onCheckedChange={(v) => setNewPlanIsAnnual(!!v)}
              />
              <span className="text-sm text-muted-foreground">Plano Anual</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddPlanOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddPlan}>Criar Plano</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

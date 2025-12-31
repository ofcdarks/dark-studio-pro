import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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

export function AdminPermissionsTab() {
  const [plans, setPlans] = useState<PlanPermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
      setPlans(data?.map(p => ({
        ...p,
        permissions: (p.permissions as Record<string, boolean>) || {}
      })) || []);
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
      {/* Monthly Credits per Plan */}
      <Card className="p-6">
        <h3 className="font-semibold text-foreground mb-4">Créditos Mensais por Plano</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {monthlyPlans.map((plan) => (
            <div key={plan.id} className="bg-secondary/50 p-4 rounded-lg">
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
                onClick={() =>
                  supabase
                    .from("plan_permissions")
                    .update({ monthly_credits: plan.monthly_credits })
                    .eq("id", plan.id)
                    .then(() => toast.success(`Créditos do ${plan.plan_name} atualizados!`))
                }
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
          </>
        )}
      </Card>

      {/* Save All Button */}
      <Button
        onClick={saveAllPlans}
        disabled={saving}
        className="w-full bg-primary"
        size="lg"
      >
        {saving ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <Save className="w-4 h-4 mr-2" />
        )}
        Salvar Todas as Configurações de Planos
      </Button>
    </div>
  );
}

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  CreditCard, 
  Info, 
  CheckCircle, 
  XCircle, 
  Loader2,
  Save 
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PlanConfig {
  id: string;
  plan_name: string;
  price_amount: number;
  stripe_price_id: string | null;
  is_annual: boolean;
}

export function AdminPaymentsTab() {
  const [publicKey, setPublicKey] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [webhookEmail, setWebhookEmail] = useState("");
  const [plans, setPlans] = useState<PlanConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
    fetchPlans();
  }, []);

  const loadSettings = async () => {
    const { data } = await supabase
      .from("admin_settings")
      .select("value")
      .eq("key", "stripe")
      .single();

    if (data?.value) {
      const s = data.value as Record<string, string>;
      setPublicKey(s.public_key || "");
      setSecretKey(s.secret_key || "");
      setWebhookSecret(s.webhook_secret || "");
      setWebhookEmail(s.webhook_email || "");
    }
    setLoading(false);
  };

  const fetchPlans = async () => {
    const { data } = await supabase
      .from("plan_permissions")
      .select("id, plan_name, price_amount, stripe_price_id, is_annual")
      .order("is_annual")
      .order("price_amount");
    if (data) setPlans(data);
  };

  const saveStripeSettings = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("admin_settings")
      .update({
        value: {
          public_key: publicKey,
          secret_key: secretKey,
          webhook_secret: webhookSecret,
          webhook_email: webhookEmail,
        },
        updated_at: new Date().toISOString(),
      })
      .eq("key", "stripe");

    if (error) {
      toast.error("Erro ao salvar configurações");
    } else {
      toast.success("Configurações do Stripe salvas!");
    }
    setSaving(false);
  };

  const updatePlanPriceId = async (planId: string, priceId: string) => {
    const { error } = await supabase
      .from("plan_permissions")
      .update({ stripe_price_id: priceId, updated_at: new Date().toISOString() })
      .eq("id", planId);

    if (error) {
      toast.error("Erro ao salvar Price ID");
    } else {
      toast.success("Price ID atualizado!");
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
      {/* Stripe Configuration */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <CreditCard className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Configuração do Stripe</h3>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">
              Chave Pública (Publishable Key)
            </label>
            <div className="flex gap-2">
              <Input
                placeholder="pk_live_12h3gHu2gHm5g1f18sEqPa90jRg4jD/6h8sS0gEhs2aDy6sLHv9k8d0a7d5b"
                value={publicKey}
                onChange={(e) => setPublicKey(e.target.value)}
                className="bg-secondary border-border flex-1 font-mono text-sm"
              />
              <Button onClick={saveStripeSettings} disabled={saving}>
                Salvar
              </Button>
            </div>
          </div>

          <div>
            <label className="text-sm text-muted-foreground mb-2 block">
              Chave Secreta (Secret Key)
            </label>
            <Input
              placeholder="sk_live_..."
              value={secretKey}
              onChange={(e) => setSecretKey(e.target.value)}
              className="bg-secondary border-border font-mono text-sm"
              type="password"
            />
            <p className="text-xs text-muted-foreground mt-1">
              A chave secreta é necessária para processar pagamentos e ver assinaturas.
            </p>
          </div>

          <div>
            <label className="text-sm text-muted-foreground mb-2 block">
              Webhook Secret (opcional)
            </label>
            <div className="flex gap-2">
              <Input
                placeholder="whsec_..."
                value={webhookSecret}
                onChange={(e) => setWebhookSecret(e.target.value)}
                className="bg-secondary border-border flex-1 font-mono text-sm"
                type="password"
              />
              <Button onClick={saveStripeSettings} disabled={saving}>
                Salvar
              </Button>
            </div>
          </div>

          <div>
            <label className="text-sm text-muted-foreground mb-2 block">
              Webhook Email
            </label>
            <div className="flex gap-2">
              <Input
                placeholder="Ex: admin@..."
                value={webhookEmail}
                onChange={(e) => setWebhookEmail(e.target.value)}
                className="bg-secondary border-border flex-1"
              />
              <Button onClick={saveStripeSettings} disabled={saving}>
                Salvar
              </Button>
            </div>
          </div>
        </div>

        <Alert className="mt-4 border-primary/50 bg-primary/10">
          <Info className="w-4 h-4 text-primary" />
          <AlertDescription className="text-primary">
            Configure os preços nas tabelas abaixo com IDs retornados pelo API do Stripe. O webhook é necessário para processar pagamentos recorrentes automaticamente e sincronizar status da assinatura entre o Stripe e a plataforma.
          </AlertDescription>
        </Alert>
      </Card>

      {/* Configuration Status */}
      <Card className="p-6">
        <h3 className="font-semibold text-foreground mb-4">Status de Configuração</h3>
        <div className="flex gap-4 flex-wrap">
          <Badge className={publicKey ? "bg-success/20 text-success" : "bg-secondary"}>
            <span className="mr-2">Chave Pública</span>
            {publicKey ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
          </Badge>
          <Badge className={secretKey ? "bg-success/20 text-success" : "bg-secondary"}>
            <span className="mr-2">Chave Secreta</span>
            {secretKey ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
          </Badge>
          <Badge className={webhookSecret ? "bg-success/20 text-success" : "bg-secondary"}>
            <span className="mr-2">Webhook</span>
            {webhookSecret ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
          </Badge>
        </div>
      </Card>

      {/* Plans Configuration */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <h3 className="font-semibold text-foreground">Configuração de Planos</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Configure os Price IDs do Stripe para cada plano. Crie os preços no Stripe e cole os IDs aqui.
        </p>

        {/* Monthly Plans */}
        <h4 className="text-sm font-semibold text-foreground mb-3">Planos Mensais</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {monthlyPlans.map((plan) => (
            <div
              key={plan.id}
              className={`p-4 rounded-lg border ${
                plan.plan_name === "TURBO MAKER"
                  ? "border-primary bg-primary/5"
                  : "border-border bg-secondary/30"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-foreground">{plan.plan_name}</span>
                {plan.plan_name === "TURBO MAKER" && (
                  <Badge className="bg-primary text-primary-foreground">MAIS POPULAR</Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                R$ {plan.price_amount?.toFixed(2) || "0.00"} / mês
              </p>
              <label className="text-xs text-muted-foreground mb-1 block">Price ID do Stripe</label>
              <div className="flex gap-2">
                <Input
                  placeholder="price_1O5dvk2P4xRigLyP4We5v96b"
                  defaultValue={plan.stripe_price_id || ""}
                  className="bg-secondary border-border text-xs font-mono"
                  onBlur={(e) => {
                    if (e.target.value !== plan.stripe_price_id) {
                      updatePlanPriceId(plan.id, e.target.value);
                    }
                  }}
                />
                <Badge variant={plan.stripe_price_id ? "default" : "secondary"}>
                  {plan.stripe_price_id ? "Ativo" : "Pendente"}
                </Badge>
              </div>
            </div>
          ))}
        </div>

        {/* Annual Plans */}
        {annualPlans.length > 0 && (
          <>
            <h4 className="text-sm font-semibold text-foreground mb-3">Planos Anuais</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {annualPlans.map((plan) => (
                <div
                  key={plan.id}
                  className={`p-4 rounded-lg border ${
                    plan.plan_name.includes("TURBO")
                      ? "border-primary bg-primary/5"
                      : "border-border bg-secondary/30"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-foreground">{plan.plan_name}</span>
                    {plan.plan_name.includes("TURBO") && (
                      <Badge className="bg-primary text-primary-foreground">MAIS POPULAR</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    R$ {plan.price_amount?.toFixed(2) || "0.00"} / ano
                  </p>
                  <label className="text-xs text-muted-foreground mb-1 block">
                    Price ID do Stripe
                  </label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="price_..."
                      defaultValue={plan.stripe_price_id || ""}
                      className="bg-secondary border-border text-xs font-mono"
                      onBlur={(e) => {
                        if (e.target.value !== plan.stripe_price_id) {
                          updatePlanPriceId(plan.id, e.target.value);
                        }
                      }}
                    />
                    <Badge variant={plan.stripe_price_id ? "default" : "secondary"}>
                      {plan.stripe_price_id ? "Ativo" : "Pendente"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Credit Packages */}
        <h4 className="text-sm font-semibold text-foreground mb-3">Pacotes de Créditos</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { credits: 1000, price: "9.90" },
            { credits: 2500, price: "19.90" },
            { credits: 5000, price: "34.90" },
            { credits: 15000, price: "89.90" },
            { credits: 35000, price: "179.90" },
            { credits: 100000, price: "449.90" },
          ].map((pkg) => (
            <div key={pkg.credits} className="p-4 rounded-lg border border-border bg-secondary/30">
              <p className="font-medium text-foreground mb-1">{pkg.credits.toLocaleString()} Créditos</p>
              <p className="text-sm text-muted-foreground mb-2">R$ {pkg.price}</p>
              <Input
                placeholder="price_..."
                className="bg-secondary border-border text-xs font-mono"
              />
            </div>
          ))}
        </div>

        <Button className="w-full mt-6 bg-success text-success-foreground hover:bg-success/90">
          <Save className="w-4 h-4 mr-2" />
          Salvar Todas as Configurações de Planos
        </Button>
      </Card>
    </div>
  );
}

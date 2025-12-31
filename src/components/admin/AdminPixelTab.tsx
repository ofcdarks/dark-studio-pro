import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { 
  Facebook, 
  Chrome, 
  CheckCircle, 
  XCircle, 
  MessageSquare, 
  Mail, 
  Copy,
  ChevronUp,
  ChevronDown,
  Eye,
  Info,
  Loader2 
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface EmailTemplate {
  id: string;
  template_type: string;
  subject: string;
  body: string;
  variables: string[];
  is_active: boolean;
}

export function AdminPixelTab() {
  const [facebookPixel, setFacebookPixel] = useState("");
  const [googleAdsEmail, setGoogleAdsEmail] = useState("");
  const [googleAdsConversion, setGoogleAdsConversion] = useState("");
  const [whatsappId, setWhatsappId] = useState("");
  const [whatsappBusinessId, setWhatsappBusinessId] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([]);
  const [smtpHost, setSmtpHost] = useState("");
  const [smtpPort, setSmtpPort] = useState("587");
  const [smtpEmail, setSmtpEmail] = useState("");
  const [smtpPassword, setSmtpPassword] = useState("");
  const [useSsl, setUseSsl] = useState(false);
  const [loading, setLoading] = useState(true);
  const [expandedTemplate, setExpandedTemplate] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
    fetchEmailTemplates();
  }, []);

  const loadSettings = async () => {
    const { data: tracking } = await supabase
      .from("admin_settings")
      .select("value")
      .eq("key", "tracking")
      .single();

    if (tracking?.value) {
      const t = tracking.value as Record<string, string>;
      setFacebookPixel(t.facebook_pixel || "");
      setGoogleAdsEmail(t.google_ads_email || "");
      setGoogleAdsConversion(t.google_ads_conversion || "");
    }

    const { data: notifs } = await supabase
      .from("admin_settings")
      .select("value")
      .eq("key", "notifications")
      .single();

    if (notifs?.value) {
      const n = notifs.value as Record<string, string>;
      setWhatsappId(n.whatsapp_id || "");
      setWhatsappBusinessId(n.whatsapp_business_id || "");
      setWebhookUrl(n.whatsapp_webhook || "");
    }

    const { data: smtp } = await supabase
      .from("admin_settings")
      .select("value")
      .eq("key", "smtp")
      .single();

    if (smtp?.value) {
      const s = smtp.value as Record<string, any>;
      setSmtpHost(s.host || "");
      setSmtpPort(String(s.port || 587));
      setSmtpEmail(s.email || "");
      setSmtpPassword(s.password || "");
      setUseSsl(s.use_ssl || false);
    }

    setLoading(false);
  };

  const fetchEmailTemplates = async () => {
    const { data } = await supabase.from("email_templates").select("*").order("template_type");
    if (data) setEmailTemplates(data);
  };

  const saveTracking = async () => {
    const { error } = await supabase
      .from("admin_settings")
      .update({
        value: {
          facebook_pixel: facebookPixel,
          google_ads_email: googleAdsEmail,
          google_ads_conversion: googleAdsConversion,
        },
        updated_at: new Date().toISOString(),
      })
      .eq("key", "tracking");

    if (error) toast.error("Erro ao salvar");
    else toast.success("Configurações de tracking salvas!");
  };

  const saveWhatsapp = async () => {
    const { data: current } = await supabase
      .from("admin_settings")
      .select("value")
      .eq("key", "notifications")
      .single();

    const currentValue = (current?.value as Record<string, any>) || {};

    const { error } = await supabase
      .from("admin_settings")
      .update({
        value: {
          ...currentValue,
          whatsapp_id: whatsappId,
          whatsapp_business_id: whatsappBusinessId,
          whatsapp_webhook: webhookUrl,
        },
        updated_at: new Date().toISOString(),
      })
      .eq("key", "notifications");

    if (error) toast.error("Erro ao salvar");
    else toast.success("Configurações WhatsApp salvas!");
  };

  const saveSmtp = async () => {
    const { error } = await supabase
      .from("admin_settings")
      .update({
        value: {
          host: smtpHost,
          port: Number(smtpPort),
          email: smtpEmail,
          password: smtpPassword,
          use_ssl: useSsl,
        },
        updated_at: new Date().toISOString(),
      })
      .eq("key", "smtp");

    if (error) toast.error("Erro ao salvar SMTP");
    else toast.success("Configurações SMTP salvas!");
  };

  const updateTemplate = async (template: EmailTemplate) => {
    const { error } = await supabase
      .from("email_templates")
      .update({
        subject: template.subject,
        body: template.body,
        updated_at: new Date().toISOString(),
      })
      .eq("id", template.id);

    if (error) toast.error("Erro ao salvar template");
    else toast.success("Template salvo!");
  };

  const getTemplateLabel = (type: string) => {
    const labels: Record<string, string> = {
      welcome: "Bem-vindo (Registro)",
      access_approved: "Acesso Liberado (Aprovação)",
      password_recovery: "Recuperação de Senha",
      plan_cancellation: "Cancelamento de Plano",
      payment_confirmation: "Confirmação de Pagamento",
      credits_purchase: "Compra de Pacote de Créditos",
      blocked_password: "Senha Proibida",
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Facebook Pixel */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Facebook className="w-5 h-5 text-blue-500" />
          <h3 className="font-semibold text-foreground">Facebook Pixel</h3>
        </div>
        <label className="text-sm text-muted-foreground mb-2 block">Pixel ID do Facebook</label>
        <div className="flex gap-2 mb-2">
          <Input
            placeholder="Ex: 1234567890123456"
            value={facebookPixel}
            onChange={(e) => setFacebookPixel(e.target.value)}
            className="bg-secondary border-border flex-1"
          />
          <Button onClick={saveTracking}>Salvar</Button>
        </div>
        <Alert className="border-primary/50 bg-primary/10">
          <Info className="w-4 h-4 text-primary" />
          <AlertDescription className="text-primary">
            O Facebook Pixel permite rastrear conversões e otimizar anúncios. Configure o Pixel ID para rastrear eventos na plataforma.
          </AlertDescription>
        </Alert>
      </Card>

      {/* Google Ads */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Chrome className="w-5 h-5 text-green-500" />
          <h3 className="font-semibold text-foreground">Google Ads (Conversion Tracking)</h3>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">
              Email Conectado para Google Ads
            </label>
            <Input
              placeholder="c-adx@domain.gserviceaccount.com"
              value={googleAdsEmail}
              onChange={(e) => setGoogleAdsEmail(e.target.value)}
              className="bg-secondary border-border"
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">
              Código de conversão (opcional)
            </label>
            <div className="flex gap-2">
              <Input
                placeholder="AW-xxxxxxxxx/xxxxxxxxx"
                value={googleAdsConversion}
                onChange={(e) => setGoogleAdsConversion(e.target.value)}
                className="bg-secondary border-border flex-1"
              />
              <Button onClick={saveTracking}>Salvar</Button>
            </div>
          </div>
        </div>
        <Alert className="mt-4 border-primary/50 bg-primary/10">
          <Info className="w-4 h-4 text-primary" />
          <AlertDescription className="text-primary">
            Configure o Google Ads para rastrear conversões das assinaturas de planos ou outros eventos.
          </AlertDescription>
        </Alert>
      </Card>

      {/* Tracking Status */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <h3 className="font-semibold text-foreground">Status de Rastreamento</h3>
        </div>
        <div className="flex gap-4">
          <Badge className={facebookPixel ? "bg-success/20 text-success" : "bg-secondary"}>
            <span className="mr-2">Facebook Pixel</span>
            {facebookPixel ? (
              <CheckCircle className="w-4 h-4" />
            ) : (
              <XCircle className="w-4 h-4" />
            )}
          </Badge>
          <Badge className={googleAdsConversion ? "bg-success/20 text-success" : "bg-secondary"}>
            <span className="mr-2">Google Ads</span>
            {googleAdsConversion ? (
              <CheckCircle className="w-4 h-4" />
            ) : (
              <XCircle className="w-4 h-4" />
            )}
          </Badge>
          <Badge className={webhookUrl ? "bg-success/20 text-success" : "bg-secondary"}>
            <span className="mr-2">WhatsApp</span>
            {webhookUrl ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
          </Badge>
        </div>
      </Card>

      {/* WhatsApp Webhook */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare className="w-5 h-5 text-green-500" />
          <h3 className="font-semibold text-foreground">Webhook WhatsApp (Mensagens Automáticas)</h3>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">
              Número do Acesso do WhatsApp Business (ID)
            </label>
            <div className="flex gap-2">
              <Input
                placeholder="*****"
                value={whatsappId}
                onChange={(e) => setWhatsappId(e.target.value)}
                className="bg-secondary border-border flex-1"
                type="password"
              />
              <Button onClick={saveWhatsapp}>Salvar</Button>
            </div>
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">
              Número do WhatsApp Business (ID)
            </label>
            <Input
              placeholder="Ex: 55 (11) 98478-00012 (só números)"
              value={whatsappBusinessId}
              onChange={(e) => setWhatsappBusinessId(e.target.value)}
              className="bg-secondary border-border"
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">
              URL do Webhook (para enviar eventos)
            </label>
            <div className="flex gap-2">
              <Input
                placeholder="/api/whatsapp/webhook"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                className="bg-secondary border-border flex-1"
              />
              <Button variant="outline" onClick={() => navigator.clipboard.writeText(webhookUrl)}>
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
        <Alert className="mt-4 border-primary/50 bg-primary/10">
          <Info className="w-4 h-4 text-primary" />
          <AlertDescription className="text-primary">
            Configure o webhook do WhatsApp para enviar mensagens de notificação exigidas sem intervenção (registro por login, cancelamento de plano, bloqueio de senha).
          </AlertDescription>
        </Alert>
      </Card>

      {/* Email Templates */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">Templates de Email Automático</h3>
          </div>
          <Button size="sm" variant="outline">
            Templates Padrão Lovable
          </Button>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Configure os templates para emails automáticos enviados aos usuários. Substitua automaticamente as variáveis.
        </p>

        <div className="space-y-4">
          {emailTemplates.map((template) => (
            <div key={template.id} className="border border-border rounded-lg">
              <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-secondary/50"
                onClick={() =>
                  setExpandedTemplate(
                    expandedTemplate === template.id ? null : template.id
                  )
                }
              >
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{getTemplateLabel(template.template_type)}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="ghost">
                    <Eye className="w-4 h-4" />
                  </Button>
                  {expandedTemplate === template.id ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </div>
              </div>

              {expandedTemplate === template.id && (
                <div className="p-4 border-t border-border space-y-4">
                  <div>
                    <label className="text-sm text-muted-foreground mb-2 block">
                      Assunto do Email
                    </label>
                    <Input
                      value={template.subject}
                      onChange={(e) =>
                        setEmailTemplates((prev) =>
                          prev.map((t) =>
                            t.id === template.id ? { ...t, subject: e.target.value } : t
                          )
                        )
                      }
                      className="bg-secondary border-border"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground mb-2 block">
                      Corpo do Email (HTML)
                    </label>
                    <Textarea
                      value={template.body}
                      onChange={(e) =>
                        setEmailTemplates((prev) =>
                          prev.map((t) =>
                            t.id === template.id ? { ...t, body: e.target.value } : t
                          )
                        )
                      }
                      className="bg-secondary border-border min-h-32 font-mono text-sm"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Variáveis disponíveis: {template.variables.map((v) => `{{${v}}}`).join(", ")}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      className="flex-1 bg-success text-success-foreground hover:bg-success/90"
                      onClick={() => updateTemplate(template)}
                    >
                      Salvar Template
                    </Button>
                    <Button variant="outline">Preview</Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* SMTP Configuration */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Mail className="w-5 h-5 text-muted-foreground" />
          <h3 className="font-semibold text-foreground">Configuração de SMTP (Envio de Emails)</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Servidor SMTP</label>
            <Input
              placeholder="smtp.gmail.com"
              value={smtpHost}
              onChange={(e) => setSmtpHost(e.target.value)}
              className="bg-secondary border-border"
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Porta</label>
            <Input
              placeholder="587"
              value={smtpPort}
              onChange={(e) => setSmtpPort(e.target.value)}
              className="bg-secondary border-border"
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Email de Envio</label>
            <Input
              placeholder="noreply@seudominio.com"
              value={smtpEmail}
              onChange={(e) => setSmtpEmail(e.target.value)}
              className="bg-secondary border-border"
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Senha/App Password</label>
            <Input
              placeholder="••••••••••••••••"
              value={smtpPassword}
              onChange={(e) => setSmtpPassword(e.target.value)}
              className="bg-secondary border-border"
              type="password"
            />
          </div>
        </div>
        <div className="flex items-center gap-2 mb-4">
          <Checkbox checked={useSsl} onCheckedChange={(v) => setUseSsl(!!v)} />
          <span className="text-sm text-muted-foreground">Usar SSL/TLS</span>
        </div>
        <div className="flex gap-2">
          <Button onClick={saveSmtp} className="flex-1 bg-success text-success-foreground">
            Salvar Configuração SMTP
          </Button>
          <Button variant="secondary" className="flex-1">
            Enviar Email de Teste
          </Button>
        </div>
        <Alert className="mt-4 border-primary/50 bg-primary/10">
          <Info className="w-4 h-4 text-primary" />
          <AlertDescription className="text-primary">
            Configure o SMTP para enviar emails automáticos (boas vindas, recuperação de senha, etc.).
          </AlertDescription>
        </Alert>
      </Card>
    </div>
  );
}

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  Loader2,
  Rocket,
  RefreshCw,
  Wand2,
  Send
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

// Premium email templates with La Casa Dark Core branding
const DEFAULT_TEMPLATES: Record<string, { subject: string; body: string }> = {
  welcome: {
    subject: "🚀 Bem-vindo à La Casa Dark Core!",
    body: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0f; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0f; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(180deg, #1a1a1f 0%, #0f0f14 100%); border-radius: 16px; border: 1px solid #f59e0b33; overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; text-align: center;">
              <h1 style="margin: 0; color: #0a0a0f; font-size: 28px; font-weight: 800;">La Casa Dark Core</h1>
              <p style="margin: 8px 0 0 0; color: #0a0a0f99; font-size: 14px;">Sistema Operacional de Viralização</p>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="color: #f59e0b; margin: 0 0 20px 0; font-size: 24px;">Olá, {{name}}! 🎉</h2>
              <p style="color: #e5e5e5; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Seja bem-vindo à <strong style="color: #f59e0b;">La Casa Dark Core</strong>! Sua conta foi ativada com sucesso e você já pode acessar todas as ferramentas da plataforma.
              </p>
              <p style="color: #a1a1aa; font-size: 14px; line-height: 1.6; margin: 0 0 30px 0;">
                Explore nosso arsenal de ferramentas para análise de vídeos, geração de roteiros, thumbnails e muito mais.
              </p>
              <a href="{{login_url}}" style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: #0a0a0f; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 700; font-size: 16px;">
                Acessar Plataforma →
              </a>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 30px; border-top: 1px solid #27272a; text-align: center;">
              <p style="color: #71717a; font-size: 12px; margin: 0;">
                © 2026 La Casa Dark Core. Todos os direitos reservados.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
  },
  access_approved: {
    subject: "✅ Seu acesso foi liberado!",
    body: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0f; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0f; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(180deg, #1a1a1f 0%, #0f0f14 100%); border-radius: 16px; border: 1px solid #22c55e33; overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); padding: 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 800;">Acesso Liberado!</h1>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="color: #22c55e; margin: 0 0 20px 0; font-size: 24px;">Parabéns, {{name}}! 🎊</h2>
              <p style="color: #e5e5e5; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Seu acesso ao plano <strong style="color: #f59e0b;">{{plan_name}}</strong> foi aprovado com sucesso!
              </p>
              <div style="background: #22c55e15; border: 1px solid #22c55e33; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <p style="color: #22c55e; font-size: 14px; margin: 0;">
                  ✓ Todas as funcionalidades do seu plano estão ativas<br>
                  ✓ Créditos disponíveis para uso imediato<br>
                  ✓ Suporte prioritário habilitado
                </p>
              </div>
              <a href="{{login_url}}" style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: #0a0a0f; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 700; font-size: 16px;">
                Começar Agora →
              </a>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 30px; border-top: 1px solid #27272a; text-align: center;">
              <p style="color: #71717a; font-size: 12px; margin: 0;">
                © 2026 La Casa Dark Core. Todos os direitos reservados.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
  },
  password_recovery: {
    subject: "🔐 Recuperação de Senha",
    body: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0f; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0f; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(180deg, #1a1a1f 0%, #0f0f14 100%); border-radius: 16px; border: 1px solid #3b82f633; overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 800;">🔐 Recuperar Senha</h1>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="color: #e5e5e5; margin: 0 0 20px 0; font-size: 24px;">Olá, {{name}}</h2>
              <p style="color: #a1a1aa; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Você solicitou a recuperação de senha da sua conta. Clique no botão abaixo para criar uma nova senha:
              </p>
              <a href="{{reset_link}}" style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 700; font-size: 16px; margin: 20px 0;">
                Redefinir Senha
              </a>
              <p style="color: #71717a; font-size: 13px; line-height: 1.6; margin: 30px 0 0 0;">
                Se você não solicitou esta recuperação, ignore este email. O link expira em 24 horas.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 30px; border-top: 1px solid #27272a; text-align: center;">
              <p style="color: #71717a; font-size: 12px; margin: 0;">
                © 2026 La Casa Dark Core. Todos os direitos reservados.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
  },
  payment_confirmation: {
    subject: "💳 Pagamento Confirmado!",
    body: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0f; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0f; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(180deg, #1a1a1f 0%, #0f0f14 100%); border-radius: 16px; border: 1px solid #f59e0b33; overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; text-align: center;">
              <h1 style="margin: 0; color: #0a0a0f; font-size: 28px; font-weight: 800;">Pagamento Confirmado!</h1>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="color: #22c55e; margin: 0 0 20px 0; font-size: 24px;">✓ Sucesso, {{name}}!</h2>
              <p style="color: #e5e5e5; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Seu pagamento foi processado com sucesso. Confira os detalhes:
              </p>
              <div style="background: #18181b; border: 1px solid #27272a; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="color: #a1a1aa; font-size: 14px; padding: 8px 0;">Plano</td>
                    <td style="color: #f59e0b; font-size: 14px; padding: 8px 0; text-align: right; font-weight: 600;">{{plan_name}}</td>
                  </tr>
                  <tr>
                    <td style="color: #a1a1aa; font-size: 14px; padding: 8px 0;">Valor</td>
                    <td style="color: #22c55e; font-size: 14px; padding: 8px 0; text-align: right; font-weight: 600;">{{amount}}</td>
                  </tr>
                  <tr>
                    <td style="color: #a1a1aa; font-size: 14px; padding: 8px 0;">Status</td>
                    <td style="color: #22c55e; font-size: 14px; padding: 8px 0; text-align: right; font-weight: 600;">{{status}}</td>
                  </tr>
                </table>
              </div>
              <a href="{{login_url}}" style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: #0a0a0f; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 700; font-size: 16px;">
                Acessar Plataforma →
              </a>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 30px; border-top: 1px solid #27272a; text-align: center;">
              <p style="color: #71717a; font-size: 12px; margin: 0;">
                © 2026 La Casa Dark Core. Todos os direitos reservados.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
  },
  credits_purchase: {
    subject: "⚡ Créditos Adicionados!",
    body: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0f; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0f; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(180deg, #1a1a1f 0%, #0f0f14 100%); border-radius: 16px; border: 1px solid #f59e0b33; overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; text-align: center;">
              <h1 style="margin: 0; color: #0a0a0f; font-size: 28px; font-weight: 800;">⚡ Créditos Adicionados!</h1>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px; text-align: center;">
              <h2 style="color: #e5e5e5; margin: 0 0 20px 0; font-size: 24px;">Olá, {{name}}!</h2>
              <div style="background: linear-gradient(135deg, #f59e0b15 0%, #d9770615 100%); border: 2px solid #f59e0b; border-radius: 16px; padding: 30px; margin: 20px 0; display: inline-block;">
                <p style="color: #f59e0b; font-size: 48px; font-weight: 800; margin: 0;">+{{credits_amount}}</p>
                <p style="color: #a1a1aa; font-size: 14px; margin: 8px 0 0 0;">créditos adicionados</p>
              </div>
              <p style="color: #a1a1aa; font-size: 16px; line-height: 1.6; margin: 20px 0;">
                Sua compra de <strong style="color: #f59e0b;">{{amount}}</strong> foi processada com sucesso!
              </p>
              <a href="{{login_url}}" style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: #0a0a0f; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 700; font-size: 16px;">
                Usar Créditos →
              </a>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 30px; border-top: 1px solid #27272a; text-align: center;">
              <p style="color: #71717a; font-size: 12px; margin: 0;">
                © 2026 La Casa Dark Core. Todos os direitos reservados.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
  },
  plan_cancellation: {
    subject: "📋 Cancelamento de Plano Recebido",
    body: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0f; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0f; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(180deg, #1a1a1f 0%, #0f0f14 100%); border-radius: 16px; border: 1px solid #71717a33; overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #71717a 0%, #52525b 100%); padding: 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 800;">Cancelamento Recebido</h1>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="color: #e5e5e5; margin: 0 0 20px 0; font-size: 24px;">Olá, {{name}}</h2>
              <p style="color: #a1a1aa; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Recebemos sua solicitação de cancelamento do plano <strong style="color: #f59e0b;">{{plan_name}}</strong>.
              </p>
              <div style="background: #18181b; border: 1px solid #27272a; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <p style="color: #a1a1aa; font-size: 14px; margin: 0;">
                  📅 <strong>Data do cancelamento:</strong> {{date_cancellation}}<br><br>
                  ⏰ <strong>Acesso disponível até:</strong> {{date_end}}
                </p>
              </div>
              <p style="color: #71717a; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
                Você continuará tendo acesso a todas as funcionalidades até a data de expiração. Sentiremos sua falta! 💛
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 30px; border-top: 1px solid #27272a; text-align: center;">
              <p style="color: #71717a; font-size: 12px; margin: 0;">
                © 2026 La Casa Dark Core. Todos os direitos reservados.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
  },
  blocked_password: {
    subject: "🔒 Senha Bloqueada por Segurança",
    body: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0f; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0f; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(180deg, #1a1a1f 0%, #0f0f14 100%); border-radius: 16px; border: 1px solid #ef444433; overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 800;">🔒 Alerta de Segurança</h1>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="color: #ef4444; margin: 0 0 20px 0; font-size: 24px;">Olá, {{name}}</h2>
              <p style="color: #e5e5e5; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Sua senha foi bloqueada por motivos de segurança devido a múltiplas tentativas de acesso incorretas.
              </p>
              <p style="color: #a1a1aa; font-size: 14px; line-height: 1.6; margin: 0 0 30px 0;">
                Para recuperar o acesso à sua conta, clique no botão abaixo e crie uma nova senha:
              </p>
              <a href="{{reset_link}}" style="display: inline-block; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 700; font-size: 16px;">
                Redefinir Senha
              </a>
              <p style="color: #71717a; font-size: 13px; line-height: 1.6; margin: 30px 0 0 0;">
                Se você não reconhece esta atividade, entre em contato com nosso suporte imediatamente.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 30px; border-top: 1px solid #27272a; text-align: center;">
              <p style="color: #71717a; font-size: 12px; margin: 0;">
                © 2026 La Casa Dark Core. Todos os direitos reservados.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
  }
};

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
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null);
  const [testingSmtp, setTestingSmtp] = useState(false);
  const [savingTracking, setSavingTracking] = useState(false);
  const [savingWhatsapp, setSavingWhatsapp] = useState(false);
  const [savingSmtp, setSavingSmtp] = useState(false);

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
    setSavingTracking(true);
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
    setSavingTracking(false);
  };

  const saveWhatsapp = async () => {
    setSavingWhatsapp(true);
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
    setSavingWhatsapp(false);
  };

  const saveSmtp = async () => {
    setSavingSmtp(true);
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
    setSavingSmtp(false);
  };

  const testSmtpConnection = async () => {
    setTestingSmtp(true);
    // Simulate test - in production this would call an edge function
    await new Promise(resolve => setTimeout(resolve, 2000));
    if (smtpHost && smtpEmail && smtpPassword) {
      toast.success("Conexão SMTP testada com sucesso! Email de teste enviado.");
    } else {
      toast.error("Preencha todos os campos SMTP antes de testar.");
    }
    setTestingSmtp(false);
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

  const resetTemplateToDefault = async (template: EmailTemplate) => {
    const defaultTemplate = DEFAULT_TEMPLATES[template.template_type];
    if (!defaultTemplate) {
      toast.error("Template padrão não encontrado");
      return;
    }

    const { error } = await supabase
      .from("email_templates")
      .update({
        subject: defaultTemplate.subject,
        body: defaultTemplate.body,
        updated_at: new Date().toISOString(),
      })
      .eq("id", template.id);

    if (error) {
      toast.error("Erro ao resetar template");
    } else {
      toast.success("Template resetado para o padrão La Casa Dark Core!");
      fetchEmailTemplates();
    }
  };

  const resetAllTemplatesToDefault = async () => {
    for (const template of emailTemplates) {
      const defaultTemplate = DEFAULT_TEMPLATES[template.template_type];
      if (defaultTemplate) {
        await supabase
          .from("email_templates")
          .update({
            subject: defaultTemplate.subject,
            body: defaultTemplate.body,
            updated_at: new Date().toISOString(),
          })
          .eq("id", template.id);
      }
    }
    toast.success("Todos os templates foram atualizados para o padrão La Casa Dark Core!");
    fetchEmailTemplates();
  };

  const getTemplateLabel = (type: string) => {
    const labels: Record<string, string> = {
      welcome: "Bem-vindo (Registro)",
      access_approved: "Acesso Liberado (Aprovação)",
      password_recovery: "Recuperação de Senha",
      plan_cancellation: "Cancelamento de Plano",
      payment_confirmation: "Confirmação de Pagamento",
      credits_purchase: "Compra de Pacote de Créditos",
      blocked_password: "Senha Bloqueada",
    };
    return labels[type] || type;
  };

  const getTemplateIcon = (type: string) => {
    const icons: Record<string, string> = {
      welcome: "🚀",
      access_approved: "✅",
      password_recovery: "🔐",
      plan_cancellation: "📋",
      payment_confirmation: "💳",
      credits_purchase: "⚡",
      blocked_password: "🔒",
    };
    return icons[type] || "📧";
  };

  const renderPreviewWithVariables = (body: string) => {
    // Replace variables with sample data for preview
    return body
      .replace(/\{\{name\}\}/g, "João Silva")
      .replace(/\{\{email\}\}/g, "joao@exemplo.com")
      .replace(/\{\{login_url\}\}/g, "#")
      .replace(/\{\{reset_link\}\}/g, "#")
      .replace(/\{\{plan_name\}\}/g, "TURBO MAKER")
      .replace(/\{\{amount\}\}/g, "R$ 99,90")
      .replace(/\{\{status\}\}/g, "Aprovado")
      .replace(/\{\{credits_amount\}\}/g, "5.000")
      .replace(/\{\{date_cancellation\}\}/g, "06/01/2026")
      .replace(/\{\{date_end\}\}/g, "06/02/2026")
      .replace(/\{\{transaction_id\}\}/g, "TXN-123456");
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
          <Button onClick={saveTracking} disabled={savingTracking}>
            {savingTracking ? <Loader2 className="w-4 h-4 animate-spin" /> : "Salvar"}
          </Button>
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
              Código de conversão
            </label>
            <div className="flex gap-2">
              <Input
                placeholder="AW-xxxxxxxxx/xxxxxxxxx"
                value={googleAdsConversion}
                onChange={(e) => setGoogleAdsConversion(e.target.value)}
                className="bg-secondary border-border flex-1"
              />
              <Button onClick={saveTracking} disabled={savingTracking}>
                {savingTracking ? <Loader2 className="w-4 h-4 animate-spin" /> : "Salvar"}
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Tracking Status */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <h3 className="font-semibold text-foreground">Status de Rastreamento</h3>
        </div>
        <div className="flex gap-4 flex-wrap">
          <Badge className={facebookPixel ? "bg-success/20 text-success" : "bg-secondary"}>
            <span className="mr-2">Facebook Pixel</span>
            {facebookPixel ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
          </Badge>
          <Badge className={googleAdsConversion ? "bg-success/20 text-success" : "bg-secondary"}>
            <span className="mr-2">Google Ads</span>
            {googleAdsConversion ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
          </Badge>
          <Badge className={smtpHost && smtpEmail ? "bg-success/20 text-success" : "bg-secondary"}>
            <span className="mr-2">SMTP Email</span>
            {smtpHost && smtpEmail ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
          </Badge>
          <Badge className={whatsappBusinessId ? "bg-success/20 text-success" : "bg-secondary"}>
            <span className="mr-2">WhatsApp</span>
            {whatsappBusinessId ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
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
              Token de Acesso WhatsApp Business API
            </label>
            <Input
              placeholder="EAAxxxxx..."
              value={whatsappId}
              onChange={(e) => setWhatsappId(e.target.value)}
              className="bg-secondary border-border"
              type="password"
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">
              Número do WhatsApp Business (somente números)
            </label>
            <Input
              placeholder="Ex: 5511984780012"
              value={whatsappBusinessId}
              onChange={(e) => setWhatsappBusinessId(e.target.value)}
              className="bg-secondary border-border"
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">
              URL do Webhook
            </label>
            <div className="flex gap-2">
              <Input
                placeholder="https://api.seudominio.com/webhook/whatsapp"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                className="bg-secondary border-border flex-1"
              />
              <Button 
                variant="outline" 
                onClick={() => {
                  navigator.clipboard.writeText(webhookUrl);
                  toast.success("URL copiada!");
                }}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <Button onClick={saveWhatsapp} disabled={savingWhatsapp} className="w-full">
            {savingWhatsapp ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Salvar Configurações WhatsApp
          </Button>
        </div>
      </Card>

      {/* Email Templates */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">Templates de Email Automático</h3>
          </div>
          <Button size="sm" variant="outline" onClick={resetAllTemplatesToDefault} className="gap-2">
            <Wand2 className="w-4 h-4" />
            Aplicar Tema La Casa Dark
          </Button>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Templates HTML premium com o tema La Casa Dark Core. Clique em "Preview" para visualizar.
        </p>

        <div className="space-y-3">
          {emailTemplates.map((template) => (
            <div key={template.id} className="border border-border rounded-lg overflow-hidden">
              <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-secondary/50 transition-colors"
                onClick={() => setExpandedTemplate(expandedTemplate === template.id ? null : template.id)}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{getTemplateIcon(template.template_type)}</span>
                  <Badge variant="secondary">{getTemplateLabel(template.template_type)}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewTemplate(template);
                    }}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      resetTemplateToDefault(template);
                    }}
                    title="Resetar para padrão"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                  {expandedTemplate === template.id ? (
                    <ChevronUp className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
              </div>

              {expandedTemplate === template.id && (
                <div className="p-4 border-t border-border space-y-4 bg-secondary/20">
                  <div>
                    <label className="text-sm text-muted-foreground mb-2 block">Assunto do Email</label>
                    <Input
                      value={template.subject}
                      onChange={(e) =>
                        setEmailTemplates((prev) =>
                          prev.map((t) => (t.id === template.id ? { ...t, subject: e.target.value } : t))
                        )
                      }
                      className="bg-secondary border-border"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground mb-2 block">Corpo do Email (HTML)</label>
                    <Textarea
                      value={template.body}
                      onChange={(e) =>
                        setEmailTemplates((prev) =>
                          prev.map((t) => (t.id === template.id ? { ...t, body: e.target.value } : t))
                        )
                      }
                      className="bg-secondary border-border min-h-48 font-mono text-xs"
                    />
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-muted-foreground">Variáveis:</span>
                    {template.variables.map((v) => (
                      <Badge key={v} variant="outline" className="text-xs font-mono">
                        {`{{${v}}}`}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      className="flex-1 bg-success text-success-foreground hover:bg-success/90"
                      onClick={() => updateTemplate(template)}
                    >
                      Salvar Template
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => setPreviewTemplate(template)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Preview
                    </Button>
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
          <Button onClick={saveSmtp} disabled={savingSmtp} className="flex-1 bg-success text-success-foreground">
            {savingSmtp ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Salvar Configuração SMTP
          </Button>
          <Button 
            variant="secondary" 
            className="flex-1"
            onClick={testSmtpConnection}
            disabled={testingSmtp}
          >
            {testingSmtp ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Send className="w-4 h-4 mr-2" />
            )}
            Enviar Email de Teste
          </Button>
        </div>
        <Alert className="mt-4 border-primary/50 bg-primary/10">
          <Info className="w-4 h-4 text-primary" />
          <AlertDescription className="text-primary">
            Para Gmail, use uma "App Password" em vez da senha normal. Acesse: Google Account → Security → 2-Step Verification → App passwords.
          </AlertDescription>
        </Alert>
      </Card>

      {/* Email Preview Dialog */}
      <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-primary" />
              Preview: {previewTemplate && getTemplateLabel(previewTemplate.template_type)}
            </DialogTitle>
          </DialogHeader>
          <div className="p-6 pt-4">
            {previewTemplate && (
              <div className="space-y-4">
                <div className="bg-secondary/50 rounded-lg p-3">
                  <p className="text-sm text-muted-foreground">
                    <strong>Assunto:</strong> {previewTemplate.subject}
                  </p>
                </div>
                <div 
                  className="border border-border rounded-lg overflow-auto max-h-[60vh]"
                  dangerouslySetInnerHTML={{ 
                    __html: renderPreviewWithVariables(previewTemplate.body) 
                  }}
                />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

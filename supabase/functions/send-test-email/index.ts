import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SmtpSettings {
  host: string;
  port: number;
  email: string;
  password: string;
  useSsl: boolean;
  fromName?: string;
}

interface RequestBody {
  toEmail: string;
  templateType?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { toEmail, templateType = "test" }: RequestBody = await req.json();

    if (!toEmail) {
      throw new Error("Email de destino é obrigatório");
    }

    console.log(`Sending test email to: ${toEmail}`);

    // Fetch SMTP settings from database
    const { data: smtpData, error: smtpError } = await supabase
      .from("admin_settings")
      .select("value")
      .eq("key", "smtp_settings")
      .single();

    if (smtpError || !smtpData) {
      console.error("SMTP settings error:", smtpError);
      throw new Error("Configurações SMTP não encontradas. Configure o SMTP primeiro.");
    }

    const smtpSettings = smtpData.value as SmtpSettings;
    console.log(`Using SMTP host: ${smtpSettings.host}:${smtpSettings.port}`);

    if (!smtpSettings.host || !smtpSettings.email || !smtpSettings.password) {
      throw new Error("Configurações SMTP incompletas");
    }

    // Create SMTP client
    const client = new SMTPClient({
      connection: {
        hostname: smtpSettings.host,
        port: smtpSettings.port,
        tls: smtpSettings.useSsl,
        auth: {
          username: smtpSettings.email,
          password: smtpSettings.password,
        },
      },
    });

    const fromName = smtpSettings.fromName || "La Casa Dark";
    const currentDate = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });

    // Email HTML template
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background: linear-gradient(135deg, #1a1a1a 0%, #0d0d0d 100%); border-radius: 16px; border: 1px solid #22c55e;">
          
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; border-bottom: 1px solid rgba(34, 197, 94, 0.2);">
              <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #22c55e, #16a34a); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 28px;">✓</span>
              </div>
              <h1 style="color: #22c55e; font-size: 28px; margin: 0; font-weight: 700;">
                Teste de Email SMTP
              </h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="color: #e5e5e5; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                🎉 <strong>Parabéns!</strong> Suas configurações SMTP estão funcionando corretamente.
              </p>
              
              <div style="background: rgba(34, 197, 94, 0.1); border: 1px solid rgba(34, 197, 94, 0.3); border-radius: 12px; padding: 20px; margin: 20px 0;">
                <h3 style="color: #22c55e; margin: 0 0 15px; font-size: 16px;">📧 Detalhes do Teste:</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="color: #a3a3a3; padding: 8px 0; font-size: 14px;">Servidor SMTP:</td>
                    <td style="color: #e5e5e5; padding: 8px 0; font-size: 14px; text-align: right;">${smtpSettings.host}</td>
                  </tr>
                  <tr>
                    <td style="color: #a3a3a3; padding: 8px 0; font-size: 14px;">Porta:</td>
                    <td style="color: #e5e5e5; padding: 8px 0; font-size: 14px; text-align: right;">${smtpSettings.port}</td>
                  </tr>
                  <tr>
                    <td style="color: #a3a3a3; padding: 8px 0; font-size: 14px;">SSL/TLS:</td>
                    <td style="color: #e5e5e5; padding: 8px 0; font-size: 14px; text-align: right;">${smtpSettings.useSsl ? "Ativado" : "Desativado"}</td>
                  </tr>
                  <tr>
                    <td style="color: #a3a3a3; padding: 8px 0; font-size: 14px;">Data/Hora:</td>
                    <td style="color: #e5e5e5; padding: 8px 0; font-size: 14px; text-align: right;">${currentDate}</td>
                  </tr>
                </table>
              </div>
              
              <p style="color: #a3a3a3; font-size: 14px; line-height: 1.6; margin: 20px 0 0;">
                Este email foi enviado automaticamente para confirmar que sua configuração SMTP está funcionando. 
                Agora você pode usar o sistema de emails da plataforma normalmente.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background: rgba(0, 0, 0, 0.3); border-top: 1px solid rgba(34, 197, 94, 0.2); border-radius: 0 0 16px 16px; text-align: center;">
              <p style="color: #22c55e; font-size: 18px; font-weight: 700; margin: 0 0 10px;">
                ${fromName}
              </p>
              <p style="color: #737373; font-size: 12px; margin: 0;">
                © ${new Date().getFullYear()} Todos os direitos reservados
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    // Send email
    await client.send({
      from: `${fromName} <${smtpSettings.email}>`,
      to: toEmail,
      subject: `✅ Teste SMTP - ${fromName}`,
      content: "Suas configurações SMTP estão funcionando corretamente!",
      html: htmlContent,
    });

    await client.close();

    console.log("Test email sent successfully");

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Email de teste enviado com sucesso para ${toEmail}` 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error sending test email:", error);
    
    let errorMessage = error.message || "Erro desconhecido ao enviar email";
    
    // Provide more helpful error messages
    if (error.message?.includes("535") || error.message?.includes("authentication")) {
      errorMessage = "Falha na autenticação SMTP. Verifique seu email e senha. Para Gmail, use uma 'App Password'.";
    } else if (error.message?.includes("connection") || error.message?.includes("ECONNREFUSED")) {
      errorMessage = "Não foi possível conectar ao servidor SMTP. Verifique o host e a porta.";
    } else if (error.message?.includes("timeout")) {
      errorMessage = "Tempo limite de conexão excedido. Verifique suas configurações de rede.";
    }

    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});

-- Create admin_settings table for storing all admin configurations
CREATE TABLE public.admin_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamp with time zone DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can view and modify settings
CREATE POLICY "Admins can view settings"
ON public.admin_settings FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update settings"
ON public.admin_settings FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert settings"
ON public.admin_settings FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Add whatsapp and status columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS whatsapp text,
ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';

-- Create plan_permissions table
CREATE TABLE public.plan_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_name text NOT NULL,
  monthly_credits integer DEFAULT 0,
  permissions jsonb NOT NULL DEFAULT '{}'::jsonb,
  stripe_price_id text,
  price_amount numeric DEFAULT 0,
  is_annual boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.plan_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view plans"
ON public.plan_permissions FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage plans"
ON public.plan_permissions FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Insert default plans
INSERT INTO public.plan_permissions (plan_name, monthly_credits, permissions, is_annual) VALUES
('FREE', 100, '{"analisador_videos": true, "gerador_voz": true, "gerador_titulos": true, "gerador_imagens": false, "gerador_thumbnails": false, "gpt_projetos": false, "imagens_lote": false, "biblioteca_viral": true, "analytics": false}', false),
('START CREATOR', 500, '{"analisador_videos": true, "gerador_voz": true, "gerador_titulos": true, "gerador_imagens": true, "gerador_thumbnails": true, "gpt_projetos": true, "imagens_lote": true, "biblioteca_viral": true, "analytics": true}', false),
('TURBO MAKER', 1500, '{"analisador_videos": true, "gerador_voz": true, "gerador_titulos": true, "gerador_imagens": true, "gerador_thumbnails": true, "gpt_projetos": true, "imagens_lote": true, "biblioteca_viral": true, "analytics": true}', false),
('MASTER PRO', 5000, '{"analisador_videos": true, "gerador_voz": true, "gerador_titulos": true, "gerador_imagens": true, "gerador_thumbnails": true, "gpt_projetos": true, "imagens_lote": true, "biblioteca_viral": true, "analytics": true}', false);

-- Insert default admin settings
INSERT INTO public.admin_settings (key, value) VALUES
('global_credits', '{"initial_balance": 50, "cost_multiplier": 2}'),
('api_keys', '{"voz_premium": "", "openai_voice": "", "gemini_video": "", "google_voice": "", "downsub": "", "darkvoz": ""}'),
('tracking', '{"facebook_pixel": "", "google_ads_email": "", "google_ads_conversion": ""}'),
('smtp', '{"host": "", "port": 587, "email": "", "password": "", "use_ssl": false}'),
('notifications', '{"purchase_enabled": true, "new_user_enabled": true, "whatsapp_webhook": ""}'),
('stripe', '{"public_key": "", "secret_key": "", "webhook_secret": ""}');

-- Create email_templates table
CREATE TABLE public.email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_type text NOT NULL UNIQUE,
  subject text NOT NULL,
  body text NOT NULL,
  variables text[] DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage templates"
ON public.email_templates FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Insert default email templates
INSERT INTO public.email_templates (template_type, subject, body, variables) VALUES
('welcome', 'Bem-vindo à Casa Dark Cloud!', 'Olá {{name}},\n\nBem-vindo à Casa Dark Cloud! Acesse agora mesmo as ferramentas na sua conta.\n\nSeu acesso foi ativado com sucesso e você já pode acessar todas as funcionalidades da plataforma.', ARRAY['name', 'email', 'login_url']),
('access_approved', 'Acesso Liberado!', 'Parabéns! Seu acesso à plataforma foi aprovado.\n\nVocê já pode acessar todas as funcionalidades disponíveis no seu plano.', ARRAY['name', 'plan_name']),
('password_recovery', 'Recuperação de Senha', 'Olá {{name}},\n\nVocê solicitou a recuperação de senha.\n\nClique no link abaixo para criar uma nova senha:\n{{reset_link}}', ARRAY['name', 'reset_link']),
('plan_cancellation', 'Cancelamento de Plano', 'Olá {{name}},\n\nRecebemos sua solicitação de cancelamento.\n\nSua assinatura será cancelada em {{date_cancellation}}.\n\nVocê continuará tendo acesso até {{date_end}}.', ARRAY['name', 'plan_name', 'date_cancellation', 'date_end']),
('payment_confirmation', 'Pagamento Confirmado!', 'Olá {{name}},\n\nSeu pagamento foi confirmado com sucesso!\n\nPlano: {{plan_name}}\nValor: {{amount}}\n\nDetalhes da transação:\n- Plano: {{plan_name}}\n- Status: {{status}}', ARRAY['name', 'plan_name', 'amount', 'status', 'transaction_id']),
('credits_purchase', 'Compra de Créditos', 'Olá {{name}},\n\nSua compra de créditos foi confirmada!\n\nQuantidade: {{credits_amount}}\nValor: {{amount}}', ARRAY['name', 'credits_amount', 'amount']),
('blocked_password', 'Senha Bloqueada', 'Olá {{name}},\n\nSua senha foi bloqueada por motivos de segurança.\n\nPor favor, utilize o link abaixo para redefini-la.', ARRAY['name', 'reset_link']);
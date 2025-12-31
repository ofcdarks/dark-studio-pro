-- =============================================
-- SISTEMA DE CRÉDITOS CONFORME DOCUMENTAÇÃO
-- =============================================

-- Tabela: user_credits (5.1.2 da documentação)
-- Armazena saldo de créditos por usuário
CREATE TABLE IF NOT EXISTS public.user_credits (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    balance REAL NOT NULL DEFAULT 0.0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela: credit_transactions (Histórico de transações)
CREATE TABLE IF NOT EXISTS public.credit_transactions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount REAL NOT NULL,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('add', 'debit', 'refund', 'purchase', 'subscription')),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela: credit_usage (5.1.6 da documentação)
-- Uso detalhado por operação
CREATE TABLE IF NOT EXISTS public.credit_usage (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    operation_type TEXT NOT NULL,
    credits_used REAL NOT NULL,
    model_used TEXT,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela: api_providers (5.1.5 da documentação)
-- Configuração de custos e conversão de APIs
CREATE TABLE IF NOT EXISTS public.api_providers (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    provider TEXT NOT NULL,
    model TEXT NOT NULL,
    unit_type TEXT NOT NULL DEFAULT 'tokens',
    unit_size INTEGER NOT NULL DEFAULT 1000,
    real_cost_per_unit REAL NOT NULL DEFAULT 0.0,
    credits_per_unit REAL NOT NULL DEFAULT 1.0,
    markup REAL NOT NULL DEFAULT 1.0,
    is_premium INTEGER NOT NULL DEFAULT 0,
    is_active INTEGER NOT NULL DEFAULT 1,
    is_default INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela: generated_scripts (Para salvar roteiros gerados)
CREATE TABLE IF NOT EXISTS public.generated_scripts (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    agent_id UUID REFERENCES public.script_agents(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    duration INTEGER NOT NULL DEFAULT 5,
    language TEXT NOT NULL DEFAULT 'pt-BR',
    model_used TEXT,
    credits_used REAL NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_scripts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_credits
CREATE POLICY "Users can view their own credits" ON public.user_credits
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own credits" ON public.user_credits
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own credits" ON public.user_credits
    FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for credit_transactions
CREATE POLICY "Users can view their own transactions" ON public.credit_transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transactions" ON public.credit_transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for credit_usage
CREATE POLICY "Users can view their own usage" ON public.credit_usage
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own usage" ON public.credit_usage
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for api_providers (read-only for all users)
CREATE POLICY "Anyone can view active providers" ON public.api_providers
    FOR SELECT USING (is_active = 1);

-- RLS Policies for generated_scripts
CREATE POLICY "Users can view their own scripts" ON public.generated_scripts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own scripts" ON public.generated_scripts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own scripts" ON public.generated_scripts
    FOR DELETE USING (auth.uid() = user_id);

-- Função para criar créditos iniciais para novos usuários
-- Conforme documentação: FREE = 50 créditos
CREATE OR REPLACE FUNCTION public.handle_new_user_credits()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.user_credits (user_id, balance)
    VALUES (NEW.id, 50)
    ON CONFLICT (user_id) DO NOTHING;
    
    INSERT INTO public.credit_transactions (user_id, amount, transaction_type, description)
    VALUES (NEW.id, 50, 'add', 'Créditos iniciais - Plano Free');
    
    RETURN NEW;
END;
$$;

-- Trigger para criar créditos quando usuário é criado
DROP TRIGGER IF EXISTS on_auth_user_created_credits ON auth.users;
CREATE TRIGGER on_auth_user_created_credits
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_credits();

-- Insert default Lovable AI provider
INSERT INTO public.api_providers (name, provider, model, credits_per_unit, is_default, is_active)
VALUES ('Lovable AI', 'lovable', 'gemini-2.5-flash', 1.0, 1, 1)
ON CONFLICT DO NOTHING;
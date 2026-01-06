-- Adiciona coluna de limite de armazenamento na tabela plan_permissions (em GB)
ALTER TABLE public.plan_permissions 
ADD COLUMN IF NOT EXISTS storage_limit_gb NUMERIC DEFAULT 1;

-- Atualiza limites de armazenamento por plano
UPDATE public.plan_permissions SET storage_limit_gb = 0.5 WHERE plan_name = 'FREE';
UPDATE public.plan_permissions SET storage_limit_gb = 5 WHERE plan_name = 'START CREATOR';
UPDATE public.plan_permissions SET storage_limit_gb = 15 WHERE plan_name = 'TURBO MAKER';
UPDATE public.plan_permissions SET storage_limit_gb = 50 WHERE plan_name = 'MASTER PRO';

-- Cria tabela para rastrear uploads de arquivos por usuário
CREATE TABLE IF NOT EXISTS public.user_file_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bucket_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL DEFAULT 0,
  file_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(bucket_name, file_path)
);

-- Habilita RLS
ALTER TABLE public.user_file_uploads ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view their own uploads" 
ON public.user_file_uploads 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own uploads" 
ON public.user_file_uploads 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own uploads" 
ON public.user_file_uploads 
FOR DELETE 
USING (auth.uid() = user_id);

-- Função para calcular total de armazenamento usado pelo usuário (em bytes)
CREATE OR REPLACE FUNCTION public.get_user_storage_bytes(p_user_id UUID)
RETURNS BIGINT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(SUM(file_size), 0)::BIGINT
  FROM public.user_file_uploads
  WHERE user_id = p_user_id;
$$;

-- Função para obter limite de armazenamento do usuário com base no plano (em GB)
CREATE OR REPLACE FUNCTION public.get_user_storage_limit_gb(p_user_id UUID)
RETURNS NUMERIC
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT pp.storage_limit_gb 
     FROM public.plan_permissions pp
     INNER JOIN public.user_roles ur ON ur.role::text = LOWER(pp.plan_name)
     WHERE ur.user_id = p_user_id
     ORDER BY pp.storage_limit_gb DESC
     LIMIT 1
    ),
    1.0
  );
$$;

-- Função para verificar se usuário pode fazer upload (retorna true se tem espaço)
CREATE OR REPLACE FUNCTION public.can_user_upload(p_user_id UUID, p_file_size_bytes BIGINT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (
    public.get_user_storage_bytes(p_user_id) + p_file_size_bytes
  ) <= (public.get_user_storage_limit_gb(p_user_id) * 1073741824); -- 1 GB = 1073741824 bytes
$$;

-- Atualiza o storage_used e storage_limit no profile automaticamente
CREATE OR REPLACE FUNCTION public.sync_user_storage()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_storage_bytes BIGINT;
  v_storage_gb NUMERIC;
  v_limit_gb NUMERIC;
BEGIN
  -- Pega o user_id correto dependendo se é INSERT/UPDATE ou DELETE
  IF TG_OP = 'DELETE' THEN
    v_storage_bytes := public.get_user_storage_bytes(OLD.user_id);
    v_limit_gb := public.get_user_storage_limit_gb(OLD.user_id);
    v_storage_gb := v_storage_bytes / 1073741824.0;
    
    UPDATE public.profiles 
    SET storage_used = v_storage_gb,
        storage_limit = v_limit_gb
    WHERE id = OLD.user_id;
    
    RETURN OLD;
  ELSE
    v_storage_bytes := public.get_user_storage_bytes(NEW.user_id);
    v_limit_gb := public.get_user_storage_limit_gb(NEW.user_id);
    v_storage_gb := v_storage_bytes / 1073741824.0;
    
    UPDATE public.profiles 
    SET storage_used = v_storage_gb,
        storage_limit = v_limit_gb
    WHERE id = NEW.user_id;
    
    RETURN NEW;
  END IF;
END;
$$;

-- Trigger para sincronizar automaticamente
DROP TRIGGER IF EXISTS trigger_sync_user_storage ON public.user_file_uploads;
CREATE TRIGGER trigger_sync_user_storage
AFTER INSERT OR DELETE ON public.user_file_uploads
FOR EACH ROW EXECUTE FUNCTION public.sync_user_storage();

-- Também sincroniza quando o role do usuário muda (afeta limite de storage)
CREATE OR REPLACE FUNCTION public.sync_storage_on_role_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_storage_bytes BIGINT;
  v_storage_gb NUMERIC;
  v_limit_gb NUMERIC;
BEGIN
  v_storage_bytes := public.get_user_storage_bytes(NEW.user_id);
  v_limit_gb := public.get_user_storage_limit_gb(NEW.user_id);
  v_storage_gb := v_storage_bytes / 1073741824.0;
  
  UPDATE public.profiles 
  SET storage_used = v_storage_gb,
      storage_limit = v_limit_gb
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_sync_storage_on_role_change ON public.user_roles;
CREATE TRIGGER trigger_sync_storage_on_role_change
AFTER INSERT OR UPDATE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.sync_storage_on_role_change();
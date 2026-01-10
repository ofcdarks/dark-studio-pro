-- Tabela para permissões individuais por usuário
CREATE TABLE public.user_individual_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permission_key TEXT NOT NULL,
  granted_by UUID REFERENCES auth.users(id),
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  UNIQUE(user_id, permission_key)
);

-- Habilitar RLS
ALTER TABLE public.user_individual_permissions ENABLE ROW LEVEL SECURITY;

-- Política para admins gerenciarem
CREATE POLICY "Admins can manage individual permissions"
ON public.user_individual_permissions
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Política para usuários verem suas próprias permissões
CREATE POLICY "Users can view their own permissions"
ON public.user_individual_permissions
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Índice para performance
CREATE INDEX idx_user_individual_permissions_user_id ON public.user_individual_permissions(user_id);
CREATE INDEX idx_user_individual_permissions_key ON public.user_individual_permissions(permission_key);
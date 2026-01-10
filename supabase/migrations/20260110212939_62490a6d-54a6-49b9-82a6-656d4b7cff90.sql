-- Adicionar coluna auth_provider à tabela profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS auth_provider TEXT DEFAULT 'email';

-- Atualizar registros existentes baseado no auth.users
UPDATE public.profiles p
SET auth_provider = COALESCE(
  (SELECT au.raw_app_meta_data->>'provider' 
   FROM auth.users au 
   WHERE au.id = p.id),
  'email'
);

-- Atualizar a função handle_new_user para capturar o provider
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, status, auth_provider)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url',
    'pending',
    COALESCE(NEW.raw_app_meta_data->>'provider', 'email')
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'free');
  
  RETURN NEW;
END;
$$;
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('diretoria', 'comercial');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role public.app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

CREATE OR REPLACE FUNCTION public.current_profile_name()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE((SELECT display_name FROM public.profiles WHERE user_id = auth.uid() LIMIT 1), 'Usuário');
$$;

CREATE OR REPLACE FUNCTION public.set_audit_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  profile_name text;
BEGIN
  profile_name := public.current_profile_name();
  IF TG_OP = 'INSERT' THEN
    NEW.created_by = profile_name;
    NEW.updated_by = profile_name;
  ELSE
    NEW.created_by = OLD.created_by;
    NEW.updated_by = profile_name;
  END IF;
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

ALTER TABLE public.estoque ADD COLUMN IF NOT EXISTS created_by TEXT NOT NULL DEFAULT 'Sistema';
ALTER TABLE public.estoque ADD COLUMN IF NOT EXISTS updated_by TEXT NOT NULL DEFAULT 'Sistema';
ALTER TABLE public.vendas ADD COLUMN IF NOT EXISTS created_by TEXT NOT NULL DEFAULT 'Sistema';
ALTER TABLE public.vendas ADD COLUMN IF NOT EXISTS updated_by TEXT NOT NULL DEFAULT 'Sistema';
ALTER TABLE public.marketing ADD COLUMN IF NOT EXISTS created_by TEXT NOT NULL DEFAULT 'Sistema';
ALTER TABLE public.marketing ADD COLUMN IF NOT EXISTS updated_by TEXT NOT NULL DEFAULT 'Sistema';
ALTER TABLE public.financeiro ADD COLUMN IF NOT EXISTS created_by TEXT NOT NULL DEFAULT 'Sistema';
ALTER TABLE public.financeiro ADD COLUMN IF NOT EXISTS updated_by TEXT NOT NULL DEFAULT 'Sistema';

DROP TRIGGER IF EXISTS set_audit_estoque ON public.estoque;
CREATE TRIGGER set_audit_estoque BEFORE INSERT OR UPDATE ON public.estoque FOR EACH ROW EXECUTE FUNCTION public.set_audit_fields();
DROP TRIGGER IF EXISTS set_audit_vendas ON public.vendas;
CREATE TRIGGER set_audit_vendas BEFORE INSERT OR UPDATE ON public.vendas FOR EACH ROW EXECUTE FUNCTION public.set_audit_fields();
DROP TRIGGER IF EXISTS set_audit_marketing ON public.marketing;
CREATE TRIGGER set_audit_marketing BEFORE INSERT OR UPDATE ON public.marketing FOR EACH ROW EXECUTE FUNCTION public.set_audit_fields();
DROP TRIGGER IF EXISTS set_audit_financeiro ON public.financeiro;
CREATE TRIGGER set_audit_financeiro BEFORE INSERT OR UPDATE ON public.financeiro FOR EACH ROW EXECUTE FUNCTION public.set_audit_fields();

DROP POLICY IF EXISTS "Profiles can be read by authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Profiles can be read by authenticated users" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can read their own roles" ON public.user_roles;
CREATE POLICY "Users can read their own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone can read estoque" ON public.estoque;
DROP POLICY IF EXISTS "Anyone can insert estoque" ON public.estoque;
DROP POLICY IF EXISTS "Anyone can update estoque" ON public.estoque;
DROP POLICY IF EXISTS "Anyone can delete estoque" ON public.estoque;
DROP POLICY IF EXISTS "Authenticated users can read estoque" ON public.estoque;
DROP POLICY IF EXISTS "Authenticated users can insert estoque" ON public.estoque;
DROP POLICY IF EXISTS "Authenticated users can update estoque" ON public.estoque;
DROP POLICY IF EXISTS "Authenticated users can delete estoque" ON public.estoque;
CREATE POLICY "Authenticated users can read estoque" ON public.estoque FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert estoque" ON public.estoque FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update estoque" ON public.estoque FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete estoque" ON public.estoque FOR DELETE TO authenticated USING (true);

DROP POLICY IF EXISTS "Anyone can read vendas" ON public.vendas;
DROP POLICY IF EXISTS "Anyone can insert vendas" ON public.vendas;
DROP POLICY IF EXISTS "Anyone can update vendas" ON public.vendas;
DROP POLICY IF EXISTS "Anyone can delete vendas" ON public.vendas;
DROP POLICY IF EXISTS "Authenticated users can read vendas" ON public.vendas;
DROP POLICY IF EXISTS "Authenticated users can insert vendas" ON public.vendas;
DROP POLICY IF EXISTS "Authenticated users can update vendas" ON public.vendas;
DROP POLICY IF EXISTS "Authenticated users can delete vendas" ON public.vendas;
CREATE POLICY "Authenticated users can read vendas" ON public.vendas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert vendas" ON public.vendas FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update vendas" ON public.vendas FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete vendas" ON public.vendas FOR DELETE TO authenticated USING (true);

DROP POLICY IF EXISTS "Anyone can read marketing" ON public.marketing;
DROP POLICY IF EXISTS "Anyone can insert marketing" ON public.marketing;
DROP POLICY IF EXISTS "Anyone can update marketing" ON public.marketing;
DROP POLICY IF EXISTS "Anyone can delete marketing" ON public.marketing;
DROP POLICY IF EXISTS "Authenticated users can read marketing" ON public.marketing;
DROP POLICY IF EXISTS "Authenticated users can insert marketing" ON public.marketing;
DROP POLICY IF EXISTS "Authenticated users can update marketing" ON public.marketing;
DROP POLICY IF EXISTS "Authenticated users can delete marketing" ON public.marketing;
CREATE POLICY "Authenticated users can read marketing" ON public.marketing FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert marketing" ON public.marketing FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update marketing" ON public.marketing FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete marketing" ON public.marketing FOR DELETE TO authenticated USING (true);

DROP POLICY IF EXISTS "Anyone can read financeiro" ON public.financeiro;
DROP POLICY IF EXISTS "Anyone can insert financeiro" ON public.financeiro;
DROP POLICY IF EXISTS "Anyone can update financeiro" ON public.financeiro;
DROP POLICY IF EXISTS "Anyone can delete financeiro" ON public.financeiro;
DROP POLICY IF EXISTS "Authenticated users can read financeiro" ON public.financeiro;
DROP POLICY IF EXISTS "Authenticated users can insert financeiro" ON public.financeiro;
DROP POLICY IF EXISTS "Authenticated users can update financeiro" ON public.financeiro;
DROP POLICY IF EXISTS "Authenticated users can delete financeiro" ON public.financeiro;
CREATE POLICY "Authenticated users can read financeiro" ON public.financeiro FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert financeiro" ON public.financeiro FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update financeiro" ON public.financeiro FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete financeiro" ON public.financeiro FOR DELETE TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
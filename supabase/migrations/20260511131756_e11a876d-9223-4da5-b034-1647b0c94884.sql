
-- DESPESAS
CREATE TABLE public.despesas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  data date NOT NULL,
  categoria text NOT NULL,
  subcategoria text NOT NULL DEFAULT '',
  descricao text NOT NULL DEFAULT '',
  valor numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'Pago',
  data_vencimento date,
  data_pagamento date,
  forma_pagamento text NOT NULL DEFAULT '',
  observacoes text NOT NULL DEFAULT '',
  created_by text NOT NULL DEFAULT 'Sistema',
  updated_by text NOT NULL DEFAULT 'Sistema',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.despesas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read despesas" ON public.despesas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Team can insert despesas" ON public.despesas FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'diretoria'::app_role) OR has_role(auth.uid(), 'comercial'::app_role));
CREATE POLICY "Team can update despesas" ON public.despesas FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'diretoria'::app_role) OR has_role(auth.uid(), 'comercial'::app_role));
CREATE POLICY "Team can delete despesas" ON public.despesas FOR DELETE TO authenticated USING (has_role(auth.uid(), 'diretoria'::app_role) OR has_role(auth.uid(), 'comercial'::app_role));
CREATE TRIGGER set_despesas_audit BEFORE INSERT OR UPDATE ON public.despesas FOR EACH ROW EXECUTE FUNCTION public.set_audit_fields();

-- CLIENTES
CREATE TABLE public.clientes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  cpf_cnpj text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  telefone text NOT NULL DEFAULT '',
  cidade text NOT NULL DEFAULT '',
  uf text NOT NULL DEFAULT '',
  canal_origem text NOT NULL DEFAULT '',
  observacoes text NOT NULL DEFAULT '',
  created_by text NOT NULL DEFAULT 'Sistema',
  updated_by text NOT NULL DEFAULT 'Sistema',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read clientes" ON public.clientes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Team can insert clientes" ON public.clientes FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'diretoria'::app_role) OR has_role(auth.uid(), 'comercial'::app_role));
CREATE POLICY "Team can update clientes" ON public.clientes FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'diretoria'::app_role) OR has_role(auth.uid(), 'comercial'::app_role));
CREATE POLICY "Team can delete clientes" ON public.clientes FOR DELETE TO authenticated USING (has_role(auth.uid(), 'diretoria'::app_role) OR has_role(auth.uid(), 'comercial'::app_role));
CREATE TRIGGER set_clientes_audit BEFORE INSERT OR UPDATE ON public.clientes FOR EACH ROW EXECUTE FUNCTION public.set_audit_fields();

-- vendas: cliente_id opcional
ALTER TABLE public.vendas ADD COLUMN cliente_id uuid REFERENCES public.clientes(id) ON DELETE SET NULL;

-- CONTAS A RECEBER
CREATE TABLE public.contas_receber (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  data date NOT NULL,
  descricao text NOT NULL DEFAULT '',
  cliente_id uuid REFERENCES public.clientes(id) ON DELETE SET NULL,
  cliente_nome text NOT NULL DEFAULT '',
  valor numeric NOT NULL DEFAULT 0,
  vencimento date,
  status text NOT NULL DEFAULT 'Pendente',
  data_recebimento date,
  observacoes text NOT NULL DEFAULT '',
  created_by text NOT NULL DEFAULT 'Sistema',
  updated_by text NOT NULL DEFAULT 'Sistema',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.contas_receber ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read contas_receber" ON public.contas_receber FOR SELECT TO authenticated USING (true);
CREATE POLICY "Team can insert contas_receber" ON public.contas_receber FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'diretoria'::app_role) OR has_role(auth.uid(), 'comercial'::app_role));
CREATE POLICY "Team can update contas_receber" ON public.contas_receber FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'diretoria'::app_role) OR has_role(auth.uid(), 'comercial'::app_role));
CREATE POLICY "Team can delete contas_receber" ON public.contas_receber FOR DELETE TO authenticated USING (has_role(auth.uid(), 'diretoria'::app_role) OR has_role(auth.uid(), 'comercial'::app_role));
CREATE TRIGGER set_contas_receber_audit BEFORE INSERT OR UPDATE ON public.contas_receber FOR EACH ROW EXECUTE FUNCTION public.set_audit_fields();

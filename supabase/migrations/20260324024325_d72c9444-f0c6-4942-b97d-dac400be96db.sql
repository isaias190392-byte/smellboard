
-- Add observacoes column to estoque
ALTER TABLE public.estoque ADD COLUMN IF NOT EXISTS observacoes text NOT NULL DEFAULT '';

-- Create financeiro table
CREATE TABLE public.financeiro (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  data date NOT NULL,
  tipo text NOT NULL DEFAULT 'Compra',
  descricao text NOT NULL DEFAULT '',
  sku text NOT NULL DEFAULT '',
  quantidade integer NOT NULL DEFAULT 0,
  custo_unitario numeric NOT NULL DEFAULT 0,
  frete numeric NOT NULL DEFAULT 0,
  custo_total numeric NOT NULL DEFAULT 0,
  preco_venda numeric NOT NULL DEFAULT 0,
  markup numeric NOT NULL DEFAULT 0,
  receita numeric NOT NULL DEFAULT 0,
  lucro_bruto numeric NOT NULL DEFAULT 0,
  observacoes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.financeiro ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read financeiro" ON public.financeiro FOR SELECT TO public USING (true);
CREATE POLICY "Anyone can insert financeiro" ON public.financeiro FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Anyone can update financeiro" ON public.financeiro FOR UPDATE TO public USING (true);
CREATE POLICY "Anyone can delete financeiro" ON public.financeiro FOR DELETE TO public USING (true);

CREATE TRIGGER update_financeiro_updated_at BEFORE UPDATE ON public.financeiro FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- ESTOQUE table
CREATE TABLE public.estoque (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  data DATE NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('Entrada', 'Saída')),
  categoria TEXT NOT NULL CHECK (categoria IN ('Venda', 'Doação', 'Marketing', 'Teste', 'Perda')),
  canal TEXT NOT NULL DEFAULT '',
  sku TEXT NOT NULL CHECK (sku IN ('INTENSE', 'TEXAS', 'SUNSET', 'GARDEN', 'BRISE')),
  quantidade INTEGER NOT NULL CHECK (quantidade > 0),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.estoque ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read estoque" ON public.estoque FOR SELECT USING (true);
CREATE POLICY "Anyone can insert estoque" ON public.estoque FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update estoque" ON public.estoque FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete estoque" ON public.estoque FOR DELETE USING (true);

CREATE TRIGGER update_estoque_updated_at BEFORE UPDATE ON public.estoque FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- VENDAS table
CREATE TABLE public.vendas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  data DATE NOT NULL,
  canal TEXT NOT NULL,
  sku TEXT NOT NULL CHECK (sku IN ('INTENSE', 'TEXAS', 'SUNSET', 'GARDEN', 'BRISE')),
  formato TEXT NOT NULL CHECK (formato IN ('Unitário', 'Kit 5', 'Kit 12')),
  quantidade INTEGER NOT NULL CHECK (quantidade > 0),
  preco_unitario NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.vendas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read vendas" ON public.vendas FOR SELECT USING (true);
CREATE POLICY "Anyone can insert vendas" ON public.vendas FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update vendas" ON public.vendas FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete vendas" ON public.vendas FOR DELETE USING (true);

CREATE TRIGGER update_vendas_updated_at BEFORE UPDATE ON public.vendas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- MARKETING table
CREATE TABLE public.marketing (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  data DATE NOT NULL,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('UGC', 'Influencer', 'Doação')),
  sku TEXT NOT NULL CHECK (sku IN ('INTENSE', 'TEXAS', 'SUNSET', 'GARDEN', 'BRISE')),
  qtd_enviada INTEGER NOT NULL CHECK (qtd_enviada > 0),
  canal_origem TEXT NOT NULL DEFAULT '',
  vendas_geradas INTEGER NOT NULL DEFAULT 0,
  seguidores_gerados INTEGER NOT NULL DEFAULT 0,
  observacoes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.marketing ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read marketing" ON public.marketing FOR SELECT USING (true);
CREATE POLICY "Anyone can insert marketing" ON public.marketing FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update marketing" ON public.marketing FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete marketing" ON public.marketing FOR DELETE USING (true);

CREATE TRIGGER update_marketing_updated_at BEFORE UPDATE ON public.marketing FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample data
INSERT INTO public.estoque (data, tipo, categoria, canal, sku, quantidade) VALUES
  ('2025-01-15', 'Entrada', 'Venda', '', 'INTENSE', 200),
  ('2025-01-15', 'Entrada', 'Venda', '', 'TEXAS', 200),
  ('2025-01-15', 'Entrada', 'Venda', '', 'SUNSET', 150),
  ('2025-01-15', 'Entrada', 'Venda', '', 'GARDEN', 150),
  ('2025-01-15', 'Entrada', 'Venda', '', 'BRISE', 100),
  ('2025-01-20', 'Saída', 'Venda', 'Mercado Livre', 'INTENSE', 25),
  ('2025-01-22', 'Saída', 'Venda', 'Shopee', 'TEXAS', 18),
  ('2025-01-25', 'Saída', 'Marketing', 'Direto (WhatsApp/Instagram)', 'SUNSET', 10),
  ('2025-02-01', 'Saída', 'Doação', '', 'GARDEN', 5),
  ('2025-02-05', 'Saída', 'Venda', 'B2B (Kit 12)', 'BRISE', 36);

INSERT INTO public.vendas (data, canal, sku, formato, quantidade, preco_unitario) VALUES
  ('2025-01-20', 'Mercado Livre', 'INTENSE', 'Unitário', 25, 29.90),
  ('2025-01-22', 'Shopee', 'TEXAS', 'Unitário', 18, 24.90),
  ('2025-01-28', 'Direto (WhatsApp/Instagram)', 'SUNSET', 'Kit 5', 15, 25.00),
  ('2025-02-01', 'B2B (Kit 12)', 'BRISE', 'Kit 12', 36, 19.90),
  ('2025-02-10', 'Mercado Livre', 'GARDEN', 'Unitário', 12, 29.90);

INSERT INTO public.marketing (data, nome, tipo, sku, qtd_enviada, canal_origem, vendas_geradas, seguidores_gerados, observacoes) VALUES
  ('2025-01-25', '@auto_clean_br', 'Influencer', 'SUNSET', 5, 'Instagram', 12, 320, 'Stories + Reels'),
  ('2025-02-01', '@detailer_pro', 'UGC', 'INTENSE', 3, 'TikTok', 8, 150, 'Vídeo review'),
  ('2025-02-05', 'Lava Rápido Central', 'Doação', 'GARDEN', 5, 'WhatsApp', 3, 0, 'Parceria local');

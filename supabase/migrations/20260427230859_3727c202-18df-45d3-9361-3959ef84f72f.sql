ALTER TABLE public.marketing DROP CONSTRAINT IF EXISTS marketing_sku_check;
ALTER TABLE public.marketing ADD CONSTRAINT marketing_sku_check CHECK (sku IN ('INTENSE', 'TEXAS', 'SUNSET', 'GARDEN', 'BRISE', 'KIT DEGUSTAÇÃO', 'KIT VARIADO', 'KIT BRISE', 'KIT INTENSE', 'KIT TEXAS', 'KIT SUNSET', 'KIT GARDEN'));

ALTER TABLE public.vendas DROP CONSTRAINT IF EXISTS vendas_sku_check;
ALTER TABLE public.vendas ADD CONSTRAINT vendas_sku_check CHECK (sku IN ('INTENSE', 'TEXAS', 'SUNSET', 'GARDEN', 'BRISE', 'KIT DEGUSTAÇÃO', 'KIT VARIADO', 'KIT BRISE', 'KIT INTENSE', 'KIT TEXAS', 'KIT SUNSET', 'KIT GARDEN'));

ALTER TABLE public.marketing DROP CONSTRAINT IF EXISTS marketing_tipo_check;
ALTER TABLE public.marketing ADD CONSTRAINT marketing_tipo_check CHECK (tipo IN ('UGC', 'Influencer', 'Doação', 'Evento'));

ALTER TABLE public.estoque DROP CONSTRAINT IF EXISTS estoque_categoria_check;
ALTER TABLE public.estoque ADD CONSTRAINT estoque_categoria_check CHECK (categoria IN ('Venda', 'Doação', 'Marketing', 'Teste', 'Perda', 'Compra'));

ALTER TABLE public.estoque DROP CONSTRAINT IF EXISTS estoque_sku_check;
ALTER TABLE public.estoque ADD CONSTRAINT estoque_sku_check CHECK (sku IN ('INTENSE', 'TEXAS', 'SUNSET', 'GARDEN', 'BRISE'));

DROP POLICY IF EXISTS "Authenticated users can insert estoque" ON public.estoque;
DROP POLICY IF EXISTS "Authenticated users can update estoque" ON public.estoque;
DROP POLICY IF EXISTS "Authenticated users can delete estoque" ON public.estoque;
CREATE POLICY "Team can insert estoque" ON public.estoque FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'diretoria') OR public.has_role(auth.uid(), 'comercial'));
CREATE POLICY "Team can update estoque" ON public.estoque FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'diretoria') OR public.has_role(auth.uid(), 'comercial'));
CREATE POLICY "Team can delete estoque" ON public.estoque FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'diretoria') OR public.has_role(auth.uid(), 'comercial'));

DROP POLICY IF EXISTS "Authenticated users can insert vendas" ON public.vendas;
DROP POLICY IF EXISTS "Authenticated users can update vendas" ON public.vendas;
DROP POLICY IF EXISTS "Authenticated users can delete vendas" ON public.vendas;
CREATE POLICY "Team can insert vendas" ON public.vendas FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'diretoria') OR public.has_role(auth.uid(), 'comercial'));
CREATE POLICY "Team can update vendas" ON public.vendas FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'diretoria') OR public.has_role(auth.uid(), 'comercial'));
CREATE POLICY "Team can delete vendas" ON public.vendas FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'diretoria') OR public.has_role(auth.uid(), 'comercial'));

DROP POLICY IF EXISTS "Authenticated users can insert marketing" ON public.marketing;
DROP POLICY IF EXISTS "Authenticated users can update marketing" ON public.marketing;
DROP POLICY IF EXISTS "Authenticated users can delete marketing" ON public.marketing;
CREATE POLICY "Team can insert marketing" ON public.marketing FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'diretoria') OR public.has_role(auth.uid(), 'comercial'));
CREATE POLICY "Team can update marketing" ON public.marketing FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'diretoria') OR public.has_role(auth.uid(), 'comercial'));
CREATE POLICY "Team can delete marketing" ON public.marketing FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'diretoria') OR public.has_role(auth.uid(), 'comercial'));

DROP POLICY IF EXISTS "Authenticated users can insert financeiro" ON public.financeiro;
DROP POLICY IF EXISTS "Authenticated users can update financeiro" ON public.financeiro;
DROP POLICY IF EXISTS "Authenticated users can delete financeiro" ON public.financeiro;
CREATE POLICY "Team can insert financeiro" ON public.financeiro FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'diretoria') OR public.has_role(auth.uid(), 'comercial'));
CREATE POLICY "Team can update financeiro" ON public.financeiro FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'diretoria') OR public.has_role(auth.uid(), 'comercial'));
CREATE POLICY "Team can delete financeiro" ON public.financeiro FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'diretoria') OR public.has_role(auth.uid(), 'comercial'));
import { useState, useEffect } from "react";
import PageHeader from "@/components/PageHeader";
import KpiCard from "@/components/KpiCard";
import { DollarSign, TrendingUp, Boxes, Megaphone, ShoppingCart } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { fetchEstoque, fetchVendas, fetchMarketing, calcSaldoEstoque, calcSaldoPorSku, SKUS_UNITARIOS, CANAIS, CONFIG, SKU_COLORS, EstoqueRecord, VendaRecord, MarketingRecord, getUnidadesReais, decomporSku } from "@/lib/store";

const COLORS = ["#4F028B", "#DC2626", "#EAB308", "#2563EB"];

const DashboardPage = () => {
  const [estoque, setEstoque] = useState<EstoqueRecord[]>([]);
  const [vendas, setVendas] = useState<VendaRecord[]>([]);
  const [marketing, setMarketing] = useState<MarketingRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchEstoque(), fetchVendas(), fetchMarketing()])
      .then(([e, v, m]) => { setEstoque(e); setVendas(v); setMarketing(m); })
      .finally(() => setLoading(false));
  }, []);

  const fmt = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const saldo = calcSaldoEstoque(estoque);
  const saldoPorSku = calcSaldoPorSku(estoque);
  const receitaTotal = vendas.reduce((a, v) => a + v.precoTotal, 0);
  const custoTotal = vendas.reduce((a, v) => a + getUnidadesReais(v.sku, v.quantidade) * CONFIG.custoUnitario, 0);
  const lucroTotal = receitaTotal - custoTotal;
  const margem = receitaTotal ? (lucroTotal / receitaTotal) * 100 : 0;
  const totalMarketing = marketing.reduce((a, r) => a + getUnidadesReais(r.sku, r.qtdEnviada), 0);
  const custoMarketing = totalMarketing * CONFIG.custoUnitario;
  const vendasGeradas = marketing.reduce((a, r) => a + r.vendasGeradas, 0);

  const receitaPorCanal = CANAIS.map(c => ({
    name: c.includes("(") ? c.split("(")[0].trim() : c,
    value: vendas.filter(v => v.canal === c).reduce((a, v) => a + v.precoTotal, 0),
  })).filter(d => d.value > 0);

  const vendasBase: Record<string, number> = Object.fromEntries(SKUS_UNITARIOS.map(s => [s, 0]));
  vendas.forEach(v => Object.entries(decomporSku(v.sku, v.quantidade)).forEach(([sku, qtd]) => { vendasBase[sku] = (vendasBase[sku] || 0) + qtd; }));
  const skuMaisVendido = Object.entries(vendasBase).sort((a, b) => b[1] - a[1])[0];
  const estoqueData = SKUS_UNITARIOS.map(sku => ({ name: sku, value: saldoPorSku[sku] || 0 }));

  const status = (qtd: number) => qtd >= 50 ? "OK" : qtd >= 20 ? "ATENÇÃO" : "BAIXO";
  const statusClass = (qtd: number) => qtd >= 50 ? "bg-emerald-100 text-emerald-700" : qtd >= 20 ? "bg-accent text-accent-foreground" : "bg-destructive/10 text-destructive";

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><p className="text-muted-foreground">Carregando...</p></div>;

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="Dashboard" subtitle="Números essenciais e confiáveis" />
      <div className="mx-auto max-w-7xl px-6 py-8 space-y-8 animate-fade-in">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <KpiCard label="Receita Total" value={fmt(receitaTotal)} icon={DollarSign} variant="primary" />
          <KpiCard label="Custo Total (CMV)" value={fmt(custoTotal)} icon={ShoppingCart} variant="warning" />
          <KpiCard label="Lucro Bruto" value={fmt(lucroTotal)} icon={TrendingUp} variant="success" />
          <KpiCard label="Margem" value={`${margem.toFixed(1)}%`} icon={TrendingUp} />
        </div>

        <div className="rounded-lg border border-border bg-card p-6">
          <div className="mb-5 flex items-center justify-between"><h3 className="font-display font-semibold">Estoque Atual</h3><span className="text-sm font-bold text-primary">{saldo} un</span></div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-5">
            {SKUS_UNITARIOS.map(sku => {
              const qtd = saldoPorSku[sku] || 0;
              return <div key={sku} className="rounded-lg border border-border p-4 transition-all hover:shadow-card hover:border-primary/20">
                <div className="mb-2 h-2 rounded-full" style={{ backgroundColor: SKU_COLORS[sku] }} />
                <p className="text-sm font-medium">{sku}</p>
                <p className="font-display text-2xl font-bold" style={{ color: SKU_COLORS[sku] }}>{qtd}</p>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusClass(qtd)}`}>{status(qtd)}</span>
              </div>;
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-lg border border-border bg-card p-6">
            <h3 className="font-display font-semibold mb-4">Saldo por SKU Unitário</h3>
            <ResponsiveContainer width="100%" height={260}><BarChart data={estoqueData}><CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" /><XAxis dataKey="name" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 12 }} /><Tooltip /><Bar dataKey="value" name="Saldo" radius={[6, 6, 0, 0]}>{estoqueData.map(entry => <Cell key={entry.name} fill={SKU_COLORS[entry.name]} />)}</Bar></BarChart></ResponsiveContainer>
          </div>
          <div className="rounded-lg border border-border bg-card p-6">
            <h3 className="font-display font-semibold mb-4">Receita por Canal</h3>
            <ResponsiveContainer width="100%" height={260}><PieChart><Pie data={receitaPorCanal} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>{receitaPorCanal.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip formatter={(v: number) => fmt(v)} /></PieChart></ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <KpiCard label="SKU Mais Vendido" value={skuMaisVendido?.[0] || "—"} icon={ShoppingCart} variant="primary" />
          <KpiCard label="Unid. Marketing" value={`${totalMarketing}`} icon={Megaphone} />
          <KpiCard label="Custo Marketing" value={fmt(custoMarketing)} icon={Megaphone} variant="warning" />
          <KpiCard label="Vendas Geradas" value={`${vendasGeradas}`} icon={TrendingUp} variant="success" />
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;

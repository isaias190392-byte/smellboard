import PageHeader from "@/components/PageHeader";
import KpiCard from "@/components/KpiCard";
import { DollarSign, TrendingUp, Boxes, ShoppingCart, Target, Users, Package, Megaphone } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line } from "recharts";
import { getEstoque, getVendas, getMarketing, calcSaldoEstoque, calcSaldoPorSku, SKUS, CANAIS, CONFIG } from "@/lib/store";

const COLORS = ["#4F028B", "#7B3FAF", "#A855F7", "#C084FC"];

const DashboardPage = () => {
  const estoque = getEstoque();
  const vendas = getVendas();
  const marketing = getMarketing();
  const fmt = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const saldo = calcSaldoEstoque(estoque);
  const saldoPorSku = calcSaldoPorSku(estoque);
  const totalProduzido = estoque.filter(r => r.tipo === "Entrada").reduce((a, r) => a + r.quantidade, 0);
  const totalVendido = vendas.reduce((a, v) => a + v.quantidade, 0);
  const totalDoado = estoque.filter(r => r.tipo === "Saída" && r.categoria === "Doação").reduce((a, r) => a + r.quantidade, 0);
  const receitaTotal = vendas.reduce((a, v) => a + v.quantidade * v.precoUnitario, 0);
  const custoTotal = vendas.reduce((a, v) => a + v.quantidade * CONFIG.custoUnitario, 0);
  const lucroTotal = receitaTotal - custoTotal;
  const margem = receitaTotal ? (lucroTotal / receitaTotal) * 100 : 0;
  const mktCusto = marketing.reduce((a, r) => a + r.qtdEnviada * CONFIG.custoUnitario, 0);
  const cac = totalVendido ? mktCusto / totalVendido : 0;
  const mktPct = totalProduzido ? (estoque.filter(r => r.tipo === "Saída" && r.categoria === "Marketing").reduce((a, r) => a + r.quantidade, 0) / totalProduzido * 100) : 0;

  // Charts
  const receitaPorCanal = CANAIS.map(c => ({
    name: c.includes("(") ? c.split("(")[0].trim() : c,
    value: vendas.filter(v => v.canal === c).reduce((a, v) => a + v.quantidade * v.precoUnitario, 0),
  })).filter(d => d.value > 0);

  const margemPorCanal = CANAIS.map(c => {
    const rec = vendas.filter(v => v.canal === c).reduce((a, v) => a + v.quantidade * v.precoUnitario, 0);
    const cst = vendas.filter(v => v.canal === c).reduce((a, v) => a + v.quantidade * CONFIG.custoUnitario, 0);
    return { name: c.includes("(") ? c.split("(")[0].trim() : c, margem: rec ? ((rec - cst) / rec) * 100 : 0 };
  }).filter(d => d.margem > 0);

  const vendasPorSku = SKUS.map(s => ({
    name: s.split(" ")[0],
    qty: vendas.filter(v => v.sku === s).reduce((a, v) => a + v.quantidade, 0),
  })).sort((a, b) => b.qty - a.qty);

  // Daily evolution
  const dailyMap: Record<string, number> = {};
  vendas.forEach(v => { dailyMap[v.data] = (dailyMap[v.data] || 0) + v.quantidade * v.precoUnitario; });
  const dailyData = Object.entries(dailyMap).sort().map(([data, receita]) => ({ data: data.slice(5), receita }));

  // Best canal
  const canalReceitas = CANAIS.map(c => ({ canal: c, receita: vendas.filter(v => v.canal === c).reduce((a, v) => a + v.quantidade * v.precoUnitario, 0) }));
  const melhorCanal = canalReceitas.sort((a, b) => b.receita - a.receita)[0];
  const melhorSku = vendasPorSku[0];

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="Dashboard Investidor" subtitle="Visão estratégica consolidada" />
      <div className="mx-auto max-w-7xl px-6 py-8 space-y-8 animate-fade-in">
        {/* Investor Report Summary */}
        <div className="gradient-dark rounded-xl p-8 text-white">
          <h2 className="font-display text-2xl font-bold mb-6">📊 Investor Report — Smell & Go</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-5">
            {[
              { label: "Produzido", value: `${totalProduzido} un` },
              { label: "Vendido", value: `${totalVendido} un` },
              { label: "Em Estoque", value: `${saldo} un` },
              { label: "Doado", value: `${totalDoado} un` },
              { label: "Receita", value: fmt(receitaTotal) },
              { label: "Lucro", value: fmt(lucroTotal) },
              { label: "Margem", value: `${margem.toFixed(1)}%` },
              { label: "CAC", value: fmt(cac) },
              { label: "Melhor Canal", value: melhorCanal?.canal.split("(")[0].trim() || "—" },
              { label: "Top SKU", value: melhorSku?.name || "—" },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-lg border border-white/10 bg-white/5 p-3 backdrop-blur">
                <p className="text-xs opacity-60">{label}</p>
                <p className="text-lg font-bold font-display">{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <KpiCard label="Receita Total" value={fmt(receitaTotal)} icon={DollarSign} variant="primary" />
          <KpiCard label="Lucro Total" value={fmt(lucroTotal)} icon={TrendingUp} variant="success" />
          <KpiCard label="Estoque Atual" value={`${saldo} un`} icon={Boxes} />
          <KpiCard label="% Mkt no Estoque" value={`${mktPct.toFixed(1)}%`} icon={Megaphone} variant="warning" />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-lg border border-border bg-card p-6">
            <h3 className="font-display font-semibold mb-4">Receita por Canal</h3>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={receitaPorCanal} cx="50%" cy="50%" outerRadius={100} innerRadius={50} dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {receitaPorCanal.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: number) => fmt(v)} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-lg border border-border bg-card p-6">
            <h3 className="font-display font-semibold mb-4">Ranking SKU (Unidades)</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={vendasPorSku}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="qty" name="Unidades" fill="#4F028B" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-lg border border-border bg-card p-6">
            <h3 className="font-display font-semibold mb-4">Margem por Canal (%)</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={margemPorCanal}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} />
                <Tooltip formatter={(v: number) => `${v.toFixed(1)}%`} />
                <Bar dataKey="margem" name="Margem %" fill="#7B3FAF" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-lg border border-border bg-card p-6">
            <h3 className="font-display font-semibold mb-4">Evolução Diária de Receita</h3>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="data" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v: number) => fmt(v)} />
                <Line type="monotone" dataKey="receita" stroke="#4F028B" strokeWidth={2} dot={{ fill: "#4F028B", r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Estoque por SKU */}
        <div className="rounded-lg border border-border bg-card p-6">
          <h3 className="font-display font-semibold mb-4">Estoque Atual por Fragrância</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-5">
            {SKUS.map((sku, i) => {
              const s = saldoPorSku[sku] || 0;
              const pct = totalProduzido ? (s / totalProduzido) * 100 : 0;
              return (
                <div key={sku} className="rounded-lg border border-border p-4 text-center transition-all hover:shadow-card hover:border-primary/20">
                  <div className="mx-auto mb-2 h-3 w-full rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${Math.min(pct * 5, 100)}%`, backgroundColor: COLORS[i % COLORS.length] }} />
                  </div>
                  <p className="text-sm font-medium">{sku}</p>
                  <p className="text-2xl font-bold font-display" style={{ color: COLORS[i % COLORS.length] }}>{s}</p>
                  <p className="text-xs text-muted-foreground">unidades</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;

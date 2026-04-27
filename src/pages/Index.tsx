import { useState, useEffect } from "react";
import { Package, ShoppingCart, Megaphone, BarChart3, TrendingUp, DollarSign, Boxes, Calculator } from "lucide-react";
import DepartmentCard from "@/components/DepartmentCard";
import { fetchEstoque, fetchVendas, calcSaldoEstoque, CONFIG, EstoqueRecord, VendaRecord, getUnidadesReais } from "@/lib/store";
import logo from "@/assets/smellgo-logo.png";

const Index = () => {
  const [estoque, setEstoque] = useState<EstoqueRecord[]>([]);
  const [vendas, setVendas] = useState<VendaRecord[]>([]);

  useEffect(() => {
    fetchEstoque().then(setEstoque).catch(() => {});
    fetchVendas().then(setVendas).catch(() => {});
  }, []);

  const saldoEstoque = calcSaldoEstoque(estoque);
  const receitaTotal = vendas.reduce((a, v) => a + v.precoTotal, 0);
  const unidadesTotais = vendas.reduce((a, v) => a + getUnidadesReais(v.sku, v.quantidade), 0);
  const lucroTotal = receitaTotal - unidadesTotais * CONFIG.custoUnitario;

  const fmt = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div className="min-h-screen bg-background">
      <div className="gradient-dark text-primary-foreground">
        <div className="mx-auto max-w-7xl px-6 py-16 text-center">
          <img src={logo} alt="Smell & Go" className="mx-auto h-16 mb-6 brightness-0 invert" />
          <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">Painel de Controle</h1>
          <p className="mt-3 text-lg opacity-80">Sistema operacional e financeiro — Smell & Go</p>
          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              { icon: Boxes, label: "Estoque Atual", value: `${saldoEstoque} un` },
              { icon: DollarSign, label: "Receita Total", value: fmt(receitaTotal) },
              { icon: TrendingUp, label: "Lucro Total", value: fmt(lucroTotal) },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="rounded-lg border border-white/10 bg-white/5 p-5 backdrop-blur">
                <Icon className="mx-auto h-6 w-6 mb-2 opacity-70" />
                <p className="text-sm opacity-70">{label}</p>
                <p className="text-2xl font-bold font-display">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-6 -mt-8 pb-16">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
          <DepartmentCard title="Estoque" description="Entradas, saídas e saldo por SKU" icon={Package} path="/estoque" metric={`${saldoEstoque} un`} metricLabel="Saldo atual" />
          <DepartmentCard title="Vendas" description="Registros de venda por canal e SKU" icon={ShoppingCart} path="/vendas" metric={fmt(receitaTotal)} metricLabel="Receita total" />
          <DepartmentCard title="Marketing" description="Influencers, UGC e parcerias" icon={Megaphone} path="/marketing" />
          <DepartmentCard title="Financeiro" description="Custos, markup e rentabilidade" icon={Calculator} path="/financeiro" />
          <DepartmentCard title="Dashboard" description="Indicadores estratégicos" icon={BarChart3} path="/dashboard" metric={`${((lucroTotal / (receitaTotal || 1)) * 100).toFixed(1)}%`} metricLabel="Margem média" />
        </div>
      </div>
    </div>
  );
};

export default Index;

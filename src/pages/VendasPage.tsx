import { useState } from "react";
import { Plus, ShoppingCart, DollarSign, TrendingUp } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import KpiCard from "@/components/KpiCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { VendaRecord, getVendas, saveVendas, SKUS, CANAIS, FORMATOS, CONFIG } from "@/lib/store";

const COLORS = ["#4F028B", "#7B3FAF", "#A855F7", "#C084FC"];

const VendasPage = () => {
  const [records, setRecords] = useState<VendaRecord[]>(getVendas());
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ data: "", canal: "", sku: "", formato: "", quantidade: "", precoUnitario: "" });

  const fmt = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const receitaTotal = records.reduce((a, v) => a + v.quantidade * v.precoUnitario, 0);
  const custoTotal = records.reduce((a, v) => a + v.quantidade * CONFIG.custoUnitario, 0);
  const lucroTotal = receitaTotal - custoTotal;
  const margem = receitaTotal ? (lucroTotal / receitaTotal) * 100 : 0;

  // Charts data
  const porCanal = CANAIS.map(c => ({
    name: c.includes("(") ? c.split("(")[0].trim() : c,
    value: records.filter(r => r.canal === c).reduce((a, r) => a + r.quantidade * r.precoUnitario, 0),
  })).filter(d => d.value > 0);

  const porSku = SKUS.map(s => ({
    name: s.split(" ")[0],
    qty: records.filter(r => r.sku === s).reduce((a, r) => a + r.quantidade, 0),
  })).filter(d => d.qty > 0).sort((a, b) => b.qty - a.qty);

  const handleSubmit = () => {
    const qty = parseInt(form.quantidade);
    const preco = parseFloat(form.precoUnitario);
    if (!form.data || !form.canal || !form.sku || !form.formato || isNaN(qty) || isNaN(preco)) {
      toast.error("Preencha todos os campos"); return;
    }
    const updated = [...records, {
      id: crypto.randomUUID(), data: form.data, canal: form.canal, sku: form.sku,
      formato: form.formato, quantidade: qty, precoUnitario: preco,
    }];
    setRecords(updated); saveVendas(updated);
    setForm({ data: "", canal: "", sku: "", formato: "", quantidade: "", precoUnitario: "" });
    setOpen(false); toast.success("Venda registrada!");
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="Vendas" subtitle="Registro e análise de vendas" />
      <div className="mx-auto max-w-7xl px-6 py-8 space-y-8 animate-fade-in">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <KpiCard label="Receita Total" value={fmt(receitaTotal)} icon={DollarSign} variant="primary" />
          <KpiCard label="Lucro Bruto" value={fmt(lucroTotal)} icon={TrendingUp} variant="success" />
          <KpiCard label="Margem Média" value={`${margem.toFixed(1)}%`} icon={TrendingUp} />
          <KpiCard label="Unidades Vendidas" value={`${records.reduce((a, v) => a + v.quantidade, 0)}`} icon={ShoppingCart} />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-lg border border-border bg-card p-6">
            <h3 className="font-display font-semibold mb-4">Receita por Canal</h3>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={porCanal} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {porCanal.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: number) => fmt(v)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="rounded-lg border border-border bg-card p-6">
            <h3 className="font-display font-semibold mb-4">Ranking por SKU</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={porSku} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={80} />
                <Tooltip />
                <Bar dataKey="qty" fill="#4F028B" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border p-4">
            <h3 className="font-display font-semibold">Registro de Vendas</h3>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> Nova Venda</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Registrar Venda</DialogTitle></DialogHeader>
                <div className="space-y-3 pt-2">
                  <Input type="date" value={form.data} onChange={e => setForm({ ...form, data: e.target.value })} />
                  <Select value={form.canal} onValueChange={v => setForm({ ...form, canal: v, precoUnitario: String(CONFIG.precos[v] || "") })}>
                    <SelectTrigger><SelectValue placeholder="Canal" /></SelectTrigger>
                    <SelectContent>{CANAIS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                  <Select value={form.sku} onValueChange={v => setForm({ ...form, sku: v })}>
                    <SelectTrigger><SelectValue placeholder="SKU" /></SelectTrigger>
                    <SelectContent>{SKUS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                  <Select value={form.formato} onValueChange={v => setForm({ ...form, formato: v })}>
                    <SelectTrigger><SelectValue placeholder="Formato" /></SelectTrigger>
                    <SelectContent>{FORMATOS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
                  </Select>
                  <Input type="number" min="1" placeholder="Quantidade" value={form.quantidade} onChange={e => setForm({ ...form, quantidade: e.target.value })} />
                  <Input type="number" step="0.01" placeholder="Preço unitário (R$)" value={form.precoUnitario} onChange={e => setForm({ ...form, precoUnitario: e.target.value })} />
                  <Button onClick={handleSubmit} className="w-full">Registrar Venda</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead><TableHead>Canal</TableHead><TableHead>SKU</TableHead>
                  <TableHead>Formato</TableHead><TableHead className="text-right">Qtd</TableHead>
                  <TableHead className="text-right">Preço Un.</TableHead><TableHead className="text-right">Receita</TableHead>
                  <TableHead className="text-right">Custo</TableHead><TableHead className="text-right">Lucro</TableHead>
                  <TableHead className="text-right">Margem</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map(r => {
                  const receita = r.quantidade * r.precoUnitario;
                  const custo = r.quantidade * CONFIG.custoUnitario;
                  const lucro = receita - custo;
                  const m = receita ? (lucro / receita) * 100 : 0;
                  return (
                    <TableRow key={r.id} className="transition-colors hover:bg-accent/30">
                      <TableCell>{r.data}</TableCell>
                      <TableCell>{r.canal}</TableCell>
                      <TableCell className="font-medium">{r.sku}</TableCell>
                      <TableCell>{r.formato}</TableCell>
                      <TableCell className="text-right">{r.quantidade}</TableCell>
                      <TableCell className="text-right">{fmt(r.precoUnitario)}</TableCell>
                      <TableCell className="text-right font-medium">{fmt(receita)}</TableCell>
                      <TableCell className="text-right">{fmt(custo)}</TableCell>
                      <TableCell className="text-right font-medium text-emerald-600">{fmt(lucro)}</TableCell>
                      <TableCell className="text-right">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${m >= 50 ? "bg-emerald-100 text-emerald-700" : m >= 30 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>
                          {m.toFixed(1)}%
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendasPage;

import { useState } from "react";
import { Plus, AlertTriangle, CheckCircle2, AlertCircle } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import KpiCard from "@/components/KpiCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import {
  EstoqueRecord, getEstoque, saveEstoque, calcSaldoEstoque, calcSaldoPorSku,
  SKUS, CANAIS, CATEGORIAS, TIPOS_ESTOQUE, CONFIG
} from "@/lib/store";
import { Package, TrendingDown, Boxes } from "lucide-react";

const EstoquePage = () => {
  const [records, setRecords] = useState<EstoqueRecord[]>(getEstoque());
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ data: "", tipo: "" as string, categoria: "", canal: "", sku: "", quantidade: "" });

  const saldo = calcSaldoEstoque(records);
  const saldoPorSku = calcSaldoPorSku(records);
  const entradas = records.filter(r => r.tipo === "Entrada").reduce((a, r) => a + r.quantidade, 0);
  const saidas = records.filter(r => r.tipo === "Saída").reduce((a, r) => a + r.quantidade, 0);

  const chartData = SKUS.map(sku => ({ name: sku.split(" ")[0], value: saldoPorSku[sku] || 0 }));
  const COLORS = ["#4F028B", "#7B3FAF", "#A855F7", "#C084FC", "#DDD6FE"];

  const handleSubmit = () => {
    const qty = parseInt(form.quantidade);
    if (!form.data || !form.tipo || !form.categoria || !form.sku || isNaN(qty) || qty <= 0) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    if (form.tipo === "Saída") {
      const skuSaldo = saldoPorSku[form.sku] || 0;
      if (qty > skuSaldo) {
        toast.error(`Estoque insuficiente para ${form.sku}. Saldo: ${skuSaldo}`);
        return;
      }
    }
    const newRecord: EstoqueRecord = {
      id: crypto.randomUUID(),
      data: form.data,
      tipo: form.tipo as "Entrada" | "Saída",
      categoria: form.categoria,
      canal: form.canal,
      sku: form.sku,
      quantidade: qty,
    };
    const updated = [...records, newRecord];
    setRecords(updated);
    saveEstoque(updated);
    setForm({ data: "", tipo: "", categoria: "", canal: "", sku: "", quantidade: "" });
    setOpen(false);
    toast.success("Movimentação registrada!");
  };

  const getStatusBadge = (sku: string) => {
    const s = saldoPorSku[sku] || 0;
    if (s < 20) return <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700"><AlertTriangle className="h-3 w-3" /> BAIXO</span>;
    if (s < 50) return <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700"><AlertCircle className="h-3 w-3" /> ATENÇÃO</span>;
    return <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700"><CheckCircle2 className="h-3 w-3" /> OK</span>;
  };

  let runningBalance = 0;

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="Estoque" subtitle="Controle de entradas e saídas" />
      <div className="mx-auto max-w-7xl px-6 py-8 space-y-8 animate-fade-in">
        {/* KPIs */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <KpiCard label="Saldo Total" value={`${saldo} un`} icon={Boxes} variant="primary" />
          <KpiCard label="Total Entradas" value={`${entradas} un`} icon={Package} variant="success" />
          <KpiCard label="Total Saídas" value={`${saidas} un`} icon={TrendingDown} variant="warning" />
        </div>

        {/* Chart + SKU Status */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-lg border border-border bg-card p-6">
            <h3 className="font-display font-semibold mb-4">Estoque por SKU</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData}>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="rounded-lg border border-border bg-card p-6">
            <h3 className="font-display font-semibold mb-4">Status por Fragrância</h3>
            <div className="space-y-3">
              {SKUS.map(sku => (
                <div key={sku} className="flex items-center justify-between rounded-lg border border-border p-3 transition-colors hover:bg-accent/50">
                  <span className="text-sm font-medium">{sku}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-foreground">{saldoPorSku[sku] || 0} un</span>
                    {getStatusBadge(sku)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Table + Add */}
        <div className="rounded-lg border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border p-4">
            <h3 className="font-display font-semibold">Movimentações</h3>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Nova Movimentação</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Nova Movimentação de Estoque</DialogTitle></DialogHeader>
                <div className="space-y-3 pt-2">
                  <Input type="date" value={form.data} onChange={e => setForm({ ...form, data: e.target.value })} />
                  <Select value={form.tipo} onValueChange={v => setForm({ ...form, tipo: v })}>
                    <SelectTrigger><SelectValue placeholder="Tipo" /></SelectTrigger>
                    <SelectContent>{TIPOS_ESTOQUE.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                  <Select value={form.categoria} onValueChange={v => setForm({ ...form, categoria: v })}>
                    <SelectTrigger><SelectValue placeholder="Categoria" /></SelectTrigger>
                    <SelectContent>{CATEGORIAS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                  <Select value={form.canal} onValueChange={v => setForm({ ...form, canal: v })}>
                    <SelectTrigger><SelectValue placeholder="Canal (opcional)" /></SelectTrigger>
                    <SelectContent>{CANAIS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                  <Select value={form.sku} onValueChange={v => setForm({ ...form, sku: v })}>
                    <SelectTrigger><SelectValue placeholder="SKU" /></SelectTrigger>
                    <SelectContent>{SKUS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                  <Input type="number" min="1" placeholder="Quantidade" value={form.quantidade} onChange={e => setForm({ ...form, quantidade: e.target.value })} />
                  <Button onClick={handleSubmit} className="w-full">Registrar</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Canal</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead className="text-right">Qtd</TableHead>
                  <TableHead className="text-right">Custo Un.</TableHead>
                  <TableHead className="text-right">Valor Total</TableHead>
                  <TableHead className="text-right">Saldo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((r) => {
                  runningBalance += r.tipo === "Entrada" ? r.quantidade : -r.quantidade;
                  const valorTotal = r.quantidade * CONFIG.custoUnitario;
                  return (
                    <TableRow key={r.id} className="transition-colors hover:bg-accent/30">
                      <TableCell>{r.data}</TableCell>
                      <TableCell>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${r.tipo === "Entrada" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                          {r.tipo}
                        </span>
                      </TableCell>
                      <TableCell>{r.categoria}</TableCell>
                      <TableCell>{r.canal || "—"}</TableCell>
                      <TableCell className="font-medium">{r.sku}</TableCell>
                      <TableCell className="text-right">{r.quantidade}</TableCell>
                      <TableCell className="text-right">R$ {CONFIG.custoUnitario.toFixed(2)}</TableCell>
                      <TableCell className="text-right font-medium">{r.tipo === "Entrada" ? "" : "-"}R$ {valorTotal.toFixed(2)}</TableCell>
                      <TableCell className="text-right font-bold">{runningBalance}</TableCell>
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

export default EstoquePage;

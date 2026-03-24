import { useState, useEffect, useMemo } from "react";
import { Plus, DollarSign, TrendingUp, Trash2, Pencil, Filter, Calculator } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import KpiCard from "@/components/KpiCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line } from "recharts";
import { FinanceiroRecord, fetchFinanceiro, insertFinanceiro, updateFinanceiro, deleteFinanceiro, SKUS } from "@/lib/store";

const TIPOS_FINANCEIRO = ["Compra", "Frete", "Despesa Operacional", "Investimento", "Outro"] as const;

const FinanceiroPage = () => {
  const [records, setRecords] = useState<FinanceiroRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    data: "", tipo: "", descricao: "", sku: "", quantidade: "",
    custoUnitario: "", frete: "0", precoVenda: "", observacoes: "",
  });

  const [filterTipo, setFilterTipo] = useState<string>("all");
  const [filterSku, setFilterSku] = useState<string>("all");

  useEffect(() => {
    fetchFinanceiro().then(d => { setRecords(d); setLoading(false); }).catch(() => { toast.error("Erro ao carregar financeiro"); setLoading(false); });
  }, []);

  const fmt = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      if (filterTipo !== "all" && r.tipo !== filterTipo) return false;
      if (filterSku !== "all" && r.sku !== filterSku) return false;
      return true;
    });
  }, [records, filterTipo, filterSku]);

  const custoTotalGeral = records.reduce((a, r) => a + r.custoTotal, 0);
  const receitaTotal = records.reduce((a, r) => a + r.receita, 0);
  const lucroBruto = records.reduce((a, r) => a + r.lucroBruto, 0);
  const markupMedio = receitaTotal && custoTotalGeral ? ((receitaTotal - custoTotalGeral) / custoTotalGeral * 100) : 0;
  const ebitda = lucroBruto; // simplified

  // Chart: custo vs receita por mês
  const monthlyData = useMemo(() => {
    const map: Record<string, { custo: number; receita: number; lucro: number }> = {};
    records.forEach(r => {
      const month = r.data.slice(0, 7);
      if (!map[month]) map[month] = { custo: 0, receita: 0, lucro: 0 };
      map[month].custo += r.custoTotal;
      map[month].receita += r.receita;
      map[month].lucro += r.lucroBruto;
    });
    return Object.entries(map).sort().map(([mes, v]) => ({ mes: mes.slice(5), ...v }));
  }, [records]);

  const handleSubmit = async () => {
    const qty = parseInt(form.quantidade) || 0;
    const custoUn = parseFloat(form.custoUnitario) || 0;
    const frete = parseFloat(form.frete) || 0;
    const precoVenda = parseFloat(form.precoVenda) || 0;

    if (!form.data || !form.tipo) {
      toast.error("Preencha os campos obrigatórios"); return;
    }

    const custoTotal = qty * custoUn + frete;
    const receita = qty * precoVenda;
    const lucroBrutoCalc = receita - custoTotal;
    const markup = custoTotal ? ((receita - custoTotal) / custoTotal * 100) : 0;

    const recordData: Omit<FinanceiroRecord, "id"> = {
      data: form.data, tipo: form.tipo, descricao: form.descricao, sku: form.sku,
      quantidade: qty, custoUnitario: custoUn, frete, custoTotal,
      precoVenda, markup, receita, lucroBruto: lucroBrutoCalc, observacoes: form.observacoes,
    };

    try {
      if (editingId) {
        await updateFinanceiro(editingId, recordData);
        setRecords(prev => prev.map(r => r.id === editingId ? { ...r, ...recordData } : r));
        toast.success("Registro atualizado!");
      } else {
        const newRecord = await insertFinanceiro(recordData);
        setRecords(prev => [...prev, newRecord]);
        toast.success("Registro criado!");
      }
      setForm({ data: "", tipo: "", descricao: "", sku: "", quantidade: "", custoUnitario: "", frete: "0", precoVenda: "", observacoes: "" });
      setEditingId(null); setOpen(false);
    } catch { toast.error("Erro ao salvar"); }
  };

  const handleEdit = (r: FinanceiroRecord) => {
    setEditingId(r.id);
    setForm({
      data: r.data, tipo: r.tipo, descricao: r.descricao, sku: r.sku,
      quantidade: String(r.quantidade), custoUnitario: String(r.custoUnitario),
      frete: String(r.frete), precoVenda: String(r.precoVenda), observacoes: r.observacoes,
    });
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    try { await deleteFinanceiro(id); setRecords(prev => prev.filter(r => r.id !== id)); toast.success("Registro excluído!"); }
    catch { toast.error("Erro ao excluir"); }
  };

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><p className="text-muted-foreground">Carregando...</p></div>;

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="Financeiro" subtitle="Custos, markup e análise de rentabilidade" />
      <div className="mx-auto max-w-7xl px-6 py-8 space-y-8 animate-fade-in">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <KpiCard label="Custo Total" value={fmt(custoTotalGeral)} icon={DollarSign} variant="warning" />
          <KpiCard label="Receita Total" value={fmt(receitaTotal)} icon={DollarSign} variant="primary" />
          <KpiCard label="Lucro Bruto" value={fmt(lucroBruto)} icon={TrendingUp} variant="success" />
          <KpiCard label="Markup Médio" value={`${markupMedio.toFixed(1)}%`} icon={Calculator} />
        </div>

        {/* EBITDA summary */}
        <div className="gradient-dark rounded-xl p-6 text-white">
          <h3 className="font-display text-lg font-bold mb-4">Resumo Financeiro</h3>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { label: "Custo Total", value: fmt(custoTotalGeral) },
              { label: "Receita", value: fmt(receitaTotal) },
              { label: "EBITDA", value: fmt(ebitda) },
              { label: "Margem EBITDA", value: receitaTotal ? `${(ebitda / receitaTotal * 100).toFixed(1)}%` : "0%" },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-lg border border-white/10 bg-white/5 p-3 backdrop-blur">
                <p className="text-xs opacity-60">{label}</p>
                <p className="text-lg font-bold font-display">{value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-lg border border-border bg-card p-6">
            <h3 className="font-display font-semibold mb-4">Custo vs Receita por Mês</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v: number) => fmt(v)} />
                <Bar dataKey="custo" name="Custo" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="receita" name="Receita" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="rounded-lg border border-border bg-card p-6">
            <h3 className="font-display font-semibold mb-4">Evolução do Lucro</h3>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v: number) => fmt(v)} />
                <Line type="monotone" dataKey="lucro" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: "hsl(var(--primary))", r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border p-4">
            <h3 className="font-display font-semibold">Registros Financeiros</h3>
            <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setEditingId(null); setForm({ data: "", tipo: "", descricao: "", sku: "", quantidade: "", custoUnitario: "", frete: "0", precoVenda: "", observacoes: "" }); } }}>
              <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> Novo Registro</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>{editingId ? "Editar Registro" : "Novo Registro Financeiro"}</DialogTitle></DialogHeader>
                <div className="space-y-3 pt-2 max-h-[60vh] overflow-y-auto">
                  <Input type="date" value={form.data} onChange={e => setForm({ ...form, data: e.target.value })} />
                  <Select value={form.tipo} onValueChange={v => setForm({ ...form, tipo: v })}>
                    <SelectTrigger><SelectValue placeholder="Tipo" /></SelectTrigger>
                    <SelectContent>{TIPOS_FINANCEIRO.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                  <Input placeholder="Descrição" value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} />
                  <Select value={form.sku} onValueChange={v => setForm({ ...form, sku: v })}>
                    <SelectTrigger><SelectValue placeholder="SKU (opcional)" /></SelectTrigger>
                    <SelectContent>{SKUS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                  <Input type="number" min="0" placeholder="Quantidade" value={form.quantidade} onChange={e => setForm({ ...form, quantidade: e.target.value })} />
                  <Input type="number" step="0.01" placeholder="Custo unitário (R$)" value={form.custoUnitario} onChange={e => setForm({ ...form, custoUnitario: e.target.value })} />
                  <Input type="number" step="0.01" placeholder="Frete (R$)" value={form.frete} onChange={e => setForm({ ...form, frete: e.target.value })} />
                  <Input type="number" step="0.01" placeholder="Preço de venda (R$)" value={form.precoVenda} onChange={e => setForm({ ...form, precoVenda: e.target.value })} />
                  {form.quantidade && form.custoUnitario && (
                    <div className="rounded-lg bg-muted p-3 text-xs space-y-1">
                      <p>Custo total: {fmt((parseInt(form.quantidade) || 0) * (parseFloat(form.custoUnitario) || 0) + (parseFloat(form.frete) || 0))}</p>
                      {form.precoVenda && (
                        <>
                          <p>Receita: {fmt((parseInt(form.quantidade) || 0) * (parseFloat(form.precoVenda) || 0))}</p>
                          <p>Markup: {(((parseFloat(form.precoVenda) || 0) - (parseFloat(form.custoUnitario) || 0)) / (parseFloat(form.custoUnitario) || 1) * 100).toFixed(1)}%</p>
                        </>
                      )}
                    </div>
                  )}
                  <Input placeholder="Observações" value={form.observacoes} onChange={e => setForm({ ...form, observacoes: e.target.value })} />
                  <Button onClick={handleSubmit} className="w-full">{editingId ? "Salvar Alterações" : "Registrar"}</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="flex flex-wrap gap-3 border-b border-border p-4 bg-muted/30">
            <div className="flex items-center gap-1 text-sm text-muted-foreground"><Filter className="h-4 w-4" /> Filtros:</div>
            <Select value={filterTipo} onValueChange={setFilterTipo}>
              <SelectTrigger className="w-[180px] h-8 text-xs"><SelectValue placeholder="Tipo" /></SelectTrigger>
              <SelectContent><SelectItem value="all">Todos Tipos</SelectItem>{TIPOS_FINANCEIRO.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={filterSku} onValueChange={setFilterSku}>
              <SelectTrigger className="w-[160px] h-8 text-xs"><SelectValue placeholder="SKU" /></SelectTrigger>
              <SelectContent><SelectItem value="all">Todos SKUs</SelectItem>{SKUS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead><TableHead>Tipo</TableHead><TableHead>Descrição</TableHead>
                  <TableHead>SKU</TableHead><TableHead className="text-right">Qtd</TableHead>
                  <TableHead className="text-right">Custo Un.</TableHead><TableHead className="text-right">Frete</TableHead>
                  <TableHead className="text-right">Custo Total</TableHead><TableHead className="text-right">Preço Venda</TableHead>
                  <TableHead className="text-right">Markup</TableHead><TableHead className="text-right">Lucro</TableHead>
                  <TableHead className="text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecords.map(r => (
                  <TableRow key={r.id} className="transition-colors hover:bg-accent/30">
                    <TableCell>{r.data}</TableCell>
                    <TableCell><span className="rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">{r.tipo}</span></TableCell>
                    <TableCell className="font-medium max-w-[150px] truncate">{r.descricao || "—"}</TableCell>
                    <TableCell>{r.sku || "—"}</TableCell>
                    <TableCell className="text-right">{r.quantidade}</TableCell>
                    <TableCell className="text-right">{fmt(r.custoUnitario)}</TableCell>
                    <TableCell className="text-right">{fmt(r.frete)}</TableCell>
                    <TableCell className="text-right font-medium">{fmt(r.custoTotal)}</TableCell>
                    <TableCell className="text-right">{fmt(r.precoVenda)}</TableCell>
                    <TableCell className="text-right">
                      <span className={`text-xs font-medium ${r.markup >= 0 ? "text-emerald-600" : "text-destructive"}`}>{r.markup.toFixed(1)}%</span>
                    </TableCell>
                    <TableCell className="text-right font-medium text-emerald-600">{fmt(r.lucroBruto)}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(r)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDelete(r.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinanceiroPage;

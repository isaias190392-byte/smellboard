import { useState, useEffect, useMemo, useCallback } from "react";
import { Plus, ShoppingCart, DollarSign, TrendingUp, Trash2, Pencil, Filter, Download } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import KpiCard from "@/components/KpiCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { VendaRecord, EstoqueRecord, fetchVendas, insertVenda, updateVenda, deleteVenda, fetchEstoque, insertEstoque, deleteEstoqueByToken, SKUS, CANAIS, CONFIG, SKU_COLORS, decomporSku, getUnidadesReais, calcSaldoPorSku, validarEstoque, getComposicaoTexto } from "@/lib/store";
import * as XLSX from "xlsx";

const CHANNEL_COLORS = ["#4F028B", "#DC2626", "#EAB308", "#2563EB"];
const emptyForm = { data: "", canal: "", sku: "", quantidade: "", precoTotal: "" };
const errorMessage = (e: unknown) => e instanceof Error ? e.message : String(e || "Erro desconhecido");

const VendasPage = () => {
  const [records, setRecords] = useState<VendaRecord[]>([]);
  const [estoque, setEstoque] = useState<EstoqueRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [filterSku, setFilterSku] = useState("all");
  const [filterCanal, setFilterCanal] = useState("all");
  const [chartFilterCanal, setChartFilterCanal] = useState<string | null>(null);
  const [chartFilterSku, setChartFilterSku] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    const [v, e] = await Promise.all([fetchVendas(), fetchEstoque()]);
    setRecords(v); setEstoque(e);
  }, []);

  useEffect(() => {
    loadData().catch(e => toast.error(errorMessage(e))).finally(() => setLoading(false));
  }, [loadData]);

  const fmt = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const saldoPorSku = useMemo(() => calcSaldoPorSku(estoque), [estoque]);

  const chartFilteredRecords = useMemo(() => records.filter(r => (!chartFilterCanal || r.canal === chartFilterCanal) && (!chartFilterSku || r.sku === chartFilterSku)), [records, chartFilterCanal, chartFilterSku]);
  const receitaTotal = chartFilteredRecords.reduce((a, v) => a + v.precoTotal, 0);
  const unidadesTotais = chartFilteredRecords.reduce((a, v) => a + getUnidadesReais(v.sku, v.quantidade), 0);
  const custoTotal = unidadesTotais * CONFIG.custoUnitario;
  const lucroTotal = receitaTotal - custoTotal;
  const margem = receitaTotal ? (lucroTotal / receitaTotal) * 100 : 0;

  const porCanal = useMemo(() => CANAIS.map(c => ({ name: c.includes("(") ? c.split("(")[0].trim() : c, fullName: c, value: (chartFilterSku ? records.filter(r => r.sku === chartFilterSku) : records).filter(r => r.canal === c).reduce((a, r) => a + r.precoTotal, 0) })).filter(d => d.value > 0), [records, chartFilterSku]);
  const porSku = useMemo(() => SKUS.map(s => ({ name: s, qty: (chartFilterCanal ? records.filter(r => r.canal === chartFilterCanal) : records).filter(r => r.sku === s).reduce((a, r) => a + getUnidadesReais(r.sku, r.quantidade), 0) })).filter(d => d.qty > 0).sort((a, b) => b.qty - a.qty), [records, chartFilterCanal]);
  const filteredRecords = useMemo(() => chartFilteredRecords.filter(r => (filterSku === "all" || r.sku === filterSku) && (filterCanal === "all" || r.canal === filterCanal)), [chartFilteredRecords, filterSku, filterCanal]);

  const handleSubmit = async () => {
    const qty = parseInt(form.quantidade);
    const preco = parseFloat(form.precoTotal);
    if (!form.data || !form.canal || !form.sku || isNaN(qty) || qty <= 0 || isNaN(preco) || preco < 0) return toast.error("Preencha todos os campos corretamente");
    const old = editingId ? records.find(r => r.id === editingId) : null;
    const saldoAjustado = { ...saldoPorSku };
    if (old) for (const [sku, qtd] of Object.entries(decomporSku(old.sku, old.quantidade))) saldoAjustado[sku] = (saldoAjustado[sku] || 0) + qtd;
    const erro = validarEstoque(form.sku, qty, saldoAjustado);
    if (erro) return toast.error(erro);
    try {
      const token = editingId || crypto.randomUUID();
      if (editingId) {
        await updateVenda(editingId, { data: form.data, canal: form.canal, sku: form.sku, quantidade: qty, precoTotal: preco });
        await deleteEstoqueByToken(`VENDA:${editingId}`);
      } else {
        const newRecord = await insertVenda({ data: form.data, canal: form.canal, sku: form.sku, quantidade: qty, precoTotal: preco });
        setRecords(prev => [...prev, newRecord]);
        await Promise.all(Object.entries(decomporSku(form.sku, qty)).map(([sku, quantidade]) => insertEstoque({ data: form.data, tipo: "Saída", categoria: "Venda", canal: form.canal, sku, quantidade, observacoes: `VENDA:${newRecord.id} - ${form.sku}` })));
        toast.success("Venda registrada!");
        setForm(emptyForm); setOpen(false); return loadData();
      }
      await Promise.all(Object.entries(decomporSku(form.sku, qty)).map(([sku, quantidade]) => insertEstoque({ data: form.data, tipo: "Saída", categoria: "Venda", canal: form.canal, sku, quantidade, observacoes: `VENDA:${token} - ${form.sku}` })));
      toast.success("Venda atualizada!");
      setForm(emptyForm); setEditingId(null); setOpen(false); await loadData();
    } catch (e) { toast.error(errorMessage(e)); }
  };

  const handleEdit = (r: VendaRecord) => { setEditingId(r.id); setForm({ data: r.data, canal: r.canal, sku: r.sku, quantidade: String(r.quantidade), precoTotal: String(r.precoTotal) }); setOpen(true); };
  const handleDelete = async (id: string) => { if (!confirm("Tem certeza que deseja excluir esta venda?")) return; try { await deleteVenda(id); await deleteEstoqueByToken(`VENDA:${id}`); toast.success("Venda excluída!"); await loadData(); } catch (e) { toast.error(errorMessage(e)); } };
  const handlePieClick = useCallback((_: unknown, index: number) => setChartFilterCanal(prev => prev === porCanal[index]?.fullName ? null : porCanal[index]?.fullName || null), [porCanal]);
  const handleBarClick = useCallback((data: { name?: string }) => { if (data?.name) setChartFilterSku(prev => prev === data.name ? null : data.name!); }, []);
  const exportExcel = () => { const rows = filteredRecords.map(r => { const unidades = getUnidadesReais(r.sku, r.quantidade); const custo = unidades * CONFIG.custoUnitario; return { Data: r.data, Canal: r.canal, SKU: r.sku, Quantidade: r.quantidade, "Unidades Reais": unidades, "Preço Total": r.precoTotal, Custo: custo, Lucro: r.precoTotal - custo, Margem: r.precoTotal ? `${(((r.precoTotal - custo) / r.precoTotal) * 100).toFixed(1)}%` : "0%" }; }); const ws = XLSX.utils.json_to_sheet(rows); const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Vendas"); XLSX.writeFile(wb, "vendas_smellboard.xlsx"); toast.success("Planilha exportada!"); };

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><p className="text-muted-foreground">Carregando...</p></div>;

  return <div className="min-h-screen bg-background"><PageHeader title="Vendas" subtitle="Registro confiável por canal e SKU" /><div className="mx-auto max-w-7xl px-6 py-8 space-y-8 animate-fade-in">
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-4"><KpiCard label="Receita Total" value={fmt(receitaTotal)} icon={DollarSign} variant="primary" /><KpiCard label="Custo Total" value={fmt(custoTotal)} icon={ShoppingCart} variant="warning" /><KpiCard label="Lucro Bruto" value={fmt(lucroTotal)} icon={TrendingUp} variant="success" /><KpiCard label="Margem" value={`${margem.toFixed(1)}%`} icon={TrendingUp} /></div>
    {(chartFilterCanal || chartFilterSku) && <div className="flex flex-wrap items-center gap-2 text-sm"><span className="text-muted-foreground">Filtro ativo:</span>{chartFilterCanal && <Button variant="secondary" size="sm" className="h-6 text-xs" onClick={() => setChartFilterCanal(null)}>Canal: {chartFilterCanal} ✕</Button>}{chartFilterSku && <Button variant="secondary" size="sm" className="h-6 text-xs" onClick={() => setChartFilterSku(null)}>SKU: {chartFilterSku} ✕</Button>}<Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => { setChartFilterCanal(null); setChartFilterSku(null); }}>Limpar</Button></div>}
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2"><div className="rounded-lg border border-border bg-card p-6"><h3 className="font-display font-semibold mb-4">Receita por Canal</h3><ResponsiveContainer width="100%" height={260}><PieChart><Pie data={porCanal} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} onClick={handlePieClick} className="cursor-pointer">{porCanal.map((entry, i) => <Cell key={entry.fullName} fill={CHANNEL_COLORS[i % CHANNEL_COLORS.length]} opacity={chartFilterCanal && chartFilterCanal !== entry.fullName ? 0.3 : 1} />)}</Pie><Tooltip formatter={(v: number) => fmt(v)} /></PieChart></ResponsiveContainer></div><div className="rounded-lg border border-border bg-card p-6"><h3 className="font-display font-semibold mb-4">SKU Mais Vendido</h3><ResponsiveContainer width="100%" height={260}><BarChart data={porSku} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" /><XAxis type="number" tick={{ fontSize: 12 }} /><YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={120} /><Tooltip /><Bar dataKey="qty" radius={[0, 6, 6, 0]} onClick={handleBarClick} className="cursor-pointer">{porSku.map(entry => <Cell key={entry.name} fill={SKU_COLORS[entry.name] || "#4F028B"} opacity={chartFilterSku && chartFilterSku !== entry.name ? 0.3 : 1} />)}</Bar></BarChart></ResponsiveContainer></div></div>
    <div className="rounded-lg border border-border bg-card"><div className="flex items-center justify-between border-b border-border p-4"><h3 className="font-display font-semibold">Registro de Vendas</h3><div className="flex gap-2"><Button variant="outline" size="sm" onClick={exportExcel}><Download className="h-4 w-4 mr-1" /> Exportar</Button><Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setEditingId(null); setForm(emptyForm); } }}><DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> Nova Venda</Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>{editingId ? "Editar Venda" : "Registrar Venda"}</DialogTitle></DialogHeader><div className="space-y-3 pt-2"><Input type="date" value={form.data} onChange={e => setForm({ ...form, data: e.target.value })} /><Select value={form.canal} onValueChange={v => setForm({ ...form, canal: v })}><SelectTrigger><SelectValue placeholder="Canal" /></SelectTrigger><SelectContent>{CANAIS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select><Select value={form.sku} onValueChange={v => setForm({ ...form, sku: v })}><SelectTrigger><SelectValue placeholder="SKU" /></SelectTrigger><SelectContent>{SKUS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>{getComposicaoTexto(form.sku) && <p className="rounded-md bg-muted p-2 text-xs text-muted-foreground">{getComposicaoTexto(form.sku)}</p>}<Input type="number" min="1" placeholder="Quantidade" value={form.quantidade} onChange={e => setForm({ ...form, quantidade: e.target.value })} /><Input type="number" step="0.01" placeholder="Preço total (R$)" value={form.precoTotal} onChange={e => setForm({ ...form, precoTotal: e.target.value })} /><Button onClick={handleSubmit} className="w-full">{editingId ? "Salvar Alterações" : "Registrar Venda"}</Button></div></DialogContent></Dialog></div></div>
    <div className="flex flex-wrap gap-3 border-b border-border p-4 bg-muted/30"><div className="flex items-center gap-1 text-sm text-muted-foreground"><Filter className="h-4 w-4" /> Filtros:</div><Select value={filterCanal} onValueChange={setFilterCanal}><SelectTrigger className="w-[160px] h-8 text-xs"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Todos Canais</SelectItem>{CANAIS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select><Select value={filterSku} onValueChange={setFilterSku}><SelectTrigger className="w-[170px] h-8 text-xs"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Todos SKUs</SelectItem>{SKUS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
    <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Data</TableHead><TableHead>Canal</TableHead><TableHead>SKU</TableHead><TableHead className="text-right">Qtd</TableHead><TableHead className="text-right">Preço Total</TableHead><TableHead className="text-right">Custo</TableHead><TableHead className="text-right">Lucro</TableHead><TableHead className="text-right">Margem</TableHead><TableHead className="text-center">Ações</TableHead></TableRow></TableHeader><TableBody>{filteredRecords.map(r => { const unidades = getUnidadesReais(r.sku, r.quantidade); const custo = unidades * CONFIG.custoUnitario; const lucro = r.precoTotal - custo; const m = r.precoTotal ? lucro / r.precoTotal * 100 : 0; return <TableRow key={r.id} className="transition-colors hover:bg-accent/30"><TableCell>{r.data}</TableCell><TableCell>{r.canal}</TableCell><TableCell className="font-medium">{r.sku}</TableCell><TableCell className="text-right">{r.quantidade}</TableCell><TableCell className="text-right">{fmt(r.precoTotal)}</TableCell><TableCell className="text-right">{fmt(custo)}</TableCell><TableCell className="text-right font-medium">{fmt(lucro)}</TableCell><TableCell className="text-right">{m.toFixed(1)}%</TableCell><TableCell className="text-center"><div className="flex items-center justify-center gap-1"><Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(r)}><Pencil className="h-3.5 w-3.5" /></Button><Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDelete(r.id)}><Trash2 className="h-3.5 w-3.5" /></Button></div></TableCell></TableRow>; })}</TableBody></Table></div></div>
  </div></div>;
};

export default VendasPage;

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
import { VendaRecord, fetchVendas, insertVenda, updateVenda, deleteVenda, insertEstoque, SKUS, CANAIS, FORMATOS, CONFIG, SKU_COLORS, FORMATO_MULTIPLICADOR } from "@/lib/store";
import * as XLSX from "xlsx";

const CHANNEL_COLORS = ["#4F028B", "#DC2626", "#EAB308", "#2563EB"];

const VendasPage = () => {
  const [records, setRecords] = useState<VendaRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ data: "", canal: "", sku: "", formato: "", quantidade: "", precoUnitario: "" });

  const [filterSku, setFilterSku] = useState<string>("all");
  const [filterCanal, setFilterCanal] = useState<string>("all");
  const [filterFormato, setFilterFormato] = useState<string>("all");

  const [chartFilterCanal, setChartFilterCanal] = useState<string | null>(null);
  const [chartFilterSku, setChartFilterSku] = useState<string | null>(null);

  useEffect(() => {
    fetchVendas().then(d => { setRecords(d); setLoading(false); }).catch(() => { toast.error("Erro ao carregar vendas"); setLoading(false); });
  }, []);

  const fmt = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  // Calcula unidades reais baseado no formato
  const getUnidadesReais = (r: VendaRecord) => {
    const mult = FORMATO_MULTIPLICADOR[r.formato] || 1;
    return r.quantidade * mult;
  };

  // Preço unitário por unidade individual
  const getPrecoUnitarioReal = (r: VendaRecord) => {
    const mult = FORMATO_MULTIPLICADOR[r.formato] || 1;
    return r.precoUnitario / mult;
  };

  const chartFilteredRecords = useMemo(() => {
    return records.filter(r => {
      if (chartFilterCanal && r.canal !== chartFilterCanal) return false;
      if (chartFilterSku && r.sku !== chartFilterSku) return false;
      return true;
    });
  }, [records, chartFilterCanal, chartFilterSku]);

  const receitaTotal = chartFilteredRecords.reduce((a, v) => a + v.quantidade * v.precoUnitario, 0);
  const unidadesTotais = chartFilteredRecords.reduce((a, v) => a + getUnidadesReais(v), 0);
  const custoTotal = unidadesTotais * CONFIG.custoUnitario;
  const lucroTotal = receitaTotal - custoTotal;
  const margem = receitaTotal ? (lucroTotal / receitaTotal) * 100 : 0;

  const porCanal = useMemo(() => {
    const filtered = chartFilterSku ? records.filter(r => r.sku === chartFilterSku) : records;
    return CANAIS.map(c => ({
      name: c.includes("(") ? c.split("(")[0].trim() : c,
      fullName: c,
      value: filtered.filter(r => r.canal === c).reduce((a, r) => a + r.quantidade * r.precoUnitario, 0),
    })).filter(d => d.value > 0);
  }, [records, chartFilterSku]);

  const porSku = useMemo(() => {
    const filtered = chartFilterCanal ? records.filter(r => r.canal === chartFilterCanal) : records;
    return SKUS.map(s => ({
      name: s,
      qty: filtered.filter(r => r.sku === s).reduce((a, r) => a + getUnidadesReais(r), 0),
    })).filter(d => d.qty > 0).sort((a, b) => b.qty - a.qty);
  }, [records, chartFilterCanal]);

  const filteredRecords = useMemo(() => {
    return chartFilteredRecords.filter(r => {
      if (filterSku !== "all" && r.sku !== filterSku) return false;
      if (filterCanal !== "all" && r.canal !== filterCanal) return false;
      if (filterFormato !== "all" && r.formato !== filterFormato) return false;
      return true;
    });
  }, [chartFilteredRecords, filterSku, filterCanal, filterFormato]);

  const handleSubmit = async () => {
    const qty = parseInt(form.quantidade);
    const preco = parseFloat(form.precoUnitario);
    if (!form.data || !form.canal || !form.sku || !form.formato || isNaN(qty) || isNaN(preco)) {
      toast.error("Preencha todos os campos"); return;
    }
    try {
      if (editingId) {
        await updateVenda(editingId, { data: form.data, canal: form.canal, sku: form.sku, formato: form.formato, quantidade: qty, precoUnitario: preco });
        setRecords(prev => prev.map(r => r.id === editingId ? { ...r, data: form.data, canal: form.canal, sku: form.sku, formato: form.formato, quantidade: qty, precoUnitario: preco } : r));
        toast.success("Venda atualizada!");
      } else {
        const newRecord = await insertVenda({ data: form.data, canal: form.canal, sku: form.sku, formato: form.formato, quantidade: qty, precoUnitario: preco });
        setRecords(prev => [...prev, newRecord]);
        // Registrar saída no estoque automaticamente
        const mult = FORMATO_MULTIPLICADOR[form.formato] || 1;
        const unidadesReais = qty * mult;
        try {
          await insertEstoque({
            data: form.data, tipo: "Saída", categoria: "Venda",
            canal: form.canal, sku: form.sku, quantidade: unidadesReais, observacoes: `Venda automática - ${form.formato} x${qty}`,
          });
        } catch { /* silently fail stock update */ }
        toast.success("Venda registrada!");
      }
      setForm({ data: "", canal: "", sku: "", formato: "", quantidade: "", precoUnitario: "" });
      setEditingId(null); setOpen(false);
    } catch { toast.error("Erro ao salvar"); }
  };

  const handleEdit = (r: VendaRecord) => {
    setEditingId(r.id);
    setForm({ data: r.data, canal: r.canal, sku: r.sku, formato: r.formato, quantidade: String(r.quantidade), precoUnitario: String(r.precoUnitario) });
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    try { await deleteVenda(id); setRecords(prev => prev.filter(r => r.id !== id)); toast.success("Venda excluída!"); }
    catch { toast.error("Erro ao excluir"); }
  };

  const handlePieClick = useCallback((_: unknown, index: number) => {
    const clicked = porCanal[index]?.fullName;
    setChartFilterCanal(prev => prev === clicked ? null : clicked || null);
  }, [porCanal]);

  const handleBarClick = useCallback((data: { name?: string }) => {
    if (data?.name) setChartFilterSku(prev => prev === data.name ? null : data.name!);
  }, []);

  const exportExcel = () => {
    const rows = filteredRecords.map(r => {
      const unidades = getUnidadesReais(r);
      const receita = r.quantidade * r.precoUnitario;
      const custo = unidades * CONFIG.custoUnitario;
      return {
        Data: r.data, Canal: r.canal, SKU: r.sku, Formato: r.formato,
        Quantidade: r.quantidade, "Unidades Reais": unidades,
        "Preço Total": r.precoUnitario, "Preço/Unidade": getPrecoUnitarioReal(r).toFixed(2),
        Receita: receita, Custo: custo, Lucro: receita - custo,
      };
    });
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Vendas");
    XLSX.writeFile(wb, "vendas_smellgo.xlsx");
    toast.success("Planilha exportada!");
  };

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><p className="text-muted-foreground">Carregando...</p></div>;

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="Vendas" subtitle="Registro e análise de vendas" />
      <div className="mx-auto max-w-7xl px-6 py-8 space-y-8 animate-fade-in">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <KpiCard label="Receita Total" value={fmt(receitaTotal)} icon={DollarSign} variant="primary" />
          <KpiCard label="Lucro Bruto" value={fmt(lucroTotal)} icon={TrendingUp} variant="success" />
          <KpiCard label="Margem Média" value={`${margem.toFixed(1)}%`} icon={TrendingUp} />
          <KpiCard label="Unidades Vendidas" value={`${unidadesTotais}`} icon={ShoppingCart} />
        </div>

        {(chartFilterCanal || chartFilterSku) && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Filtro ativo:</span>
            {chartFilterCanal && (
              <Button variant="secondary" size="sm" className="h-6 text-xs" onClick={() => setChartFilterCanal(null)}>
                Canal: {chartFilterCanal.includes("(") ? chartFilterCanal.split("(")[0].trim() : chartFilterCanal} ✕
              </Button>
            )}
            {chartFilterSku && (
              <Button variant="secondary" size="sm" className="h-6 text-xs" onClick={() => setChartFilterSku(null)}>
                SKU: {chartFilterSku} ✕
              </Button>
            )}
            <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => { setChartFilterCanal(null); setChartFilterSku(null); }}>Limpar todos</Button>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-lg border border-border bg-card p-6">
            <h3 className="font-display font-semibold mb-1">Receita por Canal</h3>
            <p className="text-xs text-muted-foreground mb-4">Clique para filtrar{chartFilterSku ? ` (filtrado por ${chartFilterSku})` : ""}</p>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={porCanal} cx="50%" cy="50%" outerRadius={100} dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  onClick={handlePieClick} className="cursor-pointer">
                  {porCanal.map((entry, i) => (
                    <Cell key={i} fill={CHANNEL_COLORS[i % CHANNEL_COLORS.length]}
                      opacity={chartFilterCanal && chartFilterCanal !== entry.fullName ? 0.3 : 1}
                      stroke={chartFilterCanal === entry.fullName ? "#000" : "none"} strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => fmt(v)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="rounded-lg border border-border bg-card p-6">
            <h3 className="font-display font-semibold mb-1">Ranking por SKU (Unidades)</h3>
            <p className="text-xs text-muted-foreground mb-4">Clique para filtrar{chartFilterCanal ? ` (filtrado por ${chartFilterCanal.includes("(") ? chartFilterCanal.split("(")[0].trim() : chartFilterCanal})` : ""}</p>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={porSku} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={110} />
                <Tooltip />
                <Bar dataKey="qty" radius={[0, 6, 6, 0]} onClick={handleBarClick} className="cursor-pointer">
                  {porSku.map((entry) => (
                    <Cell key={entry.name} fill={SKU_COLORS[entry.name] || "#4F028B"}
                      opacity={chartFilterSku && chartFilterSku !== entry.name ? 0.3 : 1} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border p-4">
            <h3 className="font-display font-semibold">Registro de Vendas</h3>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={exportExcel}><Download className="h-4 w-4 mr-1" /> Exportar</Button>
              <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setEditingId(null); setForm({ data: "", canal: "", sku: "", formato: "", quantidade: "", precoUnitario: "" }); } }}>
                <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> Nova Venda</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>{editingId ? "Editar Venda" : "Registrar Venda"}</DialogTitle></DialogHeader>
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
                    <Input type="number" step="0.01" placeholder="Preço total da venda (R$)" value={form.precoUnitario} onChange={e => setForm({ ...form, precoUnitario: e.target.value })} />
                    {form.formato && form.precoUnitario && (
                      <p className="text-xs text-muted-foreground">
                        Preço por unidade: {fmt(parseFloat(form.precoUnitario) / (FORMATO_MULTIPLICADOR[form.formato] || 1))}
                        {" "}({FORMATO_MULTIPLICADOR[form.formato] || 1} unidades)
                      </p>
                    )}
                    <Button onClick={handleSubmit} className="w-full">{editingId ? "Salvar Alterações" : "Registrar Venda"}</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 border-b border-border p-4 bg-muted/30">
            <div className="flex items-center gap-1 text-sm text-muted-foreground"><Filter className="h-4 w-4" /> Filtros:</div>
            <Select value={filterCanal} onValueChange={setFilterCanal}>
              <SelectTrigger className="w-[160px] h-8 text-xs"><SelectValue placeholder="Canal" /></SelectTrigger>
              <SelectContent><SelectItem value="all">Todos Canais</SelectItem>{CANAIS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={filterSku} onValueChange={setFilterSku}>
              <SelectTrigger className="w-[160px] h-8 text-xs"><SelectValue placeholder="SKU" /></SelectTrigger>
              <SelectContent><SelectItem value="all">Todos SKUs</SelectItem>{SKUS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={filterFormato} onValueChange={setFilterFormato}>
              <SelectTrigger className="w-[130px] h-8 text-xs"><SelectValue placeholder="Formato" /></SelectTrigger>
              <SelectContent><SelectItem value="all">Todos Form.</SelectItem>{FORMATOS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead><TableHead>Canal</TableHead><TableHead>SKU</TableHead>
                  <TableHead>Formato</TableHead><TableHead className="text-right">Qtd</TableHead>
                  <TableHead className="text-right">Unidades</TableHead>
                  <TableHead className="text-right">Preço Total</TableHead>
                  <TableHead className="text-right">Preço/Un.</TableHead>
                  <TableHead className="text-right">Custo</TableHead><TableHead className="text-right">Lucro</TableHead>
                  <TableHead className="text-right">Margem</TableHead><TableHead className="text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecords.map(r => {
                  const unidades = getUnidadesReais(r);
                  const receita = r.quantidade * r.precoUnitario;
                  const custo = unidades * CONFIG.custoUnitario;
                  const lucro = receita - custo;
                  const m = receita ? (lucro / receita) * 100 : 0;
                  const precoUn = getPrecoUnitarioReal(r);
                  return (
                    <TableRow key={r.id} className="transition-colors hover:bg-accent/30">
                      <TableCell>{r.data}</TableCell>
                      <TableCell>{r.canal}</TableCell>
                      <TableCell>
                        <span className="font-medium flex items-center gap-1">
                          <span className="h-2 w-2 rounded-full inline-block" style={{ backgroundColor: SKU_COLORS[r.sku] }} />
                          {r.sku}
                        </span>
                      </TableCell>
                      <TableCell>{r.formato}</TableCell>
                      <TableCell className="text-right">{r.quantidade}</TableCell>
                      <TableCell className="text-right font-medium">{unidades}</TableCell>
                      <TableCell className="text-right">{fmt(receita)}</TableCell>
                      <TableCell className="text-right">{fmt(precoUn)}</TableCell>
                      <TableCell className="text-right">{fmt(custo)}</TableCell>
                      <TableCell className="text-right font-medium text-emerald-600">{fmt(lucro)}</TableCell>
                      <TableCell className="text-right">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${m >= 50 ? "bg-emerald-100 text-emerald-700" : m >= 30 ? "bg-amber-100 text-amber-700" : "bg-destructive/10 text-destructive"}`}>
                          {m.toFixed(1)}%
                        </span>
                      </TableCell>
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

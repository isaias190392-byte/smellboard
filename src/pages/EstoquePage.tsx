import { useState, useEffect, useMemo } from "react";
import { Plus, AlertTriangle, CheckCircle2, AlertCircle, Trash2, Pencil, Filter } from "lucide-react";
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
  EstoqueRecord, fetchEstoque, insertEstoque, updateEstoque, deleteEstoque,
  calcSaldoEstoque, calcSaldoPorSku,
  SKUS, SKUS_UNITARIOS, CANAIS, CATEGORIAS, TIPOS_ESTOQUE, CONFIG, SKU_COLORS, decomporSku, validarEstoque
} from "@/lib/store";
import { Package, TrendingDown, Boxes } from "lucide-react";

const EstoquePage = () => {
  const [records, setRecords] = useState<EstoqueRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ data: "", tipo: "" as string, categoria: "", canal: "", sku: "", quantidade: "", observacoes: "" });

  const [filterSku, setFilterSku] = useState<string>("all");
  const [filterTipo, setFilterTipo] = useState<string>("all");
  const [filterCategoria, setFilterCategoria] = useState<string>("all");

  useEffect(() => {
    fetchEstoque().then(d => { setRecords(d); setLoading(false); }).catch(() => { toast.error("Erro ao carregar estoque"); setLoading(false); });
  }, []);

  const saldo = calcSaldoEstoque(records);
  const saldoPorSku = calcSaldoPorSku(records);
  const entradas = records.filter(r => r.tipo === "Entrada").reduce((a, r) => a + r.quantidade, 0);
  const saidas = records.filter(r => r.tipo === "Saída").reduce((a, r) => a + r.quantidade, 0);

  // Show only unitários in chart for clarity
  const chartData = SKUS_UNITARIOS.map(sku => ({ name: sku, value: saldoPorSku[sku] || 0 }));

  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      if (filterSku !== "all" && r.sku !== filterSku) return false;
      if (filterTipo !== "all" && r.tipo !== filterTipo) return false;
      if (filterCategoria !== "all" && r.categoria !== filterCategoria) return false;
      return true;
    });
  }, [records, filterSku, filterTipo, filterCategoria]);

  const handleSubmit = async () => {
    const qty = parseInt(form.quantidade);
    if (!form.data || !form.tipo || !form.categoria || !form.sku || isNaN(qty) || qty <= 0) {
      toast.error("Preencha todos os campos obrigatórios"); return;
    }
    if (form.tipo === "Entrada" && !SKUS_UNITARIOS.includes(form.sku as typeof SKUS_UNITARIOS[number])) {
      toast.error("Entradas aceitam apenas SKUs unitários"); return;
    }
    const saldoValidacao = { ...saldoPorSku };
    if (editingId) {
      const old = records.find(r => r.id === editingId);
      if (old?.tipo === "Saída") saldoValidacao[old.sku] = (saldoValidacao[old.sku] || 0) + old.quantidade;
    }
    const erro = form.tipo === "Saída" ? validarEstoque(form.sku, qty, saldoValidacao) : null;
    if (erro) { toast.error(erro); return; }
    try {
      if (editingId) {
        await updateEstoque(editingId, { data: form.data, tipo: form.tipo as "Entrada" | "Saída", categoria: form.categoria, canal: form.canal, sku: form.sku, quantidade: qty, observacoes: form.observacoes });
        setRecords(prev => prev.map(r => r.id === editingId ? { ...r, data: form.data, tipo: form.tipo as "Entrada" | "Saída", categoria: form.categoria, canal: form.canal, sku: form.sku, quantidade: qty, observacoes: form.observacoes } : r));
      } else {
        const unidades = form.tipo === "Saída" ? decomporSku(form.sku, qty) : { [form.sku]: qty };
        const created = await Promise.all(Object.entries(unidades).map(([sku, quantidade]) => insertEstoque({ data: form.data, tipo: form.tipo as "Entrada" | "Saída", categoria: form.categoria, canal: form.canal, sku, quantidade, observacoes: form.observacoes || (sku !== form.sku ? `Decomposto de ${form.sku}` : "") })));
        setRecords(prev => [...prev, ...created]);
      }
      toast.success(editingId ? "Movimentação atualizada!" : "Movimentação registrada!");
      setForm({ data: "", tipo: "", categoria: "", canal: "", sku: "", quantidade: "", observacoes: "" });
      setEditingId(null);
      setOpen(false);
    } catch (e) { toast.error(e instanceof Error ? e.message : String(e)); }
  };

  const handleEdit = (r: EstoqueRecord) => {
    setEditingId(r.id);
    setForm({ data: r.data, tipo: r.tipo, categoria: r.categoria, canal: r.canal, sku: r.sku, quantidade: String(r.quantidade), observacoes: r.observacoes || "" });
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta movimentação?")) return;
    try {
      await deleteEstoque(id);
      setRecords(prev => prev.filter(r => r.id !== id));
      toast.success("Movimentação excluída!");
    } catch (e) { toast.error(e instanceof Error ? e.message : String(e)); }
  };

  const getStatusBadge = (sku: string) => {
    const s = saldoPorSku[sku] || 0;
    if (s < 20) return <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive"><AlertTriangle className="h-3 w-3" /> BAIXO</span>;
    if (s < 50) return <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground"><AlertCircle className="h-3 w-3" /> ATENÇÃO</span>;
    return <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700"><CheckCircle2 className="h-3 w-3" /> OK</span>;
  };

  let runningBalance = 0;

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><p className="text-muted-foreground">Carregando...</p></div>;

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="Estoque" subtitle="Controle de entradas e saídas" />
      <div className="mx-auto max-w-7xl px-6 py-8 space-y-8 animate-fade-in">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <KpiCard label="Saldo Total" value={`${saldo} un`} icon={Boxes} variant="primary" />
          <KpiCard label="Total Entradas" value={`${entradas} un`} icon={Package} variant="success" />
          <KpiCard label="Total Saídas" value={`${saidas} un`} icon={TrendingDown} variant="warning" />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-lg border border-border bg-card p-6">
            <h3 className="font-display font-semibold mb-4">Estoque por SKU (Unitários)</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData}>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry) => <Cell key={entry.name} fill={SKU_COLORS[entry.name] || "#4F028B"} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="rounded-lg border border-border bg-card p-6">
            <h3 className="font-display font-semibold mb-4">Status por Fragrância</h3>
            <div className="space-y-3">
              {SKUS_UNITARIOS.map(sku => (
                <div key={sku} className="flex items-center justify-between rounded-lg border border-border p-3 transition-colors hover:bg-accent/50">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: SKU_COLORS[sku] }} />
                    <span className="text-sm font-medium">{sku}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-foreground">{saldoPorSku[sku] || 0} un</span>
                    {getStatusBadge(sku)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border p-4">
            <h3 className="font-display font-semibold">Movimentações</h3>
            <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setEditingId(null); setForm({ data: "", tipo: "", categoria: "", canal: "", sku: "", quantidade: "", observacoes: "" }); } }}>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Nova Movimentação</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>{editingId ? "Editar Movimentação" : "Nova Movimentação de Estoque"}</DialogTitle></DialogHeader>
                <div className="space-y-3 pt-2 max-h-[60vh] overflow-y-auto">
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
                    <SelectContent>{(form.tipo === "Entrada" ? SKUS_UNITARIOS : SKUS).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                  <Input type="number" min="1" placeholder="Quantidade" value={form.quantidade} onChange={e => setForm({ ...form, quantidade: e.target.value })} />
                  <Input placeholder="Observações (opcional)" value={form.observacoes} onChange={e => setForm({ ...form, observacoes: e.target.value })} />
                  <Button onClick={handleSubmit} className="w-full">{editingId ? "Salvar Alterações" : "Registrar"}</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="flex flex-wrap gap-3 border-b border-border p-4 bg-muted/30">
            <div className="flex items-center gap-1 text-sm text-muted-foreground"><Filter className="h-4 w-4" /> Filtros:</div>
            <Select value={filterSku} onValueChange={setFilterSku}>
              <SelectTrigger className="w-[160px] h-8 text-xs"><SelectValue placeholder="SKU" /></SelectTrigger>
              <SelectContent><SelectItem value="all">Todos SKUs</SelectItem>{SKUS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={filterTipo} onValueChange={setFilterTipo}>
              <SelectTrigger className="w-[130px] h-8 text-xs"><SelectValue placeholder="Tipo" /></SelectTrigger>
              <SelectContent><SelectItem value="all">Todos Tipos</SelectItem>{TIPOS_ESTOQUE.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={filterCategoria} onValueChange={setFilterCategoria}>
              <SelectTrigger className="w-[140px] h-8 text-xs"><SelectValue placeholder="Categoria" /></SelectTrigger>
              <SelectContent><SelectItem value="all">Todas Cat.</SelectItem>{CATEGORIAS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead><TableHead>Tipo</TableHead><TableHead>Categoria</TableHead>
                  <TableHead>Canal</TableHead><TableHead>SKU</TableHead>
                  <TableHead className="text-right">Qtd</TableHead><TableHead className="text-right">Custo Un.</TableHead>
                  <TableHead className="text-right">Valor Total</TableHead><TableHead className="text-right">Saldo</TableHead>
                  <TableHead>Obs</TableHead>
                  <TableHead className="text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecords.map((r) => {
                  const sortedUntilRecord = records.filter(item => item.data < r.data || (item.data === r.data && item.id <= r.id));
                  const runningBalance = calcSaldoEstoque(sortedUntilRecord);
                  const valorTotal = r.quantidade * CONFIG.custoUnitario;
                  return (
                    <TableRow key={r.id} className="transition-colors hover:bg-accent/30">
                      <TableCell>{r.data}</TableCell>
                      <TableCell>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${r.tipo === "Entrada" ? "bg-emerald-100 text-emerald-700" : "bg-destructive/10 text-destructive"}`}>
                          {r.tipo}
                        </span>
                      </TableCell>
                      <TableCell>{r.categoria}</TableCell>
                      <TableCell>{r.canal || "—"}</TableCell>
                      <TableCell>
                        <span className="font-medium flex items-center gap-1">
                          <span className="h-2 w-2 rounded-full inline-block" style={{ backgroundColor: SKU_COLORS[r.sku] }} />
                          {r.sku}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">{r.quantidade}</TableCell>
                      <TableCell className="text-right">R$ {CONFIG.custoUnitario.toFixed(2)}</TableCell>
                      <TableCell className="text-right font-medium">{r.tipo === "Entrada" ? "" : "-"}R$ {valorTotal.toFixed(2)}</TableCell>
                      <TableCell className="text-right font-bold">{runningBalance}</TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[120px] truncate">{r.observacoes || "—"}</TableCell>
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

export default EstoquePage;

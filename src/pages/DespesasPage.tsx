import { useState, useEffect, useMemo } from "react";
import { Plus, Trash2, Pencil, Filter, Wallet, TrendingDown, Receipt, AlertTriangle } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import KpiCard from "@/components/KpiCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  DespesaRecord, fetchDespesas, insertDespesa, updateDespesa, deleteDespesa,
  CATEGORIAS_DESPESA, SUBCATEGORIAS_DESPESA, FORMAS_PAGAMENTO, STATUS_DESPESA,
} from "@/lib/store";

const emptyForm = {
  data: "", categoria: "", subcategoria: "", descricao: "", valor: "",
  status: "Pago", dataVencimento: "", dataPagamento: "", formaPagamento: "", observacoes: "",
};

const DespesasPage = () => {
  const [records, setRecords] = useState<DespesaRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [filterMes, setFilterMes] = useState<string>("all");
  const [filterCat, setFilterCat] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  useEffect(() => {
    fetchDespesas().then(d => { setRecords(d); setLoading(false); })
      .catch(() => { toast.error("Erro ao carregar despesas"); setLoading(false); });
  }, []);

  const fmt = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const meses = useMemo(() => Array.from(new Set(records.map(r => r.data.slice(0, 7)))).sort().reverse(), [records]);

  const filtered = useMemo(() => records.filter(r => {
    if (filterMes !== "all" && !r.data.startsWith(filterMes)) return false;
    if (filterCat !== "all" && r.categoria !== filterCat) return false;
    if (filterStatus !== "all" && r.status !== filterStatus) return false;
    return true;
  }), [records, filterMes, filterCat, filterStatus]);

  const total = filtered.reduce((a, r) => a + r.valor, 0);
  const fixas = filtered.filter(r => r.categoria === "Fixa").reduce((a, r) => a + r.valor, 0);
  const variaveis = filtered.filter(r => r.categoria === "Variável").reduce((a, r) => a + r.valor, 0);
  const impostos = filtered.filter(r => r.categoria === "Imposto").reduce((a, r) => a + r.valor, 0);
  const aPagar = filtered.filter(r => r.status === "A Pagar").reduce((a, r) => a + r.valor, 0);

  const handleSubmit = async () => {
    if (!form.data || !form.categoria || !form.valor) {
      toast.error("Preencha data, categoria e valor"); return;
    }
    const payload = {
      data: form.data, categoria: form.categoria, subcategoria: form.subcategoria,
      descricao: form.descricao, valor: parseFloat(form.valor) || 0,
      status: form.status,
      dataVencimento: form.dataVencimento || null,
      dataPagamento: form.dataPagamento || null,
      formaPagamento: form.formaPagamento, observacoes: form.observacoes,
    };
    try {
      if (editingId) {
        await updateDespesa(editingId, payload);
        setRecords(prev => prev.map(r => r.id === editingId ? { ...r, ...payload } : r));
        toast.success("Despesa atualizada!");
      } else {
        const newRec = await insertDespesa(payload);
        setRecords(prev => [newRec, ...prev]);
        toast.success("Despesa registrada!");
      }
      setForm(emptyForm); setEditingId(null); setOpen(false);
    } catch (e) { toast.error(e instanceof Error ? e.message : String(e)); }
  };

  const handleEdit = (r: DespesaRecord) => {
    setEditingId(r.id);
    setForm({
      data: r.data, categoria: r.categoria, subcategoria: r.subcategoria,
      descricao: r.descricao, valor: String(r.valor), status: r.status,
      dataVencimento: r.dataVencimento || "", dataPagamento: r.dataPagamento || "",
      formaPagamento: r.formaPagamento, observacoes: r.observacoes,
    });
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir esta despesa?")) return;
    try { await deleteDespesa(id); setRecords(prev => prev.filter(r => r.id !== id)); toast.success("Despesa excluída"); }
    catch (e) { toast.error(e instanceof Error ? e.message : String(e)); }
  };

  const togglePago = async (r: DespesaRecord) => {
    const novo = r.status === "Pago" ? "A Pagar" : "Pago";
    const dataPagamento = novo === "Pago" ? new Date().toISOString().slice(0, 10) : null;
    try {
      await updateDespesa(r.id, { status: novo, dataPagamento });
      setRecords(prev => prev.map(x => x.id === r.id ? { ...x, status: novo, dataPagamento } : x));
    } catch (e) { toast.error(e instanceof Error ? e.message : String(e)); }
  };

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><p className="text-muted-foreground">Carregando...</p></div>;

  const subcats = form.categoria ? (SUBCATEGORIAS_DESPESA[form.categoria] || []) : [];

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="Despesas" subtitle="Custos fixos, variáveis e impostos" />
      <div className="mx-auto max-w-7xl px-6 py-8 space-y-8 animate-fade-in">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-5">
          <KpiCard label="Total" value={fmt(total)} icon={Wallet} variant="primary" />
          <KpiCard label="Fixas" value={fmt(fixas)} icon={Receipt} />
          <KpiCard label="Variáveis" value={fmt(variaveis)} icon={TrendingDown} variant="warning" />
          <KpiCard label="Impostos" value={fmt(impostos)} icon={Receipt} variant="warning" />
          <KpiCard label="A Pagar" value={fmt(aPagar)} icon={AlertTriangle} variant="warning" />
        </div>

        <div className="rounded-lg border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border p-4">
            <h3 className="font-display font-semibold">Lançamentos</h3>
            <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setEditingId(null); setForm(emptyForm); } }}>
              <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> Nova Despesa</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>{editingId ? "Editar Despesa" : "Nova Despesa"}</DialogTitle></DialogHeader>
                <div className="space-y-3 pt-2 max-h-[60vh] overflow-y-auto">
                  <Input type="date" value={form.data} onChange={e => setForm({ ...form, data: e.target.value })} />
                  <Select value={form.categoria} onValueChange={v => setForm({ ...form, categoria: v, subcategoria: "" })}>
                    <SelectTrigger><SelectValue placeholder="Categoria" /></SelectTrigger>
                    <SelectContent>{CATEGORIAS_DESPESA.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                  <Select value={form.subcategoria} onValueChange={v => setForm({ ...form, subcategoria: v })} disabled={!form.categoria}>
                    <SelectTrigger><SelectValue placeholder="Subcategoria" /></SelectTrigger>
                    <SelectContent>{subcats.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                  <Input placeholder="Descrição" value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} />
                  <Input type="number" step="0.01" placeholder="Valor (R$)" value={form.valor} onChange={e => setForm({ ...form, valor: e.target.value })} />
                  <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                    <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                    <SelectContent>{STATUS_DESPESA.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                  <div className="grid grid-cols-2 gap-2">
                    <div><label className="text-xs text-muted-foreground">Vencimento</label><Input type="date" value={form.dataVencimento} onChange={e => setForm({ ...form, dataVencimento: e.target.value })} /></div>
                    <div><label className="text-xs text-muted-foreground">Pagamento</label><Input type="date" value={form.dataPagamento} onChange={e => setForm({ ...form, dataPagamento: e.target.value })} /></div>
                  </div>
                  <Select value={form.formaPagamento} onValueChange={v => setForm({ ...form, formaPagamento: v })}>
                    <SelectTrigger><SelectValue placeholder="Forma de Pagamento" /></SelectTrigger>
                    <SelectContent>{FORMAS_PAGAMENTO.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
                  </Select>
                  <Input placeholder="Observações" value={form.observacoes} onChange={e => setForm({ ...form, observacoes: e.target.value })} />
                  <Button onClick={handleSubmit} className="w-full">{editingId ? "Salvar" : "Registrar"}</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="flex flex-wrap gap-3 border-b border-border p-4 bg-muted/30">
            <div className="flex items-center gap-1 text-sm text-muted-foreground"><Filter className="h-4 w-4" /> Filtros:</div>
            <Select value={filterMes} onValueChange={setFilterMes}>
              <SelectTrigger className="w-[150px] h-8 text-xs"><SelectValue placeholder="Mês" /></SelectTrigger>
              <SelectContent><SelectItem value="all">Todos meses</SelectItem>{meses.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={filterCat} onValueChange={setFilterCat}>
              <SelectTrigger className="w-[150px] h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="all">Todas Categorias</SelectItem>{CATEGORIAS_DESPESA.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[140px] h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="all">Todos Status</SelectItem>{STATUS_DESPESA.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Data</TableHead><TableHead>Categoria</TableHead><TableHead>Subcategoria</TableHead>
                <TableHead>Descrição</TableHead><TableHead className="text-right">Valor</TableHead>
                <TableHead>Status</TableHead><TableHead>Vencimento</TableHead>
                <TableHead>Forma</TableHead><TableHead className="text-center">Ações</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {filtered.map(r => (
                  <TableRow key={r.id} className="hover:bg-accent/30">
                    <TableCell>{r.data}</TableCell>
                    <TableCell><span className="rounded-full bg-accent px-2 py-0.5 text-xs">{r.categoria}</span></TableCell>
                    <TableCell className="text-xs">{r.subcategoria || "—"}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{r.descricao || "—"}</TableCell>
                    <TableCell className="text-right font-medium">{fmt(r.valor)}</TableCell>
                    <TableCell>
                      <button onClick={() => togglePago(r)} className={`rounded-full px-2 py-0.5 text-xs font-medium ${r.status === "Pago" ? "bg-emerald-100 text-emerald-700" : "bg-destructive/10 text-destructive"}`}>{r.status}</button>
                    </TableCell>
                    <TableCell className="text-xs">{r.dataVencimento || "—"}</TableCell>
                    <TableCell className="text-xs">{r.formaPagamento || "—"}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(r)}><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(r.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">Nenhuma despesa encontrada</TableCell></TableRow>}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DespesasPage;

import { useState, useEffect } from "react";
import { Plus, Megaphone, Users, TrendingUp, Trash2, Pencil, Filter } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import KpiCard from "@/components/KpiCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { MarketingRecord, fetchMarketing, insertMarketing, updateMarketing, deleteMarketing, insertEstoque, SKUS, TIPOS_MARKETING, CONFIG } from "@/lib/store";
import { useMemo } from "react";

const MarketingPage = () => {
  const [records, setRecords] = useState<MarketingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ data: "", nome: "", tipo: "", sku: "", qtdEnviada: "", canalOrigem: "", vendasGeradas: "", seguidoresGerados: "", observacoes: "" });

  const [filterTipo, setFilterTipo] = useState<string>("all");
  const [filterSku, setFilterSku] = useState<string>("all");

  useEffect(() => {
    fetchMarketing().then(d => { setRecords(d); setLoading(false); }).catch(() => { toast.error("Erro ao carregar marketing"); setLoading(false); });
  }, []);

  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      if (filterTipo !== "all" && r.tipo !== filterTipo) return false;
      if (filterSku !== "all" && r.sku !== filterSku) return false;
      return true;
    });
  }, [records, filterTipo, filterSku]);

  const totalEnviado = records.reduce((a, r) => a + r.qtdEnviada, 0);
  const custoTotal = totalEnviado * CONFIG.custoUnitario;
  const vendasGeradas = records.reduce((a, r) => a + r.vendasGeradas, 0);
  const seguidores = records.reduce((a, r) => a + r.seguidoresGerados, 0);

  const chartData = records.map(r => ({
    name: r.nome.length > 12 ? r.nome.slice(0, 12) + "…" : r.nome,
    vendas: r.vendasGeradas,
    custo: r.qtdEnviada * CONFIG.custoUnitario,
  }));

  const handleSubmit = async () => {
    if (!form.data || !form.nome || !form.tipo || !form.sku || !form.qtdEnviada) {
      toast.error("Preencha os campos obrigatórios"); return;
    }
    try {
      const recordData = {
        data: form.data, nome: form.nome, tipo: form.tipo, sku: form.sku,
        qtdEnviada: parseInt(form.qtdEnviada), canalOrigem: form.canalOrigem,
        vendasGeradas: parseInt(form.vendasGeradas) || 0,
        seguidoresGerados: parseInt(form.seguidoresGerados) || 0, observacoes: form.observacoes,
      };

      if (editingId) {
        await updateMarketing(editingId, recordData);
        setRecords(prev => prev.map(r => r.id === editingId ? { ...r, ...recordData } : r));
        toast.success("Ação atualizada!");
      } else {
        const newRecord = await insertMarketing(recordData);
        setRecords(prev => [...prev, newRecord]);
        // Registrar saída no estoque automaticamente
        try {
          await insertEstoque({
            data: form.data, tipo: "Saída", categoria: "Marketing",
            canal: "", sku: form.sku, quantidade: parseInt(form.qtdEnviada),
            observacoes: `Marketing - ${form.tipo} - ${form.nome}`,
          });
        } catch { /* silently fail stock update */ }
        toast.success("Ação registrada!");
      }
      setForm({ data: "", nome: "", tipo: "", sku: "", qtdEnviada: "", canalOrigem: "", vendasGeradas: "", seguidoresGerados: "", observacoes: "" });
      setEditingId(null);
      setOpen(false);
    } catch { toast.error("Erro ao salvar"); }
  };

  const handleEdit = (r: MarketingRecord) => {
    setEditingId(r.id);
    setForm({
      data: r.data, nome: r.nome, tipo: r.tipo, sku: r.sku,
      qtdEnviada: String(r.qtdEnviada), canalOrigem: r.canalOrigem,
      vendasGeradas: String(r.vendasGeradas), seguidoresGerados: String(r.seguidoresGerados),
      observacoes: r.observacoes,
    });
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMarketing(id);
      setRecords(prev => prev.filter(r => r.id !== id));
      toast.success("Ação excluída!");
    } catch { toast.error("Erro ao excluir"); }
  };

  const fmt = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><p className="text-muted-foreground">Carregando...</p></div>;

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="Marketing" subtitle="Influencers, UGC, eventos e parcerias" />
      <div className="mx-auto max-w-7xl px-6 py-8 space-y-8 animate-fade-in">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <KpiCard label="Unidades Enviadas" value={`${totalEnviado}`} icon={Megaphone} variant="primary" />
          <KpiCard label="Custo Total" value={fmt(custoTotal)} icon={TrendingUp} variant="warning" />
          <KpiCard label="Vendas Geradas" value={`${vendasGeradas}`} icon={TrendingUp} variant="success" />
          <KpiCard label="Seguidores Gerados" value={`${seguidores}`} icon={Users} />
        </div>

        <div className="rounded-lg border border-border bg-card p-6">
          <h3 className="font-display font-semibold mb-4">Vendas vs Custo por Parceiro</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="vendas" name="Vendas" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="custo" name="Custo (R$)" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-lg border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border p-4">
            <h3 className="font-display font-semibold">Ações de Marketing</h3>
            <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setEditingId(null); setForm({ data: "", nome: "", tipo: "", sku: "", qtdEnviada: "", canalOrigem: "", vendasGeradas: "", seguidoresGerados: "", observacoes: "" }); } }}>
              <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> Nova Ação</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>{editingId ? "Editar Ação" : "Registrar Ação de Marketing"}</DialogTitle></DialogHeader>
                <div className="space-y-3 pt-2 max-h-[60vh] overflow-y-auto">
                  <Input type="date" value={form.data} onChange={e => setForm({ ...form, data: e.target.value })} />
                  <Input placeholder="Nome do influencer/parceiro" value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} />
                  <Select value={form.tipo} onValueChange={v => setForm({ ...form, tipo: v })}>
                    <SelectTrigger><SelectValue placeholder="Tipo" /></SelectTrigger>
                    <SelectContent>{TIPOS_MARKETING.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                  <Select value={form.sku} onValueChange={v => setForm({ ...form, sku: v })}>
                    <SelectTrigger><SelectValue placeholder="SKU" /></SelectTrigger>
                    <SelectContent>{SKUS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                  <Input type="number" min="1" placeholder="Qtd enviada" value={form.qtdEnviada} onChange={e => setForm({ ...form, qtdEnviada: e.target.value })} />
                  <Input placeholder="Canal de origem" value={form.canalOrigem} onChange={e => setForm({ ...form, canalOrigem: e.target.value })} />
                  <Input type="number" placeholder="Vendas geradas" value={form.vendasGeradas} onChange={e => setForm({ ...form, vendasGeradas: e.target.value })} />
                  <Input type="number" placeholder="Seguidores gerados" value={form.seguidoresGerados} onChange={e => setForm({ ...form, seguidoresGerados: e.target.value })} />
                  <Input placeholder="Observações" value={form.observacoes} onChange={e => setForm({ ...form, observacoes: e.target.value })} />
                  <Button onClick={handleSubmit} className="w-full">{editingId ? "Salvar Alterações" : "Registrar"}</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="flex flex-wrap gap-3 border-b border-border p-4 bg-muted/30">
            <div className="flex items-center gap-1 text-sm text-muted-foreground"><Filter className="h-4 w-4" /> Filtros:</div>
            <Select value={filterTipo} onValueChange={setFilterTipo}>
              <SelectTrigger className="w-[140px] h-8 text-xs"><SelectValue placeholder="Tipo" /></SelectTrigger>
              <SelectContent><SelectItem value="all">Todos Tipos</SelectItem>{TIPOS_MARKETING.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
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
                  <TableHead>Data</TableHead><TableHead>Parceiro</TableHead><TableHead>Tipo</TableHead>
                  <TableHead>SKU</TableHead><TableHead className="text-right">Enviado</TableHead>
                  <TableHead className="text-right">Custo</TableHead><TableHead className="text-right">Vendas</TableHead>
                  <TableHead className="text-right">ROI</TableHead><TableHead className="text-right">Seguidores</TableHead>
                  <TableHead>Obs</TableHead><TableHead className="text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecords.map(r => {
                  const custo = r.qtdEnviada * CONFIG.custoUnitario;
                  const roiVal = custo ? ((r.vendasGeradas * CONFIG.custoUnitario - custo) / custo * 100) : 0;
                  return (
                    <TableRow key={r.id} className="transition-colors hover:bg-accent/30">
                      <TableCell>{r.data}</TableCell>
                      <TableCell className="font-medium">{r.nome}</TableCell>
                      <TableCell><span className="rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">{r.tipo}</span></TableCell>
                      <TableCell>{r.sku}</TableCell>
                      <TableCell className="text-right">{r.qtdEnviada}</TableCell>
                      <TableCell className="text-right">{fmt(custo)}</TableCell>
                      <TableCell className="text-right font-medium">{r.vendasGeradas}</TableCell>
                      <TableCell className="text-right">
                        <span className={`text-xs font-medium ${roiVal >= 0 ? "text-emerald-600" : "text-destructive"}`}>{roiVal.toFixed(0)}%</span>
                      </TableCell>
                      <TableCell className="text-right">{r.seguidoresGerados}</TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[120px] truncate">{r.observacoes}</TableCell>
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

export default MarketingPage;

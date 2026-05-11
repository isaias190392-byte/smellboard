import { useState, useEffect, useMemo } from "react";
import { Plus, Trash2, Pencil, Users, ShoppingBag, DollarSign } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import KpiCard from "@/components/KpiCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  ClienteRecord, fetchClientes, insertCliente, updateCliente, deleteCliente,
  fetchVendas, VendaRecord, CANAIS,
} from "@/lib/store";

const emptyForm = { nome: "", cpfCnpj: "", email: "", telefone: "", cidade: "", uf: "", canalOrigem: "", observacoes: "" };

const ClientesPage = () => {
  const [records, setRecords] = useState<ClienteRecord[]>([]);
  const [vendas, setVendas] = useState<VendaRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    Promise.all([fetchClientes(), fetchVendas()])
      .then(([c, v]) => { setRecords(c); setVendas(v); setLoading(false); })
      .catch(() => { toast.error("Erro ao carregar"); setLoading(false); });
  }, []);

  const fmt = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const stats = useMemo(() => {
    const m: Record<string, { total: number; n: number; ultima: string }> = {};
    vendas.forEach(v => {
      const c = (v as VendaRecord & { cliente_id?: string }).cliente_id;
      if (!c) return;
      if (!m[c]) m[c] = { total: 0, n: 0, ultima: "" };
      m[c].total += v.precoTotal;
      m[c].n += 1;
      if (v.data > m[c].ultima) m[c].ultima = v.data;
    });
    return m;
  }, [vendas]);

  const totalClientes = records.length;
  const ticketGeral = useMemo(() => {
    const arr = Object.values(stats);
    if (!arr.length) return 0;
    return arr.reduce((a, x) => a + (x.n ? x.total / x.n : 0), 0) / arr.length;
  }, [stats]);

  const handleSubmit = async () => {
    if (!form.nome) { toast.error("Nome é obrigatório"); return; }
    try {
      if (editingId) {
        await updateCliente(editingId, form);
        setRecords(prev => prev.map(r => r.id === editingId ? { ...r, ...form } : r));
        toast.success("Cliente atualizado!");
      } else {
        const newRec = await insertCliente(form);
        setRecords(prev => [...prev, newRec]);
        toast.success("Cliente cadastrado!");
      }
      setForm(emptyForm); setEditingId(null); setOpen(false);
    } catch (e) { toast.error(e instanceof Error ? e.message : String(e)); }
  };

  const handleEdit = (r: ClienteRecord) => {
    setEditingId(r.id);
    setForm({ nome: r.nome, cpfCnpj: r.cpfCnpj, email: r.email, telefone: r.telefone, cidade: r.cidade, uf: r.uf, canalOrigem: r.canalOrigem, observacoes: r.observacoes });
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir este cliente?")) return;
    try { await deleteCliente(id); setRecords(prev => prev.filter(r => r.id !== id)); toast.success("Cliente excluído"); }
    catch (e) { toast.error(e instanceof Error ? e.message : String(e)); }
  };

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><p className="text-muted-foreground">Carregando...</p></div>;

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="Clientes" subtitle="Cadastro e histórico de compras (CRM)" />
      <div className="mx-auto max-w-7xl px-6 py-8 space-y-8 animate-fade-in">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <KpiCard label="Clientes Cadastrados" value={String(totalClientes)} icon={Users} variant="primary" />
          <KpiCard label="Compradores Recorrentes" value={String(Object.values(stats).filter(s => s.n > 1).length)} icon={ShoppingBag} variant="success" />
          <KpiCard label="Ticket Médio" value={fmt(ticketGeral)} icon={DollarSign} />
        </div>

        <div className="rounded-lg border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border p-4">
            <h3 className="font-display font-semibold">Clientes</h3>
            <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setEditingId(null); setForm(emptyForm); } }}>
              <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> Novo Cliente</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>{editingId ? "Editar Cliente" : "Novo Cliente"}</DialogTitle></DialogHeader>
                <div className="space-y-3 pt-2 max-h-[60vh] overflow-y-auto">
                  <Input placeholder="Nome" value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} />
                  <Input placeholder="CPF/CNPJ" value={form.cpfCnpj} onChange={e => setForm({ ...form, cpfCnpj: e.target.value })} />
                  <Input placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                  <Input placeholder="Telefone" value={form.telefone} onChange={e => setForm({ ...form, telefone: e.target.value })} />
                  <div className="grid grid-cols-3 gap-2">
                    <Input className="col-span-2" placeholder="Cidade" value={form.cidade} onChange={e => setForm({ ...form, cidade: e.target.value })} />
                    <Input placeholder="UF" maxLength={2} value={form.uf} onChange={e => setForm({ ...form, uf: e.target.value.toUpperCase() })} />
                  </div>
                  <Select value={form.canalOrigem} onValueChange={v => setForm({ ...form, canalOrigem: v })}>
                    <SelectTrigger><SelectValue placeholder="Canal de origem" /></SelectTrigger>
                    <SelectContent>{CANAIS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                  <Input placeholder="Observações" value={form.observacoes} onChange={e => setForm({ ...form, observacoes: e.target.value })} />
                  <Button onClick={handleSubmit} className="w-full">{editingId ? "Salvar" : "Cadastrar"}</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Nome</TableHead><TableHead>Contato</TableHead><TableHead>Cidade/UF</TableHead>
                <TableHead>Origem</TableHead>
                <TableHead className="text-right">Compras</TableHead><TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Ticket Médio</TableHead><TableHead>Última Compra</TableHead>
                <TableHead className="text-center">Ações</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {records.map(r => {
                  const s = stats[r.id] || { total: 0, n: 0, ultima: "" };
                  return <TableRow key={r.id} className="hover:bg-accent/30">
                    <TableCell className="font-medium">{r.nome}</TableCell>
                    <TableCell className="text-xs">{r.email || r.telefone || "—"}</TableCell>
                    <TableCell className="text-xs">{r.cidade}{r.uf ? `/${r.uf}` : ""}</TableCell>
                    <TableCell className="text-xs">{r.canalOrigem || "—"}</TableCell>
                    <TableCell className="text-right">{s.n}</TableCell>
                    <TableCell className="text-right font-medium">{fmt(s.total)}</TableCell>
                    <TableCell className="text-right">{fmt(s.n ? s.total / s.n : 0)}</TableCell>
                    <TableCell className="text-xs">{s.ultima || "—"}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(r)}><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(r.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>;
                })}
                {records.length === 0 && <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">Nenhum cliente cadastrado</TableCell></TableRow>}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientesPage;

import { useState } from "react";
import { Plus, Megaphone, Users, TrendingUp } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import KpiCard from "@/components/KpiCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { MarketingRecord, getMarketing, saveMarketing, SKUS, TIPOS_MARKETING, CONFIG } from "@/lib/store";

const MarketingPage = () => {
  const [records, setRecords] = useState<MarketingRecord[]>(getMarketing());
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ data: "", nome: "", tipo: "", sku: "", qtdEnviada: "", canalOrigem: "", vendasGeradas: "", seguidoresGerados: "", observacoes: "" });

  const totalEnviado = records.reduce((a, r) => a + r.qtdEnviada, 0);
  const custoTotal = totalEnviado * CONFIG.custoUnitario;
  const vendasGeradas = records.reduce((a, r) => a + r.vendasGeradas, 0);
  const seguidores = records.reduce((a, r) => a + r.seguidoresGerados, 0);
  const roi = custoTotal ? ((vendasGeradas * CONFIG.custoUnitario - custoTotal) / custoTotal * 100) : 0;

  const chartData = records.map(r => ({
    name: r.nome.length > 12 ? r.nome.slice(0, 12) + "…" : r.nome,
    vendas: r.vendasGeradas,
    custo: r.qtdEnviada * CONFIG.custoUnitario,
  }));

  const handleSubmit = () => {
    if (!form.data || !form.nome || !form.tipo || !form.sku || !form.qtdEnviada) {
      toast.error("Preencha os campos obrigatórios"); return;
    }
    const updated = [...records, {
      id: crypto.randomUUID(), data: form.data, nome: form.nome, tipo: form.tipo,
      sku: form.sku, qtdEnviada: parseInt(form.qtdEnviada),
      canalOrigem: form.canalOrigem, vendasGeradas: parseInt(form.vendasGeradas) || 0,
      seguidoresGerados: parseInt(form.seguidoresGerados) || 0, observacoes: form.observacoes,
    }];
    setRecords(updated); saveMarketing(updated);
    setForm({ data: "", nome: "", tipo: "", sku: "", qtdEnviada: "", canalOrigem: "", vendasGeradas: "", seguidoresGerados: "", observacoes: "" });
    setOpen(false); toast.success("Ação registrada!");
  };

  const fmt = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="Marketing" subtitle="Influencers, UGC e parcerias" />
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
              <Bar dataKey="vendas" name="Vendas" fill="#4F028B" radius={[4, 4, 0, 0]} />
              <Bar dataKey="custo" name="Custo (R$)" fill="#C084FC" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-lg border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border p-4">
            <h3 className="font-display font-semibold">Ações de Marketing</h3>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> Nova Ação</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Registrar Ação de Marketing</DialogTitle></DialogHeader>
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
                  <Button onClick={handleSubmit} className="w-full">Registrar</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead><TableHead>Parceiro</TableHead><TableHead>Tipo</TableHead>
                  <TableHead>SKU</TableHead><TableHead className="text-right">Enviado</TableHead>
                  <TableHead className="text-right">Custo</TableHead><TableHead className="text-right">Vendas</TableHead>
                  <TableHead className="text-right">ROI</TableHead><TableHead className="text-right">Seguidores</TableHead>
                  <TableHead>Obs</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map(r => {
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
                        <span className={`text-xs font-medium ${roiVal >= 0 ? "text-emerald-600" : "text-red-600"}`}>{roiVal.toFixed(0)}%</span>
                      </TableCell>
                      <TableCell className="text-right">{r.seguidoresGerados}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{r.observacoes}</TableCell>
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

import { useState, useEffect, useMemo } from "react";
import PageHeader from "@/components/PageHeader";
import KpiCard from "@/components/KpiCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { TrendingUp, DollarSign, TrendingDown, Wallet, Plus, CheckCircle2, Clock, Trash2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line, Legend } from "recharts";
import {
  fetchVendas, VendaRecord, fetchDespesas, DespesaRecord, fetchContasReceber, ContaReceberRecord,
  fetchClientes, ClienteRecord, insertContaReceber, updateContaReceber, deleteContaReceber,
  insertDespesa, updateDespesa, deleteDespesa,
  calcDRE, CONFIG, getUnidadesReais,
  CATEGORIAS_DESPESA, SUBCATEGORIAS_DESPESA, FORMAS_PAGAMENTO,
} from "@/lib/store";

const fmt = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const DREFinanceiroPage = () => {
  const [vendas, setVendas] = useState<VendaRecord[]>([]);
  const [despesas, setDespesas] = useState<DespesaRecord[]>([]);
  const [contas, setContas] = useState<ContaReceberRecord[]>([]);
  const [clientes, setClientes] = useState<ClienteRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const today = new Date().toISOString().slice(0, 7);
  const [mes, setMes] = useState<string>(today);

  useEffect(() => {
    Promise.all([fetchVendas(), fetchDespesas(), fetchContasReceber(), fetchClientes()])
      .then(([v, d, c, cl]) => { setVendas(v); setDespesas(d); setContas(c); setClientes(cl); setLoading(false); })
      .catch(() => { toast.error("Erro ao carregar"); setLoading(false); });
  }, []);

  const meses = useMemo(() => {
    const set = new Set<string>([today]);
    vendas.forEach(v => set.add(v.data.slice(0, 7)));
    despesas.forEach(d => set.add(d.data.slice(0, 7)));
    return Array.from(set).sort().reverse();
  }, [vendas, despesas, today]);

  const dre = useMemo(() => calcDRE(vendas, despesas, mes), [vendas, despesas, mes]);
  const prevMes = useMemo(() => {
    const [y, m] = mes.split("-").map(Number);
    const d = new Date(y, m - 2, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  }, [mes]);
  const drePrev = useMemo(() => calcDRE(vendas, despesas, prevMes), [vendas, despesas, prevMes]);

  // Fluxo de caixa: entradas vs saídas por dia do mês selecionado
  const fluxo = useMemo(() => {
    const map: Record<string, { entradas: number; saidas: number }> = {};
    vendas.filter(v => v.data.startsWith(mes)).forEach(v => {
      map[v.data] = map[v.data] || { entradas: 0, saidas: 0 };
      map[v.data].entradas += v.precoTotal;
    });
    contas.filter(c => c.status === "Recebido" && c.dataRecebimento?.startsWith(mes)).forEach(c => {
      const d = c.dataRecebimento!;
      map[d] = map[d] || { entradas: 0, saidas: 0 };
      map[d].entradas += c.valor;
    });
    despesas.filter(d => d.status === "Pago" && (d.dataPagamento || d.data).startsWith(mes)).forEach(d => {
      const dia = d.dataPagamento || d.data;
      map[dia] = map[dia] || { entradas: 0, saidas: 0 };
      map[dia].saidas += d.valor;
    });
    let saldo = 0;
    return Object.entries(map).sort().map(([dia, v]) => {
      saldo += v.entradas - v.saidas;
      return { dia: dia.slice(8), entradas: v.entradas, saidas: v.saidas, saldo };
    });
  }, [vendas, despesas, contas, mes]);

  const totalEntradas = fluxo.reduce((a, x) => a + x.entradas, 0);
  const totalSaidas = fluxo.reduce((a, x) => a + x.saidas, 0);
  const saldoLiquido = totalEntradas - totalSaidas;

  // Comparativo mensal últimos 6 meses
  const comparativo = useMemo(() => {
    return meses.slice(0, 6).reverse().map(m => {
      const r = calcDRE(vendas, despesas, m);
      return { mes: m.slice(5), receita: r.receitaBruta, despesas: r.despesasFixas + r.despesasVariaveis + r.impostos, ebitda: r.ebitda };
    });
  }, [meses, vendas, despesas]);

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><p className="text-muted-foreground">Carregando...</p></div>;

  const delta = (atual: number, anterior: number) => {
    if (!anterior) return null;
    const pct = ((atual - anterior) / Math.abs(anterior)) * 100;
    return <span className={`text-xs ml-2 ${pct >= 0 ? "text-emerald-600" : "text-destructive"}`}>{pct >= 0 ? "▲" : "▼"} {Math.abs(pct).toFixed(1)}%</span>;
  };

  const dreLines = [
    { label: "(+) Receita Bruta de Vendas", v: dre.receitaBruta, prev: drePrev.receitaBruta, bold: true },
    { label: "(−) Impostos sobre Vendas", v: -dre.impostos, prev: -drePrev.impostos },
    { label: "(=) Receita Líquida", v: dre.receitaLiquida, prev: drePrev.receitaLiquida, bold: true },
    { label: "(−) CMV (Custo dos Produtos Vendidos)", v: -dre.cmv, prev: -drePrev.cmv },
    { label: "(=) Lucro Bruto", v: dre.lucroBruto, prev: drePrev.lucroBruto, bold: true, accent: true },
    { label: "(−) Despesas Variáveis", v: -dre.despesasVariaveis, prev: -drePrev.despesasVariaveis },
    { label: "(−) Despesas Fixas", v: -dre.despesasFixas, prev: -drePrev.despesasFixas },
    { label: "(=) EBITDA", v: dre.ebitda, prev: drePrev.ebitda, bold: true, accent: true },
  ];

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="Financeiro & DRE" subtitle="Fluxo de caixa, contas a receber e demonstração de resultados" />
      <div className="mx-auto max-w-7xl px-6 py-8 space-y-8 animate-fade-in">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">Mês de referência:</span>
            <Select value={mes} onValueChange={setMes}>
              <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>{meses.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <KpiCard label="Receita Bruta" value={fmt(dre.receitaBruta)} icon={DollarSign} variant="primary" />
          <KpiCard label="Despesas Totais" value={fmt(dre.despesasFixas + dre.despesasVariaveis + dre.impostos)} icon={TrendingDown} variant="warning" />
          <KpiCard label="EBITDA" value={fmt(dre.ebitda)} icon={TrendingUp} variant={dre.ebitda >= 0 ? "success" : "warning"} />
          <KpiCard label="Margem EBITDA" value={`${dre.margemEbitda.toFixed(1)}%`} icon={TrendingUp} />
        </div>

        <Tabs defaultValue="dre" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="dre">DRE Mensal</TabsTrigger>
            <TabsTrigger value="fluxo">Fluxo de Caixa</TabsTrigger>
            <TabsTrigger value="receber">Contas a Receber</TabsTrigger>
          </TabsList>

          <TabsContent value="dre" className="space-y-6">
            <div className="rounded-lg border border-border bg-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-semibold">DRE — {mes}</h3>
                <span className="text-xs text-muted-foreground">Comparativo vs {prevMes}</span>
              </div>
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Linha</TableHead>
                  <TableHead className="text-right">Mês Atual</TableHead>
                  <TableHead className="text-right">Mês Anterior</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {dreLines.map(l => (
                    <TableRow key={l.label} className={l.accent ? "bg-primary/5" : ""}>
                      <TableCell className={l.bold ? "font-bold" : ""}>{l.label}</TableCell>
                      <TableCell className={`text-right ${l.bold ? "font-bold" : ""} ${l.v < 0 ? "text-destructive" : ""}`}>
                        {fmt(l.v)}{delta(l.v, l.prev)}
                      </TableCell>
                      <TableCell className={`text-right text-muted-foreground ${l.v < 0 ? "" : ""}`}>{fmt(l.prev)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-accent/40">
                    <TableCell className="font-bold">Margem EBITDA %</TableCell>
                    <TableCell className="text-right font-bold">{dre.margemEbitda.toFixed(1)}%</TableCell>
                    <TableCell className="text-right text-muted-foreground">{drePrev.margemEbitda.toFixed(1)}%</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            <div className="rounded-lg border border-border bg-card p-6">
              <h3 className="font-display font-semibold mb-4">Comparativo dos últimos 6 meses</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={comparativo}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v: number) => fmt(v)} />
                  <Legend />
                  <Bar dataKey="receita" name="Receita" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="despesas" name="Despesas" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="ebitda" name="EBITDA" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="fluxo" className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <KpiCard label="Entradas" value={fmt(totalEntradas)} icon={TrendingUp} variant="success" />
              <KpiCard label="Saídas" value={fmt(totalSaidas)} icon={TrendingDown} variant="warning" />
              <KpiCard label="Saldo Líquido" value={fmt(saldoLiquido)} icon={Wallet} variant={saldoLiquido >= 0 ? "primary" : "warning"} />
            </div>
            <div className="rounded-lg border border-border bg-card p-6">
              <h3 className="font-display font-semibold mb-4">Saldo acumulado — {mes}</h3>
              {fluxo.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">Sem movimentações neste mês</p>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={fluxo}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="dia" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(v: number) => fmt(v)} />
                    <Legend />
                    <Line type="monotone" dataKey="entradas" name="Entradas" stroke="#10b981" strokeWidth={2} />
                    <Line type="monotone" dataKey="saidas" name="Saídas" stroke="hsl(var(--destructive))" strokeWidth={2} />
                    <Line type="monotone" dataKey="saldo" name="Saldo Acumulado" stroke="hsl(var(--primary))" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </TabsContent>

          <TabsContent value="receber">
            <ContasReceberPanel contas={contas} setContas={setContas} clientes={clientes} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

const ContasReceberPanel = ({ contas, setContas, clientes }: { contas: ContaReceberRecord[]; setContas: React.Dispatch<React.SetStateAction<ContaReceberRecord[]>>; clientes: ClienteRecord[] }) => {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ data: "", descricao: "", clienteId: "", valor: "", vencimento: "", observacoes: "" });

  const total = contas.reduce((a, c) => a + (c.status === "Pendente" ? c.valor : 0), 0);
  const recebido = contas.reduce((a, c) => a + (c.status === "Recebido" ? c.valor : 0), 0);

  const handleSubmit = async () => {
    if (!form.data || !form.valor) { toast.error("Preencha data e valor"); return; }
    try {
      const cliente = clientes.find(c => c.id === form.clienteId);
      const newRec = await insertContaReceber({
        data: form.data, descricao: form.descricao,
        clienteId: form.clienteId || null,
        clienteNome: cliente?.nome || "",
        valor: parseFloat(form.valor) || 0,
        vencimento: form.vencimento || null,
        status: "Pendente", dataRecebimento: null, observacoes: form.observacoes,
      });
      setContas(prev => [...prev, newRec]);
      setForm({ data: "", descricao: "", clienteId: "", valor: "", vencimento: "", observacoes: "" });
      setOpen(false);
      toast.success("Conta criada!");
    } catch (e) { toast.error(e instanceof Error ? e.message : String(e)); }
  };

  const toggle = async (c: ContaReceberRecord) => {
    const novo = c.status === "Recebido" ? "Pendente" : "Recebido";
    const dataRecebimento = novo === "Recebido" ? new Date().toISOString().slice(0, 10) : null;
    try {
      await updateContaReceber(c.id, { status: novo, dataRecebimento });
      setContas(prev => prev.map(x => x.id === c.id ? { ...x, status: novo, dataRecebimento } : x));
    } catch (e) { toast.error(e instanceof Error ? e.message : String(e)); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir esta conta?")) return;
    try { await deleteContaReceber(id); setContas(prev => prev.filter(c => c.id !== id)); toast.success("Excluída"); }
    catch (e) { toast.error(e instanceof Error ? e.message : String(e)); }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <KpiCard label="A Receber" value={fmt(total)} icon={Clock} variant="warning" />
        <KpiCard label="Recebido" value={fmt(recebido)} icon={CheckCircle2} variant="success" />
      </div>
      <div className="rounded-lg border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border p-4">
          <h3 className="font-display font-semibold">Contas a Receber</h3>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> Nova Conta</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Nova Conta a Receber</DialogTitle></DialogHeader>
              <div className="space-y-3 pt-2">
                <Input type="date" value={form.data} onChange={e => setForm({ ...form, data: e.target.value })} />
                <Input placeholder="Descrição" value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} />
                <Select value={form.clienteId} onValueChange={v => setForm({ ...form, clienteId: v })}>
                  <SelectTrigger><SelectValue placeholder="Cliente (opcional)" /></SelectTrigger>
                  <SelectContent>{clientes.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
                </Select>
                <Input type="number" step="0.01" placeholder="Valor (R$)" value={form.valor} onChange={e => setForm({ ...form, valor: e.target.value })} />
                <div><label className="text-xs text-muted-foreground">Vencimento</label><Input type="date" value={form.vencimento} onChange={e => setForm({ ...form, vencimento: e.target.value })} /></div>
                <Input placeholder="Observações" value={form.observacoes} onChange={e => setForm({ ...form, observacoes: e.target.value })} />
                <Button onClick={handleSubmit} className="w-full">Registrar</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Data</TableHead><TableHead>Descrição</TableHead><TableHead>Cliente</TableHead>
              <TableHead className="text-right">Valor</TableHead><TableHead>Vencimento</TableHead>
              <TableHead>Status</TableHead><TableHead className="text-center">Ações</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {contas.map(c => (
                <TableRow key={c.id} className="hover:bg-accent/30">
                  <TableCell>{c.data}</TableCell>
                  <TableCell>{c.descricao || "—"}</TableCell>
                  <TableCell>{c.clienteNome || "—"}</TableCell>
                  <TableCell className="text-right font-medium">{fmt(c.valor)}</TableCell>
                  <TableCell className="text-xs">{c.vencimento || "—"}</TableCell>
                  <TableCell>
                    <button onClick={() => toggle(c)} className={`rounded-full px-2 py-0.5 text-xs font-medium ${c.status === "Recebido" ? "bg-emerald-100 text-emerald-700" : "bg-destructive/10 text-destructive"}`}>{c.status}</button>
                  </TableCell>
                  <TableCell className="text-center">
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(c.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </TableCell>
                </TableRow>
              ))}
              {contas.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Nenhuma conta a receber</TableCell></TableRow>}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default DREFinanceiroPage;

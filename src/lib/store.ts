// Shared data store (Supabase-backed)
import { supabase } from "@/integrations/supabase/client";

export type ProfileName = "Diretoria" | "Comercial" | "Usuário";

export interface UserProfile {
  userId: string;
  displayName: ProfileName;
}

export const SKUS_UNITARIOS = ["INTENSE", "TEXAS", "SUNSET", "GARDEN", "BRISE"] as const;

export const SKUS_KITS = [
  "KIT DEGUSTAÇÃO", "KIT VARIADO",
  "KIT BRISE", "KIT INTENSE", "KIT TEXAS", "KIT SUNSET", "KIT GARDEN",
] as const;

export const SKUS = [...SKUS_UNITARIOS, ...SKUS_KITS] as const;

export const SKU_COLORS: Record<string, string> = {
  INTENSE: "#4F028B",
  TEXAS: "#DC2626",
  SUNSET: "#EAB308",
  GARDEN: "#22C55E",
  BRISE: "#2563EB",
};

// Composição dos kits em unidades individuais
export const KIT_COMPOSICAO: Record<string, Record<string, number>> = {
  "KIT DEGUSTAÇÃO": { INTENSE: 1, TEXAS: 1, SUNSET: 1, GARDEN: 1, BRISE: 1 },
  "KIT VARIADO": { INTENSE: 2, TEXAS: 2, SUNSET: 2, GARDEN: 3, BRISE: 3 },
  "KIT BRISE": { BRISE: 12 },
  "KIT INTENSE": { INTENSE: 12 },
  "KIT TEXAS": { TEXAS: 12 },
  "KIT SUNSET": { SUNSET: 12 },
  "KIT GARDEN": { GARDEN: 12 },
};

export const CANAIS = ["Mercado Livre", "Shopee", "Direto (WhatsApp/Instagram)", "B2B"] as const;
export const CATEGORIAS = ["Venda", "Doação", "Marketing", "Teste", "Perda", "Compra"] as const;
export const TIPOS_ESTOQUE = ["Entrada", "Saída"] as const;
export const TIPOS_MARKETING = ["UGC", "Influencer", "Doação", "Evento"] as const;

export const CONFIG = {
  custoUnitario: 5.0,
  marketingPct: 0.10,
  precos: {
    "Mercado Livre": 29.90,
    "Shopee": 24.90,
    "Direto (WhatsApp/Instagram)": 27.90,
    "B2B": 19.90,
  } as Record<string, number>,
};

export interface EstoqueRecord {
  id: string;
  data: string;
  tipo: "Entrada" | "Saída";
  categoria: string;
  canal: string;
  sku: string;
  quantidade: number;
  observacoes: string;
  createdBy: string;
  updatedBy: string;
}

export interface VendaRecord {
  id: string;
  data: string;
  canal: string;
  sku: string;
  quantidade: number;
  precoTotal: number;
  clienteId: string | null;
  createdBy: string;
  updatedBy: string;
}

export interface MarketingRecord {
  id: string;
  data: string;
  nome: string;
  tipo: string;
  sku: string;
  qtdEnviada: number;
  vendasGeradas: number;
  observacoes: string;
  createdBy: string;
  updatedBy: string;
}

export interface FinanceiroRecord {
  id: string;
  data: string;
  tipo: string;
  descricao: string;
  sku: string;
  quantidade: number;
  custoUnitario: number;
  frete: number;
  custoTotal: number;
  precoVenda: number;
  markup: number;
  receita: number;
  lucroBruto: number;
  observacoes: string;
  createdBy: string;
  updatedBy: string;
}

// --- Supabase CRUD ---

export async function fetchCurrentProfile(): Promise<UserProfile | null> {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw sessionError;
  const user = sessionData.session?.user;
  if (!user) return null;
  const { data, error } = await supabase.from("profiles").select("display_name").eq("user_id", user.id).single();
  if (error) throw error;
  return { userId: user.id, displayName: ((data?.display_name as ProfileName) || "Usuário") };
}

const auditFields = (r: Record<string, unknown>) => ({
  createdBy: (r.created_by as string) || "Sistema",
  updatedBy: (r.updated_by as string) || "Sistema",
});

export async function fetchEstoque(): Promise<EstoqueRecord[]> {
  const { data, error } = await supabase.from("estoque").select("*").order("data", { ascending: true });
  if (error) throw error;
  return (data || []).map(r => ({
    id: r.id, data: r.data, tipo: r.tipo as "Entrada" | "Saída",
    categoria: r.categoria, canal: r.canal, sku: r.sku, quantidade: r.quantidade,
    observacoes: (r as Record<string, unknown>).observacoes as string || "",
    ...auditFields(r as Record<string, unknown>),
  }));
}

export async function insertEstoque(record: Omit<EstoqueRecord, "id" | "createdBy" | "updatedBy">): Promise<EstoqueRecord> {
  const insertData: Record<string, unknown> = {
    data: record.data, tipo: record.tipo, categoria: record.categoria,
    canal: record.canal, sku: record.sku, quantidade: record.quantidade,
    observacoes: record.observacoes || "",
  };
  const { data, error } = await supabase.from("estoque").insert([insertData as never]).select().single();
  if (error) throw error;
  return { id: data.id, data: data.data, tipo: data.tipo as "Entrada" | "Saída", categoria: data.categoria, canal: data.canal, sku: data.sku, quantidade: data.quantidade, observacoes: (data as Record<string, unknown>).observacoes as string || "", ...auditFields(data as Record<string, unknown>) };
}

export async function updateEstoque(id: string, record: Partial<Omit<EstoqueRecord, "id" | "createdBy" | "updatedBy">>): Promise<void> {
  const { error } = await supabase.from("estoque").update(record as Record<string, unknown>).eq("id", id);
  if (error) throw error;
}

export async function deleteEstoque(id: string): Promise<void> {
  const { error } = await supabase.from("estoque").delete().eq("id", id);
  if (error) throw error;
}

export async function deleteEstoqueByToken(token: string): Promise<void> {
  const { error } = await supabase.from("estoque").delete().ilike("observacoes", `%${token}%`);
  if (error) throw error;
}

export async function fetchVendas(): Promise<VendaRecord[]> {
  const { data, error } = await supabase.from("vendas").select("*").order("data", { ascending: true });
  if (error) throw error;
  return (data || []).map(r => ({
    id: r.id, data: r.data, canal: r.canal, sku: r.sku,
    quantidade: r.quantidade, precoTotal: Number(r.preco_unitario),
    ...auditFields(r as Record<string, unknown>),
  }));
}

export async function insertVenda(record: Omit<VendaRecord, "id" | "createdBy" | "updatedBy">): Promise<VendaRecord> {
  const { data, error } = await supabase.from("vendas").insert({
    data: record.data, canal: record.canal, sku: record.sku,
    quantidade: record.quantidade, preco_unitario: record.precoTotal,
  } as never).select().single();
  if (error) throw error;
  return { id: data.id, data: data.data, canal: data.canal, sku: data.sku, quantidade: data.quantidade, precoTotal: Number(data.preco_unitario), ...auditFields(data as Record<string, unknown>) };
}

export async function updateVenda(id: string, record: Partial<Omit<VendaRecord, "id" | "createdBy" | "updatedBy">>): Promise<void> {
  const updateData: Record<string, unknown> = {};
  if (record.data !== undefined) updateData.data = record.data;
  if (record.canal !== undefined) updateData.canal = record.canal;
  if (record.sku !== undefined) updateData.sku = record.sku;
  if (record.quantidade !== undefined) updateData.quantidade = record.quantidade;
  if (record.precoTotal !== undefined) updateData.preco_unitario = record.precoTotal;
  const { error } = await supabase.from("vendas").update(updateData).eq("id", id);
  if (error) throw error;
}

export async function deleteVenda(id: string): Promise<void> {
  const { error } = await supabase.from("vendas").delete().eq("id", id);
  if (error) throw error;
}

export async function fetchMarketing(): Promise<MarketingRecord[]> {
  const { data, error } = await supabase.from("marketing").select("*").order("data", { ascending: true });
  if (error) throw error;
  return (data || []).map(r => ({
    id: r.id, data: r.data, nome: r.nome, tipo: r.tipo, sku: r.sku,
    qtdEnviada: r.qtd_enviada, vendasGeradas: r.vendas_geradas, observacoes: r.observacoes,
    ...auditFields(r as Record<string, unknown>),
  }));
}

export async function insertMarketing(record: Omit<MarketingRecord, "id" | "createdBy" | "updatedBy">): Promise<MarketingRecord> {
  const { data, error } = await supabase.from("marketing").insert({
    data: record.data, nome: record.nome, tipo: record.tipo, sku: record.sku,
    qtd_enviada: record.qtdEnviada, canal_origem: "",
    vendas_geradas: record.vendasGeradas, seguidores_gerados: 0, observacoes: record.observacoes,
  }).select().single();
  if (error) throw error;
  return {
    id: data.id, data: data.data, nome: data.nome, tipo: data.tipo, sku: data.sku,
    qtdEnviada: data.qtd_enviada, vendasGeradas: data.vendas_geradas, observacoes: data.observacoes,
    ...auditFields(data as Record<string, unknown>),
  };
}

export async function updateMarketing(id: string, record: Partial<Omit<MarketingRecord, "id" | "createdBy" | "updatedBy">>): Promise<void> {
  const updateData: Record<string, unknown> = {};
  if (record.data !== undefined) updateData.data = record.data;
  if (record.nome !== undefined) updateData.nome = record.nome;
  if (record.tipo !== undefined) updateData.tipo = record.tipo;
  if (record.sku !== undefined) updateData.sku = record.sku;
  if (record.qtdEnviada !== undefined) updateData.qtd_enviada = record.qtdEnviada;
  if (record.vendasGeradas !== undefined) updateData.vendas_geradas = record.vendasGeradas;
  if (record.observacoes !== undefined) updateData.observacoes = record.observacoes;
  const { error } = await supabase.from("marketing").update(updateData).eq("id", id);
  if (error) throw error;
}

export async function deleteMarketing(id: string): Promise<void> {
  const { error } = await supabase.from("marketing").delete().eq("id", id);
  if (error) throw error;
}

// Financeiro CRUD
export async function fetchFinanceiro(): Promise<FinanceiroRecord[]> {
  const { data, error } = await supabase.from("financeiro").select("*").order("data", { ascending: true });
  if (error) throw error;
  return (data || []).map((r: Record<string, unknown>) => ({
    id: r.id as string, data: r.data as string, tipo: r.tipo as string,
    descricao: r.descricao as string, sku: r.sku as string,
    quantidade: r.quantidade as number, custoUnitario: Number(r.custo_unitario),
    frete: Number(r.frete), custoTotal: Number(r.custo_total),
    precoVenda: Number(r.preco_venda), markup: Number(r.markup),
    receita: Number(r.receita), lucroBruto: Number(r.lucro_bruto),
    observacoes: r.observacoes as string,
    ...auditFields(r),
  }));
}

export async function insertFinanceiro(record: Omit<FinanceiroRecord, "id" | "createdBy" | "updatedBy">): Promise<FinanceiroRecord> {
  const insertData: Record<string, unknown> = {
    data: record.data, tipo: record.tipo, descricao: record.descricao, sku: record.sku,
    quantidade: record.quantidade, custo_unitario: record.custoUnitario,
    frete: record.frete, custo_total: record.custoTotal,
    preco_venda: record.precoVenda, markup: record.markup,
    receita: record.receita, lucro_bruto: record.lucroBruto,
    observacoes: record.observacoes,
  };
  const { data, error } = await supabase.from("financeiro").insert([insertData as never]).select().single();
  if (error) throw error;
  const r = data as Record<string, unknown>;
  return {
    id: r.id as string, data: r.data as string, tipo: r.tipo as string,
    descricao: r.descricao as string, sku: r.sku as string,
    quantidade: r.quantidade as number, custoUnitario: Number(r.custo_unitario),
    frete: Number(r.frete), custoTotal: Number(r.custo_total),
    precoVenda: Number(r.preco_venda), markup: Number(r.markup),
    receita: Number(r.receita), lucroBruto: Number(r.lucro_bruto),
    observacoes: r.observacoes as string,
    ...auditFields(r),
  };
}

export async function updateFinanceiro(id: string, record: Partial<Omit<FinanceiroRecord, "id" | "createdBy" | "updatedBy">>): Promise<void> {
  const updateData: Record<string, unknown> = {};
  if (record.data !== undefined) updateData.data = record.data;
  if (record.tipo !== undefined) updateData.tipo = record.tipo;
  if (record.descricao !== undefined) updateData.descricao = record.descricao;
  if (record.sku !== undefined) updateData.sku = record.sku;
  if (record.quantidade !== undefined) updateData.quantidade = record.quantidade;
  if (record.custoUnitario !== undefined) updateData.custo_unitario = record.custoUnitario;
  if (record.frete !== undefined) updateData.frete = record.frete;
  if (record.custoTotal !== undefined) updateData.custo_total = record.custoTotal;
  if (record.precoVenda !== undefined) updateData.preco_venda = record.precoVenda;
  if (record.markup !== undefined) updateData.markup = record.markup;
  if (record.receita !== undefined) updateData.receita = record.receita;
  if (record.lucroBruto !== undefined) updateData.lucro_bruto = record.lucroBruto;
  if (record.observacoes !== undefined) updateData.observacoes = record.observacoes;
  const { error } = await supabase.from("financeiro").update(updateData).eq("id", id);
  if (error) throw error;
}

export async function deleteFinanceiro(id: string): Promise<void> {
  const { error } = await supabase.from("financeiro").delete().eq("id", id);
  if (error) throw error;
}

export function decomporSku(sku: string, qtd: number): Record<string, number> {
  if (KIT_COMPOSICAO[sku]) {
    const result: Record<string, number> = {};
    for (const [base, n] of Object.entries(KIT_COMPOSICAO[sku])) result[base] = n * qtd;
    return result;
  }
  return { [sku]: qtd };
}

export function getUnidadesReais(sku: string, qtd: number): number {
  return Object.values(decomporSku(sku, qtd)).reduce((acc, n) => acc + n, 0);
}

export function getComposicaoTexto(sku: string): string | null {
  if (!KIT_COMPOSICAO[sku]) return null;
  return `1 ${sku} = ${Object.entries(KIT_COMPOSICAO[sku]).map(([base, qtd]) => `${qtd} ${base}`).join(" + ")}`;
}

export function validarEstoque(sku: string, qtd: number, saldo: Record<string, number>): string | null {
  const faltas = Object.entries(decomporSku(sku, qtd))
    .filter(([base, n]) => (saldo[base] || 0) < n)
    .map(([base, n]) => `${base}: precisa ${n}, tem ${saldo[base] || 0}`);
  return faltas.length ? `Estoque insuficiente:\n${faltas.join("\n")}` : null;
}

export function calcSaldoEstoque(records: EstoqueRecord[]): number {
  return Object.values(calcSaldoPorSku(records)).reduce((acc, n) => acc + n, 0);
}

export function calcSaldoPorSku(records: EstoqueRecord[]): Record<string, number> {
  const saldo: Record<string, number> = Object.fromEntries(SKUS_UNITARIOS.map(sku => [sku, 0]));
  for (const r of records) {
    const unidades = decomporSku(r.sku, r.quantidade);
    for (const [sku, qtd] of Object.entries(unidades)) saldo[sku] = (saldo[sku] || 0) + (r.tipo === "Entrada" ? qtd : -qtd);
  }
  return saldo;
}

// ============================================================
// DESPESAS
// ============================================================
export const CATEGORIAS_DESPESA = ["Fixa", "Variável", "Imposto"] as const;
export const SUBCATEGORIAS_DESPESA: Record<string, string[]> = {
  Fixa: ["Aluguel", "Salários", "Pró-labore", "Software/SaaS", "Contador", "Internet/Telefone", "Energia", "Outros"],
  "Variável": ["Taxa Marketplace", "Gateway Pagamento", "Comissão", "Frete Pago", "Embalagem", "Marketing/Ads", "Insumos", "Outros"],
  Imposto: ["Simples Nacional", "ICMS", "ISS", "MEI/DAS", "INSS", "Outros"],
};
export const FORMAS_PAGAMENTO = ["Pix", "Cartão Crédito", "Cartão Débito", "Boleto", "Dinheiro", "Transferência"] as const;
export const STATUS_DESPESA = ["Pago", "A Pagar"] as const;

export interface DespesaRecord {
  id: string;
  data: string;
  categoria: string;
  subcategoria: string;
  descricao: string;
  valor: number;
  status: string;
  dataVencimento: string | null;
  dataPagamento: string | null;
  formaPagamento: string;
  observacoes: string;
  createdBy: string;
  updatedBy: string;
}

const mapDespesa = (r: Record<string, unknown>): DespesaRecord => ({
  id: r.id as string, data: r.data as string,
  categoria: r.categoria as string, subcategoria: r.subcategoria as string,
  descricao: r.descricao as string, valor: Number(r.valor),
  status: r.status as string,
  dataVencimento: (r.data_vencimento as string) || null,
  dataPagamento: (r.data_pagamento as string) || null,
  formaPagamento: r.forma_pagamento as string,
  observacoes: r.observacoes as string,
  ...auditFields(r),
});

export async function fetchDespesas(): Promise<DespesaRecord[]> {
  const { data, error } = await supabase.from("despesas").select("*").order("data", { ascending: false });
  if (error) throw error;
  return (data || []).map(r => mapDespesa(r as Record<string, unknown>));
}

export async function insertDespesa(r: Omit<DespesaRecord, "id" | "createdBy" | "updatedBy">): Promise<DespesaRecord> {
  const payload = {
    data: r.data, categoria: r.categoria, subcategoria: r.subcategoria,
    descricao: r.descricao, valor: r.valor, status: r.status,
    data_vencimento: r.dataVencimento, data_pagamento: r.dataPagamento,
    forma_pagamento: r.formaPagamento, observacoes: r.observacoes,
  };
  const { data, error } = await supabase.from("despesas").insert([payload as never]).select().single();
  if (error) throw error;
  return mapDespesa(data as Record<string, unknown>);
}

export async function updateDespesa(id: string, r: Partial<Omit<DespesaRecord, "id" | "createdBy" | "updatedBy">>): Promise<void> {
  const u: Record<string, unknown> = {};
  if (r.data !== undefined) u.data = r.data;
  if (r.categoria !== undefined) u.categoria = r.categoria;
  if (r.subcategoria !== undefined) u.subcategoria = r.subcategoria;
  if (r.descricao !== undefined) u.descricao = r.descricao;
  if (r.valor !== undefined) u.valor = r.valor;
  if (r.status !== undefined) u.status = r.status;
  if (r.dataVencimento !== undefined) u.data_vencimento = r.dataVencimento;
  if (r.dataPagamento !== undefined) u.data_pagamento = r.dataPagamento;
  if (r.formaPagamento !== undefined) u.forma_pagamento = r.formaPagamento;
  if (r.observacoes !== undefined) u.observacoes = r.observacoes;
  const { error } = await supabase.from("despesas").update(u).eq("id", id);
  if (error) throw error;
}

export async function deleteDespesa(id: string): Promise<void> {
  const { error } = await supabase.from("despesas").delete().eq("id", id);
  if (error) throw error;
}

// ============================================================
// CLIENTES
// ============================================================
export interface ClienteRecord {
  id: string;
  nome: string;
  cpfCnpj: string;
  email: string;
  telefone: string;
  cidade: string;
  uf: string;
  canalOrigem: string;
  observacoes: string;
  createdBy: string;
  updatedBy: string;
}

const mapCliente = (r: Record<string, unknown>): ClienteRecord => ({
  id: r.id as string, nome: r.nome as string,
  cpfCnpj: r.cpf_cnpj as string, email: r.email as string,
  telefone: r.telefone as string, cidade: r.cidade as string, uf: r.uf as string,
  canalOrigem: r.canal_origem as string, observacoes: r.observacoes as string,
  ...auditFields(r),
});

export async function fetchClientes(): Promise<ClienteRecord[]> {
  const { data, error } = await supabase.from("clientes").select("*").order("nome");
  if (error) throw error;
  return (data || []).map(r => mapCliente(r as Record<string, unknown>));
}

export async function insertCliente(r: Omit<ClienteRecord, "id" | "createdBy" | "updatedBy">): Promise<ClienteRecord> {
  const payload = {
    nome: r.nome, cpf_cnpj: r.cpfCnpj, email: r.email, telefone: r.telefone,
    cidade: r.cidade, uf: r.uf, canal_origem: r.canalOrigem, observacoes: r.observacoes,
  };
  const { data, error } = await supabase.from("clientes").insert([payload as never]).select().single();
  if (error) throw error;
  return mapCliente(data as Record<string, unknown>);
}

export async function updateCliente(id: string, r: Partial<Omit<ClienteRecord, "id" | "createdBy" | "updatedBy">>): Promise<void> {
  const u: Record<string, unknown> = {};
  if (r.nome !== undefined) u.nome = r.nome;
  if (r.cpfCnpj !== undefined) u.cpf_cnpj = r.cpfCnpj;
  if (r.email !== undefined) u.email = r.email;
  if (r.telefone !== undefined) u.telefone = r.telefone;
  if (r.cidade !== undefined) u.cidade = r.cidade;
  if (r.uf !== undefined) u.uf = r.uf;
  if (r.canalOrigem !== undefined) u.canal_origem = r.canalOrigem;
  if (r.observacoes !== undefined) u.observacoes = r.observacoes;
  const { error } = await supabase.from("clientes").update(u).eq("id", id);
  if (error) throw error;
}

export async function deleteCliente(id: string): Promise<void> {
  const { error } = await supabase.from("clientes").delete().eq("id", id);
  if (error) throw error;
}

// ============================================================
// CONTAS A RECEBER
// ============================================================
export const STATUS_CONTA_RECEBER = ["Pendente", "Recebido"] as const;

export interface ContaReceberRecord {
  id: string;
  data: string;
  descricao: string;
  clienteId: string | null;
  clienteNome: string;
  valor: number;
  vencimento: string | null;
  status: string;
  dataRecebimento: string | null;
  observacoes: string;
  createdBy: string;
  updatedBy: string;
}

const mapConta = (r: Record<string, unknown>): ContaReceberRecord => ({
  id: r.id as string, data: r.data as string,
  descricao: r.descricao as string,
  clienteId: (r.cliente_id as string) || null,
  clienteNome: r.cliente_nome as string, valor: Number(r.valor),
  vencimento: (r.vencimento as string) || null,
  status: r.status as string,
  dataRecebimento: (r.data_recebimento as string) || null,
  observacoes: r.observacoes as string,
  ...auditFields(r),
});

export async function fetchContasReceber(): Promise<ContaReceberRecord[]> {
  const { data, error } = await supabase.from("contas_receber").select("*").order("vencimento", { ascending: true });
  if (error) throw error;
  return (data || []).map(r => mapConta(r as Record<string, unknown>));
}

export async function insertContaReceber(r: Omit<ContaReceberRecord, "id" | "createdBy" | "updatedBy">): Promise<ContaReceberRecord> {
  const payload = {
    data: r.data, descricao: r.descricao, cliente_id: r.clienteId,
    cliente_nome: r.clienteNome, valor: r.valor, vencimento: r.vencimento,
    status: r.status, data_recebimento: r.dataRecebimento, observacoes: r.observacoes,
  };
  const { data, error } = await supabase.from("contas_receber").insert([payload as never]).select().single();
  if (error) throw error;
  return mapConta(data as Record<string, unknown>);
}

export async function updateContaReceber(id: string, r: Partial<Omit<ContaReceberRecord, "id" | "createdBy" | "updatedBy">>): Promise<void> {
  const u: Record<string, unknown> = {};
  if (r.data !== undefined) u.data = r.data;
  if (r.descricao !== undefined) u.descricao = r.descricao;
  if (r.clienteId !== undefined) u.cliente_id = r.clienteId;
  if (r.clienteNome !== undefined) u.cliente_nome = r.clienteNome;
  if (r.valor !== undefined) u.valor = r.valor;
  if (r.vencimento !== undefined) u.vencimento = r.vencimento;
  if (r.status !== undefined) u.status = r.status;
  if (r.dataRecebimento !== undefined) u.data_recebimento = r.dataRecebimento;
  if (r.observacoes !== undefined) u.observacoes = r.observacoes;
  const { error } = await supabase.from("contas_receber").update(u).eq("id", id);
  if (error) throw error;
}

export async function deleteContaReceber(id: string): Promise<void> {
  const { error } = await supabase.from("contas_receber").delete().eq("id", id);
  if (error) throw error;
}

// ============================================================
// DRE — Demonstração do Resultado do Exercício (mensal)
// ============================================================
export interface DRERow {
  receitaBruta: number;
  impostos: number;
  receitaLiquida: number;
  cmv: number;
  lucroBruto: number;
  despesasVariaveis: number;
  despesasFixas: number;
  ebitda: number;
  margemEbitda: number;
}

export function calcDRE(
  vendas: VendaRecord[],
  despesas: DespesaRecord[],
  mes: string, // formato YYYY-MM
): DRERow {
  const filtroMes = (d: string) => d.startsWith(mes);
  const vMes = vendas.filter(v => filtroMes(v.data));
  const dMes = despesas.filter(d => filtroMes(d.data));
  const receitaBruta = vMes.reduce((a, v) => a + v.precoTotal, 0);
  const cmv = vMes.reduce((a, v) => a + getUnidadesReais(v.sku, v.quantidade) * CONFIG.custoUnitario, 0);
  const impostos = dMes.filter(d => d.categoria === "Imposto").reduce((a, d) => a + d.valor, 0);
  const despesasVariaveis = dMes.filter(d => d.categoria === "Variável").reduce((a, d) => a + d.valor, 0);
  const despesasFixas = dMes.filter(d => d.categoria === "Fixa").reduce((a, d) => a + d.valor, 0);
  const receitaLiquida = receitaBruta - impostos;
  const lucroBruto = receitaLiquida - cmv;
  const ebitda = lucroBruto - despesasVariaveis - despesasFixas;
  const margemEbitda = receitaBruta ? (ebitda / receitaBruta) * 100 : 0;
  return { receitaBruta, impostos, receitaLiquida, cmv, lucroBruto, despesasVariaveis, despesasFixas, ebitda, margemEbitda };
}

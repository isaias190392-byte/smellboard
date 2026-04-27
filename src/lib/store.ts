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
  }));
}

export async function insertFinanceiro(record: Omit<FinanceiroRecord, "id">): Promise<FinanceiroRecord> {
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
  };
}

export async function updateFinanceiro(id: string, record: Partial<Omit<FinanceiroRecord, "id">>): Promise<void> {
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

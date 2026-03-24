// Shared data store (Supabase-backed)
import { supabase } from "@/integrations/supabase/client";

export const SKUS = [
  "INTENSE", "TEXAS", "SUNSET", "GARDEN", "BRISE",
  "KIT VARIADO 12",
  "KIT 12 INTENSE", "KIT 12 BRISE", "KIT 12 GARDEN", "KIT 12 SUNSET", "KIT 12 TEXAS",
  "KIT 5 INTENSE", "KIT 5 BRISE", "KIT 5 GARDEN", "KIT 5 SUNSET", "KIT 5 TEXAS",
] as const;

export const SKU_COLORS: Record<string, string> = {
  INTENSE: "#4F028B",
  TEXAS: "#DC2626",
  SUNSET: "#EAB308",
  GARDEN: "#16A34A",
  BRISE: "#2563EB",
  "KIT VARIADO 12": "#6B7280",
  "KIT 12 INTENSE": "#4F028B",
  "KIT 12 BRISE": "#2563EB",
  "KIT 12 GARDEN": "#16A34A",
  "KIT 12 SUNSET": "#EAB308",
  "KIT 12 TEXAS": "#DC2626",
  "KIT 5 INTENSE": "#7C3AED",
  "KIT 5 BRISE": "#3B82F6",
  "KIT 5 GARDEN": "#22C55E",
  "KIT 5 SUNSET": "#F59E0B",
  "KIT 5 TEXAS": "#EF4444",
};

// Composição dos kits em unidades individuais
export const KIT_COMPOSICAO: Record<string, Record<string, number>> = {
  "KIT VARIADO 12": { BRISE: 2, INTENSE: 2, TEXAS: 3, SUNSET: 2, GARDEN: 3 },
  "KIT 12 INTENSE": { INTENSE: 12 },
  "KIT 12 BRISE": { BRISE: 12 },
  "KIT 12 GARDEN": { GARDEN: 12 },
  "KIT 12 SUNSET": { SUNSET: 12 },
  "KIT 12 TEXAS": { TEXAS: 12 },
  "KIT 5 INTENSE": { INTENSE: 5 },
  "KIT 5 BRISE": { BRISE: 5 },
  "KIT 5 GARDEN": { GARDEN: 5 },
  "KIT 5 SUNSET": { SUNSET: 5 },
  "KIT 5 TEXAS": { TEXAS: 5 },
};

// SKUs unitários (fragrâncias base)
export const SKUS_UNITARIOS = ["INTENSE", "TEXAS", "SUNSET", "GARDEN", "BRISE"] as const;

export const CANAIS = ["Mercado Livre", "Shopee", "Direto (WhatsApp/Instagram)", "B2B"] as const;
export const CATEGORIAS = ["Venda", "Doação", "Marketing", "Teste", "Perda", "Compra"] as const;
export const FORMATOS = ["Unitário", "Kit 5", "Kit 12"] as const;
export const TIPOS_ESTOQUE = ["Entrada", "Saída"] as const;
export const TIPOS_MARKETING = ["UGC", "Influencer", "Doação", "Evento"] as const;

// Multiplicador por formato
export const FORMATO_MULTIPLICADOR: Record<string, number> = {
  "Unitário": 1,
  "Kit 5": 5,
  "Kit 12": 12,
};

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
}

export interface VendaRecord {
  id: string;
  data: string;
  canal: string;
  sku: string;
  formato: string;
  quantidade: number;
  precoUnitario: number;
}

export interface MarketingRecord {
  id: string;
  data: string;
  nome: string;
  tipo: string;
  sku: string;
  qtdEnviada: number;
  canalOrigem: string;
  vendasGeradas: number;
  seguidoresGerados: number;
  observacoes: string;
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
}

// --- Supabase CRUD ---

export async function fetchEstoque(): Promise<EstoqueRecord[]> {
  const { data, error } = await supabase.from("estoque").select("*").order("data", { ascending: true });
  if (error) throw error;
  return (data || []).map(r => ({
    id: r.id, data: r.data, tipo: r.tipo as "Entrada" | "Saída",
    categoria: r.categoria, canal: r.canal, sku: r.sku, quantidade: r.quantidade,
    observacoes: (r as Record<string, unknown>).observacoes as string || "",
  }));
}

export async function insertEstoque(record: Omit<EstoqueRecord, "id">): Promise<EstoqueRecord> {
  const insertData: Record<string, unknown> = {
    data: record.data, tipo: record.tipo, categoria: record.categoria,
    canal: record.canal, sku: record.sku, quantidade: record.quantidade,
    observacoes: record.observacoes || "",
  };
  const { data, error } = await supabase.from("estoque").insert([insertData as never]).select().single();
  if (error) throw error;
  return { id: data.id, data: data.data, tipo: data.tipo as "Entrada" | "Saída", categoria: data.categoria, canal: data.canal, sku: data.sku, quantidade: data.quantidade, observacoes: (data as Record<string, unknown>).observacoes as string || "" };
}

export async function updateEstoque(id: string, record: Partial<Omit<EstoqueRecord, "id">>): Promise<void> {
  const { error } = await supabase.from("estoque").update(record as Record<string, unknown>).eq("id", id);
  if (error) throw error;
}

export async function deleteEstoque(id: string): Promise<void> {
  const { error } = await supabase.from("estoque").delete().eq("id", id);
  if (error) throw error;
}

export async function fetchVendas(): Promise<VendaRecord[]> {
  const { data, error } = await supabase.from("vendas").select("*").order("data", { ascending: true });
  if (error) throw error;
  return (data || []).map(r => ({
    id: r.id, data: r.data, canal: r.canal, sku: r.sku,
    formato: r.formato, quantidade: r.quantidade, precoUnitario: Number(r.preco_unitario),
  }));
}

export async function insertVenda(record: Omit<VendaRecord, "id">): Promise<VendaRecord> {
  const { data, error } = await supabase.from("vendas").insert({
    data: record.data, canal: record.canal, sku: record.sku,
    formato: record.formato, quantidade: record.quantidade, preco_unitario: record.precoUnitario,
  }).select().single();
  if (error) throw error;
  return { id: data.id, data: data.data, canal: data.canal, sku: data.sku, formato: data.formato, quantidade: data.quantidade, precoUnitario: Number(data.preco_unitario) };
}

export async function updateVenda(id: string, record: Partial<Omit<VendaRecord, "id">>): Promise<void> {
  const updateData: Record<string, unknown> = {};
  if (record.data !== undefined) updateData.data = record.data;
  if (record.canal !== undefined) updateData.canal = record.canal;
  if (record.sku !== undefined) updateData.sku = record.sku;
  if (record.formato !== undefined) updateData.formato = record.formato;
  if (record.quantidade !== undefined) updateData.quantidade = record.quantidade;
  if (record.precoUnitario !== undefined) updateData.preco_unitario = record.precoUnitario;
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
    qtdEnviada: r.qtd_enviada, canalOrigem: r.canal_origem,
    vendasGeradas: r.vendas_geradas, seguidoresGerados: r.seguidores_gerados, observacoes: r.observacoes,
  }));
}

export async function insertMarketing(record: Omit<MarketingRecord, "id">): Promise<MarketingRecord> {
  const { data, error } = await supabase.from("marketing").insert({
    data: record.data, nome: record.nome, tipo: record.tipo, sku: record.sku,
    qtd_enviada: record.qtdEnviada, canal_origem: record.canalOrigem,
    vendas_geradas: record.vendasGeradas, seguidores_gerados: record.seguidoresGerados, observacoes: record.observacoes,
  }).select().single();
  if (error) throw error;
  return {
    id: data.id, data: data.data, nome: data.nome, tipo: data.tipo, sku: data.sku,
    qtdEnviada: data.qtd_enviada, canalOrigem: data.canal_origem,
    vendasGeradas: data.vendas_geradas, seguidoresGerados: data.seguidores_gerados, observacoes: data.observacoes,
  };
}

export async function updateMarketing(id: string, record: Partial<Omit<MarketingRecord, "id">>): Promise<void> {
  const updateData: Record<string, unknown> = {};
  if (record.data !== undefined) updateData.data = record.data;
  if (record.nome !== undefined) updateData.nome = record.nome;
  if (record.tipo !== undefined) updateData.tipo = record.tipo;
  if (record.sku !== undefined) updateData.sku = record.sku;
  if (record.qtdEnviada !== undefined) updateData.qtd_enviada = record.qtdEnviada;
  if (record.canalOrigem !== undefined) updateData.canal_origem = record.canalOrigem;
  if (record.vendasGeradas !== undefined) updateData.vendas_geradas = record.vendasGeradas;
  if (record.seguidoresGerados !== undefined) updateData.seguidores_gerados = record.seguidoresGerados;
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
  const { data, error } = await supabase.from("financeiro").insert({
    data: record.data, tipo: record.tipo, descricao: record.descricao, sku: record.sku,
    quantidade: record.quantidade, custo_unitario: record.custoUnitario,
    frete: record.frete, custo_total: record.custoTotal,
    preco_venda: record.precoVenda, markup: record.markup,
    receita: record.receita, lucro_bruto: record.lucroBruto,
    observacoes: record.observacoes,
  } as Record<string, unknown>).select().single();
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

export function calcSaldoEstoque(records: EstoqueRecord[]): number {
  return records.reduce((acc, r) => acc + (r.tipo === "Entrada" ? r.quantidade : -r.quantidade), 0);
}

export function calcSaldoPorSku(records: EstoqueRecord[]): Record<string, number> {
  const saldo: Record<string, number> = {};
  for (const r of records) {
    if (!saldo[r.sku]) saldo[r.sku] = 0;
    saldo[r.sku] += r.tipo === "Entrada" ? r.quantidade : -r.quantidade;
  }
  return saldo;
}

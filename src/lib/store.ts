// Shared data store (Supabase-backed)
import { supabase } from "@/integrations/supabase/client";

export const SKUS = ["INTENSE", "TEXAS", "SUNSET", "GARDEN", "BRISE"] as const;
export const SKU_COLORS: Record<string, string> = {
  INTENSE: "#4F028B",
  TEXAS: "#DC2626",
  SUNSET: "#EAB308",
  GARDEN: "#16A34A",
  BRISE: "#2563EB",
};
export const CANAIS = ["Mercado Livre", "Shopee", "Direto (WhatsApp/Instagram)", "B2B (Kit 12)"] as const;
export const CATEGORIAS = ["Venda", "Doação", "Marketing", "Teste", "Perda"] as const;
export const FORMATOS = ["Unitário", "Kit 5", "Kit 12"] as const;
export const TIPOS_ESTOQUE = ["Entrada", "Saída"] as const;
export const TIPOS_MARKETING = ["UGC", "Influencer", "Doação"] as const;

export const CONFIG = {
  custoUnitario: 5.0,
  marketingPct: 0.10,
  precos: {
    "Mercado Livre": 29.90,
    "Shopee": 24.90,
    "Direto (WhatsApp/Instagram)": 27.90,
    "B2B (Kit 12)": 19.90,
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

// --- Supabase CRUD ---

export async function fetchEstoque(): Promise<EstoqueRecord[]> {
  const { data, error } = await supabase.from("estoque").select("*").order("data", { ascending: true });
  if (error) throw error;
  return (data || []).map(r => ({
    id: r.id, data: r.data, tipo: r.tipo as "Entrada" | "Saída",
    categoria: r.categoria, canal: r.canal, sku: r.sku, quantidade: r.quantidade,
  }));
}

export async function insertEstoque(record: Omit<EstoqueRecord, "id">): Promise<EstoqueRecord> {
  const { data, error } = await supabase.from("estoque").insert({
    data: record.data, tipo: record.tipo, categoria: record.categoria,
    canal: record.canal, sku: record.sku, quantidade: record.quantidade,
  }).select().single();
  if (error) throw error;
  return { id: data.id, data: data.data, tipo: data.tipo as "Entrada" | "Saída", categoria: data.categoria, canal: data.canal, sku: data.sku, quantidade: data.quantidade };
}

export async function updateEstoque(id: string, record: Partial<Omit<EstoqueRecord, "id">>): Promise<void> {
  const { error } = await supabase.from("estoque").update(record).eq("id", id);
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

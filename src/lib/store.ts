// Shared data store (localStorage-backed)

export const SKUS = ["Lavanda Premium", "Carro Novo", "Brisa do Mar", "Couro Elegante", "Floresta Tropical"] as const;
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

function loadData<T>(key: string, fallback: T[]): T[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}

function saveData<T>(key: string, data: T[]) {
  localStorage.setItem(key, JSON.stringify(data));
}

// Sample data
const sampleEstoque: EstoqueRecord[] = [
  { id: "e1", data: "2025-01-15", tipo: "Entrada", categoria: "Venda", canal: "", sku: "Lavanda Premium", quantidade: 200 },
  { id: "e2", data: "2025-01-15", tipo: "Entrada", categoria: "Venda", canal: "", sku: "Carro Novo", quantidade: 200 },
  { id: "e3", data: "2025-01-15", tipo: "Entrada", categoria: "Venda", canal: "", sku: "Brisa do Mar", quantidade: 150 },
  { id: "e4", data: "2025-01-15", tipo: "Entrada", categoria: "Venda", canal: "", sku: "Couro Elegante", quantidade: 150 },
  { id: "e5", data: "2025-01-15", tipo: "Entrada", categoria: "Venda", canal: "", sku: "Floresta Tropical", quantidade: 100 },
  { id: "e6", data: "2025-01-20", tipo: "Saída", categoria: "Venda", canal: "Mercado Livre", sku: "Lavanda Premium", quantidade: 25 },
  { id: "e7", data: "2025-01-22", tipo: "Saída", categoria: "Venda", canal: "Shopee", sku: "Carro Novo", quantidade: 18 },
  { id: "e8", data: "2025-01-25", tipo: "Saída", categoria: "Marketing", canal: "Direto (WhatsApp/Instagram)", sku: "Brisa do Mar", quantidade: 10 },
  { id: "e9", data: "2025-02-01", tipo: "Saída", categoria: "Doação", canal: "", sku: "Couro Elegante", quantidade: 5 },
  { id: "e10", data: "2025-02-05", tipo: "Saída", categoria: "Venda", canal: "B2B (Kit 12)", sku: "Floresta Tropical", quantidade: 36 },
];

const sampleVendas: VendaRecord[] = [
  { id: "v1", data: "2025-01-20", canal: "Mercado Livre", sku: "Lavanda Premium", formato: "Unitário", quantidade: 25, precoUnitario: 29.90 },
  { id: "v2", data: "2025-01-22", canal: "Shopee", sku: "Carro Novo", formato: "Unitário", quantidade: 18, precoUnitario: 24.90 },
  { id: "v3", data: "2025-01-28", canal: "Direto (WhatsApp/Instagram)", sku: "Brisa do Mar", formato: "Kit 5", quantidade: 15, precoUnitario: 25.00 },
  { id: "v4", data: "2025-02-01", canal: "B2B (Kit 12)", sku: "Floresta Tropical", formato: "Kit 12", quantidade: 36, precoUnitario: 19.90 },
  { id: "v5", data: "2025-02-10", canal: "Mercado Livre", sku: "Couro Elegante", formato: "Unitário", quantidade: 12, precoUnitario: 29.90 },
];

const sampleMarketing: MarketingRecord[] = [
  { id: "m1", data: "2025-01-25", nome: "@auto_clean_br", tipo: "Influencer", sku: "Brisa do Mar", qtdEnviada: 5, canalOrigem: "Instagram", vendasGeradas: 12, seguidoresGerados: 320, observacoes: "Stories + Reels" },
  { id: "m2", data: "2025-02-01", nome: "@detailer_pro", tipo: "UGC", sku: "Lavanda Premium", qtdEnviada: 3, canalOrigem: "TikTok", vendasGeradas: 8, seguidoresGerados: 150, observacoes: "Vídeo review" },
  { id: "m3", data: "2025-02-05", nome: "Lava Rápido Central", tipo: "Doação", sku: "Couro Elegante", qtdEnviada: 5, canalOrigem: "WhatsApp", vendasGeradas: 3, seguidoresGerados: 0, observacoes: "Parceria local" },
];

export function getEstoque(): EstoqueRecord[] { return loadData("smellgo_estoque", sampleEstoque); }
export function saveEstoque(data: EstoqueRecord[]) { saveData("smellgo_estoque", data); }

export function getVendas(): VendaRecord[] { return loadData("smellgo_vendas", sampleVendas); }
export function saveVendas(data: VendaRecord[]) { saveData("smellgo_vendas", data); }

export function getMarketing(): MarketingRecord[] { return loadData("smellgo_marketing", sampleMarketing); }
export function saveMarketing(data: MarketingRecord[]) { saveData("smellgo_marketing", data); }

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

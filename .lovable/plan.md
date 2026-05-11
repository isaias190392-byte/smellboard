## Objetivo
Adicionar controle financeiro real para o SmellGo: despesas fixas, despesas variáveis, impostos, fluxo de caixa, contas a pagar/receber, clientes (CRM básico) e DRE mensal.

## Novas tabelas (Lovable Cloud)

1. **despesas** — gastos da empresa
   - data, categoria (Fixa/Variável/Imposto), subcategoria (aluguel, salário, software, taxa marketplace, gateway, comissão, frete pago, Simples Nacional, etc.), descrição, valor, status (Pago/A Pagar), data_vencimento, data_pagamento, forma_pagamento, observações.

2. **clientes** — CRM básico
   - nome, cpf_cnpj, email, telefone, cidade/UF, canal_origem, observações. Vendas ganham coluna opcional `cliente_id`.

3. **contas_receber** — recebíveis pendentes
   - data, descrição, cliente, valor, vencimento, status (Pendente/Recebido), data_recebimento, venda_id (opcional).

Todas com RLS igual às outras (leitura para autenticados, escrita para Diretoria/Comercial) e auditoria (created_by/updated_by) via trigger `set_audit_fields`.

## Novas páginas

1. **/despesas** — `DespesasPage.tsx`
   - Formulário de cadastro + tabela com filtros por mês e categoria.
   - Cards: Total Fixas, Total Variáveis, Total Impostos, Total do Mês.

2. **/financeiro** (expandir existente) — adicionar abas:
   - **Compras** (atual)
   - **Contas a Pagar/Receber** — listas com vencimentos, marcar como pago/recebido.
   - **Fluxo de Caixa** — entradas (vendas pagas + recebimentos) vs saídas (despesas pagas + compras) por dia/mês, saldo acumulado.
   - **DRE Mensal** — tabela:
     ```
     Receita Bruta de Vendas
     (-) Impostos sobre Vendas
     = Receita Líquida
     (-) CMV (custo dos produtos vendidos)
     = Lucro Bruto
     (-) Despesas Variáveis (taxas, comissões, frete)
     (-) Despesas Fixas (aluguel, salários, software)
     = EBITDA
     Margem EBITDA %
     ```
     Seletor de mês, comparativo com mês anterior.

3. **/clientes** — `ClientesPage.tsx`
   - Cadastro + listagem. Mostra total de compras, ticket médio, última compra (LTV básico).

## Atualizações em páginas existentes

- **Dashboard**: adicionar KPIs de Despesas Totais (mês), EBITDA (mês), Margem EBITDA.
- **Vendas**: campo opcional para vincular cliente.
- **Sidebar/Index**: novos cards "Despesas", "Clientes" e link DRE.

## Detalhes técnicos

- `src/lib/store.ts`: novos tipos `DespesaRecord`, `ClienteRecord`, `ContaReceberRecord` e funções `fetchDespesas`, `addDespesa`, etc.
- Cálculos do DRE usam mesmas funções de receita/CMV existentes em `calcSaldo`/`getUnidadesReais`, somando despesas filtradas por mês e categoria.
- Categorias e subcategorias em constantes (`CATEGORIAS_DESPESA`, `FORMAS_PAGAMENTO`).
- Sem mudanças visuais no design system (cores SmellGo: roxo #4F028B, preto, branco).

## Fora do escopo (fica para depois, se quiser)
Custo médio ponderado, validade/lote, devoluções, metas, conciliação bancária.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      clientes: {
        Row: {
          canal_origem: string
          cidade: string
          cpf_cnpj: string
          created_at: string
          created_by: string
          email: string
          id: string
          nome: string
          observacoes: string
          telefone: string
          uf: string
          updated_at: string
          updated_by: string
        }
        Insert: {
          canal_origem?: string
          cidade?: string
          cpf_cnpj?: string
          created_at?: string
          created_by?: string
          email?: string
          id?: string
          nome: string
          observacoes?: string
          telefone?: string
          uf?: string
          updated_at?: string
          updated_by?: string
        }
        Update: {
          canal_origem?: string
          cidade?: string
          cpf_cnpj?: string
          created_at?: string
          created_by?: string
          email?: string
          id?: string
          nome?: string
          observacoes?: string
          telefone?: string
          uf?: string
          updated_at?: string
          updated_by?: string
        }
        Relationships: []
      }
      contas_receber: {
        Row: {
          cliente_id: string | null
          cliente_nome: string
          created_at: string
          created_by: string
          data: string
          data_recebimento: string | null
          descricao: string
          id: string
          observacoes: string
          status: string
          updated_at: string
          updated_by: string
          valor: number
          vencimento: string | null
        }
        Insert: {
          cliente_id?: string | null
          cliente_nome?: string
          created_at?: string
          created_by?: string
          data: string
          data_recebimento?: string | null
          descricao?: string
          id?: string
          observacoes?: string
          status?: string
          updated_at?: string
          updated_by?: string
          valor?: number
          vencimento?: string | null
        }
        Update: {
          cliente_id?: string | null
          cliente_nome?: string
          created_at?: string
          created_by?: string
          data?: string
          data_recebimento?: string | null
          descricao?: string
          id?: string
          observacoes?: string
          status?: string
          updated_at?: string
          updated_by?: string
          valor?: number
          vencimento?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contas_receber_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      despesas: {
        Row: {
          categoria: string
          created_at: string
          created_by: string
          data: string
          data_pagamento: string | null
          data_vencimento: string | null
          descricao: string
          forma_pagamento: string
          id: string
          observacoes: string
          status: string
          subcategoria: string
          updated_at: string
          updated_by: string
          valor: number
        }
        Insert: {
          categoria: string
          created_at?: string
          created_by?: string
          data: string
          data_pagamento?: string | null
          data_vencimento?: string | null
          descricao?: string
          forma_pagamento?: string
          id?: string
          observacoes?: string
          status?: string
          subcategoria?: string
          updated_at?: string
          updated_by?: string
          valor?: number
        }
        Update: {
          categoria?: string
          created_at?: string
          created_by?: string
          data?: string
          data_pagamento?: string | null
          data_vencimento?: string | null
          descricao?: string
          forma_pagamento?: string
          id?: string
          observacoes?: string
          status?: string
          subcategoria?: string
          updated_at?: string
          updated_by?: string
          valor?: number
        }
        Relationships: []
      }
      estoque: {
        Row: {
          canal: string
          categoria: string
          created_at: string
          created_by: string
          data: string
          id: string
          observacoes: string
          quantidade: number
          sku: string
          tipo: string
          updated_at: string
          updated_by: string
        }
        Insert: {
          canal?: string
          categoria: string
          created_at?: string
          created_by?: string
          data: string
          id?: string
          observacoes?: string
          quantidade: number
          sku: string
          tipo: string
          updated_at?: string
          updated_by?: string
        }
        Update: {
          canal?: string
          categoria?: string
          created_at?: string
          created_by?: string
          data?: string
          id?: string
          observacoes?: string
          quantidade?: number
          sku?: string
          tipo?: string
          updated_at?: string
          updated_by?: string
        }
        Relationships: []
      }
      financeiro: {
        Row: {
          created_at: string
          created_by: string
          custo_total: number
          custo_unitario: number
          data: string
          descricao: string
          frete: number
          id: string
          lucro_bruto: number
          markup: number
          observacoes: string
          preco_venda: number
          quantidade: number
          receita: number
          sku: string
          tipo: string
          updated_at: string
          updated_by: string
        }
        Insert: {
          created_at?: string
          created_by?: string
          custo_total?: number
          custo_unitario?: number
          data: string
          descricao?: string
          frete?: number
          id?: string
          lucro_bruto?: number
          markup?: number
          observacoes?: string
          preco_venda?: number
          quantidade?: number
          receita?: number
          sku?: string
          tipo?: string
          updated_at?: string
          updated_by?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          custo_total?: number
          custo_unitario?: number
          data?: string
          descricao?: string
          frete?: number
          id?: string
          lucro_bruto?: number
          markup?: number
          observacoes?: string
          preco_venda?: number
          quantidade?: number
          receita?: number
          sku?: string
          tipo?: string
          updated_at?: string
          updated_by?: string
        }
        Relationships: []
      }
      marketing: {
        Row: {
          canal_origem: string
          created_at: string
          created_by: string
          data: string
          id: string
          nome: string
          observacoes: string
          qtd_enviada: number
          seguidores_gerados: number
          sku: string
          tipo: string
          updated_at: string
          updated_by: string
          vendas_geradas: number
        }
        Insert: {
          canal_origem?: string
          created_at?: string
          created_by?: string
          data: string
          id?: string
          nome: string
          observacoes?: string
          qtd_enviada: number
          seguidores_gerados?: number
          sku: string
          tipo: string
          updated_at?: string
          updated_by?: string
          vendas_geradas?: number
        }
        Update: {
          canal_origem?: string
          created_at?: string
          created_by?: string
          data?: string
          id?: string
          nome?: string
          observacoes?: string
          qtd_enviada?: number
          seguidores_gerados?: number
          sku?: string
          tipo?: string
          updated_at?: string
          updated_by?: string
          vendas_geradas?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vendas: {
        Row: {
          canal: string
          cliente_id: string | null
          created_at: string
          created_by: string
          data: string
          id: string
          preco_unitario: number
          quantidade: number
          sku: string
          updated_at: string
          updated_by: string
        }
        Insert: {
          canal: string
          cliente_id?: string | null
          created_at?: string
          created_by?: string
          data: string
          id?: string
          preco_unitario: number
          quantidade: number
          sku: string
          updated_at?: string
          updated_by?: string
        }
        Update: {
          canal?: string
          cliente_id?: string | null
          created_at?: string
          created_by?: string
          data?: string
          id?: string
          preco_unitario?: number
          quantidade?: number
          sku?: string
          updated_at?: string
          updated_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_profile_name: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "diretoria" | "comercial"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["diretoria", "comercial"],
    },
  },
} as const

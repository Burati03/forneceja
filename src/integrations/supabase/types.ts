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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      avaliacoes: {
        Row: {
          comentario: string | null
          criado_em: string
          empresario_id: string
          fornecedor_id: string
          id: number
          nota: number
          pedido_id: number
        }
        Insert: {
          comentario?: string | null
          criado_em?: string
          empresario_id: string
          fornecedor_id: string
          id?: number
          nota: number
          pedido_id: number
        }
        Update: {
          comentario?: string | null
          criado_em?: string
          empresario_id?: string
          fornecedor_id?: string
          id?: number
          nota?: number
          pedido_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "avaliacoes_empresario_id_fkey"
            columns: ["empresario_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "avaliacoes_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "avaliacoes_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: true
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
        ]
      }
      buscas: {
        Row: {
          criado_em: string
          id: number
          termo: string
          user_id: string
        }
        Insert: {
          criado_em?: string
          id?: never
          termo: string
          user_id?: string
        }
        Update: {
          criado_em?: string
          id?: never
          termo?: string
          user_id?: string
        }
        Relationships: []
      }
      favoritos: {
        Row: {
          produto_id: number
          user_id: string
        }
        Insert: {
          produto_id: number
          user_id: string
        }
        Update: {
          produto_id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favoritos_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      mensagens: {
        Row: {
          criado_em: string
          de_id: string
          id: number
          para_id: string
          texto: string
        }
        Insert: {
          criado_em?: string
          de_id: string
          id?: number
          para_id: string
          texto: string
        }
        Update: {
          criado_em?: string
          de_id?: string
          id?: number
          para_id?: string
          texto?: string
        }
        Relationships: [
          {
            foreignKeyName: "mensagens_de_id_fkey"
            columns: ["de_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mensagens_para_id_fkey"
            columns: ["para_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pedidos: {
        Row: {
          criado_em: string
          empresario_id: string
          id: number
          produto_id: number
          qtd: number
          status: string
        }
        Insert: {
          criado_em?: string
          empresario_id: string
          id?: number
          produto_id: number
          qtd: number
          status?: string
        }
        Update: {
          criado_em?: string
          empresario_id?: string
          id?: number
          produto_id?: number
          qtd?: number
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "pedidos_empresario_id_fkey"
            columns: ["empresario_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedidos_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      produtos: {
        Row: {
          categoria: string | null
          criado_em: string
          descricao: string | null
          fornecedor_id: string
          icone: string
          id: number
          nome: string
          preco: number
          qtd_min: number
          unidade: string
          views: number
        }
        Insert: {
          categoria?: string | null
          criado_em?: string
          descricao?: string | null
          fornecedor_id: string
          icone?: string
          id?: number
          nome: string
          preco: number
          qtd_min?: number
          unidade?: string
          views?: number
        }
        Update: {
          categoria?: string | null
          criado_em?: string
          descricao?: string | null
          fornecedor_id?: string
          icone?: string
          id?: number
          nome?: string
          preco?: number
          qtd_min?: number
          unidade?: string
          views?: number
        }
        Relationships: [
          {
            foreignKeyName: "produtos_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          atuacao: string | null
          avatar_path: string | null
          categoria: string | null
          cidade: string | null
          criado_em: string
          descricao: string | null
          email: string | null
          empresa: string
          id: string
          is_seed: boolean
          tipo: string
        }
        Insert: {
          atuacao?: string | null
          avatar_path?: string | null
          categoria?: string | null
          cidade?: string | null
          criado_em?: string
          descricao?: string | null
          email?: string | null
          empresa: string
          id: string
          is_seed?: boolean
          tipo: string
        }
        Update: {
          atuacao?: string | null
          avatar_path?: string | null
          categoria?: string | null
          cidade?: string | null
          criado_em?: string
          descricao?: string | null
          email?: string | null
          empresa?: string
          id?: string
          is_seed?: boolean
          tipo?: string
        }
        Relationships: []
      }
      profiles_private: {
        Row: {
          documento: string | null
          documento_tipo: string
          id: string
          telefone: string | null
        }
        Insert: {
          documento?: string | null
          documento_tipo?: string
          id: string
          telefone?: string | null
        }
        Update: {
          documento?: string | null
          documento_tipo?: string
          id?: string
          telefone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_private_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      meu_tipo: { Args: never; Returns: string }
      mudar_status: {
        Args: { _id: number; _status: string }
        Returns: undefined
      }
      ver_produto: { Args: { _id: number }; Returns: undefined }
    }
    Enums: {
      [_ in never]: never
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

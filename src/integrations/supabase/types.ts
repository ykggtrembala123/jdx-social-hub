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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      admin_config: {
        Row: {
          created_at: string
          discord_id: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          discord_id: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          discord_id?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      affiliates: {
        Row: {
          cascade_commission: number
          cascade_earnings: number
          code: string
          commission: number
          created_at: string
          discord_user_id: string | null
          discord_webhook_url: string | null
          id: string
          is_active: boolean
          name: string
          pending_earnings: number
          referrals_count: number
          referred_by: string | null
          tier: Database["public"]["Enums"]["affiliate_tier"]
          total_earnings: number
          total_leads: number
          total_sales: number
          user_id: string
          username: string
        }
        Insert: {
          cascade_commission?: number
          cascade_earnings?: number
          code: string
          commission?: number
          created_at?: string
          discord_user_id?: string | null
          discord_webhook_url?: string | null
          id?: string
          is_active?: boolean
          name: string
          pending_earnings?: number
          referrals_count?: number
          referred_by?: string | null
          tier?: Database["public"]["Enums"]["affiliate_tier"]
          total_earnings?: number
          total_leads?: number
          total_sales?: number
          user_id: string
          username: string
        }
        Update: {
          cascade_commission?: number
          cascade_earnings?: number
          code?: string
          commission?: number
          created_at?: string
          discord_user_id?: string | null
          discord_webhook_url?: string | null
          id?: string
          is_active?: boolean
          name?: string
          pending_earnings?: number
          referrals_count?: number
          referred_by?: string | null
          tier?: Database["public"]["Enums"]["affiliate_tier"]
          total_earnings?: number
          total_leads?: number
          total_sales?: number
          user_id?: string
          username?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          affiliate_code: string
          affiliate_commission: number
          cascade_code: string | null
          cascade_commission: number
          client_name: string | null
          company_profit: number
          confirmed_at: string | null
          created_at: string
          fee_percentage: number
          id: string
          status: string
          ticket_id: string
          total_profit: number
          transaction_value: number
        }
        Insert: {
          affiliate_code: string
          affiliate_commission: number
          cascade_code?: string | null
          cascade_commission?: number
          client_name?: string | null
          company_profit: number
          confirmed_at?: string | null
          created_at?: string
          fee_percentage: number
          id?: string
          status?: string
          ticket_id: string
          total_profit: number
          transaction_value: number
        }
        Update: {
          affiliate_code?: string
          affiliate_commission?: number
          cascade_code?: string | null
          cascade_commission?: number
          client_name?: string | null
          company_profit?: number
          confirmed_at?: string | null
          created_at?: string
          fee_percentage?: number
          id?: string
          status?: string
          ticket_id?: string
          total_profit?: number
          transaction_value?: number
        }
        Relationships: [
          {
            foreignKeyName: "leads_affiliate_code_fkey"
            columns: ["affiliate_code"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["code"]
          },
        ]
      }
      profiles: {
        Row: {
          affiliate_code: string | null
          avatar_url: string | null
          created_at: string
          discord_id: string | null
          discord_username: string | null
          id: string
          role: string
          updated_at: string
        }
        Insert: {
          affiliate_code?: string | null
          avatar_url?: string | null
          created_at?: string
          discord_id?: string | null
          discord_username?: string | null
          id: string
          role?: string
          updated_at?: string
        }
        Update: {
          affiliate_code?: string | null
          avatar_url?: string | null
          created_at?: string
          discord_id?: string | null
          discord_username?: string | null
          id?: string
          role?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_affiliate_code_fkey"
            columns: ["affiliate_code"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["code"]
          },
        ]
      }
      system_config: {
        Row: {
          description: string | null
          id: string
          key: string
          notes: string | null
          updated_at: string
          value: number
        }
        Insert: {
          description?: string | null
          id?: string
          key: string
          notes?: string | null
          updated_at?: string
          value: number
        }
        Update: {
          description?: string | null
          id?: string
          key?: string
          notes?: string | null
          updated_at?: string
          value?: number
        }
        Relationships: []
      }
      withdrawal_requests: {
        Row: {
          affiliate_code: string
          amount: number
          crypto_coin: string | null
          crypto_network: string | null
          id: string
          notes: string | null
          payment_address: string
          payment_method: string
          processed_at: string | null
          requested_at: string
          status: string
        }
        Insert: {
          affiliate_code: string
          amount: number
          crypto_coin?: string | null
          crypto_network?: string | null
          id?: string
          notes?: string | null
          payment_address: string
          payment_method: string
          processed_at?: string | null
          requested_at?: string
          status?: string
        }
        Update: {
          affiliate_code?: string
          amount?: number
          crypto_coin?: string | null
          crypto_network?: string | null
          id?: string
          notes?: string | null
          payment_address?: string
          payment_method?: string
          processed_at?: string | null
          requested_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "withdrawal_requests_affiliate_code_fkey"
            columns: ["affiliate_code"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["code"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      increment_referrals_count: {
        Args: { affiliate_code: string }
        Returns: undefined
      }
    }
    Enums: {
      affiliate_tier: "bronze" | "prata" | "ouro" | "diamante"
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
      affiliate_tier: ["bronze", "prata", "ouro", "diamante"],
    },
  },
} as const

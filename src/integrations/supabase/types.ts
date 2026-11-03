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
      accounts: {
        Row: {
          account_number: string | null
          balance: number
          bic: string | null
          created_at: string
          currency: string
          iban: string | null
          id: string
          nickname: string | null
          routing_number: string | null
          sort_code: string | null
          status: string
          user_id: string
        }
        Insert: {
          account_number?: string | null
          balance?: number
          bic?: string | null
          created_at?: string
          currency: string
          iban?: string | null
          id?: string
          nickname?: string | null
          routing_number?: string | null
          sort_code?: string | null
          status?: string
          user_id: string
        }
        Update: {
          account_number?: string | null
          balance?: number
          bic?: string | null
          created_at?: string
          currency?: string
          iban?: string | null
          id?: string
          nickname?: string | null
          routing_number?: string | null
          sort_code?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "accounts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      exchange_rates: {
        Row: {
          change_24h: number
          id: string
          pair: string
          rate: number
          updated_at: string
        }
        Insert: {
          change_24h?: number
          id?: string
          pair: string
          rate: number
          updated_at?: string
        }
        Update: {
          change_24h?: number
          id?: string
          pair?: string
          rate?: number
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          read: boolean
          severity: string
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          read?: boolean
          severity?: string
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          read?: boolean
          severity?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          biometric_enabled: boolean
          created_at: string
          daily_transfer_limit: number
          display_name: string | null
          email: string | null
          id: string
          last_login_at: string | null
          notifications_enabled: boolean
          preferred_currency: string
          two_factor_enabled: boolean
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          biometric_enabled?: boolean
          created_at?: string
          daily_transfer_limit?: number
          display_name?: string | null
          email?: string | null
          id: string
          last_login_at?: string | null
          notifications_enabled?: boolean
          preferred_currency?: string
          two_factor_enabled?: boolean
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          biometric_enabled?: boolean
          created_at?: string
          daily_transfer_limit?: number
          display_name?: string | null
          email?: string | null
          id?: string
          last_login_at?: string | null
          notifications_enabled?: boolean
          preferred_currency?: string
          two_factor_enabled?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      security_events: {
        Row: {
          created_at: string
          device: string | null
          event_type: string
          id: string
          ip_address: string | null
          location: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          device?: string | null
          event_type: string
          id?: string
          ip_address?: string | null
          location?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          device?: string | null
          event_type?: string
          id?: string
          ip_address?: string | null
          location?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "security_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          counterparty_details: string | null
          counterparty_name: string | null
          created_at: string
          currency: string
          description: string | null
          direction: string
          fee: number
          fx_rate: number | null
          id: string
          reference: string | null
          source_account_id: string | null
          status: string
          target_amount: number | null
          target_currency: string | null
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          counterparty_details?: string | null
          counterparty_name?: string | null
          created_at?: string
          currency: string
          description?: string | null
          direction?: string
          fee?: number
          fx_rate?: number | null
          id?: string
          reference?: string | null
          source_account_id?: string | null
          status?: string
          target_amount?: number | null
          target_currency?: string | null
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          counterparty_details?: string | null
          counterparty_name?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          direction?: string
          fee?: number
          fx_rate?: number | null
          id?: string
          reference?: string | null
          source_account_id?: string | null
          status?: string
          target_amount?: number | null
          target_currency?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_source_account_id_fkey"
            columns: ["source_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      trusted_devices: {
        Row: {
          created_at: string
          id: string
          last_active: string
          name: string
          platform: string | null
          trusted: boolean
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_active?: string
          name: string
          platform?: string | null
          trusted?: boolean
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_active?: string
          name?: string
          platform?: string | null
          trusted?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trusted_devices_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
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
      execute_transfer:
        | {
            Args: {
              _amount: number
              _counterparty_details: string
              _counterparty_name: string
              _reference: string
              _source_account_id: string
              _target_account_id?: string
              _type: string
            }
            Returns: string
          }
        | {
            Args: {
              _amount: number
              _counterparty_details: string
              _counterparty_name: string
              _description?: string
              _reference: string
              _source_account_id: string
              _target_account_id?: string
              _type: string
            }
            Returns: string
          }
      generate_account_number: { Args: never; Returns: string }
      generate_iban: {
        Args: { country_code: string; length: number }
        Returns: string
      }
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

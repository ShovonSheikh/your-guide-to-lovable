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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      billing_records: {
        Row: {
          amount: number
          billing_period_end: string | null
          billing_period_start: string | null
          created_at: string | null
          currency: string | null
          id: string
          payment_method: string | null
          profile_id: string
          status: string | null
          subscription_id: string | null
          transaction_id: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          billing_period_end?: string | null
          billing_period_start?: string | null
          created_at?: string | null
          currency?: string | null
          id?: string
          payment_method?: string | null
          profile_id: string
          status?: string | null
          subscription_id?: string | null
          transaction_id?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          billing_period_end?: string | null
          billing_period_start?: string | null
          created_at?: string | null
          currency?: string | null
          id?: string
          payment_method?: string | null
          profile_id?: string
          status?: string | null
          subscription_id?: string | null
          transaction_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "billing_records_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_records_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "creator_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_signups: {
        Row: {
          active_until: string | null
          amount: number | null
          billing_start: string | null
          bio: string | null
          category: string | null
          created_at: string | null
          currency: string | null
          email: string | null
          first_name: string | null
          id: string
          instagram: string | null
          last_name: string | null
          other_link: string | null
          payment_method: string | null
          payment_status: string | null
          payout_method: string | null
          phone: string | null
          promo: boolean | null
          signup_date: string | null
          transaction_id: string | null
          twitter: string | null
          updated_at: string | null
          username: string | null
          youtube: string | null
        }
        Insert: {
          active_until?: string | null
          amount?: number | null
          billing_start?: string | null
          bio?: string | null
          category?: string | null
          created_at?: string | null
          currency?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          instagram?: string | null
          last_name?: string | null
          other_link?: string | null
          payment_method?: string | null
          payment_status?: string | null
          payout_method?: string | null
          phone?: string | null
          promo?: boolean | null
          signup_date?: string | null
          transaction_id?: string | null
          twitter?: string | null
          updated_at?: string | null
          username?: string | null
          youtube?: string | null
        }
        Update: {
          active_until?: string | null
          amount?: number | null
          billing_start?: string | null
          bio?: string | null
          category?: string | null
          created_at?: string | null
          currency?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          instagram?: string | null
          last_name?: string | null
          other_link?: string | null
          payment_method?: string | null
          payment_status?: string | null
          payout_method?: string | null
          phone?: string | null
          promo?: boolean | null
          signup_date?: string | null
          transaction_id?: string | null
          twitter?: string | null
          updated_at?: string | null
          username?: string | null
          youtube?: string | null
        }
        Relationships: []
      }
      creator_subscriptions: {
        Row: {
          active_until: string | null
          amount: number | null
          billing_start: string | null
          created_at: string | null
          currency: string | null
          id: string
          payment_method: string | null
          payment_status: string | null
          payout_method: string | null
          phone: string | null
          profile_id: string
          promo: boolean | null
          signup_date: string | null
          transaction_id: string | null
          updated_at: string | null
        }
        Insert: {
          active_until?: string | null
          amount?: number | null
          billing_start?: string | null
          created_at?: string | null
          currency?: string | null
          id?: string
          payment_method?: string | null
          payment_status?: string | null
          payout_method?: string | null
          phone?: string | null
          profile_id: string
          promo?: boolean | null
          signup_date?: string | null
          transaction_id?: string | null
          updated_at?: string | null
        }
        Update: {
          active_until?: string | null
          amount?: number | null
          billing_start?: string | null
          created_at?: string | null
          currency?: string | null
          id?: string
          payment_method?: string | null
          payment_status?: string | null
          payout_method?: string | null
          phone?: string | null
          profile_id?: string
          promo?: boolean | null
          signup_date?: string | null
          transaction_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "creator_subscriptions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          account_type: Database["public"]["Enums"]["account_type"] | null
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          email: string | null
          facebook: string | null
          first_name: string | null
          id: string
          instagram: string | null
          is_verified: boolean | null
          last_name: string | null
          onboarding_status:
            | Database["public"]["Enums"]["onboarding_status"]
            | null
          other_link: string | null
          total_received: number | null
          total_supporters: number | null
          twitter: string | null
          updated_at: string | null
          user_id: string
          username: string | null
          youtube: string | null
        }
        Insert: {
          account_type?: Database["public"]["Enums"]["account_type"] | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          email?: string | null
          facebook?: string | null
          first_name?: string | null
          id?: string
          instagram?: string | null
          is_verified?: boolean | null
          last_name?: string | null
          onboarding_status?:
            | Database["public"]["Enums"]["onboarding_status"]
            | null
          other_link?: string | null
          total_received?: number | null
          total_supporters?: number | null
          twitter?: string | null
          updated_at?: string | null
          user_id: string
          username?: string | null
          youtube?: string | null
        }
        Update: {
          account_type?: Database["public"]["Enums"]["account_type"] | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          email?: string | null
          facebook?: string | null
          first_name?: string | null
          id?: string
          instagram?: string | null
          is_verified?: boolean | null
          last_name?: string | null
          onboarding_status?:
            | Database["public"]["Enums"]["onboarding_status"]
            | null
          other_link?: string | null
          total_received?: number | null
          total_supporters?: number | null
          twitter?: string | null
          updated_at?: string | null
          user_id?: string
          username?: string | null
          youtube?: string | null
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          action: string
          count: number | null
          created_at: string | null
          id: string
          identifier: string
          updated_at: string | null
          window_start: string | null
        }
        Insert: {
          action: string
          count?: number | null
          created_at?: string | null
          id?: string
          identifier: string
          updated_at?: string | null
          window_start?: string | null
        }
        Update: {
          action?: string
          count?: number | null
          created_at?: string | null
          id?: string
          identifier?: string
          updated_at?: string | null
          window_start?: string | null
        }
        Relationships: []
      }
      tips: {
        Row: {
          amount: number
          created_at: string | null
          creator_id: string
          currency: string | null
          id: string
          is_anonymous: boolean | null
          message: string | null
          payment_method: string | null
          payment_status: string | null
          supporter_email: string
          supporter_id: string | null
          supporter_name: string
          transaction_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          creator_id: string
          currency?: string | null
          id?: string
          is_anonymous?: boolean | null
          message?: string | null
          payment_method?: string | null
          payment_status?: string | null
          supporter_email: string
          supporter_id?: string | null
          supporter_name: string
          transaction_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          creator_id?: string
          currency?: string | null
          id?: string
          is_anonymous?: boolean | null
          message?: string | null
          payment_method?: string | null
          payment_status?: string | null
          supporter_email?: string
          supporter_id?: string | null
          supporter_name?: string
          transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tips_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tips_supporter_id_fkey"
            columns: ["supporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      withdrawal_requests: {
        Row: {
          amount: number
          created_at: string | null
          currency: string | null
          id: string
          notes: string | null
          payout_details: Json | null
          payout_method: string
          processed_at: string | null
          profile_id: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string | null
          id?: string
          notes?: string | null
          payout_details?: Json | null
          payout_method: string
          processed_at?: string | null
          profile_id: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string | null
          id?: string
          notes?: string | null
          payout_details?: Json | null
          payout_method?: string
          processed_at?: string | null
          profile_id?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "withdrawal_requests_profile_id_fkey"
            columns: ["profile_id"]
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
      get_creator_current_month_stats: {
        Args: { creator_profile_id: string }
        Returns: {
          current_month_earnings: number
          current_month_tips: number
          earnings_change_percent: number
          previous_month_earnings: number
          previous_month_tips: number
          tips_change_percent: number
        }[]
      }
      get_creator_monthly_earnings: {
        Args: { creator_profile_id: string }
        Returns: {
          amount: number
          month: string
        }[]
      }
      get_supporter_donations: {
        Args: { supporter_profile_id: string }
        Returns: {
          amount: number
          created_at: string
          creator_avatar: string
          creator_name: string
          creator_username: string
          currency: string
          id: string
          message: string
        }[]
      }
      increment_creator_stats: {
        Args: {
          creator_profile_id: string
          is_new_supporter?: boolean
          tip_amount: number
        }
        Returns: undefined
      }
    }
    Enums: {
      account_type: "supporter" | "creator"
      onboarding_status:
        | "pending"
        | "account_type"
        | "payment"
        | "profile"
        | "completed"
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
      account_type: ["supporter", "creator"],
      onboarding_status: [
        "pending",
        "account_type",
        "payment",
        "profile",
        "completed",
      ],
    },
  },
} as const

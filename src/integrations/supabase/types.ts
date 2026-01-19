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
      admin_activity_logs: {
        Row: {
          action: string
          admin_id: string
          created_at: string | null
          details: Json | null
          id: string
          target_id: string | null
          target_type: string | null
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string | null
          details?: Json | null
          id?: string
          target_id?: string | null
          target_type?: string | null
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          target_id?: string | null
          target_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_activity_logs_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_roles: {
        Row: {
          can_manage_admins: boolean
          can_manage_creators: boolean
          can_manage_mailbox: boolean
          can_manage_settings: boolean
          can_manage_users: boolean
          can_manage_verifications: boolean
          can_manage_withdrawals: boolean
          can_view_dashboard: boolean
          can_view_tips: boolean
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          can_manage_admins?: boolean
          can_manage_creators?: boolean
          can_manage_mailbox?: boolean
          can_manage_settings?: boolean
          can_manage_users?: boolean
          can_manage_verifications?: boolean
          can_manage_withdrawals?: boolean
          can_view_dashboard?: boolean
          can_view_tips?: boolean
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          can_manage_admins?: boolean
          can_manage_creators?: boolean
          can_manage_mailbox?: boolean
          can_manage_settings?: boolean
          can_manage_users?: boolean
          can_manage_verifications?: boolean
          can_manage_withdrawals?: boolean
          can_view_dashboard?: boolean
          can_view_tips?: boolean
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
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
      email_logs: {
        Row: {
          created_at: string | null
          email_type: string
          error_message: string | null
          id: string
          recipient_email: string
          resend_id: string | null
          status: string
        }
        Insert: {
          created_at?: string | null
          email_type: string
          error_message?: string | null
          id?: string
          recipient_email: string
          resend_id?: string | null
          status: string
        }
        Update: {
          created_at?: string | null
          email_type?: string
          error_message?: string | null
          id?: string
          recipient_email?: string
          resend_id?: string | null
          status?: string
        }
        Relationships: []
      }
      inbound_emails: {
        Row: {
          attachments: Json | null
          bcc_addresses: Json | null
          cc_addresses: Json | null
          created_at: string | null
          from_address: string
          from_name: string | null
          html_body: string | null
          id: string
          is_deleted: boolean | null
          is_read: boolean | null
          mailbox_id: string
          message_id: string
          received_at: string
          subject: string | null
          text_body: string | null
          to_addresses: Json
        }
        Insert: {
          attachments?: Json | null
          bcc_addresses?: Json | null
          cc_addresses?: Json | null
          created_at?: string | null
          from_address: string
          from_name?: string | null
          html_body?: string | null
          id?: string
          is_deleted?: boolean | null
          is_read?: boolean | null
          mailbox_id: string
          message_id: string
          received_at: string
          subject?: string | null
          text_body?: string | null
          to_addresses: Json
        }
        Update: {
          attachments?: Json | null
          bcc_addresses?: Json | null
          cc_addresses?: Json | null
          created_at?: string | null
          from_address?: string
          from_name?: string | null
          html_body?: string | null
          id?: string
          is_deleted?: boolean | null
          is_read?: boolean | null
          mailbox_id?: string
          message_id?: string
          received_at?: string
          subject?: string | null
          text_body?: string | null
          to_addresses?: Json
        }
        Relationships: [
          {
            foreignKeyName: "inbound_emails_mailbox_id_fkey"
            columns: ["mailbox_id"]
            isOneToOne: false
            referencedRelation: "mailboxes"
            referencedColumns: ["id"]
          },
        ]
      }
      mailboxes: {
        Row: {
          created_at: string | null
          display_name: string | null
          email_address: string
          id: string
        }
        Insert: {
          created_at?: string | null
          display_name?: string | null
          email_address: string
          id?: string
        }
        Update: {
          created_at?: string | null
          display_name?: string | null
          email_address?: string
          id?: string
        }
        Relationships: []
      }
      notification_settings: {
        Row: {
          created_at: string | null
          id: string
          profile_id: string
          promotions_enabled: boolean | null
          tips_enabled: boolean | null
          updated_at: string | null
          withdrawals_enabled: boolean | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          profile_id: string
          promotions_enabled?: boolean | null
          tips_enabled?: boolean | null
          updated_at?: string | null
          withdrawals_enabled?: boolean | null
        }
        Update: {
          created_at?: string | null
          id?: string
          profile_id?: string
          promotions_enabled?: boolean | null
          tips_enabled?: boolean | null
          updated_at?: string | null
          withdrawals_enabled?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_settings_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          data: Json | null
          id: string
          is_read: boolean | null
          message: string
          profile_id: string
          title: string
          type: string
        }
        Insert: {
          created_at?: string | null
          data?: Json | null
          id?: string
          is_read?: boolean | null
          message: string
          profile_id: string
          title: string
          type: string
        }
        Update: {
          created_at?: string | null
          data?: Json | null
          id?: string
          is_read?: boolean | null
          message?: string
          profile_id?: string
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_config: {
        Row: {
          description: string | null
          id: string
          key: string
          updated_at: string | null
          updated_by: string | null
          value: Json
        }
        Insert: {
          description?: string | null
          id?: string
          key: string
          updated_at?: string | null
          updated_by?: string | null
          value: Json
        }
        Update: {
          description?: string | null
          id?: string
          key?: string
          updated_at?: string | null
          updated_by?: string | null
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "platform_config_updated_by_fkey"
            columns: ["updated_by"]
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
          is_admin: boolean | null
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
          withdrawal_pin_hash: string | null
          withdrawal_pin_set_at: string | null
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
          is_admin?: boolean | null
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
          withdrawal_pin_hash?: string | null
          withdrawal_pin_set_at?: string | null
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
          is_admin?: boolean | null
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
          withdrawal_pin_hash?: string | null
          withdrawal_pin_set_at?: string | null
          youtube?: string | null
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string | null
          endpoint: string
          id: string
          p256dh: string
          profile_id: string
        }
        Insert: {
          auth: string
          created_at?: string | null
          endpoint: string
          id?: string
          p256dh: string
          profile_id: string
        }
        Update: {
          auth?: string
          created_at?: string | null
          endpoint?: string
          id?: string
          p256dh?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      verification_requests: {
        Row: {
          admin_notes: string | null
          created_at: string | null
          id: string
          id_back_url: string
          id_front_url: string
          profile_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          selfie_url: string
          status: string | null
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string | null
          id?: string
          id_back_url: string
          id_front_url: string
          profile_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          selfie_url: string
          status?: string | null
        }
        Update: {
          admin_notes?: string | null
          created_at?: string | null
          id?: string
          id_back_url?: string
          id_front_url?: string
          profile_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          selfie_url?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "verification_requests_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "verification_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      withdrawal_otps: {
        Row: {
          attempts: number | null
          created_at: string | null
          expires_at: string
          id: string
          otp_hash: string
          profile_id: string
          used: boolean | null
        }
        Insert: {
          attempts?: number | null
          created_at?: string | null
          expires_at: string
          id?: string
          otp_hash: string
          profile_id: string
          used?: boolean | null
        }
        Update: {
          attempts?: number | null
          created_at?: string | null
          expires_at?: string
          id?: string
          otp_hash?: string
          profile_id?: string
          used?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "withdrawal_otps_profile_id_fkey"
            columns: ["profile_id"]
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
      cleanup_expired_otps: { Args: never; Returns: undefined }
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
      get_current_profile_id: { Args: never; Returns: string }
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
      is_admin: { Args: never; Returns: boolean }
      is_super_admin: { Args: { clerk_user_id: string }; Returns: boolean }
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

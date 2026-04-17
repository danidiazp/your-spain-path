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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      assessment_results: {
        Row: {
          alternative_route_ids_json: Json | null
          created_at: string
          explanation: string | null
          id: string
          missing_requirements_json: Json | null
          preparedness_level: string | null
          primary_route_id: string | null
          profile_id: string
        }
        Insert: {
          alternative_route_ids_json?: Json | null
          created_at?: string
          explanation?: string | null
          id?: string
          missing_requirements_json?: Json | null
          preparedness_level?: string | null
          primary_route_id?: string | null
          profile_id: string
        }
        Update: {
          alternative_route_ids_json?: Json | null
          created_at?: string
          explanation?: string | null
          id?: string
          missing_requirements_json?: Json | null
          preparedness_level?: string | null
          primary_route_id?: string | null
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessment_results_primary_route_id_fkey"
            columns: ["primary_route_id"]
            isOneToOne: false
            referencedRelation: "migration_routes"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_profiles: {
        Row: {
          created_at: string
          current_period_end: string | null
          id: string
          ip_country: string | null
          monthly_amount: number | null
          pricing_review: boolean
          risk_flag: string | null
          selected_currency: string | null
          selected_pricing_country: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_status: string | null
          trial_end: string | null
          trial_start: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          id?: string
          ip_country?: string | null
          monthly_amount?: number | null
          pricing_review?: boolean
          risk_flag?: string | null
          selected_currency?: string | null
          selected_pricing_country?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string | null
          trial_end?: string | null
          trial_start?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          id?: string
          ip_country?: string | null
          monthly_amount?: number | null
          pricing_review?: boolean
          risk_flag?: string | null
          selected_currency?: string | null
          selected_pricing_country?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string | null
          trial_end?: string | null
          trial_start?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      country_pricing_tiers: {
        Row: {
          active: boolean
          country_code: string
          country_name: string
          created_at: string
          id: string
          local_amount: number | null
          local_currency: string | null
          pricing_tier: string
          reference_eur_amount: number
          requires_manual_review: boolean
          updated_at: string
        }
        Insert: {
          active?: boolean
          country_code: string
          country_name: string
          created_at?: string
          id?: string
          local_amount?: number | null
          local_currency?: string | null
          pricing_tier: string
          reference_eur_amount: number
          requires_manual_review?: boolean
          updated_at?: string
        }
        Update: {
          active?: boolean
          country_code?: string
          country_name?: string
          created_at?: string
          id?: string
          local_amount?: number | null
          local_currency?: string | null
          pricing_tier?: string
          reference_eur_amount?: number
          requires_manual_review?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      migration_routes: {
        Row: {
          created_at: string
          eligibility_rules_json: Json | null
          estimated_timeline: string | null
          id: string
          is_active: boolean
          name: string
          official_sources_json: Json | null
          risk_notes: string | null
          short_description: string | null
          slug: string
          summary: string | null
          target_user: string | null
        }
        Insert: {
          created_at?: string
          eligibility_rules_json?: Json | null
          estimated_timeline?: string | null
          id?: string
          is_active?: boolean
          name: string
          official_sources_json?: Json | null
          risk_notes?: string | null
          short_description?: string | null
          slug: string
          summary?: string | null
          target_user?: string | null
        }
        Update: {
          created_at?: string
          eligibility_rules_json?: Json | null
          estimated_timeline?: string | null
          id?: string
          is_active?: boolean
          name?: string
          official_sources_json?: Json | null
          risk_notes?: string | null
          short_description?: string | null
          slug?: string
          summary?: string | null
          target_user?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          active_process_nationality: string | null
          birth_country: string | null
          budget_range: string | null
          created_at: string
          current_country: string | null
          current_residence_country: string | null
          current_spain_status: string | null
          currently_in_spain: boolean | null
          eligible_fast_track_nationality: boolean | null
          email: string | null
          eu_status: boolean | null
          family_in_spain: boolean | null
          full_name: string | null
          has_second_nationality: boolean | null
          id: string
          intended_route: string | null
          main_goal: string | null
          nationality: string | null
          preferred_language: string | null
          primary_nationality: string | null
          second_nationality: string | null
          study_admission: boolean | null
          timeline_goal: string | null
          updated_at: string
          work_offer: boolean | null
        }
        Insert: {
          active_process_nationality?: string | null
          birth_country?: string | null
          budget_range?: string | null
          created_at?: string
          current_country?: string | null
          current_residence_country?: string | null
          current_spain_status?: string | null
          currently_in_spain?: boolean | null
          eligible_fast_track_nationality?: boolean | null
          email?: string | null
          eu_status?: boolean | null
          family_in_spain?: boolean | null
          full_name?: string | null
          has_second_nationality?: boolean | null
          id: string
          intended_route?: string | null
          main_goal?: string | null
          nationality?: string | null
          preferred_language?: string | null
          primary_nationality?: string | null
          second_nationality?: string | null
          study_admission?: boolean | null
          timeline_goal?: string | null
          updated_at?: string
          work_offer?: boolean | null
        }
        Update: {
          active_process_nationality?: string | null
          birth_country?: string | null
          budget_range?: string | null
          created_at?: string
          current_country?: string | null
          current_residence_country?: string | null
          current_spain_status?: string | null
          currently_in_spain?: boolean | null
          eligible_fast_track_nationality?: boolean | null
          email?: string | null
          eu_status?: boolean | null
          family_in_spain?: boolean | null
          full_name?: string | null
          has_second_nationality?: boolean | null
          id?: string
          intended_route?: string | null
          main_goal?: string | null
          nationality?: string | null
          preferred_language?: string | null
          primary_nationality?: string | null
          second_nationality?: string | null
          study_admission?: boolean | null
          timeline_goal?: string | null
          updated_at?: string
          work_offer?: boolean | null
        }
        Relationships: []
      }
      resources: {
        Row: {
          category: string
          country_scope: string | null
          id: string
          institution: string | null
          language: string | null
          route_id: string | null
          title: string
          url: string
        }
        Insert: {
          category: string
          country_scope?: string | null
          id?: string
          institution?: string | null
          language?: string | null
          route_id?: string | null
          title: string
          url: string
        }
        Update: {
          category?: string
          country_scope?: string | null
          id?: string
          institution?: string | null
          language?: string | null
          route_id?: string | null
          title?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "resources_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "migration_routes"
            referencedColumns: ["id"]
          },
        ]
      }
      route_documents: {
        Row: {
          apostille_needed: boolean | null
          description: string | null
          id: string
          issued_by: string | null
          name: string
          official_link: string | null
          required: boolean | null
          route_id: string
          translation_needed: boolean | null
          validity_window: string | null
        }
        Insert: {
          apostille_needed?: boolean | null
          description?: string | null
          id?: string
          issued_by?: string | null
          name: string
          official_link?: string | null
          required?: boolean | null
          route_id: string
          translation_needed?: boolean | null
          validity_window?: string | null
        }
        Update: {
          apostille_needed?: boolean | null
          description?: string | null
          id?: string
          issued_by?: string | null
          name?: string
          official_link?: string | null
          required?: boolean | null
          route_id?: string
          translation_needed?: boolean | null
          validity_window?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "route_documents_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "migration_routes"
            referencedColumns: ["id"]
          },
        ]
      }
      route_steps: {
        Row: {
          description: string | null
          estimated_duration: string | null
          id: string
          official_link: string | null
          required_before_step: number | null
          route_id: string
          stage_location: string | null
          step_order: number
          title: string
        }
        Insert: {
          description?: string | null
          estimated_duration?: string | null
          id?: string
          official_link?: string | null
          required_before_step?: number | null
          route_id: string
          stage_location?: string | null
          step_order: number
          title: string
        }
        Update: {
          description?: string | null
          estimated_duration?: string | null
          id?: string
          official_link?: string | null
          required_before_step?: number | null
          route_id?: string
          stage_location?: string | null
          step_order?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "route_steps_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "migration_routes"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          environment: string
          id: string
          price_id: string
          product_id: string
          status: string
          stripe_customer_id: string
          stripe_subscription_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          environment?: string
          id?: string
          price_id: string
          product_id: string
          status?: string
          stripe_customer_id: string
          stripe_subscription_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          environment?: string
          id?: string
          price_id?: string
          product_id?: string
          status?: string
          stripe_customer_id?: string
          stripe_subscription_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_documents: {
        Row: {
          created_at: string
          document_id: string
          id: string
          notes: string | null
          profile_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          document_id: string
          id?: string
          notes?: string | null
          profile_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          document_id?: string
          id?: string
          notes?: string | null
          profile_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_documents_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "route_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      user_tasks: {
        Row: {
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          profile_id: string
          route_id: string | null
          source_step_id: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          profile_id: string
          route_id?: string | null
          source_step_id?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          profile_id?: string
          route_id?: string | null
          source_step_id?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_tasks_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "migration_routes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_tasks_source_step_id_fkey"
            columns: ["source_step_id"]
            isOneToOne: false
            referencedRelation: "route_steps"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_active_subscription: {
        Args: { check_env?: string; user_uuid: string }
        Returns: boolean
      }
      has_premium_access: {
        Args: { _env?: string; _user_id: string }
        Returns: boolean
      }
      start_trial_no_card: { Args: { _user_id: string }; Returns: Json }
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
    Enums: {},
  },
} as const

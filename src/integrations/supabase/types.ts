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
          budget_range: string | null
          created_at: string
          current_country: string | null
          email: string | null
          eu_status: boolean | null
          family_in_spain: boolean | null
          full_name: string | null
          id: string
          main_goal: string | null
          nationality: string | null
          preferred_language: string | null
          study_admission: boolean | null
          timeline_goal: string | null
          updated_at: string
          work_offer: boolean | null
        }
        Insert: {
          budget_range?: string | null
          created_at?: string
          current_country?: string | null
          email?: string | null
          eu_status?: boolean | null
          family_in_spain?: boolean | null
          full_name?: string | null
          id: string
          main_goal?: string | null
          nationality?: string | null
          preferred_language?: string | null
          study_admission?: boolean | null
          timeline_goal?: string | null
          updated_at?: string
          work_offer?: boolean | null
        }
        Update: {
          budget_range?: string | null
          created_at?: string
          current_country?: string | null
          email?: string | null
          eu_status?: boolean | null
          family_in_spain?: boolean | null
          full_name?: string | null
          id?: string
          main_goal?: string | null
          nationality?: string | null
          preferred_language?: string | null
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
      [_ in never]: never
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

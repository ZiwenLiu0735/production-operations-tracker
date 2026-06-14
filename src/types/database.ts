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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      employees: {
        Row: {
          active: boolean
          created_at: string
          employee_number: number
          id: string
          legal_name: string
          preferred_name: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          employee_number: number
          id?: string
          legal_name: string
          preferred_name?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          employee_number?: number
          id?: string
          legal_name?: string
          preferred_name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      facilities: {
        Row: {
          active: boolean
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          active: boolean
          created_at: string
          display_name: string
          employee_id: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          display_name: string
          employee_id?: string | null
          id: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          display_name?: string
          employee_id?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: true
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      rooms: {
        Row: {
          active: boolean
          created_at: string
          facility_id: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          facility_id: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          facility_id?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rooms_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
        ]
      }
      session_employees: {
        Row: {
          added_at: string
          added_by: string
          employee_id: string
          employee_number_snapshot: number
          legal_name_snapshot: string
          preferred_name_snapshot: string | null
          removed_at: string | null
          removed_by: string | null
          session_id: string
        }
        Insert: {
          added_at?: string
          added_by: string
          employee_id: string
          employee_number_snapshot: number
          legal_name_snapshot: string
          preferred_name_snapshot?: string | null
          removed_at?: string | null
          removed_by?: string | null
          session_id: string
        }
        Update: {
          added_at?: string
          added_by?: string
          employee_id?: string
          employee_number_snapshot?: number
          legal_name_snapshot?: string
          preferred_name_snapshot?: string | null
          removed_at?: string | null
          removed_by?: string | null
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_employees_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_employees_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_employees_removed_by_fkey"
            columns: ["removed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_employees_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      session_rooms: {
        Row: {
          room_id: string
          room_name_snapshot: string
          session_id: string
        }
        Insert: {
          room_id: string
          room_name_snapshot: string
          session_id: string
        }
        Update: {
          room_id?: string
          room_name_snapshot?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_rooms_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_rooms_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      session_supervisors: {
        Row: {
          display_name_snapshot: string
          employee_id: string
          employee_number_snapshot: number
          profile_id: string
          session_id: string
        }
        Insert: {
          display_name_snapshot: string
          employee_id: string
          employee_number_snapshot: number
          profile_id: string
          session_id: string
        }
        Update: {
          display_name_snapshot?: string
          employee_id?: string
          employee_number_snapshot?: number
          profile_id?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_supervisors_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_supervisors_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_supervisors_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          bin_number: string | null
          created_at: string
          deleted_at: string | null
          deleted_by: string | null
          ended_at: string | null
          ended_by: string | null
          facility_id: string
          facility_name_snapshot: string
          id: string
          notes: string
          started_at: string
          started_by: string
          status: Database["public"]["Enums"]["session_status"]
          strain: string | null
          tracking_uid: string | null
          updated_at: string
          work_type: Database["public"]["Enums"]["work_type"]
        }
        Insert: {
          bin_number?: string | null
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          ended_at?: string | null
          ended_by?: string | null
          facility_id: string
          facility_name_snapshot: string
          id?: string
          notes?: string
          started_at?: string
          started_by: string
          status?: Database["public"]["Enums"]["session_status"]
          strain?: string | null
          tracking_uid?: string | null
          updated_at?: string
          work_type: Database["public"]["Enums"]["work_type"]
        }
        Update: {
          bin_number?: string | null
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          ended_at?: string | null
          ended_by?: string | null
          facility_id?: string
          facility_name_snapshot?: string
          id?: string
          notes?: string
          started_at?: string
          started_by?: string
          status?: Database["public"]["Enums"]["session_status"]
          strain?: string | null
          tracking_uid?: string | null
          updated_at?: string
          work_type?: Database["public"]["Enums"]["work_type"]
        }
        Relationships: [
          {
            foreignKeyName: "sessions_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_ended_by_fkey"
            columns: ["ended_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_started_by_fkey"
            columns: ["started_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      weight_entries: {
        Row: {
          category: Database["public"]["Enums"]["trim_category"]
          deleted_at: string | null
          deleted_by: string | null
          employee_id: string
          id: string
          recorded_at: string
          recorded_by: string
          session_id: string
          updated_at: string
          updated_by: string
          weight_grams: number
        }
        Insert: {
          category: Database["public"]["Enums"]["trim_category"]
          deleted_at?: string | null
          deleted_by?: string | null
          employee_id: string
          id?: string
          recorded_at?: string
          recorded_by: string
          session_id: string
          updated_at?: string
          updated_by: string
          weight_grams: number
        }
        Update: {
          category?: Database["public"]["Enums"]["trim_category"]
          deleted_at?: string | null
          deleted_by?: string | null
          employee_id?: string
          id?: string
          recorded_at?: string
          recorded_by?: string
          session_id?: string
          updated_at?: string
          updated_by?: string
          weight_grams?: number
        }
        Relationships: [
          {
            foreignKeyName: "weight_entries_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "weight_entries_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "weight_entries_session_id_employee_id_fkey"
            columns: ["session_id", "employee_id"]
            isOneToOne: false
            referencedRelation: "session_employees"
            referencedColumns: ["session_id", "employee_id"]
          },
          {
            foreignKeyName: "weight_entries_updated_by_fkey"
            columns: ["updated_by"]
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
      add_session_employee: {
        Args: { target_employee_id: string; target_session_id: string }
        Returns: undefined
      }
      can_manage_session: {
        Args: { target_session_id: string }
        Returns: boolean
      }
      can_view_session: {
        Args: { target_session_id: string }
        Returns: boolean
      }
      complete_production_session: {
        Args: { target_session_id: string }
        Returns: undefined
      }
      current_employee_id: { Args: never; Returns: string }
      delete_weight_entry: {
        Args: { target_entry_id: string }
        Returns: undefined
      }
      is_active_user: { Args: never; Returns: boolean }
      is_admin: { Args: never; Returns: boolean }
      is_supervisor_or_admin: { Args: never; Returns: boolean }
      record_weight_entry: {
        Args: {
          target_category: Database["public"]["Enums"]["trim_category"]
          target_employee_id: string
          target_session_id: string
          target_weight_grams: number
        }
        Returns: string
      }
      remove_session_employee: {
        Args: { target_employee_id: string; target_session_id: string }
        Returns: undefined
      }
      start_production_session: {
        Args: {
          target_bin_number?: string
          target_employee_ids: string[]
          target_facility_id: string
          target_room_ids: string[]
          target_strain?: string
          target_supervisor_profile_ids: string[]
          target_tracking_uid?: string
          target_work_type: Database["public"]["Enums"]["work_type"]
        }
        Returns: string
      }
      update_weight_entry: {
        Args: {
          target_category: Database["public"]["Enums"]["trim_category"]
          target_entry_id: string
          target_weight_grams: number
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "supervisor" | "operator"
      session_status: "active" | "completed" | "deleted"
      trim_category: "regular" | "stick" | "smalls"
      work_type: "trim" | "hourly"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      app_role: ["admin", "supervisor", "operator"],
      session_status: ["active", "completed", "deleted"],
      trim_category: ["regular", "stick", "smalls"],
      work_type: ["trim", "hourly"],
    },
  },
} as const

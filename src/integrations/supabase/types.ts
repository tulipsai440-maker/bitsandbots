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
      calendar: {
        Row: {
          id: string
          event_date: string
          title: string
          agenda: string | null
          location: string | null
          start_time: string | null
          end_time: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          event_date: string
          title: string
          agenda?: string | null
          location?: string | null
          start_time?: string | null
          end_time?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          event_date?: string
          title?: string
          agenda?: string | null
          location?: string | null
          start_time?: string | null
          end_time?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      team_members: {
        Row: {
          id: string
          name: string
          description: string | null
          photo_url: string | null
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          photo_url?: string | null
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          photo_url?: string | null
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      coaches: {
        Row: {
          id: string
          name: string
          description: string | null
          photo_url: string | null
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          photo_url?: string | null
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          photo_url?: string | null
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      sponsors: {
        Row: {
          id: string
          name: string
          description: string | null
          logo_url: string | null
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name?: string
          description?: string | null
          logo_url?: string | null
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          logo_url?: string | null
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          band_url: string | null
          created_at: string
          description: string | null
          ends_at: string | null
          id: string
          location: string | null
          starts_at: string
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          band_url?: string | null
          created_at?: string
          description?: string | null
          ends_at?: string | null
          id?: string
          location?: string | null
          starts_at: string
          title: string
          type?: string
          updated_at?: string
        }
        Update: {
          band_url?: string | null
          created_at?: string
          description?: string | null
          ends_at?: string | null
          id?: string
          location?: string | null
          starts_at?: string
          title?: string
          type?: string
          updated_at?: string
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
      eagle_scouts: {
        Row: {
          admin_notes: string | null
          created_at: string
          id: string
          name: string
          project: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["content_status"]
          submitted_by_email: string | null
          updated_at: string
          year: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          id?: string
          name: string
          project: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["content_status"]
          submitted_by_email?: string | null
          updated_at?: string
          year: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          id?: string
          name?: string
          project?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["content_status"]
          submitted_by_email?: string | null
          updated_at?: string
          year?: string
        }
        Relationships: []
      }
      scoutmasters: {
        Row: {
          admin_notes: string | null
          bio: string | null
          created_at: string
          id: string
          name: string
          photo_url: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["content_status"]
          submitted_by_email: string | null
          updated_at: string
          years: string
        }
        Insert: {
          admin_notes?: string | null
          bio?: string | null
          created_at?: string
          id?: string
          name: string
          photo_url?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["content_status"]
          submitted_by_email?: string | null
          updated_at?: string
          years: string
        }
        Update: {
          admin_notes?: string | null
          bio?: string | null
          created_at?: string
          id?: string
          name?: string
          photo_url?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["content_status"]
          submitted_by_email?: string | null
          updated_at?: string
          years?: string
        }
        Relationships: []
      }
      announcements: {
        Row: {
          body: string
          created_at: string
          expires_at: string | null
          id: string
          published_at: string
          title: string
          updated_at: string
        }
        Insert: {
          body: string
          created_at?: string
          expires_at?: string | null
          id?: string
          published_at?: string
          title: string
          updated_at?: string
        }
        Update: {
          body?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          published_at?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      join_notify_emails: {
        Row: {
          active: boolean
          created_at: string
          email: string
          id: string
          label: string | null
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          email: string
          id?: string
          label?: string | null
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          email?: string
          id?: string
          label?: string | null
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      gallery_photos: {
        Row: {
          admin_notes: string | null
          approved_path: string | null
          caption: string | null
          consent_confirmed: boolean
          created_at: string
          height: number | null
          id: string
          pending_path: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["content_status"]
          submitted_by_email: string | null
          submitted_by_name: string | null
          updated_at: string
          width: number | null
        }
        Insert: {
          admin_notes?: string | null
          approved_path?: string | null
          caption?: string | null
          consent_confirmed?: boolean
          created_at?: string
          height?: number | null
          id?: string
          pending_path?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["content_status"]
          submitted_by_email?: string | null
          submitted_by_name?: string | null
          updated_at?: string
          width?: number | null
        }
        Update: {
          admin_notes?: string | null
          approved_path?: string | null
          caption?: string | null
          consent_confirmed?: boolean
          created_at?: string
          height?: number | null
          id?: string
          pending_path?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["content_status"]
          submitted_by_email?: string | null
          submitted_by_name?: string | null
          updated_at?: string
          width?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      list_troop_users: {
        Args: Record<string, never>
        Returns: {
          id: string
          email: string
          is_admin: boolean
          created_at: string
          last_sign_in_at: string | null
          email_confirmed: boolean
        }[]
      }
      list_approved_gallery_photos: {
        Args: Record<string, never>
        Returns: {
          id: string
          approved_path: string | null
          caption: string | null
          width: number | null
          height: number | null
          created_at: string
        }[]
      }
      submit_gallery_photo: {
        Args: {
          p_pending_path: string
          p_caption: string | null
          p_submitted_by_name: string
          p_submitted_by_email: string
          p_consent_confirmed: boolean
          p_width: number | null
          p_height: number | null
        }
        Returns: string
      }
      grant_troop_admin: {
        Args: { target_user_id: string }
        Returns: undefined
      }
      revoke_troop_admin: {
        Args: { target_user_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "user"
      content_status: "pending" | "approved" | "rejected"
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
      app_role: ["admin", "user"],
      content_status: ["pending", "approved", "rejected"],
    },
  },
} as const

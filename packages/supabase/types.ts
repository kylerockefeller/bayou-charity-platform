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
      classifieds: {
        Row: {
          archived_at: string | null
          contact: string | null
          created_at: string | null
          description: string | null
          id: string
          photo_url: string | null
          price: string | null
          seller_id: string | null
          sold: boolean | null
          status: string
          title: string
        }
        Insert: {
          archived_at?: string | null
          contact?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          photo_url?: string | null
          price?: string | null
          seller_id?: string | null
          sold?: boolean | null
          status?: string
          title: string
        }
        Update: {
          archived_at?: string | null
          contact?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          photo_url?: string | null
          price?: string | null
          seller_id?: string | null
          sold?: boolean | null
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "classifieds_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          content: string
          created_at: string
          gallery_event_id: string | null
          id: string
          is_approved: boolean
          pin_id: string | null
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string
          gallery_event_id?: string | null
          id?: string
          is_approved?: boolean
          pin_id?: string | null
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          gallery_event_id?: string | null
          id?: string
          is_approved?: boolean
          pin_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comments_gallery_event_id_fkey"
            columns: ["gallery_event_id"]
            isOneToOne: false
            referencedRelation: "gallery_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_pin_id_fkey"
            columns: ["pin_id"]
            isOneToOne: false
            referencedRelation: "pins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_replies: {
        Row: {
          author_id: string | null
          body: string
          created_at: string | null
          id: string
          thread_id: string | null
        }
        Insert: {
          author_id?: string | null
          body: string
          created_at?: string | null
          id?: string
          thread_id?: string | null
        }
        Update: {
          author_id?: string | null
          body?: string
          created_at?: string | null
          id?: string
          thread_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "forum_replies_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_replies_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "forum_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_threads: {
        Row: {
          archived_at: string | null
          author_id: string | null
          body: string | null
          category: string | null
          created_at: string | null
          id: string
          status: string
          title: string
        }
        Insert: {
          archived_at?: string | null
          author_id?: string | null
          body?: string | null
          category?: string | null
          created_at?: string | null
          id?: string
          status?: string
          title: string
        }
        Update: {
          archived_at?: string | null
          author_id?: string | null
          body?: string | null
          category?: string | null
          created_at?: string | null
          id?: string
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_threads_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      gallery_events: {
        Row: {
          created_at: string | null
          description: string | null
          event_date: string | null
          id: string
          name: string
          sort_order: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          event_date?: string | null
          id?: string
          name: string
          sort_order?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          event_date?: string | null
          id?: string
          name?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      gallery_submissions: {
        Row: {
          caption: string | null
          event_id: string | null
          id: string
          member_id: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          storage_path: string
          submitted_at: string | null
        }
        Insert: {
          caption?: string | null
          event_id?: string | null
          id?: string
          member_id?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          storage_path: string
          submitted_at?: string | null
        }
        Update: {
          caption?: string | null
          event_id?: string | null
          id?: string
          member_id?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          storage_path?: string
          submitted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gallery_submissions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "gallery_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gallery_submissions_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gallery_submissions_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      guide_postings: {
        Row: {
          archived_at: string | null
          available_dates: string | null
          contact: string | null
          created_at: string | null
          description: string | null
          guide_id: string | null
          id: string
          rate: string | null
          status: string
          title: string
        }
        Insert: {
          archived_at?: string | null
          available_dates?: string | null
          contact?: string | null
          created_at?: string | null
          description?: string | null
          guide_id?: string | null
          id?: string
          rate?: string | null
          status?: string
          title: string
        }
        Update: {
          archived_at?: string | null
          available_dates?: string | null
          contact?: string | null
          created_at?: string | null
          description?: string | null
          guide_id?: string | null
          id?: string
          rate?: string | null
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "guide_postings_guide_id_fkey"
            columns: ["guide_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pins: {
        Row: {
          archived_at: string | null
          caption: string | null
          catch_date: string | null
          created_at: string
          flagged: boolean
          id: string
          lat: number
          lng: number
          location_name: string | null
          photo_url: string | null
          photo_crop_x: number | null
          photo_crop_y: number | null
          photo_crop_zoom: number | null
          species: string | null
          user_id: string | null
        }
        Insert: {
          archived_at?: string | null
          caption?: string | null
          catch_date?: string | null
          created_at?: string
          flagged?: boolean
          id?: string
          lat: number
          lng: number
          location_name?: string | null
          photo_url?: string | null
          photo_crop_x?: number | null
          photo_crop_y?: number | null
          photo_crop_zoom?: number | null
          species?: string | null
          user_id?: string | null
        }
        Update: {
          archived_at?: string | null
          caption?: string | null
          catch_date?: string | null
          created_at?: string
          flagged?: boolean
          id?: string
          lat?: number
          lng?: number
          location_name?: string | null
          photo_url?: string | null
          photo_crop_x?: number | null
          photo_crop_y?: number | null
          photo_crop_zoom?: number | null
          species?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pins_user_id_fkey"
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
          bio: string | null
          display_name: string | null
          email: string | null
          home_waters: string | null
          id: string
          joined_at: string
          provider: string | null
          role: string
          species: string | null
          status: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          display_name?: string | null
          email?: string | null
          home_waters?: string | null
          id: string
          joined_at?: string
          provider?: string | null
          role?: string
          species?: string | null
          status?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          display_name?: string | null
          email?: string | null
          home_waters?: string | null
          id?: string
          joined_at?: string
          provider?: string | null
          role?: string
          species?: string | null
          status?: string
        }
        Relationships: []
      }
      reactions: {
        Row: {
          created_at: string | null
          emoji: string
          id: string
          member_id: string
          target_id: string
          target_type: string
        }
        Insert: {
          created_at?: string | null
          emoji?: string
          id?: string
          member_id: string
          target_id: string
          target_type: string
        }
        Update: {
          created_at?: string | null
          emoji?: string
          id?: string
          member_id?: string
          target_id?: string
          target_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "reactions_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      recipes: {
        Row: {
          archived_at: string | null
          author_id: string | null
          body: string | null
          created_at: string | null
          id: string
          photo_url: string | null
          species: string | null
          status: string
          title: string
        }
        Insert: {
          archived_at?: string | null
          author_id?: string | null
          body?: string | null
          created_at?: string | null
          id?: string
          photo_url?: string | null
          species?: string | null
          status?: string
          title: string
        }
        Update: {
          archived_at?: string | null
          author_id?: string | null
          body?: string | null
          created_at?: string | null
          id?: string
          photo_url?: string | null
          species?: string | null
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipes_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_rsvps: {
        Row: {
          created_at: string | null
          id: string
          member_id: string | null
          trip_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          member_id?: string | null
          trip_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          member_id?: string | null
          trip_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trip_rsvps_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_rsvps_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trips: {
        Row: {
          archived_at: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          location: string | null
          max_spots: number | null
          status: string
          title: string
          trip_date: string
          type: string
        }
        Insert: {
          archived_at?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          location?: string | null
          max_spots?: number | null
          status?: string
          title: string
          trip_date: string
          type: string
        }
        Update: {
          archived_at?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          location?: string | null
          max_spots?: number | null
          status?: string
          title?: string
          trip_date?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "trips_created_by_fkey"
            columns: ["created_by"]
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
      auto_archive_posts: { Args: never; Returns: Json }
      is_admin: { Args: never; Returns: boolean }
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

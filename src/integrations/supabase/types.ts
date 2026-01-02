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
      activity_logs: {
        Row: {
          action: string
          created_at: string | null
          description: string | null
          id: string
          metadata: Json | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      admin_settings: {
        Row: {
          id: string
          key: string
          updated_at: string | null
          updated_by: string | null
          value: Json
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string | null
          updated_by?: string | null
          value?: Json
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string | null
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      analyzed_videos: {
        Row: {
          analysis_data_json: Json | null
          analyzed_at: string | null
          channel_id: string | null
          created_at: string | null
          detected_microniche: string | null
          detected_niche: string | null
          detected_subniche: string | null
          folder_id: string | null
          id: string
          original_comments: number | null
          original_days: number | null
          original_thumbnail_url: string | null
          original_title: string | null
          original_views: number | null
          translated_title: string | null
          user_id: string
          video_url: string
          youtube_video_id: string | null
        }
        Insert: {
          analysis_data_json?: Json | null
          analyzed_at?: string | null
          channel_id?: string | null
          created_at?: string | null
          detected_microniche?: string | null
          detected_niche?: string | null
          detected_subniche?: string | null
          folder_id?: string | null
          id?: string
          original_comments?: number | null
          original_days?: number | null
          original_thumbnail_url?: string | null
          original_title?: string | null
          original_views?: number | null
          translated_title?: string | null
          user_id: string
          video_url: string
          youtube_video_id?: string | null
        }
        Update: {
          analysis_data_json?: Json | null
          analyzed_at?: string | null
          channel_id?: string | null
          created_at?: string | null
          detected_microniche?: string | null
          detected_niche?: string | null
          detected_subniche?: string | null
          folder_id?: string | null
          id?: string
          original_comments?: number | null
          original_days?: number | null
          original_thumbnail_url?: string | null
          original_title?: string | null
          original_views?: number | null
          translated_title?: string | null
          user_id?: string
          video_url?: string
          youtube_video_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analyzed_videos_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id"]
          },
        ]
      }
      api_providers: {
        Row: {
          created_at: string | null
          credits_per_unit: number
          id: string
          is_active: number
          is_default: number
          is_premium: number
          markup: number
          model: string
          name: string
          provider: string
          real_cost_per_unit: number
          unit_size: number
          unit_type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          credits_per_unit?: number
          id?: string
          is_active?: number
          is_default?: number
          is_premium?: number
          markup?: number
          model: string
          name: string
          provider: string
          real_cost_per_unit?: number
          unit_size?: number
          unit_type?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          credits_per_unit?: number
          id?: string
          is_active?: number
          is_default?: number
          is_premium?: number
          markup?: number
          model?: string
          name?: string
          provider?: string
          real_cost_per_unit?: number
          unit_size?: number
          unit_type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      credit_transactions: {
        Row: {
          amount: number
          created_at: string | null
          description: string | null
          id: string
          transaction_type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          description?: string | null
          id?: string
          transaction_type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          description?: string | null
          id?: string
          transaction_type?: string
          user_id?: string
        }
        Relationships: []
      }
      credit_usage: {
        Row: {
          created_at: string | null
          credits_used: number
          details: Json | null
          id: string
          model_used: string | null
          operation_type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          credits_used: number
          details?: Json | null
          id?: string
          model_used?: string | null
          operation_type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          credits_used?: number
          details?: Json | null
          id?: string
          model_used?: string | null
          operation_type?: string
          user_id?: string
        }
        Relationships: []
      }
      email_templates: {
        Row: {
          body: string
          created_at: string | null
          id: string
          is_active: boolean | null
          subject: string
          template_type: string
          updated_at: string | null
          variables: string[] | null
        }
        Insert: {
          body: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          subject: string
          template_type: string
          updated_at?: string | null
          variables?: string[] | null
        }
        Update: {
          body?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          subject?: string
          template_type?: string
          updated_at?: string | null
          variables?: string[] | null
        }
        Relationships: []
      }
      folders: {
        Row: {
          created_at: string | null
          id: string
          items_count: number | null
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          items_count?: number | null
          name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          items_count?: number | null
          name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      generated_audios: {
        Row: {
          audio_url: string | null
          created_at: string | null
          duration: number | null
          id: string
          text: string
          user_id: string
          voice_id: string | null
        }
        Insert: {
          audio_url?: string | null
          created_at?: string | null
          duration?: number | null
          id?: string
          text: string
          user_id: string
          voice_id?: string | null
        }
        Update: {
          audio_url?: string | null
          created_at?: string | null
          duration?: number | null
          id?: string
          text?: string
          user_id?: string
          voice_id?: string | null
        }
        Relationships: []
      }
      generated_images: {
        Row: {
          created_at: string | null
          folder_id: string | null
          id: string
          image_url: string | null
          prompt: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          folder_id?: string | null
          id?: string
          image_url?: string | null
          prompt: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          folder_id?: string | null
          id?: string
          image_url?: string | null
          prompt?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "generated_images_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id"]
          },
        ]
      }
      generated_scripts: {
        Row: {
          agent_id: string | null
          content: string
          created_at: string | null
          credits_used: number
          duration: number
          id: string
          language: string
          model_used: string | null
          title: string
          user_id: string
        }
        Insert: {
          agent_id?: string | null
          content: string
          created_at?: string | null
          credits_used?: number
          duration?: number
          id?: string
          language?: string
          model_used?: string | null
          title: string
          user_id: string
        }
        Update: {
          agent_id?: string | null
          content?: string
          created_at?: string | null
          credits_used?: number
          duration?: number
          id?: string
          language?: string
          model_used?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "generated_scripts_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "script_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      generated_titles: {
        Row: {
          created_at: string | null
          explicacao: string | null
          folder_id: string | null
          formula: string | null
          id: string
          is_favorite: boolean | null
          is_used: boolean | null
          model_used: string | null
          pontuacao: number | null
          title_text: string
          user_id: string
          video_analysis_id: string | null
        }
        Insert: {
          created_at?: string | null
          explicacao?: string | null
          folder_id?: string | null
          formula?: string | null
          id?: string
          is_favorite?: boolean | null
          is_used?: boolean | null
          model_used?: string | null
          pontuacao?: number | null
          title_text: string
          user_id: string
          video_analysis_id?: string | null
        }
        Update: {
          created_at?: string | null
          explicacao?: string | null
          folder_id?: string | null
          formula?: string | null
          id?: string
          is_favorite?: boolean | null
          is_used?: boolean | null
          model_used?: string | null
          pontuacao?: number | null
          title_text?: string
          user_id?: string
          video_analysis_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "generated_titles_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generated_titles_video_analysis_id_fkey"
            columns: ["video_analysis_id"]
            isOneToOne: false
            referencedRelation: "analyzed_videos"
            referencedColumns: ["id"]
          },
        ]
      }
      monitored_channels: {
        Row: {
          channel_name: string | null
          channel_url: string
          created_at: string | null
          growth_rate: string | null
          id: string
          last_checked: string | null
          subscribers: string | null
          user_id: string
          videos_count: number | null
        }
        Insert: {
          channel_name?: string | null
          channel_url: string
          created_at?: string | null
          growth_rate?: string | null
          id?: string
          last_checked?: string | null
          subscribers?: string | null
          user_id: string
          videos_count?: number | null
        }
        Update: {
          channel_name?: string | null
          channel_url?: string
          created_at?: string | null
          growth_rate?: string | null
          id?: string
          last_checked?: string | null
          subscribers?: string | null
          user_id?: string
          videos_count?: number | null
        }
        Relationships: []
      }
      plan_permissions: {
        Row: {
          created_at: string | null
          id: string
          is_annual: boolean | null
          monthly_credits: number | null
          permissions: Json
          plan_name: string
          price_amount: number | null
          stripe_price_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_annual?: boolean | null
          monthly_credits?: number | null
          permissions?: Json
          plan_name: string
          price_amount?: number | null
          stripe_price_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_annual?: boolean | null
          monthly_credits?: number | null
          permissions?: Json
          plan_name?: string
          price_amount?: number | null
          stripe_price_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          credits: number | null
          email: string | null
          full_name: string | null
          id: string
          status: string | null
          storage_limit: number | null
          storage_used: number | null
          updated_at: string | null
          whatsapp: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          credits?: number | null
          email?: string | null
          full_name?: string | null
          id: string
          status?: string | null
          storage_limit?: number | null
          storage_used?: number | null
          updated_at?: string | null
          whatsapp?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          credits?: number | null
          email?: string | null
          full_name?: string | null
          id?: string
          status?: string | null
          storage_limit?: number | null
          storage_used?: number | null
          updated_at?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      reference_thumbnails: {
        Row: {
          channel_name: string | null
          created_at: string
          description: string | null
          extracted_prompt: string | null
          folder_id: string | null
          id: string
          image_url: string
          niche: string | null
          style_analysis: Json | null
          sub_niche: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          channel_name?: string | null
          created_at?: string
          description?: string | null
          extracted_prompt?: string | null
          folder_id?: string | null
          id?: string
          image_url: string
          niche?: string | null
          style_analysis?: Json | null
          sub_niche?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          channel_name?: string | null
          created_at?: string
          description?: string | null
          extracted_prompt?: string | null
          folder_id?: string | null
          id?: string
          image_url?: string
          niche?: string | null
          style_analysis?: Json | null
          sub_niche?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reference_thumbnails_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_prompts: {
        Row: {
          created_at: string | null
          folder_id: string | null
          id: string
          prompt: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          folder_id?: string | null
          id?: string
          prompt: string
          title: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          folder_id?: string | null
          id?: string
          prompt?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_prompts_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id"]
          },
        ]
      }
      script_agents: {
        Row: {
          based_on_title: string | null
          created_at: string
          formula: string | null
          formula_structure: Json | null
          id: string
          mental_triggers: string[] | null
          name: string
          niche: string | null
          sub_niche: string | null
          times_used: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          based_on_title?: string | null
          created_at?: string
          formula?: string | null
          formula_structure?: Json | null
          id?: string
          mental_triggers?: string[] | null
          name: string
          niche?: string | null
          sub_niche?: string | null
          times_used?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          based_on_title?: string | null
          created_at?: string
          formula?: string | null
          formula_structure?: Json | null
          id?: string
          mental_triggers?: string[] | null
          name?: string
          niche?: string | null
          sub_niche?: string | null
          times_used?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tags: {
        Row: {
          color: string
          created_at: string
          id: string
          name: string
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          name: string
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      title_tags: {
        Row: {
          created_at: string
          id: string
          tag_id: string
          title_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          tag_id: string
          title_id: string
        }
        Update: {
          created_at?: string
          id?: string
          tag_id?: string
          title_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "title_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "title_tags_title_id_fkey"
            columns: ["title_id"]
            isOneToOne: false
            referencedRelation: "generated_titles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_api_settings: {
        Row: {
          claude_api_key: string | null
          claude_validated: boolean | null
          created_at: string
          elevenlabs_api_key: string | null
          elevenlabs_validated: boolean | null
          gemini_api_key: string | null
          gemini_validated: boolean | null
          id: string
          openai_api_key: string | null
          openai_validated: boolean | null
          updated_at: string
          user_id: string
          youtube_api_key: string | null
          youtube_validated: boolean | null
        }
        Insert: {
          claude_api_key?: string | null
          claude_validated?: boolean | null
          created_at?: string
          elevenlabs_api_key?: string | null
          elevenlabs_validated?: boolean | null
          gemini_api_key?: string | null
          gemini_validated?: boolean | null
          id?: string
          openai_api_key?: string | null
          openai_validated?: boolean | null
          updated_at?: string
          user_id: string
          youtube_api_key?: string | null
          youtube_validated?: boolean | null
        }
        Update: {
          claude_api_key?: string | null
          claude_validated?: boolean | null
          created_at?: string
          elevenlabs_api_key?: string | null
          elevenlabs_validated?: boolean | null
          gemini_api_key?: string | null
          gemini_validated?: boolean | null
          id?: string
          openai_api_key?: string | null
          openai_validated?: boolean | null
          updated_at?: string
          user_id?: string
          youtube_api_key?: string | null
          youtube_validated?: boolean | null
        }
        Relationships: []
      }
      user_credits: {
        Row: {
          balance: number
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          balance?: number
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          balance?: number
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      video_analyses: {
        Row: {
          analysis_data: Json | null
          comments: number | null
          created_at: string | null
          ctr: number | null
          engagement_rate: number | null
          id: string
          likes: number | null
          thumbnail_url: string | null
          user_id: string
          video_title: string | null
          video_url: string
          views: number | null
        }
        Insert: {
          analysis_data?: Json | null
          comments?: number | null
          created_at?: string | null
          ctr?: number | null
          engagement_rate?: number | null
          id?: string
          likes?: number | null
          thumbnail_url?: string | null
          user_id: string
          video_title?: string | null
          video_url: string
          views?: number | null
        }
        Update: {
          analysis_data?: Json | null
          comments?: number | null
          created_at?: string | null
          ctr?: number | null
          engagement_rate?: number | null
          id?: string
          likes?: number | null
          thumbnail_url?: string | null
          user_id?: string
          video_title?: string | null
          video_url?: string
          views?: number | null
        }
        Relationships: []
      }
      video_tags: {
        Row: {
          created_at: string
          id: string
          tag_id: string
          video_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          tag_id: string
          video_id: string
        }
        Update: {
          created_at?: string
          id?: string
          tag_id?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_tags_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "analyzed_videos"
            referencedColumns: ["id"]
          },
        ]
      }
      viral_library: {
        Row: {
          created_at: string | null
          duration: string | null
          id: string
          likes: string | null
          notes: string | null
          title: string | null
          user_id: string
          video_url: string
          views: string | null
        }
        Insert: {
          created_at?: string | null
          duration?: string | null
          id?: string
          likes?: string | null
          notes?: string | null
          title?: string | null
          user_id: string
          video_url: string
          views?: string | null
        }
        Update: {
          created_at?: string | null
          duration?: string | null
          id?: string
          likes?: string | null
          notes?: string | null
          title?: string | null
          user_id?: string
          video_url?: string
          views?: string | null
        }
        Relationships: []
      }
      viral_thumbnails: {
        Row: {
          created_at: string
          headline: string | null
          id: string
          image_url: string
          niche: string | null
          prompt: string | null
          seo_description: string | null
          seo_tags: string | null
          style: string | null
          sub_niche: string | null
          user_id: string
          video_title: string
        }
        Insert: {
          created_at?: string
          headline?: string | null
          id?: string
          image_url: string
          niche?: string | null
          prompt?: string | null
          seo_description?: string | null
          seo_tags?: string | null
          style?: string | null
          sub_niche?: string | null
          user_id: string
          video_title: string
        }
        Update: {
          created_at?: string
          headline?: string | null
          id?: string
          image_url?: string
          niche?: string | null
          prompt?: string | null
          seo_description?: string | null
          seo_tags?: string | null
          style?: string | null
          sub_niche?: string | null
          user_id?: string
          video_title?: string
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
    }
    Enums: {
      app_role: "admin" | "pro" | "free"
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
      app_role: ["admin", "pro", "free"],
    },
  },
} as const

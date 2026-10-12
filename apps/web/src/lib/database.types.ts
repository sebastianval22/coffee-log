export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: { extensions?: Json; operationName?: string; query?: string; variables?: Json };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      bags: {
        Row: {
          altitude_m: number | null;
          created_at: string;
          farm: string | null;
          finish_prompt_snoozed_until: string | null;
          finished_at: string | null;
          flavor_tags: string[];
          id: string;
          label_notes: string[];
          name: string;
          notes: string | null;
          opened_at: string;
          origin_country: string | null;
          origin_region: string | null;
          photo_path: string;
          process: Database["public"]["Enums"]["process_t"] | null;
          rating: number | null;
          roast_level: Database["public"]["Enums"]["roast_t"] | null;
          roaster_id: string | null;
          search: unknown;
          search_text: string | null;
          updated_at: string;
          user_id: string;
          varieties: string[];
          would_buy_again: boolean | null;
        };
        ComputedFields: never;
        Insert: {
          altitude_m?: number | null;
          created_at?: string;
          farm?: string | null;
          finish_prompt_snoozed_until?: string | null;
          finished_at?: string | null;
          flavor_tags?: string[];
          id?: string;
          label_notes?: string[];
          name: string;
          notes?: string | null;
          opened_at?: string;
          origin_country?: string | null;
          origin_region?: string | null;
          photo_path: string;
          process?: Database["public"]["Enums"]["process_t"] | null;
          rating?: number | null;
          roast_level?: Database["public"]["Enums"]["roast_t"] | null;
          roaster_id?: string | null;
          search?: unknown;
          search_text?: string | null;
          updated_at?: string;
          user_id?: string;
          varieties?: string[];
          would_buy_again?: boolean | null;
        };
        Update: {
          altitude_m?: number | null;
          created_at?: string;
          farm?: string | null;
          finish_prompt_snoozed_until?: string | null;
          finished_at?: string | null;
          flavor_tags?: string[];
          id?: string;
          label_notes?: string[];
          name?: string;
          notes?: string | null;
          opened_at?: string;
          origin_country?: string | null;
          origin_region?: string | null;
          photo_path?: string;
          process?: Database["public"]["Enums"]["process_t"] | null;
          rating?: number | null;
          roast_level?: Database["public"]["Enums"]["roast_t"] | null;
          roaster_id?: string | null;
          search?: unknown;
          search_text?: string | null;
          updated_at?: string;
          user_id?: string;
          varieties?: string[];
          would_buy_again?: boolean | null;
        };
        Relationships: [
          {
            foreignKeyName: "bags_roaster_id_user_id_fkey";
            columns: ["roaster_id", "user_id"];
            isOneToOne: false;
            referencedRelation: "roasters";
            referencedColumns: ["id", "user_id"];
          },
        ];
      };
      cafe_visits: {
        Row: {
          cafe_id: string;
          coffee_name: string | null;
          created_at: string;
          drink: Database["public"]["Enums"]["method_t"];
          flavor_tags: string[];
          id: string;
          notes: string | null;
          origin_country: string | null;
          photo_path: string;
          process: Database["public"]["Enums"]["process_t"] | null;
          rating: number | null;
          roaster_id: string | null;
          search: unknown;
          search_text: string | null;
          updated_at: string;
          user_id: string;
          visited_at: string;
        };
        ComputedFields: never;
        Insert: {
          cafe_id: string;
          coffee_name?: string | null;
          created_at?: string;
          drink: Database["public"]["Enums"]["method_t"];
          flavor_tags?: string[];
          id?: string;
          notes?: string | null;
          origin_country?: string | null;
          photo_path: string;
          process?: Database["public"]["Enums"]["process_t"] | null;
          rating?: number | null;
          roaster_id?: string | null;
          search?: unknown;
          search_text?: string | null;
          updated_at?: string;
          user_id?: string;
          visited_at?: string;
        };
        Update: {
          cafe_id?: string;
          coffee_name?: string | null;
          created_at?: string;
          drink?: Database["public"]["Enums"]["method_t"];
          flavor_tags?: string[];
          id?: string;
          notes?: string | null;
          origin_country?: string | null;
          photo_path?: string;
          process?: Database["public"]["Enums"]["process_t"] | null;
          rating?: number | null;
          roaster_id?: string | null;
          search?: unknown;
          search_text?: string | null;
          updated_at?: string;
          user_id?: string;
          visited_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "cafe_visits_cafe_id_user_id_fkey";
            columns: ["cafe_id", "user_id"];
            isOneToOne: false;
            referencedRelation: "cafes";
            referencedColumns: ["id", "user_id"];
          },
          {
            foreignKeyName: "cafe_visits_roaster_id_user_id_fkey";
            columns: ["roaster_id", "user_id"];
            isOneToOne: false;
            referencedRelation: "roasters";
            referencedColumns: ["id", "user_id"];
          },
        ];
      };
      cafes: {
        Row: {
          address: string | null;
          city: string | null;
          created_at: string;
          id: string;
          name: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          address?: string | null;
          city?: string | null;
          created_at?: string;
          id?: string;
          name: string;
          user_id?: string;
        };
        Update: {
          address?: string | null;
          city?: string | null;
          created_at?: string;
          id?: string;
          name?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      cups: {
        Row: {
          bag_id: string;
          created_at: string;
          drunk_at: string;
          flavor_tags: string[];
          id: string;
          is_tasting: boolean | null;
          method: Database["public"]["Enums"]["method_t"] | null;
          notes: string | null;
          rating: number | null;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          bag_id: string;
          created_at?: string;
          drunk_at?: string;
          flavor_tags?: string[];
          id?: string;
          is_tasting?: never;
          method?: Database["public"]["Enums"]["method_t"] | null;
          notes?: string | null;
          rating?: number | null;
          user_id?: string;
        };
        Update: {
          bag_id?: string;
          created_at?: string;
          drunk_at?: string;
          flavor_tags?: string[];
          id?: string;
          is_tasting?: never;
          method?: Database["public"]["Enums"]["method_t"] | null;
          notes?: string | null;
          rating?: number | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "cups_bag_id_user_id_fkey";
            columns: ["bag_id", "user_id"];
            isOneToOne: false;
            referencedRelation: "bag_summary";
            referencedColumns: ["id", "user_id"];
          },
          {
            foreignKeyName: "cups_bag_id_user_id_fkey";
            columns: ["bag_id", "user_id"];
            isOneToOne: false;
            referencedRelation: "bags";
            referencedColumns: ["id", "user_id"];
          },
        ];
      };
      roasters: {
        Row: {
          city: string | null;
          country: string | null;
          created_at: string;
          id: string;
          name: string;
          user_id: string;
          website: string | null;
        };
        ComputedFields: never;
        Insert: {
          city?: string | null;
          country?: string | null;
          created_at?: string;
          id?: string;
          name: string;
          user_id?: string;
          website?: string | null;
        };
        Update: {
          city?: string | null;
          country?: string | null;
          created_at?: string;
          id?: string;
          name?: string;
          user_id?: string;
          website?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      bag_summary: {
        Row: {
          altitude_m: number | null;
          created_at: string | null;
          cup_count: number | null;
          farm: string | null;
          finish_prompt_snoozed_until: string | null;
          finished_at: string | null;
          flavor_tags: string[] | null;
          id: string | null;
          label_notes: string[] | null;
          last_cup_at: string | null;
          name: string | null;
          notes: string | null;
          opened_at: string | null;
          origin_country: string | null;
          origin_region: string | null;
          photo_path: string | null;
          process: Database["public"]["Enums"]["process_t"] | null;
          rating: number | null;
          roast_level: Database["public"]["Enums"]["roast_t"] | null;
          roaster_id: string | null;
          roaster_name: string | null;
          tasting_count: number | null;
          updated_at: string | null;
          user_id: string | null;
          varieties: string[] | null;
          would_buy_again: boolean | null;
        };
        ComputedFields: never;
        Relationships: [
          {
            foreignKeyName: "bags_roaster_id_user_id_fkey";
            columns: ["roaster_id", "user_id"];
            isOneToOne: false;
            referencedRelation: "roasters";
            referencedColumns: ["id", "user_id"];
          },
        ];
      };
      cafe_visit_summary: {
        Row: {
          cafe_city: string | null;
          cafe_id: string | null;
          cafe_name: string | null;
          coffee_name: string | null;
          created_at: string | null;
          drink: Database["public"]["Enums"]["method_t"] | null;
          flavor_tags: string[] | null;
          id: string | null;
          notes: string | null;
          origin_country: string | null;
          photo_path: string | null;
          process: Database["public"]["Enums"]["process_t"] | null;
          rating: number | null;
          roaster_id: string | null;
          roaster_name: string | null;
          updated_at: string | null;
          user_id: string | null;
          visited_at: string | null;
        };
        ComputedFields: never;
        Relationships: [
          {
            foreignKeyName: "cafe_visits_cafe_id_user_id_fkey";
            columns: ["cafe_id", "user_id"];
            isOneToOne: false;
            referencedRelation: "cafes";
            referencedColumns: ["id", "user_id"];
          },
          {
            foreignKeyName: "cafe_visits_roaster_id_user_id_fkey";
            columns: ["roaster_id", "user_id"];
            isOneToOne: false;
            referencedRelation: "roasters";
            referencedColumns: ["id", "user_id"];
          },
        ];
      };
      history_feed: {
        Row: {
          bag_id: string | null;
          cup_id: string | null;
          kind: string | null;
          occurred_at: string | null;
          photo_path: string | null;
          rating: number | null;
          subtitle: string | null;
          title: string | null;
          user_id: string | null;
          visit_id: string | null;
        };
        ComputedFields: never;
        Relationships: [];
      };
    };
    Functions: {
      normalize_name: { Args: { value: string }; Returns: string };
      search_bags: {
        Args: { q: string };
        Returns: {
          altitude_m: number | null;
          created_at: string | null;
          cup_count: number | null;
          farm: string | null;
          finish_prompt_snoozed_until: string | null;
          finished_at: string | null;
          flavor_tags: string[] | null;
          id: string | null;
          label_notes: string[] | null;
          last_cup_at: string | null;
          name: string | null;
          notes: string | null;
          opened_at: string | null;
          origin_country: string | null;
          origin_region: string | null;
          photo_path: string | null;
          process: Database["public"]["Enums"]["process_t"] | null;
          rating: number | null;
          roast_level: Database["public"]["Enums"]["roast_t"] | null;
          roaster_id: string | null;
          roaster_name: string | null;
          tasting_count: number | null;
          updated_at: string | null;
          user_id: string | null;
          varieties: string[] | null;
          would_buy_again: boolean | null;
        }[];
        SetofOptions: {
          from: "*";
          to: "bag_summary";
          isOneToOne: false;
          isSetofReturn: true;
        };
      };
      search_cafe_visits: {
        Args: { q: string };
        Returns: {
          cafe_city: string | null;
          cafe_id: string | null;
          cafe_name: string | null;
          coffee_name: string | null;
          created_at: string | null;
          drink: Database["public"]["Enums"]["method_t"] | null;
          flavor_tags: string[] | null;
          id: string | null;
          notes: string | null;
          origin_country: string | null;
          photo_path: string | null;
          process: Database["public"]["Enums"]["process_t"] | null;
          rating: number | null;
          roaster_id: string | null;
          roaster_name: string | null;
          updated_at: string | null;
          user_id: string | null;
          visited_at: string | null;
        }[];
        SetofOptions: {
          from: "*";
          to: "cafe_visit_summary";
          isOneToOne: false;
          isSetofReturn: true;
        };
      };
    };
    Enums: {
      method_t:
        | "espresso"
        | "v60"
        | "chemex"
        | "aeropress"
        | "french_press"
        | "moka"
        | "cold_brew"
        | "filter_machine"
        | "latte"
        | "cappuccino"
        | "flat_white"
        | "cortado"
        | "other";
      process_t: "washed" | "natural" | "honey" | "anaerobic" | "wet_hulled" | "other";
      roast_t: "light" | "medium_light" | "medium" | "medium_dark" | "dark";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      method_t: [
        "espresso",
        "v60",
        "chemex",
        "aeropress",
        "french_press",
        "moka",
        "cold_brew",
        "filter_machine",
        "latte",
        "cappuccino",
        "flat_white",
        "cortado",
        "other",
      ],
      process_t: ["washed", "natural", "honey", "anaerobic", "wet_hulled", "other"],
      roast_t: ["light", "medium_light", "medium", "medium_dark", "dark"],
    },
  },
} as const;

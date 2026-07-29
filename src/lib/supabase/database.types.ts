// Hand-authored to match supabase/schema.sql. If you use the Supabase CLI,
// you can regenerate this with `supabase gen types typescript` and it will
// slot in without further changes since it's only used for client typing.

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      workspaces: {
        Row: {
          id: string;
          slug: string;
          name: string;
          requires_organization: boolean;
          tracks_sale_type: boolean;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          requires_organization?: boolean;
          tracks_sale_type?: boolean;
          sort_order?: number;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["workspaces"]["Insert"]>;
        Relationships: [];
      };
      pipeline_stages: {
        Row: {
          id: string;
          workspace_id: string;
          key: string;
          label: string;
          color: string;
          sort_order: number;
          default_followup_days: number;
          default_followup_type: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          key: string;
          label: string;
          color?: string;
          sort_order?: number;
          default_followup_days?: number;
          default_followup_type?: string;
        };
        Update: Partial<Database["public"]["Tables"]["pipeline_stages"]["Insert"]>;
        Relationships: [];
      };
      organizations: {
        Row: {
          id: string;
          workspace_id: string;
          name: string;
          industry: string | null;
          website: string | null;
          city: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          name: string;
          industry?: string | null;
          website?: string | null;
          city?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["organizations"]["Insert"]>;
        Relationships: [];
      };
      contacts: {
        Row: {
          id: string;
          workspace_id: string;
          organization_id: string | null;
          name: string;
          title: string | null;
          email: string | null;
          phone: string | null;
          linkedin_url: string | null;
          is_primary: boolean;
          notes: string | null;
          status: string;
          industry: string | null;
          source: string | null;
          next_action_type: string | null;
          next_action_date: string | null;
          next_action_note: string | null;
          sale_type: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          organization_id?: string | null;
          name: string;
          title?: string | null;
          email?: string | null;
          phone?: string | null;
          linkedin_url?: string | null;
          is_primary?: boolean;
          notes?: string | null;
          status?: string;
          industry?: string | null;
          source?: string | null;
          next_action_type?: string | null;
          next_action_date?: string | null;
          next_action_note?: string | null;
          sale_type?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["contacts"]["Insert"]>;
        Relationships: [];
      };
      deals: {
        Row: {
          id: string;
          workspace_id: string;
          organization_id: string | null;
          primary_contact_id: string | null;
          title: string;
          stage: string;
          source: string | null;
          product_lines: string[];
          estimated_value_zar: number | null;
          probability: number;
          next_action_type: string | null;
          next_action_date: string | null;
          next_action_note: string | null;
          stage_entered_at: string;
          lost_reason: string | null;
          actual_value_zar: number | null;
          commission_rate_percent: number | null;
          commission_amount_zar: number | null;
          sale_type: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          organization_id?: string | null;
          primary_contact_id?: string | null;
          title: string;
          stage?: string;
          source?: string | null;
          product_lines?: string[];
          estimated_value_zar?: number | null;
          probability?: number;
          next_action_type?: string | null;
          next_action_date?: string | null;
          next_action_note?: string | null;
          stage_entered_at?: string;
          lost_reason?: string | null;
          actual_value_zar?: number | null;
          commission_rate_percent?: number | null;
          commission_amount_zar?: number | null;
          sale_type?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["deals"]["Insert"]>;
        Relationships: [];
      };
      commission_tiers: {
        Row: {
          id: string;
          workspace_id: string;
          sale_type: string | null;
          min_value: number;
          max_value: number | null;
          rate_percent: number | null;
          flat_amount: number | null;
          sort_order: number;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          sale_type?: string | null;
          min_value: number;
          max_value?: number | null;
          rate_percent?: number | null;
          flat_amount?: number | null;
          sort_order?: number;
        };
        Update: Partial<Database["public"]["Tables"]["commission_tiers"]["Insert"]>;
        Relationships: [];
      };
      activities: {
        Row: {
          id: string;
          deal_id: string | null;
          contact_id: string | null;
          type: string;
          notes: string;
          technical_tags: string[];
          occurred_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          deal_id?: string | null;
          contact_id?: string | null;
          type: string;
          notes?: string;
          technical_tags?: string[];
          occurred_at?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["activities"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

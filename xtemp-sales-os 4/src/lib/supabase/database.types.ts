// Hand-authored to match supabase/schema.sql. If you use the Supabase CLI,
// you can regenerate this with `supabase gen types typescript` and it will
// slot in without further changes since it's only used for client typing.

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          name: string;
          industry: string;
          website: string | null;
          city: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          industry: string;
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
          created_at: string;
        };
        Insert: {
          id?: string;
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
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["contacts"]["Insert"]>;
        Relationships: [];
      };
      deals: {
        Row: {
          id: string;
          organization_id: string;
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
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
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
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["deals"]["Insert"]>;
        Relationships: [];
      };
      commission_tiers: {
        Row: {
          id: string;
          min_value: number;
          max_value: number | null;
          rate_percent: number;
          sort_order: number;
        };
        Insert: {
          id?: string;
          min_value: number;
          max_value?: number | null;
          rate_percent: number;
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

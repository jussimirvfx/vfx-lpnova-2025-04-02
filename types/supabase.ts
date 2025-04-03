export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      leads: {
        Row: {
          id: string
          created_at: string
          name: string | null
          email: string | null
          phone: string | null
          company: string | null
          sales_team_size: string | null
          monthly_revenue: string | null
          segment: string | null
          message: string | null
          source: string
          country_code: string | null
          page_url: string | null
          form_type: string
          facebook_pixel_id: string | null
          lead_score: number | null
          qualified: boolean | null
          qualification_reason: string | null
          qualification_details: {
            segment: string;
            monthlyRevenue: string;
            salesTeamSize: string;
            baseScore: number;
            adjustments: string[];
            disqualificationReason?: string;
          } | null
        }
        Insert: {
          id?: string
          created_at?: string
          name?: string | null
          email?: string | null
          phone?: string | null
          company?: string | null
          sales_team_size?: string | null
          monthly_revenue?: string | null
          segment?: string | null
          message?: string | null
          source: string
          country_code?: string | null
          page_url?: string | null
          form_type: string
          facebook_pixel_id?: string | null
          lead_score?: number | null
          qualified?: boolean | null
          qualification_reason?: string | null
          qualification_details?: {
            segment: string;
            monthlyRevenue: string;
            salesTeamSize: string;
            baseScore: number;
            adjustments: string[];
            disqualificationReason?: string;
          } | null
        }
      }
    }
  }
}


import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

console.log('Supabase URL:', supabaseUrl ? 'Set' : 'Missing')
console.log('Supabase Anon Key:', supabaseAnonKey ? 'Set' : 'Missing')

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables:')
  console.error('VITE_SUPABASE_URL:', supabaseUrl)
  console.error('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? '[KEY_EXISTS]' : 'undefined')
  throw new Error('Missing Supabase environment variables. Please create .env.local file with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types based on our schema
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string | null
          full_name: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email?: string | null
          full_name?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          full_name?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      custom_parameter_sets: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          color: string
          icon: string
          created_at: string
          stage_progression_to_seed: number | null
          stage_progression_to_series_a: number | null
          stage_progression_to_series_b: number | null
          stage_progression_to_series_c: number | null
          stage_progression_to_ipo: number | null
          dilution_rates_seed: number | null
          dilution_rates_series_a: number | null
          dilution_rates_series_b: number | null
          dilution_rates_series_c: number | null
          dilution_rates_ipo: number | null
          loss_prob_pre_seed: number
          loss_prob_seed: number
          loss_prob_series_a: number
          loss_prob_series_b: number
          loss_prob_series_c: number
          loss_prob_ipo: number
          exit_valuations_pre_seed_min: number
          exit_valuations_pre_seed_max: number
          exit_valuations_seed_min: number
          exit_valuations_seed_max: number
          exit_valuations_series_a_min: number
          exit_valuations_series_a_max: number
          exit_valuations_series_b_min: number
          exit_valuations_series_b_max: number
          exit_valuations_series_c_min: number
          exit_valuations_series_c_max: number
          exit_valuations_ipo_min: number
          exit_valuations_ipo_max: number
          years_to_next_to_seed_min: number | null
          years_to_next_to_seed_max: number | null
          years_to_next_to_series_a_min: number | null
          years_to_next_to_series_a_max: number | null
          years_to_next_to_series_b_min: number | null
          years_to_next_to_series_b_max: number | null
          years_to_next_to_series_c_min: number | null
          years_to_next_to_series_c_max: number | null
          years_to_next_to_ipo_min: number | null
          years_to_next_to_ipo_max: number | null
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          color: string
          icon: string
          created_at?: string
          stage_progression_to_seed?: number | null
          stage_progression_to_series_a?: number | null
          stage_progression_to_series_b?: number | null
          stage_progression_to_series_c?: number | null
          stage_progression_to_ipo?: number | null
          dilution_rates_seed?: number | null
          dilution_rates_series_a?: number | null
          dilution_rates_series_b?: number | null
          dilution_rates_series_c?: number | null
          dilution_rates_ipo?: number | null
          loss_prob_pre_seed: number
          loss_prob_seed: number
          loss_prob_series_a: number
          loss_prob_series_b: number
          loss_prob_series_c: number
          loss_prob_ipo: number
          exit_valuations_pre_seed_min: number
          exit_valuations_pre_seed_max: number
          exit_valuations_seed_min: number
          exit_valuations_seed_max: number
          exit_valuations_series_a_min: number
          exit_valuations_series_a_max: number
          exit_valuations_series_b_min: number
          exit_valuations_series_b_max: number
          exit_valuations_series_c_min: number
          exit_valuations_series_c_max: number
          exit_valuations_ipo_min: number
          exit_valuations_ipo_max: number
          years_to_next_to_seed_min?: number | null
          years_to_next_to_seed_max?: number | null
          years_to_next_to_series_a_min?: number | null
          years_to_next_to_series_a_max?: number | null
          years_to_next_to_series_b_min?: number | null
          years_to_next_to_series_b_max?: number | null
          years_to_next_to_series_c_min?: number | null
          years_to_next_to_series_c_max?: number | null
          years_to_next_to_ipo_min?: number | null
          years_to_next_to_ipo_max?: number | null
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          color?: string
          icon?: string
          created_at?: string
          stage_progression_to_seed?: number | null
          stage_progression_to_series_a?: number | null
          stage_progression_to_series_b?: number | null
          stage_progression_to_series_c?: number | null
          stage_progression_to_ipo?: number | null
          dilution_rates_seed?: number | null
          dilution_rates_series_a?: number | null
          dilution_rates_series_b?: number | null
          dilution_rates_series_c?: number | null
          dilution_rates_ipo?: number | null
          loss_prob_pre_seed?: number
          loss_prob_seed?: number
          loss_prob_series_a?: number
          loss_prob_series_b?: number
          loss_prob_series_c?: number
          loss_prob_ipo?: number
          exit_valuations_pre_seed_min?: number
          exit_valuations_pre_seed_max?: number
          exit_valuations_seed_min?: number
          exit_valuations_seed_max?: number
          exit_valuations_series_a_min?: number
          exit_valuations_series_a_max?: number
          exit_valuations_series_b_min?: number
          exit_valuations_series_b_max?: number
          exit_valuations_series_c_min?: number
          exit_valuations_series_c_max?: number
          exit_valuations_ipo_min?: number
          exit_valuations_ipo_max?: number
          years_to_next_to_seed_min?: number | null
          years_to_next_to_seed_max?: number | null
          years_to_next_to_series_a_min?: number | null
          years_to_next_to_series_a_max?: number | null
          years_to_next_to_series_b_min?: number | null
          years_to_next_to_series_b_max?: number | null
          years_to_next_to_series_c_min?: number | null
          years_to_next_to_series_c_max?: number | null
          years_to_next_to_ipo_min?: number | null
          years_to_next_to_ipo_max?: number | null
        }
      }
      portfolio_investments: {
        Row: {
          id: string
          user_id: string
          company_name: string
          field: string
          region: string
          entry_stage: string
          entry_valuation: number
          check_size: number
          entry_date: string
          current_stage: string
          use_presets: boolean
          custom_parameter_set_id: string | null
          stage_progression_to_seed: number | null
          stage_progression_to_series_a: number | null
          stage_progression_to_series_b: number | null
          stage_progression_to_series_c: number | null
          stage_progression_to_ipo: number | null
          dilution_rates_seed: number | null
          dilution_rates_series_a: number | null
          dilution_rates_series_b: number | null
          dilution_rates_series_c: number | null
          dilution_rates_ipo: number | null
          exit_valuations_pre_seed_min: number
          exit_valuations_pre_seed_max: number
          exit_valuations_seed_min: number
          exit_valuations_seed_max: number
          exit_valuations_series_a_min: number
          exit_valuations_series_a_max: number
          exit_valuations_series_b_min: number
          exit_valuations_series_b_max: number
          exit_valuations_series_c_min: number
          exit_valuations_series_c_max: number
          exit_valuations_ipo_min: number
          exit_valuations_ipo_max: number
          loss_prob_pre_seed: number
          loss_prob_seed: number
          loss_prob_series_a: number
          loss_prob_series_b: number
          loss_prob_series_c: number
          loss_prob_ipo: number
          years_to_next_to_seed_min: number | null
          years_to_next_to_seed_max: number | null
          years_to_next_to_series_a_min: number | null
          years_to_next_to_series_a_max: number | null
          years_to_next_to_series_b_min: number | null
          years_to_next_to_series_b_max: number | null
          years_to_next_to_series_c_min: number | null
          years_to_next_to_series_c_max: number | null
          years_to_next_to_ipo_min: number | null
          years_to_next_to_ipo_max: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          company_name: string
          field: string
          region: string
          entry_stage: string
          entry_valuation: number
          check_size: number
          entry_date: string
          current_stage: string
          use_presets?: boolean
          custom_parameter_set_id?: string | null
          stage_progression_to_seed?: number | null
          stage_progression_to_series_a?: number | null
          stage_progression_to_series_b?: number | null
          stage_progression_to_series_c?: number | null
          stage_progression_to_ipo?: number | null
          dilution_rates_seed?: number | null
          dilution_rates_series_a?: number | null
          dilution_rates_series_b?: number | null
          dilution_rates_series_c?: number | null
          dilution_rates_ipo?: number | null
          exit_valuations_pre_seed_min: number
          exit_valuations_pre_seed_max: number
          exit_valuations_seed_min: number
          exit_valuations_seed_max: number
          exit_valuations_series_a_min: number
          exit_valuations_series_a_max: number
          exit_valuations_series_b_min: number
          exit_valuations_series_b_max: number
          exit_valuations_series_c_min: number
          exit_valuations_series_c_max: number
          exit_valuations_ipo_min: number
          exit_valuations_ipo_max: number
          loss_prob_pre_seed: number
          loss_prob_seed: number
          loss_prob_series_a: number
          loss_prob_series_b: number
          loss_prob_series_c: number
          loss_prob_ipo: number
          years_to_next_to_seed_min?: number | null
          years_to_next_to_seed_max?: number | null
          years_to_next_to_series_a_min?: number | null
          years_to_next_to_series_a_max?: number | null
          years_to_next_to_series_b_min?: number | null
          years_to_next_to_series_b_max?: number | null
          years_to_next_to_series_c_min?: number | null
          years_to_next_to_series_c_max?: number | null
          years_to_next_to_ipo_min?: number | null
          years_to_next_to_ipo_max?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          company_name?: string
          field?: string
          region?: string
          entry_stage?: string
          entry_valuation?: number
          check_size?: number
          entry_date?: string
          current_stage?: string
          use_presets?: boolean
          custom_parameter_set_id?: string | null
          stage_progression_to_seed?: number | null
          stage_progression_to_series_a?: number | null
          stage_progression_to_series_b?: number | null
          stage_progression_to_series_c?: number | null
          stage_progression_to_ipo?: number | null
          dilution_rates_seed?: number | null
          dilution_rates_series_a?: number | null
          dilution_rates_series_b?: number | null
          dilution_rates_series_c?: number | null
          dilution_rates_ipo?: number | null
          exit_valuations_pre_seed_min?: number
          exit_valuations_pre_seed_max?: number
          exit_valuations_seed_min?: number
          exit_valuations_seed_max?: number
          exit_valuations_series_a_min?: number
          exit_valuations_series_a_max?: number
          exit_valuations_series_b_min?: number
          exit_valuations_series_b_max?: number
          exit_valuations_series_c_min?: number
          exit_valuations_series_c_max?: number
          exit_valuations_ipo_min?: number
          exit_valuations_ipo_max?: number
          loss_prob_pre_seed?: number
          loss_prob_seed?: number
          loss_prob_series_a?: number
          loss_prob_series_b?: number
          loss_prob_series_c?: number
          loss_prob_ipo?: number
          years_to_next_to_seed_min?: number | null
          years_to_next_to_seed_max?: number | null
          years_to_next_to_series_a_min?: number | null
          years_to_next_to_series_a_max?: number | null
          years_to_next_to_series_b_min?: number | null
          years_to_next_to_series_b_max?: number | null
          years_to_next_to_series_c_min?: number | null
          years_to_next_to_series_c_max?: number | null
          years_to_next_to_ipo_min?: number | null
          years_to_next_to_ipo_max?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      simulation_results: {
        Row: {
          id: string
          user_id: string
          simulation_name: string | null
          simulation_params: any
          results: any
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          simulation_name?: string | null
          simulation_params: any
          results: any
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          simulation_name?: string | null
          simulation_params?: any
          results?: any
          created_at?: string
        }
      }
      shared_simulations: {
        Row: {
          id: string
          sender_id: string
          recipient_id: string
          sender_email: string
          recipient_email: string
          sender_name: string
          portfolio_data: any
          simulation_params: any
          custom_sets: any
          title: string | null
          description: string | null
          is_read: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          sender_id: string
          recipient_id: string
          sender_email: string
          recipient_email: string
          sender_name: string
          portfolio_data: any
          simulation_params: any
          custom_sets?: any
          title?: string | null
          description?: string | null
          is_read?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          sender_id?: string
          recipient_id?: string
          sender_email?: string
          recipient_email?: string
          sender_name?: string
          portfolio_data?: any
          simulation_params?: any
          custom_sets?: any
          title?: string | null
          description?: string | null
          is_read?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      accounts: {
        Row: {
          id: string
          email: string
          full_name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}

// Types for our accounts table
export interface Account {
  id: string
  email: string
  full_name: string
  created_at: string
  updated_at: string
} 
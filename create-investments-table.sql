-- Create portfolio_investments table
CREATE TABLE IF NOT EXISTS public.portfolio_investments (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  company_name TEXT NOT NULL,
  field TEXT NOT NULL,
  region TEXT NOT NULL,
  entry_stage TEXT NOT NULL,
  entry_valuation DECIMAL NOT NULL,
  check_size DECIMAL NOT NULL,
  entry_date DATE NOT NULL,
  current_stage TEXT NOT NULL,
  use_presets BOOLEAN DEFAULT true,
  custom_parameter_set_id TEXT,
  
  -- Stage progression rates
  stage_progression_to_seed DECIMAL,
  stage_progression_to_series_a DECIMAL,
  stage_progression_to_series_b DECIMAL,
  stage_progression_to_series_c DECIMAL,
  stage_progression_to_ipo DECIMAL,
  
  -- Dilution rates
  dilution_rates_seed DECIMAL,
  dilution_rates_series_a DECIMAL,
  dilution_rates_series_b DECIMAL,
  dilution_rates_series_c DECIMAL,
  dilution_rates_ipo DECIMAL,
  
  -- Exit valuations (min/max ranges)
  exit_valuations_pre_seed_min DECIMAL NOT NULL,
  exit_valuations_pre_seed_max DECIMAL NOT NULL,
  exit_valuations_seed_min DECIMAL NOT NULL,
  exit_valuations_seed_max DECIMAL NOT NULL,
  exit_valuations_series_a_min DECIMAL NOT NULL,
  exit_valuations_series_a_max DECIMAL NOT NULL,
  exit_valuations_series_b_min DECIMAL NOT NULL,
  exit_valuations_series_b_max DECIMAL NOT NULL,
  exit_valuations_series_c_min DECIMAL NOT NULL,
  exit_valuations_series_c_max DECIMAL NOT NULL,
  exit_valuations_ipo_min DECIMAL NOT NULL,
  exit_valuations_ipo_max DECIMAL NOT NULL,
  
  -- Loss probabilities
  loss_prob_pre_seed DECIMAL NOT NULL,
  loss_prob_seed DECIMAL NOT NULL,
  loss_prob_series_a DECIMAL NOT NULL,
  loss_prob_series_b DECIMAL NOT NULL,
  loss_prob_series_c DECIMAL NOT NULL,
  loss_prob_ipo DECIMAL NOT NULL,
  
  -- Years to next stage (min/max ranges, nullable for some stages)
  years_to_next_to_seed_min DECIMAL,
  years_to_next_to_seed_max DECIMAL,
  years_to_next_to_series_a_min DECIMAL,
  years_to_next_to_series_a_max DECIMAL,
  years_to_next_to_series_b_min DECIMAL,
  years_to_next_to_series_b_max DECIMAL,
  years_to_next_to_series_c_min DECIMAL,
  years_to_next_to_series_c_max DECIMAL,
  years_to_next_to_ipo_min DECIMAL,
  years_to_next_to_ipo_max DECIMAL,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.portfolio_investments ENABLE ROW LEVEL SECURITY;

-- Create policies for portfolio_investments table
CREATE POLICY "Users can view own investments" 
  ON public.portfolio_investments FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own investments" 
  ON public.portfolio_investments FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own investments" 
  ON public.portfolio_investments FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own investments" 
  ON public.portfolio_investments FOR DELETE 
  USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER handle_investments_updated_at
  BEFORE UPDATE ON public.portfolio_investments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create index for better performance
CREATE INDEX IF NOT EXISTS portfolio_investments_user_id_idx ON public.portfolio_investments(user_id);
CREATE INDEX IF NOT EXISTS portfolio_investments_created_at_idx ON public.portfolio_investments(created_at); 
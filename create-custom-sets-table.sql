-- Create custom_parameter_sets table
CREATE TABLE IF NOT EXISTS public.custom_parameter_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT NOT NULL,
  icon TEXT NOT NULL,
  
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
  
  -- Loss probabilities
  loss_prob_pre_seed DECIMAL NOT NULL,
  loss_prob_seed DECIMAL NOT NULL,
  loss_prob_series_a DECIMAL NOT NULL,
  loss_prob_series_b DECIMAL NOT NULL,
  loss_prob_series_c DECIMAL NOT NULL,
  loss_prob_ipo DECIMAL NOT NULL,
  
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
ALTER TABLE public.custom_parameter_sets ENABLE ROW LEVEL SECURITY;

-- Create policies for custom_parameter_sets table
CREATE POLICY "Users can view own custom sets" 
  ON public.custom_parameter_sets FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own custom sets" 
  ON public.custom_parameter_sets FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own custom sets" 
  ON public.custom_parameter_sets FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own custom sets" 
  ON public.custom_parameter_sets FOR DELETE 
  USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER handle_custom_sets_updated_at
  BEFORE UPDATE ON public.custom_parameter_sets
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create index for better performance
CREATE INDEX IF NOT EXISTS custom_parameter_sets_user_id_idx ON public.custom_parameter_sets(user_id);
CREATE INDEX IF NOT EXISTS custom_parameter_sets_created_at_idx ON public.custom_parameter_sets(created_at); 
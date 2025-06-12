-- Complete Database Setup for VC Portfolio Simulator
-- This script creates all tables needed for the application

-- =========================================
-- 1. ACCOUNTS TABLE
-- =========================================

-- Drop existing accounts table and related objects
DROP TABLE IF EXISTS accounts CASCADE;
DROP TRIGGER IF EXISTS create_account_profile_trigger ON auth.users;
DROP FUNCTION IF EXISTS create_account_profile();
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Create accounts table with proper Supabase Auth integration
CREATE TABLE accounts (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on email for faster lookups
CREATE INDEX idx_accounts_email ON accounts(email);

-- Enable Row Level Security
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

-- Policies for accounts
CREATE POLICY "Users can view own account" ON accounts
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own account" ON accounts
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own account" ON accounts
    FOR INSERT WITH CHECK (auth.uid() = id);

-- =========================================
-- 2. PORTFOLIO INVESTMENTS TABLE
-- =========================================

-- Drop existing portfolio investments table
DROP TABLE IF EXISTS portfolio_investments CASCADE;

-- Create portfolio investments table
CREATE TABLE portfolio_investments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    company_name VARCHAR(255) NOT NULL,
    field VARCHAR(100) NOT NULL,
    region VARCHAR(100) NOT NULL,
    entry_stage VARCHAR(50) NOT NULL,
    entry_valuation DECIMAL(10,2) NOT NULL,
    check_size DECIMAL(10,2) NOT NULL,
    entry_date DATE NOT NULL,
    current_stage VARCHAR(50) NOT NULL,
    use_presets BOOLEAN DEFAULT true,
    custom_parameter_set_id UUID,
    
    -- Stage progression probabilities
    stage_progression_to_seed DECIMAL(5,2),
    stage_progression_to_series_a DECIMAL(5,2),
    stage_progression_to_series_b DECIMAL(5,2),
    stage_progression_to_series_c DECIMAL(5,2),
    stage_progression_to_ipo DECIMAL(5,2),
    
    -- Dilution rates
    dilution_rates_seed DECIMAL(5,2),
    dilution_rates_series_a DECIMAL(5,2),
    dilution_rates_series_b DECIMAL(5,2),
    dilution_rates_series_c DECIMAL(5,2),
    dilution_rates_ipo DECIMAL(5,2),
    
    -- Exit valuations (min/max pairs)
    exit_valuations_pre_seed_min DECIMAL(10,2),
    exit_valuations_pre_seed_max DECIMAL(10,2),
    exit_valuations_seed_min DECIMAL(10,2),
    exit_valuations_seed_max DECIMAL(10,2),
    exit_valuations_series_a_min DECIMAL(10,2),
    exit_valuations_series_a_max DECIMAL(10,2),
    exit_valuations_series_b_min DECIMAL(10,2),
    exit_valuations_series_b_max DECIMAL(10,2),
    exit_valuations_series_c_min DECIMAL(10,2),
    exit_valuations_series_c_max DECIMAL(10,2),
    exit_valuations_ipo_min DECIMAL(10,2),
    exit_valuations_ipo_max DECIMAL(10,2),
    
    -- Loss probabilities
    loss_prob_pre_seed DECIMAL(5,2),
    loss_prob_seed DECIMAL(5,2),
    loss_prob_series_a DECIMAL(5,2),
    loss_prob_series_b DECIMAL(5,2),
    loss_prob_series_c DECIMAL(5,2),
    loss_prob_ipo DECIMAL(5,2),
    
    -- Years to next stage (min/max pairs)
    years_to_next_to_seed_min DECIMAL(3,1),
    years_to_next_to_seed_max DECIMAL(3,1),
    years_to_next_to_series_a_min DECIMAL(3,1),
    years_to_next_to_series_a_max DECIMAL(3,1),
    years_to_next_to_series_b_min DECIMAL(3,1),
    years_to_next_to_series_b_max DECIMAL(3,1),
    years_to_next_to_series_c_min DECIMAL(3,1),
    years_to_next_to_series_c_max DECIMAL(3,1),
    years_to_next_to_ipo_min DECIMAL(3,1),
    years_to_next_to_ipo_max DECIMAL(3,1),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for portfolio investments
CREATE INDEX idx_portfolio_investments_user_id ON portfolio_investments(user_id);
CREATE INDEX idx_portfolio_investments_field ON portfolio_investments(field);
CREATE INDEX idx_portfolio_investments_created_at ON portfolio_investments(created_at);

-- Enable RLS for portfolio investments
ALTER TABLE portfolio_investments ENABLE ROW LEVEL SECURITY;

-- Policies for portfolio investments
CREATE POLICY "Users can view own investments" ON portfolio_investments
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own investments" ON portfolio_investments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own investments" ON portfolio_investments
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own investments" ON portfolio_investments
    FOR DELETE USING (auth.uid() = user_id);

-- =========================================
-- 3. CUSTOM PARAMETER SETS TABLE
-- =========================================

-- Drop existing custom parameter sets table
DROP TABLE IF EXISTS custom_parameter_sets CASCADE;

-- Create custom parameter sets table
CREATE TABLE custom_parameter_sets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    color VARCHAR(50) NOT NULL,
    icon VARCHAR(50) NOT NULL,
    
    -- Stage progression probabilities
    stage_progression_to_seed DECIMAL(5,2) NOT NULL,
    stage_progression_to_series_a DECIMAL(5,2) NOT NULL,
    stage_progression_to_series_b DECIMAL(5,2) NOT NULL,
    stage_progression_to_series_c DECIMAL(5,2) NOT NULL,
    stage_progression_to_ipo DECIMAL(5,2) NOT NULL,
    
    -- Dilution rates
    dilution_rates_seed DECIMAL(5,2) NOT NULL,
    dilution_rates_series_a DECIMAL(5,2) NOT NULL,
    dilution_rates_series_b DECIMAL(5,2) NOT NULL,
    dilution_rates_series_c DECIMAL(5,2) NOT NULL,
    dilution_rates_ipo DECIMAL(5,2) NOT NULL,
    
    -- Loss probabilities
    loss_prob_pre_seed DECIMAL(5,2) NOT NULL,
    loss_prob_seed DECIMAL(5,2) NOT NULL,
    loss_prob_series_a DECIMAL(5,2) NOT NULL,
    loss_prob_series_b DECIMAL(5,2) NOT NULL,
    loss_prob_series_c DECIMAL(5,2) NOT NULL,
    loss_prob_ipo DECIMAL(5,2) NOT NULL,
    
    -- Exit valuations (min/max pairs)
    exit_valuations_pre_seed_min DECIMAL(10,2) NOT NULL,
    exit_valuations_pre_seed_max DECIMAL(10,2) NOT NULL,
    exit_valuations_seed_min DECIMAL(10,2) NOT NULL,
    exit_valuations_seed_max DECIMAL(10,2) NOT NULL,
    exit_valuations_series_a_min DECIMAL(10,2) NOT NULL,
    exit_valuations_series_a_max DECIMAL(10,2) NOT NULL,
    exit_valuations_series_b_min DECIMAL(10,2) NOT NULL,
    exit_valuations_series_b_max DECIMAL(10,2) NOT NULL,
    exit_valuations_series_c_min DECIMAL(10,2) NOT NULL,
    exit_valuations_series_c_max DECIMAL(10,2) NOT NULL,
    exit_valuations_ipo_min DECIMAL(10,2) NOT NULL,
    exit_valuations_ipo_max DECIMAL(10,2) NOT NULL,
    
    -- Years to next stage (min/max pairs)
    years_to_next_to_seed_min DECIMAL(3,1),
    years_to_next_to_seed_max DECIMAL(3,1),
    years_to_next_to_series_a_min DECIMAL(3,1),
    years_to_next_to_series_a_max DECIMAL(3,1),
    years_to_next_to_series_b_min DECIMAL(3,1),
    years_to_next_to_series_b_max DECIMAL(3,1),
    years_to_next_to_series_c_min DECIMAL(3,1),
    years_to_next_to_series_c_max DECIMAL(3,1),
    years_to_next_to_ipo_min DECIMAL(3,1),
    years_to_next_to_ipo_max DECIMAL(3,1),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for custom parameter sets
CREATE INDEX idx_custom_parameter_sets_user_id ON custom_parameter_sets(user_id);
CREATE INDEX idx_custom_parameter_sets_name ON custom_parameter_sets(name);
CREATE INDEX idx_custom_parameter_sets_created_at ON custom_parameter_sets(created_at);

-- Enable RLS for custom parameter sets
ALTER TABLE custom_parameter_sets ENABLE ROW LEVEL SECURITY;

-- Policies for custom parameter sets
CREATE POLICY "Users can view own parameter sets" ON custom_parameter_sets
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own parameter sets" ON custom_parameter_sets
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own parameter sets" ON custom_parameter_sets
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own parameter sets" ON custom_parameter_sets
    FOR DELETE USING (auth.uid() = user_id);

-- =========================================
-- 4. SHARED SIMULATIONS TABLE
-- =========================================

-- Drop existing shared simulations table
DROP TABLE IF EXISTS shared_simulations CASCADE;

-- Create shared_simulations table
CREATE TABLE shared_simulations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_email TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  
  -- Simulation data
  portfolio_data JSONB NOT NULL,        -- Array of portfolio investments
  simulation_params JSONB NOT NULL,     -- Simulation parameters
  custom_sets JSONB,                    -- Custom parameter sets used
  
  -- Metadata
  title TEXT,                           -- Optional title for the shared simulation
  description TEXT,                     -- Optional description
  is_read BOOLEAN DEFAULT false,        -- Whether recipient has viewed the simulation
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_shared_simulations_sender_id ON shared_simulations(sender_id);
CREATE INDEX idx_shared_simulations_recipient_id ON shared_simulations(recipient_id);
CREATE INDEX idx_shared_simulations_recipient_email ON shared_simulations(recipient_email);
CREATE INDEX idx_shared_simulations_created_at ON shared_simulations(created_at);
CREATE INDEX idx_shared_simulations_is_read ON shared_simulations(is_read);

-- Enable RLS (Row Level Security)
ALTER TABLE shared_simulations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for shared simulations
CREATE POLICY "Users can view simulations they sent" ON shared_simulations
  FOR SELECT USING (auth.uid() = sender_id);

CREATE POLICY "Users can view simulations shared with them" ON shared_simulations
  FOR SELECT USING (auth.uid() = recipient_id);

CREATE POLICY "Users can insert their own shared simulations" ON shared_simulations
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Recipients can update read status" ON shared_simulations
  FOR UPDATE USING (auth.uid() = recipient_id)
  WITH CHECK (auth.uid() = recipient_id);

CREATE POLICY "Senders can delete their shared simulations" ON shared_simulations
  FOR DELETE USING (auth.uid() = sender_id);

-- =========================================
-- 5. SIMULATION RESULTS TABLE (Optional)
-- =========================================

-- Drop existing simulation results table
DROP TABLE IF EXISTS simulation_results CASCADE;

-- Create simulation results table for saving simulation outcomes
CREATE TABLE simulation_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    portfolio_name VARCHAR(255),
    simulation_params JSONB NOT NULL, -- Store simulation parameters
    portfolio_data JSONB NOT NULL,    -- Store portfolio investments data
    results_data JSONB NOT NULL,      -- Store simulation results
    total_fund_size DECIMAL(12,2),
    expected_return DECIMAL(12,2),
    irr DECIMAL(5,2),
    multiple DECIMAL(5,2),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for simulation results
CREATE INDEX idx_simulation_results_user_id ON simulation_results(user_id);
CREATE INDEX idx_simulation_results_created_at ON simulation_results(created_at);
CREATE INDEX idx_simulation_results_portfolio_name ON simulation_results(portfolio_name);

-- Enable RLS for simulation results
ALTER TABLE simulation_results ENABLE ROW LEVEL SECURITY;

-- Policies for simulation results
CREATE POLICY "Users can view own simulation results" ON simulation_results
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own simulation results" ON simulation_results
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own simulation results" ON simulation_results
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own simulation results" ON simulation_results
    FOR DELETE USING (auth.uid() = user_id);

-- =========================================
-- 6. SHARED FUNCTIONS AND TRIGGERS
-- =========================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to automatically update updated_at
CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE
    ON accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_portfolio_investments_updated_at BEFORE UPDATE
    ON portfolio_investments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_custom_parameter_sets_updated_at BEFORE UPDATE
    ON custom_parameter_sets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shared_simulations_updated_at BEFORE UPDATE
    ON shared_simulations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically create account profile when user signs up
CREATE OR REPLACE FUNCTION create_account_profile()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO accounts (id, email, full_name)
    VALUES (
        NEW.id, 
        NEW.email, 
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
    );
    RETURN NEW;
EXCEPTION
    WHEN others THEN
        -- If there's an error (like duplicate), just continue
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create account profile on signup
CREATE OR REPLACE TRIGGER create_account_profile_trigger
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION create_account_profile();

-- =========================================
-- 7. FOREIGN KEY CONSTRAINTS
-- =========================================

-- Add foreign key constraint for custom parameter sets in portfolio investments
ALTER TABLE portfolio_investments 
ADD CONSTRAINT fk_portfolio_investments_custom_parameter_set 
FOREIGN KEY (custom_parameter_set_id) REFERENCES custom_parameter_sets(id) 
ON DELETE SET NULL;

-- =========================================
-- 8. SAMPLE DATA (Optional - Remove if not needed)
-- =========================================

-- You can uncomment this section to add sample data for testing
/*
-- Sample custom parameter set (will be added for each user when they sign up)
INSERT INTO custom_parameter_sets (
    user_id, name, description, color, icon,
    stage_progression_to_seed, stage_progression_to_series_a, stage_progression_to_series_b, 
    stage_progression_to_series_c, stage_progression_to_ipo,
    dilution_rates_seed, dilution_rates_series_a, dilution_rates_series_b, 
    dilution_rates_series_c, dilution_rates_ipo,
    loss_prob_pre_seed, loss_prob_seed, loss_prob_series_a, 
    loss_prob_series_b, loss_prob_series_c, loss_prob_ipo,
    exit_valuations_pre_seed_min, exit_valuations_pre_seed_max,
    exit_valuations_seed_min, exit_valuations_seed_max,
    exit_valuations_series_a_min, exit_valuations_series_a_max,
    exit_valuations_series_b_min, exit_valuations_series_b_max,
    exit_valuations_series_c_min, exit_valuations_series_c_max,
    exit_valuations_ipo_min, exit_valuations_ipo_max
) VALUES (
    '00000000-0000-0000-0000-000000000000', 'Conservative Tech', 'Lower risk technology investments', 'blue', 'shield',
    85.0, 70.0, 45.0, 25.0, 8.0,
    15.0, 20.0, 25.0, 30.0, 10.0,
    60.0, 45.0, 30.0, 20.0, 15.0, 5.0,
    5.0, 15.0, 20.0, 50.0, 100.0, 300.0, 300.0, 800.0, 800.0, 2000.0, 2000.0, 5000.0
);
*/

-- =========================================
-- 9. FINAL VERIFICATION
-- =========================================

-- Show all created tables
SELECT 
    schemaname,
    tablename,
    tableowner,
    hasindexes,
    hasrules,
    hastriggers
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('accounts', 'portfolio_investments', 'custom_parameter_sets', 'simulation_results', 'shared_simulations')
ORDER BY tablename; 
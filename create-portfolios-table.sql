-- Create portfolios table
CREATE TABLE IF NOT EXISTS portfolios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, name) -- Ensure unique portfolio names per user
);

-- Add portfolio_id to portfolio_investments table
ALTER TABLE portfolio_investments 
ADD COLUMN IF NOT EXISTS portfolio_id UUID REFERENCES portfolios(id) ON DELETE CASCADE;

-- Add portfolio_id to custom_parameter_sets table  
ALTER TABLE custom_parameter_sets 
ADD COLUMN IF NOT EXISTS portfolio_id UUID REFERENCES portfolios(id) ON DELETE CASCADE;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_portfolios_user_id ON portfolios(user_id);
CREATE INDEX IF NOT EXISTS idx_portfolios_updated_at ON portfolios(updated_at);
CREATE INDEX IF NOT EXISTS idx_portfolio_investments_portfolio_id ON portfolio_investments(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_custom_parameter_sets_portfolio_id ON custom_parameter_sets(portfolio_id);

-- Enable RLS (Row Level Security)
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for portfolios
CREATE POLICY "Users can view their own portfolios" ON portfolios
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own portfolios" ON portfolios
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own portfolios" ON portfolios
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own portfolios" ON portfolios
  FOR DELETE USING (auth.uid() = user_id);

-- Update existing RLS policies for portfolio_investments to include portfolio access
DROP POLICY IF EXISTS "Users can view their own investments" ON portfolio_investments;
CREATE POLICY "Users can view their own investments" ON portfolio_investments
  FOR SELECT USING (
    auth.uid() = user_id OR 
    (portfolio_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM portfolios WHERE id = portfolio_id AND user_id = auth.uid()
    ))
  );

DROP POLICY IF EXISTS "Users can insert their own investments" ON portfolio_investments;
CREATE POLICY "Users can insert their own investments" ON portfolio_investments
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND 
    (portfolio_id IS NULL OR EXISTS (
      SELECT 1 FROM portfolios WHERE id = portfolio_id AND user_id = auth.uid()
    ))
  );

DROP POLICY IF EXISTS "Users can update their own investments" ON portfolio_investments;
CREATE POLICY "Users can update their own investments" ON portfolio_investments
  FOR UPDATE USING (
    auth.uid() = user_id AND 
    (portfolio_id IS NULL OR EXISTS (
      SELECT 1 FROM portfolios WHERE id = portfolio_id AND user_id = auth.uid()
    ))
  );

DROP POLICY IF EXISTS "Users can delete their own investments" ON portfolio_investments;
CREATE POLICY "Users can delete their own investments" ON portfolio_investments
  FOR DELETE USING (
    auth.uid() = user_id AND 
    (portfolio_id IS NULL OR EXISTS (
      SELECT 1 FROM portfolios WHERE id = portfolio_id AND user_id = auth.uid()
    ))
  );

-- Update existing RLS policies for custom_parameter_sets to include portfolio access
DROP POLICY IF EXISTS "Users can view their own custom sets" ON custom_parameter_sets;
CREATE POLICY "Users can view their own custom sets" ON custom_parameter_sets
  FOR SELECT USING (
    auth.uid() = user_id OR 
    (portfolio_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM portfolios WHERE id = portfolio_id AND user_id = auth.uid()
    ))
  );

DROP POLICY IF EXISTS "Users can insert their own custom sets" ON custom_parameter_sets;
CREATE POLICY "Users can insert their own custom sets" ON custom_parameter_sets
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND 
    (portfolio_id IS NULL OR EXISTS (
      SELECT 1 FROM portfolios WHERE id = portfolio_id AND user_id = auth.uid()
    ))
  );

DROP POLICY IF EXISTS "Users can update their own custom sets" ON custom_parameter_sets;
CREATE POLICY "Users can update their own custom sets" ON custom_parameter_sets
  FOR UPDATE USING (
    auth.uid() = user_id AND 
    (portfolio_id IS NULL OR EXISTS (
      SELECT 1 FROM portfolios WHERE id = portfolio_id AND user_id = auth.uid()
    ))
  );

DROP POLICY IF EXISTS "Users can delete their own custom sets" ON custom_parameter_sets;
CREATE POLICY "Users can delete their own custom sets" ON custom_parameter_sets
  FOR DELETE USING (
    auth.uid() = user_id AND 
    (portfolio_id IS NULL OR EXISTS (
      SELECT 1 FROM portfolios WHERE id = portfolio_id AND user_id = auth.uid()
    ))
  ); 
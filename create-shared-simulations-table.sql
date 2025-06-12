-- Create shared_simulations table
CREATE TABLE IF NOT EXISTS shared_simulations (
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
CREATE INDEX IF NOT EXISTS idx_shared_simulations_sender_id ON shared_simulations(sender_id);
CREATE INDEX IF NOT EXISTS idx_shared_simulations_recipient_id ON shared_simulations(recipient_id);
CREATE INDEX IF NOT EXISTS idx_shared_simulations_recipient_email ON shared_simulations(recipient_email);
CREATE INDEX IF NOT EXISTS idx_shared_simulations_created_at ON shared_simulations(created_at);
CREATE INDEX IF NOT EXISTS idx_shared_simulations_is_read ON shared_simulations(is_read);

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

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_shared_simulations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_shared_simulations_updated_at 
    BEFORE UPDATE ON shared_simulations 
    FOR EACH ROW EXECUTE FUNCTION update_shared_simulations_updated_at(); 
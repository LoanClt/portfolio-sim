-- Create accounts table
CREATE TABLE accounts (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create an index on email for faster lookups
CREATE INDEX idx_accounts_email ON accounts(email);

-- Enable Row Level Security
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see and modify their own account
CREATE POLICY "Users can view own account" ON accounts
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own account" ON accounts
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own account" ON accounts
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE
ON accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

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
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create account profile on signup
CREATE OR REPLACE TRIGGER create_account_profile_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_account_profile(); 
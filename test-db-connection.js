import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    console.log('Testing Supabase connection...');
    
    // Test basic connection
    const { data, error } = await supabase.from('accounts').select('count', { count: 'exact', head: true });
    
    if (error) {
      console.error('Connection test failed:', error);
      return;
    }
    
    console.log('✅ Connection successful');
    
    // Check if portfolios table exists
    console.log('Checking if portfolios table exists...');
    const { data: portfolioData, error: portfolioError } = await supabase
      .from('portfolios')
      .select('count', { count: 'exact', head: true });
    
    if (portfolioError) {
      if (portfolioError.message?.includes('relation "portfolios" does not exist')) {
        console.log('❌ Portfolios table does not exist');
        console.log('Please run the create-portfolios-table.sql script in your Supabase dashboard');
        console.log('Or copy and paste the SQL from create-portfolios-table.sql');
      } else {
        console.error('Error checking portfolios table:', portfolioError);
      }
    } else {
      console.log('✅ Portfolios table exists');
    }
    
    // Check portfolio_investments table for portfolio_id column
    console.log('Checking portfolio_investments table structure...');
    const { data: investmentData, error: investmentError } = await supabase
      .from('portfolio_investments')
      .select('portfolio_id')
      .limit(1);
    
    if (investmentError) {
      if (investmentError.message?.includes('column "portfolio_id" does not exist')) {
        console.log('❌ portfolio_id column missing from portfolio_investments table');
        console.log('Please run the create-portfolios-table.sql script to add the missing columns');
      } else {
        console.error('Error checking portfolio_investments table:', investmentError);
      }
    } else {
      console.log('✅ portfolio_investments table has portfolio_id column');
    }
    
    // Check custom_parameter_sets table for portfolio_id column
    console.log('Checking custom_parameter_sets table structure...');
    const { data: customSetData, error: customSetError } = await supabase
      .from('custom_parameter_sets')
      .select('portfolio_id')
      .limit(1);
    
    if (customSetError) {
      if (customSetError.message?.includes('column "portfolio_id" does not exist')) {
        console.log('❌ portfolio_id column missing from custom_parameter_sets table');
        console.log('Please run the create-portfolios-table.sql script to add the missing columns');
      } else {
        console.error('Error checking custom_parameter_sets table:', customSetError);
      }
    } else {
      console.log('✅ custom_parameter_sets table has portfolio_id column');
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testConnection(); 
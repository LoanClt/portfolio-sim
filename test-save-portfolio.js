import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testPortfolioSave() {
  try {
    console.log('Testing portfolio save operation...');
    
    // First, sign in (you'll need to replace with your test user credentials)
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'loan.challeat@gmail.com', // Replace with your test email
      password: 'D@nette77000!' // Replace with your test password
    });
    
    if (authError) {
      console.error('Auth error:', authError);
      return;
    }
    
    console.log('✅ Authenticated successfully');
    const userId = authData.user.id;
    
    // Test 1: Create a simple portfolio
    console.log('Creating test portfolio...');
    const portfolioData = {
      user_id: userId,
      name: 'Test Portfolio ' + Date.now(),
      description: 'Test portfolio for debugging',
      updated_at: new Date().toISOString()
    };
    
    const { data: portfolioResult, error: portfolioError } = await supabase
      .from('portfolios')
      .insert(portfolioData)
      .select()
      .single();
    
    if (portfolioError) {
      console.error('❌ Portfolio creation failed:', portfolioError);
      return;
    }
    
    console.log('✅ Portfolio created:', portfolioResult.id);
    
    // Test 2: Insert a simple investment
    console.log('Creating test investment...');
    const investmentData = {
      portfolio_id: portfolioResult.id,
      user_id: userId,
      company_name: 'Test Company',
      field: 'software',
      region: 'US',
      entry_stage: 'Pre-Seed',
      entry_valuation: 5.0,
      check_size: 1.0,
      entry_date: '2024-01-01',
      current_stage: 'Pre-Seed',
      use_presets: true,
      custom_parameter_set_id: null,
      stage_progression_to_seed: 65,
      stage_progression_to_series_a: 45,
      stage_progression_to_series_b: 55,
      stage_progression_to_series_c: 48,
      stage_progression_to_ipo: 35,
      dilution_rates_seed: 18,
      dilution_rates_series_a: 20,
      dilution_rates_series_b: 15,
      dilution_rates_series_c: 12,
      dilution_rates_ipo: 8,
      exit_valuations_pre_seed_min: 10,
      exit_valuations_pre_seed_max: 50,
      exit_valuations_seed_min: 20,
      exit_valuations_seed_max: 100,
      exit_valuations_series_a_min: 50,
      exit_valuations_series_a_max: 250,
      exit_valuations_series_b_min: 100,
      exit_valuations_series_b_max: 500,
      exit_valuations_series_c_min: 200,
      exit_valuations_series_c_max: 1000,
      exit_valuations_ipo_min: 500,
      exit_valuations_ipo_max: 5000,
      loss_prob_pre_seed: 25,
      loss_prob_seed: 20,
      loss_prob_series_a: 15,
      loss_prob_series_b: 10,
      loss_prob_series_c: 8,
      loss_prob_ipo: 3,
      years_to_next_to_seed_min: 1,
      years_to_next_to_seed_max: 2,
      years_to_next_to_series_a_min: 1,
      years_to_next_to_series_a_max: 3,
      years_to_next_to_series_b_min: 1,
      years_to_next_to_series_b_max: 3,
      years_to_next_to_series_c_min: 1,
      years_to_next_to_series_c_max: 3,
      years_to_next_to_ipo_min: 1,
      years_to_next_to_ipo_max: 2
    };
    
    const { data: investmentResult, error: investmentError } = await supabase
      .from('portfolio_investments')
      .insert(investmentData)
      .select()
      .single();
    
    if (investmentError) {
      console.error('❌ Investment creation failed:', investmentError);
      return;
    }
    
    console.log('✅ Investment created:', investmentResult.id);
    
    // Clean up
    console.log('Cleaning up test data...');
    await supabase.from('portfolio_investments').delete().eq('id', investmentResult.id);
    await supabase.from('portfolios').delete().eq('id', portfolioResult.id);
    
    console.log('✅ Test completed successfully!');
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testPortfolioSave(); 
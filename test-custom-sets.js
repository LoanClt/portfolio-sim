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

async function testCustomParameterSets() {
  try {
    console.log('Testing custom parameter sets operations...');
    
    // First, sign in
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'loan.challeat@gmail.com',
      password: 'D@nette77000!'
    });
    
    if (authError) throw authError;
    console.log('✅ Authenticated successfully');

    // Create a test custom parameter set
    console.log('Creating test custom parameter set...');
    const customSet = {
      user_id: authData.user.id,
      name: 'Test Conservative Set',
      description: 'A test custom parameter set',
      color: '#3B82F6',
      icon: 'Target',
      stage_progression_to_seed: 50,
      stage_progression_to_series_a: 30,
      stage_progression_to_series_b: 40,
      stage_progression_to_series_c: 35,
      stage_progression_to_ipo: 25,
      dilution_rates_seed: 15,
      dilution_rates_series_a: 18,
      dilution_rates_series_b: 12,
      dilution_rates_series_c: 10,
      dilution_rates_ipo: 5,
      loss_prob_pre_seed: 35,
      loss_prob_seed: 30,
      loss_prob_series_a: 25,
      loss_prob_series_b: 20,
      loss_prob_series_c: 15,
      loss_prob_ipo: 8,
      exit_valuations_pre_seed_min: 3,
      exit_valuations_pre_seed_max: 10,
      exit_valuations_seed_min: 8,
      exit_valuations_seed_max: 30,
      exit_valuations_series_a_min: 25,
      exit_valuations_series_a_max: 100,
      exit_valuations_series_b_min: 60,
      exit_valuations_series_b_max: 300,
      exit_valuations_series_c_min: 150,
      exit_valuations_series_c_max: 800,
      exit_valuations_ipo_min: 400,
      exit_valuations_ipo_max: 3000,
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

    const { data: createResult, error: createError } = await supabase
      .from('custom_parameter_sets')
      .insert(customSet)
      .select()
      .single();

    if (createError) throw createError;
    console.log('✅ Custom parameter set created:', createResult.id);

    // Test reading the custom parameter set
    console.log('Reading custom parameter sets...');
    const { data: readResult, error: readError } = await supabase
      .from('custom_parameter_sets')
      .select('*')
      .eq('user_id', authData.user.id);

    if (readError) throw readError;
    console.log('✅ Found', readResult.length, 'custom parameter sets');

    // Test updating the custom parameter set
    console.log('Updating custom parameter set...');
    const { data: updateResult, error: updateError } = await supabase
      .from('custom_parameter_sets')
      .update({ name: 'Updated Test Set', description: 'Updated description' })
      .eq('id', createResult.id)
      .select()
      .single();

    if (updateError) throw updateError;
    console.log('✅ Custom parameter set updated:', updateResult.name);

    // Clean up - delete the test custom parameter set
    console.log('Cleaning up test data...');
    const { error: deleteError } = await supabase
      .from('custom_parameter_sets')
      .delete()
      .eq('id', createResult.id);

    if (deleteError) throw deleteError;
    console.log('✅ Test data cleaned up');

    console.log('✅ All custom parameter set tests passed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testCustomParameterSets(); 
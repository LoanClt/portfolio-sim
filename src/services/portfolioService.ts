import { supabase } from '@/lib/supabase'
import { AccountService } from './accountService'
import type { PortfolioInvestment, CustomParameterSet } from '@/types/portfolio'

// Helper function to convert database row to PortfolioInvestment
const dbRowToInvestment = (row: any): PortfolioInvestment => {
  return {
    id: row.id,
    companyName: row.company_name,
    field: row.field,
    region: row.region,
    entryStage: row.entry_stage,
    entryValuation: row.entry_valuation,
    checkSize: row.check_size,
    entryDate: row.entry_date,
    currentStage: row.current_stage,
    usePresets: row.use_presets,
    customParameterSetId: row.custom_parameter_set_id,
    
    stageProgression: {
      toSeed: row.stage_progression_to_seed,
      toSeriesA: row.stage_progression_to_series_a,
      toSeriesB: row.stage_progression_to_series_b,
      toSeriesC: row.stage_progression_to_series_c,
      toIPO: row.stage_progression_to_ipo,
    },
    
    dilutionRates: {
      seed: row.dilution_rates_seed,
      seriesA: row.dilution_rates_series_a,
      seriesB: row.dilution_rates_series_b,
      seriesC: row.dilution_rates_series_c,
      ipo: row.dilution_rates_ipo,
    },
    
    exitValuations: {
      preSeed: [row.exit_valuations_pre_seed_min, row.exit_valuations_pre_seed_max],
      seed: [row.exit_valuations_seed_min, row.exit_valuations_seed_max],
      seriesA: [row.exit_valuations_series_a_min, row.exit_valuations_series_a_max],
      seriesB: [row.exit_valuations_series_b_min, row.exit_valuations_series_b_max],
      seriesC: [row.exit_valuations_series_c_min, row.exit_valuations_series_c_max],
      ipo: [row.exit_valuations_ipo_min, row.exit_valuations_ipo_max],
    },
    
    lossProb: {
      preSeed: row.loss_prob_pre_seed,
      seed: row.loss_prob_seed,
      seriesA: row.loss_prob_series_a,
      seriesB: row.loss_prob_series_b,
      seriesC: row.loss_prob_series_c,
      ipo: row.loss_prob_ipo,
    },
    
    yearsToNext: {
      toSeed: row.years_to_next_to_seed_min && row.years_to_next_to_seed_max 
        ? [row.years_to_next_to_seed_min, row.years_to_next_to_seed_max]
        : undefined,
      toSeriesA: row.years_to_next_to_series_a_min && row.years_to_next_to_series_a_max
        ? [row.years_to_next_to_series_a_min, row.years_to_next_to_series_a_max]
        : undefined,
      toSeriesB: row.years_to_next_to_series_b_min && row.years_to_next_to_series_b_max
        ? [row.years_to_next_to_series_b_min, row.years_to_next_to_series_b_max]
        : undefined,
      toSeriesC: row.years_to_next_to_series_c_min && row.years_to_next_to_series_c_max
        ? [row.years_to_next_to_series_c_min, row.years_to_next_to_series_c_max]
        : undefined,
      toIPO: row.years_to_next_to_ipo_min && row.years_to_next_to_ipo_max
        ? [row.years_to_next_to_ipo_min, row.years_to_next_to_ipo_max]
        : undefined,
    },
  }
}

// Helper function to convert PortfolioInvestment to database row
const investmentToDbRow = (investment: PortfolioInvestment, userId: string) => {
  return {
    id: investment.id,
    user_id: userId,
    company_name: investment.companyName,
    field: investment.field,
    region: investment.region,
    entry_stage: investment.entryStage,
    entry_valuation: investment.entryValuation,
    check_size: investment.checkSize,
    entry_date: investment.entryDate,
    current_stage: investment.currentStage,
    use_presets: investment.usePresets,
    custom_parameter_set_id: investment.customParameterSetId,
    
    stage_progression_to_seed: investment.stageProgression.toSeed,
    stage_progression_to_series_a: investment.stageProgression.toSeriesA,
    stage_progression_to_series_b: investment.stageProgression.toSeriesB,
    stage_progression_to_series_c: investment.stageProgression.toSeriesC,
    stage_progression_to_ipo: investment.stageProgression.toIPO,
    
    dilution_rates_seed: investment.dilutionRates.seed,
    dilution_rates_series_a: investment.dilutionRates.seriesA,
    dilution_rates_series_b: investment.dilutionRates.seriesB,
    dilution_rates_series_c: investment.dilutionRates.seriesC,
    dilution_rates_ipo: investment.dilutionRates.ipo,
    
    exit_valuations_pre_seed_min: investment.exitValuations.preSeed[0],
    exit_valuations_pre_seed_max: investment.exitValuations.preSeed[1],
    exit_valuations_seed_min: investment.exitValuations.seed[0],
    exit_valuations_seed_max: investment.exitValuations.seed[1],
    exit_valuations_series_a_min: investment.exitValuations.seriesA[0],
    exit_valuations_series_a_max: investment.exitValuations.seriesA[1],
    exit_valuations_series_b_min: investment.exitValuations.seriesB[0],
    exit_valuations_series_b_max: investment.exitValuations.seriesB[1],
    exit_valuations_series_c_min: investment.exitValuations.seriesC[0],
    exit_valuations_series_c_max: investment.exitValuations.seriesC[1],
    exit_valuations_ipo_min: investment.exitValuations.ipo[0],
    exit_valuations_ipo_max: investment.exitValuations.ipo[1],
    
    loss_prob_pre_seed: investment.lossProb.preSeed,
    loss_prob_seed: investment.lossProb.seed,
    loss_prob_series_a: investment.lossProb.seriesA,
    loss_prob_series_b: investment.lossProb.seriesB,
    loss_prob_series_c: investment.lossProb.seriesC,
    loss_prob_ipo: investment.lossProb.ipo,
    
    years_to_next_to_seed_min: investment.yearsToNext.toSeed?.[0],
    years_to_next_to_seed_max: investment.yearsToNext.toSeed?.[1],
    years_to_next_to_series_a_min: investment.yearsToNext.toSeriesA?.[0],
    years_to_next_to_series_a_max: investment.yearsToNext.toSeriesA?.[1],
    years_to_next_to_series_b_min: investment.yearsToNext.toSeriesB?.[0],
    years_to_next_to_series_b_max: investment.yearsToNext.toSeriesB?.[1],
    years_to_next_to_series_c_min: investment.yearsToNext.toSeriesC?.[0],
    years_to_next_to_series_c_max: investment.yearsToNext.toSeriesC?.[1],
    years_to_next_to_ipo_min: investment.yearsToNext.toIPO?.[0],
    years_to_next_to_ipo_max: investment.yearsToNext.toIPO?.[1],
  }
}

// Helper function to convert database row to CustomParameterSet
const dbRowToCustomParameterSet = (row: any): CustomParameterSet => {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    color: row.color,
    icon: row.icon,
    createdAt: row.created_at,
    
    stageProgression: {
      toSeed: row.stage_progression_to_seed,
      toSeriesA: row.stage_progression_to_series_a,
      toSeriesB: row.stage_progression_to_series_b,
      toSeriesC: row.stage_progression_to_series_c,
      toIPO: row.stage_progression_to_ipo,
    },
    
    dilutionRates: {
      seed: row.dilution_rates_seed,
      seriesA: row.dilution_rates_series_a,
      seriesB: row.dilution_rates_series_b,
      seriesC: row.dilution_rates_series_c,
      ipo: row.dilution_rates_ipo,
    },
    
    lossProb: {
      preSeed: row.loss_prob_pre_seed,
      seed: row.loss_prob_seed,
      seriesA: row.loss_prob_series_a,
      seriesB: row.loss_prob_series_b,
      seriesC: row.loss_prob_series_c,
      ipo: row.loss_prob_ipo,
    },
    
    exitValuations: {
      preSeed: [row.exit_valuations_pre_seed_min, row.exit_valuations_pre_seed_max],
      seed: [row.exit_valuations_seed_min, row.exit_valuations_seed_max],
      seriesA: [row.exit_valuations_series_a_min, row.exit_valuations_series_a_max],
      seriesB: [row.exit_valuations_series_b_min, row.exit_valuations_series_b_max],
      seriesC: [row.exit_valuations_series_c_min, row.exit_valuations_series_c_max],
      ipo: [row.exit_valuations_ipo_min, row.exit_valuations_ipo_max],
    },
    
    yearsToNext: {
      toSeed: row.years_to_next_to_seed_min && row.years_to_next_to_seed_max 
        ? [row.years_to_next_to_seed_min, row.years_to_next_to_seed_max]
        : undefined,
      toSeriesA: row.years_to_next_to_series_a_min && row.years_to_next_to_series_a_max
        ? [row.years_to_next_to_series_a_min, row.years_to_next_to_series_a_max]
        : undefined,
      toSeriesB: row.years_to_next_to_series_b_min && row.years_to_next_to_series_b_max
        ? [row.years_to_next_to_series_b_min, row.years_to_next_to_series_b_max]
        : undefined,
      toSeriesC: row.years_to_next_to_series_c_min && row.years_to_next_to_series_c_max
        ? [row.years_to_next_to_series_c_min, row.years_to_next_to_series_c_max]
        : undefined,
      toIPO: row.years_to_next_to_ipo_min && row.years_to_next_to_ipo_max
        ? [row.years_to_next_to_ipo_min, row.years_to_next_to_ipo_max]
        : undefined,
    },
  }
}

// Helper function to convert CustomParameterSet to database row
const customParameterSetToDbRow = (customSet: CustomParameterSet, userId: string) => {
  return {
    id: customSet.id,
    user_id: userId,
    name: customSet.name,
    description: customSet.description,
    color: customSet.color,
    icon: customSet.icon,
    
    stage_progression_to_seed: customSet.stageProgression.toSeed,
    stage_progression_to_series_a: customSet.stageProgression.toSeriesA,
    stage_progression_to_series_b: customSet.stageProgression.toSeriesB,
    stage_progression_to_series_c: customSet.stageProgression.toSeriesC,
    stage_progression_to_ipo: customSet.stageProgression.toIPO,
    
    dilution_rates_seed: customSet.dilutionRates.seed,
    dilution_rates_series_a: customSet.dilutionRates.seriesA,
    dilution_rates_series_b: customSet.dilutionRates.seriesB,
    dilution_rates_series_c: customSet.dilutionRates.seriesC,
    dilution_rates_ipo: customSet.dilutionRates.ipo,
    
    loss_prob_pre_seed: customSet.lossProb.preSeed,
    loss_prob_seed: customSet.lossProb.seed,
    loss_prob_series_a: customSet.lossProb.seriesA,
    loss_prob_series_b: customSet.lossProb.seriesB,
    loss_prob_series_c: customSet.lossProb.seriesC,
    loss_prob_ipo: customSet.lossProb.ipo,
    
    exit_valuations_pre_seed_min: customSet.exitValuations.preSeed[0],
    exit_valuations_pre_seed_max: customSet.exitValuations.preSeed[1],
    exit_valuations_seed_min: customSet.exitValuations.seed[0],
    exit_valuations_seed_max: customSet.exitValuations.seed[1],
    exit_valuations_series_a_min: customSet.exitValuations.seriesA[0],
    exit_valuations_series_a_max: customSet.exitValuations.seriesA[1],
    exit_valuations_series_b_min: customSet.exitValuations.seriesB[0],
    exit_valuations_series_b_max: customSet.exitValuations.seriesB[1],
    exit_valuations_series_c_min: customSet.exitValuations.seriesC[0],
    exit_valuations_series_c_max: customSet.exitValuations.seriesC[1],
    exit_valuations_ipo_min: customSet.exitValuations.ipo[0],
    exit_valuations_ipo_max: customSet.exitValuations.ipo[1],
    
    years_to_next_to_seed_min: customSet.yearsToNext?.toSeed?.[0],
    years_to_next_to_seed_max: customSet.yearsToNext?.toSeed?.[1],
    years_to_next_to_series_a_min: customSet.yearsToNext?.toSeriesA?.[0],
    years_to_next_to_series_a_max: customSet.yearsToNext?.toSeriesA?.[1],
    years_to_next_to_series_b_min: customSet.yearsToNext?.toSeriesB?.[0],
    years_to_next_to_series_b_max: customSet.yearsToNext?.toSeriesB?.[1],
    years_to_next_to_series_c_min: customSet.yearsToNext?.toSeriesC?.[0],
    years_to_next_to_series_c_max: customSet.yearsToNext?.toSeriesC?.[1],
    years_to_next_to_ipo_min: customSet.yearsToNext?.toIPO?.[0],
    years_to_next_to_ipo_max: customSet.yearsToNext?.toIPO?.[1],
  }
}

// Portfolio Investments Service
export const portfolioService = {
  // Get all investments for the current user
  async getInvestments(): Promise<PortfolioInvestment[]> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('portfolio_investments')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data?.map(dbRowToInvestment) || []
  },

  // Create a new investment
  async createInvestment(investment: PortfolioInvestment): Promise<PortfolioInvestment> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const dbRow = investmentToDbRow(investment, user.id)
    // Remove id field for new records - let database generate UUID
    const { id, ...insertRow } = dbRow
    
    console.log('Creating investment with data:', insertRow)
    
    const { data, error } = await supabase
      .from('portfolio_investments')
      .insert(insertRow)
      .select()
      .single()

    if (error) {
      console.error('Database error creating investment:', error)
      throw new Error(`Failed to create investment: ${error.message}`)
    }
    
    return dbRowToInvestment(data)
  },

  // Update an investment
  async updateInvestment(id: string, updates: Partial<PortfolioInvestment>): Promise<PortfolioInvestment> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    // Get current investment to merge with updates
    const { data: current, error: fetchError } = await supabase
      .from('portfolio_investments')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (fetchError) throw fetchError

    const currentInvestment = dbRowToInvestment(current)
    const updatedInvestment = { ...currentInvestment, ...updates }
    const dbRow = investmentToDbRow(updatedInvestment, user.id)

    const { data, error } = await supabase
      .from('portfolio_investments')
      .update(dbRow)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) throw error
    return dbRowToInvestment(data)
  },

  // Delete an investment
  async deleteInvestment(id: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { error } = await supabase
      .from('portfolio_investments')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) throw error
  },
}

// Custom Parameter Sets Service
export const customParameterSetsService = {
  // Get all custom parameter sets for the current user
  async getCustomParameterSets(): Promise<CustomParameterSet[]> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('custom_parameter_sets')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data?.map(dbRowToCustomParameterSet) || []
  },

  // Create a new custom parameter set
  async createCustomParameterSet(customSet: CustomParameterSet): Promise<CustomParameterSet> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const dbRow = customParameterSetToDbRow(customSet, user.id)
    // Remove id field for new records - let database generate UUID
    const { id, ...insertRow } = dbRow
    
    console.log('Creating custom parameter set with data:', insertRow)
    
    const { data, error } = await supabase
      .from('custom_parameter_sets')
      .insert(insertRow)
      .select()
      .single()

    if (error) {
      console.error('Database error creating custom parameter set:', error)
      throw new Error(`Failed to create custom parameter set: ${error.message}`)
    }
    
    return dbRowToCustomParameterSet(data)
  },

  // Update a custom parameter set
  async updateCustomParameterSet(id: string, updates: Partial<CustomParameterSet>): Promise<CustomParameterSet> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    // Get current custom set to merge with updates
    const { data: current, error: fetchError } = await supabase
      .from('custom_parameter_sets')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (fetchError) throw fetchError

    const currentCustomSet = dbRowToCustomParameterSet(current)
    const updatedCustomSet = { ...currentCustomSet, ...updates }
    const dbRow = customParameterSetToDbRow(updatedCustomSet, user.id)

    const { data, error } = await supabase
      .from('custom_parameter_sets')
      .update(dbRow)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) throw error
    return dbRowToCustomParameterSet(data)
  },

  // Delete a custom parameter set
  async deleteCustomParameterSet(id: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { error } = await supabase
      .from('custom_parameter_sets')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) throw error
  },
}

// Auth Service
export const authService = {
  // Get current user
  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser()
    return user
  },

  // Sign in with email
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error

    // Ensure profile exists (fallback in case it wasn't created during signup)
    if (data.user) {
      await this.ensureProfileExists(data.user)
    }

    return data
  },

  // Helper function to ensure user account profile exists
  async ensureProfileExists(user: any) {
    try {
      const fullName = user.user_metadata?.full_name || user.email?.split('@')[0]
      await AccountService.ensureAccountProfile(user.id, user.email, fullName)
    } catch (error) {
      console.warn('Error ensuring account profile exists:', error)
    }
  },

  // Sign up with email
  async signUp(email: string, password: string, fullName?: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        }
      }
    })
    if (error) throw error

    // Create account profile if user was successfully created
    if (data.user && !error) {
      try {
        await AccountService.ensureAccountProfile(data.user.id, data.user.email!, fullName)
      } catch (profileErr) {
        console.warn('Account profile creation error:', profileErr)
      }
    }

    return data
  },

  // Sign out
  async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  // Listen to auth changes
  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback)
  },
} 
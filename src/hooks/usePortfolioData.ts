import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useNotifications } from '@/components/NotificationSystem'
import type { PortfolioInvestment, CustomParameterSet } from '@/types/portfolio'
import { supabase } from '@/lib/supabase'

interface SavedPortfolio {
  id: string
  name: string
  description?: string
  created_at: string
  updated_at: string
  investment_count: number
  custom_set_count: number
}

interface UsePortfolioDataReturn {
  investments: PortfolioInvestment[]
  customParameterSets: CustomParameterSet[]
  loading: boolean
  error: string | null
  
  // Investment operations
  addInvestment: (investment: PortfolioInvestment) => Promise<void>
  updateInvestment: (id: string, updates: Partial<PortfolioInvestment>) => Promise<void>
  deleteInvestment: (id: string) => Promise<void>
  importInvestments: (investments: PortfolioInvestment[]) => Promise<void>
  
  // Custom parameter set operations
  addCustomParameterSet: (customSet: CustomParameterSet) => Promise<void>
  updateCustomParameterSet: (id: string, updates: Partial<CustomParameterSet>) => Promise<void>
  deleteCustomParameterSet: (id: string) => Promise<void>
  
  // Database operations (only when authenticated)
  saveToDatabase: () => Promise<{ success: boolean; message: string }>
  loadFromDatabase: () => Promise<{ success: boolean; message: string }>
  savePortfolioToCloud: (name: string, description?: string) => Promise<{ success: boolean; message: string }>
  loadPortfolioFromCloud: (portfolioId: string) => Promise<{ success: boolean; message: string }>
  getSavedPortfolios: () => Promise<SavedPortfolio[]>
  deletePortfolioFromCloud: (portfolioId: string) => Promise<{ success: boolean; message: string }>
  
  // Utility functions
  refreshData: () => Promise<void>
  clearError: () => void
}

const STORAGE_KEYS = {
  INVESTMENTS: 'portfolio-investments',
  CUSTOM_SETS: 'custom-parameter-sets'
};

// Helper functions for localStorage
const getFromStorage = <T>(key: string): T[] => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error(`Error reading from localStorage (${key}):`, error);
    return [];
  }
};

const saveToStorage = <T>(key: string, data: T[]): void => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Error saving to localStorage (${key}):`, error);
  }
};

const generateId = () => `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export const usePortfolioData = (): UsePortfolioDataReturn => {
  const { user } = useAuth()
  const { showSuccess, showError } = useNotifications()
  const [investments, setInvestments] = useState<PortfolioInvestment[]>([])
  const [customParameterSets, setCustomParameterSets] = useState<CustomParameterSet[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load data from localStorage on mount
  const loadLocalData = useCallback(() => {
    const localInvestments = getFromStorage<PortfolioInvestment>(STORAGE_KEYS.INVESTMENTS);
    const localCustomSets = getFromStorage<CustomParameterSet>(STORAGE_KEYS.CUSTOM_SETS);
    
    setInvestments(localInvestments);
    setCustomParameterSets(localCustomSets);
  }, []);

  // Initialize with localStorage data
  useEffect(() => {
    loadLocalData();
  }, [loadLocalData]);

  // Load data from database when user signs in
  useEffect(() => {
    if (user) {
      // Auto-load custom sets from database when user is authenticated
      const loadCustomSetsFromDb = async () => {
        try {
          const { data, error } = await supabase
            .from('custom_parameter_sets')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

          if (error) throw error;

          const loadedCustomSets = (data || []).map(dbRowToCustomSet);
          setCustomParameterSets(loadedCustomSets);
        } catch (error) {
          console.error('Failed to load custom sets from database:', error);
        }
      };

      loadCustomSetsFromDb();
    } else {
      // When user signs out, revert to localStorage data
      loadLocalData();
    }
  }, [user, loadLocalData]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Investment operations (localStorage only)
  const addInvestment = useCallback(async (investment: PortfolioInvestment) => {
    const newInvestment = { ...investment, id: investment.id || generateId() };
    const updatedInvestments = [...investments, newInvestment];
    
    setInvestments(updatedInvestments);
    saveToStorage(STORAGE_KEYS.INVESTMENTS, updatedInvestments);
  }, [investments]);

  const updateInvestment = useCallback(async (id: string, updates: Partial<PortfolioInvestment>) => {
    const updatedInvestments = investments.map(inv => 
      inv.id === id ? { ...inv, ...updates } : inv
    );
    
    setInvestments(updatedInvestments);
    saveToStorage(STORAGE_KEYS.INVESTMENTS, updatedInvestments);
  }, [investments]);

  const deleteInvestment = useCallback(async (id: string) => {
    const updatedInvestments = investments.filter(inv => inv.id !== id);
    
    setInvestments(updatedInvestments);
    saveToStorage(STORAGE_KEYS.INVESTMENTS, updatedInvestments);
  }, [investments]);

  const importInvestments = useCallback(async (importedInvestments: PortfolioInvestment[]) => {
    // Ensure all imported investments have valid IDs
    const investmentsWithIds = importedInvestments.map(inv => ({
      ...inv,
      id: inv.id || generateId()
    }));
    
    setInvestments(investmentsWithIds);
    saveToStorage(STORAGE_KEYS.INVESTMENTS, investmentsWithIds);
  }, []);

  // Helper function to convert CustomParameterSet to database row format
  const customSetToDbRow = (customSet: CustomParameterSet) => ({
    id: customSet.id,
    user_id: user?.id,
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
  });

  // Helper function to convert database row to CustomParameterSet
  const dbRowToCustomSet = (row: any): CustomParameterSet => ({
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
      toSeed: row.years_to_next_to_seed_min && row.years_to_next_to_seed_max ? 
        [row.years_to_next_to_seed_min, row.years_to_next_to_seed_max] : undefined,
      toSeriesA: row.years_to_next_to_series_a_min && row.years_to_next_to_series_a_max ? 
        [row.years_to_next_to_series_a_min, row.years_to_next_to_series_a_max] : undefined,
      toSeriesB: row.years_to_next_to_series_b_min && row.years_to_next_to_series_b_max ? 
        [row.years_to_next_to_series_b_min, row.years_to_next_to_series_b_max] : undefined,
      toSeriesC: row.years_to_next_to_series_c_min && row.years_to_next_to_series_c_max ? 
        [row.years_to_next_to_series_c_min, row.years_to_next_to_series_c_max] : undefined,
      toIPO: row.years_to_next_to_ipo_min && row.years_to_next_to_ipo_max ? 
        [row.years_to_next_to_ipo_min, row.years_to_next_to_ipo_max] : undefined,
    }
  });

  // Custom parameter set operations (database when authenticated, localStorage otherwise)
  const addCustomParameterSet = useCallback(async (customSet: CustomParameterSet) => {
    try {
      console.log('Hook: addCustomParameterSet called with:', customSet);
      console.log('Hook: user is:', user ? 'authenticated' : 'not authenticated');
      console.log('Hook: current customParameterSets length:', customParameterSets.length);
      if (user) {
        // Save to database
        console.log('Hook: Saving to database');
        const dbRow = customSetToDbRow(customSet);
        console.log('Hook: dbRow created:', dbRow);
        const { id, ...insertRow } = dbRow; // Remove id to let database generate UUID
        console.log('Hook: insertRow (without id):', insertRow);
        
        const { data, error } = await supabase
          .from('custom_parameter_sets')
          .insert(insertRow)
          .select()
          .single();

        if (error) throw error;
        console.log('Hook: Database insert successful, data:', data);

        const newCustomSet = dbRowToCustomSet(data);
        console.log('Hook: Converted back to CustomParameterSet:', newCustomSet);
        setCustomParameterSets(prev => [...prev, newCustomSet]);
        console.log('Hook: State updated');
        showSuccess('Custom Set Created', `"${customSet.name}" has been saved to the cloud`);
      } else {
        // Save to localStorage
        console.log('Hook: Saving to localStorage');
        const newCustomSet = { ...customSet, id: customSet.id || generateId() };
        console.log('Hook: newCustomSet for localStorage:', newCustomSet);
        const updatedCustomSets = [...customParameterSets, newCustomSet];
        
        setCustomParameterSets(updatedCustomSets);
        saveToStorage(STORAGE_KEYS.CUSTOM_SETS, updatedCustomSets);
        console.log('Hook: localStorage updated, new length:', updatedCustomSets.length);
        showSuccess('Custom Set Created', `"${customSet.name}" has been saved locally`);
      }
    } catch (error: any) {
      console.error('Hook: Error in addCustomParameterSet:', error);
      const errorMessage = `Failed to create custom set: ${error.message}`;
      showError('Creation Failed', errorMessage);
      throw new Error(errorMessage);
    }
  }, [user, customParameterSets, showSuccess, showError]);

  const updateCustomParameterSet = useCallback(async (id: string, updates: Partial<CustomParameterSet>) => {
    try {
      console.log('Hook: updateCustomParameterSet called with id:', id, 'updates:', updates);
      console.log('Hook: user is:', user ? 'authenticated' : 'not authenticated');
      if (user) {
        // Update in database
        console.log('Hook: Updating in database');
        const currentSet = customParameterSets.find(set => set.id === id);
        if (!currentSet) throw new Error('Custom set not found');
        console.log('Hook: Found current set:', currentSet);

        const updatedSet = { ...currentSet, ...updates };
        console.log('Hook: Updated set:', updatedSet);
        const dbRow = customSetToDbRow(updatedSet);

        const { data, error } = await supabase
          .from('custom_parameter_sets')
          .update(dbRow)
          .eq('id', id)
          .eq('user_id', user.id)
          .select()
          .single();

        if (error) throw error;
        console.log('Hook: Database update successful, data:', data);

        const updatedCustomSet = dbRowToCustomSet(data);
        console.log('Hook: Converted back to CustomParameterSet:', updatedCustomSet);
        setCustomParameterSets(prev => prev.map(set => set.id === id ? updatedCustomSet : set));
        console.log('Hook: State updated');
        showSuccess('Custom Set Updated', `"${updatedCustomSet.name}" has been updated`);
      } else {
        // Update in localStorage
        console.log('Hook: Updating in localStorage');
        const updatedCustomSets = customParameterSets.map(set => 
          set.id === id ? { ...set, ...updates } : set
        );
        
        setCustomParameterSets(updatedCustomSets);
        saveToStorage(STORAGE_KEYS.CUSTOM_SETS, updatedCustomSets);
        console.log('Hook: localStorage updated');
        showSuccess('Custom Set Updated', 'Changes saved locally');
      }
    } catch (error: any) {
      console.error('Hook: Error in updateCustomParameterSet:', error);
      const errorMessage = `Failed to update custom set: ${error.message}`;
      showError('Update Failed', errorMessage);
      throw new Error(errorMessage);
    }
  }, [user, customParameterSets, showSuccess, showError]);

  const deleteCustomParameterSet = useCallback(async (id: string) => {
    try {
      const setToDelete = customParameterSets.find(set => set.id === id);
      const setName = setToDelete?.name || 'Unknown';

      if (user) {
        // Delete from database
        const { error } = await supabase
          .from('custom_parameter_sets')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id);

        if (error) throw error;

        setCustomParameterSets(prev => prev.filter(set => set.id !== id));
        showSuccess('Custom Set Deleted', `"${setName}" has been removed from the cloud`);
      } else {
        // Delete from localStorage
        const updatedCustomSets = customParameterSets.filter(set => set.id !== id);
        
        setCustomParameterSets(updatedCustomSets);
        saveToStorage(STORAGE_KEYS.CUSTOM_SETS, updatedCustomSets);
        showSuccess('Custom Set Deleted', `"${setName}" has been removed locally`);
      }
    } catch (error: any) {
      const errorMessage = `Failed to delete custom set: ${error.message}`;
      showError('Deletion Failed', errorMessage);
      throw new Error(errorMessage);
    }
  }, [user, customParameterSets, showSuccess, showError]);

  // Database operations (only available when authenticated)
  const saveToDatabase = useCallback(async () => {
    if (!user) {
      throw new Error('Must be signed in to save to database');
    }

    setLoading(true);
    setError(null);

    try {
      // Save investments
      const investmentRows = investments.map(inv => ({
        user_id: user.id,
        company_name: inv.companyName,
        field: inv.field,
        region: inv.region,
        entry_stage: inv.entryStage,
        entry_valuation: inv.entryValuation,
        check_size: inv.checkSize,
        entry_date: inv.entryDate,
        current_stage: inv.currentStage,
        use_presets: inv.usePresets,
        custom_parameter_set_id: inv.customParameterSetId,
        stage_progression_to_seed: inv.stageProgression.toSeed,
        stage_progression_to_series_a: inv.stageProgression.toSeriesA,
        stage_progression_to_series_b: inv.stageProgression.toSeriesB,
        stage_progression_to_series_c: inv.stageProgression.toSeriesC,
        stage_progression_to_ipo: inv.stageProgression.toIPO,
        dilution_rates_seed: inv.dilutionRates.seed,
        dilution_rates_series_a: inv.dilutionRates.seriesA,
        dilution_rates_series_b: inv.dilutionRates.seriesB,
        dilution_rates_series_c: inv.dilutionRates.seriesC,
        dilution_rates_ipo: inv.dilutionRates.ipo,
        exit_valuations_pre_seed_min: inv.exitValuations.preSeed[0],
        exit_valuations_pre_seed_max: inv.exitValuations.preSeed[1],
        exit_valuations_seed_min: inv.exitValuations.seed[0],
        exit_valuations_seed_max: inv.exitValuations.seed[1],
        exit_valuations_series_a_min: inv.exitValuations.seriesA[0],
        exit_valuations_series_a_max: inv.exitValuations.seriesA[1],
        exit_valuations_series_b_min: inv.exitValuations.seriesB[0],
        exit_valuations_series_b_max: inv.exitValuations.seriesB[1],
        exit_valuations_series_c_min: inv.exitValuations.seriesC[0],
        exit_valuations_series_c_max: inv.exitValuations.seriesC[1],
        exit_valuations_ipo_min: inv.exitValuations.ipo[0],
        exit_valuations_ipo_max: inv.exitValuations.ipo[1],
        loss_prob_pre_seed: inv.lossProb?.preSeed || 0,
        loss_prob_seed: inv.lossProb?.seed || 0,
        loss_prob_series_a: inv.lossProb?.seriesA || 0,
        loss_prob_series_b: inv.lossProb?.seriesB || 0,
        loss_prob_series_c: inv.lossProb?.seriesC || 0,
        loss_prob_ipo: inv.lossProb?.ipo || 0,
        years_to_next_to_seed_min: inv.yearsToNext?.toSeed?.[0],
        years_to_next_to_seed_max: inv.yearsToNext?.toSeed?.[1],
        years_to_next_to_series_a_min: inv.yearsToNext?.toSeriesA?.[0],
        years_to_next_to_series_a_max: inv.yearsToNext?.toSeriesA?.[1],
        years_to_next_to_series_b_min: inv.yearsToNext?.toSeriesB?.[0],
        years_to_next_to_series_b_max: inv.yearsToNext?.toSeriesB?.[1],
        years_to_next_to_series_c_min: inv.yearsToNext?.toSeriesC?.[0],
        years_to_next_to_series_c_max: inv.yearsToNext?.toSeriesC?.[1],
        years_to_next_to_ipo_min: inv.yearsToNext?.toIPO?.[0],
        years_to_next_to_ipo_max: inv.yearsToNext?.toIPO?.[1],
      }));

      // Clear existing data first
      await supabase
        .from('portfolio_investments')
        .delete()
        .eq('user_id', user.id);

      if (investmentRows.length > 0) {
        const { error: investmentError } = await supabase
          .from('portfolio_investments')
          .insert(investmentRows);

        if (investmentError) throw investmentError;
      }

      // Save custom parameter sets
      const customSetRows = customParameterSets.map(set => ({
        user_id: user.id,
        name: set.name,
        description: set.description,
        color: set.color,
        icon: set.icon,
        stage_progression_to_seed: set.stageProgression.toSeed,
        stage_progression_to_series_a: set.stageProgression.toSeriesA,
        stage_progression_to_series_b: set.stageProgression.toSeriesB,
        stage_progression_to_series_c: set.stageProgression.toSeriesC,
        stage_progression_to_ipo: set.stageProgression.toIPO,
        dilution_rates_seed: set.dilutionRates.seed,
        dilution_rates_series_a: set.dilutionRates.seriesA,
        dilution_rates_series_b: set.dilutionRates.seriesB,
        dilution_rates_series_c: set.dilutionRates.seriesC,
        dilution_rates_ipo: set.dilutionRates.ipo,
        loss_prob_pre_seed: set.lossProb.preSeed,
        loss_prob_seed: set.lossProb.seed,
        loss_prob_series_a: set.lossProb.seriesA,
        loss_prob_series_b: set.lossProb.seriesB,
        loss_prob_series_c: set.lossProb.seriesC,
        loss_prob_ipo: set.lossProb.ipo,
        exit_valuations_pre_seed_min: set.exitValuations.preSeed[0],
        exit_valuations_pre_seed_max: set.exitValuations.preSeed[1],
        exit_valuations_seed_min: set.exitValuations.seed[0],
        exit_valuations_seed_max: set.exitValuations.seed[1],
        exit_valuations_series_a_min: set.exitValuations.seriesA[0],
        exit_valuations_series_a_max: set.exitValuations.seriesA[1],
        exit_valuations_series_b_min: set.exitValuations.seriesB[0],
        exit_valuations_series_b_max: set.exitValuations.seriesB[1],
        exit_valuations_series_c_min: set.exitValuations.seriesC[0],
        exit_valuations_series_c_max: set.exitValuations.seriesC[1],
        exit_valuations_ipo_min: set.exitValuations.ipo[0],
        exit_valuations_ipo_max: set.exitValuations.ipo[1],
        years_to_next_to_seed_min: set.yearsToNext?.toSeed?.[0],
        years_to_next_to_seed_max: set.yearsToNext?.toSeed?.[1],
        years_to_next_to_series_a_min: set.yearsToNext?.toSeriesA?.[0],
        years_to_next_to_series_a_max: set.yearsToNext?.toSeriesA?.[1],
        years_to_next_to_series_b_min: set.yearsToNext?.toSeriesB?.[0],
        years_to_next_to_series_b_max: set.yearsToNext?.toSeriesB?.[1],
        years_to_next_to_series_c_min: set.yearsToNext?.toSeriesC?.[0],
        years_to_next_to_series_c_max: set.yearsToNext?.toSeriesC?.[1],
        years_to_next_to_ipo_min: set.yearsToNext?.toIPO?.[0],
        years_to_next_to_ipo_max: set.yearsToNext?.toIPO?.[1],
      }));

      // Clear existing custom sets first
      await supabase
        .from('custom_parameter_sets')
        .delete()
        .eq('user_id', user.id);

      if (customSetRows.length > 0) {
        const { error: customSetError } = await supabase
          .from('custom_parameter_sets')
          .insert(customSetRows);

        if (customSetError) throw customSetError;
      }

      return { success: true, message: `Saved ${investments.length} investments and ${customParameterSets.length} custom sets to cloud` };
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to save to database';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user, investments, customParameterSets]);

  const loadFromDatabase = useCallback(async () => {
    if (!user) {
      throw new Error('Must be signed in to load from database');
    }

    setLoading(true);
    setError(null);

    try {
      // Load investments
      const { data: investmentData, error: investmentError } = await supabase
        .from('portfolio_investments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (investmentError) throw investmentError;

      // Load custom parameter sets
      const { data: customSetData, error: customSetError } = await supabase
        .from('custom_parameter_sets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (customSetError) throw customSetError;

      // Convert database rows to frontend objects
      const loadedInvestments: PortfolioInvestment[] = (investmentData || []).map(row => ({
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
      }));

      const loadedCustomSets: CustomParameterSet[] = (customSetData || []).map(row => ({
        id: row.id,
        name: row.name,
        description: row.description,
        color: row.color,
        icon: row.icon,
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
      }));

      // Update local state and localStorage
      setInvestments(loadedInvestments);
      setCustomParameterSets(loadedCustomSets);
      saveToStorage(STORAGE_KEYS.INVESTMENTS, loadedInvestments);
      saveToStorage(STORAGE_KEYS.CUSTOM_SETS, loadedCustomSets);

      return { success: true, message: `Loaded ${loadedInvestments.length} investments and ${loadedCustomSets.length} custom sets from cloud` };
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to load from database';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const savePortfolioToCloud = useCallback(async (name: string, description?: string) => {
    if (!user) {
      throw new Error('Must be signed in to save portfolio to cloud');
    }

    setLoading(true);
    setError(null);

    try {
      // First, create or update the portfolio record
      const portfolioData = {
        user_id: user.id,
        name: name.trim(),
        description: description?.trim() || null,
        updated_at: new Date().toISOString()
      };

      // Try to insert first, if it fails due to unique constraint, update instead
      let portfolioResult;
      let portfolioError;
      
      // First try to insert
      const insertResult = await supabase
        .from('portfolios')
        .insert(portfolioData)
        .select()
        .single();
      
      if (insertResult.error && insertResult.error.code === '23505') {
        // Unique constraint violation, update instead
        const updateResult = await supabase
          .from('portfolios')
          .update({ 
            description: portfolioData.description,
            updated_at: portfolioData.updated_at 
          })
          .eq('user_id', user.id)
          .eq('name', portfolioData.name)
          .select()
          .single();
        
        portfolioResult = updateResult.data;
        portfolioError = updateResult.error;
      } else {
        portfolioResult = insertResult.data;
        portfolioError = insertResult.error;
      }

      if (portfolioError) {
        throw portfolioError;
      }

      const portfolioId = portfolioResult.id;

      // Delete existing investments and custom sets for this portfolio
      await supabase.from('portfolio_investments').delete().eq('portfolio_id', portfolioId);
      await supabase.from('custom_parameter_sets').delete().eq('portfolio_id', portfolioId);

      // Save investments with portfolio_id
      if (investments.length > 0) {
        const investmentRows = investments.map(inv => ({
          // Let DB generate UUID for all items when saving to cloud portfolios
          portfolio_id: portfolioId,
          user_id: user.id,
          company_name: inv.companyName,
          field: inv.field,
          region: inv.region,
          entry_stage: inv.entryStage,
          entry_valuation: inv.entryValuation,
          check_size: inv.checkSize,
          entry_date: inv.entryDate,
          current_stage: inv.currentStage,
          use_presets: inv.usePresets,
          custom_parameter_set_id: null, // Don't reference custom sets for now to avoid FK issues
          stage_progression_to_seed: inv.stageProgression.toSeed,
          stage_progression_to_series_a: inv.stageProgression.toSeriesA,
          stage_progression_to_series_b: inv.stageProgression.toSeriesB,
          stage_progression_to_series_c: inv.stageProgression.toSeriesC,
          stage_progression_to_ipo: inv.stageProgression.toIPO,
          dilution_rates_seed: inv.dilutionRates.seed,
          dilution_rates_series_a: inv.dilutionRates.seriesA,
          dilution_rates_series_b: inv.dilutionRates.seriesB,
          dilution_rates_series_c: inv.dilutionRates.seriesC,
          dilution_rates_ipo: inv.dilutionRates.ipo,
          exit_valuations_pre_seed_min: inv.exitValuations.preSeed[0],
          exit_valuations_pre_seed_max: inv.exitValuations.preSeed[1],
          exit_valuations_seed_min: inv.exitValuations.seed[0],
          exit_valuations_seed_max: inv.exitValuations.seed[1],
          exit_valuations_series_a_min: inv.exitValuations.seriesA[0],
          exit_valuations_series_a_max: inv.exitValuations.seriesA[1],
          exit_valuations_series_b_min: inv.exitValuations.seriesB[0],
          exit_valuations_series_b_max: inv.exitValuations.seriesB[1],
          exit_valuations_series_c_min: inv.exitValuations.seriesC[0],
          exit_valuations_series_c_max: inv.exitValuations.seriesC[1],
          exit_valuations_ipo_min: inv.exitValuations.ipo[0],
          exit_valuations_ipo_max: inv.exitValuations.ipo[1],
          loss_prob_pre_seed: inv.lossProb.preSeed,
          loss_prob_seed: inv.lossProb.seed,
          loss_prob_series_a: inv.lossProb.seriesA,
          loss_prob_series_b: inv.lossProb.seriesB,
          loss_prob_series_c: inv.lossProb.seriesC,
          loss_prob_ipo: inv.lossProb.ipo,
          years_to_next_to_seed_min: inv.yearsToNext.toSeed?.[0],
          years_to_next_to_seed_max: inv.yearsToNext.toSeed?.[1],
          years_to_next_to_series_a_min: inv.yearsToNext.toSeriesA?.[0],
          years_to_next_to_series_a_max: inv.yearsToNext.toSeriesA?.[1],
          years_to_next_to_series_b_min: inv.yearsToNext.toSeriesB?.[0],
          years_to_next_to_series_b_max: inv.yearsToNext.toSeriesB?.[1],
          years_to_next_to_series_c_min: inv.yearsToNext.toSeriesC?.[0],
          years_to_next_to_series_c_max: inv.yearsToNext.toSeriesC?.[1],
          years_to_next_to_ipo_min: inv.yearsToNext.toIPO?.[0],
          years_to_next_to_ipo_max: inv.yearsToNext.toIPO?.[1],
        }));

        const { error: investmentError } = await supabase
          .from('portfolio_investments')
          .insert(investmentRows);

        if (investmentError) {
          throw investmentError;
        }
      }

      // Save custom parameter sets with portfolio_id
      if (customParameterSets.length > 0) {
        const customSetRows = customParameterSets.map(set => ({
          // Let DB generate UUID for all items when saving to cloud portfolios
          portfolio_id: portfolioId,
          user_id: user.id,
          name: set.name,
          description: set.description,
          color: set.color,
          icon: set.icon,
          stage_progression_to_seed: set.stageProgression.toSeed,
          stage_progression_to_series_a: set.stageProgression.toSeriesA,
          stage_progression_to_series_b: set.stageProgression.toSeriesB,
          stage_progression_to_series_c: set.stageProgression.toSeriesC,
          stage_progression_to_ipo: set.stageProgression.toIPO,
          dilution_rates_seed: set.dilutionRates.seed,
          dilution_rates_series_a: set.dilutionRates.seriesA,
          dilution_rates_series_b: set.dilutionRates.seriesB,
          dilution_rates_series_c: set.dilutionRates.seriesC,
          dilution_rates_ipo: set.dilutionRates.ipo,
          loss_prob_pre_seed: set.lossProb.preSeed,
          loss_prob_seed: set.lossProb.seed,
          loss_prob_series_a: set.lossProb.seriesA,
          loss_prob_series_b: set.lossProb.seriesB,
          loss_prob_series_c: set.lossProb.seriesC,
          loss_prob_ipo: set.lossProb.ipo,
          exit_valuations_pre_seed_min: set.exitValuations.preSeed[0],
          exit_valuations_pre_seed_max: set.exitValuations.preSeed[1],
          exit_valuations_seed_min: set.exitValuations.seed[0],
          exit_valuations_seed_max: set.exitValuations.seed[1],
          exit_valuations_series_a_min: set.exitValuations.seriesA[0],
          exit_valuations_series_a_max: set.exitValuations.seriesA[1],
          exit_valuations_series_b_min: set.exitValuations.seriesB[0],
          exit_valuations_series_b_max: set.exitValuations.seriesB[1],
          exit_valuations_series_c_min: set.exitValuations.seriesC[0],
          exit_valuations_series_c_max: set.exitValuations.seriesC[1],
          exit_valuations_ipo_min: set.exitValuations.ipo[0],
          exit_valuations_ipo_max: set.exitValuations.ipo[1],
          years_to_next_to_seed_min: set.yearsToNext.toSeed?.[0],
          years_to_next_to_seed_max: set.yearsToNext.toSeed?.[1],
          years_to_next_to_series_a_min: set.yearsToNext.toSeriesA?.[0],
          years_to_next_to_series_a_max: set.yearsToNext.toSeriesA?.[1],
          years_to_next_to_series_b_min: set.yearsToNext.toSeriesB?.[0],
          years_to_next_to_series_b_max: set.yearsToNext.toSeriesB?.[1],
          years_to_next_to_series_c_min: set.yearsToNext.toSeriesC?.[0],
          years_to_next_to_series_c_max: set.yearsToNext.toSeriesC?.[1],
          years_to_next_to_ipo_min: set.yearsToNext.toIPO?.[0],
          years_to_next_to_ipo_max: set.yearsToNext.toIPO?.[1],
        }));

        const { error: customSetError } = await supabase
          .from('custom_parameter_sets')
          .insert(customSetRows);

        if (customSetError) {
          throw customSetError;
        }
      }

      return { success: true, message: `Portfolio "${name}" saved to cloud with ${investments.length} investments and ${customParameterSets.length} custom sets` };
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to save portfolio to cloud';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user, investments, customParameterSets]);

  const loadPortfolioFromCloud = useCallback(async (portfolioId: string) => {
    if (!user) {
      throw new Error('Must be signed in to load portfolio from cloud');
    }

    setLoading(true);
    setError(null);

    try {
      // Load investments for this portfolio
      const { data: investmentData, error: investmentError } = await supabase
        .from('portfolio_investments')
        .select('*')
        .eq('portfolio_id', portfolioId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (investmentError) throw investmentError;

      // Load custom parameter sets for this portfolio
      const { data: customSetData, error: customSetError } = await supabase
        .from('custom_parameter_sets')
        .select('*')
        .eq('portfolio_id', portfolioId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (customSetError) throw customSetError;

      // Convert database rows to frontend objects (same as loadFromDatabase)
      const loadedInvestments: PortfolioInvestment[] = (investmentData || []).map(row => ({
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
      }));

      const loadedCustomSets: CustomParameterSet[] = (customSetData || []).map(row => ({
        id: row.id,
        name: row.name,
        description: row.description,
        color: row.color,
        icon: row.icon,
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
      }));

      // Update local state and localStorage
      setInvestments(loadedInvestments);
      setCustomParameterSets(loadedCustomSets);
      saveToStorage(STORAGE_KEYS.INVESTMENTS, loadedInvestments);
      saveToStorage(STORAGE_KEYS.CUSTOM_SETS, loadedCustomSets);

      return { success: true, message: `Loaded ${loadedInvestments.length} investments and ${loadedCustomSets.length} custom sets from cloud portfolio` };
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to load portfolio from cloud';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const getSavedPortfolios = useCallback(async (): Promise<SavedPortfolio[]> => {
    if (!user) {
      throw new Error('Must be signed in to get saved portfolios');
    }

    try {
      // First get all portfolios
      const { data: portfolios, error: portfoliosError } = await supabase
        .from('portfolios')
        .select('id, name, description, created_at, updated_at')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (portfoliosError) throw portfoliosError;

      // Then get counts for each portfolio
      const portfoliosWithCounts = await Promise.all(
        (portfolios || []).map(async (portfolio) => {
          // Get investment count
          const { count: investmentCount } = await supabase
            .from('portfolio_investments')
            .select('*', { count: 'exact', head: true })
            .eq('portfolio_id', portfolio.id);

          // Get custom sets count
          const { count: customSetCount } = await supabase
            .from('custom_parameter_sets')
            .select('*', { count: 'exact', head: true })
            .eq('portfolio_id', portfolio.id);

          return {
            id: portfolio.id,
            name: portfolio.name,
            description: portfolio.description,
            created_at: portfolio.created_at,
            updated_at: portfolio.updated_at,
            investment_count: investmentCount || 0,
            custom_set_count: customSetCount || 0,
          };
        })
      );

      return portfoliosWithCounts;
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to get saved portfolios';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [user]);

  const deletePortfolioFromCloud = useCallback(async (portfolioId: string) => {
    if (!user) {
      throw new Error('Must be signed in to delete portfolio from cloud');
    }

    setLoading(true);
    setError(null);

    try {
      // Delete investments and custom sets first (cascade should handle this, but being explicit)
      await supabase.from('portfolio_investments').delete().eq('portfolio_id', portfolioId);
      await supabase.from('custom_parameter_sets').delete().eq('portfolio_id', portfolioId);
      
      // Delete the portfolio
      const { error } = await supabase
        .from('portfolios')
        .delete()
        .eq('id', portfolioId)
        .eq('user_id', user.id); // Ensure user can only delete their own portfolios

      if (error) throw error;

      return { success: true, message: 'Portfolio deleted from cloud' };
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to delete portfolio from cloud';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const refreshData = useCallback(async () => {
    loadLocalData();
  }, [loadLocalData]);

  return {
    investments,
    customParameterSets,
    loading,
    error,
    addInvestment,
    updateInvestment,
    deleteInvestment,
    importInvestments,
    addCustomParameterSet,
    updateCustomParameterSet,
    deleteCustomParameterSet,
    saveToDatabase,
    loadFromDatabase,
    savePortfolioToCloud,
    loadPortfolioFromCloud,
    getSavedPortfolios,
    deletePortfolioFromCloud,
    refreshData,
    clearError,
  }
} 
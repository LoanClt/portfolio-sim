import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useNotifications } from '@/components/NotificationSystem'
import { supabase } from '@/lib/supabase'
import type { CustomParameterSet } from '@/types/portfolio'

const STORAGE_KEY = 'customParameterSets'

// Storage helpers
const getLocalSets = (): CustomParameterSet[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

const saveLocalSets = (sets: CustomParameterSet[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sets))
  } catch (error) {
    console.error('Failed to save to localStorage:', error)
  }
}

// Database conversion helpers
const setToDbRow = (set: CustomParameterSet, userId: string) => ({
  user_id: userId,
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
})

const dbRowToSet = (row: any): CustomParameterSet => ({
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
})

export const useCustomSets = () => {
  const { user } = useAuth()
  const { showSuccess, showError } = useNotifications()
  const [sets, setSets] = useState<CustomParameterSet[]>([])
  const [loading, setLoading] = useState(false)

  // Load sets when user changes
  useEffect(() => {
    if (user) {
      loadFromDatabase()
    } else {
      loadFromLocal()
    }
  }, [user])

  const loadFromLocal = useCallback(() => {
    console.log('📂 Loading custom sets from localStorage')
    const localSets = getLocalSets()
    console.log('📊 Loaded', localSets.length, 'sets from localStorage')
    setSets(localSets)
  }, [])

  const loadFromDatabase = useCallback(async () => {
    if (!user) return
    
    setLoading(true)
    try {
      console.log('🔄 Loading custom sets from database for user:', user.id)
      const { data, error } = await supabase
        .from('custom_parameter_sets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      const loadedSets = (data || []).map(dbRowToSet)
      console.log('📊 Loaded', loadedSets.length, 'sets from database')
      setSets(loadedSets)
    } catch (error) {
      console.error('❌ Failed to load sets from database:', error)
      showError('Load Failed', 'Failed to load custom sets from database')
    } finally {
      setLoading(false)
    }
  }, [user, showError])

  const addSet = useCallback(async (setData: Omit<CustomParameterSet, 'id' | 'createdAt'>) => {
    if (!setData.name?.trim()) {
      throw new Error('Set name is required')
    }

    if (user) {
      // Save to database
      setLoading(true)
      try {
        console.log('💾 Creating custom set in database:', setData.name)
        const dbRow = setToDbRow({ ...setData, id: '', createdAt: '' } as CustomParameterSet, user.id)
        
        const { data, error } = await supabase
          .from('custom_parameter_sets')
          .insert(dbRow)
          .select()
          .single()

        if (error) throw error

        const newSet = dbRowToSet(data)
        setSets(prev => [newSet, ...prev])
        console.log('✅ Custom set created in database:', newSet.id)
        showSuccess('Custom Set Created', `"${newSet.name}" has been saved`)
        return newSet
      } catch (error: any) {
        console.error('❌ Failed to create set in database:', error)
        showError('Creation Failed', error.message)
        throw error
      } finally {
        setLoading(false)
      }
    } else {
      // Save to localStorage
      console.log('💾 Creating custom set in localStorage:', setData.name)
      const newSet: CustomParameterSet = {
        ...setData,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString()
      }
      
      const updatedSets = [newSet, ...sets]
      setSets(updatedSets)
      saveLocalSets(updatedSets)
      console.log('✅ Custom set created in localStorage:', newSet.id)
      showSuccess('Custom Set Created', `"${newSet.name}" has been saved locally`)
      return newSet
    }
  }, [user, sets, showSuccess, showError])

  const updateSet = useCallback(async (id: string, updates: Partial<CustomParameterSet>) => {
    const currentSet = sets.find(s => s.id === id)
    if (!currentSet) {
      throw new Error('Custom set not found')
    }

    if (user) {
      // Update in database
      setLoading(true)
      try {
        console.log('🔄 Updating custom set in database:', id)
        const updatedSet = { ...currentSet, ...updates }
        const dbRow = setToDbRow(updatedSet, user.id)
        
        const { data, error } = await supabase
          .from('custom_parameter_sets')
          .update(dbRow)
          .eq('id', id)
          .eq('user_id', user.id)
          .select()
          .single()

        if (error) throw error

        const newSet = dbRowToSet(data)
        setSets(prev => prev.map(s => s.id === id ? newSet : s))
        console.log('✅ Custom set updated in database:', id)
        showSuccess('Custom Set Updated', `"${newSet.name}" has been updated`)
        return newSet
      } catch (error: any) {
        console.error('❌ Failed to update set in database:', error)
        showError('Update Failed', error.message)
        throw error
      } finally {
        setLoading(false)
      }
    } else {
      // Update in localStorage
      console.log('🔄 Updating custom set in localStorage:', id)
      const updatedSets = sets.map(s => 
        s.id === id ? { ...s, ...updates } : s
      )
      setSets(updatedSets)
      saveLocalSets(updatedSets)
      console.log('✅ Custom set updated in localStorage:', id)
      showSuccess('Custom Set Updated', 'Changes saved locally')
      return updatedSets.find(s => s.id === id)!
    }
  }, [user, sets, showSuccess, showError])

  const deleteSet = useCallback(async (id: string) => {
    const currentSet = sets.find(s => s.id === id)
    if (!currentSet) {
      throw new Error('Custom set not found')
    }

    if (user) {
      // Delete from database
      setLoading(true)
      try {
        console.log('🗑️ Deleting custom set from database:', id)
        const { error } = await supabase
          .from('custom_parameter_sets')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id)

        if (error) throw error

        setSets(prev => prev.filter(s => s.id !== id))
        console.log('✅ Custom set deleted from database:', id)
        showSuccess('Custom Set Deleted', `"${currentSet.name}" has been deleted`)
      } catch (error: any) {
        console.error('❌ Failed to delete set from database:', error)
        showError('Delete Failed', error.message)
        throw error
      } finally {
        setLoading(false)
      }
    } else {
      // Delete from localStorage
      console.log('🗑️ Deleting custom set from localStorage:', id)
      const updatedSets = sets.filter(s => s.id !== id)
      setSets(updatedSets)
      saveLocalSets(updatedSets)
      console.log('✅ Custom set deleted from localStorage:', id)
      showSuccess('Custom Set Deleted', 'Removed from local storage')
    }
  }, [user, sets, showSuccess, showError])

  return {
    sets,
    loading,
    addSet,
    updateSet,
    deleteSet,
    refreshSets: user ? loadFromDatabase : loadFromLocal
  }
} 
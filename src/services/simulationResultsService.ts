import { supabase } from '@/lib/supabase'
import type { PortfolioInvestment } from '@/types/portfolio'

export interface SimulationResult {
  id: string
  portfolioName?: string
  simulationParams: any
  portfolioData: PortfolioInvestment[]
  resultsData: any
  totalFundSize?: number
  expectedReturn?: number
  irr?: number
  multiple?: number
  createdAt: string
}

export class SimulationResultsService {
  private async getCurrentUserId(): Promise<string> {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) {
      throw new Error('User must be authenticated to access simulation results')
    }
    return user.id
  }

  /**
   * Save a simulation result to the database
   */
  async saveSimulation(params: {
    portfolioName?: string
    simulationParams: any
    portfolioData: PortfolioInvestment[]
    resultsData: any
    totalFundSize?: number
    expectedReturn?: number
    irr?: number
    multiple?: number
  }): Promise<SimulationResult> {
    const userId = await this.getCurrentUserId()
    
    const { data, error } = await supabase
      .from('simulation_results')
      .insert({
        user_id: userId,
        portfolio_name: params.portfolioName,
        simulation_params: params.simulationParams,
        portfolio_data: params.portfolioData,
        results_data: params.resultsData,
        total_fund_size: params.totalFundSize,
        expected_return: params.expectedReturn,
        irr: params.irr,
        multiple: params.multiple,
      })
      .select()
      .single()

    if (error) {
      console.error('Error saving simulation:', error)
      throw new Error(`Failed to save simulation: ${error.message}`)
    }

    return this.dbRowToSimulationResult(data)
  }

  /**
   * Get all simulation results for the current user
   */
  async getSimulations(): Promise<SimulationResult[]> {
    const userId = await this.getCurrentUserId()
    
    const { data, error } = await supabase
      .from('simulation_results')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching simulations:', error)
      throw new Error(`Failed to fetch simulations: ${error.message}`)
    }

    return data.map(this.dbRowToSimulationResult)
  }

  /**
   * Get a specific simulation result by ID
   */
  async getSimulation(id: string): Promise<SimulationResult> {
    const userId = await this.getCurrentUserId()
    
    const { data, error } = await supabase
      .from('simulation_results')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (error) {
      console.error('Error fetching simulation:', error)
      throw new Error(`Failed to fetch simulation: ${error.message}`)
    }

    return this.dbRowToSimulationResult(data)
  }

  /**
   * Delete a simulation result
   */
  async deleteSimulation(id: string): Promise<void> {
    const userId = await this.getCurrentUserId()
    
    const { error } = await supabase
      .from('simulation_results')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) {
      console.error('Error deleting simulation:', error)
      throw new Error(`Failed to delete simulation: ${error.message}`)
    }
  }

  /**
   * Update a simulation result (mainly for changing portfolio name)
   */
  async updateSimulation(id: string, updates: {
    portfolioName?: string
  }): Promise<SimulationResult> {
    const userId = await this.getCurrentUserId()
    
    const { data, error } = await supabase
      .from('simulation_results')
      .update({
        portfolio_name: updates.portfolioName,
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      console.error('Error updating simulation:', error)
      throw new Error(`Failed to update simulation: ${error.message}`)
    }

    return this.dbRowToSimulationResult(data)
  }

  /**
   * Get simulation statistics for the user
   */
  async getSimulationStats(): Promise<{
    totalSimulations: number
    averageReturn?: number
    averageIRR?: number
    averageMultiple?: number
  }> {
    const userId = await this.getCurrentUserId()
    
    const { data, error } = await supabase
      .from('simulation_results')
      .select('expected_return, irr, multiple')
      .eq('user_id', userId)

    if (error) {
      console.error('Error fetching simulation stats:', error)
      throw new Error(`Failed to fetch simulation stats: ${error.message}`)
    }

    const validReturns = data.filter(d => d.expected_return !== null).map(d => d.expected_return)
    const validIRRs = data.filter(d => d.irr !== null).map(d => d.irr)
    const validMultiples = data.filter(d => d.multiple !== null).map(d => d.multiple)

    return {
      totalSimulations: data.length,
      averageReturn: validReturns.length > 0 
        ? validReturns.reduce((a, b) => a + b, 0) / validReturns.length 
        : undefined,
      averageIRR: validIRRs.length > 0 
        ? validIRRs.reduce((a, b) => a + b, 0) / validIRRs.length 
        : undefined,
      averageMultiple: validMultiples.length > 0 
        ? validMultiples.reduce((a, b) => a + b, 0) / validMultiples.length 
        : undefined,
    }
  }

  private dbRowToSimulationResult(row: any): SimulationResult {
    return {
      id: row.id,
      portfolioName: row.portfolio_name,
      simulationParams: row.simulation_params,
      portfolioData: row.portfolio_data,
      resultsData: row.results_data,
      totalFundSize: row.total_fund_size,
      expectedReturn: row.expected_return,
      irr: row.irr,
      multiple: row.multiple,
      createdAt: row.created_at,
    }
  }
}

// Export a singleton instance
export const simulationResultsService = new SimulationResultsService() 
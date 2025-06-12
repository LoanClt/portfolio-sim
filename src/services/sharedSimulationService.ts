import { supabase } from '@/lib/supabase'
import { AccountService } from './accountService'
import type { PortfolioInvestment, CustomParameterSet, PortfolioSimulationParams } from '@/types/portfolio'

export interface SharedSimulation {
  id: string
  senderId: string
  recipientId: string
  senderEmail: string
  recipientEmail: string
  senderName: string
  portfolioData: PortfolioInvestment[]
  simulationParams: PortfolioSimulationParams
  customSets?: CustomParameterSet[]
  title?: string
  description?: string
  isRead: boolean
  createdAt: string
  updatedAt: string
}

export interface ShareSimulationRequest {
  recipientEmail: string
  portfolioData: PortfolioInvestment[]
  simulationParams: PortfolioSimulationParams
  customSets?: CustomParameterSet[]
  title?: string
  description?: string
}

export class SharedSimulationService {
  /**
   * Share a simulation with another user
   */
  static async shareSimulation(request: ShareSimulationRequest): Promise<SharedSimulation> {
    try {
      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError) {
        console.error('Auth error:', authError)
        throw new Error(`Authentication error: ${authError.message}`)
      }
      if (!user) {
        throw new Error('User not authenticated')
      }
      console.log('Current user:', user.id, user.email)

      // Get sender's account info
      const senderAccount = await AccountService.getCurrentUserAccount()
      if (!senderAccount) {
        console.error('Sender account not found for user:', user.id)
        throw new Error('Sender account not found')
      }
      console.log('Sender account:', senderAccount.id, senderAccount.email)

      // Check if recipient exists
      const recipientAccount = await AccountService.getAccountByEmail(request.recipientEmail)
      if (!recipientAccount) {
        console.error('Recipient account not found for email:', request.recipientEmail)
        throw new Error(`User with email ${request.recipientEmail} not found`)
      }
      console.log('Recipient account:', recipientAccount.id, recipientAccount.email)

      // Don't allow sharing with yourself
      if (recipientAccount.id === user.id) {
        throw new Error('You cannot share a simulation with yourself')
      }

      // Prepare data for insertion
      const insertData = {
        sender_id: user.id,
        recipient_id: recipientAccount.id,
        sender_email: senderAccount.email,
        recipient_email: recipientAccount.email,
        sender_name: senderAccount.full_name,
        portfolio_data: request.portfolioData,
        simulation_params: request.simulationParams,
        custom_sets: request.customSets || [],
        title: request.title,
        description: request.description
      }
      console.log('Preparing to insert data:', {
        sender_id: insertData.sender_id,
        recipient_id: insertData.recipient_id,
        portfolioDataLength: insertData.portfolio_data.length,
        hasSimulationParams: !!insertData.simulation_params
      })

      // Insert shared simulation
      const { data, error } = await supabase
        .from('shared_simulations')
        .insert(insertData)
        .select()
        .single()

      if (error) {
        console.error('Database error sharing simulation:', error)
        console.error('Error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        })
        throw new Error(`Failed to share simulation: ${error.message || 'Database error occurred'}`)
      }

      console.log('Successfully shared simulation:', data.id)
      return this.dbRowToSharedSimulation(data)
    } catch (error) {
      console.error('Error in shareSimulation:', error)
      // Ensure we always have a meaningful error message
      if (error instanceof Error) {
        throw error
      } else {
        throw new Error('An unexpected error occurred while sharing the simulation')
      }
    }
  }

  /**
   * Get shared simulations received by current user
   */
  static async getReceivedSharedSimulations(): Promise<SharedSimulation[]> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        throw new Error('User not authenticated')
      }

      const { data, error } = await supabase
        .from('shared_simulations')
        .select('*')
        .eq('recipient_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching received simulations:', error)
        throw new Error(`Failed to fetch received simulations: ${error.message || 'Database error occurred'}`)
      }

      return data.map(row => this.dbRowToSharedSimulation(row))
    } catch (error) {
      console.error('Error in getReceivedSharedSimulations:', error)
      if (error instanceof Error) {
        throw error
      } else {
        throw new Error('An unexpected error occurred while fetching received simulations')
      }
    }
  }

  /**
   * Get shared simulations sent by current user
   */
  static async getSentSharedSimulations(): Promise<SharedSimulation[]> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        throw new Error('User not authenticated')
      }

      const { data, error } = await supabase
        .from('shared_simulations')
        .select('*')
        .eq('sender_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching sent simulations:', error)
        throw new Error(`Failed to fetch sent simulations: ${error.message || 'Database error occurred'}`)
      }

      return data.map(row => this.dbRowToSharedSimulation(row))
    } catch (error) {
      console.error('Error in getSentSharedSimulations:', error)
      if (error instanceof Error) {
        throw error
      } else {
        throw new Error('An unexpected error occurred while fetching sent simulations')
      }
    }
  }

  /**
   * Mark a shared simulation as read
   */
  static async markAsRead(simulationId: string): Promise<void> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        throw new Error('User not authenticated')
      }

      const { error } = await supabase
        .from('shared_simulations')
        .update({ is_read: true })
        .eq('id', simulationId)
        .eq('recipient_id', user.id) // Ensure user can only mark their own received simulations

      if (error) {
        console.error('Error marking simulation as read:', error)
        throw new Error(`Failed to mark simulation as read: ${error.message || 'Database error occurred'}`)
      }
    } catch (error) {
      console.error('Error in markAsRead:', error)
      if (error instanceof Error) {
        throw error
      } else {
        throw new Error('An unexpected error occurred while marking simulation as read')
      }
    }
  }

  /**
   * Delete a shared simulation (only sender can delete)
   */
  static async deleteSharedSimulation(simulationId: string): Promise<void> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        throw new Error('User not authenticated')
      }

      const { error } = await supabase
        .from('shared_simulations')
        .delete()
        .eq('id', simulationId)
        .eq('sender_id', user.id) // Ensure user can only delete their own sent simulations

      if (error) {
        console.error('Error deleting shared simulation:', error)
        throw new Error(`Failed to delete shared simulation: ${error.message || 'Database error occurred'}`)
      }
    } catch (error) {
      console.error('Error in deleteSharedSimulation:', error)
      if (error instanceof Error) {
        throw error
      } else {
        throw new Error('An unexpected error occurred while deleting shared simulation')
      }
    }
  }

  /**
   * Get count of unread shared simulations for current user
   */
  static async getUnreadCount(): Promise<number> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        return 0
      }

      const { count, error } = await supabase
        .from('shared_simulations')
        .select('id', { count: 'exact', head: true })
        .eq('recipient_id', user.id)
        .eq('is_read', false)

      if (error) {
        console.error('Error getting unread count:', error)
        return 0
      }

      return count || 0
    } catch (error) {
      console.error('Error in getUnreadCount:', error)
      return 0
    }
  }

  /**
   * Convert database row to SharedSimulation object
   */
  private static dbRowToSharedSimulation(row: any): SharedSimulation {
    return {
      id: row.id,
      senderId: row.sender_id,
      recipientId: row.recipient_id,
      senderEmail: row.sender_email,
      recipientEmail: row.recipient_email,
      senderName: row.sender_name,
      portfolioData: row.portfolio_data,
      simulationParams: row.simulation_params,
      customSets: row.custom_sets,
      title: row.title,
      description: row.description,
      isRead: row.is_read,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }
  }
} 
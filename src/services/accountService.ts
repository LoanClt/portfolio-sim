import { supabase, Account } from '../lib/supabase'

export class AccountService {
  // Create account profile (called after Supabase Auth signup)
  static async createAccountProfile(userId: string, email: string, fullName: string): Promise<Account | null> {
    try {
      const { data, error } = await supabase
        .from('accounts')
        .insert([
          {
            id: userId,
            email,
            full_name: fullName
          }
        ])
        .select()
        .single()

      if (error) {
        console.error('Error creating account profile:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error creating account profile:', error)
      return null
    }
  }

  // Get account by email
  static async getAccountByEmail(email: string): Promise<Account | null> {
    try {
      console.log('Looking up account by email:', email)
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('email', email)
        .single()

      if (error) {
        console.error('Error fetching account by email:', error)
        console.error('Error details:', {
          code: error.code,
          message: error.message,
          details: error.details
        })
        return null
      }

      console.log('Found account:', data?.id, data?.email)
      return data
    } catch (error) {
      console.error('Error fetching account by email:', error)
      return null
    }
  }

  // Update account
  static async updateAccount(id: string, updates: Partial<Pick<Account, 'full_name'>>): Promise<Account | null> {
    try {
      const { data, error } = await supabase
        .from('accounts')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Error updating account:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error updating account:', error)
      return null
    }
  }

  // Get current user's account
  static async getCurrentUserAccount(): Promise<Account | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        console.log('No authenticated user found')
        return null
      }

      console.log('Getting account for current user:', user.id, user.email)
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) {
        console.error('Error fetching current user account:', error)
        console.error('Error details:', {
          code: error.code,
          message: error.message,
          details: error.details
        })
        return null
      }

      console.log('Found current user account:', data?.id, data?.email)
      return data
    } catch (error) {
      console.error('Error fetching current user account:', error)
      return null
    }
  }

  // Ensure account profile exists for authenticated user
  static async ensureAccountProfile(userId: string, email: string, fullName?: string): Promise<Account | null> {
    try {
      // First try to get existing account
      const { data: existingAccount, error: fetchError } = await supabase
        .from('accounts')
        .select('*')
        .eq('id', userId)
        .single()

      if (existingAccount && !fetchError) {
        return existingAccount
      }

      // If no account exists, create one
      const displayName = fullName || email.split('@')[0]
      return await this.createAccountProfile(userId, email, displayName)
    } catch (error) {
      console.error('Error ensuring account profile:', error)
      return null
    }
  }
} 
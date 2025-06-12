import { supabase } from '@/lib/supabase'

export const authService = {
  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser()
    return user
  },

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
    return { user: data.user, session: data.session }
  },

  async signUp(email: string, password: string, fullName?: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    })
    if (error) throw error
    
    // Create account record if user was created
    if (data.user && !data.user.email_confirmed_at) {
      // User needs to confirm email first
      return { user: data.user, session: data.session }
    }
    
    if (data.user) {
      await this.ensureProfileExists(data.user)
    }
    
    return { user: data.user, session: data.session }
  },

  async signOut() {
    console.log('AuthService: Starting sign out...')
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('AuthService: Sign out error:', error)
      throw error
    }
    console.log('AuthService: Sign out successful')
  },

  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback)
  },

  async ensureProfileExists(user: any) {
    try {
      const { data: existingAccount } = await supabase
        .from('accounts')
        .select('id')
        .eq('id', user.id)
        .single()

      if (!existingAccount) {
        const { error } = await supabase
          .from('accounts')
          .insert({
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
          })

        if (error) {
          console.error('Error creating account:', error)
        }
      }
    } catch (error) {
      console.error('Error ensuring profile exists:', error)
    }
  }
} 
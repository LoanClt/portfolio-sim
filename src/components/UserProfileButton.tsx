import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { LogOut, User, Database, Loader2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

export const UserProfileButton: React.FC = () => {
  const { user, signOut, loading } = useAuth()
  const [isSigningOut, setIsSigningOut] = useState(false)

  const handleSignOut = async () => {
    console.log('UserProfileButton: Sign out clicked')
    setIsSigningOut(true)
    try {
      console.log('UserProfileButton: Calling signOut...')
      await signOut()
      console.log('UserProfileButton: Sign out completed')
    } catch (error) {
      console.error('UserProfileButton: Sign out error:', error)
    } finally {
      setIsSigningOut(false)
    }
  }

  const getInitials = (email: string) => {
    return email
      .split('@')[0]
      .split('.')
      .map(part => part.charAt(0).toUpperCase())
      .join('')
      .slice(0, 2)
  }

  const getUserDisplayName = () => {
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name
    }
    if (user?.email) {
      return user.email.split('@')[0]
    }
    return 'User'
  }

  if (loading) {
    return (
      <Button variant="outline" disabled>
        <Loader2 className="h-4 w-4 animate-spin" />
      </Button>
    )
  }

  // If no user, don't show anything (header will show sign-in button)
  if (!user) {
    return null
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarFallback className="text-xs">
              {getInitials(user.email || 'U')}
            </AvatarFallback>
          </Avatar>
          <span className="hidden md:inline">{getUserDisplayName()}</span>
          <Badge variant="secondary" className="hidden lg:inline-flex">
            <Database className="h-3 w-3 mr-1" />
            Connected
          </Badge>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{getUserDisplayName()}</p>
            <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled>
          <User className="mr-2 h-4 w-4" />
          <span>Profile Settings</span>
        </DropdownMenuItem>
        <DropdownMenuItem disabled>
          <Database className="mr-2 h-4 w-4" />
          <span>Data Sync Status</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={handleSignOut}
          disabled={isSigningOut}
          className="text-red-600 focus:text-red-600"
        >
          {isSigningOut ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <LogOut className="mr-2 h-4 w-4" />
          )}
          <span>Sign Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 
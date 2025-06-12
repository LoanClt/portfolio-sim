import { useState, useEffect } from 'react'
import { SharedSimulationService } from '@/services/sharedSimulationService'
import { useAuth } from '@/contexts/AuthContext'

export const useUnreadCount = () => {
  const [unreadCount, setUnreadCount] = useState(0)
  const { user } = useAuth()

  const fetchUnreadCount = async () => {
    if (!user) {
      setUnreadCount(0)
      return
    }

    try {
      const count = await SharedSimulationService.getUnreadCount()
      setUnreadCount(count)
    } catch (error) {
      console.error('Error fetching unread count:', error)
      setUnreadCount(0)
    }
  }

  useEffect(() => {
    fetchUnreadCount()
    
    // Refresh count every 30 seconds when user is authenticated
    if (user) {
      const interval = setInterval(fetchUnreadCount, 30000)
      return () => clearInterval(interval)
    }
  }, [user])

  return { unreadCount, refreshUnreadCount: fetchUnreadCount }
} 
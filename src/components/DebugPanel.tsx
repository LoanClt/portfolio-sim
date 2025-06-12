import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { AlertCircle, CheckCircle, XCircle, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

export const DebugPanel: React.FC = () => {
  const { user, loading } = useAuth()
  const [profileExists, setProfileExists] = useState<boolean | null>(null)
  const [checkingProfile, setCheckingProfile] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

  const hasEnvVars = !!(supabaseUrl && supabaseAnonKey)

  // Check if profile exists in database
  const checkProfile = async () => {
    if (!user) {
      setProfileExists(null)
      return
    }

    setCheckingProfile(true)
    try {
      const { data, error } = await supabase
        .from('accounts')
        .select('id')
        .eq('id', user.id)
        .single()

      setProfileExists(!!data && !error)
    } catch (error) {
      console.error('Error checking profile:', error)
      setProfileExists(false)
    } finally {
      setCheckingProfile(false)
    }
  }

  // Check profile when user changes
  useEffect(() => {
    checkProfile()
  }, [user])

  return (
    <Card className="mt-4">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm">
            <AlertCircle className="w-4 h-4" />
            Debug Information
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-6 w-6 p-0"
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="space-y-4 pt-0">
          
          {/* Environment Variables Check */}
          <div>
            <h4 className="font-medium mb-2 text-sm">Environment Variables</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs">VITE_SUPABASE_URL</span>
                {supabaseUrl ? (
                  <Badge variant="outline" className="text-green-600 border-green-600 text-xs">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Set
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-red-600 border-red-600 text-xs">
                    <XCircle className="w-3 h-3 mr-1" />
                    Missing
                  </Badge>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs">VITE_SUPABASE_ANON_KEY</span>
                {supabaseAnonKey ? (
                  <Badge variant="outline" className="text-green-600 border-green-600 text-xs">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Set
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-red-600 border-red-600 text-xs">
                    <XCircle className="w-3 h-3 mr-1" />
                    Missing
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Authentication Status */}
          <div>
            <h4 className="font-medium mb-2 text-sm">Authentication Status</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs">Loading</span>
                <Badge variant={loading ? "default" : "outline"} className="text-xs">
                  {loading ? "Yes" : "No"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs">User Authenticated</span>
                {user ? (
                  <Badge variant="outline" className="text-green-600 border-green-600 text-xs">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Yes
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-gray-600 border-gray-600 text-xs">
                    <XCircle className="w-3 h-3 mr-1" />
                    No
                  </Badge>
                )}
              </div>
              {user && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-xs">User ID</span>
                    <Badge variant="outline" className="text-xs max-w-[120px] truncate">
                      {user.id}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs">Email</span>
                    <Badge variant="outline" className="text-xs max-w-[120px] truncate">
                      {user.email}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs">Profile in Database</span>
                    <div className="flex items-center gap-1">
                      {checkingProfile ? (
                        <Badge variant="outline" className="text-xs">
                          <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                          Checking...
                        </Badge>
                      ) : profileExists === true ? (
                        <Badge variant="outline" className="text-green-600 border-green-600 text-xs">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Exists
                        </Badge>
                      ) : profileExists === false ? (
                        <Badge variant="outline" className="text-red-600 border-red-600 text-xs">
                          <XCircle className="w-3 h-3 mr-1" />
                          Missing
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-gray-600 border-gray-600 text-xs">
                          Unknown
                        </Badge>
                      )}
                      <Button size="sm" variant="ghost" onClick={checkProfile} disabled={checkingProfile} className="h-6 w-6 p-0">
                        <RefreshCw className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Setup Instructions */}
          {!hasEnvVars && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium text-sm">Setup Required</p>
                  <p className="text-xs">You need to create a <code>.env.local</code> file in your project root with:</p>
                  <pre className="text-xs bg-gray-100 p-2 rounded mt-2">
{`VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key`}
                  </pre>
                  <p className="text-xs mt-2">
                    Get these values from your Supabase dashboard → Settings → API
                  </p>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      )}
    </Card>
  )
} 
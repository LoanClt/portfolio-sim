import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2, Share2, Download, Calendar, FileText, Trash2, Eye, User, Mail } from 'lucide-react'
import { SharedSimulationService, type SharedSimulation } from '@/services/sharedSimulationService'
import { useNotifications } from '@/components/NotificationSystem'
import { formatDistanceToNow } from 'date-fns'

interface SharedSimulationsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onLoadSharedSimulation: (simulation: SharedSimulation) => Promise<void>
}

export const SharedSimulationsDialog: React.FC<SharedSimulationsDialogProps> = ({
  open,
  onOpenChange,
  onLoadSharedSimulation
}) => {
  const { showSuccess, showError } = useNotifications()
  const [loading, setLoading] = useState(false)
  const [receivedSimulations, setReceivedSimulations] = useState<SharedSimulation[]>([])
  const [sentSimulations, setSentSimulations] = useState<SharedSimulation[]>([])
  const [activeTab, setActiveTab] = useState('received')

  useEffect(() => {
    if (open) {
      loadSimulations()
    }
  }, [open])

  const loadSimulations = async () => {
    setLoading(true)
    try {
      const [received, sent] = await Promise.all([
        SharedSimulationService.getReceivedSharedSimulations(),
        SharedSimulationService.getSentSharedSimulations()
      ])
      setReceivedSimulations(received)
      setSentSimulations(sent)
    } catch (error: any) {
      console.error('Error loading shared simulations:', error)
      showError('Load Failed', 'Failed to load shared simulations')
    } finally {
      setLoading(false)
    }
  }

  const handleLoadSimulation = async (simulation: SharedSimulation) => {
    try {
      // Mark as read if it's a received simulation and not already read
      if (!simulation.isRead && receivedSimulations.some(s => s.id === simulation.id)) {
        await SharedSimulationService.markAsRead(simulation.id)
        // Update local state
        setReceivedSimulations(prev => 
          prev.map(s => s.id === simulation.id ? { ...s, isRead: true } : s)
        )
      }
      
      await onLoadSharedSimulation(simulation)
      onOpenChange(false)
      showSuccess('Simulation Loaded', 'Shared simulation loaded successfully')
    } catch (error: any) {
      console.error('Error loading simulation:', error)
      const errorMessage = error?.message || 'An unexpected error occurred while loading the simulation'
      showError('Load Failed', errorMessage)
    }
  }

  const handleDeleteSimulation = async (simulationId: string) => {
    if (!confirm('Are you sure you want to delete this shared simulation?')) {
      return
    }

    try {
      await SharedSimulationService.deleteSharedSimulation(simulationId)
      setSentSimulations(prev => prev.filter(s => s.id !== simulationId))
      showSuccess('Deleted', 'Shared simulation deleted successfully')
    } catch (error: any) {
      console.error('Error deleting simulation:', error)
      showError('Delete Failed', 'Failed to delete shared simulation')
    }
  }

  const getSimulationSummary = (simulation: SharedSimulation) => {
    const companies = simulation.portfolioData.length
    const totalInvestment = simulation.portfolioData.reduce((sum, inv) => sum + inv.checkSize, 0)
    const customSetsCount = simulation.customSets?.length || 0
    
    return {
      companies,
      totalInvestment,
      customSetsCount
    }
  }

  const SimulationCard = ({ 
    simulation, 
    isReceived 
  }: { 
    simulation: SharedSimulation
    isReceived: boolean 
  }) => {
    const summary = getSimulationSummary(simulation)
    const timeAgo = formatDistanceToNow(new Date(simulation.createdAt), { addSuffix: true })

    return (
      <Card className={`${!simulation.isRead && isReceived ? 'border-blue-300 bg-blue-50' : ''}`}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-base flex items-center gap-2">
                {simulation.title || 'Portfolio Simulation'}
                {!simulation.isRead && isReceived && (
                  <Badge variant="default" className="bg-blue-600 text-white text-xs">
                    New
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="flex items-center gap-2 mt-1">
                {isReceived ? (
                  <>
                    <User className="w-3 h-3" />
                    From: {simulation.senderName} ({simulation.senderEmail})
                  </>
                ) : (
                  <>
                    <Mail className="w-3 h-3" />
                    To: {simulation.recipientEmail}
                  </>
                )}
              </CardDescription>
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Calendar className="w-3 h-3" />
              {timeAgo}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {simulation.description && (
            <p className="text-sm text-gray-600">{simulation.description}</p>
          )}
          
          <div className="flex items-center gap-4 text-xs text-gray-600">
            <span>{summary.companies} companies</span>
            <span>${summary.totalInvestment.toFixed(1)}MM total</span>
            {summary.customSetsCount > 0 && (
              <span>{summary.customSetsCount} custom sets</span>
            )}
          </div>
          
          <div className="flex gap-2 pt-2">
            <Button
              size="sm"
              onClick={() => handleLoadSimulation(simulation)}
              className="flex-1"
            >
              <Download className="w-3 h-3 mr-1" />
              Load Portfolio
            </Button>
            {!isReceived && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleDeleteSimulation(simulation.id)}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            Shared Portfolios
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="received" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Received
              {receivedSimulations.filter(s => !s.isRead).length > 0 && (
                <Badge variant="default" className="bg-blue-600 text-white text-xs ml-1">
                  {receivedSimulations.filter(s => !s.isRead).length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="sent" className="flex items-center gap-2">
              <Share2 className="w-4 h-4" />
              Sent ({sentSimulations.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="received" className="space-y-4 mt-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                Loading simulations...
              </div>
            ) : receivedSimulations.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Share2 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="font-medium">No shared simulations received</p>
                <p className="text-sm">Simulations shared with you will appear here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {receivedSimulations.map(simulation => (
                  <SimulationCard
                    key={simulation.id}
                    simulation={simulation}
                    isReceived={true}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="sent" className="space-y-4 mt-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                Loading simulations...
              </div>
            ) : sentSimulations.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Share2 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="font-medium">No simulations shared</p>
                <p className="text-sm">Simulations you share will appear here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sentSimulations.map(simulation => (
                  <SimulationCard
                    key={simulation.id}
                    simulation={simulation}
                    isReceived={false}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
} 
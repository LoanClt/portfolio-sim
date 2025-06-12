import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Share2, Mail } from 'lucide-react'
import { SharedSimulationService } from '@/services/sharedSimulationService'
import { useNotifications } from '@/components/NotificationSystem'
import type { PortfolioInvestment, CustomParameterSet, PortfolioSimulationParams } from '@/types/portfolio'

interface ShareSimulationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  portfolioData: PortfolioInvestment[]
  simulationParams: PortfolioSimulationParams
  customSets: CustomParameterSet[]
}

export const ShareSimulationDialog: React.FC<ShareSimulationDialogProps> = ({
  open,
  onOpenChange,
  portfolioData,
  simulationParams,
  customSets
}) => {
  const { showSuccess, showError } = useNotifications()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    recipientEmail: '',
    title: '',
    description: ''
  })

  const handleShare = async () => {
    if (!formData.recipientEmail.trim()) {
      showError('Email Required', 'Please enter the recipient\'s email address')
      return
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.recipientEmail)) {
      showError('Invalid Email', 'Please enter a valid email address')
      return
    }

    if (!formData.title.trim()) {
      showError('Title Required', 'Please enter a title for the portfolio')
      return
    }

    if (portfolioData.length === 0) {
      showError('No Portfolio Data', 'Cannot share an empty portfolio')
      return
    }

    setLoading(true)
    try {
      await SharedSimulationService.shareSimulation({
        recipientEmail: formData.recipientEmail.trim(),
        portfolioData,
        simulationParams,
        customSets,
        title: formData.title.trim(),
        description: formData.description.trim() || undefined
      })

      showSuccess(
        'Portfolio Shared!', 
        `Successfully shared portfolio with ${formData.recipientEmail}`
      )
      
      // Reset form and close dialog
      setFormData({ recipientEmail: '', title: '', description: '' })
      onOpenChange(false)
    } catch (error: any) {
      console.error('Error sharing simulation:', error)
      if (error.message.includes('not found')) {
        showError(
          'User Not Found', 
          `No user found with email ${formData.recipientEmail}. Make sure they have an account.`
        )
      } else if (error.message.includes('cannot share a simulation with yourself')) {
        showError('Invalid Recipient', 'You cannot share a portfolio with yourself')
      } else {
        showError('Share Failed', error.message || 'Failed to share portfolio')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleClose = () => {
    if (!loading) {
      setFormData({ recipientEmail: '', title: '', description: '' })
      onOpenChange(false)
    }
  }

  // Calculate portfolio summary for display
  const portfolioSummary = {
    companies: portfolioData.length,
    totalInvestment: portfolioData.reduce((sum, inv) => sum + inv.checkSize, 0),
    customSetsUsed: customSets.filter(set => 
      portfolioData.some(inv => inv.customParameterSetId === set.id)
    ).length
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            Share Portfolio
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Portfolio Summary */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="text-sm font-medium text-blue-900 mb-2">Portfolio Summary</div>
            <div className="text-xs text-blue-700 space-y-1">
              <div>{portfolioSummary.companies} companies</div>
              <div>${portfolioSummary.totalInvestment.toFixed(1)}MM total investment</div>
              {portfolioSummary.customSetsUsed > 0 && (
                <div>{portfolioSummary.customSetsUsed} custom parameter sets</div>
              )}
            </div>
          </div>

          {/* Recipient Email */}
          <div className="space-y-2">
            <Label htmlFor="recipientEmail" className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Recipient Email *
            </Label>
            <Input
              id="recipientEmail"
              type="email"
              placeholder="Enter email address"
              value={formData.recipientEmail}
              onChange={(e) => handleInputChange('recipientEmail', e.target.value)}
              disabled={loading}
              className="w-full"
            />
            <p className="text-xs text-gray-600">
              The recipient must have an account to receive the shared portfolio.
            </p>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">
              Title *
            </Label>
            <Input
              id="title"
              placeholder="e.g., Q4 2024 Portfolio Analysis"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              disabled={loading}
              maxLength={100}
            />
          </div>

          {/* Optional Description */}
          <div className="space-y-2">
            <Label htmlFor="description">
              Description (optional)
            </Label>
            <Textarea
              id="description"
              placeholder="Add a note about this portfolio..."
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              disabled={loading}
              rows={3}
              maxLength={500}
            />
          </div>
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={handleClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleShare}
            disabled={loading || !formData.recipientEmail.trim() || !formData.title.trim()}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sharing...
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4 mr-2" />
                Share Portfolio
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 
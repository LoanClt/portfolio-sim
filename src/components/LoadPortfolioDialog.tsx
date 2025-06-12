import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Download, Calendar, FileText, Trash2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface SavedPortfolio {
  id: string
  name: string
  description?: string
  created_at: string
  updated_at: string
  investment_count: number
  custom_set_count: number
}

interface LoadPortfolioDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onLoad: (portfolioId: string) => Promise<void>
  onDelete?: (portfolioId: string) => Promise<void>
  getSavedPortfolios: () => Promise<SavedPortfolio[]>
  loading?: boolean
}

export const LoadPortfolioDialog: React.FC<LoadPortfolioDialogProps> = ({
  open,
  onOpenChange,
  onLoad,
  onDelete,
  getSavedPortfolios,
  loading = false
}) => {
  const [portfolios, setPortfolios] = useState<SavedPortfolio[]>([])
  const [loadingPortfolios, setLoadingPortfolios] = useState(false)
  const [selectedPortfolio, setSelectedPortfolio] = useState<string | null>(null)
  const [loadingAction, setLoadingAction] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchPortfolios = async () => {
    setLoadingPortfolios(true)
    try {
      const savedPortfolios = await getSavedPortfolios()
      setPortfolios(savedPortfolios)
    } catch (error) {
      console.error('Error fetching portfolios:', error)
    } finally {
      setLoadingPortfolios(false)
    }
  }

  useEffect(() => {
    if (open) {
      fetchPortfolios()
    }
  }, [open])

  const handleLoad = async () => {
    if (!selectedPortfolio) return

    setLoadingAction(true)
    try {
      await onLoad(selectedPortfolio)
      onOpenChange(false)
      setSelectedPortfolio(null)
    } catch (error) {
      console.error('Error loading portfolio:', error)
    } finally {
      setLoadingAction(false)
    }
  }

  const handleDelete = async (portfolioId: string) => {
    if (!onDelete) return

    setDeletingId(portfolioId)
    try {
      await onDelete(portfolioId)
      // Refresh the list after deletion
      await fetchPortfolios()
      if (selectedPortfolio === portfolioId) {
        setSelectedPortfolio(null)
      }
    } catch (error) {
      console.error('Error deleting portfolio:', error)
    } finally {
      setDeletingId(null)
    }
  }

  const handleClose = () => {
    if (!loadingAction && !deletingId) {
      setSelectedPortfolio(null)
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Load Portfolio from Cloud
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto py-4">
          {loadingPortfolios ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              Loading portfolios...
            </div>
          ) : portfolios.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No saved portfolios found</p>
              <p className="text-sm">Save a portfolio first to see it here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {portfolios.map((portfolio) => (
                <Card 
                  key={portfolio.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedPortfolio === portfolio.id 
                      ? 'ring-2 ring-primary border-primary' 
                      : 'hover:border-primary/50'
                  }`}
                  onClick={() => setSelectedPortfolio(portfolio.id)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{portfolio.name}</CardTitle>
                        {portfolio.description && (
                          <CardDescription className="mt-1">
                            {portfolio.description}
                          </CardDescription>
                        )}
                      </div>
                      {onDelete && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDelete(portfolio.id)
                          }}
                          disabled={deletingId === portfolio.id}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          {deletingId === portfolio.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">
                          {portfolio.investment_count} investments
                        </Badge>
                        <Badge variant="outline">
                          {portfolio.custom_set_count} custom sets
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        {formatDistanceToNow(new Date(portfolio.updated_at), { addSuffix: true })}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={loadingAction || !!deletingId}
          >
            Cancel
          </Button>
          <Button
            onClick={handleLoad}
            disabled={!selectedPortfolio || loadingAction || loading || !!deletingId}
          >
            {loadingAction || loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Load Portfolio
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 
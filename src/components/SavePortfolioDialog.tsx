import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Loader2, Save } from 'lucide-react'

interface SavePortfolioDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (name: string, description?: string) => Promise<void>
  loading?: boolean
}

export const SavePortfolioDialog: React.FC<SavePortfolioDialogProps> = ({
  open,
  onOpenChange,
  onSave,
  loading = false
}) => {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!name.trim()) return

    setSaving(true)
    try {
      await onSave(name.trim(), description.trim() || undefined)
      setName('')
      setDescription('')
      onOpenChange(false)
    } catch (error) {
      console.error('Error saving portfolio:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleClose = () => {
    if (!saving) {
      setName('')
      setDescription('')
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Save className="w-5 h-5" />
            Save Portfolio to Cloud
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="portfolio-name">Portfolio Name *</Label>
            <Input
              id="portfolio-name"
              placeholder="Enter portfolio name..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={saving || loading}
              maxLength={100}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="portfolio-description">Description (optional)</Label>
            <Textarea
              id="portfolio-description"
              placeholder="Enter portfolio description..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={saving || loading}
              maxLength={500}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={saving || loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!name.trim() || saving || loading}
          >
            {saving || loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Portfolio
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 
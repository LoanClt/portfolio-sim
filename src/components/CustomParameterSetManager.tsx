// Custom Parameter Set Manager Component

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Plus, Edit, Trash2, Copy, Target, Rocket, Brain, Heart, 
  Zap, Globe, Building, Cpu, Star, Shield, Trophy, Crown,
  Diamond, Gem, Wand2, Sparkles, Info
} from 'lucide-react';
import type { CustomParameterSet } from '@/types/portfolio';

interface CustomParameterSetManagerProps {
  customSets: CustomParameterSet[];
  onSetsChange?: (sets: CustomParameterSet[]) => void;
  // Hook-based functions (optional, for database mode)
  onAddSet?: (set: CustomParameterSet) => Promise<void>;
  onUpdateSet?: (id: string, updates: Partial<CustomParameterSet>) => Promise<void>;
  onDeleteSet?: (id: string) => Promise<void>;
}

const AVAILABLE_ICONS = [
  { name: 'Target', component: Target },
  { name: 'Rocket', component: Rocket },
  { name: 'Brain', component: Brain },
  { name: 'Heart', component: Heart },
  { name: 'Zap', component: Zap },
  { name: 'Globe', component: Globe },
  { name: 'Building', component: Building },
  { name: 'Cpu', component: Cpu },
  { name: 'Star', component: Star },
  { name: 'Shield', component: Shield },
  { name: 'Trophy', component: Trophy },
  { name: 'Crown', component: Crown },
  { name: 'Diamond', component: Diamond },
  { name: 'Gem', component: Gem },
  { name: 'Wand2', component: Wand2 },
  { name: 'Sparkles', component: Sparkles }
];

const AVAILABLE_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4',
  '#EC4899', '#84CC16', '#F97316', '#6366F1', '#14B8A6', '#F43F5E',
  '#A855F7', '#22C55E', '#FB923C', '#8B5CF6'
];

const defaultParameterSet: Omit<CustomParameterSet, 'id' | 'createdAt'> = {
  name: '',
  description: '',
  color: '#3B82F6',
  icon: 'Target',
  stageProgression: {
    toSeed: 60,
    toSeriesA: 40,
    toSeriesB: 50,
    toSeriesC: 45,
    toIPO: 30
  },
  dilutionRates: {
    seed: 18,
    seriesA: 20,
    seriesB: 15,
    seriesC: 12,
    ipo: 8
  },
  lossProb: {
    preSeed: 30,
    seed: 25,
    seriesA: 20,
    seriesB: 15,
    seriesC: 10,
    ipo: 5
  },
  exitValuations: {
    preSeed: [5, 15],
    seed: [10, 50],
    seriesA: [30, 150],
    seriesB: [80, 400],
    seriesC: [200, 1000],
    ipo: [500, 5000]
  },
  yearsToNext: {
    toSeed: [1, 2],
    toSeriesA: [1, 3],
    toSeriesB: [1, 3],
    toSeriesC: [1, 3],
    toIPO: [1, 2]
  }
};

const CustomParameterSetManager = ({ 
  customSets, 
  onSetsChange, 
  onAddSet, 
  onUpdateSet, 
  onDeleteSet 
}: CustomParameterSetManagerProps) => {
  const [editingSet, setEditingSet] = useState<CustomParameterSet | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const createSet = async (setData: Omit<CustomParameterSet, 'id' | 'createdAt'>) => {
    try {
      if (onAddSet) {
        // Use hook-based approach (database)
        const newSet: CustomParameterSet = {
          ...setData,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString()
        };
        await onAddSet(newSet);
      } else if (onSetsChange) {
        // Use legacy callback approach (localStorage)
        const newSet: CustomParameterSet = {
          ...setData,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString()
        };
        onSetsChange([...customSets, newSet]);
      }
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error('Failed to create custom parameter set:', error);
    }
  };

  const updateSet = async (updatedSet: CustomParameterSet) => {
    try {
      if (onUpdateSet) {
        // Use hook-based approach (database)
        await onUpdateSet(updatedSet.id, updatedSet);
      } else if (onSetsChange) {
        // Use legacy callback approach (localStorage)
        onSetsChange(customSets.map(set => set.id === updatedSet.id ? updatedSet : set));
      }
      setIsEditDialogOpen(false);
      setEditingSet(null);
    } catch (error) {
      console.error('Failed to update custom parameter set:', error);
    }
  };

  const deleteSet = async (setId: string) => {
    try {
      if (onDeleteSet) {
        // Use hook-based approach (database)
        await onDeleteSet(setId);
      } else if (onSetsChange) {
        // Use legacy callback approach (localStorage)
        onSetsChange(customSets.filter(set => set.id !== setId));
      }
    } catch (error) {
      console.error('Failed to delete custom parameter set:', error);
    }
  };

  const duplicateSet = async (originalSet: CustomParameterSet) => {
    try {
      const duplicatedSet: CustomParameterSet = {
        ...originalSet,
        id: crypto.randomUUID(),
        name: `${originalSet.name} (Copy)`,
        createdAt: new Date().toISOString()
      };
      
      if (onAddSet) {
        // Use hook-based approach (database)
        await onAddSet(duplicatedSet);
      } else if (onSetsChange) {
        // Use legacy callback approach (localStorage)
        onSetsChange([...customSets, duplicatedSet]);
      }
    } catch (error) {
      console.error('Failed to duplicate custom parameter set:', error);
    }
  };

  const getIconComponent = (iconName: string) => {
    const iconData = AVAILABLE_ICONS.find(icon => icon.name === iconName);
    return iconData?.component || Target;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Custom Parameter Sets</CardTitle>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus className="w-4 h-4" />
                Create Set
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Custom Parameter Set</DialogTitle>
              </DialogHeader>
              <ParameterSetForm
                initialData={defaultParameterSet}
                onSubmit={createSet}
                onCancel={() => setIsCreateDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {customSets.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Target className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium mb-2">No Custom Sets Yet</p>
            <p className="text-sm mb-4">Create your first custom parameter set to get started</p>
            <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Create Your First Set
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {customSets.map(set => {
              const IconComponent = getIconComponent(set.icon);
              return (
                <Card key={set.id} className="border-2 hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <Badge 
                        variant="outline" 
                        className="border-2 text-white font-medium px-3 py-1"
                        style={{ 
                          backgroundColor: set.color,
                          borderColor: set.color
                        }}
                      >
                        <IconComponent className="w-4 h-4 mr-2" />
                        {set.name}
                      </Badge>
                    </div>
                    {set.description && (
                      <p className="text-sm text-gray-600 mt-2">{set.description}</p>
                    )}
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2 text-xs text-gray-600 mb-4">
                      <div className="flex justify-between">
                        <span>Seed Progression:</span>
                        <span>{set.stageProgression.toSeed}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Series A Progression:</span>
                        <span>{set.stageProgression.toSeriesA}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Pre-Seed Loss Rate:</span>
                        <span>{set.lossProb.preSeed}%</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingSet(set);
                                setIsEditDialogOpen(true);
                              }}
                              className="flex-1 gap-1"
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Edit</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => duplicateSet(set)}
                              className="flex-1 gap-1"
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Duplicate</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => deleteSet(set.id)}
                              className="flex-1 gap-1 text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Delete</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Custom Parameter Set</DialogTitle>
            </DialogHeader>
            {editingSet && (
              <ParameterSetForm
                initialData={editingSet}
                onSubmit={updateSet}
                onCancel={() => {
                  setIsEditDialogOpen(false);
                  setEditingSet(null);
                }}
                isEditing
              />
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

interface ParameterSetFormProps {
  initialData: Omit<CustomParameterSet, 'id' | 'createdAt'> | CustomParameterSet;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isEditing?: boolean;
}

const ParameterSetForm = ({ initialData, onSubmit, onCancel, isEditing }: ParameterSetFormProps) => {
  const [formData, setFormData] = useState(initialData);

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateNestedData = (section: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section as keyof typeof prev],
        [field]: value
      }
    }));
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) return;
    
    // Ensure all required fields have valid values
    const safeFormData = {
      ...formData,
      stageProgression: {
        toSeed: formData.stageProgression?.toSeed || 60,
        toSeriesA: formData.stageProgression?.toSeriesA || 40,
        toSeriesB: formData.stageProgression?.toSeriesB || 50,
        toSeriesC: formData.stageProgression?.toSeriesC || 45,
        toIPO: formData.stageProgression?.toIPO || 30
      },
      dilutionRates: {
        seed: formData.dilutionRates?.seed || 18,
        seriesA: formData.dilutionRates?.seriesA || 20,
        seriesB: formData.dilutionRates?.seriesB || 15,
        seriesC: formData.dilutionRates?.seriesC || 12,
        ipo: formData.dilutionRates?.ipo || 8
      },
      lossProb: {
        preSeed: formData.lossProb?.preSeed || 30,
        seed: formData.lossProb?.seed || 25,
        seriesA: formData.lossProb?.seriesA || 20,
        seriesB: formData.lossProb?.seriesB || 15,
        seriesC: formData.lossProb?.seriesC || 10,
        ipo: formData.lossProb?.ipo || 5
      },
      exitValuations: {
        preSeed: formData.exitValuations?.preSeed || [5, 15],
        seed: formData.exitValuations?.seed || [10, 50],
        seriesA: formData.exitValuations?.seriesA || [30, 150],
        seriesB: formData.exitValuations?.seriesB || [80, 400],
        seriesC: formData.exitValuations?.seriesC || [200, 1000],
        ipo: formData.exitValuations?.ipo || [500, 5000]
      },
      yearsToNext: {
        toSeed: formData.yearsToNext?.toSeed || [1, 2],
        toSeriesA: formData.yearsToNext?.toSeriesA || [1, 3],
        toSeriesB: formData.yearsToNext?.toSeriesB || [1, 3],
        toSeriesC: formData.yearsToNext?.toSeriesC || [1, 3],
        toIPO: formData.yearsToNext?.toIPO || [1, 2]
      }
    };
    
    onSubmit(safeFormData);
  };

  const getIconComponent = (iconName: string) => {
    const iconData = AVAILABLE_ICONS.find(icon => icon.name === iconName);
    return iconData?.component || Target;
  };

  const IconComponent = getIconComponent(formData.icon);

  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Set Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => updateFormData('name', e.target.value)}
            placeholder="e.g., Conservative Growth"
          />
        </div>
        <div>
          <Label htmlFor="description">Description</Label>
          <Input
            id="description"
            value={formData.description || ''}
            onChange={(e) => updateFormData('description', e.target.value)}
            placeholder="Optional description"
          />
        </div>
      </div>

      {/* Visual Settings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Icon</Label>
          <Select value={formData.icon} onValueChange={(value) => updateFormData('icon', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {AVAILABLE_ICONS.map(icon => {
                const Icon = icon.component;
                return (
                  <SelectItem key={icon.name} value={icon.name}>
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4" />
                      {icon.name}
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Color</Label>
          <div className="flex flex-wrap gap-2 mt-2">
            {AVAILABLE_COLORS.map(color => (
              <button
                key={color}
                type="button"
                className={`w-8 h-8 rounded-full border-2 ${
                  formData.color === color ? 'border-gray-800' : 'border-gray-300'
                }`}
                style={{ backgroundColor: color }}
                onClick={() => updateFormData('color', color)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Preview */}
      <div>
        <Label>Preview</Label>
        <div className="mt-2">
          <Badge 
            variant="outline" 
            className="border-2 text-white font-medium px-3 py-2"
            style={{ 
              backgroundColor: formData.color,
              borderColor: formData.color
            }}
          >
            <IconComponent className="w-4 h-4 mr-2" />
            {formData.name || 'Custom Set'}
          </Badge>
        </div>
      </div>

      {/* Stage Progression */}
      <div>
        <Label className="text-base font-semibold flex items-center gap-2">
          Stage Progression Probabilities (%)
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="w-4 h-4 text-gray-400" />
              </TooltipTrigger>
              <TooltipContent>
                Probability that a company will progress to the next funding stage
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </Label>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-3">
          <div>
            <Label htmlFor="toSeed" className="text-sm">To Seed</Label>
            <Input
              id="toSeed"
              type="number"
              min="0"
              max="100"
              value={formData.stageProgression.toSeed || ''}
              onChange={(e) => updateNestedData('stageProgression', 'toSeed', parseInt(e.target.value) || 0)}
            />
          </div>
          <div>
            <Label htmlFor="toSeriesA" className="text-sm">To Series A</Label>
            <Input
              id="toSeriesA"
              type="number"
              min="0"
              max="100"
              value={formData.stageProgression.toSeriesA || ''}
              onChange={(e) => updateNestedData('stageProgression', 'toSeriesA', parseInt(e.target.value) || 0)}
            />
          </div>
          <div>
            <Label htmlFor="toSeriesB" className="text-sm">To Series B</Label>
            <Input
              id="toSeriesB"
              type="number"
              min="0"
              max="100"
              value={formData.stageProgression.toSeriesB || ''}
              onChange={(e) => updateNestedData('stageProgression', 'toSeriesB', parseInt(e.target.value) || 0)}
            />
          </div>
          <div>
            <Label htmlFor="toSeriesC" className="text-sm">To Series C</Label>
            <Input
              id="toSeriesC"
              type="number"
              min="0"
              max="100"
              value={formData.stageProgression.toSeriesC || ''}
              onChange={(e) => updateNestedData('stageProgression', 'toSeriesC', parseInt(e.target.value) || 0)}
            />
          </div>
          <div>
            <Label htmlFor="toIPO" className="text-sm">To IPO</Label>
            <Input
              id="toIPO"
              type="number"
              min="0"
              max="100"
              value={formData.stageProgression.toIPO || ''}
              onChange={(e) => updateNestedData('stageProgression', 'toIPO', parseInt(e.target.value) || 0)}
            />
          </div>
        </div>
      </div>

      {/* Dilution Rates */}
      <div>
        <Label className="text-base font-semibold flex items-center gap-2">
          Dilution Rates (%)
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="w-4 h-4 text-gray-400" />
              </TooltipTrigger>
              <TooltipContent>
                Percentage of ownership dilution per funding round
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </Label>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-3">
          <div>
            <Label htmlFor="dilutionSeed" className="text-sm">Seed</Label>
            <Input
              id="dilutionSeed"
              type="number"
              min="0"
              max="100"
              value={formData.dilutionRates.seed || ''}
              onChange={(e) => updateNestedData('dilutionRates', 'seed', parseInt(e.target.value) || 0)}
            />
          </div>
          <div>
            <Label htmlFor="dilutionSeriesA" className="text-sm">Series A</Label>
            <Input
              id="dilutionSeriesA"
              type="number"
              min="0"
              max="100"
              value={formData.dilutionRates.seriesA || ''}
              onChange={(e) => updateNestedData('dilutionRates', 'seriesA', parseInt(e.target.value) || 0)}
            />
          </div>
          <div>
            <Label htmlFor="dilutionSeriesB" className="text-sm">Series B</Label>
            <Input
              id="dilutionSeriesB"
              type="number"
              min="0"
              max="100"
              value={formData.dilutionRates.seriesB || ''}
              onChange={(e) => updateNestedData('dilutionRates', 'seriesB', parseInt(e.target.value) || 0)}
            />
          </div>
          <div>
            <Label htmlFor="dilutionSeriesC" className="text-sm">Series C</Label>
            <Input
              id="dilutionSeriesC"
              type="number"
              min="0"
              max="100"
              value={formData.dilutionRates.seriesC || ''}
              onChange={(e) => updateNestedData('dilutionRates', 'seriesC', parseInt(e.target.value) || 0)}
            />
          </div>
          <div>
            <Label htmlFor="dilutionIPO" className="text-sm">IPO</Label>
            <Input
              id="dilutionIPO"
              type="number"
              min="0"
              max="100"
              value={formData.dilutionRates.ipo || ''}
              onChange={(e) => updateNestedData('dilutionRates', 'ipo', parseInt(e.target.value) || 0)}
            />
          </div>
        </div>
      </div>

      {/* Loss Probabilities */}
      <div>
        <Label className="text-base font-semibold flex items-center gap-2">
          Loss Probabilities (%)
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="w-4 h-4 text-gray-400" />
              </TooltipTrigger>
              <TooltipContent>
                Probability of total loss (0x return) at each stage
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </Label>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mt-3">
          <div>
            <Label htmlFor="lossPreSeed" className="text-sm">Pre-Seed</Label>
            <Input
              id="lossPreSeed"
              type="number"
              min="0"
              max="100"
              value={formData.lossProb.preSeed}
              onChange={(e) => updateNestedData('lossProb', 'preSeed', parseInt(e.target.value) || 0)}
            />
          </div>
          <div>
            <Label htmlFor="lossSeed" className="text-sm">Seed</Label>
            <Input
              id="lossSeed"
              type="number"
              min="0"
              max="100"
              value={formData.lossProb.seed}
              onChange={(e) => updateNestedData('lossProb', 'seed', parseInt(e.target.value) || 0)}
            />
          </div>
          <div>
            <Label htmlFor="lossSeriesA" className="text-sm">Series A</Label>
            <Input
              id="lossSeriesA"
              type="number"
              min="0"
              max="100"
              value={formData.lossProb.seriesA}
              onChange={(e) => updateNestedData('lossProb', 'seriesA', parseInt(e.target.value) || 0)}
            />
          </div>
          <div>
            <Label htmlFor="lossSeriesB" className="text-sm">Series B</Label>
            <Input
              id="lossSeriesB"
              type="number"
              min="0"
              max="100"
              value={formData.lossProb.seriesB}
              onChange={(e) => updateNestedData('lossProb', 'seriesB', parseInt(e.target.value) || 0)}
            />
          </div>
          <div>
            <Label htmlFor="lossSeriesC" className="text-sm">Series C</Label>
            <Input
              id="lossSeriesC"
              type="number"
              min="0"
              max="100"
              value={formData.lossProb.seriesC}
              onChange={(e) => updateNestedData('lossProb', 'seriesC', parseInt(e.target.value) || 0)}
            />
          </div>
          <div>
            <Label htmlFor="lossIPO" className="text-sm">IPO</Label>
            <Input
              id="lossIPO"
              type="number"
              min="0"
              max="100"
              value={formData.lossProb.ipo}
              onChange={(e) => updateNestedData('lossProb', 'ipo', parseInt(e.target.value) || 0)}
            />
          </div>
        </div>
      </div>

      {/* Exit Valuations */}
      <div>
        <Label className="text-base font-semibold flex items-center gap-2">
          Exit Valuations ($MM) - Min/Max Range
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="w-4 h-4 text-gray-400" />
              </TooltipTrigger>
              <TooltipContent>
                Expected exit valuation ranges at each stage (minimum and maximum values in millions)
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </Label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-3">
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Pre-Seed & Seed</h4>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="exitPreSeedMin" className="text-xs">Pre-Seed Min</Label>
                <Input
                  id="exitPreSeedMin"
                  type="number"
                  min="0"
                  step="0.1"
                  value={formData.exitValuations.preSeed[0]}
                  onChange={(e) => updateNestedData('exitValuations', 'preSeed', [parseFloat(e.target.value) || 0, formData.exitValuations.preSeed[1]])}
                />
              </div>
              <div>
                <Label htmlFor="exitPreSeedMax" className="text-xs">Pre-Seed Max</Label>
                <Input
                  id="exitPreSeedMax"
                  type="number"
                  min="0"
                  step="0.1"
                  value={formData.exitValuations.preSeed[1]}
                  onChange={(e) => updateNestedData('exitValuations', 'preSeed', [formData.exitValuations.preSeed[0], parseFloat(e.target.value) || 0])}
                />
              </div>
              <div>
                <Label htmlFor="exitSeedMin" className="text-xs">Seed Min</Label>
                <Input
                  id="exitSeedMin"
                  type="number"
                  min="0"
                  step="0.1"
                  value={formData.exitValuations.seed[0]}
                  onChange={(e) => updateNestedData('exitValuations', 'seed', [parseFloat(e.target.value) || 0, formData.exitValuations.seed[1]])}
                />
              </div>
              <div>
                <Label htmlFor="exitSeedMax" className="text-xs">Seed Max</Label>
                <Input
                  id="exitSeedMax"
                  type="number"
                  min="0"
                  step="0.1"
                  value={formData.exitValuations.seed[1]}
                  onChange={(e) => updateNestedData('exitValuations', 'seed', [formData.exitValuations.seed[0], parseFloat(e.target.value) || 0])}
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium text-sm">Series A & B</h4>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="exitSeriesAMin" className="text-xs">Series A Min</Label>
                <Input
                  id="exitSeriesAMin"
                  type="number"
                  min="0"
                  step="1"
                  value={formData.exitValuations.seriesA[0]}
                  onChange={(e) => updateNestedData('exitValuations', 'seriesA', [parseInt(e.target.value) || 0, formData.exitValuations.seriesA[1]])}
                />
              </div>
              <div>
                <Label htmlFor="exitSeriesAMax" className="text-xs">Series A Max</Label>
                <Input
                  id="exitSeriesAMax"
                  type="number"
                  min="0"
                  step="1"
                  value={formData.exitValuations.seriesA[1]}
                  onChange={(e) => updateNestedData('exitValuations', 'seriesA', [formData.exitValuations.seriesA[0], parseInt(e.target.value) || 0])}
                />
              </div>
              <div>
                <Label htmlFor="exitSeriesBMin" className="text-xs">Series B Min</Label>
                <Input
                  id="exitSeriesBMin"
                  type="number"
                  min="0"
                  step="1"
                  value={formData.exitValuations.seriesB[0]}
                  onChange={(e) => updateNestedData('exitValuations', 'seriesB', [parseInt(e.target.value) || 0, formData.exitValuations.seriesB[1]])}
                />
              </div>
              <div>
                <Label htmlFor="exitSeriesBMax" className="text-xs">Series B Max</Label>
                <Input
                  id="exitSeriesBMax"
                  type="number"
                  min="0"
                  step="1"
                  value={formData.exitValuations.seriesB[1]}
                  onChange={(e) => updateNestedData('exitValuations', 'seriesB', [formData.exitValuations.seriesB[0], parseInt(e.target.value) || 0])}
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium text-sm">Series C & IPO</h4>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="exitSeriesCMin" className="text-xs">Series C Min</Label>
                <Input
                  id="exitSeriesCMin"
                  type="number"
                  min="0"
                  step="10"
                  value={formData.exitValuations.seriesC[0]}
                  onChange={(e) => updateNestedData('exitValuations', 'seriesC', [parseInt(e.target.value) || 0, formData.exitValuations.seriesC[1]])}
                />
              </div>
              <div>
                <Label htmlFor="exitSeriesCMax" className="text-xs">Series C Max</Label>
                <Input
                  id="exitSeriesCMax"
                  type="number"
                  min="0"
                  step="10"
                  value={formData.exitValuations.seriesC[1]}
                  onChange={(e) => updateNestedData('exitValuations', 'seriesC', [formData.exitValuations.seriesC[0], parseInt(e.target.value) || 0])}
                />
              </div>
              <div>
                <Label htmlFor="exitIPOMin" className="text-xs">IPO Min</Label>
                <Input
                  id="exitIPOMin"
                  type="number"
                  min="0"
                  step="50"
                  value={formData.exitValuations.ipo[0]}
                  onChange={(e) => updateNestedData('exitValuations', 'ipo', [parseInt(e.target.value) || 0, formData.exitValuations.ipo[1]])}
                />
              </div>
              <div>
                <Label htmlFor="exitIPOMax" className="text-xs">IPO Max</Label>
                <Input
                  id="exitIPOMax"
                  type="number"
                  min="0"
                  step="50"
                  value={formData.exitValuations.ipo[1]}
                  onChange={(e) => updateNestedData('exitValuations', 'ipo', [formData.exitValuations.ipo[0], parseInt(e.target.value) || 0])}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4 border-t">
        <Button onClick={handleSubmit} disabled={!formData.name.trim()}>
          {isEditing ? 'Update Set' : 'Create Set'}
        </Button>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
};

export default CustomParameterSetManager;

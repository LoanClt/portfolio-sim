import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Trash2, Edit, Plus, Download, Upload, Building2, Percent, DollarSign, TrendingUp, Zap, Settings, AlertCircle, Cloud, CloudOff, CloudDownload, CloudUpload, Info, Share2, Bell } from 'lucide-react';
import type { PortfolioInvestment, StartupField, StartupRegion, CustomParameterSet } from '@/types/portfolio';
import { getStartupFieldIcon, getStartupFieldLabel, getRegionIcon, getRegionLabel, startupFieldPresets, getRegionalExitValuations } from '@/utils/startupFieldPresets';
import InvestmentParameterEditor from './InvestmentParameterEditor';
import CustomParameterSetManager from './CustomParameterSetManager';
import { UserProfileButton } from './UserProfileButton';
import { SavePortfolioDialog } from './SavePortfolioDialog';
import { LoadPortfolioDialog } from './LoadPortfolioDialog';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/components/NotificationSystem';
import { usePortfolioData } from '@/hooks/usePortfolioData';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { BarChart, CartesianGrid, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Bar } from 'recharts';

interface PortfolioManagerProps {
  // Legacy props for localStorage compatibility
  investments?: PortfolioInvestment[];
  onInvestmentsChange?: (investments: PortfolioInvestment[]) => void;
  onCustomSetsChange?: (customSets: CustomParameterSet[]) => void;
  
  // Share functionality props
  portfolioData?: PortfolioInvestment[];
  simulationParams?: any;
  customSets?: CustomParameterSet[];
  onShareClick?: () => void;
  onViewSharedClick?: () => void;
  unreadCount?: number;
  
  // Expose import functionality for shared simulations
  onImportInvestments?: (investments: PortfolioInvestment[]) => Promise<void>;
}

const stages = ['Pre-Seed', 'Seed', 'Series A', 'Series B', 'Series C', 'IPO'];
const startupFields: StartupField[] = ['software', 'deeptech', 'biotech', 'fintech', 'ecommerce', 'healthcare', 'energy', 'foodtech'];
const regions: StartupRegion[] = ['US', 'Europe'];

const getStageColor = (stage: string) => {
  switch (stage) {
    case 'Pre-Seed':
      return {
        badge: 'border-violet-200 bg-violet-50 text-violet-700',
        dot: 'bg-violet-500'
      };
    case 'Seed':
      return {
        badge: 'border-green-200 bg-green-50 text-green-700',
        dot: 'bg-green-500'
      };
    case 'Series A':
      return {
        badge: 'border-blue-200 bg-blue-50 text-blue-700',
        dot: 'bg-blue-500'
      };
    case 'Series B':
      return {
        badge: 'border-yellow-200 bg-yellow-50 text-yellow-800',
        dot: 'bg-yellow-400'
      };
    case 'Series C':
      return {
        badge: 'border-orange-200 bg-orange-50 text-orange-800',
        dot: 'bg-orange-500'
      };
    case 'IPO':
      return {
        badge: 'border-pink-200 bg-pink-50 text-pink-700',
        dot: 'bg-pink-500'
      };
    default:
      return {
        badge: 'border-gray-200 bg-gray-50 text-gray-600',
        dot: 'bg-gray-400'
      };
  }
};

const defaultInvestment: Omit<PortfolioInvestment, 'id'> = {
  companyName: '',
  field: 'software',
  region: 'US',
  entryStage: 'Pre-Seed',
  entryValuation: 5,
  checkSize: 1,
  entryDate: new Date().toISOString().split('T')[0],
  currentStage: 'Pre-Seed',
  usePresets: true,
  customParameterSetId: undefined,
  stageProgression: {
    toSeed: 65,
    toSeriesA: 45,
    toSeriesB: 55,
    toSeriesC: 48,
    toIPO: 35
  },
  dilutionRates: {
    seed: 18,
    seriesA: 20,
    seriesB: 15,
    seriesC: 12,
    ipo: 8
  },
  exitValuations: getRegionalExitValuations('software', 'US'),
  lossProb: {
    preSeed: 25,
    seed: 20,
    seriesA: 15,
    seriesB: 10,
    seriesC: 8,
    ipo: 3
  },
  yearsToNext: {
    toSeed: [1, 2],
    toSeriesA: [1, 3],
    toSeriesB: [1, 3],
    toSeriesC: [1, 3],
    toIPO: [1, 2]
  }
};

const PortfolioManager = ({ 
  investments: legacyInvestments, 
  onInvestmentsChange, 
  onCustomSetsChange,
  portfolioData,
  simulationParams,
  customSets: shareCustomSets,
  onShareClick,
  onViewSharedClick,
  unreadCount,
  onImportInvestments
}: PortfolioManagerProps) => {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotifications();
  const hookData = usePortfolioData();
  
  // Use passed props if available, otherwise fall back to hook data
  const investments = portfolioData || hookData.investments;
  const customParameterSets = shareCustomSets || hookData.customParameterSets;
  const {
    loading,
    error,
    addInvestment,
    updateInvestment,
    deleteInvestment,
    importInvestments,
    addCustomParameterSet,
    updateCustomParameterSet,
    deleteCustomParameterSet,
    saveToDatabase,
    loadFromDatabase,
    savePortfolioToCloud,
    loadPortfolioFromCloud,
    getSavedPortfolios,
    deletePortfolioFromCloud,
    refreshData,
    clearError
  } = hookData;
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [showOverview, setShowOverview] = useState(false);
  const [showCustomSetsManager, setShowCustomSetsManager] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newInvestment, setNewInvestment] = useState<PortfolioInvestment | null>(null);
  const [savingToDatabase, setSavingToDatabase] = useState(false);
  const [loadingFromDatabase, setLoadingFromDatabase] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);

  // Legacy sync for backward compatibility (if props are provided)
  useEffect(() => {
    if (onInvestmentsChange && investments) {
      onInvestmentsChange(investments);
    }
  }, [investments, onInvestmentsChange]);

  // Legacy sync for backward compatibility (if props are provided)
  useEffect(() => {
    if (onCustomSetsChange && customParameterSets) {
      onCustomSetsChange(customParameterSets);
    }
  }, [customParameterSets, onCustomSetsChange]);

  const handleSaveToDatabase = async () => {
    if (!user) return;
    
    setSavingToDatabase(true);
    try {
      const result = await saveToDatabase();
      showSuccess('Data Saved', result.message);
    } catch (error: any) {
      console.error('Error saving to database:', error);
      showError('Save Failed', error.message || 'Failed to save to database');
    } finally {
      setSavingToDatabase(false);
    }
  };

  const handleLoadFromDatabase = async () => {
    if (!user) return;
    
    setLoadingFromDatabase(true);
    try {
      const result = await loadFromDatabase();
      showSuccess('Data Loaded', result.message);
      await refreshData();
    } catch (error: any) {
      console.error('Error loading from database:', error);
      showError('Load Failed', error.message || 'Failed to load from database');
    } finally {
      setLoadingFromDatabase(false);
    }
  };

  const handleSavePortfolioToCloud = async (name: string, description?: string) => {
    if (!user) return;
    
    try {
      const result = await savePortfolioToCloud(name, description);
      showSuccess('Portfolio Saved', result.message);
    } catch (error: any) {
      console.error('Error saving portfolio to cloud:', error);
      showError('Save Failed', error.message || 'Failed to save portfolio to cloud');
    }
  };

  const handleLoadPortfolioFromCloud = async (portfolioId: string) => {
    if (!user) return;
    
    try {
      const result = await loadPortfolioFromCloud(portfolioId);
      showSuccess('Portfolio Loaded', result.message);
      await refreshData();
    } catch (error: any) {
      console.error('Error loading portfolio from cloud:', error);
      showError('Load Failed', error.message || 'Failed to load portfolio from cloud');
    }
  };

  const handleDeletePortfolioFromCloud = async (portfolioId: string) => {
    if (!user) return;
    
    try {
      const result = await deletePortfolioFromCloud(portfolioId);
      showSuccess('Portfolio Deleted', result.message);
    } catch (error: any) {
      console.error('Error deleting portfolio from cloud:', error);
      showError('Delete Failed', error.message || 'Failed to delete portfolio from cloud');
    }
  };

  const handleAddInvestment = async () => {
    if (!newInvestment) return;
    
    try {
      await addInvestment({ ...newInvestment, id: Date.now().toString() });
      setShowAddForm(false);
      setNewInvestment(null);
    } catch (error) {
      console.error('Failed to add investment:', error);
    }
  };

  const exportPortfolio = () => {
    const dataStr = JSON.stringify(investments, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'portfolio.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const importPortfolio = async (event: React.ChangeEvent<HTMLInputElement> | { target: FileReader }) => {
    let file: File | null = null;
    let result: string | null = null;

    if ('files' in event.target && event.target.files) {
      // File input event
      file = event.target.files[0];
      if (!file) return;
    } else {
      // FileReader event from drag & drop
      result = event.target.result as string;
    }

    const processFile = async (content: string) => {
      try {
        const importedData = JSON.parse(content);
        if (Array.isArray(importedData)) {
          // Use passed import function if available, otherwise use hook's function
          const importFn = onImportInvestments || importInvestments;
          await importFn(importedData);
          showSuccess('Import Successful', `Successfully imported ${importedData.length} investments`);
          setShowImportDialog(false);
        } else {
          showError('Import Failed', 'Invalid file format. Expected an array of investments.');
        }
      } catch (error) {
        console.error('Error importing portfolio:', error);
        showError('Import Failed', 'Failed to import portfolio. Please check the file format.');
      }
    };

    if (result) {
      // Direct content from drag & drop
      await processFile(result);
    } else if (file) {
      // File from input
      const reader = new FileReader();
      reader.onload = async (e) => {
        await processFile(e.target?.result as string);
      };
      reader.readAsText(file);
    }

    // Clear the file input so the same file can be imported again if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const applyFieldPresets = (investment: PortfolioInvestment, field: StartupField) => {
    const presets = startupFieldPresets[field];
    const exitValuations = getRegionalExitValuations(field, investment.region);
    return {
      ...investment,
      field,
      usePresets: true,
      stageProgression: presets.stageProgression,
      dilutionRates: presets.dilutionRates,
      lossProb: presets.lossProb,
      exitValuations
    };
  };

  const applyRegionPresets = (investment: PortfolioInvestment, region: StartupRegion) => {
    const exitValuations = getRegionalExitValuations(investment.field, region);
    return {
      ...investment,
      region,
      exitValuations
    };
  };

  const InvestmentForm = ({ investment, onUpdate }: { 
    investment: PortfolioInvestment; 
    onUpdate: (updates: Partial<PortfolioInvestment>) => void;
  }) => {
    const FieldIcon = getStartupFieldIcon(investment.field);
    
    return (
      <div className="space-y-4 p-4 border rounded-lg bg-slate-50">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="companyName">Company Name</Label>
            <Input
              id="companyName"
              value={investment.companyName}
              onChange={(e) => onUpdate({ companyName: e.target.value })}
              placeholder="Enter company name"
            />
          </div>
          <div>
            <Label htmlFor="startupField">Startup Field</Label>
            <Select 
              value={investment.field} 
              onValueChange={(value: StartupField) => {
                const updatedInvestment = applyFieldPresets(investment, value);
                onUpdate(updatedInvestment);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {startupFields.map(field => {
                  const Icon = getStartupFieldIcon(field);
                  return (
                    <SelectItem key={field} value={field}>
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4" />
                        {getStartupFieldLabel(field)}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="region">Region</Label>
            <Select 
              value={investment.region} 
              onValueChange={(value: StartupRegion) => {
                const updatedInvestment = applyRegionPresets(investment, value);
                onUpdate(updatedInvestment);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {regions.map(region => {
                  const Icon = getRegionIcon(region);
                  return (
                    <SelectItem key={region} value={region}>
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4" />
                        {getRegionLabel(region)}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="entryStage">Entry Stage</Label>
            <Select 
              value={investment.entryStage} 
              onValueChange={(value) => onUpdate({ entryStage: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {stages.map(stage => (
                  <SelectItem key={stage} value={stage}>{stage}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="entryValuation">Entry Valuation ($MM)</Label>
            <Input
              id="entryValuation"
              type="number"
              min="0"
              step="0.1"
              value={investment.entryValuation}
              onChange={(e) => onUpdate({ entryValuation: Number(e.target.value) })}
              placeholder="e.g., 5.0"
            />
          </div>
          <div>
            <Label htmlFor="checkSize">Check Size ($MM)</Label>
            <Input
              id="checkSize"
              type="number"
              min="0"
              step="0.1"
              value={investment.checkSize}
              onChange={(e) => onUpdate({ checkSize: Number(e.target.value) })}
              placeholder="e.g., 1.0"
            />
          </div>
          <div>
            <Label htmlFor="entryDate">Entry Date</Label>
            <Input
              id="entryDate"
              type="date"
              value={investment.entryDate}
              onChange={(e) => onUpdate({ entryDate: e.target.value })}
            />
          </div>
        </div>

        <InvestmentParameterEditor
          investment={investment}
          onUpdate={onUpdate}
          customParameterSets={customParameterSets}
        />

        <div className="flex gap-2 pt-4">
          <Button 
            onClick={() => setEditingId(null)} 
            size="sm"
            variant="outline"
          >
            Done
          </Button>
        </div>
      </div>
    );
  };

  // --- Portfolio Summary Data ---
  const numStartups = investments.length;
  const stageCounts = stages.map(stage => ({
    stage,
    count: investments.filter(inv => inv.entryStage === stage).length
  }));
  const fieldCounts = startupFields.map(field => ({
    field,
    count: investments.filter(inv => inv.field === field).length
  }));

  // Calculate average metrics
  const avgOwnership = investments.length > 0 
    ? investments.reduce((sum, inv) => sum + (inv.entryValuation > 0 ? (inv.checkSize / inv.entryValuation) * 100 : 0), 0) / investments.length
    : 0;
  const avgTicketSize = investments.length > 0 
    ? investments.reduce((sum, inv) => sum + inv.checkSize, 0) / investments.length
    : 0;
  const avgValuation = investments.length > 0 
    ? investments.reduce((sum, inv) => sum + inv.entryValuation, 0) / investments.length
    : 0;

  return (
    <Card>
      <CardHeader>
        {/* Top row: Portfolio Management title with Add Investment button on the right */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <CardTitle>Portfolio Management</CardTitle>
            <div className="flex items-center gap-2 bg-slate-100 rounded px-3 py-1 text-slate-700 text-sm font-medium">
              <Building2 className="w-4 h-4 text-blue-500" />
              {numStartups}
            </div>
            {/* Database connection status */}
            <div className="flex items-center gap-2">
              {user ? (
                <div className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                  <Cloud className="w-3 h-3" />
                  Cloud Sync
                </div>
              ) : (
                <div className="flex items-center gap-1 text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
                  <CloudOff className="w-3 h-3" />
                  Local Only
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="w-3 h-3 ml-1 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Connect to have access to all features</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              )}
            </div>
          </div>
          <Button 
            onClick={() => { setShowAddForm(true); setNewInvestment({ ...defaultInvestment }); }} 
            size="sm"
            disabled={loading}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Investment
          </Button>
        </div>

        {/* Bottom row: Action buttons layout */}
        <div className="flex gap-4">
          {/* Left column: Import + Export (stacked vertically) */}
          <div className="flex flex-col gap-2">
            <Button 
              onClick={() => setShowImportDialog(true)} 
              size="sm" 
              variant="outline"
              className="w-24"
            >
              <Download className="w-4 h-4 mr-2" />
              Import
            </Button>
            <Button 
              onClick={exportPortfolio} 
              size="sm" 
              variant="outline"
              className="w-24"
            >
              <Upload className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>

          {/* Middle column: Cloud Actions (stacked vertically) */}
          <div className="flex flex-col gap-2">
            <Button 
              onClick={user ? () => setShowLoadDialog(true) : undefined} 
              variant="outline"
              disabled={!user || loading}
              className={`w-40 h-9 ${user 
                ? 'border-blue-200 hover:border-blue-300 bg-blue-50 hover:bg-blue-100' 
                : 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
              }`}
            >
              <CloudDownload className="w-4 h-4 mr-2" />
              Load from Cloud
            </Button>
            <Button 
              onClick={user ? () => setShowSaveDialog(true) : undefined} 
              variant="outline"
              disabled={!user || loading}
              className={`w-40 h-9 ${user 
                ? 'border-green-200 hover:border-green-300 bg-green-50 hover:bg-green-100' 
                : 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
              }`}
            >
              <CloudUpload className="w-4 h-4 mr-2" />
              Save to Cloud
            </Button>
          </div>

          {/* Third column: Custom Sets */}
          <div className="flex flex-col gap-2">
            <Button 
              onClick={user ? () => setShowCustomSetsManager(true) : undefined} 
              variant="outline"
              disabled={!user}
              className={`w-32 h-9 ${user 
                ? 'border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50' 
                : 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
              }`}
            >
              <Settings className="w-4 h-4 mr-2" />
              Custom Sets
            </Button>
          </div>

          {/* Right column: Share Actions (only show if user is authenticated) */}
          {user && (
            <div className="flex flex-col gap-2 ml-auto">
              <Button 
                onClick={onShareClick}
                disabled={!portfolioData || portfolioData.length === 0}
                variant="outline"
                className="w-36 h-9"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share Portfolio
              </Button>
              <Button 
                onClick={onViewSharedClick}
                variant="outline"
                className="w-36 h-9"
              >
                <Bell className="w-4 h-4 mr-2" />
                View Shared
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={importPortfolio}
          className="hidden"
        />

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>{error}</span>
              <Button size="sm" variant="outline" onClick={clearError}>
                Dismiss
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Loading State */}
        {loading && (
          <Alert>
            <AlertDescription>
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                Loading portfolio data...
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Average Metrics */}
        {investments.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg">
                <Percent className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-blue-900">Avg. Ownership</p>
                <p className="text-lg font-bold text-blue-700">{avgOwnership.toFixed(1)}%</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-green-900">Avg. Ticket Size</p>
                <p className="text-lg font-bold text-green-700">${avgTicketSize.toFixed(1)}MM</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
              <div className="flex items-center justify-center w-10 h-10 bg-purple-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-purple-900">Avg. Valuation</p>
                <p className="text-lg font-bold text-purple-700">${avgValuation.toFixed(1)}MM</p>
              </div>
            </div>
          </div>
        )}

        {showAddForm && (
          <div className="space-y-4 p-4 border-2 border-dashed border-blue-200 rounded-lg">
            <h3 className="font-semibold">Add New Investment</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="companyName">Company Name</Label>
                <Input
                  id="companyName"
                  value={newInvestment?.companyName || ''}
                  onChange={e => setNewInvestment(inv => ({ ...(inv || { ...defaultInvestment }), companyName: e.target.value }))}
                  placeholder="Enter company name"
                />
              </div>
              <div>
                <Label htmlFor="startupField">Startup Field</Label>
                <Select
                  value={newInvestment?.field || 'software'}
                  onValueChange={value => setNewInvestment(inv => ({ ...(inv || { ...defaultInvestment }), field: value as StartupField }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {startupFields.map(field => {
                      const Icon = getStartupFieldIcon(field);
                      return (
                        <SelectItem key={field} value={field}>
                          <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4" />
                            {getStartupFieldLabel(field)}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="region">Region</Label>
                <Select
                  value={newInvestment?.region || 'US'}
                  onValueChange={value => setNewInvestment(inv => ({ ...(inv || { ...defaultInvestment }), region: value as StartupRegion }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {regions.map(region => {
                      const Icon = getRegionIcon(region);
                      return (
                        <SelectItem key={region} value={region}>
                          <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4" />
                            {getRegionLabel(region)}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="entryStage">Entry Stage</Label>
                <Select
                  value={newInvestment?.entryStage || 'Pre-Seed'}
                  onValueChange={value => setNewInvestment(inv => ({ ...(inv || { ...defaultInvestment }), entryStage: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {stages.map(stage => (
                      <SelectItem key={stage} value={stage}>{stage}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="entryValuation">Entry Valuation ($MM)</Label>
                <Input
                  id="entryValuation"
                  type="number"
                  min="0"
                  step="0.1"
                  value={newInvestment?.entryValuation || ''}
                  onChange={e => setNewInvestment(inv => ({ ...(inv || { ...defaultInvestment }), entryValuation: Number(e.target.value) }))}
                  placeholder="e.g., 5.0"
                />
              </div>
              <div>
                <Label htmlFor="checkSize">Check Size ($MM)</Label>
                <Input
                  id="checkSize"
                  type="number"
                  min="0"
                  step="0.1"
                  value={newInvestment?.checkSize || ''}
                  onChange={e => setNewInvestment(inv => ({ ...(inv || { ...defaultInvestment }), checkSize: Number(e.target.value) }))}
                  placeholder="e.g., 1.0"
                />
              </div>
              <div>
                <Label htmlFor="entryDate">Entry Date</Label>
                <Input
                  id="entryDate"
                  type="date"
                  value={newInvestment?.entryDate || ''}
                  onChange={e => setNewInvestment(inv => ({ ...(inv || { ...defaultInvestment }), entryDate: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex gap-2 pt-4">
              <Button onClick={handleAddInvestment}>Add Investment</Button>
              <Button variant="outline" onClick={() => { setShowAddForm(false); setNewInvestment(null); }}>Cancel</Button>
            </div>
          </div>
        )}

        {/* Show only first 3 investments unless showAll is true */}
        {(showAll ? investments : investments.slice(0, 3)).map(investment => {
          const FieldIcon = getStartupFieldIcon(investment.field);
          
          return (
            <div key={investment.id}>
              {editingId === investment.id ? (
                <InvestmentForm
                  investment={investment}
                  onUpdate={(updates) => updateInvestment(investment.id, updates)}
                />
              ) : (
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <FieldIcon className="w-4 h-4 text-slate-500" />
                      <h3 className="font-semibold">{investment.companyName}</h3>
                      <Badge variant="outline" className={getStageColor(investment.entryStage).badge}>
                        <span className={`inline-block w-2 h-2 rounded-full mr-2 align-middle ${getStageColor(investment.entryStage).dot}`}></span>
                        {investment.entryStage}
                      </Badge>
                      <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-600">
                        {getStartupFieldLabel(investment.field)}
                      </Badge>
                      <Badge variant="outline" className="border-gray-200 bg-gray-50 text-gray-600">
                        {getRegionLabel(investment.region)}
                      </Badge>
                      {investment.usePresets && (
                        <Badge variant="outline" className="border-green-200 bg-green-50 text-green-600 text-xs">
                          <Zap className="w-3 h-3" />
                        </Badge>
                      )}
                      {!investment.usePresets && investment.customParameterSetId && (() => {
                        const customSet = customParameterSets.find(set => set.id === investment.customParameterSetId);
                        if (customSet) {
                          return (
                            <Badge 
                              variant="outline" 
                              className="border text-white font-medium px-2 py-0.5 text-xs"
                              style={{ 
                                backgroundColor: customSet.color,
                                borderColor: customSet.color
                              }}
                            >
                              {customSet.icon === 'Zap' ? (
                                <Zap className="w-3 h-3 text-white" />
                              ) : (
                                <div className="w-3 h-3 bg-white bg-opacity-80 rounded-full border border-white" />
                              )}
                              <span className="ml-1">{customSet.name}</span>
                            </Badge>
                          );
                        }
                        return null;
                      })()}
                    </div>
                    <p className="text-sm text-slate-600">
                      ${investment.checkSize}MM @ ${investment.entryValuation}MM valuation
                      {investment.entryValuation > 0 && (
                        <span> ({((investment.checkSize / investment.entryValuation) * 100).toFixed(1)}%)</span>
                      )}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingId(investment.id)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteInvestment(investment.id)}
                      className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Show All/Show Less buttons */}
        {investments.length > 3 && (
          <div className="text-center">
            {!showAll ? (
              <Button variant="ghost" onClick={() => setShowAll(true)}>
                Show All ({investments.length - 3} more)
              </Button>
            ) : (
              <Button variant="ghost" onClick={() => setShowAll(false)}>
                Show Less
              </Button>
            )}
          </div>
        )}
      </CardContent>

      {/* Custom Parameter Sets Manager Dialog */}
      <Dialog open={showCustomSetsManager} onOpenChange={setShowCustomSetsManager}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Custom Parameter Sets</DialogTitle>
          </DialogHeader>
          <CustomParameterSetManager
            customSets={customParameterSets}
            onAddSet={addCustomParameterSet}
            onUpdateSet={updateCustomParameterSet}
            onDeleteSet={deleteCustomParameterSet}
          />
        </DialogContent>
      </Dialog>

      {/* Save Portfolio Dialog */}
      <SavePortfolioDialog
        open={showSaveDialog}
        onOpenChange={setShowSaveDialog}
        onSave={handleSavePortfolioToCloud}
        loading={loading}
      />

      {/* Load Portfolio Dialog */}
      <LoadPortfolioDialog
        open={showLoadDialog}
        onOpenChange={setShowLoadDialog}
        onLoad={handleLoadPortfolioFromCloud}
        onDelete={handleDeletePortfolioFromCloud}
        getSavedPortfolios={getSavedPortfolios}
        loading={loading}
      />

      {/* Import Portfolio Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Import Portfolio</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Import your portfolio from a JSON file. You can export your current portfolio first to see the expected format.
            </p>
            
            {/* Drop zone */}
            <div 
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                e.currentTarget.classList.add('border-blue-400', 'bg-blue-50');
              }}
              onDragLeave={(e) => {
                e.currentTarget.classList.remove('border-blue-400', 'bg-blue-50');
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.currentTarget.classList.remove('border-blue-400', 'bg-blue-50');
                const files = e.dataTransfer.files;
                if (files.length > 0) {
                  const file = files[0];
                  if (file.type === 'application/json' || file.name.endsWith('.json')) {
                    const reader = new FileReader();
                    reader.onload = (event) => importPortfolio({ target: event } as any);
                    reader.readAsText(file);
                    setShowImportDialog(false);
                  } else {
                    showError('Invalid File', 'Please select a JSON file.');
                  }
                }
              }}
            >
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-700 mb-2">Drop your JSON file here</p>
              <p className="text-sm text-gray-500 mb-4">or click to browse</p>
              <Button variant="outline" size="sm">
                Choose File
              </Button>
            </div>
            
            <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
              <strong>Expected format:</strong> JSON array of investment objects. 
              Use the Export button to see the correct structure.
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default PortfolioManager;

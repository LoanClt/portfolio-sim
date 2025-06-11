import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Trash2, Edit, Plus, Download, Upload, Building2, Percent, DollarSign, TrendingUp } from 'lucide-react';
import type { PortfolioInvestment, StartupField, StartupRegion } from '@/types/portfolio';
import { getStartupFieldIcon, getStartupFieldLabel, getRegionIcon, getRegionLabel, startupFieldPresets, getRegionalExitValuations } from '@/utils/startupFieldPresets';
import InvestmentParameterEditor from './InvestmentParameterEditor';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Bar } from 'recharts';

interface PortfolioManagerProps {
  investments: PortfolioInvestment[];
  onInvestmentsChange: (investments: PortfolioInvestment[]) => void;
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

const PortfolioManager = ({ investments, onInvestmentsChange }: PortfolioManagerProps) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [showOverview, setShowOverview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newInvestment, setNewInvestment] = useState<PortfolioInvestment | null>(null);

  const handleAddInvestment = () => {
    if (!newInvestment) return;
    onInvestmentsChange([
      ...investments,
      { ...newInvestment, id: Date.now().toString() }
    ]);
    setShowAddForm(false);
    setNewInvestment(null);
  };

  const updateInvestment = (id: string, updates: Partial<PortfolioInvestment>) => {
    onInvestmentsChange(
      investments.map(inv => inv.id === id ? { ...inv, ...updates } : inv)
    );
  };

  const deleteInvestment = (id: string) => {
    onInvestmentsChange(investments.filter(inv => inv.id !== id));
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

  const importPortfolio = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target?.result as string);
        if (Array.isArray(importedData)) {
          onInvestmentsChange(importedData);
        }
      } catch (error) {
        console.error('Error importing portfolio:', error);
      }
    };
    reader.readAsText(file);
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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <CardTitle>Portfolio Management</CardTitle>
            <div className="flex items-center gap-2 bg-slate-100 rounded px-3 py-1 text-slate-700 text-sm font-medium">
              <Building2 className="w-4 h-4 text-blue-500" />
              {numStartups}
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => fileInputRef.current?.click()} size="sm" variant="outline">
              <Upload className="w-4 h-4 mr-2" />
              Import
            </Button>
            <Button onClick={exportPortfolio} size="sm" variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button onClick={() => { setShowAddForm(true); setNewInvestment({ ...defaultInvestment }); }} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Investment
            </Button>
          </div>
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
                          Presets
                        </Badge>
                      )}
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
    </Card>
  );
};

export default PortfolioManager;

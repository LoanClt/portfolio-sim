import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info, Zap } from 'lucide-react';
import type { PortfolioInvestment, CustomParameterSet } from '@/types/portfolio';
import { startupFieldPresets, getStartupFieldLabel } from '@/utils/startupFieldPresets';

interface InvestmentParameterEditorProps {
  investment: PortfolioInvestment;
  onUpdate: (updates: Partial<PortfolioInvestment>) => void;
  customParameterSets: CustomParameterSet[];
}

const InvestmentParameterEditor = ({ investment, onUpdate, customParameterSets }: InvestmentParameterEditorProps) => {
  const presets = startupFieldPresets[investment.field];

  const applyPresets = () => {
    onUpdate({
      stageProgression: presets.stageProgression,
      dilutionRates: presets.dilutionRates,
      lossProb: presets.lossProb,
      usePresets: true,
      customParameterSetId: undefined
    });
  };

  const switchToManual = () => {
    onUpdate({ 
      usePresets: false,
      customParameterSetId: undefined
    });
  };

  const applyCustomParameterSet = (customSetId: string) => {
    const customSet = customParameterSets.find(set => set.id === customSetId);
    if (!customSet) {
      console.error('Custom parameter set not found:', customSetId);
      return;
    }

    // Validate that all required fields exist
    if (!customSet.stageProgression || !customSet.dilutionRates || !customSet.lossProb || !customSet.exitValuations) {
      console.error('Custom parameter set is missing required fields:', customSet);
      return;
    }

    try {
      onUpdate({
        stageProgression: customSet.stageProgression,
        dilutionRates: customSet.dilutionRates,
        lossProb: customSet.lossProb,
        exitValuations: customSet.exitValuations,
        yearsToNext: customSet.yearsToNext || {
          toSeed: [1, 2],
          toSeriesA: [1, 3],
          toSeriesB: [1, 3],
          toSeriesC: [1, 3],
          toIPO: [1, 2]
        },
        usePresets: false,
        customParameterSetId: customSetId
      });
    } catch (error) {
      console.error('Error applying custom parameter set:', error);
    }
  };

  const getIconComponent = (iconName: string) => {
    // Simplified icon handling to prevent crashes
    switch (iconName) {
      case 'Zap':
        return Zap;
      default:
        return () => <div className="w-4 h-4 bg-gray-400 rounded-full" />;
    }
  };

  const isUsingCustomSet = !investment.usePresets && investment.customParameterSetId;
  const currentCustomSet = isUsingCustomSet ? customParameterSets.find(set => set.id === investment.customParameterSetId) : null;

  // Add safety checks to prevent crashes
  const safeCustomParameterSets = customParameterSets || [];
  const safeCurrentCustomSet = currentCustomSet || null;

  // Wrap rendering in try-catch to prevent blank pages
  try {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Investment Parameters for {investment.name}</h3>
        
        <div className="space-y-4">
          <div className="flex gap-2 mb-4">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={investment.usePresets ? "default" : "outline"}
                    onClick={applyPresets}
                    className="flex items-center gap-2"
                  >
                    <Zap className="w-4 h-4" />
                    Use {getStartupFieldLabel(investment.field)} Presets
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Use predefined industry-standard parameters</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <Button
              variant={investment.usePresets === false && !investment.customParameterSetId ? "default" : "outline"}
              onClick={switchToManual}
            >
              Manual Entry
            </Button>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Select
                    value={investment.customParameterSetId || ""}
                    onValueChange={applyCustomParameterSet}
                  >
                    <SelectTrigger 
                      className="min-w-[120px]"
                    >
                      {isUsingCustomSet && safeCurrentCustomSet ? (
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant="outline" 
                            className="border-2 text-white font-medium px-2 py-0.5 text-xs"
                            style={{ 
                              backgroundColor: safeCurrentCustomSet.color,
                              borderColor: safeCurrentCustomSet.color
                            }}
                          >
                            {safeCurrentCustomSet.icon === 'Zap' ? (
                              <Zap className="w-4 h-4 mr-2 text-white" />
                            ) : (
                              <div className="w-4 h-4 mr-2 bg-white bg-opacity-80 rounded-full border border-white" />
                            )}
                            {safeCurrentCustomSet.name}
                          </Badge>
                        </div>
                      ) : (
                        "Custom"
                      )}
                    </SelectTrigger>
                    <SelectContent>
                      {safeCustomParameterSets.map(set => {
                        return (
                          <SelectItem key={set.id} value={set.id}>
                            <div className="flex items-center gap-2">
                              <Badge 
                                variant="outline" 
                                className="border text-white font-medium px-2 py-0.5 text-xs"
                                style={{ 
                                  backgroundColor: set.color,
                                  borderColor: set.color
                                }}
                              >
                                {set.icon === 'Zap' ? (
                                  <Zap className="w-3 h-3 text-white" />
                                ) : (
                                  <div className="w-3 h-3 bg-white bg-opacity-80 rounded-full border border-white" />
                                )}
                                <span className="ml-1">{set.name}</span>
                              </Badge>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Use custom parameter sets you've created</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Parameter sections based on selected mode */}
          {investment.usePresets ? (
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-blue-800">{getStartupFieldLabel(investment.field)} Presets Active</span>
              </div>
              <p className="text-sm text-blue-700">
                Using industry-standard parameters optimized for venture capital modeling.
              </p>
            </div>
          ) : isUsingCustomSet && safeCurrentCustomSet ? (
            <div className="space-y-4">
              <div className="p-4 rounded-lg" style={{ backgroundColor: `${safeCurrentCustomSet.color}15` }}>
                <div className="flex items-center gap-2 mb-2">
                  <Badge 
                    variant="outline" 
                    className="border-2 text-white font-medium px-3 py-1"
                    style={{ 
                      backgroundColor: safeCurrentCustomSet.color,
                      borderColor: safeCurrentCustomSet.color
                    }}
                  >
                    {safeCurrentCustomSet.icon === 'Zap' ? (
                      <Zap className="w-4 h-4 mr-2 text-white" />
                    ) : (
                      <div className="w-4 h-4 mr-2 bg-white bg-opacity-80 rounded-full border border-white" />
                    )}
                    {safeCurrentCustomSet.name}
                  </Badge>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="w-4 h-4" style={{ color: safeCurrentCustomSet.color }} />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-md">
                        <div className="space-y-2 text-sm">
                          <p><strong>Stage Progression:</strong></p>
                          <p>To Seed: {safeCurrentCustomSet.stageProgression.toSeed}%</p>
                          <p>To Series A: {safeCurrentCustomSet.stageProgression.toSeriesA}%</p>
                          <p>To Series B: {safeCurrentCustomSet.stageProgression.toSeriesB}%</p>
                          <p>To Series C: {safeCurrentCustomSet.stageProgression.toSeriesC}%</p>
                          <p>To IPO: {safeCurrentCustomSet.stageProgression.toIPO}%</p>
                          
                          <p className="mt-2"><strong>Dilution Rates:</strong></p>
                          <p>Seed: {safeCurrentCustomSet.dilutionRates.seed}%</p>
                          <p>Series A: {safeCurrentCustomSet.dilutionRates.seriesA}%</p>
                          <p>Series B: {safeCurrentCustomSet.dilutionRates.seriesB}%</p>
                          <p>Series C: {safeCurrentCustomSet.dilutionRates.seriesC}%</p>
                          <p>IPO: {safeCurrentCustomSet.dilutionRates.ipo}%</p>
                          
                          <p className="mt-2"><strong>Exit Valuations ($MM):</strong></p>
                          <p>Pre-Seed: {safeCurrentCustomSet.exitValuations.preSeed[0]}-{safeCurrentCustomSet.exitValuations.preSeed[1]}</p>
                          <p>Seed: {safeCurrentCustomSet.exitValuations.seed[0]}-{safeCurrentCustomSet.exitValuations.seed[1]}</p>
                          <p>Series A: {safeCurrentCustomSet.exitValuations.seriesA[0]}-{safeCurrentCustomSet.exitValuations.seriesA[1]}</p>
                          <p>Series B: {safeCurrentCustomSet.exitValuations.seriesB[0]}-{safeCurrentCustomSet.exitValuations.seriesB[1]}</p>
                          <p>Series C: {safeCurrentCustomSet.exitValuations.seriesC[0]}-{safeCurrentCustomSet.exitValuations.seriesC[1]}</p>
                          <p>IPO: {safeCurrentCustomSet.exitValuations.ipo[0]}-{safeCurrentCustomSet.exitValuations.ipo[1]}</p>
                          
                          <p className="mt-2"><strong>Loss Probabilities:</strong></p>
                          <p>Pre-Seed: {safeCurrentCustomSet.lossProb.preSeed}%</p>
                          <p>Seed: {safeCurrentCustomSet.lossProb.seed}%</p>
                          <p>Series A: {safeCurrentCustomSet.lossProb.seriesA}%</p>
                          <p>Series B: {safeCurrentCustomSet.lossProb.seriesB}%</p>
                          <p>Series C: {safeCurrentCustomSet.lossProb.seriesC}%</p>
                          <p>IPO: {safeCurrentCustomSet.lossProb.ipo}%</p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                {safeCurrentCustomSet.description && (
                  <p className="text-sm text-gray-600 mb-2">{safeCurrentCustomSet.description}</p>
                )}
                <p className="text-sm text-gray-600">
                  Custom parameter set applied to this investment.
                </p>
              </div>
            </div>
                    ) : (
            // Manual parameter editing - compact layout
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Stage Progression Probabilities */}
              <div>
                <Label className="text-base font-medium mb-3 block">Stage Progression (%)</Label>
                <div className="space-y-2">
                  {Object.entries(investment.stageProgression).map(([stage, prob]) => (
                    <div key={stage} className="flex items-center space-x-2">
                      <Label className="w-20 text-xs">To {stage.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:</Label>
                      <Input
                        type="number"
                        value={prob}
                        onChange={(e) => onUpdate({
                           stageProgression: {
                             ...investment.stageProgression,
                             [stage]: parseFloat(e.target.value) || 0
                           }
                         })}
                        className="w-16 h-8 text-sm"
                        min="0"
                        max="100"
                      />
                      <span className="text-xs text-gray-500">%</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dilution Rates */}
              <div>
                <Label className="text-base font-medium mb-3 block">Dilution Rates (%)</Label>
                <div className="space-y-2">
                  {Object.entries(investment.dilutionRates).map(([stage, rate]) => (
                    <div key={stage} className="flex items-center space-x-2">
                      <Label className="w-20 text-xs capitalize">{stage === 'ipo' ? 'IPO' : stage}:</Label>
                      <Input
                        type="number"
                        value={rate}
                        onChange={(e) => onUpdate({
                           dilutionRates: {
                             ...investment.dilutionRates,
                             [stage]: parseFloat(e.target.value) || 0
                           }
                         })}
                        className="w-16 h-8 text-sm"
                        min="0"
                        max="100"
                      />
                      <span className="text-xs text-gray-500">%</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Loss Probabilities */}
              <div>
                <Label className="text-base font-medium mb-3 block">Loss Probabilities (%)</Label>
                <div className="space-y-2">
                  {Object.entries(investment.lossProb).map(([stage, prob]) => (
                    <div key={stage} className="flex items-center space-x-2">
                      <Label className="w-20 text-xs capitalize">{stage === 'ipo' ? 'IPO' : stage}:</Label>
                      <Input
                        type="number"
                        value={prob}
                        onChange={(e) => onUpdate({
                           lossProb: {
                             ...investment.lossProb,
                             [stage]: parseFloat(e.target.value) || 0
                           }
                         })}
                        className="w-16 h-8 text-sm"
                        min="0"
                        max="100"
                      />
                      <span className="text-xs text-gray-500">%</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Exit Valuations */}
              <div>
                <Label className="text-base font-medium mb-3 block">Exit Valuations ($MM)</Label>
                <div className="space-y-2">
                  {Object.entries(investment.exitValuations).map(([stage, [min, max]]) => (
                    <div key={stage} className="flex items-center space-x-1">
                      <Label className="w-20 text-xs capitalize">{stage === 'ipo' ? 'IPO' : stage}:</Label>
                      <Input
                        type="number"
                        value={min}
                        onChange={(e) => onUpdate({
                           exitValuations: {
                             ...investment.exitValuations,
                             [stage]: [parseFloat(e.target.value) || 0, max]
                           }
                         })}
                        className="w-14 h-8 text-sm"
                        min="0"
                      />
                      <span className="text-xs text-gray-500">-</span>
                      <Input
                        type="number"
                        value={max}
                        onChange={(e) => onUpdate({
                           exitValuations: {
                             ...investment.exitValuations,
                             [stage]: [min, parseFloat(e.target.value) || 0]
                           }
                         })}
                        className="w-14 h-8 text-sm"
                        min="0"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>
    );
  } catch (error) {
    console.error('InvestmentParameterEditor render error:', error);
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Investment Parameters for {investment.name}</h3>
        <div className="p-4 bg-red-50 rounded-lg">
          <p className="text-red-700">Error loading parameter editor. Please refresh the page.</p>
        </div>
      </Card>
    );
  }
};

export default InvestmentParameterEditor;

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  TrendingUp, 
  Target, 
  AlertTriangle, 
  CheckCircle, 
  ChevronDown, 
  ChevronUp, 
  Info,
  TrendingUp as ProgressIcon,
  Percent as DilutionIcon,
  XCircle as LossIcon,
  DollarSign as ExitIcon
} from 'lucide-react';
import type { TargetScenario } from '@/types/portfolio';
import { getAchievabilityColor, getAchievabilityLabel } from '@/utils/sensitivityAnalysis';

interface MOICTargetCardProps {
  scenario: TargetScenario;
  onClick: () => void;
  isSelected?: boolean;
  allScenarios?: TargetScenario[];
}

// Helper function to determine which parameters should be filtered out
const getFilteredParametersForMOIC = (targetMOIC: number, allScenarios: TargetScenario[]): Set<string> => {
  const filteredParams = new Set<string>();
  
  if (!allScenarios) return filteredParams;
  
  // Sort scenarios by MOIC to check lower targets first
  const sortedScenarios = [...allScenarios].sort((a, b) => a.targetMOIC - b.targetMOIC);
  
  for (const scenario of sortedScenarios) {
    // Only check scenarios with lower MOIC than current target
    if (scenario.targetMOIC >= targetMOIC) break;
    
    // Check if any parameter hit -100% (maximum reduction)
    scenario.singleParameterOptions.forEach(option => {
      if (option.adjustmentPercent >= 100 && 
          (option.parameterType === 'dilutionRates' || option.parameterType === 'lossProbabilities')) {
        filteredParams.add(option.parameterType);
      }
    });
  }
  
  return filteredParams;
};

const MOICTargetCard = ({ scenario, onClick, isSelected = false, allScenarios = [] }: MOICTargetCardProps) => {
  const achievabilityColor = getAchievabilityColor(scenario);
  const achievabilityLabel = getAchievabilityLabel(scenario);
  const [showDetails, setShowDetails] = useState(false);
  
  // Get the primary adjustment type and value
  const adjustments = scenario.requiredAdjustments;
  const primaryAdjustment = getPrimaryAdjustment(adjustments);

  // Filter out parameters that have hit -100% in lower MOIC targets
  const filteredParams = getFilteredParametersForMOIC(scenario.targetMOIC, allScenarios);
  const allSingleParameterOptions = scenario.singleParameterOptions.filter(
    option => !filteredParams.has(option.parameterType)
  );
  
  const filteredParamsCount = filteredParams.size;
  const hasSingleParameterSolution = allSingleParameterOptions.some(option => option.achievable);

  return (
    <Card 
      className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
        isSelected ? 'ring-2 ring-blue-500 shadow-lg' : 'hover:shadow-md'
      }`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl font-bold flex items-center gap-2" onClick={onClick}>
            <Target className="w-6 h-6 text-blue-600" />
            {scenario.targetMOIC.toFixed(1)}x
          </CardTitle>
          <Badge 
            variant="outline" 
            className="text-white font-medium"
            style={{ 
              backgroundColor: achievabilityColor,
              borderColor: achievabilityColor
            }}
          >
            {achievabilityLabel}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4" onClick={onClick}>
        {/* All Single Parameter Options Display */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <TrendingUp className="w-4 h-4" />
            Single Parameter Analysis
          </div>
          
          {/* Show collapsible note if parameters are filtered */}
          {filteredParamsCount > 0 && (
            <Collapsible>
              <CollapsibleTrigger asChild>
                <button 
                  className="w-full p-2 bg-gray-50 border-l-4 border-gray-400 rounded text-xs hover:bg-gray-100 transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between text-gray-700">
                    <div className="flex items-center gap-1">
                      <Info className="w-3 h-3" />
                      <span className="font-medium">Some parameters are hidden</span>
                    </div>
                    <ChevronDown className="w-3 h-3" />
                  </div>
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2">
                                  <div className="p-2 bg-gray-100 rounded text-xs border border-gray-200">
                    <div className="font-medium text-gray-700 mb-1">Hidden Single Parameters:</div>
                    <div className="space-y-1">
                      {Array.from(filteredParams).map(paramType => (
                        <div key={paramType} className="text-gray-600">
                          • {getParameterLabel(paramType)}
                        </div>
                      ))}
                    </div>
                    <div className="text-gray-500 mt-2 text-xs">
                      These parameters are only hidden for single parameter solutions as they've reached maximum reduction in lower MOIC targets.
                    </div>
                  </div>
              </CollapsibleContent>
            </Collapsible>
          )}
          
          {/* Display filtered parameters */}
          <div className="grid grid-cols-1 gap-2">
            {allSingleParameterOptions.map((option, index) => (
              <SingleParameterOptionCard 
                key={option.parameterType} 
                option={option} 
                lineNumber={index + 1}
              />
            ))}
          </div>
        </div>

        {/* Mixed Parameter Options */}
        {(scenario.mixedParameterOption || scenario.mixedParameterOptions) && (
          <div className="space-y-2">
            <Collapsible>
              <CollapsibleTrigger asChild>
                <button 
                  className="w-full p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500 hover:bg-blue-100 transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-medium text-blue-700 text-left">
                      <Target className="w-4 h-4" />
                      Mixed Parameters ({scenario.mixedParameterOptions?.length || 1} solution{(scenario.mixedParameterOptions?.length || 1) > 1 ? 's' : ''})
                    </div>
                    <ChevronDown className="w-3 h-3 text-blue-700" />
                  </div>
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2">
                <div className="space-y-3">
                  {scenario.mixedParameterOptions && scenario.mixedParameterOptions.length > 0 ? 
                    scenario.mixedParameterOptions.map((option, index) => (
                      <div key={index} className="p-3 bg-blue-25 rounded border border-blue-200">
                        <div className="flex items-center gap-2 text-sm font-medium text-blue-700 mb-2">
                          <Target className="w-3 h-3" />
                          Solution {index + 1}: {option.name}
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          {option.adjustments.stageProgressionIncrease > 0 && (
                            <div className="text-blue-700">Stage: +{option.adjustments.stageProgressionIncrease.toFixed(1)}%</div>
                          )}
                          {option.adjustments.dilutionRatesDecrease > 0 && (
                            <div className="text-blue-700">Dilution: -{option.adjustments.dilutionRatesDecrease.toFixed(1)}%</div>
                          )}
                          {option.adjustments.lossProbabilitiesDecrease > 0 && (
                            <div className="text-blue-700">Loss: -{option.adjustments.lossProbabilitiesDecrease.toFixed(1)}%</div>
                          )}
                          {option.adjustments.exitValuationsIncrease > 0 && (
                            <div className="text-blue-700">Exit: +{option.adjustments.exitValuationsIncrease.toFixed(1)}%</div>
                          )}
                        </div>
                        <div className="text-xs text-blue-600 mt-2">
                          {option.description}
                        </div>
                      </div>
                    )) :
                    // Fallback to single option display
                    scenario.mixedParameterOption && (
                      <div className="p-3 bg-blue-25 rounded border border-blue-200">
                        <div className="flex items-center gap-2 text-sm font-medium text-blue-700 mb-2">
                          <Target className="w-3 h-3" />
                          Mixed Parameter Solution
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          {scenario.mixedParameterOption.stageProgressionIncrease > 0 && (
                            <div className="text-blue-700">Stage: +{scenario.mixedParameterOption.stageProgressionIncrease.toFixed(1)}%</div>
                          )}
                          {scenario.mixedParameterOption.dilutionRatesDecrease > 0 && (
                            <div className="text-blue-700">Dilution: -{scenario.mixedParameterOption.dilutionRatesDecrease.toFixed(1)}%</div>
                          )}
                          {scenario.mixedParameterOption.lossProbabilitiesDecrease > 0 && (
                            <div className="text-blue-700">Loss: -{scenario.mixedParameterOption.lossProbabilitiesDecrease.toFixed(1)}%</div>
                          )}
                          {scenario.mixedParameterOption.exitValuationsIncrease > 0 && (
                            <div className="text-blue-700">Exit: +{scenario.mixedParameterOption.exitValuationsIncrease.toFixed(1)}%</div>
                          )}
                        </div>
                        <div className="text-xs text-blue-600 mt-2">
                          Optimal combination when single parameters aren't sufficient
                        </div>
                      </div>
                    )
                  }
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        )}

        {/* Achievability Score */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 flex items-center gap-1">
              Achievability
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDetails(!showDetails);
                }}
              >
                <Info className="w-3 h-3" />
              </Button>
            </span>
            <span className="font-medium">{scenario.achievabilityScore.toFixed(0)}%</span>
          </div>
          <Progress 
            value={scenario.achievabilityScore} 
            className="h-2"
            style={{ 
              backgroundColor: '#f3f4f6',
            }}
          />
          <div className="text-xs text-gray-600">
            {scenario.enhancedAchievability.explanation}
          </div>
        </div>

        {/* Enhanced Achievability Details */}
        <Collapsible open={showDetails} onOpenChange={setShowDetails}>
          <CollapsibleContent className="space-y-2">
            <div className="text-xs text-gray-700 font-medium">Score Breakdown:</div>
            {scenario.enhancedAchievability.factors.map((factor, index) => (
              <div key={index} className="flex justify-between text-xs">
                <span className="text-gray-600">{factor.name}:</span>
                <span className="font-medium">{factor.score.toFixed(0)}% ({factor.explanation})</span>
              </div>
            ))}
          </CollapsibleContent>
        </Collapsible>

        {/* Success Indicator */}
        <div className="flex items-center gap-2 text-sm">
          {scenario.isRealistic ? (
            <>
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-green-700 font-medium">Market feasible</span>
            </>
          ) : (
            <>
              <AlertTriangle className="w-4 h-4 text-yellow-600" />
              <span className="text-yellow-700 font-medium">Requires optimism</span>
            </>
          )}
        </div>

        {/* Preview Metrics */}
        <div className="pt-2 border-t space-y-1 text-xs text-gray-600">
          <div className="flex justify-between">
            <span>Expected MOIC:</span>
            <span className="font-medium">{scenario.adjustedResults.avgMOIC.toFixed(2)}x</span>
          </div>
          <div className="flex justify-between">
            <span>Success Rate:</span>
            <span className="font-medium">{scenario.adjustedResults.successRate.toFixed(1)}%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * Get human-readable label for parameter type
 */
function getParameterLabel(parameterType: string): string {
  switch (parameterType) {
    case 'stageProgression': return 'Stage Progression (%)';
    case 'dilutionRates': return 'Dilution Rates (%)';
    case 'lossProbabilities': return 'Loss Probabilities (%)';
    case 'exitValuations': return 'Exit Valuations ($MM)';
    default: return parameterType;
  }
}

/**
 * Get the appropriate icon for each parameter type
 */
function getParameterIcon(parameterType: string) {
  switch (parameterType) {
    case 'stageProgression': return <ProgressIcon className="w-3 h-3" />;
    case 'dilutionRates': return <DilutionIcon className="w-3 h-3" />;
    case 'lossProbabilities': return <LossIcon className="w-3 h-3" />;
    case 'exitValuations': return <ExitIcon className="w-3 h-3" />;
    default: return <Target className="w-3 h-3" />;
  }
}

/**
 * Format adjustment display with proper signs
 */
function formatAdjustmentDisplay(parameterType: string, adjustment: number): string {
  if (parameterType === 'dilutionRates' || parameterType === 'lossProbabilities') {
    // These are decreases, so show negative
    const sign = adjustment > 0 ? '-' : '';
    return adjustment >= 100 
      ? `${sign}${adjustment.toFixed(0)}%` 
      : `${sign}${adjustment.toFixed(1)}%`;
  } else {
    // These are increases, so show positive
    const sign = adjustment > 0 ? '+' : '';
    return adjustment >= 100 
      ? `${sign}${adjustment.toFixed(0)}%` 
      : `${sign}${adjustment.toFixed(1)}%`;
  }
}

/**
 * Get the primary (largest) adjustment type
 */
function getPrimaryAdjustment(adjustments: TargetScenario['requiredAdjustments']) {
  const types = [
    { type: 'Stage Progression (%)', value: adjustments.stageProgressionIncrease },
    { type: 'Dilution Rates (%)', value: adjustments.dilutionRatesDecrease },
    { type: 'Loss Probabilities (%)', value: adjustments.lossProbabilitiesDecrease },
    { type: 'Exit Valuations ($MM)', value: adjustments.exitValuationsIncrease }
  ];

  return types.reduce((max, current) => 
    current.value > max.value ? current : max
  );
}

/**
 * Single Parameter Option Card Component
 */
const SingleParameterOptionCard = ({ 
  option, 
  lineNumber 
}: { 
  option: SingleParameterResult; 
  lineNumber: number;
}) => {
  const isAchievable = option.achievable;
  const parameterLabel = getParameterLabel(option.parameterType);
  
  // Check if this is a -100% case for Loss Probabilities or Dilution Rate
  const isMaxedOut = !isAchievable && 
    option.adjustmentPercent >= 100 && 
    (option.parameterType === 'dilutionRates' || option.parameterType === 'lossProbabilities');
  
  // Determine styling based on state
  const getCardStyling = () => {
    if (isAchievable) {
      return 'bg-green-50 border-green-400';
    } else if (isMaxedOut) {
      return 'bg-red-50 border-red-400';
    } else {
      return 'bg-orange-50 border-orange-400';
    }
  };
  
  const getTextStyling = () => {
    if (isAchievable) {
      return 'text-green-700';
    } else if (isMaxedOut) {
      return 'text-red-700';
    } else {
      return 'text-orange-700';
    }
  };
  
  const getSubTextStyling = () => {
    if (isAchievable) {
      return 'text-green-600';
    } else if (isMaxedOut) {
      return 'text-red-600';
    } else {
      return 'text-orange-600';
    }
  };
  
  const getStatusMessage = () => {
    if (option.adjustmentPercent === 0) {
      return 'This parameter has no effect on MOIC';
    } else if (option.adjustmentPercent >= 999) {
      return 'This parameter has minimal impact';
    } else if (isAchievable) {
      return 'Realistic single parameter solution';
    } else if (isMaxedOut) {
      return 'Already at maximum reduction (-100%)';
    } else {
      return `Requires ${option.adjustmentPercent.toFixed(0)}% adjustment - not realistic alone`;
    }
  };
  
  return (
    <div className={`p-2 rounded border-l-4 ${getCardStyling()}`}>
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-6 h-6 bg-gray-200 rounded">
            {getParameterIcon(option.parameterType)}
          </div>
          <span className="text-sm font-medium text-gray-700">
            {parameterLabel}
          </span>
        </div>
        <div className={`text-sm font-bold ${getTextStyling()}`}>
          {option.adjustmentPercent === 0 
            ? 'No effect'
            : option.adjustmentPercent >= 999
            ? 'No impact'  
            : formatAdjustmentDisplay(option.parameterType, option.adjustmentPercent)
          }
        </div>
      </div>
      <div className={`text-xs mt-1 ${getSubTextStyling()}`}>
        {getStatusMessage()}
      </div>
    </div>
  );
};

export default MOICTargetCard; 
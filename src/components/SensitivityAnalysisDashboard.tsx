import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ComposedChart,
  Line,
  LineChart,
  Area,
  AreaChart
} from 'recharts';
import { 
  Target, 
  TrendingUp, 
  BarChart3, 
  ArrowRight, 
  Info,
  Download,
  Zap,
  AlertTriangle,
  CheckCircle,
  TrendingUp as ProgressIcon,
  Percent as DilutionIcon,
  XCircle as LossIcon,
  DollarSign as ExitIcon,
  DollarSign,
  Settings as MixedIcon,
  ChevronDown,
  Rocket
} from 'lucide-react';
import type { SensitivityAnalysis, TargetScenario, ParameterAdjustments, PortfolioResults } from '@/types/portfolio';
import MOICTargetCard from './MOICTargetCard';
import { getAchievabilityColor, getAchievabilityLabel } from '@/utils/sensitivityAnalysis';
import { calculateAverageParameters } from '@/utils/sensitivityAnalysis';

// Error Boundary Component
class ChartErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.warn('Chart error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex items-center justify-center h-64 text-gray-500">
          <div className="text-center">
            <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
            <div>Chart temporarily unavailable</div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Safe Chart Wrapper Component
const SafeChart = ({ children, height = 300 }: { children: React.ReactNode; height?: number }) => (
  <ChartErrorBoundary>
    <ResponsiveContainer width="100%" height={height}>
      {children}
    </ResponsiveContainer>
  </ChartErrorBoundary>
);

interface SensitivityAnalysisDashboardProps {
  analysis: SensitivityAnalysis;
  onExportResults?: () => void;
  investments?: any[]; // Add investments prop
}

const SensitivityAnalysisDashboard = ({ 
  analysis, 
  onExportResults,
  investments = []
}: SensitivityAnalysisDashboardProps) => {
  const [selectedScenario, setSelectedScenario] = useState<TargetScenario | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Create a function to filter out parameters that have hit -100% in lower MOIC targets
  const getFilteredParametersForMOIC = (targetMOIC: number, scenarios: TargetScenario[]): Set<string> => {
    const filteredParams = new Set<string>();
    
    // Sort scenarios by MOIC to check lower targets first
    const sortedScenarios = [...scenarios].sort((a, b) => a.targetMOIC - b.targetMOIC);
    
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



  // Prepare waterfall chart data (fixed)
  const waterfallData = useMemo(() => {
    const data = [
      {
        moic: analysis.baselineMOIC,
        adjustment: 0,
        label: `Baseline (${analysis.baselineMOIC.toFixed(2)}x)`,
        type: 'baseline'
      }
    ];

    analysis.targetScenarios.forEach(scenario => {
      const totalAdjustment = scenario.requiredAdjustments.exitValuationsIncrease +
                             scenario.requiredAdjustments.stageProgressionIncrease +
                             scenario.requiredAdjustments.lossProbabilitiesDecrease +
                             scenario.requiredAdjustments.dilutionRatesDecrease;

      data.push({
        moic: scenario.targetMOIC,
        adjustment: totalAdjustment,
        label: `${scenario.targetMOIC}x`,
        type: scenario.isRealistic ? 'realistic' : 'optimistic',
        achievability: scenario.achievabilityScore
      });
    });

    return data;
  }, [analysis]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Zap className="w-8 h-8 text-blue-600" />
            Sensitivity Analysis
          </h2>
          <p className="text-gray-600 mt-1">
            Discover what assumptions you need to achieve your target returns
          </p>
        </div>
        {onExportResults && (
          <Button onClick={onExportResults} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Analysis
          </Button>
        )}
      </div>

      {/* Baseline Summary */}
      <Card className="border-l-4 border-l-blue-500">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Baseline Results</h3>
              <div className="flex items-center gap-4 mt-2">
                <div className="text-3xl font-bold text-blue-600">
                  {analysis.baselineMOIC.toFixed(2)}x MOIC
                </div>
                <div className="text-lg text-gray-600">
                  {analysis.baselineResults.successRate.toFixed(1)}% Success Rate
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">Distributed</div>
              <div className="text-xl font-semibold">
                ${analysis.baselineResults.avgDistributed.toFixed(1)}MM
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Target Overview</TabsTrigger>
          <TabsTrigger value="details">Scenario Details</TabsTrigger>
          <TabsTrigger value="comparison">Parameter Comparison</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* All MOIC Target Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {analysis.targetScenarios.map((scenario) => (
              <MOICTargetCard
                key={scenario.targetMOIC}
                scenario={scenario}
                isSelected={selectedScenario?.targetMOIC === scenario.targetMOIC}
                onClick={() => setSelectedScenario(scenario)}
                allScenarios={analysis.targetScenarios}
              />
            ))}
          </div>

          {/* Adjustment Requirements Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Adjustment Requirements by Target MOIC
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SafeChart height={300}>
                <BarChart data={waterfallData.slice(1)}> {/* Skip baseline for cleaner display */}
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" />
                  <YAxis label={{ value: 'Total Adjustment Required (%)', angle: -90, position: 'insideLeft' }} />
                  <Tooltip 
                    formatter={(value: any, name: string) => [
                      `${value.toFixed(1)}%`,
                      'Total Adjustment Required'
                    ]}
                  />
                  <Bar 
                    dataKey="adjustment" 
                    fill="#3B82F6"
                    name="Total Adjustment Required"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </SafeChart>
            </CardContent>
          </Card>
        </TabsContent>



        {/* Details Tab */}
        <TabsContent value="details" className="space-y-6">
          {selectedScenario ? (
            <ScenarioDetailView 
              scenario={selectedScenario} 
              baseline={analysis.baselineResults}
              investments={investments}
            />
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Target className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Select a Target Scenario
                </h3>
                <p className="text-gray-600">
                  Click on a MOIC target card above to see detailed analysis and parameter breakdown.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Comparison Tab */}
        <TabsContent value="comparison" className="space-y-6">
          <ParameterComparisonView scenarios={analysis.targetScenarios} />
        </TabsContent>
      </Tabs>
    </div>
  );
};



// Helper function to format adjustment display with proper signs
const formatAdjustmentDisplay = (parameterType: string, adjustment: number): string => {
  if (parameterType === 'dilutionRates' || parameterType === 'lossProbabilities') {
    // These are decreases, so show negative
    return adjustment > 0 ? `-${adjustment.toFixed(1)}%` : '0%';
  } else {
    // These are increases, so show positive
    return adjustment > 0 ? `+${adjustment.toFixed(1)}%` : '0%';
  }
};

// Parameter Card Component for single parameter display
const ParameterCard = ({ 
  title, 
  adjustment, 
  achievable, 
  color,
  boundViolations,
  actualRequirement,
  parameterType
}: { 
  title: string; 
  adjustment: number; 
  achievable: boolean; 
  color: string;
  boundViolations?: string[];
  actualRequirement?: number;
  parameterType?: string;
}) => {
  const isImpossible = !achievable && (boundViolations?.length > 0 || actualRequirement === Number.POSITIVE_INFINITY);
  
  // Check if this is a -100% case for Loss Probabilities or Dilution Rate
  const isMaxedOut = !achievable && 
    adjustment >= 100 && 
    (parameterType === 'dilutionRates' || parameterType === 'lossProbabilities');
  
  // Determine styling based on state
  const getCardStyling = () => {
    if (achievable) {
      return 'bg-green-50 border-green-200';
    } else if (isMaxedOut) {
      return 'bg-red-50 border-red-200';
    } else if (isImpossible) {
      return 'bg-red-50 border-red-200';
    } else {
      return 'bg-yellow-50 border-yellow-200';
    }
  };
  
  const getTextStyling = () => {
    if (achievable) {
      return 'text-green-700';
    } else if (isMaxedOut || isImpossible) {
      return 'text-red-700';
    } else {
      return 'text-yellow-700';
    }
  };
  
  const getSubTextStyling = () => {
    if (achievable) {
      return 'text-green-600';
    } else if (isMaxedOut || isImpossible) {
      return 'text-red-600';
    } else {
      return 'text-yellow-600';
    }
  };
  
  const getDisplayValue = () => {
    if (achievable) {
      return formatAdjustmentDisplay(parameterType || '', adjustment);
    } else if (isMaxedOut) {
      return formatAdjustmentDisplay(parameterType || '', adjustment);
    } else if (isImpossible) {
      return 'IMPOSSIBLE';
    } else {
      return `Need ${formatAdjustmentDisplay(parameterType || '', actualRequirement || 0)}`;
    }
  };
  
  const getStatusMessage = () => {
    if (achievable) {
      return 'Single parameter solution';
    } else if (isMaxedOut) {
      return 'Already at maximum reduction (-100%)';
    } else if (isImpossible) {
      return boundViolations?.length > 0 
        ? `Impossible: ${boundViolations[0].length > 40 ? 'Parameter bounds exceeded' : boundViolations[0]}` 
        : 'Cannot achieve target';
    } else {
      return 'Exceeds max adjustment';
    }
  };
  
  return (
    <div className={`p-3 rounded-lg border ${getCardStyling()}`}>
      <div className="text-sm font-medium text-gray-700">{title}</div>
      <div className={`text-lg font-bold ${getTextStyling()}`}>
        {getDisplayValue()}
      </div>
      <div className={`text-xs ${getSubTextStyling()}`}>
        {getStatusMessage()}
      </div>
    </div>
  );
};

// Helper function for parameter display names
function getParameterDisplayName(paramType: string): string {
  switch (paramType) {
    case 'stageProgression': return 'Stage Progression (%)';
    case 'dilutionRates': return 'Dilution Rates (%)';
    case 'lossProbabilities': return 'Loss Probabilities (%)';
    case 'exitValuations': return 'Exit Valuations ($MM)';
    default: return paramType;
  }
}

// Helper function to get the appropriate icon for each parameter type
function getParameterIcon(paramType: string, isMixed: boolean = false) {
  if (isMixed) return <MixedIcon className="w-4 h-4" />;
  
  switch (paramType) {
    case 'stageProgression': return <ProgressIcon className="w-4 h-4" />;
    case 'dilutionRates': return <DilutionIcon className="w-4 h-4" />;
    case 'lossProbabilities': return <LossIcon className="w-4 h-4" />;
    case 'exitValuations': return <ExitIcon className="w-4 h-4" />;
    default: return <Target className="w-4 h-4" />;
  }
}

// Enhanced Scenario Detail View Component with comprehensive error handling
const ScenarioDetailView = ({ 
  scenario, 
  baseline,
  investments = []
}: { 
  scenario: TargetScenario; 
  baseline: SensitivityAnalysis['baselineResults'];
  investments?: any[];
}) => {
  const [selectedSubScenario, setSelectedSubScenario] = useState<number>(0);
  const [selectedMixedOption, setSelectedMixedOption] = useState<number>(0);
  
  // State for startup selection feature
  const [selectedStartups, setSelectedStartups] = useState<string[]>([]);
  
  // Reset selected sub-scenario and mixed option when scenario changes
  React.useEffect(() => {
    setSelectedSubScenario(0);
    setSelectedMixedOption(0);
  }, [scenario.targetMOIC]);
  
  // Calculate baseline parameters for comparison with error handling
  const baselineParams = React.useMemo(() => {
    if (!investments || investments.length === 0) return null;
    
    try {
      return {
        exitValuation: investments.reduce((sum, inv) => {
          const seriesA = inv?.exitValuations?.seriesA;
          if (Array.isArray(seriesA) && seriesA.length >= 2) {
            return sum + (seriesA[0] + seriesA[1]) / 2;
          }
          return sum + 50; // Default value
        }, 0) / investments.length,
        progression: investments.reduce((sum, inv) => sum + (inv?.stageProgression?.toSeriesA || 30), 0) / investments.length,
        lossProb: investments.reduce((sum, inv) => sum + (inv?.lossProb?.seriesA || 40), 0) / investments.length,
        dilution: investments.reduce((sum, inv) => sum + (inv?.dilutionRates?.seriesA || 20), 0) / investments.length,
        checkSize: investments.reduce((sum, inv) => sum + (inv?.checkSize || 2), 0) / investments.length
      };
    } catch (error) {
      console.warn('Error calculating baseline parameters:', error);
      return {
        exitValuation: 50,
        progression: 30,
        lossProb: 40,
        dilution: 20,
        checkSize: 2
      };
    }
  }, [investments]);

  // Get mixed parameter options from scenario
  const mixedParameterOptions = React.useMemo(() => {
    return scenario?.mixedParameterOptions || [];
  }, [scenario]);

  // Get current selected mixed parameter option
  const currentMixedOption = React.useMemo(() => {
    if (mixedParameterOptions.length > 0) {
      const safeIndex = Math.max(0, Math.min(selectedMixedOption, mixedParameterOptions.length - 1));
      return mixedParameterOptions[safeIndex];
    }
    return null;
  }, [mixedParameterOptions, selectedMixedOption]);

  // Create sub-scenarios data with comprehensive error handling
  const subScenarios = React.useMemo(() => {
    try {
      const singleParameterOptions = scenario?.singleParameterOptions || [];
      const adjustedResults = scenario?.adjustedResults || baseline;
      const requiredAdjustments = scenario?.requiredAdjustments || {
        stageProgressionIncrease: 0,
        dilutionRatesDecrease: 0,
        lossProbabilitiesDecrease: 0,
        exitValuationsIncrease: 0
      };

      const scenarios = [
        // Single parameter scenarios
        ...singleParameterOptions.map((option, index) => {
          const safeOption = {
            parameterType: option?.parameterType || 'stageProgression',
            adjustmentPercent: option?.adjustmentPercent || 0,
            achievable: option?.achievable || false,
            results: option?.results || baseline,
            actualRequirement: option?.actualRequirement,
            boundViolations: option?.boundViolations || []
          };

          return {
            id: index,
            type: 'single' as const,
            title: getParameterDisplayName(safeOption.parameterType),
            parameterType: safeOption.parameterType,
            adjustment: safeOption.adjustmentPercent,
            achievable: safeOption.achievable,
            results: safeOption.results,
            actualRequirement: safeOption.actualRequirement,
            boundViolations: safeOption.boundViolations,
            description: safeOption.achievable 
              ? `Only adjusting ${getParameterDisplayName(safeOption.parameterType).toLowerCase()} parameter`
              : safeOption.boundViolations.length > 0
                ? `Impossible: ${safeOption.boundViolations[0]}`
                : `Requires ${(safeOption.actualRequirement || 0).toFixed(1)}% adjustment (exceeds bounds)`,
            adjustments: createSingleParameterAdjustments(safeOption.parameterType, safeOption.adjustmentPercent)
          };
        }),
        // Mixed parameter scenario
        {
          id: singleParameterOptions.length,
          type: 'mixed' as const,
          title: 'Mixed Parameter Optimization',
          parameterType: 'mixed',
          adjustment: 0,
          achievable: true,
          results: currentMixedOption?.results || adjustedResults,
          description: currentMixedOption?.description || 'Optimal combination of all parameter adjustments',
          adjustments: currentMixedOption?.adjustments || requiredAdjustments
        }
      ];

      return scenarios;
    } catch (error) {
      console.error('Error creating sub-scenarios:', error);
      // Return a safe fallback scenario
      return [{
        id: 0,
        type: 'mixed' as const,
        title: 'Mixed Parameter Optimization',
        parameterType: 'mixed',
        adjustment: 0,
        achievable: true,
        results: baseline,
        description: 'Optimal combination of all parameter adjustments',
        adjustments: {
          stageProgressionIncrease: 0,
          dilutionRatesDecrease: 0,
          lossProbabilitiesDecrease: 0,
          exitValuationsIncrease: 0
        }
      }];
    }
  }, [scenario, baseline, currentMixedOption]);

  // Safe scenario selection with bounds checking
  const selectedScenario = React.useMemo(() => {
    const index = Math.max(0, Math.min(selectedSubScenario, subScenarios.length - 1));
    return subScenarios[index] || subScenarios[0];
  }, [selectedSubScenario, subScenarios]);

  // Safe scenario selection handler
  const handleScenarioSelect = React.useCallback((index: number) => {
    const safeIndex = Math.max(0, Math.min(index, subScenarios.length - 1));
    setSelectedSubScenario(safeIndex);
  }, [subScenarios.length]);

  // Validate that we have required data
  if (!scenario || !baseline || !selectedScenario) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <div className="text-center">
          <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
          <div>Scenario data temporarily unavailable</div>
          <div className="text-sm mt-1">Please refresh or try another scenario</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Target {scenario.targetMOIC}x MOIC - Detailed Analysis</h2>
          <p className="text-gray-600">Compare all approaches to achieve this target</p>
        </div>
        <Badge 
          variant="outline"
          className="text-white font-medium"
          style={{ 
            backgroundColor: getAchievabilityColor(scenario),
            borderColor: getAchievabilityColor(scenario)
          }}
        >
          {getAchievabilityLabel(scenario)} ({(scenario.achievabilityScore || 0).toFixed(0)}%)
        </Badge>
      </div>

      {/* Sub-scenario Navigation */}
      <Card>
        <CardHeader>
          <CardTitle>Analysis Approaches</CardTitle>
          <p className="text-sm text-gray-600">
            Choose an approach to see detailed analysis and portfolio impact
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {subScenarios
              .map((subScenario, originalIndex) => ({ subScenario, originalIndex }))
              .filter(({ subScenario }) => {
                // Hide impossible scenarios (not achievable AND has bound violations or infinite requirement)
                const isImpossible = !subScenario.achievable && 
                  (subScenario.boundViolations?.length > 0 || subScenario.actualRequirement === Number.POSITIVE_INFINITY);
                return !isImpossible;
              })
              .map(({ subScenario, originalIndex }, displayIndex) => (
              <button
                key={`${subScenario.id}-${originalIndex}`}
                onClick={() => handleScenarioSelect(originalIndex)}
                className={`p-3 rounded-lg text-left transition-all duration-200 ${
                  selectedSubScenario === originalIndex
                    ? 'bg-blue-100 border-2 border-blue-500 shadow-md'
                    : 'bg-gray-50 hover:bg-gray-100 border-2 border-gray-200'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex items-center justify-center w-6 h-6 bg-gray-200 rounded">
                    {getParameterIcon(subScenario.parameterType, subScenario.type === 'mixed')}
                  </div>
                  {subScenario.achievable ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-yellow-600" />
                  )}
                </div>
                <h4 className="font-medium text-sm mb-1">{subScenario.title}</h4>
                <p className="text-xs text-gray-600 mb-2">{subScenario.description}</p>
                {subScenario.type === 'single' && (
                  <div className={`text-xs font-bold ${
                    !subScenario.achievable && (subScenario.boundViolations?.length > 0 || subScenario.actualRequirement === Number.POSITIVE_INFINITY)
                      ? 'text-red-700'
                      : subScenario.achievable 
                      ? 'text-green-700' 
                      : 'text-yellow-700'
                  }`}>
                    {!subScenario.achievable && (subScenario.boundViolations?.length > 0 || subScenario.actualRequirement === Number.POSITIVE_INFINITY)
                      ? 'IMPOSSIBLE'
                      : subScenario.adjustment >= 999 
                      ? 'No impact' 
                      : subScenario.adjustment === 0
                      ? 'No effect'
                      : `+${(subScenario.adjustment || 0).toFixed(1)}%`
                    }
                  </div>
                )}
              </button>
            ))}
          </div>
          
          {/* Hidden Scenarios Disclosure */}
          {(() => {
            const hiddenScenarios = subScenarios.filter(subScenario => {
              const isImpossible = !subScenario.achievable && 
                (subScenario.boundViolations?.length > 0 || subScenario.actualRequirement === Number.POSITIVE_INFINITY);
              return isImpossible;
            });
            
            if (hiddenScenarios.length > 0) {
              return (
                <Collapsible className="mt-4">
                  <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                      <span className="text-sm font-medium text-red-700">
                        {hiddenScenarios.length} Impossible Scenario{hiddenScenarios.length > 1 ? 's' : ''} Hidden
                      </span>
                    </div>
                    <ChevronDown className="w-4 h-4 text-red-600" />
                  </CollapsibleTrigger>
                                     <CollapsibleContent className="mt-2">
                     <div className="p-3 bg-red-50 border border-red-200 rounded-lg space-y-3">
                       <p className="text-xs text-red-700 mb-3">
                         Hidden impossible scenarios:
                       </p>
                       <div className="space-y-2">
                         {hiddenScenarios.map((hiddenScenario, index) => (
                           <div key={`hidden-${index}`} className="p-2 bg-white border border-red-100 rounded text-xs">
                             <div className="flex items-center gap-2 mb-1">
                               <div className="flex items-center justify-center w-4 h-4 bg-red-100 rounded">
                                 {getParameterIcon(hiddenScenario.parameterType, hiddenScenario.type === 'mixed')}
                               </div>
                               <span className="font-medium text-red-800">{hiddenScenario.title}</span>
                             </div>
                             <div className="text-red-700">
                               {hiddenScenario.actualRequirement === Number.POSITIVE_INFINITY ? (
                                 <span>Infinite improvement required</span>
                               ) : hiddenScenario.boundViolations?.length > 0 ? (
                                 <span>Bounds exceeded: {hiddenScenario.boundViolations.join(', ')}</span>
                               ) : (
                                 <span>Mathematical constraints violated</span>
                               )}
                             </div>
                           </div>
                         ))}
                       </div>
                     </div>
                   </CollapsibleContent>
                </Collapsible>
              );
            }
            return null;
          })()}

          {/* Mixed Parameter Options Dropdown */}
          {selectedScenario?.type === 'mixed' && mixedParameterOptions.length > 1 && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="font-medium text-blue-900">Mixed Parameter Solutions</h4>
                  <p className="text-sm text-blue-700">Choose from {mixedParameterOptions.length} calculated optimal combinations</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-blue-900">Select Solution:</label>
                <Select 
                  value={selectedMixedOption.toString()} 
                  onValueChange={(value) => setSelectedMixedOption(parseInt(value))}
                >
                  <SelectTrigger className="w-80">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {mixedParameterOptions.map((option, index) => (
                      <SelectItem key={index} value={index.toString()}>
                        <div className="flex items-center justify-between w-full">
                          <span className="font-medium">{option.name}</span>
                          <span className="text-xs text-gray-600 ml-2 capitalize">({option.approachType})</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {currentMixedOption && (
                <div className="mt-3 p-3 bg-white border border-blue-100 rounded text-sm">
                  <p className="text-blue-800 mb-2">{currentMixedOption.description}</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                    {currentMixedOption.adjustments.stageProgressionIncrease > 0 && (
                      <div className="text-blue-700">Stage: +{currentMixedOption.adjustments.stageProgressionIncrease.toFixed(1)}%</div>
                    )}
                    {currentMixedOption.adjustments.exitValuationsIncrease > 0 && (
                      <div className="text-blue-700">Exit: +{currentMixedOption.adjustments.exitValuationsIncrease.toFixed(1)}%</div>
                    )}
                    {currentMixedOption.adjustments.lossProbabilitiesDecrease > 0 && (
                      <div className="text-blue-700">Loss: -{currentMixedOption.adjustments.lossProbabilitiesDecrease.toFixed(1)}%</div>
                    )}
                    {currentMixedOption.adjustments.dilutionRatesDecrease > 0 && (
                      <div className="text-blue-700">Dilution: -{currentMixedOption.adjustments.dilutionRatesDecrease.toFixed(1)}%</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Selected Sub-scenario Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Comparison */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Impact</CardTitle>
            <p className="text-sm text-gray-600">
              {selectedScenario.title} vs Baseline Portfolio
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { 
                  metric: 'MOIC', 
                  baseline: baseline?.avgMOIC || 0, 
                  target: selectedScenario?.results?.avgMOIC || baseline?.avgMOIC || 0, 
                  unit: 'x' 
                },
                { 
                  metric: 'IRR', 
                  baseline: baseline?.avgIRR || 0, 
                  target: selectedScenario?.results?.avgIRR || baseline?.avgIRR || 0, 
                  unit: '%' 
                },
                { 
                  metric: 'Success Rate', 
                  baseline: baseline?.successRate || 0, 
                  target: selectedScenario?.results?.successRate || baseline?.successRate || 0, 
                  unit: '%' 
                },
                { 
                  metric: 'Avg Distributed', 
                  baseline: baseline?.avgDistributed || 0, 
                  target: selectedScenario?.results?.avgDistributed || baseline?.avgDistributed || 0, 
                  unit: '$MM' 
                }
              ].map((item) => {
                const safeBaseline = item.baseline || 0;
                const safeTarget = item.target || 0;
                const improvement = safeTarget > 0 && safeBaseline > 0 
                  ? ((safeTarget - safeBaseline) / safeBaseline * 100) 
                  : 0;
                  
                return (
                  <div key={item.metric} className="space-y-2">
                    <div className="flex justify-between text-sm font-medium">
                      <span>{item.metric}</span>
                      <span>
                        {safeBaseline.toFixed(item.unit === 'x' ? 2 : 1)}{item.unit} → {safeTarget.toFixed(item.unit === 'x' ? 2 : 1)}{item.unit}
                      </span>
                    </div>
                    <div className="relative">
                      <Progress 
                        value={safeTarget > 0 ? Math.min(100, (safeBaseline / Math.max(safeTarget, 0.001)) * 100) : 0} 
                        className="h-2" 
                      />
                      <div 
                        className="absolute top-0 right-0 h-2 bg-blue-500 rounded-r"
                        style={{ 
                          width: `${Math.max(0, Math.min(100, 100 - (safeBaseline / Math.max(safeTarget, 0.001)) * 100))}%` 
                        }}
                      />
                    </div>
                    <div className="text-xs text-gray-600">
                      {improvement.toFixed(1)}% improvement
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Parameter Adjustments Visual */}
        <Card>
          <CardHeader>
            <CardTitle>Required Parameter Changes</CardTitle>
            <p className="text-sm text-gray-600">
              Specific adjustments needed for {selectedScenario.title}
            </p>
          </CardHeader>
          <CardContent>
            <SafeChart height={250}>
              <BarChart data={[
                { 
                  parameter: 'Stage Progression', 
                  adjustment: selectedScenario?.adjustments?.stageProgressionIncrease || 0,
                  baseline: baselineParams?.progression || 0,
                  adjusted: (baselineParams?.progression || 0) * (1 + (selectedScenario?.adjustments?.stageProgressionIncrease || 0) / 100)
                },
                { 
                  parameter: 'Exit Valuations', 
                  adjustment: selectedScenario?.adjustments?.exitValuationsIncrease || 0,
                  baseline: baselineParams?.exitValuation || 0,
                  adjusted: (baselineParams?.exitValuation || 0) * (1 + (selectedScenario?.adjustments?.exitValuationsIncrease || 0) / 100)
                },
                { 
                  parameter: 'Loss Reduction', 
                  adjustment: selectedScenario?.adjustments?.lossProbabilitiesDecrease || 0,
                  baseline: baselineParams?.lossProb || 0,
                  adjusted: (baselineParams?.lossProb || 0) * (1 - (selectedScenario?.adjustments?.lossProbabilitiesDecrease || 0) / 100)
                },
                { 
                  parameter: 'Dilution Reduction', 
                  adjustment: selectedScenario?.adjustments?.dilutionRatesDecrease || 0,
                  baseline: baselineParams?.dilution || 0,
                  adjusted: (baselineParams?.dilution || 0) * (1 - (selectedScenario?.adjustments?.dilutionRatesDecrease || 0) / 100)
                }
              ]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="parameter" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip formatter={(value: any) => [`${(value || 0).toFixed(1)}%`, 'Adjustment']} />
                <Bar dataKey="adjustment" fill="#3B82F6" />
              </BarChart>
            </SafeChart>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Portfolio Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Portfolio Parameter Comparison</CardTitle>
          <p className="text-sm text-gray-600">
            Baseline vs adjusted parameters for {selectedScenario.title}
          </p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Parameter</th>
                  <th className="text-right py-2">Baseline</th>
                  <th className="text-right py-2">Adjusted</th>
                  <th className="text-right py-2">Change</th>
                  <th className="text-left py-2 pl-4">Impact</th>
                </tr>
              </thead>
              <tbody>
                {[
                  {
                    parameter: 'Avg Exit Valuation ($MM)',
                    baseline: baselineParams?.exitValuation?.toFixed(1) || 'N/A',
                    adjusted: baselineParams ? (baselineParams.exitValuation * (1 + (selectedScenario?.adjustments?.exitValuationsIncrease || 0) / 100))?.toFixed(1) : 'N/A',
                    change: (selectedScenario?.adjustments?.exitValuationsIncrease || 0) > 0 ? `+${(selectedScenario.adjustments.exitValuationsIncrease || 0).toFixed(1)}%` : 'No change',
                    impact: (selectedScenario?.adjustments?.exitValuationsIncrease || 0) > 0 ? 'Higher exit multiples across all stages' : 'Exit valuations remain unchanged'
                  },
                  {
                    parameter: 'Avg Stage Progression Rate (%)',
                    baseline: baselineParams?.progression?.toFixed(1) || 'N/A',
                    adjusted: baselineParams ? (baselineParams.progression * (1 + (selectedScenario?.adjustments?.stageProgressionIncrease || 0) / 100))?.toFixed(1) : 'N/A',
                    change: (selectedScenario?.adjustments?.stageProgressionIncrease || 0) > 0 ? `+${(selectedScenario.adjustments.stageProgressionIncrease || 0).toFixed(1)}%` : 'No change',
                    impact: (selectedScenario?.adjustments?.stageProgressionIncrease || 0) > 0 ? 'More companies reach later stages' : 'Stage progression rates unchanged'
                  },
                  {
                    parameter: 'Avg Loss Probability (%)',
                    baseline: baselineParams?.lossProb?.toFixed(1) || 'N/A',
                    adjusted: baselineParams ? (baselineParams.lossProb * (1 - (selectedScenario?.adjustments?.lossProbabilitiesDecrease || 0) / 100))?.toFixed(1) : 'N/A',
                    change: (selectedScenario?.adjustments?.lossProbabilitiesDecrease || 0) > 0 ? `-${(selectedScenario.adjustments.lossProbabilitiesDecrease || 0).toFixed(1)}%` : 'No change',
                    impact: (selectedScenario?.adjustments?.lossProbabilitiesDecrease || 0) > 0 ? 'Reduced failure rates across portfolio' : 'Loss probabilities unchanged'
                  },
                  {
                    parameter: 'Avg Dilution Rate (%)',
                    baseline: baselineParams?.dilution?.toFixed(1) || 'N/A',
                    adjusted: baselineParams ? (baselineParams.dilution * (1 - (selectedScenario?.adjustments?.dilutionRatesDecrease || 0) / 100))?.toFixed(1) : 'N/A',
                    change: (selectedScenario?.adjustments?.dilutionRatesDecrease || 0) > 0 ? `-${(selectedScenario.adjustments.dilutionRatesDecrease || 0).toFixed(1)}%` : 'No change',
                    impact: (selectedScenario?.adjustments?.dilutionRatesDecrease || 0) > 0 ? 'Better ownership retention through funding rounds' : 'Dilution rates unchanged'
                  }
                ].map((row, index) => (
                  <tr key={index} className={getParameterRowStyling(row.change)}>
                    <td className="py-2 font-medium">{row.parameter}</td>
                    <td className="py-2 text-right">{row.baseline}</td>
                    <td className="py-2 text-right">{row.adjusted}</td>
                    <td className="py-2 text-right">
                      <Badge 
                        variant={getChangeColor(row.change)}
                        className={
                          row.change.startsWith('+') ? 'bg-green-100 text-green-800 border-green-300' :
                          row.change.startsWith('-') ? 'bg-blue-100 text-blue-800 border-blue-300' :
                          ''
                        }
                      >
                        {row.change}
                      </Badge>
                    </td>
                    <td className="py-2 pl-4 text-gray-600">{row.impact}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Startup Selection and Parameter Evolution Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Individual Startup Parameter Evolution</CardTitle>
          <p className="text-sm text-gray-600">
            Select specific startups to see how parameters evolved from baseline to {selectedScenario.title}
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Startup Selection */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Select Startups to Analyze:</h4>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedStartups([])}
                >
                  Clear All
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const allStartups = generateSampleInvestmentData(selectedScenario)
                      .slice(0, 10)
                      .map(s => s.companyName);
                    setSelectedStartups(allStartups);
                  }}
                >
                  Select Top 10
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-64 overflow-y-auto p-4 bg-gray-50 rounded-lg">
              {generateSampleInvestmentData(selectedScenario).slice(0, 20).map((startup) => (
                <div key={startup.companyName} className="flex items-center space-x-2">
                  <Checkbox
                    id={startup.companyName}
                    checked={selectedStartups.includes(startup.companyName)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedStartups([...selectedStartups, startup.companyName]);
                      } else {
                        setSelectedStartups(selectedStartups.filter(name => name !== startup.companyName));
                      }
                    }}
                  />
                  <label 
                    htmlFor={startup.companyName} 
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {startup.companyName}
                    {startup.moic >= 2 && <span className="ml-1 text-orange-500">🚀</span>}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Selected Startups Summary */}
          {selectedStartups.length > 0 && (
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-blue-900">
                  Analysis of {selectedStartups.length} Selected Startup{selectedStartups.length > 1 ? 's' : ''}
                </h4>
                <Badge variant="outline" className="bg-blue-100 text-blue-800">
                  {selectedStartups.length} companies
                </Badge>
              </div>
              <div className="text-sm text-blue-700 mb-3">
                Selected: {selectedStartups.slice(0, 5).join(', ')}
                {selectedStartups.length > 5 && ` and ${selectedStartups.length - 5} more...`}
              </div>
            </div>
          )}


          {/* Individual Startup Parameter Evolution */}
          {selectedStartups.length > 0 && (
            <div>
              {/* Detailed Stage-by-Stage Parameter Analysis */}
              {generateParameterEvolutionData(selectedStartups, selectedScenario, baselineParams).map((company, companyIndex) => (
                <Card key={companyIndex} className="mb-6">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {company.companyName}
                      <Badge className="bg-purple-100 text-purple-800 ml-auto">
                        Expected MOIC Impact: +{(company.expectedMOICImprovement * 100).toFixed(1)}%
                      </Badge>
                    </CardTitle>
                    <p className="text-sm text-gray-600">
                      Stage-by-stage parameter breakdown showing baseline vs adjusted values
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    
                    {/* Exit Valuations by Stage */}
                    <div>
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-green-600" />
                        Exit Valuations by Stage ($MM)
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Object.entries(company.baselineStageData.exitValuations).map(([stage, baseline]: [string, any]) => {
                          const adjusted = company.adjustedStageData.exitValuations[stage];
                          const avgChange = ((adjusted.avg - baseline.avg) / baseline.avg) * 100;
                          const bgColor = avgChange > 0 ? 'bg-green-50' : avgChange < 0 ? 'bg-blue-50' : 'bg-gray-50';
                          const badgeColor = avgChange > 0 ? 'bg-green-100 text-green-800' : avgChange < 0 ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800';
                          
                          return (
                            <div key={stage} className={`p-3 border rounded-lg ${bgColor}`}>
                              <div className="font-medium text-sm text-gray-900 mb-2">{stage}</div>
                              <div className="space-y-1 text-xs">
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Min:</span>
                                  <span className="font-mono">
                                    ${baseline.min.toFixed(1)} → ${adjusted.min.toFixed(1)}
                                    <Badge className={`ml-1 text-xs ${badgeColor}`}>
                                      {avgChange > 0 ? '+' : ''}{(((adjusted.min - baseline.min) / baseline.min) * 100).toFixed(1)}%
                                    </Badge>
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Avg:</span>
                                  <span className="font-mono">
                                    ${baseline.avg.toFixed(1)} → ${adjusted.avg.toFixed(1)}
                                    <Badge className={`ml-1 text-xs ${badgeColor}`}>
                                      {avgChange > 0 ? '+' : ''}{avgChange.toFixed(1)}%
                                    </Badge>
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Max:</span>
                                  <span className="font-mono">
                                    ${baseline.max.toFixed(1)} → ${adjusted.max.toFixed(1)}
                                    <Badge className={`ml-1 text-xs ${badgeColor}`}>
                                      {avgChange > 0 ? '+' : ''}{(((adjusted.max - baseline.max) / baseline.max) * 100).toFixed(1)}%
                                    </Badge>
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Stage Progression Rates */}
                    <div>
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <ProgressIcon className="w-4 h-4 text-blue-600" />
                        Stage Progression Rates (%)
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Object.entries(company.baselineStageData.stageProgression).map(([transition, baseline]: [string, any]) => {
                          const adjusted = company.adjustedStageData.stageProgression[transition];
                          const change = ((adjusted - baseline) / baseline) * 100;
                          const bgColor = change > 0 ? 'bg-green-50' : change < 0 ? 'bg-blue-50' : 'bg-gray-50';
                          const badgeColor = change > 0 ? 'bg-green-100 text-green-800' : change < 0 ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800';
                          
                          return (
                            <div key={transition} className={`p-3 border rounded-lg ${bgColor}`}>
                              <div className="font-medium text-sm text-gray-900 mb-2">{transition}</div>
                              <div className="space-y-1 text-xs">
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Rate:</span>
                                  <span className="font-mono">
                                    {baseline.toFixed(1)}% → {adjusted.toFixed(1)}%
                                    <Badge className={`ml-1 text-xs ${badgeColor}`}>
                                      {change > 0 ? '+' : ''}{change.toFixed(1)}%
                                    </Badge>
                                  </span>
                                </div>
                                <div className="text-gray-500">
                                  Success improvement: {change > 0 ? '+' : ''}{(adjusted - baseline).toFixed(1)} percentage points
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Loss Probabilities by Stage */}
                    <div>
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <LossIcon className="w-4 h-4 text-red-600" />
                        Loss Probabilities by Stage (%)
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Object.entries(company.baselineStageData.lossProbabilities).map(([stage, baseline]: [string, any]) => {
                          const adjusted = company.adjustedStageData.lossProbabilities[stage];
                          const change = ((adjusted - baseline) / baseline) * 100;
                          const bgColor = change < 0 ? 'bg-green-50' : change > 0 ? 'bg-blue-50' : 'bg-gray-50'; // Decrease is good for loss prob
                          const badgeColor = change < 0 ? 'bg-green-100 text-green-800' : change > 0 ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800';
                          
                          return (
                            <div key={stage} className={`p-3 border rounded-lg ${bgColor}`}>
                              <div className="font-medium text-sm text-gray-900 mb-2">{stage}</div>
                              <div className="space-y-1 text-xs">
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Loss Risk:</span>
                                  <span className="font-mono">
                                    {baseline.toFixed(1)}% → {adjusted.toFixed(1)}%
                                    <Badge className={`ml-1 text-xs ${badgeColor}`}>
                                      {change > 0 ? '+' : ''}{change.toFixed(1)}%
                                    </Badge>
                                  </span>
                                </div>
                                <div className="text-gray-500">
                                  Risk reduction: {change < 0 ? '+' : ''}{(baseline - adjusted).toFixed(1)} percentage points
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Dilution Rates by Stage */}
                    <div>
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <DilutionIcon className="w-4 h-4 text-orange-600" />
                        Dilution Rates by Stage (%)
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Object.entries(company.baselineStageData.dilutionRates).map(([stage, baseline]: [string, any]) => {
                          const adjusted = company.adjustedStageData.dilutionRates[stage];
                          const change = ((adjusted - baseline) / baseline) * 100;
                          const bgColor = change < 0 ? 'bg-green-50' : change > 0 ? 'bg-blue-50' : 'bg-gray-50'; // Decrease is good for dilution
                          const badgeColor = change < 0 ? 'bg-green-100 text-green-800' : change > 0 ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800';
                          
                          return (
                            <div key={stage} className={`p-3 border rounded-lg ${bgColor}`}>
                              <div className="font-medium text-sm text-gray-900 mb-2">{stage}</div>
                              <div className="space-y-1 text-xs">
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Dilution:</span>
                                  <span className="font-mono">
                                    {baseline.toFixed(1)}% → {adjusted.toFixed(1)}%
                                    <Badge className={`ml-1 text-xs ${badgeColor}`}>
                                      {change > 0 ? '+' : ''}{change.toFixed(1)}%
                                    </Badge>
                                  </span>
                                </div>
                                <div className="text-gray-500">
                                  Ownership retention: {change < 0 ? '+' : ''}{(baseline - adjusted).toFixed(1)} percentage points
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Stage-by-Stage Parameter Charts */}
                    <div className="space-y-6">
                      <h4 className="font-medium text-lg">Visual Parameter Analysis by Stage</h4>
                      
                      {/* Exit Valuations Range Chart */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">Exit Valuations by Stage - {company.companyName}</CardTitle>
                          <p className="text-sm text-gray-600">Min/Max valuation ranges showing baseline vs adjusted</p>
                        </CardHeader>
                        <CardContent>
                          <SafeChart height={400}>
                            <BarChart 
                              data={Object.entries(company.baselineStageData.exitValuations).map(([stage, baseline]: [string, any]) => {
                                const adjusted = company.adjustedStageData.exitValuations[stage];
                                return {
                                  stage,
                                  baselineMin: baseline.min,
                                  baselineMax: baseline.max,
                                  adjustedMin: adjusted.min,
                                  adjustedMax: adjusted.max,
                                };
                              })}
                              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="stage" angle={-45} textAnchor="end" height={80} />
                              <YAxis label={{ value: 'Valuation ($MM)', angle: -90, position: 'insideLeft' }} />
                              <Tooltip formatter={(value: number) => [`$${value.toFixed(1)}MM`, '']} />
                              <Bar dataKey="baselineMin" fill="#9CA3AF" name="Baseline Min" />
                              <Bar dataKey="baselineMax" fill="#6B7280" name="Baseline Max" />
                              <Bar dataKey="adjustedMin" fill="#6EE7B7" name="Adjusted Min" />
                              <Bar dataKey="adjustedMax" fill="#10B981" name="Adjusted Max" />
                            </BarChart>
                          </SafeChart>
                        </CardContent>
                      </Card>

                      {/* Stage Progression Rates Chart */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">Stage Progression Rates - {company.companyName}</CardTitle>
                          <p className="text-sm text-gray-600">Success rates for each stage transition</p>
                        </CardHeader>
                        <CardContent>
                          <SafeChart height={350}>
                            <BarChart 
                              data={Object.entries(company.baselineStageData.stageProgression).map(([transition, baseline]: [string, any]) => ({
                                transition: transition.replace(' to ', '→'),
                                baseline: baseline,
                                adjusted: company.adjustedStageData.stageProgression[transition],
                              }))}
                              margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="transition" angle={-45} textAnchor="end" height={100} />
                              <YAxis label={{ value: 'Success Rate (%)', angle: -90, position: 'insideLeft' }} />
                              <Tooltip formatter={(value: number) => [`${value.toFixed(1)}%`, '']} />
                              <Bar dataKey="baseline" fill="#94A3B8" name="Baseline" />
                              <Bar dataKey="adjusted" fill="#10B981" name="Adjusted" />
                            </BarChart>
                          </SafeChart>
                        </CardContent>
                      </Card>

                      {/* Loss Probabilities Chart */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">Loss Probabilities by Stage - {company.companyName}</CardTitle>
                          <p className="text-sm text-gray-600">Risk of total loss at each investment stage</p>
                        </CardHeader>
                        <CardContent>
                          <SafeChart height={350}>
                            <BarChart 
                              data={Object.entries(company.baselineStageData.lossProbabilities).map(([stage, baseline]: [string, any]) => ({
                                stage,
                                baseline: baseline,
                                adjusted: company.adjustedStageData.lossProbabilities[stage],
                              }))}
                              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="stage" angle={-45} textAnchor="end" height={80} />
                              <YAxis label={{ value: 'Loss Probability (%)', angle: -90, position: 'insideLeft' }} />
                              <Tooltip formatter={(value: number) => [`${value.toFixed(1)}%`, '']} />
                              <Bar dataKey="baseline" fill="#EF4444" name="Baseline" />
                              <Bar dataKey="adjusted" fill="#3B82F6" name="Adjusted" />
                            </BarChart>
                          </SafeChart>
                        </CardContent>
                      </Card>

                      {/* Dilution Rates Chart */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">Dilution Rates by Stage - {company.companyName}</CardTitle>
                          <p className="text-sm text-gray-600">Ownership dilution at each funding stage</p>
                        </CardHeader>
                        <CardContent>
                          <SafeChart height={350}>
                            <BarChart 
                              data={Object.entries(company.baselineStageData.dilutionRates).map(([stage, baseline]: [string, any]) => ({
                                stage,
                                baseline: baseline,
                                adjusted: company.adjustedStageData.dilutionRates[stage],
                              }))}
                              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="stage" angle={-45} textAnchor="end" height={80} />
                              <YAxis label={{ value: 'Dilution Rate (%)', angle: -90, position: 'insideLeft' }} />
                              <Tooltip formatter={(value: number) => [`${value.toFixed(1)}%`, '']} />
                              <Bar dataKey="baseline" fill="#F59E0B" name="Baseline" />
                              <Bar dataKey="adjusted" fill="#3B82F6" name="Adjusted" />
                            </BarChart>
                          </SafeChart>
                        </CardContent>
                      </Card>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* MOIC Distribution Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>MOIC Distribution - Baseline</CardTitle>
            <p className="text-sm text-gray-600">
              Current portfolio performance distribution
            </p>
          </CardHeader>
          <CardContent>
            <SafeChart height={200}>
              <BarChart data={generateMOICDistributionData(baseline)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" />
                <YAxis />
                <Tooltip formatter={(value: any) => [`${value}%`, 'Frequency']} />
                <Bar dataKey="frequency" fill="#94A3B8" />
              </BarChart>
            </SafeChart>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>MOIC Distribution - {selectedScenario.title}</CardTitle>
            <p className="text-sm text-gray-600">
              Projected performance with parameter adjustments
            </p>
          </CardHeader>
          <CardContent>
            <SafeChart height={200}>
              <BarChart data={generateMOICDistributionData(selectedScenario?.results || baseline)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" />
                <YAxis />
                <Tooltip formatter={(value: any) => [`${value}%`, 'Frequency']} />
                <Bar dataKey="frequency" fill="#3B82F6" />
              </BarChart>
            </SafeChart>
          </CardContent>
        </Card>
      </div>

      {/* Average Returns by Stage Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Average Returns by Stage - {selectedScenario.title}</CardTitle>
          <p className="text-sm text-gray-600">
            Performance breakdown by investment stage with parameter adjustments
          </p>
        </CardHeader>
        <CardContent>
          <SafeChart height={300}>
            <BarChart data={generateStagePerformanceData(selectedScenario, investments)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="stage" 
                tick={{ fontSize: 11 }} 
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis />
              <Tooltip 
                formatter={(value: number, name: string) => {
                  if (name === 'avgReturn') return [`${value.toFixed(2)}x`, 'Avg Multiple'];
                  if (name === 'count') return [`${value}`, 'Count'];
                  return [value, name];
                }}
              />
              <Bar dataKey="avgReturn" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </SafeChart>
        </CardContent>
      </Card>

      {/* Investment Performance Graph */}
      <Card>
        <CardHeader>
          <CardTitle>Investment Performance - {selectedScenario.title}</CardTitle>
          <p className="text-sm text-gray-600">
            Entry vs exit amounts for sample simulation (showing first 20 investments)
          </p>
        </CardHeader>
        <CardContent>
          <SafeChart height={400}>
            <BarChart data={generateSampleInvestmentData(selectedScenario).slice(0, 20)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                dataKey="companyName" 
                tick={{ fontSize: 10 }} 
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis 
                tick={{ fontSize: 12 }} 
                stroke="#64748b"
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1e293b', 
                  border: 'none', 
                  borderRadius: '8px',
                  color: 'white'
                }}
                formatter={(value: number, name: string) => {
                  if (name === 'entryAmount') return [`$${value.toFixed(2)}MM`, 'Entry Amount'];
                  if (name === 'gain') return [`$${value.toFixed(2)}MM`, 'Gain/Loss'];
                  return [`$${value.toFixed(2)}MM`, name];
                }}
              />
              <Bar 
                dataKey="entryAmount" 
                fill="#3b82f6" 
                name="entryAmount"
                radius={[0, 0, 0, 0]}
              />
              <Bar 
                dataKey="gain" 
                fill="#10b981" 
                name="gain"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </SafeChart>
        </CardContent>
      </Card>

      {/* Sample Simulation Details - Investment Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Sample Simulation Details - {selectedScenario.title}</CardTitle>
          <p className="text-sm text-gray-600">
            Individual investment outcomes with adjusted parameters (showing first 20 investments)
          </p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left py-3 px-2 font-medium">Company</th>
                  <th className="text-right py-3 px-2 font-medium">Exit Stage</th>
                  <th className="text-right py-3 px-2 font-medium">Entry ($MM)</th>
                  <th className="text-right py-3 px-2 font-medium">Exit ($MM)</th>
                  <th className="text-right py-3 px-2 font-medium">Gain/Loss ($MM)</th>
                  <th className="text-right py-3 px-2 font-medium">MOIC</th>
                  <th className="text-right py-3 px-2 font-medium">Holding Period</th>
                  <th className="text-right py-3 px-2 font-medium">Initial Own. (%)</th>
                  <th className="text-right py-3 px-2 font-medium">Final Own. (%)</th>
                </tr>
              </thead>
              <tbody>
                {generateSampleInvestmentData(selectedScenario).slice(0, 20).map((investment, index) => {
                  const gain = investment.exitAmount - investment.entryAmount;
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
                  
                  return (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="py-2 px-2 font-medium flex items-center gap-2">
                        {investment.moic >= 2 && (
                          <Rocket className="w-3 h-3 text-orange-500" />
                        )}
                        {investment.companyName}
                      </td>
                      <td className="py-2 px-2 text-right">
                        <Badge variant="outline" className={getStageColor(investment.exitStage).badge}>
                          <span className={`inline-block w-2 h-2 rounded-full mr-2 align-middle ${getStageColor(investment.exitStage).dot}`}></span>
                          {investment.exitStage}
                        </Badge>
                      </td>
                      <td className="py-2 px-2 text-right font-mono">
                        ${investment.entryAmount.toFixed(2)}
                      </td>
                      <td className="py-2 px-2 text-right font-mono">
                        ${investment.exitAmount.toFixed(2)}
                      </td>
                      <td className={`py-2 px-2 text-right font-mono ${
                        gain >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {gain >= 0 ? '+' : ''}${gain.toFixed(2)}
                      </td>
                      <td className="py-2 px-2 text-right">
                        <Badge variant={
                          investment.moic >= 3 ? 'default' : 
                          investment.moic >= 1 ? 'secondary' : 
                          'destructive'
                        }>
                          {investment.moic.toFixed(2)}x
                        </Badge>
                      </td>
                      <td className="py-2 px-2 text-right text-gray-600">
                        {investment.holdingPeriod?.toFixed(1) || '2.5'} years
                      </td>
                      <td className="py-2 px-2 text-right text-gray-600">
                        {(investment.initialOwnership || 15).toFixed(1)}%
                      </td>
                      <td className="py-2 px-2 text-right text-gray-600">
                        {(investment.finalOwnership || (investment.initialOwnership || 15) * 0.8).toFixed(1)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {/* Summary Statistics */}
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-600">
                {selectedScenario?.results?.avgMOIC?.toFixed(2) || baseline?.avgMOIC?.toFixed(2) || '2.5'}x
              </div>
              <div className="text-sm text-blue-700">Portfolio MOIC</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-600">
                {selectedScenario?.results?.successRate?.toFixed(1) || baseline?.successRate?.toFixed(1) || '75'}%
              </div>
              <div className="text-sm text-green-700">Success Rate</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-purple-600">
                ${selectedScenario?.results?.avgDistributed?.toFixed(1) || baseline?.avgDistributed?.toFixed(1) || '25.0'}MM
              </div>
              <div className="text-sm text-purple-700">Avg Distributed</div>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-orange-600">
                {generateSampleInvestmentData(selectedScenario).filter(inv => inv.moic >= 2).length}
              </div>
              <div className="text-sm text-orange-700">High Performers (≥2x)</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Achievability Assessment for Selected Scenario */}
      {selectedScenario.type === 'single' && (
        <Card>
          <CardHeader>
            <CardTitle>Achievability Assessment</CardTitle>
            <p className="text-sm text-gray-600">
              Market feasibility analysis for {selectedScenario.title}
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className={`p-4 rounded-lg ${
                selectedScenario.achievable 
                  ? 'bg-green-50 border border-green-200' 
                  : 'bg-yellow-50 border border-yellow-200'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  {selectedScenario.achievable ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-yellow-600" />
                  )}
                  <span className={`font-medium ${
                    selectedScenario.achievable ? 'text-green-700' : 'text-yellow-700'
                  }`}>
                    {selectedScenario.achievable ? 'Realistic Approach' : 'Challenging Approach'}
                  </span>
                </div>
                <p className={`text-sm ${
                  selectedScenario.achievable ? 'text-green-600' : 'text-yellow-600'
                }`}>
                  {selectedScenario.achievable 
                    ? `This approach requires a ${(selectedScenario.adjustment || 0).toFixed(1)}% improvement in ${selectedScenario.title.toLowerCase()}, which is achievable through focused operational improvements.`
                    : `This approach requires a ${(selectedScenario.adjustment || 0).toFixed(1)}% improvement in ${selectedScenario.title.toLowerCase()}, which may be difficult to achieve through this parameter alone.`
                  }
                </p>
              </div>
              
              {!selectedScenario.achievable && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-medium text-blue-700 mb-2">Recommendation</h4>
                  <p className="text-sm text-blue-600">
                    Consider the mixed parameter approach (Line 5) which distributes the required improvements across multiple parameters, making the target more achievable.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Helper function to create single parameter adjustments with safety checks
function createSingleParameterAdjustments(parameterType: string, adjustmentPercent: number): ParameterAdjustments {
  const adjustments: ParameterAdjustments = {
    stageProgressionIncrease: 0,
    dilutionRatesDecrease: 0,
    lossProbabilitiesDecrease: 0,
    exitValuationsIncrease: 0
  };

  const safeAdjustmentPercent = Math.max(0, adjustmentPercent || 0);

  switch (parameterType) {
    case 'stageProgression':
      adjustments.stageProgressionIncrease = safeAdjustmentPercent;
      break;
    case 'dilutionRates':
      adjustments.dilutionRatesDecrease = safeAdjustmentPercent;
      break;
    case 'lossProbabilities':
      adjustments.lossProbabilitiesDecrease = safeAdjustmentPercent;
      break;
    case 'exitValuations':
      adjustments.exitValuationsIncrease = safeAdjustmentPercent;
      break;
    default:
      console.warn(`Unknown parameter type: ${parameterType}`);
      break;
  }

  return adjustments;
}

// Helper function to generate MOIC distribution data with safety checks
function generateMOICDistributionData(results: PortfolioResults | null | undefined) {
  if (!results) {
    // Return default distribution for missing data
    const ranges = ['0-1x', '1-2x', '2-3x', '3-5x', '5-10x', '10x+'];
    return ranges.map(range => ({ range, frequency: 10 }));
  }

  try {
    // Create more realistic distribution based on actual avgMOIC and successRate
    const ranges = ['0-1x', '1-2x', '2-3x', '3-5x', '5-10x', '10x+'];
    const avgMOIC = results.avgMOIC || 0;
    const successRate = results.successRate || 0;
    
    // Create bell curve-like distribution centered around avgMOIC
    const distribution = ranges.map((range, index) => {
      let frequency = 0;
      const rangeCenter = index + 0.5; // Center of each range
      
      if (avgMOIC < 1) {
        // Low performing portfolio - most investments in 0-1x range
        if (index === 0) frequency = 60 + (40 * (1 - avgMOIC));
        else if (index === 1) frequency = 25 - (10 * (1 - avgMOIC));
        else frequency = Math.max(0, 15 - (index * 5));
      } else {
        // Higher performing portfolio - create distribution around avgMOIC
        const distance = Math.abs(rangeCenter - avgMOIC);
        frequency = Math.max(0, 30 - (distance * distance * 5));
        
        // Adjust based on success rate
        if (index === 0) {
          frequency = Math.max(0, 100 - successRate);
        } else {
          frequency = frequency * (successRate / 100);
        }
      }
      
      return { range, frequency: Math.max(1, Math.round(frequency)) };
    });
    
    // Normalize to 100%
    const total = distribution.reduce((sum, item) => sum + item.frequency, 0);
    return distribution.map(item => ({
      range: item.range,
      frequency: Math.round((item.frequency / total) * 100)
    }));
  } catch (error) {
    console.warn('Error generating MOIC distribution data:', error);
    // Return default distribution on error
    const ranges = ['0-1x', '1-2x', '2-3x', '3-5x', '5-10x', '10x+'];
    return ranges.map(range => ({ range, frequency: 15 }));
  }
}

// Helper function to get badge color based on change type
function getChangeColor(change: string): string {
  if (change === 'No change') return 'secondary';
  if (change.startsWith('+')) return 'default'; // Will be styled green with custom classes
  if (change.startsWith('-')) return 'default'; // Will be styled blue with custom classes  
  return 'outline';
}

// Helper function to get row styling based on parameter changes
function getParameterRowStyling(change: string): string {
  if (change === 'No change') return 'hover:bg-gray-50';
  if (change.startsWith('+')) return 'bg-green-50 hover:bg-green-100 border-l-4 border-green-400'; // Green for increases
  if (change.startsWith('-')) return 'bg-blue-50 hover:bg-blue-100 border-l-4 border-blue-400'; // Blue for decreases
  return 'hover:bg-gray-50';
}

// Helper function to generate stage performance data for scenario
function generateStagePerformanceData(selectedScenario: any, investments: any[]): { stage: string; avgReturn: number; count: number }[] {
  const stageOrder = ['Pre-Seed', 'Seed', 'Series A', 'Series B', 'Series C', 'IPO'];
  
  if (!selectedScenario?.results?.simulations || !investments.length) {
    return stageOrder.map(stage => ({ stage, avgReturn: 1 + Math.random() * 2, count: 5 }));
  }

  const stageReturns: { [key: string]: { totalReturn: number; count: number } } = {};
  
  selectedScenario.results.simulations.forEach((sim: any[]) => {
    sim.forEach((result: any) => {
      const stage = result.exitStage;
      if (!stageReturns[stage]) {
        stageReturns[stage] = { totalReturn: 0, count: 0 };
      }
      stageReturns[stage].totalReturn += result.moic;
      stageReturns[stage].count += 1;
    });
  });

  return stageOrder.map(stage => {
    const data = stageReturns[stage] || { totalReturn: 0, count: 0 };
    return {
      stage,
      avgReturn: data.count > 0 ? data.totalReturn / data.count : 0,
      count: data.count
    };
  });
}

// Helper function to generate sample investment data for scenario
function generateSampleInvestmentData(selectedScenario: any): any[] {
  if (!selectedScenario?.results?.simulations?.length) {
    // Generate sample data if no real simulations available
    return Array.from({ length: 20 }, (_, i) => {
      const entryAmount = 1 + Math.random() * 3;
      const exitAmount = Math.random() * 10;
      const gain = exitAmount - entryAmount;
      const companyHash = i * 17; // Simple hash for consistent pseudo-random data
      
      return {
        companyName: `Company ${i + 1}`,
        entryAmount,
        exitAmount,
        gain,
        moic: exitAmount / entryAmount,
        exitStage: ['Pre-Seed', 'Seed', 'Series A', 'Series B', 'Series C', 'IPO'][Math.floor(Math.random() * 6)],
        holdingPeriod: 2 + Math.random() * 6,
        initialOwnership: 10 + Math.random() * 20,
        finalOwnership: (10 + Math.random() * 20) * (0.6 + Math.random() * 0.3),
        sector: ['AI/ML', 'Fintech', 'Healthcare', 'SaaS', 'E-commerce', 'Biotech'][companyHash % 6],
        region: ['North America', 'Europe', 'Asia', 'Other'][companyHash % 4]
      };
    });
  }

  // Process actual simulation data to include gain field
  const simulationData = selectedScenario.results.simulations[0] || [];
  return simulationData.map((investment: any, index: number) => {
    const entryAmount = investment.entryAmount || (1 + Math.random() * 3);
    const exitAmount = investment.exitAmount || (Math.random() * 10);
    const gain = exitAmount - entryAmount;
    const companyHash = (investment.companyName || `Company ${index}`).split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    
    return {
      ...investment,
      entryAmount,
      exitAmount,
      gain,
      companyName: investment.companyName || `Company ${Math.floor(Math.random() * 1000)}`,
      moic: investment.moic || (exitAmount / entryAmount),
      exitStage: investment.exitStage || ['Pre-Seed', 'Seed', 'Series A', 'Series B', 'Series C', 'IPO'][Math.floor(Math.random() * 6)],
      holdingPeriod: investment.holdingPeriod || (2 + Math.random() * 6),
      initialOwnership: investment.initialOwnership || (10 + Math.random() * 20),
      finalOwnership: investment.finalOwnership || ((investment.initialOwnership || 15) * (0.6 + Math.random() * 0.3)),
      sector: investment.sector || ['AI/ML', 'Fintech', 'Healthcare', 'SaaS', 'E-commerce', 'Biotech'][companyHash % 6],
      region: investment.region || ['North America', 'Europe', 'Asia', 'Other'][companyHash % 4]
    };
  });
}

// Parameter Comparison View Component
const ParameterComparisonView = ({ 
  scenarios 
}: { 
  scenarios: TargetScenario[] 
}) => {
  // Fixed comparison data structure
  const comparisonData = scenarios.map(scenario => {
    const adj = scenario.requiredAdjustments;
    return {
      targetMOIC: `${scenario.targetMOIC}x`,
      'Stage Progression (%)': adj.stageProgressionIncrease,
      'Dilution Rates (%)': adj.dilutionRatesDecrease,
      'Loss Probabilities (%)': adj.lossProbabilitiesDecrease,
      'Exit Valuations ($MM)': adj.exitValuationsIncrease,
      achievability: scenario.achievabilityScore
    };
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Parameter Adjustments by Target MOIC</CardTitle>
          <p className="text-sm text-gray-600">
            Grouped bar chart showing required adjustments for each parameter type across different target MOICs.
          </p>
        </CardHeader>
        <CardContent>
          <SafeChart height={400}>
            <BarChart data={comparisonData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="targetMOIC" />
              <YAxis label={{ value: 'Adjustment (%)', angle: -90, position: 'insideLeft' }} />
              <Tooltip formatter={(value: any) => [`${value.toFixed(1)}%`, 'Adjustment']} />
              <Bar 
                dataKey="Stage Progression (%)" 
                fill="#3B82F6"
                name="Stage Progression (%)"
              />
              <Bar 
                dataKey="Dilution Rates (%)" 
                fill="#10B981"
                name="Dilution Rates (%)"
              />
              <Bar 
                dataKey="Loss Probabilities (%)" 
                fill="#F59E0B"
                name="Loss Probabilities (%)"
              />
              <Bar 
                dataKey="Exit Valuations ($MM)" 
                fill="#8B5CF6"
                name="Exit Valuations ($MM)"
              />
            </BarChart>
          </SafeChart>
        </CardContent>
      </Card>

      {/* Parameter Heatmap */}
      <Card>
        <CardHeader>
          <CardTitle>Parameter Adjustment Heatmap</CardTitle>
          <p className="text-sm text-gray-600">
            Visual intensity map showing the magnitude of adjustments needed for each parameter.
          </p>
        </CardHeader>
        <CardContent>
          <ParameterHeatmap scenarios={scenarios} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Achievability Scores</CardTitle>
        </CardHeader>
        <CardContent>
          <SafeChart height={250}>
            <BarChart data={comparisonData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="targetMOIC" />
              <YAxis domain={[0, 100]} />
              <Tooltip formatter={(value: any) => [`${value.toFixed(0)}%`, 'Achievability']} />
              <Bar dataKey="achievability" fill="#3B82F6" />
            </BarChart>
          </SafeChart>
        </CardContent>
      </Card>
    </div>
  );
};

// Parameter Heatmap Component
const ParameterHeatmap = ({ scenarios }: { scenarios: TargetScenario[] }) => {
  const getHeatmapColor = (value: number): string => {
    if (value === 0) return 'bg-gray-100 text-gray-600';
    if (value <= 10) return 'bg-green-100 text-green-800';
    if (value <= 20) return 'bg-yellow-100 text-yellow-800';
    if (value <= 35) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="text-left py-2">Target MOIC</th>
            <th className="text-center py-2">Stage Progression (%)</th>
            <th className="text-center py-2">Dilution Rates (%)</th>
            <th className="text-center py-2">Loss Probabilities (%)</th>
            <th className="text-center py-2">Exit Valuations ($MM)</th>
          </tr>
        </thead>
        <tbody>
          {scenarios.map(scenario => (
            <tr key={scenario.targetMOIC} className="border-b">
              <td className="py-2 font-medium">{scenario.targetMOIC}x</td>
              <td className="py-2 text-center">
                <span className={`px-2 py-1 rounded text-xs font-medium ${getHeatmapColor(scenario.requiredAdjustments.stageProgressionIncrease)}`}>
                  {scenario.requiredAdjustments.stageProgressionIncrease.toFixed(1)}%
                </span>
              </td>
              <td className="py-2 text-center">
                <span className={`px-2 py-1 rounded text-xs font-medium ${getHeatmapColor(scenario.requiredAdjustments.dilutionRatesDecrease)}`}>
                  -{scenario.requiredAdjustments.dilutionRatesDecrease.toFixed(1)}%
                </span>
              </td>
              <td className="py-2 text-center">
                <span className={`px-2 py-1 rounded text-xs font-medium ${getHeatmapColor(scenario.requiredAdjustments.lossProbabilitiesDecrease)}`}>
                  -{scenario.requiredAdjustments.lossProbabilitiesDecrease.toFixed(1)}%
                </span>
              </td>
              <td className="py-2 text-center">
                <span className={`px-2 py-1 rounded text-xs font-medium ${getHeatmapColor(scenario.requiredAdjustments.exitValuationsIncrease)}`}>
                  {scenario.requiredAdjustments.exitValuationsIncrease.toFixed(1)}%
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Helper function to generate parameter evolution data for selected startups
function generateParameterEvolutionData(
  selectedStartups: string[], 
  selectedScenario: any, 
  baselineParams: any
): any[] {
  if (!selectedStartups.length || !selectedScenario || !baselineParams) return [];

  const scenarioData = generateSampleInvestmentData(selectedScenario);
  
  return selectedStartups.map(companyName => {
    const startup = scenarioData.find(s => s.companyName === companyName);
    if (!startup) return null;

    // Calculate baseline parameters (with some company-specific variation)
    const companyHash = companyName.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    const variationFactor = 0.8 + (companyHash % 40) / 100; // 0.8 to 1.2 variation

    // Generate stage-specific baseline data
    const baselineStageData = generateStageSpecificData(companyHash, variationFactor);
    
    // Calculate adjusted parameters
    const adjustments = selectedScenario.adjustments || {
      exitValuationsIncrease: 0,
      stageProgressionIncrease: 0,
      lossProbabilitiesDecrease: 0,
      dilutionRatesDecrease: 0
    };

    // Generate adjusted stage-specific data
    const adjustedStageData = applyAdjustmentsToStageData(baselineStageData, adjustments);

    // Calculate overall metrics for chart compatibility
    const baselineExitValuation = baselineParams.exitValuation * variationFactor;
    const adjustedExitValuation = baselineExitValuation * (1 + adjustments.exitValuationsIncrease / 100);
    const baselineStageProgression = baselineParams.progression * variationFactor;
    const adjustedStageProgression = baselineStageProgression * (1 + adjustments.stageProgressionIncrease / 100);
    const baselineLossProb = baselineParams.lossProb * variationFactor;
    const adjustedLossProb = baselineLossProb * (1 - adjustments.lossProbabilitiesDecrease / 100);
    const baselineDilution = baselineParams.dilution * variationFactor;
    const adjustedDilution = baselineDilution * (1 - adjustments.dilutionRatesDecrease / 100);

    // Calculate expected MOIC improvement (simplified calculation)
    const expectedMOICImprovement = (
      (adjustments.exitValuationsIncrease / 100) * 0.4 +
      (adjustments.stageProgressionIncrease / 100) * 0.3 +
      (adjustments.lossProbabilitiesDecrease / 100) * 0.2 +
      (adjustments.dilutionRatesDecrease / 100) * 0.1
    );

    return {
      companyName,
      // Overall metrics for charts
      baselineExitValuation,
      adjustedExitValuation,
      baselineStageProgression,
      adjustedStageProgression,
      baselineLossProb,
      adjustedLossProb,
      baselineDilution,
      adjustedDilution,
      expectedMOICImprovement,
      // Stage-specific detailed data
      baselineStageData,
      adjustedStageData,
      sector: startup.sector || ['AI/ML', 'Fintech', 'Healthcare', 'SaaS', 'E-commerce', 'Biotech'][companyHash % 6],
      region: startup.region || ['North America', 'Europe', 'Asia', 'Other'][companyHash % 4],
    };
  }).filter(Boolean);
}

// Helper function to generate stage-specific baseline data
function generateStageSpecificData(companyHash: number, variationFactor: number) {
  const stages = ['Pre-Seed', 'Seed', 'Series A', 'Series B', 'Series C', 'IPO'];
  
  return {
    exitValuations: {
      'Pre-Seed': {
        min: (2 + (companyHash % 5)) * variationFactor,
        max: (8 + (companyHash % 12)) * variationFactor,
        avg: (5 + (companyHash % 8)) * variationFactor
      },
      'Seed': {
        min: (8 + (companyHash % 10)) * variationFactor,
        max: (25 + (companyHash % 20)) * variationFactor,
        avg: (15 + (companyHash % 15)) * variationFactor
      },
      'Series A': {
        min: (20 + (companyHash % 15)) * variationFactor,
        max: (80 + (companyHash % 40)) * variationFactor,
        avg: (45 + (companyHash % 25)) * variationFactor
      },
      'Series B': {
        min: (50 + (companyHash % 30)) * variationFactor,
        max: (200 + (companyHash % 100)) * variationFactor,
        avg: (120 + (companyHash % 60)) * variationFactor
      },
      'Series C': {
        min: (150 + (companyHash % 50)) * variationFactor,
        max: (500 + (companyHash % 200)) * variationFactor,
        avg: (300 + (companyHash % 150)) * variationFactor
      },
      'IPO': {
        min: (400 + (companyHash % 200)) * variationFactor,
        max: (2000 + (companyHash % 1000)) * variationFactor,
        avg: (1000 + (companyHash % 500)) * variationFactor
      }
    },
    stageProgression: {
      'Pre-Seed to Seed': 15 + (companyHash % 20),
      'Seed to Series A': 25 + (companyHash % 25),
      'Series A to Series B': 35 + (companyHash % 30),
      'Series B to Series C': 45 + (companyHash % 25),
      'Series C to IPO': 20 + (companyHash % 30)
    },
    lossProbabilities: {
      'Pre-Seed': 70 + (companyHash % 20),
      'Seed': 60 + (companyHash % 20),
      'Series A': 45 + (companyHash % 20),
      'Series B': 30 + (companyHash % 15),
      'Series C': 20 + (companyHash % 10),
      'IPO': 5 + (companyHash % 5)
    },
    dilutionRates: {
      'Pre-Seed': 15 + (companyHash % 10),
      'Seed': 18 + (companyHash % 8),
      'Series A': 20 + (companyHash % 10),
      'Series B': 15 + (companyHash % 8),
      'Series C': 12 + (companyHash % 6),
      'IPO': 8 + (companyHash % 4)
    }
  };
}

// Helper function to apply adjustments to stage-specific data
function applyAdjustmentsToStageData(baselineData: any, adjustments: any) {
  const adjusted = JSON.parse(JSON.stringify(baselineData)); // Deep copy
  
  // Apply exit valuation adjustments
  Object.keys(adjusted.exitValuations).forEach(stage => {
    const multiplier = 1 + adjustments.exitValuationsIncrease / 100;
    adjusted.exitValuations[stage].min *= multiplier;
    adjusted.exitValuations[stage].max *= multiplier;
    adjusted.exitValuations[stage].avg *= multiplier;
  });
  
  // Apply stage progression adjustments
  Object.keys(adjusted.stageProgression).forEach(transition => {
    adjusted.stageProgression[transition] *= (1 + adjustments.stageProgressionIncrease / 100);
    adjusted.stageProgression[transition] = Math.min(95, adjusted.stageProgression[transition]); // Cap at 95%
  });
  
  // Apply loss probability adjustments
  Object.keys(adjusted.lossProbabilities).forEach(stage => {
    adjusted.lossProbabilities[stage] *= (1 - adjustments.lossProbabilitiesDecrease / 100);
    adjusted.lossProbabilities[stage] = Math.max(1, adjusted.lossProbabilities[stage]); // Floor at 1%
  });
  
  // Apply dilution rate adjustments
  Object.keys(adjusted.dilutionRates).forEach(stage => {
    adjusted.dilutionRates[stage] *= (1 - adjustments.dilutionRatesDecrease / 100);
    adjusted.dilutionRates[stage] = Math.max(2, adjusted.dilutionRates[stage]); // Floor at 2%
  });
  
  return adjusted;
}

export default SensitivityAnalysisDashboard; 
import type { 
  PortfolioInvestment, 
  PortfolioSimulationParams,
  PortfolioResults,
  SensitivityAnalysis,
  SensitivityAnalysisParams,
  TargetScenario,
  ParameterAdjustments,
  SingleParameterResult,
  AchievabilityFactor,
  EnhancedAchievabilityScore,
  MixedParameterOption
} from '@/types/portfolio';
import { runPortfolioSimulation } from './portfolioSimulation';

// Progress callback type for sensitivity analysis
export type SensitivityProgressCallback = (progress: number, currentStep: string) => void;

// Extended params to include progress callback
export interface ExtendedSensitivityAnalysisParams extends SensitivityAnalysisParams {
  onProgress?: SensitivityProgressCallback;
}

/**
 * Check if parameter adjustments would exceed logical bounds
 */
function checkParameterBounds(
  investments: PortfolioInvestment[],
  adjustments: ParameterAdjustments
): { isValid: boolean; violations: string[] } {
  const violations: string[] = [];

  // Check each investment to see if adjustments would violate bounds
  for (const investment of investments) {
    // 1. Stage Progression - check if any would exceed 100%
    if (adjustments.stageProgressionIncrease > 0) {
      const multiplier = 1 + (adjustments.stageProgressionIncrease / 100);
      const progressions = [
        { name: 'toSeed', value: (investment.stageProgression.toSeed || 0) * multiplier },
        { name: 'toSeriesA', value: (investment.stageProgression.toSeriesA || 0) * multiplier },
        { name: 'toSeriesB', value: (investment.stageProgression.toSeriesB || 0) * multiplier },
        { name: 'toSeriesC', value: (investment.stageProgression.toSeriesC || 0) * multiplier },
        { name: 'toIPO', value: (investment.stageProgression.toIPO || 0) * multiplier }
      ];
      
      const maxProgression = Math.max(...progressions.map(p => p.value));
      if (maxProgression > 100) {
        violations.push(`Stage progression would exceed 100% (max: ${maxProgression.toFixed(1)}%)`);
        break; // Only report once per parameter type
      }
    }

    // 2. Dilution Rates - check if any would go below 0%
    if (adjustments.dilutionRatesDecrease > 0) {
      const dilutionMultiplier = 1 - (adjustments.dilutionRatesDecrease / 100);
      const dilutions = [
        investment.dilutionRates.seed || 0,
        investment.dilutionRates.seriesA || 0,
        investment.dilutionRates.seriesB || 0,
        investment.dilutionRates.seriesC || 0,
        investment.dilutionRates.ipo || 0
      ].filter(d => d > 0);
      
      const minDilution = Math.min(...dilutions.map(d => d * dilutionMultiplier));
      if (minDilution < 0) {
        violations.push(`Dilution rates would go below 0% (min: ${minDilution.toFixed(1)}%)`);
        break;
      }
    }

    // 3. Loss Probabilities - check if any would go below 0%
    if (adjustments.lossProbabilitiesDecrease > 0) {
      const lossMultiplier = 1 - (adjustments.lossProbabilitiesDecrease / 100);
      const lossProbs = [
        investment.lossProb.preSeed,
        investment.lossProb.seed,
        investment.lossProb.seriesA,
        investment.lossProb.seriesB,
        investment.lossProb.seriesC,
        investment.lossProb.ipo
      ];
      
      const minLossProb = Math.min(...lossProbs.map(p => p * lossMultiplier));
      if (minLossProb < 0) {
        violations.push(`Loss probabilities would go below 0% (min: ${minLossProb.toFixed(1)}%)`);
        break;
      }
    }
  }

  return {
    isValid: violations.length === 0,
    violations
  };
}

/**
 * Calculate maximum safe adjustment for a parameter type
 */
function calculateMaxSafeAdjustment(
  investments: PortfolioInvestment[],
  parameterType: 'stageProgression' | 'dilutionRates' | 'lossProbabilities' | 'exitValuations'
): number {
  let maxSafeAdjustment = 100; // Start with 100% as theoretical max

  for (const investment of investments) {
    switch (parameterType) {
      case 'stageProgression': {
        // Find the maximum current progression rate
        const maxCurrentProgression = Math.max(
          investment.stageProgression.toSeed || 0,
          investment.stageProgression.toSeriesA || 0,
          investment.stageProgression.toSeriesB || 0,
          investment.stageProgression.toSeriesC || 0,
          investment.stageProgression.toIPO || 0
        );
        
        if (maxCurrentProgression > 0) {
          // Calculate max increase that won't exceed 100%
          const maxIncrease = (100 - maxCurrentProgression) / maxCurrentProgression * 100;
          maxSafeAdjustment = Math.min(maxSafeAdjustment, Math.max(0, maxIncrease));
        }
        break;
      }
      
      case 'dilutionRates': {
        // For dilution rates, we can decrease by at most 100% (to reach 0)
        maxSafeAdjustment = Math.min(maxSafeAdjustment, 100);
        break;
      }
      
      case 'lossProbabilities': {
        // For loss probabilities, we can decrease by at most 100% (to reach 0)
        maxSafeAdjustment = Math.min(maxSafeAdjustment, 100);
        break;
      }
      
      case 'exitValuations': {
        // Exit valuations can be increased without logical bounds - return very high limit
        return 1000; // Allow up to 1000% increase (10x multiplier)
      }
    }
  }

  return maxSafeAdjustment;
}

/**
 * Main function to run sensitivity analysis with progress tracking
 */
export async function runSensitivityAnalysis(params: ExtendedSensitivityAnalysisParams): Promise<SensitivityAnalysis> {
  const { 
    investments, 
    simulationParams, 
    baselineResults, 
    maxAdjustmentPercent = 50, 
    stepSize = 5,
    onProgress 
  } = params;

  const totalSteps = 4; // baseline, target calculation, single param analysis, mixed param analysis
  let currentStep = 0;

  const updateProgress = async (stepName: string) => {
    if (onProgress) {
      currentStep++;
      const progressPercent = (currentStep / totalSteps) * 100;
      console.log(`Progress: ${progressPercent.toFixed(1)}% - ${stepName}`); // Debug log
      onProgress(progressPercent, stepName);
      // Add a small delay to allow UI to update
      await new Promise(resolve => setTimeout(resolve, 500)); // Increased delay for testing
    }
  };

  await updateProgress('Analyzing baseline results...');

  // Use provided baseline results instead of re-running
  const baselineResultsToUse = baselineResults || runPortfolioSimulation(investments, simulationParams);
  const baselineMOIC = baselineResultsToUse.avgMOIC;

  await updateProgress('Calculating target MOICs...');

  // Determine target MOICs (integers higher than baseline)
  const targetMOICs = getTargetMOICs(baselineMOIC);

  await updateProgress('Running single parameter analysis...');

  // Find required adjustments for each target with bounds checking
  const targetScenarios: TargetScenario[] = [];

  for (let i = 0; i < targetMOICs.length; i++) {
    const targetMOIC = targetMOICs[i];
    if (onProgress) {
      const substepProgress = ((currentStep - 1) + (i / targetMOICs.length)) / totalSteps * 100;
      console.log(`Sub-progress: ${substepProgress.toFixed(1)}% - Analyzing target ${targetMOIC}x MOIC...`); // Debug log
      onProgress(substepProgress, `Analyzing target ${targetMOIC}x MOIC...`);
      // Add a small delay to allow UI to update
      await new Promise(resolve => setTimeout(resolve, 200)); // Increased delay for testing
    }

    const scenario = findRequiredAdjustments(
      investments,
      simulationParams,
      targetMOIC,
      maxAdjustmentPercent,
      stepSize
    );
    
    if (scenario) {
      targetScenarios.push(scenario);
    }
  }

  await updateProgress('Analysis complete!');
  
  // Ensure progress is at 100%
  if (onProgress) {
    onProgress(100, 'Analysis complete!');
    await new Promise(resolve => setTimeout(resolve, 500)); // Brief pause to show completion
  }

  return {
    baselineResults: baselineResultsToUse,
    targetScenarios,
    baselineMOIC,
    targetMOICs
  };
}

/**
 * Determine target MOICs based on baseline (capped at reasonable levels)
 */
function getTargetMOICs(baselineMOIC: number): number[] {
  const startMOIC = Math.ceil(baselineMOIC);
  const maxMOIC = Math.min(10, baselineMOIC + 6); // Cap at baseline + 6 or 10, whichever is smaller
  const targets: number[] = [];
  
  for (let moic = startMOIC; moic <= maxMOIC; moic++) {
    if (moic > baselineMOIC) {
      targets.push(moic);
    }
  }
  
  // Ensure we have at least a few targets even if baseline is high
  if (targets.length === 0 && baselineMOIC < 8) {
    targets.push(Math.ceil(baselineMOIC + 0.5));
  }
  
  return targets;
}

/**
 * Calculate enhanced achievability score with detailed breakdown
 */
function calculateEnhancedAchievabilityScore(adjustments: ParameterAdjustments): EnhancedAchievabilityScore {
  const factors: AchievabilityFactor[] = [];
  
  // Factor 1: Total adjustment magnitude (40% weight)
  const totalAdj = adjustments.stageProgressionIncrease + 
                   adjustments.dilutionRatesDecrease + 
                   adjustments.lossProbabilitiesDecrease + 
                   adjustments.exitValuationsIncrease;
  const magnitudeScore = Math.max(0, 100 - (totalAdj * 2)); // 2 points per 1% adjustment
  factors.push({
    name: "Adjustment Magnitude",
    score: magnitudeScore,
    weight: 0.4,
    explanation: `${totalAdj.toFixed(1)}% total adjustments needed`
  });
  
  // Factor 2: Parameter diversity penalty (20% weight)
  const nonZeroParams = Object.values(adjustments).filter(v => v > 0).length;
  const diversityScore = nonZeroParams === 1 ? 100 : Math.max(0, 100 - (nonZeroParams - 1) * 25);
  factors.push({
    name: "Parameter Diversity",
    score: diversityScore,
    weight: 0.2,
    explanation: `${nonZeroParams} parameter type${nonZeroParams > 1 ? 's' : ''} adjusted`
  });
  
  // Factor 3: Market realism (40% weight)
  const maxSingleAdj = Math.max(...Object.values(adjustments));
  const realismScore = maxSingleAdj <= 15 ? 100 : 
                      maxSingleAdj <= 30 ? 80 : 
                      maxSingleAdj <= 50 ? 50 : 20;
  factors.push({
    name: "Market Realism",
    score: realismScore,
    weight: 0.4,
    explanation: `Max single parameter: ${maxSingleAdj.toFixed(1)}%`
  });
  
  const finalScore = factors.reduce((sum, f) => sum + (f.score * f.weight), 0);
  
  return {
    score: finalScore,
    explanation: getScoreExplanation(finalScore),
    factors
  };
}

function getScoreExplanation(score: number): string {
  if (score >= 80) return "Highly achievable with normal market conditions";
  if (score >= 60) return "Achievable with favorable market conditions";
  if (score >= 40) return "Requires optimistic market assumptions";
  return "Requires exceptional market performance";
}

/**
 * Try single parameter adjustments for each parameter type
 */
function findSingleParameterAdjustments(
  investments: PortfolioInvestment[],
  baseParams: PortfolioSimulationParams,
  targetMOIC: number,
  maxAdjustment: number,
  stepSize: number
): SingleParameterResult[] {
  const parameterTypes: Array<SingleParameterResult['parameterType']> = [
    'stageProgression', 'dilutionRates', 'lossProbabilities', 'exitValuations'
  ];

  const results: SingleParameterResult[] = [];

  for (const paramType of parameterTypes) {
    // Calculate maximum safe adjustment for this parameter type
    const maxSafeAdjustment = calculateMaxSafeAdjustment(investments, paramType);
    
    // Use the smaller of maxAdjustment and maxSafeAdjustment
    const effectiveMaxAdjustment = Math.min(maxAdjustment * 2, maxSafeAdjustment);
    
    // Binary search for minimum adjustment needed
    let low = 0;
    let high = effectiveMaxAdjustment;
    let bestAdjustment: number = 0;
    let bestResults: PortfolioResults | null = null;
    let actualRequirement: number = 0;

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      
      const adjustment: ParameterAdjustments = {
        stageProgressionIncrease: paramType === 'stageProgression' ? mid : 0,
        dilutionRatesDecrease: paramType === 'dilutionRates' ? mid : 0,
        lossProbabilitiesDecrease: paramType === 'lossProbabilities' ? mid : 0,
        exitValuationsIncrease: paramType === 'exitValuations' ? mid : 0
      };

      // Check bounds before applying
      const boundsCheck = checkParameterBounds(investments, adjustment);
      if (!boundsCheck.isValid) {
        // This adjustment violates bounds, try smaller
        high = mid - stepSize;
        continue;
      }

      try {
        const adjustedInvestments = applyParameterAdjustments(investments, adjustment);
        const simulationResults = runPortfolioSimulation(adjustedInvestments, baseParams);

        if (simulationResults.avgMOIC >= targetMOIC) {
          bestAdjustment = mid;
          actualRequirement = mid;
          bestResults = simulationResults;
          high = mid - stepSize; // Try smaller adjustment
        } else {
          low = mid + stepSize; // Need larger adjustment
        }
      } catch (error) {
        console.warn(`Error testing ${paramType} adjustment of ${mid}%:`, error);
        low = mid + stepSize;
      }
    }

    // If no solution found within bounds, check if it's impossible
    if (bestAdjustment === 0 && actualRequirement === 0) {
      // If we've reached the maximum safe adjustment and still can't achieve target
      if (effectiveMaxAdjustment < maxAdjustment * 2) {
        // This means we hit parameter bounds - mark as impossible
        results.push({
          parameterType: paramType,
          adjustmentPercent: effectiveMaxAdjustment,
          achievable: false,
          results: null,
          actualRequirement: Number.POSITIVE_INFINITY,
          boundViolations: [`Cannot exceed ${effectiveMaxAdjustment.toFixed(1)}% adjustment due to parameter bounds`]
        });
        continue;
      }
      
      // Try a large adjustment to see the trend
      const testAdjustment = Math.min(maxAdjustment, maxSafeAdjustment);
      const adjustment: ParameterAdjustments = {
        stageProgressionIncrease: paramType === 'stageProgression' ? testAdjustment : 0,
        dilutionRatesDecrease: paramType === 'dilutionRates' ? testAdjustment : 0,
        lossProbabilitiesDecrease: paramType === 'lossProbabilities' ? testAdjustment : 0,
        exitValuationsIncrease: paramType === 'exitValuations' ? testAdjustment : 0
      };
      
      // Check if even the test adjustment is valid
      const testBoundsCheck = checkParameterBounds(investments, adjustment);
      if (!testBoundsCheck.isValid) {
        results.push({
          parameterType: paramType,
          adjustmentPercent: 0,
          achievable: false,
          results: null,
          actualRequirement: Number.POSITIVE_INFINITY,
          boundViolations: testBoundsCheck.violations
        });
        continue;
      }
      
      try {
        // Get baseline results first
        const baselineResults = runPortfolioSimulation(investments, baseParams);
        const baselineMOIC = baselineResults.avgMOIC;
        
        // Get results with test adjustment
        const adjustedInvestments = applyParameterAdjustments(investments, adjustment);
        const simulationResults = runPortfolioSimulation(adjustedInvestments, baseParams);
        
        // Linear extrapolation: if testAdjustment gives X improvement, what's needed for target?
        const currentMOIC = simulationResults.avgMOIC;
        const improvementPerPercent = (currentMOIC - baselineMOIC) / testAdjustment;
        const targetImprovement = targetMOIC - baselineMOIC;
        
        if (improvementPerPercent > 0) {
          actualRequirement = Math.round(targetImprovement / improvementPerPercent);
          
          // Check if the actual requirement exceeds bounds
          if (actualRequirement > maxSafeAdjustment) {
            results.push({
              parameterType: paramType,
              adjustmentPercent: maxSafeAdjustment,
              achievable: false,
              results: null,
              actualRequirement: actualRequirement,
              boundViolations: [`Requires ${actualRequirement.toFixed(1)}% adjustment, but maximum safe adjustment is ${maxSafeAdjustment.toFixed(1)}%`]
            });
            continue;
          }
          
          // Cap at a reasonable maximum to indicate "very high requirement"
          actualRequirement = Math.min(actualRequirement, 500);
        } else {
          actualRequirement = 999; // Indicates this parameter has no meaningful effect
        }
      } catch (error) {
        console.warn(`Error estimating ${paramType} requirement:`, error);
        actualRequirement = 999;
      }
    }

    results.push({
      parameterType: paramType,
      adjustmentPercent: actualRequirement,
      achievable: actualRequirement > 0 && actualRequirement <= maxAdjustment,
      results: bestResults || {} as PortfolioResults
    });
  }

  return results;
}

/**
 * Find the minimum parameter adjustments needed to achieve target MOIC
 */
function findRequiredAdjustments(
  investments: PortfolioInvestment[],
  baseParams: PortfolioSimulationParams,
  targetMOIC: number,
  maxAdjustment: number,
  stepSize: number
): TargetScenario | null {
  
  // First, try single parameter adjustments
  const singleParameterOptions = findSingleParameterAdjustments(
    investments, baseParams, targetMOIC, maxAdjustment, stepSize
  );

  // Check if any single parameter option is achievable
  const achievableSingleOption = singleParameterOptions.find(option => option.achievable);
  
  // Find multiple mixed parameter solutions
  const mixedParameterOptions = findOptimalMixedParameterCombinations(
    investments,
    baseParams,
    targetMOIC,
    maxAdjustment,
    stepSize
  );

  // Also try to find a single optimal mixed parameter combination for legacy support
  let mixedParameterOption: ParameterAdjustments | null = null;
  let bestResults: PortfolioResults | null = null;

  if (mixedParameterOptions.length > 0) {
    // Use the best (first) option as the primary mixed parameter solution
    mixedParameterOption = mixedParameterOptions[0].adjustments;
    bestResults = mixedParameterOptions[0].results;
  } else {
    // Fallback: try the legacy single mixed parameter approach
    const combinedAdjustment = findOptimalMixedParameterCombination(
      investments,
      baseParams,
      targetMOIC,
      maxAdjustment,
      stepSize
    );
    
    if (combinedAdjustment) {
      mixedParameterOption = combinedAdjustment.adjustment;
      bestResults = combinedAdjustment.results;
    } else if (achievableSingleOption) {
      // Final fallback to single parameter if mixed approach fails
      mixedParameterOption = {
        stageProgressionIncrease: achievableSingleOption.parameterType === 'stageProgression' ? achievableSingleOption.adjustmentPercent : 0,
        dilutionRatesDecrease: achievableSingleOption.parameterType === 'dilutionRates' ? achievableSingleOption.adjustmentPercent : 0,
        lossProbabilitiesDecrease: achievableSingleOption.parameterType === 'lossProbabilities' ? achievableSingleOption.adjustmentPercent : 0,
        exitValuationsIncrease: achievableSingleOption.parameterType === 'exitValuations' ? achievableSingleOption.adjustmentPercent : 0
      };
      bestResults = achievableSingleOption.results;
    }
  }

  if (!mixedParameterOption || !bestResults) {
    return null; // Target not achievable within constraints
  }

  // Calculate enhanced achievability score
  const enhancedAchievability = calculateEnhancedAchievabilityScore(mixedParameterOption);
  const isRealistic = isAdjustmentRealistic(mixedParameterOption);

  return {
    targetMOIC,
    requiredAdjustments: mixedParameterOption,
    adjustedResults: bestResults,
    achievabilityScore: enhancedAchievability.score,
    isRealistic,
    enhancedAchievability,
    singleParameterOptions,
    mixedParameterOption,
    mixedParameterOptions: mixedParameterOptions.length > 0 ? mixedParameterOptions : undefined
  };
}

/**
 * Find multiple optimal mixed parameter combinations
 */
function findOptimalMixedParameterCombinations(
  investments: PortfolioInvestment[],
  baseParams: PortfolioSimulationParams,
  targetMOIC: number,
  maxAdjustment: number,
  stepSize: number
): MixedParameterOption[] {
  
  // Generate comprehensive set of strategic combinations
  const strategicCombinations = generateStrategicCombinations(targetMOIC, maxAdjustment);
  
  const successfulOptions: MixedParameterOption[] = [];

  for (const combination of strategicCombinations) {
    try {
      // Check bounds before applying
      const boundsCheck = checkParameterBounds(investments, combination.adjustments);
      if (!boundsCheck.isValid) {
        continue;
      }

      const adjustedInvestments = applyParameterAdjustments(investments, combination.adjustments);
      const results = runPortfolioSimulation(adjustedInvestments, baseParams);
      
      if (results.avgMOIC >= targetMOIC) {
        const totalAdjustment = combination.adjustments.stageProgressionIncrease + 
                               combination.adjustments.dilutionRatesDecrease + 
                               combination.adjustments.lossProbabilitiesDecrease + 
                               combination.adjustments.exitValuationsIncrease;

        successfulOptions.push({
          name: combination.name,
          description: combination.description,
          adjustments: combination.adjustments,
          results,
          totalAdjustment,
          approachType: combination.approachType
        });
      }
    } catch (error) {
      console.warn(`Error testing ${combination.name}:`, error);
      continue;
    }
  }

  // If we have fewer than 3 successful options, generate more conservative fallbacks
  if (successfulOptions.length < 3) {
    const fallbackCombinations = generateFallbackCombinations(targetMOIC, maxAdjustment, successfulOptions.length);
    
    for (const combination of fallbackCombinations) {
      try {
        const boundsCheck = checkParameterBounds(investments, combination.adjustments);
        if (!boundsCheck.isValid) {
          continue;
        }

        const adjustedInvestments = applyParameterAdjustments(investments, combination.adjustments);
        const results = runPortfolioSimulation(adjustedInvestments, baseParams);
        
        if (results.avgMOIC >= targetMOIC) {
          const totalAdjustment = combination.adjustments.stageProgressionIncrease + 
                                 combination.adjustments.dilutionRatesDecrease + 
                                 combination.adjustments.lossProbabilitiesDecrease + 
                                 combination.adjustments.exitValuationsIncrease;

          successfulOptions.push({
            name: combination.name,
            description: combination.description,
            adjustments: combination.adjustments,
            results,
            totalAdjustment,
            approachType: combination.approachType
          });
          
          // Stop when we have enough options
          if (successfulOptions.length >= 3) break;
        }
      } catch (error) {
        console.warn(`Error testing fallback ${combination.name}:`, error);
        continue;
      }
    }
  }

  // Sort by total adjustment (prefer minimal total adjustment) and return top 3-5 options
  return successfulOptions
    .sort((a, b) => a.totalAdjustment - b.totalAdjustment)
    .slice(0, Math.max(3, Math.min(5, successfulOptions.length)));
}

/**
 * Find optimal mixed parameter combination using linear optimization (legacy support)
 */
function findOptimalMixedParameterCombination(
  investments: PortfolioInvestment[],
  baseParams: PortfolioSimulationParams,
  targetMOIC: number,
  maxAdjustment: number,
  stepSize: number
): { adjustment: ParameterAdjustments; results: PortfolioResults } | null {
  
  const options = findOptimalMixedParameterCombinations(investments, baseParams, targetMOIC, maxAdjustment, stepSize);
  
  if (options.length > 0) {
    return { 
      adjustment: options[0].adjustments, 
      results: options[0].results 
    };
  }
  
  return null;
}

/**
 * Generate fallback combinations when not enough successful options are found
 */
function generateFallbackCombinations(targetMOIC: number, maxAdjustment: number, existingCount: number): Array<{
  name: string;
  description: string;
  adjustments: ParameterAdjustments;
  approachType: 'balanced' | 'exit-focused' | 'success-focused' | 'conservative' | 'aggressive';
}> {
  const highIntensity = Math.min(1.5, Math.max(0.8, (targetMOIC - 2) / 3)); // Higher intensity for fallbacks
  
  const fallbacks = [
    // Minimal Exit Focus
    {
      name: "Minimal Exit Focus",
      description: "Smallest possible adjustments with emphasis on exit valuations",
      approachType: 'conservative' as const,
      adjustments: {
        stageProgressionIncrease: maxAdjustment * 0.1 * highIntensity,
        dilutionRatesDecrease: maxAdjustment * 0.1 * highIntensity,
        lossProbabilitiesDecrease: maxAdjustment * 0.1 * highIntensity,
        exitValuationsIncrease: maxAdjustment * 0.8 * highIntensity
      }
    },
    
    // Pure Exit Strategy
    {
      name: "Pure Exit Strategy",
      description: "Maximum focus on exit valuations only",
      approachType: 'exit-focused' as const,
      adjustments: {
        stageProgressionIncrease: maxAdjustment * 0.05 * highIntensity,
        dilutionRatesDecrease: maxAdjustment * 0.05 * highIntensity,
        lossProbabilitiesDecrease: maxAdjustment * 0.05 * highIntensity,
        exitValuationsIncrease: maxAdjustment * 1.0 * highIntensity
      }
    },
    
    // Aggressive All-In
    {
      name: "Aggressive All-In",
      description: "Maximum adjustments across all parameters",
      approachType: 'aggressive' as const,
      adjustments: {
        stageProgressionIncrease: maxAdjustment * 0.8 * highIntensity,
        dilutionRatesDecrease: maxAdjustment * 0.7 * highIntensity,
        lossProbabilitiesDecrease: maxAdjustment * 0.8 * highIntensity,
        exitValuationsIncrease: maxAdjustment * 1.0 * highIntensity
      }
    },
    
    // Success-Only Focus
    {
      name: "Success-Only Focus",
      description: "Maximum success rate improvements with minimal exit changes",
      approachType: 'success-focused' as const,
      adjustments: {
        stageProgressionIncrease: maxAdjustment * 0.7 * highIntensity,
        dilutionRatesDecrease: maxAdjustment * 0.5 * highIntensity,
        lossProbabilitiesDecrease: maxAdjustment * 0.8 * highIntensity,
        exitValuationsIncrease: maxAdjustment * 0.2 * highIntensity
      }
    },
    
    // Linear Scaling
    {
      name: "Linear Scaling",
      description: "Proportional increases across all parameters",
      approachType: 'balanced' as const,
      adjustments: {
        stageProgressionIncrease: maxAdjustment * 0.5 * highIntensity,
        dilutionRatesDecrease: maxAdjustment * 0.5 * highIntensity,
        lossProbabilitiesDecrease: maxAdjustment * 0.5 * highIntensity,
        exitValuationsIncrease: maxAdjustment * 0.5 * highIntensity
      }
    }
  ];
  
  // Return fallbacks that weren't already covered
  return fallbacks.slice(existingCount);
}

/**
 * Generate comprehensive strategic combinations with names and descriptions
 */
function generateStrategicCombinations(targetMOIC: number, maxAdjustment: number): Array<{
  name: string;
  description: string;
  adjustments: ParameterAdjustments;
  approachType: 'balanced' | 'exit-focused' | 'success-focused' | 'conservative' | 'aggressive';
}> {
  const baseIntensity = Math.min(1.0, Math.max(0.4, (targetMOIC - 2) / 4)); // Scale intensity based on target MOIC
  
  return [
    // Conservative Balanced
    {
      name: "Conservative Balanced",
      description: "Moderate improvements across all parameters with emphasis on exit valuations",
      approachType: 'conservative',
      adjustments: {
        stageProgressionIncrease: maxAdjustment * 0.2 * baseIntensity,
        dilutionRatesDecrease: maxAdjustment * 0.15 * baseIntensity,
        lossProbabilitiesDecrease: maxAdjustment * 0.2 * baseIntensity,
        exitValuationsIncrease: maxAdjustment * 0.4 * baseIntensity
      }
    },
    
    // Balanced Optimization
    {
      name: "Balanced Optimization",
      description: "Equal weight to all key performance drivers",
      approachType: 'balanced',
      adjustments: {
        stageProgressionIncrease: maxAdjustment * 0.3 * baseIntensity,
        dilutionRatesDecrease: maxAdjustment * 0.25 * baseIntensity,
        lossProbabilitiesDecrease: maxAdjustment * 0.3 * baseIntensity,
        exitValuationsIncrease: maxAdjustment * 0.35 * baseIntensity
      }
    },
    
    // Exit Value Maximization
    {
      name: "Exit Value Maximization",
      description: "Focus on higher exit valuations with minimal other changes",
      approachType: 'exit-focused',
      adjustments: {
        stageProgressionIncrease: maxAdjustment * 0.15 * baseIntensity,
        dilutionRatesDecrease: maxAdjustment * 0.15 * baseIntensity,
        lossProbabilitiesDecrease: maxAdjustment * 0.2 * baseIntensity,
        exitValuationsIncrease: maxAdjustment * 0.7 * baseIntensity
      }
    },
    
    // Success Rate Optimization
    {
      name: "Success Rate Optimization",
      description: "Maximize portfolio success rate through progression and risk reduction",
      approachType: 'success-focused',
      adjustments: {
        stageProgressionIncrease: maxAdjustment * 0.45 * baseIntensity,
        dilutionRatesDecrease: maxAdjustment * 0.25 * baseIntensity,
        lossProbabilitiesDecrease: maxAdjustment * 0.5 * baseIntensity,
        exitValuationsIncrease: maxAdjustment * 0.25 * baseIntensity
      }
    },
    
    // Ownership Preservation
    {
      name: "Ownership Preservation",
      description: "Minimize dilution while improving success metrics",
      approachType: 'balanced',
      adjustments: {
        stageProgressionIncrease: maxAdjustment * 0.35 * baseIntensity,
        dilutionRatesDecrease: maxAdjustment * 0.6 * baseIntensity,
        lossProbabilitiesDecrease: maxAdjustment * 0.35 * baseIntensity,
        exitValuationsIncrease: maxAdjustment * 0.3 * baseIntensity
      }
    },
    
    // High-Growth Aggressive (for higher MOICs)
    {
      name: "High-Growth Aggressive",
      description: "Aggressive improvements across all metrics for ambitious targets",
      approachType: 'aggressive',
      adjustments: {
        stageProgressionIncrease: maxAdjustment * 0.6 * Math.min(1.2, baseIntensity * 1.5),
        dilutionRatesDecrease: maxAdjustment * 0.4 * Math.min(1.2, baseIntensity * 1.5),
        lossProbabilitiesDecrease: maxAdjustment * 0.6 * Math.min(1.2, baseIntensity * 1.5),
        exitValuationsIncrease: maxAdjustment * 0.8 * Math.min(1.2, baseIntensity * 1.5)
      }
    },
    
    // Market Leadership
    {
      name: "Market Leadership",
      description: "Focus on building category leaders with exceptional exits",
      approachType: 'exit-focused',
      adjustments: {
        stageProgressionIncrease: maxAdjustment * 0.4 * baseIntensity,
        dilutionRatesDecrease: maxAdjustment * 0.2 * baseIntensity,
        lossProbabilitiesDecrease: maxAdjustment * 0.3 * baseIntensity,
        exitValuationsIncrease: maxAdjustment * 0.9 * Math.min(1.2, baseIntensity * 1.3)
      }
    },
    
    // Risk Mitigation Focus
    {
      name: "Risk Mitigation Focus",
      description: "Prioritize loss reduction and steady progression",
      approachType: 'conservative',
      adjustments: {
        stageProgressionIncrease: maxAdjustment * 0.4 * baseIntensity,
        dilutionRatesDecrease: maxAdjustment * 0.3 * baseIntensity,
        lossProbabilitiesDecrease: maxAdjustment * 0.7 * baseIntensity,
        exitValuationsIncrease: maxAdjustment * 0.25 * baseIntensity
      }
    }
  ];
}

/**
 * Apply parameter adjustments to investments (with error handling)
 */
export function applyParameterAdjustments(
  investments: PortfolioInvestment[],
  adjustments: ParameterAdjustments
): PortfolioInvestment[] {
  return investments.map(investment => {
    try {
      const adjusted = JSON.parse(JSON.stringify(investment)); // Deep clone

      // 1. Stage Progression adjustment
      if (adjustments.stageProgressionIncrease > 0) {
        const multiplier = 1 + (adjustments.stageProgressionIncrease / 100);
        adjusted.stageProgression = {
          toSeed: Math.min(100, (investment.stageProgression.toSeed || 0) * multiplier),
          toSeriesA: Math.min(100, (investment.stageProgression.toSeriesA || 0) * multiplier),
          toSeriesB: Math.min(100, (investment.stageProgression.toSeriesB || 0) * multiplier),
          toSeriesC: Math.min(100, (investment.stageProgression.toSeriesC || 0) * multiplier),
          toIPO: Math.min(100, (investment.stageProgression.toIPO || 0) * multiplier)
        };
      }

      // 2. Dilution Rates adjustment (decrease dilution = keep more ownership)
      if (adjustments.dilutionRatesDecrease > 0) {
        const dilutionMultiplier = 1 - (adjustments.dilutionRatesDecrease / 100);
        adjusted.dilutionRates = {
          seed: investment.dilutionRates.seed ? Math.max(0, investment.dilutionRates.seed * dilutionMultiplier) : undefined,
          seriesA: investment.dilutionRates.seriesA ? Math.max(0, investment.dilutionRates.seriesA * dilutionMultiplier) : undefined,
          seriesB: investment.dilutionRates.seriesB ? Math.max(0, investment.dilutionRates.seriesB * dilutionMultiplier) : undefined,
          seriesC: investment.dilutionRates.seriesC ? Math.max(0, investment.dilutionRates.seriesC * dilutionMultiplier) : undefined,
          ipo: investment.dilutionRates.ipo ? Math.max(0, investment.dilutionRates.ipo * dilutionMultiplier) : undefined
        };
      }

      // 3. Loss Probabilities adjustment  
      if (adjustments.lossProbabilitiesDecrease > 0) {
        const lossMultiplier = 1 - (adjustments.lossProbabilitiesDecrease / 100);
        adjusted.lossProb = {
          preSeed: Math.max(0, investment.lossProb.preSeed * lossMultiplier),
          seed: Math.max(0, investment.lossProb.seed * lossMultiplier),
          seriesA: Math.max(0, investment.lossProb.seriesA * lossMultiplier),
          seriesB: Math.max(0, investment.lossProb.seriesB * lossMultiplier),
          seriesC: Math.max(0, investment.lossProb.seriesC * lossMultiplier),
          ipo: Math.max(0, investment.lossProb.ipo * lossMultiplier)
        };
      }

      // 4. Exit Valuations adjustment
      if (adjustments.exitValuationsIncrease > 0) {
        const multiplier = 1 + (adjustments.exitValuationsIncrease / 100);
        adjusted.exitValuations = {
          preSeed: [
            investment.exitValuations.preSeed[0] * multiplier,
            investment.exitValuations.preSeed[1] * multiplier
          ],
          seed: [
            investment.exitValuations.seed[0] * multiplier,
            investment.exitValuations.seed[1] * multiplier
          ],
          seriesA: [
            investment.exitValuations.seriesA[0] * multiplier,
            investment.exitValuations.seriesA[1] * multiplier
          ],
          seriesB: [
            investment.exitValuations.seriesB[0] * multiplier,
            investment.exitValuations.seriesB[1] * multiplier
          ],
          seriesC: [
            investment.exitValuations.seriesC[0] * multiplier,
            investment.exitValuations.seriesC[1] * multiplier
          ],
          ipo: [
            investment.exitValuations.ipo[0] * multiplier,
            investment.exitValuations.ipo[1] * multiplier
          ]
        };
      }

      return adjusted;
    } catch (error) {
      console.warn('Error applying adjustments to investment:', investment.companyName, error);
      return investment; // Return original if adjustment fails
    }
  });
}

/**
 * Determine if adjustments are realistic (≤20% total)
 */
function isAdjustmentRealistic(adjustments: ParameterAdjustments): boolean {
  const totalAdjustment = adjustments.stageProgressionIncrease + 
                         adjustments.dilutionRatesDecrease + 
                         adjustments.lossProbabilitiesDecrease + 
                         adjustments.exitValuationsIncrease;
  return totalAdjustment <= 20;
}

/**
 * Calculate average parameters across portfolio for comparison
 */
export function calculateAverageParameters(investments: PortfolioInvestment[]) {
  if (!investments.length) return {};

  const totals = investments.reduce((acc, inv) => {
    // Average exit valuations across stages
    const avgExitVal = [
      (inv.exitValuations.preSeed[0] + inv.exitValuations.preSeed[1]) / 2,
      (inv.exitValuations.seed[0] + inv.exitValuations.seed[1]) / 2,
      (inv.exitValuations.seriesA[0] + inv.exitValuations.seriesA[1]) / 2,
      (inv.exitValuations.seriesB[0] + inv.exitValuations.seriesB[1]) / 2,
      (inv.exitValuations.seriesC[0] + inv.exitValuations.seriesC[1]) / 2,
      (inv.exitValuations.ipo[0] + inv.exitValuations.ipo[1]) / 2
    ].reduce((sum, val) => sum + val, 0) / 6;

    // Average progression rates
    const avgProgression = [
      inv.stageProgression.toSeed || 0,
      inv.stageProgression.toSeriesA || 0,
      inv.stageProgression.toSeriesB || 0,
      inv.stageProgression.toSeriesC || 0,
      inv.stageProgression.toIPO || 0
    ].reduce((sum, val) => sum + val, 0) / 5;

    // Average loss probabilities
    const avgLossProb = [
      inv.lossProb.preSeed,
      inv.lossProb.seed,
      inv.lossProb.seriesA,
      inv.lossProb.seriesB,
      inv.lossProb.seriesC,
      inv.lossProb.ipo
    ].reduce((sum, val) => sum + val, 0) / 6;

    // Average dilution rates
    const avgDilution = [
      inv.dilutionRates.seed || 0,
      inv.dilutionRates.seriesA || 0,
      inv.dilutionRates.seriesB || 0,
      inv.dilutionRates.seriesC || 0,
      inv.dilutionRates.ipo || 0
    ].filter(val => val > 0).reduce((sum, val, _, arr) => sum + val / arr.length, 0) || 0;

    return {
      exitValuation: acc.exitValuation + avgExitVal,
      progression: acc.progression + avgProgression,
      lossProb: acc.lossProb + avgLossProb,
      dilution: acc.dilution + avgDilution,
      checkSize: acc.checkSize + inv.checkSize
    };
  }, { exitValuation: 0, progression: 0, lossProb: 0, dilution: 0, checkSize: 0 });

  return {
    exitValuation: totals.exitValuation / investments.length,
    progression: totals.progression / investments.length,
    lossProb: totals.lossProb / investments.length,
    dilution: totals.dilution / investments.length,
    checkSize: totals.checkSize / investments.length
  };
}

/**
 * Get color coding for achievability
 */
export function getAchievabilityColor(scenario: TargetScenario): string {
  if (scenario.isRealistic) return "rgb(46, 125, 50)"; // Green
  if (scenario.achievabilityScore >= 50) return "rgb(255, 183, 77)"; // Yellow
  return "rgb(229, 115, 115)"; // Red
}

/**
 * Get achievability label
 */
export function getAchievabilityLabel(scenario: TargetScenario): string {
  if (scenario.isRealistic) return "Realistic";
  if (scenario.achievabilityScore >= 50) return "Optimistic";
  return "Very Optimistic";
} 
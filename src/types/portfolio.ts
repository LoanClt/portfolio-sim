export type StartupField = 'software' | 'deeptech' | 'biotech' | 'fintech' | 'ecommerce' | 'healthcare' | 'energy' | 'foodtech';

export type StartupRegion = 'US' | 'Europe';

export interface CustomParameterSet {
  id: string;
  name: string;
  description?: string;
  color: string; // Hex color for badge
  icon: string; // Lucide icon name
  createdAt: string;
  
  // Parameter values
  stageProgression: {
    toSeed?: number;
    toSeriesA?: number;
    toSeriesB?: number;
    toSeriesC?: number;
    toIPO?: number;
  };
  
  dilutionRates: {
    seed?: number;
    seriesA?: number;
    seriesB?: number;
    seriesC?: number;
    ipo?: number;
  };
  
  lossProb: {
    preSeed: number;
    seed: number;
    seriesA: number;
    seriesB: number;
    seriesC: number;
    ipo: number;
  };
  
  // Exit valuations by stage [min, max] in $MM
  exitValuations: {
    preSeed: [number, number];
    seed: [number, number];
    seriesA: [number, number];
    seriesB: [number, number];
    seriesC: [number, number];
    ipo: [number, number];
  };
  
  yearsToNext: {
    toSeed?: [number, number];
    toSeriesA?: [number, number];
    toSeriesB?: [number, number];
    toSeriesC?: [number, number];
    toIPO?: [number, number];
  };
}

export interface PortfolioInvestment {
  id: string;
  companyName: string;
  field: StartupField;
  region: StartupRegion;
  entryStage: string;
  entryValuation: number; // in $MM
  checkSize: number; // in $MM
  entryDate: string;
  currentStage: string;
  
  // Parameter configuration
  usePresets: boolean;
  customParameterSetId?: string; // Reference to custom parameter set
  
  // Stage progression probabilities (%)
  stageProgression: {
    toSeed?: number;
    toSeriesA?: number;
    toSeriesB?: number;
    toSeriesC?: number;
    toIPO?: number;
  };
  
  // Dilution per round (%)
  dilutionRates: {
    seed?: number;
    seriesA?: number;
    seriesB?: number;
    seriesC?: number;
    ipo?: number;
  };
  
  // Exit valuations by stage [min, max] in $MM
  exitValuations: {
    preSeed: [number, number];
    seed: [number, number];
    seriesA: [number, number];
    seriesB: [number, number];
    seriesC: [number, number];
    ipo: [number, number];
  };
  
  // Loss probabilities by stage (%)
  lossProb: {
    preSeed: number;
    seed: number;
    seriesA: number;
    seriesB: number;
    seriesC: number;
    ipo: number;
  };
  
  // Years to next stage [min, max]
  yearsToNext: {
    toSeed?: [number, number];
    toSeriesA?: [number, number];
    toSeriesB?: [number, number];
    toSeriesC?: [number, number];
    toIPO?: [number, number];
  };
}

export interface PortfolioSimulationParams {
  numSimulations: number;
  setupFees: number; // in $MM
  managementFees: number; // in $MM per year
  managementFeeYears: number;
  
  // Follow-on investment parameters
  followOnStrategy: {
    enableEarlyFollowOns: boolean;
    earlyFollowOnRate: number; // % of successful companies that get follow-on
    earlyFollowOnMultiple: number; // Multiple of original check size
    enableRecycling: boolean;
    recyclingRate: number; // % of exits that get recycled into new investments
    reserveRatio: number; // % of fund reserved for follow-ons
  };
}

export interface PortfolioSimulationResult {
  investmentId: string;
  companyName: string;
  entryAmount: number; // Total invested including follow-ons
  exitAmount: number;
  exitStage: string;
  moic: number;
  holdingPeriod: number;
  initialOwnership: number;
  finalOwnership: number;
  followOnInvestments?: { stage: string; amount: number; equity: number }[];
}

export interface PortfolioResults {
  simulations: PortfolioSimulationResult[][];
  avgMOIC: number;
  avgIRR: number;
  avgDistributed: number;
  totalPaidIn: number;
  successRate: number;
  totalRecycledCapital?: number;
  avgTotalInvested?: number;
}

// New interfaces for Sensitivity Analysis
export interface ParameterAdjustments {
  stageProgressionIncrease: number; // % increase in stage progression rates
  dilutionRatesDecrease: number; // % decrease in dilution rates  
  lossProbabilitiesDecrease: number; // % decrease in loss probabilities
  exitValuationsIncrease: number; // % increase in exit valuations
}

// New interfaces for enhanced sensitivity analysis
export interface SingleParameterResult {
  parameterType: 'stageProgression' | 'dilutionRates' | 'lossProbabilities' | 'exitValuations';
  adjustmentPercent: number;
  achievable: boolean;
  results: PortfolioResults | null;
  actualRequirement?: number; // The actual percentage needed (might exceed bounds)
  boundViolations?: string[]; // Descriptions of bound violations if not achievable
}

export interface AchievabilityFactor {
  name: string;
  score: number;
  weight: number;
  explanation: string;
}

export interface EnhancedAchievabilityScore {
  score: number;
  explanation: string;
  factors: AchievabilityFactor[];
}

export interface MixedParameterOption {
  name: string;
  description: string;
  adjustments: ParameterAdjustments;
  results: PortfolioResults;
  totalAdjustment: number; // Sum of all adjustments for ranking
  approachType: 'balanced' | 'exit-focused' | 'success-focused' | 'conservative' | 'aggressive';
}

export interface TargetScenario {
  targetMOIC: number;
  requiredAdjustments: ParameterAdjustments;
  adjustedResults: PortfolioResults;
  achievabilityScore: number; // 0-100
  isRealistic: boolean; // true if adjustments <= 20%
  enhancedAchievability: EnhancedAchievabilityScore;
  singleParameterOptions: SingleParameterResult[];
  mixedParameterOption: ParameterAdjustments | null;
  mixedParameterOptions?: MixedParameterOption[]; // Multiple optimal solutions
}

export interface SensitivityAnalysis {
  baselineResults: PortfolioResults;
  targetScenarios: TargetScenario[];
  baselineMOIC: number;
  targetMOICs: number[]; // e.g., [2, 3, 4, 5, 6, 7, 8, 9, 10]
}

export interface SensitivityAnalysisParams {
  investments: PortfolioInvestment[];
  simulationParams: PortfolioSimulationParams;
  baselineResults?: PortfolioResults; // Use existing results as baseline
  maxAdjustmentPercent?: number; // default 50%
  stepSize?: number; // default 5%
}

export interface StartupFieldPresets {
  stageProgression: {
    toSeed: number;
    toSeriesA: number;
    toSeriesB: number;
    toSeriesC: number;
    toIPO: number;
  };
  dilutionRates: {
    seed: number;
    seriesA: number;
    seriesB: number;
    seriesC: number;
    ipo: number;
  };
  lossProb: {
    preSeed: number;
    seed: number;
    seriesA: number;
    seriesB: number;
    seriesC: number;
    ipo: number;
  };
}

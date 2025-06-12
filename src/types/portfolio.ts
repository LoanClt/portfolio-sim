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

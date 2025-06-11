
export interface SimulationParams {
  fundSize: number;
  initialStage: string;
  managementFeePct: number;
  managementFeeYears: number;
  deploymentYears: number;
  numSimulations: number;
  stageAllocations: Record<string, number>;
  valuations: Record<string, [number, number]>;
  checkSizes: Record<string, [number, number]>;
  probAdvancement: Record<string, number>;
  yearsToNext: Record<string, [number, number]>;
  dilution: Record<string, [number, number]>;
  exitValuations: Record<string, [number, number]>;
  zeroProbabilities: Record<string, number>;
}

export interface Investment {
  entryStage: string;
  entryAmount: number;
  exitStage: string;
  exitAmount: number;
  deploymentYear: number;
}

export interface SimulationResult {
  investments: Investment[];
  paidIn: number;
  distributed: number;
  moic: number;
  irr: number;
}

export interface SimulationResults {
  simulations: SimulationResult[];
  avgPaidIn: number;
  avgDistributed: number;
  avgMOIC: number;
  avgIRR: number;
  avgInvestments: number;
  avgMgmtFees: number;
  sampleSimulation: Investment[];
}

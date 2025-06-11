
import type { SimulationParams, Investment, SimulationResult, SimulationResults } from '@/types/simulation';

const stages = ['Pre-Seed', 'Seed', 'Series A', 'Series B', 'Series C', 'IPO'];

function randomBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function calculateIRR(cashFlows: number[]): number {
  if (cashFlows.length < 2) return 0;
  
  // Simple IRR approximation using Newton-Raphson method
  let rate = 0.1;
  for (let i = 0; i < 100; i++) {
    let npv = 0;
    let dnpv = 0;
    
    for (let j = 0; j < cashFlows.length; j++) {
      npv += cashFlows[j] / Math.pow(1 + rate, j);
      dnpv -= j * cashFlows[j] / Math.pow(1 + rate, j + 1);
    }
    
    if (Math.abs(npv) < 0.001) break;
    if (dnpv === 0) break;
    
    rate = rate - npv / dnpv;
  }
  
  return isNaN(rate) ? 0 : rate * 100;
}

function simulatePortfolio(params: SimulationParams): Investment[] {
  const investments: Investment[] = [];
  const totalMgmtFee = params.fundSize * (params.managementFeePct / 100) * params.managementFeeYears;
  const deployableCapital = params.fundSize - totalMgmtFee;
  
  const validStages = stages.slice(stages.indexOf(params.initialStage), 4);
  
  for (const stage of validStages) {
    const allocationAmount = (params.stageAllocations[stage] / 100) * deployableCapital;
    let deployedInStage = 0;
    
    while (deployedInStage < allocationAmount) {
      const valuation = randomBetween(...params.valuations[stage]);
      let checkSize = randomBetween(...params.checkSizes[stage]);
      checkSize = Math.min(checkSize, allocationAmount - deployedInStage);
      deployedInStage += checkSize;
      
      let equity = checkSize / valuation;
      let currentStage = stage;
      
      // Stage progression
      const stageSequence = stages.slice(stages.indexOf(stage));
      for (let i = 0; i < stageSequence.length - 1; i++) {
        const fromStage = stageSequence[i];
        const toStage = stageSequence[i + 1];
        const key = `${fromStage} to ${toStage}`;
        
        if (Math.random() * 100 <= (params.probAdvancement[key] || 0)) {
          const dilutionPct = randomBetween(...(params.dilution[key] || [0, 0])) / 100;
          equity *= (1 - dilutionPct);
          currentStage = toStage;
        } else {
          break;
        }
      }
      
      // Calculate exit
      let exitAmount = 0;
      if (Math.random() * 100 > (params.zeroProbabilities[currentStage] || 0)) {
        const exitValuation = randomBetween(...params.exitValuations[currentStage]);
        exitAmount = equity * exitValuation;
      }
      
      investments.push({
        entryStage: stage,
        entryAmount: checkSize,
        exitStage: currentStage,
        exitAmount,
        deploymentYear: Math.floor(Math.random() * params.deploymentYears)
      });
    }
  }
  
  return investments;
}

export function runSimulation(params: SimulationParams): SimulationResult[] {
  const results: SimulationResult[] = [];
  
  for (let i = 0; i < params.numSimulations; i++) {
    const investments = simulatePortfolio(params);
    const paidIn = investments.reduce((sum, inv) => sum + inv.entryAmount, 0);
    const distributed = investments.reduce((sum, inv) => sum + inv.exitAmount, 0);
    const moic = paidIn > 0 ? distributed / paidIn : 0;
    
    // Calculate IRR
    const cashFlowsByYear: Record<number, number> = {};
    
    // Add management fees
    for (let year = 0; year < params.managementFeeYears; year++) {
      const fee = params.fundSize * (params.managementFeePct / 100);
      cashFlowsByYear[year] = (cashFlowsByYear[year] || 0) - fee;
    }
    
    // Add investment cash flows
    investments.forEach(inv => {
      const deployYear = inv.deploymentYear;
      cashFlowsByYear[deployYear] = (cashFlowsByYear[deployYear] || 0) - inv.entryAmount;
      
      // Calculate holding period
      const entryIndex = stages.indexOf(inv.entryStage);
      const exitIndex = stages.indexOf(inv.exitStage);
      let holdYears = 0;
      
      for (let j = entryIndex; j < exitIndex; j++) {
        const key = `${stages[j]} to ${stages[j + 1]}`;
        const yearRange = params.yearsToNext[key] || [1, 1];
        holdYears += randomBetween(yearRange[0], yearRange[1]);
      }
      
      const exitYear = deployYear + Math.ceil(holdYears);
      cashFlowsByYear[exitYear] = (cashFlowsByYear[exitYear] || 0) + inv.exitAmount;
    });
    
    const maxYear = Math.max(...Object.keys(cashFlowsByYear).map(Number));
    const cashFlows = Array.from({ length: maxYear + 1 }, (_, year) => 
      cashFlowsByYear[year] || 0
    );
    
    const irr = calculateIRR(cashFlows);
    
    results.push({
      investments,
      paidIn,
      distributed,
      moic,
      irr
    });
  }
  
  return results;
}

export function calculateFundMetrics(results: SimulationResult[], params: SimulationParams): SimulationResults {
  const avgPaidIn = results.reduce((sum, r) => sum + r.paidIn, 0) / results.length;
  const avgDistributed = results.reduce((sum, r) => sum + r.distributed, 0) / results.length;
  const avgMOIC = results.reduce((sum, r) => sum + r.moic, 0) / results.length;
  const avgIRR = results.reduce((sum, r) => sum + r.irr, 0) / results.length;
  const avgInvestments = results.reduce((sum, r) => sum + r.investments.length, 0) / results.length;
  const avgMgmtFees = params.fundSize * (params.managementFeePct / 100) * params.managementFeeYears;
  
  return {
    simulations: results,
    avgPaidIn,
    avgDistributed,
    avgMOIC,
    avgIRR,
    avgInvestments,
    avgMgmtFees,
    sampleSimulation: results[0]?.investments || []
  };
}

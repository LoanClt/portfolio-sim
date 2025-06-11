import type { PortfolioInvestment, PortfolioSimulationParams, PortfolioSimulationResult, PortfolioResults } from '@/types/portfolio';

function randomBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function calculateIRR(cashFlows: number[]): number {
  if (cashFlows.length < 2) return 0;
  
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

function simulateInvestment(investment: PortfolioInvestment): PortfolioSimulationResult {
  const stages = ['Pre-Seed', 'Seed', 'Series A', 'Series B', 'Series C', 'IPO'];
  const stageIndex = stages.indexOf(investment.entryStage);
  
  let currentStage = investment.entryStage;
  let equity = investment.checkSize / investment.entryValuation;
  const initialOwnership = equity * 100; // Convert to percentage
  let holdingPeriod = 0;
  let totalInvested = investment.checkSize; // Track total invested including follow-ons
  let followOnInvestments: { stage: string; amount: number; equity: number }[] = [];
  
  // Simulate stage progression
  for (let i = stageIndex; i < stages.length - 1; i++) {
    const currentStageName = stages[i];
    const nextStageName = stages[i + 1];
    
    // Get progression probability
    let progressionProb = 0;
    switch (nextStageName) {
      case 'Seed':
        progressionProb = investment.stageProgression.toSeed || 0;
        break;
      case 'Series A':
        progressionProb = investment.stageProgression.toSeriesA || 0;
        break;
      case 'Series B':
        progressionProb = investment.stageProgression.toSeriesB || 0;
        break;
      case 'Series C':
        progressionProb = investment.stageProgression.toSeriesC || 0;
        break;
      case 'IPO':
        progressionProb = investment.stageProgression.toIPO || 0;
        break;
    }
    
    // Check if progresses to next stage
    if (Math.random() * 100 <= progressionProb) {
      // Apply dilution
      let dilution = 0;
      switch (nextStageName) {
        case 'Seed':
          dilution = investment.dilutionRates.seed || 0;
          break;
        case 'Series A':
          dilution = investment.dilutionRates.seriesA || 0;
          break;
        case 'Series B':
          dilution = investment.dilutionRates.seriesB || 0;
          break;
        case 'Series C':
          dilution = investment.dilutionRates.seriesC || 0;
          break;
        case 'IPO':
          dilution = investment.dilutionRates.ipo || 0;
          break;
      }
      
      equity *= (1 - dilution / 100);
      currentStage = nextStageName;
      
      // Add time to next stage
      let timeRange = [1, 2]; // default
      switch (nextStageName) {
        case 'Seed':
          timeRange = investment.yearsToNext.toSeed || [1, 2];
          break;
        case 'Series A':
          timeRange = investment.yearsToNext.toSeriesA || [1, 3];
          break;
        case 'Series B':
          timeRange = investment.yearsToNext.toSeriesB || [1, 3];
          break;
        case 'Series C':
          timeRange = investment.yearsToNext.toSeriesC || [1, 3];
          break;
        case 'IPO':
          timeRange = investment.yearsToNext.toIPO || [1, 2];
          break;
      }
      
      holdingPeriod += randomBetween(timeRange[0], timeRange[1]);
    } else {
      break; // Stops progressing
    }
  }
  
  // Ensure minimum holding period even if company doesn't progress
  if (holdingPeriod === 0) {
    // Add minimum exit holding period based on current stage
    let minHoldingPeriod = [1, 3]; // default minimum
    switch (currentStage) {
      case 'Pre-Seed':
        minHoldingPeriod = [1, 3];
        break;
      case 'Seed':
        minHoldingPeriod = [1, 4];
        break;
      case 'Series A':
        minHoldingPeriod = [2, 5];
        break;
      case 'Series B':
        minHoldingPeriod = [2, 6];
        break;
      case 'Series C':
        minHoldingPeriod = [3, 7];
        break;
      case 'IPO':
        minHoldingPeriod = [1, 2];
        break;
    }
    holdingPeriod = randomBetween(minHoldingPeriod[0], minHoldingPeriod[1]);
  }

  const finalOwnership = equity * 100; // Convert to percentage
  
  // Calculate exit value
  let exitAmount = 0;
  
  // Check for total loss
  let lossProb = 0;
  switch (currentStage) {
    case 'Pre-Seed':
      lossProb = investment.lossProb.preSeed;
      break;
    case 'Seed':
      lossProb = investment.lossProb.seed;
      break;
    case 'Series A':
      lossProb = investment.lossProb.seriesA;
      break;
    case 'Series B':
      lossProb = investment.lossProb.seriesB;
      break;
    case 'Series C':
      lossProb = investment.lossProb.seriesC;
      break;
    case 'IPO':
      lossProb = investment.lossProb.ipo;
      break;
  }
  
  if (Math.random() * 100 > lossProb) {
    // Get exit valuation range
    let exitValRange = [0, 0];
    switch (currentStage) {
      case 'Pre-Seed':
        exitValRange = investment.exitValuations.preSeed;
        break;
      case 'Seed':
        exitValRange = investment.exitValuations.seed;
        break;
      case 'Series A':
        exitValRange = investment.exitValuations.seriesA;
        break;
      case 'Series B':
        exitValRange = investment.exitValuations.seriesB;
        break;
      case 'Series C':
        exitValRange = investment.exitValuations.seriesC;
        break;
      case 'IPO':
        exitValRange = investment.exitValuations.ipo;
        break;
    }
    
    const exitValuation = randomBetween(exitValRange[0], exitValRange[1]);
    exitAmount = equity * exitValuation;
  }
  
  return {
    investmentId: investment.id,
    companyName: investment.companyName,
    entryAmount: totalInvested,
    exitAmount,
    exitStage: currentStage,
    moic: exitAmount / totalInvested,
    holdingPeriod,
    initialOwnership,
    finalOwnership,
    followOnInvestments
  };
}

function simulateInvestmentWithFollowOns(
  investment: PortfolioInvestment, 
  followOnStrategy: PortfolioSimulationParams['followOnStrategy']
): PortfolioSimulationResult {
  const stages = ['Pre-Seed', 'Seed', 'Series A', 'Series B', 'Series C', 'IPO'];
  const stageIndex = stages.indexOf(investment.entryStage);
  
  let currentStage = investment.entryStage;
  let equity = investment.checkSize / investment.entryValuation;
  const initialOwnership = equity * 100;
  let holdingPeriod = 0;
  let totalInvested = investment.checkSize;
  let followOnInvestments: { stage: string; amount: number; equity: number }[] = [];
  
  // Simulate stage progression with follow-on opportunities
  for (let i = stageIndex; i < stages.length - 1; i++) {
    const currentStageName = stages[i];
    const nextStageName = stages[i + 1];
    
    // Get progression probability
    let progressionProb = 0;
    switch (nextStageName) {
      case 'Seed':
        progressionProb = investment.stageProgression.toSeed || 0;
        break;
      case 'Series A':
        progressionProb = investment.stageProgression.toSeriesA || 0;
        break;
      case 'Series B':
        progressionProb = investment.stageProgression.toSeriesB || 0;
        break;
      case 'Series C':
        progressionProb = investment.stageProgression.toSeriesC || 0;
        break;
      case 'IPO':
        progressionProb = investment.stageProgression.toIPO || 0;
        break;
    }
    
    // Check if progresses to next stage
    if (Math.random() * 100 <= progressionProb) {
      // Check for early follow-on investment opportunity
      if (followOnStrategy.enableEarlyFollowOns && 
          Math.random() * 100 <= followOnStrategy.earlyFollowOnRate &&
          nextStageName !== 'IPO') {
        
        const followOnAmount = investment.checkSize * followOnStrategy.earlyFollowOnMultiple;
        
        // Calculate follow-on equity (simplified - assumes same valuation increase logic)
        // More realistic valuation increases by stage
        let valuationMultiplier = 1.5; // Default conservative increase
        switch (nextStageName) {
          case 'Seed':
            valuationMultiplier = 1.5 + Math.random() * 1.5; // 1.5-3x
            break;
          case 'Series A':
            valuationMultiplier = 2 + Math.random() * 2; // 2-4x
            break;
          case 'Series B':
            valuationMultiplier = 1.5 + Math.random() * 2.5; // 1.5-4x
            break;
          case 'Series C':
            valuationMultiplier = 1.5 + Math.random() * 1.5; // 1.5-3x
            break;
        }
        
        const estimatedNextValuation = investment.entryValuation * valuationMultiplier;
        const followOnEquity = followOnAmount / estimatedNextValuation;
        
        equity += followOnEquity;
        totalInvested += followOnAmount;
        
        followOnInvestments.push({
          stage: nextStageName,
          amount: followOnAmount,
          equity: followOnEquity
        });
      }
      
      // Apply dilution
      let dilution = 0;
      switch (nextStageName) {
        case 'Seed':
          dilution = investment.dilutionRates.seed || 0;
          break;
        case 'Series A':
          dilution = investment.dilutionRates.seriesA || 0;
          break;
        case 'Series B':
          dilution = investment.dilutionRates.seriesB || 0;
          break;
        case 'Series C':
          dilution = investment.dilutionRates.seriesC || 0;
          break;
        case 'IPO':
          dilution = investment.dilutionRates.ipo || 0;
          break;
      }
      
      equity *= (1 - dilution / 100);
      currentStage = nextStageName;
      
      // Add time to next stage
      let timeRange = [1, 2];
      switch (nextStageName) {
        case 'Seed':
          timeRange = investment.yearsToNext.toSeed || [1, 2];
          break;
        case 'Series A':
          timeRange = investment.yearsToNext.toSeriesA || [1, 3];
          break;
        case 'Series B':
          timeRange = investment.yearsToNext.toSeriesB || [1, 3];
          break;
        case 'Series C':
          timeRange = investment.yearsToNext.toSeriesC || [1, 3];
          break;
        case 'IPO':
          timeRange = investment.yearsToNext.toIPO || [1, 2];
          break;
      }
      
      holdingPeriod += randomBetween(timeRange[0], timeRange[1]);
    } else {
      break;
    }
  }
  
  // Ensure minimum holding period even if company doesn't progress
  if (holdingPeriod === 0) {
    // Add minimum exit holding period based on current stage
    let minHoldingPeriod = [1, 3]; // default minimum
    switch (currentStage) {
      case 'Pre-Seed':
        minHoldingPeriod = [1, 3];
        break;
      case 'Seed':
        minHoldingPeriod = [1, 4];
        break;
      case 'Series A':
        minHoldingPeriod = [2, 5];
        break;
      case 'Series B':
        minHoldingPeriod = [2, 6];
        break;
      case 'Series C':
        minHoldingPeriod = [3, 7];
        break;
      case 'IPO':
        minHoldingPeriod = [1, 2];
        break;
    }
    holdingPeriod = randomBetween(minHoldingPeriod[0], minHoldingPeriod[1]);
  }

  const finalOwnership = equity * 100;
  
  // Calculate exit value
  let exitAmount = 0;
  
  // Check for total loss
  let lossProb = 0;
  switch (currentStage) {
    case 'Pre-Seed':
      lossProb = investment.lossProb.preSeed;
      break;
    case 'Seed':
      lossProb = investment.lossProb.seed;
      break;
    case 'Series A':
      lossProb = investment.lossProb.seriesA;
      break;
    case 'Series B':
      lossProb = investment.lossProb.seriesB;
      break;
    case 'Series C':
      lossProb = investment.lossProb.seriesC;
      break;
    case 'IPO':
      lossProb = investment.lossProb.ipo;
      break;
  }
  
  if (Math.random() * 100 > lossProb) {
    let exitValRange = [0, 0];
    switch (currentStage) {
      case 'Pre-Seed':
        exitValRange = investment.exitValuations.preSeed;
        break;
      case 'Seed':
        exitValRange = investment.exitValuations.seed;
        break;
      case 'Series A':
        exitValRange = investment.exitValuations.seriesA;
        break;
      case 'Series B':
        exitValRange = investment.exitValuations.seriesB;
        break;
      case 'Series C':
        exitValRange = investment.exitValuations.seriesC;
        break;
      case 'IPO':
        exitValRange = investment.exitValuations.ipo;
        break;
    }
    
    const exitValuation = randomBetween(exitValRange[0], exitValRange[1]);
    exitAmount = equity * exitValuation;
  }
  
  return {
    investmentId: investment.id,
    companyName: investment.companyName,
    entryAmount: totalInvested,
    exitAmount,
    exitStage: currentStage,
    moic: exitAmount / totalInvested,
    holdingPeriod,
    initialOwnership,
    finalOwnership,
    followOnInvestments
  };
}

export function runPortfolioSimulation(
  investments: PortfolioInvestment[],
  params: PortfolioSimulationParams
): PortfolioResults {
  const allSimulations: PortfolioSimulationResult[][] = [];
  
  // Calculate fund size with follow-on reserves
  const initialInvestments = investments.reduce((sum, inv) => sum + inv.checkSize, 0);
  const totalFees = params.setupFees + (params.managementFees * params.managementFeeYears);
  const followOnReserve = initialInvestments * (params.followOnStrategy.reserveRatio / 100);
  const totalFundSize = initialInvestments + totalFees + followOnReserve;
  
  for (let i = 0; i < params.numSimulations; i++) {
    const simulationResults = investments.map(inv => 
      params.followOnStrategy.enableEarlyFollowOns
        ? simulateInvestmentWithFollowOns(inv, params.followOnStrategy)
        : simulateInvestment(inv)
    );
    
    allSimulations.push(simulationResults);
  }
  
  // Calculate metrics
  const avgTotalInvested = allSimulations.reduce((sum, sim) => {
    return sum + sim.reduce((simSum, result) => simSum + result.entryAmount, 0);
  }, 0) / params.numSimulations;
  
  const avgDistributed = allSimulations.reduce((sum, sim) => {
    return sum + sim.reduce((simSum, result) => simSum + result.exitAmount, 0);
  }, 0) / params.numSimulations;
  
  const avgMOIC = avgDistributed / avgTotalInvested;
  
  // Calculate IRR (simplified)
  const cashFlows = [-avgTotalInvested, avgDistributed];
  const avgIRR = calculateIRR(cashFlows);
  
  // Calculate success rate (investments that returned > 1x)
  const successfulSims = allSimulations.filter(sim => 
    sim.some(result => result.moic > 1)
  ).length;
  const successRate = (successfulSims / params.numSimulations) * 100;
  
  return {
    simulations: allSimulations,
    avgMOIC,
    avgIRR,
    avgDistributed,
    totalPaidIn: totalFundSize, // Include fees and reserves in display
    successRate,
    avgTotalInvested
  };
}

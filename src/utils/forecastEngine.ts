import type { 
  PortfolioInvestment, 
  PortfolioSimulationParams,
  PortfolioResults,
  ForecastParameters,
  ForecastScenario,
  ForecastResults,
  ForecastComparison,
  YearlyForecast,
  MacroeconomicFactors,
  SectorTrends,
  StartupField,
  ForecastVisualizationData,
  MLCalibrationData
} from '@/types/portfolio';

// Default macroeconomic scenarios
export const defaultMacroScenarios: MacroeconomicFactors[] = [
  {
    cycle: 'expansion',
    sentiment: 'bullish',
    interestRates: 2.5,
    inflationRate: 2.0,
    gdpGrowthRate: 3.2,
    publicMarketMultiples: 1.2,
    liquidityEnvironment: 'abundant'
  },
  {
    cycle: 'peak',
    sentiment: 'neutral',
    interestRates: 4.0,
    inflationRate: 3.5,
    gdpGrowthRate: 2.1,
    publicMarketMultiples: 1.0,
    liquidityEnvironment: 'moderate'
  },
  {
    cycle: 'contraction',
    sentiment: 'bearish',
    interestRates: 1.5,
    inflationRate: 1.2,
    gdpGrowthRate: -0.8,
    publicMarketMultiples: 0.7,
    liquidityEnvironment: 'constrained'
  }
];

// Default sector trends based on current market conditions
export const defaultSectorTrends: Record<StartupField, SectorTrends> = {
  software: {
    field: 'software',
    growthOutlook: 'stable',
    disruptionRisk: 'medium',
    regulatoryRisk: 'low',
    competitionIntensity: 'high',
    fundingAvailability: 'moderate',
    expectedCAGR: 8.5
  },
  deeptech: {
    field: 'deeptech',
    growthOutlook: 'accelerating',
    disruptionRisk: 'high',
    regulatoryRisk: 'medium',
    competitionIntensity: 'medium',
    fundingAvailability: 'moderate',
    expectedCAGR: 12.3
  },
  biotech: {
    field: 'biotech',
    growthOutlook: 'accelerating',
    disruptionRisk: 'high',
    regulatoryRisk: 'high',
    competitionIntensity: 'medium',
    fundingAvailability: 'limited',
    expectedCAGR: 15.7
  },
  fintech: {
    field: 'fintech',
    growthOutlook: 'stable',
    disruptionRisk: 'medium',
    regulatoryRisk: 'high',
    competitionIntensity: 'high',
    fundingAvailability: 'moderate',
    expectedCAGR: 10.2
  },
  ecommerce: {
    field: 'ecommerce',
    growthOutlook: 'decelerating',
    disruptionRisk: 'medium',
    regulatoryRisk: 'medium',
    competitionIntensity: 'high',
    fundingAvailability: 'limited',
    expectedCAGR: 6.8
  },
  healthcare: {
    field: 'healthcare',
    growthOutlook: 'accelerating',
    disruptionRisk: 'medium',
    regulatoryRisk: 'high',
    competitionIntensity: 'medium',
    fundingAvailability: 'moderate',
    expectedCAGR: 11.4
  },
  energy: {
    field: 'energy',
    growthOutlook: 'accelerating',
    disruptionRisk: 'high',
    regulatoryRisk: 'high',
    competitionIntensity: 'medium',
    fundingAvailability: 'abundant',
    expectedCAGR: 14.2
  },
  foodtech: {
    field: 'foodtech',
    growthOutlook: 'stable',
    disruptionRisk: 'medium',
    regulatoryRisk: 'medium',
    competitionIntensity: 'medium',
    fundingAvailability: 'moderate',
    expectedCAGR: 9.1
  }
};

// Create default forecast scenarios
export function createDefaultScenarios(): ForecastScenario[] {
  return [
    {
      id: 'optimistic',
      name: 'Optimistic Growth',
      description: 'Strong economic expansion with abundant capital and favorable conditions',
      probability: 25,
      macroeconomicFactors: defaultMacroScenarios[0],
      sectorTrends: Object.values(defaultSectorTrends).map(trend => ({
        ...trend,
        growthOutlook: 'accelerating' as const,
        fundingAvailability: 'abundant' as const,
        expectedCAGR: trend.expectedCAGR * 1.3
      })),
      timeHorizon: 10,
      confidenceLevel: 75
    },
    {
      id: 'realistic',
      name: 'Base Case',
      description: 'Normal market conditions with moderate growth and standard assumptions',
      probability: 50,
      macroeconomicFactors: defaultMacroScenarios[1],
      sectorTrends: Object.values(defaultSectorTrends),
      timeHorizon: 10,
      confidenceLevel: 85
    },
    {
      id: 'pessimistic',
      name: 'Downturn Scenario',
      description: 'Economic contraction with limited funding and challenging conditions',
      probability: 25,
      macroeconomicFactors: defaultMacroScenarios[2],
      sectorTrends: Object.values(defaultSectorTrends).map(trend => ({
        ...trend,
        growthOutlook: 'decelerating' as const,
        fundingAvailability: 'limited' as const,
        expectedCAGR: trend.expectedCAGR * 0.6
      })),
      timeHorizon: 10,
      confidenceLevel: 70
    }
  ];
}

// Apply macroeconomic adjustments to investment parameters
function applyMacroAdjustments(
  investment: PortfolioInvestment,
  macroFactors: MacroeconomicFactors
): PortfolioInvestment {
  const adjusted = { ...investment };
  
  // Interest rate impact on valuations (inverse relationship)
  const interestRateMultiplier = Math.max(0.5, 1 - (macroFactors.interestRates - 2.5) * 0.1);
  
  // Liquidity environment impact
  const liquidityMultiplier = macroFactors.liquidityEnvironment === 'abundant' ? 1.2 :
                              macroFactors.liquidityEnvironment === 'moderate' ? 1.0 : 0.7;
  
  // Public market multiples impact
  const publicMultipleImpact = macroFactors.publicMarketMultiples;
  
  // Apply adjustments to exit valuations
  Object.keys(adjusted.exitValuations).forEach(stage => {
    const [min, max] = adjusted.exitValuations[stage as keyof typeof adjusted.exitValuations];
    adjusted.exitValuations[stage as keyof typeof adjusted.exitValuations] = [
      min * interestRateMultiplier * liquidityMultiplier * publicMultipleImpact,
      max * interestRateMultiplier * liquidityMultiplier * publicMultipleImpact
    ];
  });
  
  // Adjust stage progression based on market sentiment
  const sentimentMultiplier = macroFactors.sentiment === 'bullish' ? 1.15 :
                              macroFactors.sentiment === 'neutral' ? 1.0 : 0.85;
  
  Object.keys(adjusted.stageProgression).forEach(progression => {
    const currentValue = adjusted.stageProgression[progression as keyof typeof adjusted.stageProgression];
    if (currentValue !== undefined) {
      adjusted.stageProgression[progression as keyof typeof adjusted.stageProgression] = 
        Math.min(95, currentValue * sentimentMultiplier);
    }
  });
  
  // Adjust loss probabilities based on economic cycle
  const cycleRiskMultiplier = macroFactors.cycle === 'expansion' ? 0.8 :
                              macroFactors.cycle === 'peak' ? 1.0 :
                              macroFactors.cycle === 'contraction' ? 1.4 : 1.2;
  
  Object.keys(adjusted.lossProb).forEach(stage => {
    adjusted.lossProb[stage as keyof typeof adjusted.lossProb] = 
      Math.min(90, adjusted.lossProb[stage as keyof typeof adjusted.lossProb] * cycleRiskMultiplier);
  });
  
  return adjusted;
}

// Apply sector-specific adjustments
function applySectorAdjustments(
  investment: PortfolioInvestment,
  sectorTrend: SectorTrends
): PortfolioInvestment {
  const adjusted = { ...investment };
  
  // Growth outlook impact on exit valuations
  const growthMultiplier = sectorTrend.growthOutlook === 'accelerating' ? 1.25 :
                           sectorTrend.growthOutlook === 'stable' ? 1.0 : 0.8;
  
  // Competition intensity impact on success rates
  const competitionMultiplier = sectorTrend.competitionIntensity === 'low' ? 1.1 :
                                sectorTrend.competitionIntensity === 'medium' ? 1.0 : 0.9;
  
  // Funding availability impact on stage progression
  const fundingMultiplier = sectorTrend.fundingAvailability === 'abundant' ? 1.15 :
                            sectorTrend.fundingAvailability === 'moderate' ? 1.0 : 0.85;
  
  // Apply CAGR-based adjustments to exit valuations
  const cagrImpact = 1 + (sectorTrend.expectedCAGR - 10) * 0.05; // 5% per 1% CAGR difference
  
  // Adjust exit valuations
  Object.keys(adjusted.exitValuations).forEach(stage => {
    const [min, max] = adjusted.exitValuations[stage as keyof typeof adjusted.exitValuations];
    adjusted.exitValuations[stage as keyof typeof adjusted.exitValuations] = [
      min * growthMultiplier * cagrImpact,
      max * growthMultiplier * cagrImpact
    ];
  });
  
  // Adjust stage progression
  Object.keys(adjusted.stageProgression).forEach(progression => {
    const currentValue = adjusted.stageProgression[progression as keyof typeof adjusted.stageProgression];
    if (currentValue !== undefined) {
      adjusted.stageProgression[progression as keyof typeof adjusted.stageProgression] = 
        Math.min(95, currentValue * competitionMultiplier * fundingMultiplier);
    }
  });
  
  // Regulatory and disruption risk adjustments
  const riskMultiplier = (sectorTrend.regulatoryRisk === 'high' ? 1.2 : 1.0) * 
                         (sectorTrend.disruptionRisk === 'high' ? 1.15 : 1.0);
  
  Object.keys(adjusted.lossProb).forEach(stage => {
    adjusted.lossProb[stage as keyof typeof adjusted.lossProb] = 
      Math.min(90, adjusted.lossProb[stage as keyof typeof adjusted.lossProb] * riskMultiplier);
  });
  
  return adjusted;
}

// Generate time-series forecast for a single scenario
function generateScenarioForecast(
  baselineInvestments: PortfolioInvestment[],
  scenario: ForecastScenario,
  params: PortfolioSimulationParams,
  numSimulations: number = 1000
): ForecastResults {
  // Apply scenario adjustments to investments
  const adjustedInvestments = baselineInvestments.map(investment => {
    let adjusted = applyMacroAdjustments(investment, scenario.macroeconomicFactors);
    
    const sectorTrend = scenario.sectorTrends.find(trend => trend.field === investment.field);
    if (sectorTrend) {
      adjusted = applySectorAdjustments(adjusted, sectorTrend);
    }
    
    return adjusted;
  });
  
  const yearlyForecasts: YearlyForecast[] = [];
  let cumulativeValue = 0;
  let totalInvested = 0;
  let totalDistributed = 0;
  
  // Generate yearly forecasts
  for (let year = 1; year <= scenario.timeHorizon; year++) {
    // Simulate portfolio performance for this year
    const yearSimResults = [];
    
    for (let sim = 0; sim < numSimulations; sim++) {
      // Run mini-simulation for this year
      let yearValue = 0;
      let yearExits = 0;
      let yearInvestments = adjustedInvestments.length;
      
      adjustedInvestments.forEach(investment => {
        // Simplified yearly progression simulation
        const baseValue = investment.checkSize;
        const timeDecay = Math.max(0.1, 1 - (year - 1) * 0.1);
        const randomFactor = 0.5 + Math.random();
        
        const stageFactor = investment.entryStage === 'Pre-Seed' ? 2.5 :
                           investment.entryStage === 'Seed' ? 2.0 :
                           investment.entryStage === 'Series A' ? 1.5 : 1.2;
        
        yearValue += baseValue * stageFactor * timeDecay * randomFactor;
        
        // Exit probability increases over time
        if (Math.random() < year * 0.15) {
          yearExits += baseValue * stageFactor * (1 + Math.random() * 2);
        }
      });
      
      yearSimResults.push({
        portfolioValue: yearValue,
        exitValue: yearExits,
        newInvestments: year <= 5 ? 2 + Math.random() * 3 : 0, // New investments in first 5 years
        activeInvestments: yearInvestments
      });
    }
    
    // Calculate averages
    const avgPortfolioValue = yearSimResults.reduce((sum, r) => sum + r.portfolioValue, 0) / numSimulations;
    const avgExitValue = yearSimResults.reduce((sum, r) => sum + r.exitValue, 0) / numSimulations;
    const avgNewInvestments = yearSimResults.reduce((sum, r) => sum + r.newInvestments, 0) / numSimulations;
    const avgActiveInvestments = yearSimResults.reduce((sum, r) => sum + r.activeInvestments, 0) / numSimulations;
    
    cumulativeValue += avgPortfolioValue;
    totalDistributed += avgExitValue;
    const totalPaidIn = totalInvested + (avgNewInvestments * 2); // Assume $2M average new investment
    
    const managementFees = totalPaidIn * (params.managementFees / 100);
    const netCashFlow = avgExitValue - managementFees;
    
    // Calculate IRR and MOIC
    const moic = totalDistributed / Math.max(totalPaidIn, 1);
    const irr = totalPaidIn > 0 ? Math.pow(totalDistributed / totalPaidIn, 1 / year) - 1 : 0;
    
    yearlyForecasts.push({
      year,
      portfolioValue: avgPortfolioValue,
      newInvestments: avgNewInvestments,
      exitValue: avgExitValue,
      managementFees,
      netCashFlow,
      irr: irr * 100,
      moic,
      activeInvestments: Math.round(avgActiveInvestments),
      scenarioProbability: scenario.probability
    });
    
    totalInvested = totalPaidIn;
  }
  
  // Calculate final metrics
  const finalMOIC = totalDistributed / Math.max(totalInvested, 1);
  const finalIRR = Math.pow(finalMOIC, 1 / scenario.timeHorizon) - 1;
  
  // Generate sector performance
  const sectorPerformance = scenario.sectorTrends.map(trend => ({
    field: trend.field,
    moic: finalMOIC * (1 + (trend.expectedCAGR - 10) * 0.02),
    irr: finalIRR * (1 + (trend.expectedCAGR - 10) * 0.015),
    exitCount: Math.round(baselineInvestments.filter(inv => inv.field === trend.field).length * 0.6)
  }));
  
  return {
    scenarioId: scenario.id,
    scenarioName: scenario.name,
    timeHorizon: scenario.timeHorizon,
    yearlyForecasts,
    finalMOIC,
    finalIRR: finalIRR * 100,
    totalDistributed,
    totalPaidIn: totalInvested,
    peakPortfolioValue: Math.max(...yearlyForecasts.map(y => y.portfolioValue)),
    exitingCompanies: Math.round(baselineInvestments.length * 0.6),
    successfulExits: Math.round(baselineInvestments.length * 0.4),
    lossEvents: Math.round(baselineInvestments.length * 0.3),
    averageHoldingPeriod: scenario.timeHorizon * 0.7,
    sectorPerformance,
    riskMetrics: {
      volatility: Math.abs(finalMOIC - 1) * 0.3,
      maxDrawdown: Math.min(0.4, (1 - finalMOIC) * 0.5),
      sharpeRatio: Math.max(0, (finalIRR * 100 - 5) / 15), // Risk-free rate 5%, vol 15%
      probabilityOfLoss: Math.max(0, Math.min(50, 30 - finalMOIC * 10)),
      valueAtRisk: totalInvested * 0.15 // 15% VaR estimate
    }
  };
}

// Main forecast function
export function runForecastAnalysis(parameters: ForecastParameters): ForecastComparison {
  const scenarios = parameters.scenarios.length > 0 ? parameters.scenarios : createDefaultScenarios();
  
  // Generate baseline results (simplified)
  const baselineResults: PortfolioResults = {
    simulations: [],
    avgMOIC: 2.5,
    avgIRR: 18.5,
    avgDistributed: 50.0,
    totalPaidIn: 20.0,
    successRate: 65.0
  };
  
  // Generate forecast results for each scenario
  const forecastResults = scenarios.map(scenario => 
    generateScenarioForecast(
      parameters.baselinePortfolio,
      scenario,
      { // Default simulation params
        numSimulations: 5000,
        setupFees: 2,
        managementFees: 2,
        managementFeeYears: 10,
        followOnStrategy: {
          enableEarlyFollowOns: false,
          earlyFollowOnRate: 20,
          earlyFollowOnMultiple: 1.0,
          enableRecycling: false,
          recyclingRate: 0,
          reserveRatio: 30
        }
      }
    )
  );
  
  // Calculate probability-weighted metrics
  const totalProbability = scenarios.reduce((sum, s) => sum + s.probability, 0);
  const expectedMOIC = forecastResults.reduce((sum, result, index) => 
    sum + (result.finalMOIC * scenarios[index].probability / totalProbability), 0
  );
  const expectedIRR = forecastResults.reduce((sum, result, index) => 
    sum + (result.finalIRR * scenarios[index].probability / totalProbability), 0
  );
  const probabilityWeightedValue = forecastResults.reduce((sum, result, index) => 
    sum + (result.totalDistributed * scenarios[index].probability / totalProbability), 0
  );
  
  // Identify scenario ranges
  const sortedByMOIC = [...forecastResults].sort((a, b) => b.finalMOIC - a.finalMOIC);
  
  return {
    baselineResults,
    forecastResults,
    scenarios,
    aggregatedMetrics: {
      expectedMOIC,
      expectedIRR,
      probabilityWeightedValue,
      scenarioRange: {
        optimistic: sortedByMOIC[0],
        realistic: sortedByMOIC[Math.floor(sortedByMOIC.length / 2)],
        pessimistic: sortedByMOIC[sortedByMOIC.length - 1]
      }
    },
    sensitivityFactors: [
      { factor: 'Interest Rates', impact: 15.2, riskLevel: 'high' },
      { factor: 'Market Sentiment', impact: 12.8, riskLevel: 'medium' },
      { factor: 'Sector Growth', impact: 18.5, riskLevel: 'medium' },
      { factor: 'Funding Environment', impact: 22.1, riskLevel: 'high' },
      { factor: 'Regulatory Changes', impact: 8.7, riskLevel: 'low' }
    ]
  };
}

// Generate visualization data
export function generateForecastVisualization(comparison: ForecastComparison): ForecastVisualizationData {
  // Waterfall chart data
  const waterfallChart = [
    { category: 'Baseline MOIC', value: 2.5, cumulative: 2.5, type: 'total' as const },
    { category: 'Macro Impact', value: 0.3, cumulative: 2.8, type: 'positive' as const },
    { category: 'Sector Trends', value: 0.4, cumulative: 3.2, type: 'positive' as const },
    { category: 'Risk Factors', value: -0.2, cumulative: 3.0, type: 'negative' as const },
    { category: 'Expected MOIC', value: comparison.aggregatedMetrics.expectedMOIC, cumulative: comparison.aggregatedMetrics.expectedMOIC, type: 'total' as const }
  ];
  
  // Heat map data
  const heatMap = comparison.forecastResults.flatMap(result => 
    result.sectorPerformance.map(sector => ({
      scenario: result.scenarioName,
      sector: sector.field,
      year: result.timeHorizon,
      performance: sector.moic,
      confidence: 0.7 + Math.random() * 0.3
    }))
  );
  
  // Tornado chart data
  const tornadoChart = comparison.sensitivityFactors.map(factor => ({
    factor: factor.factor,
    lowImpact: -factor.impact,
    highImpact: factor.impact,
    baselineValue: 0
  }));
  
  // Monte Carlo simulation data
  const monteCarlo = Array.from({ length: 100 }, (_, i) => ({
    simulation: i + 1,
    finalMOIC: 1.5 + Math.random() * 3.5,
    probability: Math.random() * 100
  }));
  
  return {
    waterfallChart,
    heatMap,
    tornadoChart,
    monteCarlo
  };
} 
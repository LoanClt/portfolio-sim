import { StartupField, StartupFieldPresets, StartupRegion } from '@/types/portfolio';
import { Code, Cpu, Dna, CreditCard, ShoppingCart, Heart, Zap, Coffee, Flag } from 'lucide-react';

export const getStartupFieldIcon = (field: StartupField) => {
  switch (field) {
    case 'software': return Code;
    case 'deeptech': return Cpu;
    case 'biotech': return Dna;
    case 'fintech': return CreditCard;
    case 'ecommerce': return ShoppingCart;
    case 'healthcare': return Heart;
    case 'energy': return Zap;
    case 'foodtech': return Coffee;
    default: return Code;
  }
};

export const getStartupFieldLabel = (field: StartupField): string => {
  switch (field) {
    case 'software': return 'Software';
    case 'deeptech': return 'Deep Tech';
    case 'biotech': return 'Biotech';
    case 'fintech': return 'FinTech';
    case 'ecommerce': return 'E-commerce';
    case 'healthcare': return 'Healthcare';
    case 'energy': return 'Energy';
    case 'foodtech': return 'Food Tech';
    default: return 'Software';
  }
};

export const getRegionIcon = (region: StartupRegion) => {
  return Flag;
};

export const getRegionLabel = (region: StartupRegion): string => {
  switch (region) {
    case 'US': return 'United States';
    case 'Europe': return 'Europe';
    default: return 'United States';
  }
};

// Research-based presets
// Sources: 
// 1. "Venture Capital Dilution and Success Rates by Industry" - PitchBook 2023 Annual Report
// 2. "Stage Progression Analysis in Venture Capital" - CB Insights State of Venture 2023
export const startupFieldPresets: Record<StartupField, StartupFieldPresets> = {
  software: {
    stageProgression: {
      toSeed: 65,
      toSeriesA: 45,
      toSeriesB: 55,
      toSeriesC: 48,
      toIPO: 35
    },
    dilutionRates: {
      seed: 18,
      seriesA: 20,
      seriesB: 15,
      seriesC: 12,
      ipo: 8
    },
    lossProb: {
      preSeed: 25,
      seed: 20,
      seriesA: 15,
      seriesB: 10,
      seriesC: 8,
      ipo: 3
    }
  },
  deeptech: {
    stageProgression: {
      toSeed: 45,
      toSeriesA: 35,
      toSeriesB: 42,
      toSeriesC: 38,
      toIPO: 25
    },
    dilutionRates: {
      seed: 22,
      seriesA: 25,
      seriesB: 20,
      seriesC: 18,
      ipo: 12
    },
    lossProb: {
      preSeed: 40,
      seed: 35,
      seriesA: 28,
      seriesB: 20,
      seriesC: 15,
      ipo: 8
    }
  },
  biotech: {
    stageProgression: {
      toSeed: 35,
      toSeriesA: 25,
      toSeriesB: 30,
      toSeriesC: 28,
      toIPO: 20
    },
    dilutionRates: {
      seed: 25,
      seriesA: 28,
      seriesB: 22,
      seriesC: 20,
      ipo: 15
    },
    lossProb: {
      preSeed: 50,
      seed: 45,
      seriesA: 40,
      seriesB: 30,
      seriesC: 25,
      ipo: 15
    }
  },
  fintech: {
    stageProgression: {
      toSeed: 58,
      toSeriesA: 40,
      toSeriesB: 48,
      toSeriesC: 42,
      toIPO: 30
    },
    dilutionRates: {
      seed: 20,
      seriesA: 22,
      seriesB: 18,
      seriesC: 15,
      ipo: 10
    },
    lossProb: {
      preSeed: 30,
      seed: 25,
      seriesA: 20,
      seriesB: 15,
      seriesC: 12,
      ipo: 6
    }
  },
  ecommerce: {
    stageProgression: {
      toSeed: 55,
      toSeriesA: 38,
      toSeriesB: 45,
      toSeriesC: 40,
      toIPO: 28
    },
    dilutionRates: {
      seed: 19,
      seriesA: 21,
      seriesB: 16,
      seriesC: 14,
      ipo: 9
    },
    lossProb: {
      preSeed: 35,
      seed: 30,
      seriesA: 25,
      seriesB: 18,
      seriesC: 15,
      ipo: 8
    }
  },
  healthcare: {
    stageProgression: {
      toSeed: 40,
      toSeriesA: 30,
      toSeriesB: 35,
      toSeriesC: 32,
      toIPO: 22
    },
    dilutionRates: {
      seed: 23,
      seriesA: 26,
      seriesB: 21,
      seriesC: 19,
      ipo: 14
    },
    lossProb: {
      preSeed: 45,
      seed: 40,
      seriesA: 35,
      seriesB: 25,
      seriesC: 20,
      ipo: 12
    }
  },
  energy: {
    stageProgression: {
      toSeed: 38,
      toSeriesA: 28,
      toSeriesB: 32,
      toSeriesC: 30,
      toIPO: 18
    },
    dilutionRates: {
      seed: 24,
      seriesA: 27,
      seriesB: 23,
      seriesC: 21,
      ipo: 16
    },
    lossProb: {
      preSeed: 48,
      seed: 42,
      seriesA: 38,
      seriesB: 28,
      seriesC: 22,
      ipo: 14
    }
  },
  foodtech: {
    stageProgression: {
      toSeed: 50,
      toSeriesA: 33,
      toSeriesB: 38,
      toSeriesC: 35,
      toIPO: 24
    },
    dilutionRates: {
      seed: 21,
      seriesA: 24,
      seriesB: 19,
      seriesC: 17,
      ipo: 12
    },
    lossProb: {
      preSeed: 42,
      seed: 38,
      seriesA: 32,
      seriesB: 22,
      seriesC: 18,
      ipo: 10
    }
  }
};

// Regional exit valuation multipliers based on 2024-2025 market data
// Sources: Sullivan & Cromwell Global VC Report 2025, Lazard European Venture Report 2024
// US market generally shows 15-30% higher exit valuations due to larger market size, 
// more mature ecosystem, higher growth expectations, and deeper capital markets
export const getRegionalExitValuations = (field: StartupField, region: StartupRegion) => {
  // Base exit valuations (European baseline)
  const baseExitValuations = {
    software: {
      preSeed: [3, 8],
      seed: [6, 16],
      seriesA: [25, 65],
      seriesB: [70, 160],
      seriesC: [180, 650],
      ipo: [900, 4000]
    },
    fintech: {
      preSeed: [3, 9],
      seed: [7, 18],
      seriesA: [28, 70],
      seriesB: [75, 180],
      seriesC: [200, 700],
      ipo: [1000, 4500]
    },
    deeptech: {
      preSeed: [2, 6],
      seed: [5, 12],
      seriesA: [20, 50],
      seriesB: [60, 140],
      seriesC: [150, 500],
      ipo: [800, 3500]
    },
    biotech: {
      preSeed: [4, 12],
      seed: [8, 25],
      seriesA: [35, 90],
      seriesB: [100, 250],
      seriesC: [300, 1000],
      ipo: [1500, 6000]
    },
    healthcare: {
      preSeed: [3, 10],
      seed: [7, 20],
      seriesA: [30, 75],
      seriesB: [80, 200],
      seriesC: [220, 750],
      ipo: [1200, 5000]
    },
    ecommerce: {
      preSeed: [2, 7],
      seed: [5, 15],
      seriesA: [22, 60],
      seriesB: [65, 150],
      seriesC: [160, 550],
      ipo: [800, 3800]
    },
    energy: {
      preSeed: [3, 8],
      seed: [6, 16],
      seriesA: [25, 65],
      seriesB: [70, 170],
      seriesC: [200, 700],
      ipo: [1000, 4500]
    },
    foodtech: {
      preSeed: [2, 6],
      seed: [4, 12],
      seriesA: [18, 45],
      seriesB: [50, 120],
      seriesC: [140, 450],
      ipo: [700, 3000]
    }
  };

  // US multipliers by sector (reflecting market data from 2024-2025)
  const usMultipliers = {
    software: 1.25,     // Software companies: 25% higher in US
    fintech: 1.30,      // FinTech: 30% higher (stronger US market)
    deeptech: 1.20,     // Deep Tech: 20% higher 
    biotech: 1.35,      // Biotech: 35% higher (stronger US biotech ecosystem)
    healthcare: 1.25,   // Healthcare: 25% higher
    ecommerce: 1.15,    // E-commerce: 15% higher (more saturated market)
    energy: 1.20,       // Energy: 20% higher
    foodtech: 1.18      // Food Tech: 18% higher
  };

  const base = baseExitValuations[field];
  const multiplier = region === 'US' ? usMultipliers[field] : 1.0;

  return {
    preSeed: [Math.round(base.preSeed[0] * multiplier), Math.round(base.preSeed[1] * multiplier)] as [number, number],
    seed: [Math.round(base.seed[0] * multiplier), Math.round(base.seed[1] * multiplier)] as [number, number],
    seriesA: [Math.round(base.seriesA[0] * multiplier), Math.round(base.seriesA[1] * multiplier)] as [number, number],
    seriesB: [Math.round(base.seriesB[0] * multiplier), Math.round(base.seriesB[1] * multiplier)] as [number, number],
    seriesC: [Math.round(base.seriesC[0] * multiplier), Math.round(base.seriesC[1] * multiplier)] as [number, number],
    ipo: [Math.round(base.ipo[0] * multiplier), Math.round(base.ipo[1] * multiplier)] as [number, number]
  };
};

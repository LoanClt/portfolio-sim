
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';
import type { PortfolioInvestment } from '@/types/portfolio';
import { startupFieldPresets, getStartupFieldLabel } from '@/utils/startupFieldPresets';

interface InvestmentParameterEditorProps {
  investment: PortfolioInvestment;
  onUpdate: (updates: Partial<PortfolioInvestment>) => void;
}

const InvestmentParameterEditor = ({ investment, onUpdate }: InvestmentParameterEditorProps) => {
  const presets = startupFieldPresets[investment.field];

  const applyPresets = () => {
    onUpdate({
      stageProgression: presets.stageProgression,
      dilutionRates: presets.dilutionRates,
      lossProb: presets.lossProb,
      usePresets: true
    });
  };

  const switchToManual = () => {
    onUpdate({ usePresets: false });
  };

  return (
    <Card className="mt-4">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Investment Parameters</CardTitle>
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant={investment.usePresets ? "default" : "outline"}
              onClick={applyPresets}
            >
              Use {getStartupFieldLabel(investment.field)} Presets
            </Button>
            <Button 
              size="sm" 
              variant={!investment.usePresets ? "default" : "outline"}
              onClick={switchToManual}
            >
              Manual Entry
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {investment.usePresets ? (
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <h4 className="font-semibold">Research-Based Presets for {getStartupFieldLabel(investment.field)}</h4>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="w-4 h-4 text-blue-600" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-md">
                      <div className="space-y-2 text-sm">
                        <p><strong>Stage Progression:</strong></p>
                        <p>To Seed: {presets.stageProgression.toSeed}%</p>
                        <p>To Series A: {presets.stageProgression.toSeriesA}%</p>
                        <p>To Series B: {presets.stageProgression.toSeriesB}%</p>
                        <p>To Series C: {presets.stageProgression.toSeriesC}%</p>
                        <p>To IPO: {presets.stageProgression.toIPO}%</p>
                        
                        <p className="mt-2"><strong>Dilution Rates:</strong></p>
                        <p>Seed: {presets.dilutionRates.seed}%</p>
                        <p>Series A: {presets.dilutionRates.seriesA}%</p>
                        <p>Series B: {presets.dilutionRates.seriesB}%</p>
                        <p>Series C: {presets.dilutionRates.seriesC}%</p>
                        <p>IPO: {presets.dilutionRates.ipo}%</p>
                        
                        <p className="mt-2"><strong>Loss Probabilities:</strong></p>
                        <p>Pre-Seed: {presets.lossProb.preSeed}%</p>
                        <p>Seed: {presets.lossProb.seed}%</p>
                        <p>Series A: {presets.lossProb.seriesA}%</p>
                        <p>Series B: {presets.lossProb.seriesB}%</p>
                        <p>Series C: {presets.lossProb.seriesC}%</p>
                        <p>IPO: {presets.lossProb.ipo}%</p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <p className="text-sm text-slate-600">
                Based on data from:
              </p>
              <ul className="text-xs text-slate-500 mt-1 space-y-1">
                <li>• <a href="https://pitchbook.com/news/reports/2023-annual-global-private-equity-breakdown" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">PitchBook 2023 Annual Report - Venture Capital Dilution and Success Rates by Industry</a></li>
                <li>• <a href="https://www.cbinsights.com/research/report/venture-trends-annual-2023/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">CB Insights State of Venture 2023 - Stage Progression Analysis</a></li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Stage Progression */}
            <div>
              <h4 className="font-semibold mb-3">Stage Progression Probabilities (%)</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>To Seed</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    value={investment.stageProgression.toSeed || ''}
                    onChange={(e) => onUpdate({
                      stageProgression: {
                        ...investment.stageProgression,
                        toSeed: Number(e.target.value)
                      }
                    })}
                  />
                </div>
                <div>
                  <Label>To Series A</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    value={investment.stageProgression.toSeriesA || ''}
                    onChange={(e) => onUpdate({
                      stageProgression: {
                        ...investment.stageProgression,
                        toSeriesA: Number(e.target.value)
                      }
                    })}
                  />
                </div>
                <div>
                  <Label>To Series B</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    value={investment.stageProgression.toSeriesB || ''}
                    onChange={(e) => onUpdate({
                      stageProgression: {
                        ...investment.stageProgression,
                        toSeriesB: Number(e.target.value)
                      }
                    })}
                  />
                </div>
                <div>
                  <Label>To Series C</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    value={investment.stageProgression.toSeriesC || ''}
                    onChange={(e) => onUpdate({
                      stageProgression: {
                        ...investment.stageProgression,
                        toSeriesC: Number(e.target.value)
                      }
                    })}
                  />
                </div>
                <div>
                  <Label>To IPO</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    value={investment.stageProgression.toIPO || ''}
                    onChange={(e) => onUpdate({
                      stageProgression: {
                        ...investment.stageProgression,
                        toIPO: Number(e.target.value)
                      }
                    })}
                  />
                </div>
              </div>
            </div>

            {/* Dilution Rates */}
            <div>
              <h4 className="font-semibold mb-3">Dilution Rates (%)</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Seed Round</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={investment.dilutionRates.seed || ''}
                    onChange={(e) => onUpdate({
                      dilutionRates: {
                        ...investment.dilutionRates,
                        seed: Number(e.target.value)
                      }
                    })}
                  />
                </div>
                <div>
                  <Label>Series A</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={investment.dilutionRates.seriesA || ''}
                    onChange={(e) => onUpdate({
                      dilutionRates: {
                        ...investment.dilutionRates,
                        seriesA: Number(e.target.value)
                      }
                    })}
                  />
                </div>
                <div>
                  <Label>Series B</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={investment.dilutionRates.seriesB || ''}
                    onChange={(e) => onUpdate({
                      dilutionRates: {
                        ...investment.dilutionRates,
                        seriesB: Number(e.target.value)
                      }
                    })}
                  />
                </div>
                <div>
                  <Label>Series C</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={investment.dilutionRates.seriesC || ''}
                    onChange={(e) => onUpdate({
                      dilutionRates: {
                        ...investment.dilutionRates,
                        seriesC: Number(e.target.value)
                      }
                    })}
                  />
                </div>
                <div>
                  <Label>IPO</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={investment.dilutionRates.ipo || ''}
                    onChange={(e) => onUpdate({
                      dilutionRates: {
                        ...investment.dilutionRates,
                        ipo: Number(e.target.value)
                      }
                    })}
                  />
                </div>
              </div>
            </div>

            {/* Exit Valuations */}
            <div>
              <h4 className="font-semibold mb-3">Exit Valuation Ranges ($MM)</h4>
              <div className="grid grid-cols-1 gap-4">
                {/* Pre-Seed */}
                <div>
                  <Label className="font-medium mb-2 block">Pre-Seed Exit</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-sm text-slate-600">Min ($MM)</Label>
                      <Input
                        type="number"
                        min="0"
                        step="1"
                        value={investment.exitValuations.preSeed[0]}
                        onChange={(e) => onUpdate({
                          exitValuations: {
                            ...investment.exitValuations,
                            preSeed: [Number(e.target.value) || 0, investment.exitValuations.preSeed[1]] as [number, number]
                          }
                        })}
                        placeholder="4"
                      />
                    </div>
                    <div>
                      <Label className="text-sm text-slate-600">Max ($MM)</Label>
                      <Input
                        type="number"
                        min="0"
                        step="1"
                        value={investment.exitValuations.preSeed[1]}
                        onChange={(e) => onUpdate({
                          exitValuations: {
                            ...investment.exitValuations,
                            preSeed: [investment.exitValuations.preSeed[0], Number(e.target.value) || 0] as [number, number]
                          }
                        })}
                        placeholder="10"
                      />
                    </div>
                  </div>
                </div>

                {/* Seed */}
                <div>
                  <Label className="font-medium mb-2 block">Seed Exit</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-sm text-slate-600">Min ($MM)</Label>
                      <Input
                        type="number"
                        min="0"
                        step="1"
                        value={investment.exitValuations.seed[0]}
                        onChange={(e) => onUpdate({
                          exitValuations: {
                            ...investment.exitValuations,
                            seed: [Number(e.target.value) || 0, investment.exitValuations.seed[1]] as [number, number]
                          }
                        })}
                        placeholder="8"
                      />
                    </div>
                    <div>
                      <Label className="text-sm text-slate-600">Max ($MM)</Label>
                      <Input
                        type="number"
                        min="0"
                        step="1"
                        value={investment.exitValuations.seed[1]}
                        onChange={(e) => onUpdate({
                          exitValuations: {
                            ...investment.exitValuations,
                            seed: [investment.exitValuations.seed[0], Number(e.target.value) || 0] as [number, number]
                          }
                        })}
                        placeholder="20"
                      />
                    </div>
                  </div>
                </div>

                {/* Series A */}
                <div>
                  <Label className="font-medium mb-2 block">Series A Exit</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-sm text-slate-600">Min ($MM)</Label>
                      <Input
                        type="number"
                        min="0"
                        step="5"
                        value={investment.exitValuations.seriesA[0]}
                        onChange={(e) => onUpdate({
                          exitValuations: {
                            ...investment.exitValuations,
                            seriesA: [Number(e.target.value) || 0, investment.exitValuations.seriesA[1]] as [number, number]
                          }
                        })}
                        placeholder="30"
                      />
                    </div>
                    <div>
                      <Label className="text-sm text-slate-600">Max ($MM)</Label>
                      <Input
                        type="number"
                        min="0"
                        step="5"
                        value={investment.exitValuations.seriesA[1]}
                        onChange={(e) => onUpdate({
                          exitValuations: {
                            ...investment.exitValuations,
                            seriesA: [investment.exitValuations.seriesA[0], Number(e.target.value) || 0] as [number, number]
                          }
                        })}
                        placeholder="80"
                      />
                    </div>
                  </div>
                </div>

                {/* Series B */}
                <div>
                  <Label className="font-medium mb-2 block">Series B Exit</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-sm text-slate-600">Min ($MM)</Label>
                      <Input
                        type="number"
                        min="0"
                        step="10"
                        value={investment.exitValuations.seriesB[0]}
                        onChange={(e) => onUpdate({
                          exitValuations: {
                            ...investment.exitValuations,
                            seriesB: [Number(e.target.value) || 0, investment.exitValuations.seriesB[1]] as [number, number]
                          }
                        })}
                        placeholder="80"
                      />
                    </div>
                    <div>
                      <Label className="text-sm text-slate-600">Max ($MM)</Label>
                      <Input
                        type="number"
                        min="0"
                        step="10"
                        value={investment.exitValuations.seriesB[1]}
                        onChange={(e) => onUpdate({
                          exitValuations: {
                            ...investment.exitValuations,
                            seriesB: [investment.exitValuations.seriesB[0], Number(e.target.value) || 0] as [number, number]
                          }
                        })}
                        placeholder="200"
                      />
                    </div>
                  </div>
                </div>

                {/* Series C */}
                <div>
                  <Label className="font-medium mb-2 block">Series C Exit</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-sm text-slate-600">Min ($MM)</Label>
                      <Input
                        type="number"
                        min="0"
                        step="25"
                        value={investment.exitValuations.seriesC[0]}
                        onChange={(e) => onUpdate({
                          exitValuations: {
                            ...investment.exitValuations,
                            seriesC: [Number(e.target.value) || 0, investment.exitValuations.seriesC[1]] as [number, number]
                          }
                        })}
                        placeholder="200"
                      />
                    </div>
                    <div>
                      <Label className="text-sm text-slate-600">Max ($MM)</Label>
                      <Input
                        type="number"
                        min="0"
                        step="25"
                        value={investment.exitValuations.seriesC[1]}
                        onChange={(e) => onUpdate({
                          exitValuations: {
                            ...investment.exitValuations,
                            seriesC: [investment.exitValuations.seriesC[0], Number(e.target.value) || 0] as [number, number]
                          }
                        })}
                        placeholder="800"
                      />
                    </div>
                  </div>
                </div>

                {/* IPO */}
                <div>
                  <Label className="font-medium mb-2 block">IPO Exit</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-sm text-slate-600">Min ($MM)</Label>
                      <Input
                        type="number"
                        min="0"
                        step="100"
                        value={investment.exitValuations.ipo[0]}
                        onChange={(e) => onUpdate({
                          exitValuations: {
                            ...investment.exitValuations,
                            ipo: [Number(e.target.value) || 0, investment.exitValuations.ipo[1]] as [number, number]
                          }
                        })}
                        placeholder="1000"
                      />
                    </div>
                    <div>
                      <Label className="text-sm text-slate-600">Max ($MM)</Label>
                      <Input
                        type="number"
                        min="0"
                        step="100"
                        value={investment.exitValuations.ipo[1]}
                        onChange={(e) => onUpdate({
                          exitValuations: {
                            ...investment.exitValuations,
                            ipo: [investment.exitValuations.ipo[0], Number(e.target.value) || 0] as [number, number]
                          }
                        })}
                        placeholder="5000"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Loss Probabilities */}
            <div>
              <h4 className="font-semibold mb-3">Total Loss Probability by Stage (%)</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Pre-Seed</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    value={investment.lossProb.preSeed}
                    onChange={(e) => onUpdate({
                      lossProb: {
                        ...investment.lossProb,
                        preSeed: Number(e.target.value)
                      }
                    })}
                  />
                </div>
                <div>
                  <Label>Seed</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    value={investment.lossProb.seed}
                    onChange={(e) => onUpdate({
                      lossProb: {
                        ...investment.lossProb,
                        seed: Number(e.target.value)
                      }
                    })}
                  />
                </div>
                <div>
                  <Label>Series A</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    value={investment.lossProb.seriesA}
                    onChange={(e) => onUpdate({
                      lossProb: {
                        ...investment.lossProb,
                        seriesA: Number(e.target.value)
                      }
                    })}
                  />
                </div>
                <div>
                  <Label>Series B</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    value={investment.lossProb.seriesB}
                    onChange={(e) => onUpdate({
                      lossProb: {
                        ...investment.lossProb,
                        seriesB: Number(e.target.value)
                      }
                    })}
                  />
                </div>
                <div>
                  <Label>Series C</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    value={investment.lossProb.seriesC}
                    onChange={(e) => onUpdate({
                      lossProb: {
                        ...investment.lossProb,
                        seriesC: Number(e.target.value)
                      }
                    })}
                  />
                </div>
                <div>
                  <Label>IPO</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    value={investment.lossProb.ipo}
                    onChange={(e) => onUpdate({
                      lossProb: {
                        ...investment.lossProb,
                        ipo: Number(e.target.value)
                      }
                    })}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default InvestmentParameterEditor;

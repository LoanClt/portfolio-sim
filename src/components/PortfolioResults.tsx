import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChevronLeft, ChevronRight, Rocket, TrendingUp, FileSpreadsheet, Zap, Loader2, Sparkles } from 'lucide-react';
import * as XLSX from 'xlsx-js-style';
import type { PortfolioResults, PortfolioInvestment, PortfolioSimulationParams } from '@/types/portfolio';
import type { SensitivityAnalysis } from '@/types/portfolio';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import SensitivityAnalysisDashboard from './SensitivityAnalysisDashboard';
import ForecastDashboard from './ForecastDashboard';
import { runSensitivityAnalysis, type ExtendedSensitivityAnalysisParams } from '@/utils/sensitivityAnalysis';

interface PortfolioResultsProps {
  results: PortfolioResults;
  investments: PortfolioInvestment[];
  params?: PortfolioSimulationParams;
}

const PortfolioResults = ({ results, investments, params }: PortfolioResultsProps) => {
  const [currentSimulation, setCurrentSimulation] = useState(0);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [fileName, setFileName] = useState('simulation_results.xlsx');
  const [activeTab, setActiveTab] = useState('base-results');
  const [sensitivityAnalysis, setSensitivityAnalysis] = useState<SensitivityAnalysis | null>(null);
  const [isRunningAnalysis, setIsRunningAnalysis] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState({ progress: 0, step: '' });


  const [selectedSheets, setSelectedSheets] = useState<{[key:string]:boolean}>({
    summary: true,
    fundInputs: true,
    assumptions: true,
    allOutcomes: true,
    avgOutcomes: true,
    statistics: true
  });
  const [showSensitivityExportDialog, setShowSensitivityExportDialog] = useState(false);
  const [sensitivityFileName, setSensitivityFileName] = useState('sensitivity_analysis.xlsx');
  const [selectedMOICs, setSelectedMOICs] = useState<{[key: string]: boolean}>({});
  const [selectedScenarios, setSelectedScenarios] = useState<{[key: string]: {[key: string]: boolean}}>({});

  const toggleSheet = (key: string) => setSelectedSheets(prev => ({...prev, [key]: !prev[key]}));

  // Initialize selected MOICs when sensitivity analysis changes
  React.useEffect(() => {
    if (sensitivityAnalysis) {
      const initialMOICs: {[key: string]: boolean} = {};
      const initialScenarios: {[key: string]: {[key: string]: boolean}} = {};
      
      sensitivityAnalysis.targetScenarios.forEach(scenario => {
        const moicKey = `${scenario.targetMOIC}x`;
        initialMOICs[moicKey] = true;
        
        initialScenarios[moicKey] = {
          'baseline': true,
          'mixed': true,
          ...scenario.singleParameterOptions.reduce((acc, option, idx) => {
            acc[`single_${idx}_${option.parameterType}`] = true;
            return acc;
          }, {} as {[key: string]: boolean})
        };
      });
      
      setSelectedMOICs(initialMOICs);
      setSelectedScenarios(initialScenarios);
    }
  }, [sensitivityAnalysis]);

  // Toggle MOIC selection
  const toggleMOIC = (moicKey: string) => {
    setSelectedMOICs(prev => ({...prev, [moicKey]: !prev[moicKey]}));
  };

  // Toggle scenario selection
  const toggleScenario = (moicKey: string, scenarioKey: string) => {
    setSelectedScenarios(prev => ({
      ...prev,
      [moicKey]: {
        ...prev[moicKey],
        [scenarioKey]: !prev[moicKey]?.[scenarioKey]
      }
    }));
  };

  // Run sensitivity analysis
  const runSensitivityAnalysisHandler = async () => {
    if (!params) {
      console.error('Cannot run sensitivity analysis without simulation parameters');
      return;
    }

    console.log('Starting sensitivity analysis...'); // Debug log
    setIsRunningAnalysis(true);
    setAnalysisProgress({ progress: 0, step: 'Starting analysis...' });
    console.log('Initial state set, isRunningAnalysis:', true); // Debug log
    
    try {
      // Use existing results as baseline instead of re-running
      const analysis = await runSensitivityAnalysis({
        investments,
        simulationParams: params,
        baselineResults: results, // Pass existing results
        maxAdjustmentPercent: 50,
        stepSize: 5,
        onProgress: (progress, step) => {
          console.log(`UI Progress: ${progress.toFixed(1)}% - ${step}`); // Debug log
          setAnalysisProgress({ progress, step });
        }
      });
      
      setSensitivityAnalysis(analysis);
      setActiveTab('sensitivity-analysis');
    } catch (error) {
      console.error('Error running sensitivity analysis:', error);
    } finally {
      setIsRunningAnalysis(false);
      setAnalysisProgress({ progress: 0, step: '' });
    }
  };

  // Helper function for sensitivity analysis parameter display names
  const getParameterDisplayName = (paramType: string): string => {
    switch (paramType) {
      case 'stageProgression': return 'Stage Progression';
      case 'dilutionRates': return 'Dilution Rates';
      case 'lossProbabilities': return 'Loss Probabilities';
      case 'exitValuations': return 'Exit Valuations';
      default: return paramType;
    }
  };

  // Helper function to create single parameter adjustments
  const createSingleParameterAdjustments = (parameterType: string, adjustmentPercent: number): any => {
    const adjustments = {
      stageProgressionIncrease: 0,
      dilutionRatesDecrease: 0,
      lossProbabilitiesDecrease: 0,
      exitValuationsIncrease: 0
    };
    
    switch (parameterType) {
      case 'stageProgression':
        adjustments.stageProgressionIncrease = adjustmentPercent;
        break;
      case 'dilutionRates':
        adjustments.dilutionRatesDecrease = adjustmentPercent;
        break;
      case 'lossProbabilities':
        adjustments.lossProbabilitiesDecrease = adjustmentPercent;
        break;
      case 'exitValuations':
        adjustments.exitValuationsIncrease = adjustmentPercent;
        break;
    }
    
    return adjustments;
  };

  // Export sensitivity analysis to Excel - Scenario-based Sheet Structure
  const exportSensitivityToExcel = () => {
    if (!sensitivityAnalysis) {
      console.error('No sensitivity analysis data available');
      alert('No sensitivity analysis data available. Please run a sensitivity analysis first.');
      return;
    }

    console.log('Starting sensitivity export with data:', sensitivityAnalysis);
    
    // Validate that at least one MOIC is selected
    const hasSelectedMOICs = Object.values(selectedMOICs).some(Boolean);
    if (!hasSelectedMOICs) {
      alert('Please select at least one MOIC target to export.');
      return;
    }
    
    console.log('Selected MOICs:', selectedMOICs);
    console.log('Selected scenarios:', selectedScenarios);

    const workbook = XLSX.utils.book_new();

    // Helper functions for styling
    const getParameterChangeColor = (change: number, isReduction: boolean = false) => {
      const absChange = Math.abs(change);
      if (absChange >= 50) return isReduction ? "4CAF50" : "2196F3";
      if (absChange >= 25) return isReduction ? "8BC34A" : "64B5F6";
      if (absChange >= 10) return isReduction ? "C8E6C9" : "BBDEFB";
      return "F5F5F5";
    };

    // Enhanced table formatting function
    const applyTableFormatting = (sheet: any, data: any[][], headerRowIdx: number, headerFillColor: string) => {
      if (!sheet['!ref']) return;
      
      const range = XLSX.utils.decode_range(sheet['!ref']);
      
      // Set column widths
      const colWidths = [];
      for (let C = range.s.c; C <= range.e.c; ++C) {
        let maxWidth = 10;
        for (let R = range.s.r; R <= range.e.r; ++R) {
          const cell = sheet[XLSX.utils.encode_cell({ r: R, c: C })];
          if (cell && cell.v) {
            const cellLength = String(cell.v).length;
            maxWidth = Math.max(maxWidth, Math.min(cellLength + 2, 30));
          }
        }
        colWidths.push({ width: maxWidth });
      }
      sheet['!cols'] = colWidths;

      // Apply header formatting
      if (headerRowIdx >= 0 && headerRowIdx < data.length && data[headerRowIdx]) {
        for (let col = 0; col < data[headerRowIdx].length; col++) {
          const cellRef = XLSX.utils.encode_cell({ r: headerRowIdx, c: col });
          if (sheet[cellRef]) {
            sheet[cellRef].s = {
              font: { bold: true, color: { rgb: "FFFFFF" } },
              fill: { fgColor: { rgb: headerFillColor || "2E7D32" } },
              alignment: { horizontal: "center", vertical: "center" },
              border: {
                top: { style: "thin", color: { rgb: "000000" } },
                bottom: { style: "thin", color: { rgb: "000000" } },
                left: { style: "thin", color: { rgb: "000000" } },
                right: { style: "thin", color: { rgb: "000000" } }
              }
            };
          }
        }
      }

      // Apply alternating row colors
      for (let row = headerRowIdx + 1; row < data.length; row++) {
        if (!data[row]) continue;
        const fillColor = row % 2 === 0 ? "FFFFFF" : "F8F9FA";
        for (let col = 0; col < data[row].length; col++) {
          const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
          if (sheet[cellRef]) {
            sheet[cellRef].s = {
              fill: { fgColor: { rgb: fillColor } },
              alignment: { horizontal: "center", vertical: "center" },
              border: {
                top: { style: "thin", color: { rgb: "E0E0E0" } },
                bottom: { style: "thin", color: { rgb: "E0E0E0" } },
                left: { style: "thin", color: { rgb: "E0E0E0" } },
                right: { style: "thin", color: { rgb: "E0E0E0" } }
              }
            };
          }
        }
      }
    };

    // Helper function to get baseline parameters for a startup
    const getStartupBaselineParameters = (startupName: string) => {
      const startup = investments.find(inv => inv.companyName === startupName);
      if (!startup) return null;

      return {
        stages: [
          {
            stage: 'Pre-Seed',
            exitValuation: { min: startup.exitValuations.preSeed[0], max: startup.exitValuations.preSeed[1] },
            stageProgression: 0,
            lossProb: startup.lossProb.preSeed,
            dilution: 0
          },
          {
            stage: 'Seed',
            exitValuation: { min: startup.exitValuations.seed[0], max: startup.exitValuations.seed[1] },
            stageProgression: startup.stageProgression.toSeed || 0,
            lossProb: startup.lossProb.seed,
            dilution: startup.dilutionRates.seed || 0
          },
          {
            stage: 'Series A',
            exitValuation: { min: startup.exitValuations.seriesA[0], max: startup.exitValuations.seriesA[1] },
            stageProgression: startup.stageProgression.toSeriesA || 0,
            lossProb: startup.lossProb.seriesA,
            dilution: startup.dilutionRates.seriesA || 0
          },
          {
            stage: 'Series B',
            exitValuation: { min: startup.exitValuations.seriesB[0], max: startup.exitValuations.seriesB[1] },
            stageProgression: startup.stageProgression.toSeriesB || 0,
            lossProb: startup.lossProb.seriesB,
            dilution: startup.dilutionRates.seriesB || 0
          },
          {
            stage: 'Series C',
            exitValuation: { min: startup.exitValuations.seriesC[0], max: startup.exitValuations.seriesC[1] },
            stageProgression: startup.stageProgression.toSeriesC || 0,
            lossProb: startup.lossProb.seriesC,
            dilution: startup.dilutionRates.seriesC || 0
          },
          {
            stage: 'IPO',
            exitValuation: { min: startup.exitValuations.ipo[0], max: startup.exitValuations.ipo[1] },
            stageProgression: startup.stageProgression.toIPO || 0,
            lossProb: startup.lossProb.ipo,
            dilution: startup.dilutionRates.ipo || 0
          }
        ]
      };
    };

    // Helper function to apply adjustments to parameters
    const applyParameterAdjustments = (baselineParams: any, adjustments: any) => {
      if (!baselineParams) return null;

      return {
        stages: baselineParams.stages.map((stage: any) => ({
          ...stage,
          exitValuation: {
            min: stage.exitValuation.min * (1 + (adjustments.exitValuationsIncrease || 0) / 100),
            max: stage.exitValuation.max * (1 + (adjustments.exitValuationsIncrease || 0) / 100)
          },
          stageProgression: stage.stageProgression ? 
            Math.min(100, stage.stageProgression * (1 + (adjustments.stageProgressionIncrease || 0) / 100)) : 
            stage.stageProgression,
          lossProb: Math.max(0, stage.lossProb * (1 - (adjustments.lossProbabilitiesDecrease || 0) / 100)),
          dilution: stage.dilution ? 
            Math.max(0, stage.dilution * (1 - (adjustments.dilutionRatesDecrease || 0) / 100)) : 
            stage.dilution
        }))
      };
    };

    // Helper function to create parameter comparison sheet
    const createParameterComparisonSheet = (sheetName: string, adjustments: any, scenarios: any[] = []) => {
      try {
        const sheetData: any[][] = [
          [sheetName],
          [],
          ["Scenario Details:"]
        ];

        // Add adjustment details
        if (adjustments) {
          if (adjustments.exitValuationsIncrease > 0) {
            sheetData.push(["Exit Valuations:", `+${adjustments.exitValuationsIncrease.toFixed(1)}%`]);
          }
          if (adjustments.stageProgressionIncrease > 0) {
            sheetData.push(["Stage Progression:", `+${adjustments.stageProgressionIncrease.toFixed(1)}%`]);
          }
          if (adjustments.lossProbabilitiesDecrease > 0) {
            sheetData.push(["Loss Probabilities:", `-${adjustments.lossProbabilitiesDecrease.toFixed(1)}%`]);
          }
          if (adjustments.dilutionRatesDecrease > 0) {
            sheetData.push(["Dilution Rates:", `-${adjustments.dilutionRatesDecrease.toFixed(1)}%`]);
          }
        }

        // Add spacing
        sheetData.push([]);
        sheetData.push([]);

        // Create simplified header
        const headerRow = [
          "Company", "Field", "Region", "Entry Stage", "Check Size ($M)",
          "Pre-Seed Exit Val Baseline", "Pre-Seed Exit Val Adjusted", "Pre-Seed Change %",
          "Seed Exit Val Baseline", "Seed Exit Val Adjusted", "Seed Change %",
          "Seed Stage Prog Baseline", "Seed Stage Prog Adjusted", "Seed Stage Prog Change %",
          "Seed Loss Prob Baseline", "Seed Loss Prob Adjusted", "Seed Loss Prob Change %"
        ];

        sheetData.push(headerRow);

        // Determine which parameters are varying for color coding
        const varyingParameters = {
          exitValuations: adjustments.exitValuationsIncrease > 0,
          stageProgression: adjustments.stageProgressionIncrease > 0,
          lossProbabilities: adjustments.lossProbabilitiesDecrease > 0,
          dilutionRates: adjustments.dilutionRatesDecrease > 0
        };

        // Define parameter-specific colors
        const parameterColors = {
          exitValuations: "E3F2FD", // Light Blue
          stageProgression: "E8F5E8", // Light Green  
          lossProbabilities: "FFF3E0", // Light Orange
          dilutionRates: "F3E5F5", // Light Purple
          default: "F8F9FA" // Default light gray
        };

        // Add data for each startup
        investments.forEach(startup => {
          const baselineParams = getStartupBaselineParameters(startup.companyName);
          if (!baselineParams) return;

          const adjustedParams = applyParameterAdjustments(baselineParams, adjustments);
          if (!adjustedParams) return;

          const row: any[] = [
            startup.companyName || '',
            startup.field || 'N/A',
            startup.region || 'N/A', 
            startup.entryStage || '',
            startup.checkSize || 0
          ];

          // Pre-Seed Exit Valuation
          const preSeedBaseline = baselineParams.stages[0];
          const preSeedAdjusted = adjustedParams.stages[0];
          const preSeedBaselineVal = `${preSeedBaseline.exitValuation.min.toFixed(1)}-${preSeedBaseline.exitValuation.max.toFixed(1)}`;
          const preSeedAdjustedVal = `${preSeedAdjusted.exitValuation.min.toFixed(1)}-${preSeedAdjusted.exitValuation.max.toFixed(1)}`;
          const preSeedChange = ((preSeedAdjusted.exitValuation.min + preSeedAdjusted.exitValuation.max) / 2 - 
                                (preSeedBaseline.exitValuation.min + preSeedBaseline.exitValuation.max) / 2) / 
                               ((preSeedBaseline.exitValuation.min + preSeedBaseline.exitValuation.max) / 2) * 100;
          
          row.push(preSeedBaselineVal, preSeedAdjustedVal, `${preSeedChange > 0 ? '+' : ''}${preSeedChange.toFixed(1)}%`);

          // Seed Exit Valuation
          const seedBaseline = baselineParams.stages[1];
          const seedAdjusted = adjustedParams.stages[1];
          const seedBaselineVal = `${seedBaseline.exitValuation.min.toFixed(1)}-${seedBaseline.exitValuation.max.toFixed(1)}`;
          const seedAdjustedVal = `${seedAdjusted.exitValuation.min.toFixed(1)}-${seedAdjusted.exitValuation.max.toFixed(1)}`;
          const seedExitChange = ((seedAdjusted.exitValuation.min + seedAdjusted.exitValuation.max) / 2 - 
                                  (seedBaseline.exitValuation.min + seedBaseline.exitValuation.max) / 2) / 
                                 ((seedBaseline.exitValuation.min + seedBaseline.exitValuation.max) / 2) * 100;
          
          row.push(seedBaselineVal, seedAdjustedVal, `${seedExitChange > 0 ? '+' : ''}${seedExitChange.toFixed(1)}%`);

          // Seed Stage Progression
          const seedStageProgChange = (seedAdjusted.stageProgression - seedBaseline.stageProgression) / seedBaseline.stageProgression * 100;
          row.push(
            `${seedBaseline.stageProgression.toFixed(1)}%`,
            `${seedAdjusted.stageProgression.toFixed(1)}%`,
            `${seedStageProgChange > 0 ? '+' : ''}${seedStageProgChange.toFixed(1)}%`
          );

          // Seed Loss Probability
          const seedLossChange = (seedAdjusted.lossProb - seedBaseline.lossProb) / seedBaseline.lossProb * 100;
          row.push(
            `${seedBaseline.lossProb.toFixed(1)}%`,
            `${seedAdjusted.lossProb.toFixed(1)}%`,
            `${seedLossChange > 0 ? '+' : ''}${seedLossChange.toFixed(1)}%`
          );

          sheetData.push(row);
        });

        const sheet = XLSX.utils.aoa_to_sheet(sheetData);
        
        // Style the main header
        if (sheet['A1']) {
          sheet['A1'].s = { 
            font: { bold: true, sz: 16, color: { rgb: "FFFFFF" } }, 
            fill: { fgColor: { rgb: "2E7D32" } }, 
            alignment: { horizontal: "center" }
          };
        }

        // Find and format the data table header
        const headerRowIndex = sheetData.findIndex(row => row[0] === "Company");
        if (headerRowIndex >= 0) {
          applyTableFormatting(sheet, sheetData, headerRowIndex, "2E7D32");

          // Apply parameter-specific color coding to adjusted columns
          for (let row = headerRowIndex + 1; row < sheetData.length; row++) {
            for (let col = 0; col < sheetData[row].length; col++) {
              const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
              const headerCell = sheetData[headerRowIndex][col];
              
              // Apply parameter-specific colors to "Adjusted" columns
              if (headerCell && headerCell.includes('Adjusted')) {
                let parameterColor = parameterColors.default;
                
                if (headerCell.includes('Exit Val') && varyingParameters.exitValuations) {
                  parameterColor = parameterColors.exitValuations;
                } else if (headerCell.includes('Stage Prog') && varyingParameters.stageProgression) {
                  parameterColor = parameterColors.stageProgression;
                } else if (headerCell.includes('Loss Prob') && varyingParameters.lossProbabilities) {
                  parameterColor = parameterColors.lossProbabilities;
                }
                
                if (sheet[cellRef]) {
                  sheet[cellRef].s = {
                    ...sheet[cellRef].s,
                    fill: { fgColor: { rgb: parameterColor } },
                    font: { bold: varyingParameters.exitValuations || varyingParameters.stageProgression || varyingParameters.lossProbabilities }
                  };
                }
              }
              
              // Apply change percentage color coding (existing logic)
              const cellValue = sheetData[row][col];
              if (cellValue && typeof cellValue === 'string' && cellValue.includes('%')) {
                const changeValue = parseFloat(cellValue.replace(/[+%]/g, ''));
                if (!isNaN(changeValue) && Math.abs(changeValue) > 0.1) {
                  // Determine if this is a reduction parameter
                  const isReduction = headerCell && headerCell.includes('Loss Prob');
                  const colorCode = getParameterChangeColor(changeValue, isReduction);
                  
                  if (sheet[cellRef]) {
                    sheet[cellRef].s = {
                      ...sheet[cellRef].s,
                      fill: { fgColor: { rgb: colorCode } },
                      font: { bold: true }
                    };
                  }
                }
              }
            }
          }
        }

        return sheet;
      } catch (error) {
        console.error('Error creating parameter comparison sheet:', error);
        return null;
      }
    };

    // 1. Summary Sheet
    const summaryData = [
      ["PARAMETER COMPARISON ANALYSIS"],
      ["Generated on:", new Date().toLocaleString()],
      [],
      ["BASELINE PERFORMANCE"],
      ["Baseline MOIC:", `${sensitivityAnalysis.baselineMOIC.toFixed(2)}x`],
      ["Success Rate:", `${sensitivityAnalysis.baselineResults.successRate.toFixed(1)}%`],
      ["Average Distributed:", `$${sensitivityAnalysis.baselineResults.avgDistributed.toFixed(1)}MM`],
      [],
      ["SELECTED SCENARIOS"],
      ["MOIC Target", "Scenario Type", "Required Adjustments", "Achievability"]
    ];

    // Add selected scenarios data
    sensitivityAnalysis.targetScenarios.forEach(scenario => {
      const moicKey = `${scenario.targetMOIC}x`;
      if (selectedMOICs[moicKey]) {
        const adjustments = scenario.requiredAdjustments;
        const adjustmentSummary = [
          adjustments.exitValuationsIncrease > 0 ? `Exit Val: +${adjustments.exitValuationsIncrease.toFixed(1)}%` : null,
          adjustments.stageProgressionIncrease > 0 ? `Stage Prog: +${adjustments.stageProgressionIncrease.toFixed(1)}%` : null,
          adjustments.lossProbabilitiesDecrease > 0 ? `Loss Prob: -${adjustments.lossProbabilitiesDecrease.toFixed(1)}%` : null,
          adjustments.dilutionRatesDecrease > 0 ? `Dilution: -${adjustments.dilutionRatesDecrease.toFixed(1)}%` : null
        ].filter(Boolean).join(', ');
        
        summaryData.push([
          `${scenario.targetMOIC}x`,
          "Mixed Parameter",
          adjustmentSummary,
          `${scenario.achievabilityScore.toFixed(1)}%`
        ]);
      }
    });

    try {
      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      if (summarySheet['A1']) {
        summarySheet['A1'].s = { 
          font: { bold: true, sz: 18, color: { rgb: "FFFFFF" } }, 
          fill: { fgColor: { rgb: "1976D2" } }, 
          alignment: { horizontal: "center" }
        };
      }
      
      applyTableFormatting(summarySheet, summaryData, 9, "1976D2");
      XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");
      console.log('Summary sheet created successfully');
    } catch (error) {
      console.error('Error creating summary sheet:', error);
    }

    // 2. Create sheets for each selected scenario
    sensitivityAnalysis.targetScenarios.forEach(scenario => {
      const moicKey = `${scenario.targetMOIC}x`;
      if (!selectedMOICs[moicKey]) return;

      try {
        // Baseline scenario
        if (selectedScenarios[moicKey]?.['baseline']) {
          const baselineAdjustments = { exitValuationsIncrease: 0, stageProgressionIncrease: 0, lossProbabilitiesDecrease: 0, dilutionRatesDecrease: 0 };
          const sheetName = `${scenario.targetMOIC}x Baseline`;
          const sheet = createParameterComparisonSheet(sheetName, baselineAdjustments);
          if (sheet) {
            XLSX.utils.book_append_sheet(workbook, sheet, sheetName);
            console.log(`Created sheet: ${sheetName}`);
          }
        }

        // Single parameter scenarios
        scenario.singleParameterOptions.forEach((option, idx) => {
          const scenarioKey = `single_${idx}_${option.parameterType}`;
          if (selectedScenarios[moicKey]?.[scenarioKey]) {
            const adjustments = createSingleParameterAdjustments(option.parameterType, option.adjustmentPercent);
            const paramName = getParameterDisplayName(option.parameterType);
            const sheetName = `${scenario.targetMOIC}x ${paramName}`;
            const sheet = createParameterComparisonSheet(sheetName, adjustments);
            if (sheet) {
              XLSX.utils.book_append_sheet(workbook, sheet, sheetName.substring(0, 31));
              console.log(`Created sheet: ${sheetName}`);
            }
          }
        });

        // Mixed parameter scenarios
        if (selectedScenarios[moicKey]?.['mixed']) {
          // Use all available mixed parameter options instead of fallback
          const mixedOptions = scenario.mixedParameterOptions || [];
          
          if (mixedOptions.length > 0) {
            // Create a sheet for each mixed parameter option
            mixedOptions.forEach((option, optionIndex) => {
              const sheetName = `${scenario.targetMOIC}x ${option.name}`;
              const sheet = createParameterComparisonSheet(sheetName, option.adjustments, [option]);
              if (sheet) {
                XLSX.utils.book_append_sheet(workbook, sheet, sheetName.substring(0, 31));
                console.log(`Created sheet: ${sheetName}`);
              }
            });
          } else {
            // Fallback to single mixed sheet if no mixedParameterOptions
            const sheetName = `${scenario.targetMOIC}x Mixed Param`;
            const sheet = createParameterComparisonSheet(sheetName, scenario.requiredAdjustments, [{
              name: "Mixed Optimization",
              description: "Balanced optimization across all parameters",
              adjustments: scenario.requiredAdjustments,
              results: scenario.adjustedResults,
              approachType: 'balanced' as const,
              totalAdjustment: 0
            }]);
            if (sheet) {
              XLSX.utils.book_append_sheet(workbook, sheet, sheetName.substring(0, 31));
              console.log(`Created sheet: ${sheetName}`);
            }
          }
        }
      } catch (error) {
        console.error(`Error creating sheets for ${moicKey}:`, error);
      }
    });

    // Save the file
    try {
      XLSX.writeFile(workbook, sensitivityFileName || 'parameter_comparison_analysis.xlsx');
      console.log('Parameter comparison analysis exported successfully');
      setShowSensitivityExportDialog(false);
    } catch (error) {
      console.error('Error exporting parameter comparison analysis:', error);
      alert('Error exporting file. Please try again.');
    }
  };

  const exportToExcel = () => {
    const workbook = XLSX.utils.book_new();

    // Calculate totalFollowOnInvested first to avoid reference errors
    const totalFollowOnInvested = investments.reduce((sum, inv) => {
      if (!results.simulations?.length) return sum;
      return sum + (results.simulations[0].find(r => r.investmentId === inv.id)?.followOnInvestments?.reduce((s, fo) => s + fo.amount, 0) || 0);
    }, 0);

    // Helper function to get professional, non-flashy performance colors
    const getPerformanceColor = (moic: number) => {
      if (moic >= 5) return "2E7D32"; // Professional Dark Green - Exceptional
      if (moic >= 3) return "388E3C"; // Professional Green - Great  
      if (moic >= 2) return "66BB6A"; // Soft Green - Good
      if (moic >= 1) return "FFF9C4"; // Soft Light Yellow - Break-even
      if (moic >= 0.5) return "FFB74D"; // Soft Orange - Poor
      return "E57373"; // Soft Red - Very Poor
    };

    const getPerformanceText = (moic: number) => {
      if (moic >= 5) return "EXCEPTIONAL";
      if (moic >= 3) return "GREAT";
      if (moic >= 2) return "GOOD";
      if (moic >= 1) return "BREAK-EVEN";
      if (moic >= 0.5) return "POOR";
      return "LOSS";
    };

    // Helper function to get professional sheet colors
    const getSheetColors = () => ({
      summary: "E3F2FD", // Light Blue
      fundInputs: "F3E5F5", // Light Purple  
      assumptions: "E8F5E8", // Light Green
      allOutcomes: "FFF3E0", // Light Orange
      avgOutcomes: "F1F8E9", // Very Light Green
      statistics: "FCE4EC" // Light Pink
    });

    const sheetColors = getSheetColors();

    // Helper to format tables: auto-width, header styling, zebra stripes, borders, freeze panes
    const applyTableFormatting = (
      sheet: any,
      data: any[][],
      headerRowIdx: number,
      headerFillColor: string
    ) => {
      const border = { style: 'thin', color: { rgb: 'CCCCCC' } };

      const colCount = data[headerRowIdx]?.length || 0;
      const cols: { wch: number }[] = Array.from({ length: colCount }, () => ({ wch: 10 }));

      for (let r = headerRowIdx; r < data.length; r++) {
        for (let c = 0; c < colCount; c++) {
          const cellRef = XLSX.utils.encode_cell({ r, c });
          if (!sheet[cellRef]) continue;

          // Auto width calculation
          const cellValue = sheet[cellRef].v != null ? String(sheet[cellRef].v) : '';
          cols[c].wch = Math.min(Math.max(cols[c].wch, cellValue.length + 2), 40);

          // Apply styles
          const isHeader = r === headerRowIdx;
          const fillColor = isHeader
            ? headerFillColor
            : r % 2 === 0
              ? 'FFFFFF' // even rows white
              : 'F5F5F5'; // odd rows light grey

          sheet[cellRef].s = {
            ...sheet[cellRef].s,
            font: {
              bold: isHeader,
              color: { rgb: isHeader ? '000000' : '000000' }
            },
            alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
            fill: { fgColor: { rgb: fillColor } },
            border: { top: border, bottom: border, left: border, right: border }
          };
        }
      }

      (sheet as any)['!cols'] = cols;
      (sheet as any)['!freeze'] = { xSplit: 0, ySplit: headerRowIdx + 1 };
    };

    // Add sheets based on selection
    if(selectedSheets.summary){
      // Summary Sheet with enhanced styling
      const summaryData = [
        ["VC PORTFOLIO SIMULATION RESULTS", "", "", ""],
        ["Generated on:", new Date().toLocaleString(), "", ""],
        ["", "", "", ""],
        ["FUND PERFORMANCE SUMMARY", "", "", ""],
        ["Total Fund Size:", `$${results.totalPaidIn.toFixed(1)}MM`, "", ""],
        ["Average Distributed:", `$${results.avgDistributed.toFixed(1)}MM`, "", ""],
        ["Average MOIC:", `${results.avgMOIC.toFixed(2)}x`, getPerformanceText(results.avgMOIC), ""],
        ["Average IRR:", `${results.avgIRR?.toFixed(1) || 'N/A'}%`, "", ""],
        ["Success Rate:", `${results.successRate.toFixed(1)}%`, results.successRate >= 60 ? "EXCELLENT" : results.successRate >= 40 ? "GOOD" : "NEEDS IMPROVEMENT", ""],
        ["Number of Simulations:", results.simulations.length.toString(), "", ""],
        ...(results.avgTotalInvested ? [["Average Total Invested:", `$${results.avgTotalInvested.toFixed(1)}MM`, "", ""]] : []),
        ...(results.totalRecycledCapital ? [["Average Recycled Capital:", `$${results.totalRecycledCapital.toFixed(1)}MM`, "", ""]] : []),
        ["Capital Invested - Initial Checks:", `$${(results.totalPaidIn - totalFollowOnInvested).toFixed(1)}MM`, "", ""],
        ["Capital Invested - Follow-ons:", `$${totalFollowOnInvested.toFixed(1)}MM`, "", ""],
      ];

      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      
      // Enhanced styling for summary sheet with professional colors
      summarySheet['A1'] = { v: "VC PORTFOLIO SIMULATION RESULTS", t: 's', s: { 
        font: { bold: true, sz: 18, color: { rgb: "000000" } }, 
        fill: { fgColor: { rgb: sheetColors.summary } },
        alignment: { horizontal: "center" }
      }};
      
      // merge banner across 4 cols
      (summarySheet as any)['!merges'] = [{ s: { r:0, c:0 }, e: { r:0, c:3 }}];
      
      // Color code MOIC performance
      if (summarySheet['C7']) {
        summarySheet['C7'].s = {
          font: { bold: true, color: { rgb: "000000" } },
          fill: { fgColor: { rgb: getPerformanceColor(results.avgMOIC) } }
        };
      }
      
      // Color code success rate with professional colors
      if (summarySheet['C9']) {
        const successColor = results.successRate >= 60 ? "2E7D32" : results.successRate >= 40 ? "388E3C" : "E57373";
        summarySheet['C9'].s = {
          font: { bold: true, color: { rgb: "FFFFFF" } },
          fill: { fgColor: { rgb: successColor } }
        };
      }
      
      XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");
    }

    if(selectedSheets.fundInputs){
      // Fund Inputs Sheet
      const totalInvestments = investments.reduce((sum, inv) => sum + inv.checkSize, 0);
      const totalFees = params ? params.setupFees + params.managementFees * params.managementFeeYears : 0;
      const fundInputsData = [
        ["FUND INPUTS", "", "", ""],
        ["", "", "", ""],
        ["Fees", "", "", ""],
        ...(params ? [
          ["Setup Fees ($MM):", params.setupFees.toFixed(2), "", ""],
          ["Management Fees (% per yr):", params.managementFees.toFixed(2), "", ""],
          ["Management Fee Years:", params.managementFeeYears.toString(), "", ""],
          ["Total Fees ($MM):", totalFees.toFixed(2), "", ""],
        ] : []),
        ["", "", "", ""],
        ["Portfolio Composition", "", "", ""],
        ["Number of Investments:", investments.length.toString(), "", ""],
        ["Total Investment Amount:", `$${totalInvestments.toFixed(1)}MM`, "", ""],
        ["Capital Invested - Initial Checks:", `$${(totalInvestments-totalFollowOnInvested).toFixed(1)}MM`, "", ""],
        ["Capital Invested - Follow-ons:", `$${totalFollowOnInvested.toFixed(1)}MM`, "", ""],
        ["", "", "", ""],
        ["Simulation Parameters", "", "", ""],
        ["Number of Simulations:", results.simulations.length.toString(), "", ""],
        ["", "", "", ""],
        ["Portfolio Companies", "", "", ""],
        ["Company Name", "Field", "Region", "Entry Stage", "Check Size ($MM)", "Entry Valuation ($MM)", "Entry Date"],
        ...investments.map(inv => [
          inv.companyName,
          inv.field,
          inv.region,
          inv.entryStage,
          inv.checkSize.toFixed(2),
          inv.entryValuation.toFixed(2),
          inv.entryDate
        ])
      ];

      const fundInputsSheet = XLSX.utils.aoa_to_sheet(fundInputsData);
      fundInputsSheet['A1'] = { v: "FUND INPUTS", t: 's', s: { 
        font: { bold: true, sz: 16, color: { rgb: "000000" } }, 
        fill: { fgColor: { rgb: sheetColors.fundInputs } }
      }};

      // Style the table headers
      const headerRow = params ? 15 : 10; // adjust index if fees rows added
      for (let col = 0; col < 7; col++) {
        const cellRef = XLSX.utils.encode_cell({ r: headerRow, c: col });
        if (fundInputsSheet[cellRef]) {
          fundInputsSheet[cellRef].s = {
            font: { bold: true, color: { rgb: "000000" } },
            fill: { fgColor: { rgb: sheetColors.fundInputs } }
          };
        }
      }
      
      (fundInputsSheet as any)["!freeze"] = { xSplit: 0, ySplit: 1 };
      
      // Apply enhanced table formatting
      applyTableFormatting(fundInputsSheet, fundInputsData, headerRow, sheetColors.fundInputs);
      
      XLSX.utils.book_append_sheet(workbook, fundInputsSheet, "Fund Inputs");
    }

    if(selectedSheets.assumptions){
      // Investment Assumptions Sheet
      const assumptionsData = [
        ["INVESTMENT ASSUMPTIONS", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["Company", "Stage Progression (%)", "", "", "", "", "Dilution Rates (%)", ""],
        ["", "To Seed", "To Series A", "To Series B", "To Series C", "To IPO", "Seed", "Series A", "Series B", "Series C", "IPO"],
        ...investments.map(inv => [
          inv.companyName,
          inv.stageProgression.toSeed || 0,
          inv.stageProgression.toSeriesA || 0,
          inv.stageProgression.toSeriesB || 0,
          inv.stageProgression.toSeriesC || 0,
          inv.stageProgression.toIPO || 0,
          inv.dilutionRates.seed || 0,
          inv.dilutionRates.seriesA || 0,
          inv.dilutionRates.seriesB || 0,
          inv.dilutionRates.seriesC || 0,
          inv.dilutionRates.ipo || 0
        ]),
        ["", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["Exit Valuation Ranges ($MM)", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["Company", "Pre-Seed Min", "Pre-Seed Max", "Seed Min", "Seed Max", "Series A Min", "Series A Max", "Series B Min", "Series B Max", "Series C Min", "Series C Max", "IPO Min", "IPO Max"],
        ...investments.map(inv => [
          inv.companyName,
          inv.exitValuations.preSeed[0],
          inv.exitValuations.preSeed[1],
          inv.exitValuations.seed[0],
          inv.exitValuations.seed[1],
          inv.exitValuations.seriesA[0],
          inv.exitValuations.seriesA[1],
          inv.exitValuations.seriesB[0],
          inv.exitValuations.seriesB[1],
          inv.exitValuations.seriesC[0],
          inv.exitValuations.seriesC[1],
          inv.exitValuations.ipo[0],
          inv.exitValuations.ipo[1]
        ]),
        ["", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["Loss Probabilities (%)", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["Company", "Pre-Seed", "Seed", "Series A", "Series B", "Series C", "IPO", "", "", "", "", "", "", ""],
        ...investments.map(inv => [
          inv.companyName,
          inv.lossProb.preSeed,
          inv.lossProb.seed,
          inv.lossProb.seriesA,
          inv.lossProb.seriesB,
          inv.lossProb.seriesC,
          inv.lossProb.ipo,
          "", "", "", "", "", "", ""
        ])
      ];

      const assumptionsSheet = XLSX.utils.aoa_to_sheet(assumptionsData);
      assumptionsSheet['A1'] = { v: "INVESTMENT ASSUMPTIONS", t: 's', s: { 
        font: { bold: true, sz: 16, color: { rgb: '000000' } },
        fill: { fgColor: { rgb: sheetColors.assumptions } }
      }};

      // Style table headers for different sections
      const sectionHeaders = [
        { row: 2, cols: 11, title: "Stage Progression & Dilution" },
        { row: investments.length + 5, cols: 13, title: "Exit Valuation Ranges" },
        { row: investments.length * 2 + 8, cols: 7, title: "Loss Probabilities" }
      ];

      sectionHeaders.forEach(section => {
        for (let col = 0; col < section.cols; col++) {
          const cellRef = XLSX.utils.encode_cell({ r: section.row, c: col });
          if (assumptionsSheet[cellRef]) {
            assumptionsSheet[cellRef].s = {
              font: { bold: true, color: { rgb: "000000" } },
              fill: { fgColor: { rgb: sheetColors.assumptions } }
            };
          }
        }
      });
      
      // Apply enhanced table formatting (header row index 2)
      applyTableFormatting(assumptionsSheet, assumptionsData, 2, sheetColors.assumptions);
      
      XLSX.utils.book_append_sheet(workbook, assumptionsSheet, "Investment Assumptions");
    }

    // All Simulations Results Sheet with enhanced coloring
    const allSimulationsData = [
      ["ALL SIMULATION OUTCOMES", "", "", "", "", "", "", "", "", "", ""],
      ["", "", "", "", "", "", "", "", "", "", ""],
      ["Simulation #", "Company", "Exit Stage", "Entry Amount ($MM)", "Follow-ons ($MM)", "Exit Amount ($MM)", "MOIC", "Performance", "Initial Ownership (%)", "Final Ownership (%)", "Holding Period (Years)"],
    ];

    results.simulations.forEach((simulation, simIndex) => {
      simulation.forEach(result => {
        const followOnAmount = result.followOnInvestments ? 
          result.followOnInvestments.reduce((sum, fo) => sum + fo.amount, 0) : 0;
        
        allSimulationsData.push([
          (simIndex + 1).toString(),
          result.companyName,
          result.exitStage,
          result.entryAmount.toFixed(2),
          followOnAmount.toFixed(2),
          result.exitAmount.toFixed(2),
          result.moic.toFixed(2),
          getPerformanceText(result.moic),
          result.initialOwnership.toFixed(1),
          result.finalOwnership.toFixed(1),
          result.holdingPeriod.toFixed(1)
        ]);
      });
    });

    const outcomesSheet = XLSX.utils.aoa_to_sheet(allSimulationsData);
    outcomesSheet['A1'] = { v: "ALL SIMULATION OUTCOMES", t: 's', s: {
      font: { bold: true, sz: 16, color: { rgb: '000000' } },
      fill: { fgColor: { rgb: sheetColors.allOutcomes } }
    }};

    // Apply table formatting (header row is index 2)
    applyTableFormatting(outcomesSheet, allSimulationsData, 2, sheetColors.allOutcomes);

    // Apply conditional formatting to MOIC column (column G)
    for (let i = 4; i < allSimulationsData.length; i++) {
      const moic = parseFloat(allSimulationsData[i][6] as string);
      const cellRef = XLSX.utils.encode_cell({ r: i, c: 6 });
      const perfRef = XLSX.utils.encode_cell({ r: i, c: 7 });
      
      if (outcomesSheet[cellRef]) {
        outcomesSheet[cellRef].s = {
          font: { bold: true, color: { rgb: "000000" } },
          fill: { fgColor: { rgb: getPerformanceColor(moic) } }
        };
      }
      
      if (outcomesSheet[perfRef]) {
        outcomesSheet[perfRef].s = {
          font: { bold: true, color: { rgb: "000000" } },
          fill: { fgColor: { rgb: getPerformanceColor(moic) } }
        };
      }
    }
    
    if(selectedSheets.allOutcomes){
      XLSX.utils.book_append_sheet(workbook, outcomesSheet, "All Outcomes");
    }

    // Average Outcome Sheet
    const companyStats: { [key: string]: { 
      totalEntryAmount: number; 
      totalFollowOns: number; 
      totalExitAmount: number; 
      totalMOIC: number; 
      totalInitialOwnership: number; 
      totalFinalOwnership: number; 
      totalHoldingPeriod: number; 
      count: number;
      exitStages: string[];
    } } = {};

    // Calculate averages for each company
    results.simulations.forEach(simulation => {
      simulation.forEach(result => {
        if (!companyStats[result.companyName]) {
          companyStats[result.companyName] = {
            totalEntryAmount: 0,
            totalFollowOns: 0,
            totalExitAmount: 0,
            totalMOIC: 0,
            totalInitialOwnership: 0,
            totalFinalOwnership: 0,
            totalHoldingPeriod: 0,
            count: 0,
            exitStages: []
          };
        }
        
        const followOnAmount = result.followOnInvestments ? 
          result.followOnInvestments.reduce((sum, fo) => sum + fo.amount, 0) : 0;
        
        const stats = companyStats[result.companyName];
        stats.totalEntryAmount += result.entryAmount;
        stats.totalFollowOns += followOnAmount;
        stats.totalExitAmount += result.exitAmount;
        stats.totalMOIC += result.moic;
        stats.totalInitialOwnership += result.initialOwnership;
        stats.totalFinalOwnership += result.finalOwnership;
        stats.totalHoldingPeriod += result.holdingPeriod;
        stats.exitStages.push(result.exitStage);
        stats.count++;
      });
    });

    const averageOutcomeData = [
      ["AVERAGE OUTCOMES BY COMPANY", "", "", "", "", "", "", "", "", ""],
      ["", "", "", "", "", "", "", "", "", ""],
      ["Company", "Avg Entry ($MM)", "Avg Follow-ons ($MM)", "Avg Exit ($MM)", "Avg MOIC", "Performance", "Avg Initial Own. (%)", "Avg Final Own. (%)", "Avg Hold Period (Years)", "Most Common Exit Stage"],
    ];

    Object.entries(companyStats).forEach(([companyName, stats]) => {
      const avgMOIC = stats.totalMOIC / stats.count;
      const mostCommonStage = stats.exitStages.reduce((a, b, i, arr) =>
        arr.filter(v => v === a).length >= arr.filter(v => v === b).length ? a : b
      );
      
      averageOutcomeData.push([
        companyName,
        (stats.totalEntryAmount / stats.count).toFixed(2),
        (stats.totalFollowOns / stats.count).toFixed(2),
        (stats.totalExitAmount / stats.count).toFixed(2),
        avgMOIC.toFixed(2),
        getPerformanceText(avgMOIC),
        (stats.totalInitialOwnership / stats.count).toFixed(1),
        (stats.totalFinalOwnership / stats.count).toFixed(1),
        (stats.totalHoldingPeriod / stats.count).toFixed(1),
        mostCommonStage
      ]);
    });

    const averageOutcomeSheet = XLSX.utils.aoa_to_sheet(averageOutcomeData);
    averageOutcomeSheet['A1'] = { v: "AVERAGE OUTCOMES BY COMPANY", t: 's', s: {
      font: { bold: true, sz: 16, color: { rgb: '000000' } },
      fill: { fgColor: { rgb: sheetColors.avgOutcomes } }
    }};

    // Apply table formatting (header row is index 2)
    applyTableFormatting(averageOutcomeSheet, averageOutcomeData, 2, sheetColors.avgOutcomes);

    // Apply conditional formatting to average MOIC column (column E)
    for (let i = 3; i < averageOutcomeData.length; i++) {
      const moic = parseFloat(averageOutcomeData[i][4] as string);
      const cellRef = XLSX.utils.encode_cell({ r: i, c: 4 });
      const perfRef = XLSX.utils.encode_cell({ r: i, c: 5 });
      
      if (averageOutcomeSheet[cellRef]) {
        averageOutcomeSheet[cellRef].s = {
          font: { bold: true, color: { rgb: "000000" } },
          fill: { fgColor: { rgb: getPerformanceColor(moic) } }
        };
      }
      
      if (averageOutcomeSheet[perfRef]) {
        averageOutcomeSheet[perfRef].s = {
          font: { bold: true, color: { rgb: "000000" } },
          fill: { fgColor: { rgb: getPerformanceColor(moic) } }
        };
      }
    }
    
    if(selectedSheets.avgOutcomes){
      XLSX.utils.book_append_sheet(workbook, averageOutcomeSheet, "Average Outcomes");
    }

    // Statistics Sheet
    const moicValues = results.simulations.map(sim => 
      sim.reduce((sum, result) => sum + result.exitAmount, 0) / 
      sim.reduce((sum, result) => sum + result.entryAmount, 0)
    ).filter(val => isFinite(val) && !isNaN(val));
    
    const sortedMoic = [...moicValues].sort((a, b) => a - b);
    const p25 = sortedMoic[Math.floor(sortedMoic.length * 0.25)] || 0;
    const p50 = sortedMoic[Math.floor(sortedMoic.length * 0.5)] || 0;
    const p75 = sortedMoic[Math.floor(sortedMoic.length * 0.75)] || 0;
    const p90 = sortedMoic[Math.floor(sortedMoic.length * 0.9)] || 0;

    const statisticsData = [
      ["DETAILED STATISTICS", "", "", ""],
      ["", "", "", ""],
      ["MOIC Distribution", "", "", ""],
      ["Average MOIC:", `${results.avgMOIC.toFixed(2)}x`, "", ""],
      ["25th Percentile:", `${p25.toFixed(2)}x`, "", ""],
      ["Median (50th):", `${p50.toFixed(2)}x`, "", ""],
      ["75th Percentile:", `${p75.toFixed(2)}x`, "", ""],
      ["90th Percentile:", `${p90.toFixed(2)}x`, "", ""],
      ["", "", "", ""],
      ["Success Metrics", "", "", ""],
      ["Simulations with MOIC > 1x:", `${moicValues.filter(m => m > 1).length} (${((moicValues.filter(m => m > 1).length / moicValues.length) * 100).toFixed(1)}%)`, "", ""],
      ["Simulations with MOIC > 2x:", `${moicValues.filter(m => m > 2).length} (${((moicValues.filter(m => m > 2).length / moicValues.length) * 100).toFixed(1)}%)`, "", ""],
      ["Simulations with MOIC > 3x:", `${moicValues.filter(m => m > 3).length} (${((moicValues.filter(m => m > 3).length / moicValues.length) * 100).toFixed(1)}%)`, "", ""],
      ["Simulations with MOIC > 5x:", `${moicValues.filter(m => m > 5).length} (${((moicValues.filter(m => m > 5).length / moicValues.length) * 100).toFixed(1)}%)`, "", ""],
    ];

    const statisticsSheet = XLSX.utils.aoa_to_sheet(statisticsData);
    statisticsSheet['A1'] = { v: "DETAILED STATISTICS", t: 's', s: { 
      font: { bold: true, sz: 16, color: { rgb: '000000' } }, 
      fill: { fgColor: { rgb: sheetColors.statistics } }
    }};

    // Color code the percentile values
    const percentileRows = [4, 5, 6, 7, 8]; // 25th, Median, 75th, 90th percentiles
    percentileRows.forEach(row => {
      const cellRef = XLSX.utils.encode_cell({ r: row, c: 1 });
      if (statisticsSheet[cellRef] && typeof statisticsSheet[cellRef].v === 'string') {
        const moicMatch = (statisticsSheet[cellRef].v as string).match(/(\d+\.?\d*)x/);
        if (moicMatch) {
          const moic = parseFloat(moicMatch[1]);
          statisticsSheet[cellRef].s = {
            font: { bold: true, color: { rgb: '000000' } },
            fill: { fgColor: { rgb: getPerformanceColor(moic) } }
          };
        }
      }
    });

    // Color code success metrics with professional colors
    const successRows = [11, 12, 13, 14]; // Success rate rows
    successRows.forEach(row => {
      const cellRef = XLSX.utils.encode_cell({ r: row, c: 1 });
      if (statisticsSheet[cellRef] && typeof statisticsSheet[cellRef].v === 'string') {
        const percentMatch = (statisticsSheet[cellRef].v as string).match(/\((\d+\.?\d*)%\)/);
        if (percentMatch) {
          const percent = parseFloat(percentMatch[1]);
          const color = percent >= 50 ? "2E7D32" : percent >= 30 ? "388E3C" : percent >= 15 ? "FFB74D" : "E57373";
          statisticsSheet[cellRef].s = {
            font: { bold: true, color: { rgb: "000000" } },
            fill: { fgColor: { rgb: color } }
          };
        }
      }
    });
    
    // Apply enhanced table formatting (header row index 2)
    applyTableFormatting(statisticsSheet, statisticsData, 2, sheetColors.statistics);
    
    if(selectedSheets.statistics){
      XLSX.utils.book_append_sheet(workbook, statisticsSheet, "Statistics");
    }

    XLSX.writeFile(workbook, fileName || 'simulation_results.xlsx');
  };

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

  // Calculate MOIC distribution buckets
  const moicBuckets = Array.from({ length: 10 }, (_, i) => ({
    range: `${i}x-${i + 1}x`,
    count: 0
  }));

  results.simulations.forEach(sim => {
    const totalMOIC = sim.reduce((sum, result) => sum + result.exitAmount, 0) / 
                     sim.reduce((sum, result) => sum + result.entryAmount, 0);
    
    // Add safety checks for invalid values
    if (isNaN(totalMOIC) || !isFinite(totalMOIC) || totalMOIC < 0) {
      moicBuckets[0].count++; // Put invalid values in 0x-1x bucket
      return;
    }
    
    // Cap extremely high values to prevent unrealistic peaks
    const cappedMOIC = Math.min(totalMOIC, 10);
    const bucket = Math.min(Math.floor(cappedMOIC), 9);
    moicBuckets[bucket].count++;
  });

  // Calculate average returns by stage
  const stageReturns: { [key: string]: { totalReturn: number; count: number } } = {};
  
  results.simulations.forEach(sim => {
    sim.forEach(result => {
      const stage = result.exitStage;
      if (!stageReturns[stage]) {
        stageReturns[stage] = { totalReturn: 0, count: 0 };
      }
      stageReturns[stage].totalReturn += result.moic;
      stageReturns[stage].count += 1;
    });
  });

  const stageOrder = ['Pre-Seed', 'Seed', 'Series A', 'Series B', 'Series C', 'IPO'];

  const avgReturnsByStage = stageOrder.map(stage => {
    const data = stageReturns[stage] || { totalReturn: 0, count: 0 };
    return {
      stage,
      avgReturn: data.count > 0 ? data.totalReturn / data.count : 0
    };
  });

  const currentSimulationData = results.simulations[currentSimulation] || [];

  const nextSimulation = () => {
    setCurrentSimulation(prev => Math.min(prev + 1, results.simulations.length - 1));
  };

  const prevSimulation = () => {
    setCurrentSimulation(prev => Math.max(prev - 1, 0));
  };

  return (
    <div className="space-y-6">
      {/* Action Buttons */}
      <div className="flex justify-start items-center">
        <div className="flex gap-2">
          {params && (
            <div className="space-y-2">
              <div className="flex gap-2">
                <Button 
                  onClick={runSensitivityAnalysisHandler}
                  disabled={isRunningAnalysis}
                  className={`
                    relative overflow-hidden
                    bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 
                    hover:from-blue-700 hover:via-purple-700 hover:to-pink-700
                    text-white gap-2 px-6 py-3
                    transition-all duration-300 ease-in-out
                    transform hover:scale-105 hover:shadow-2xl
                    shadow-lg shadow-blue-500/25
                    before:absolute before:inset-0 
                    before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent
                    before:translate-x-[-100%] hover:before:translate-x-[100%]
                    before:transition-transform before:duration-700
                    after:absolute after:inset-0
                    after:bg-gradient-to-r after:from-blue-600 after:via-purple-600 after:to-pink-600
                    after:opacity-0 hover:after:opacity-100
                    after:animate-pulse after:transition-opacity after:duration-500
                    ${isRunningAnalysis ? 'animate-pulse shadow-blue-500/50' : 'animate-glow'}
                    disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                    disabled:shadow-none disabled:hover:scale-100
                  `}
                  style={{
                    boxShadow: isRunningAnalysis 
                      ? '0 0 30px rgba(59, 130, 246, 0.6), 0 0 60px rgba(147, 51, 234, 0.4)' 
                      : '0 0 20px rgba(59, 130, 246, 0.3), 0 0 40px rgba(147, 51, 234, 0.2)',
                    animation: isRunningAnalysis 
                      ? 'glow-pulse 2s ease-in-out infinite'
                      : 'glow-wave 3s ease-in-out infinite'
                  }}
                  type="button"
                >
                  <div className="relative z-10 flex items-center gap-2">
                    {isRunningAnalysis ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Zap className="w-5 h-5 animate-bounce" />
                    )}
                    <span className="font-semibold">
                      {isRunningAnalysis ? 'Running Analysis...' : 'Run Sensitivity Analysis'}
                    </span>
                  </div>
                  
                  {/* Particules d'énergie */}
                  {!isRunningAnalysis && (
                    <>
                      <div className="absolute top-1 left-1/4 w-1 h-1 bg-white rounded-full opacity-70 animate-ping" style={{ animationDelay: '0s' }} />
                      <div className="absolute top-3 right-1/4 w-0.5 h-0.5 bg-white rounded-full opacity-60 animate-ping" style={{ animationDelay: '0.5s' }} />
                      <div className="absolute bottom-2 left-1/3 w-0.5 h-0.5 bg-white rounded-full opacity-50 animate-ping" style={{ animationDelay: '1s' }} />
                      <div className="absolute bottom-1 right-1/3 w-1 h-1 bg-white rounded-full opacity-40 animate-ping" style={{ animationDelay: '1.5s' }} />
                    </>
                  )}
                </Button>
                <Button 
                  onClick={()=>setShowExportDialog(true)}
                  className="bg-black hover:bg-gray-800 text-white gap-2"
                  type="button"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  Export to Excel
                </Button>
                <Button 
                  onClick={()=>setShowSensitivityExportDialog(true)}
                  disabled={!sensitivityAnalysis}
                  className="bg-green-600 hover:bg-green-700 text-white gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  type="button"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  Export Sensitivity Analysis
                </Button>
              </div>
              {isRunningAnalysis && (
                <div className="w-60 space-y-1">
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>{analysisProgress.step || 'Processing...'}</span>
                    <span>{Math.round(analysisProgress.progress || 0)}%</span>
                  </div>
                  <Progress value={analysisProgress.progress || 0} className="h-2" />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="base-results">Base Results</TabsTrigger>
          <TabsTrigger value="forecast-analysis">Portfolio Forecast</TabsTrigger>
          <TabsTrigger value="sensitivity-analysis" disabled={!sensitivityAnalysis}>
            Sensitivity Analysis
          </TabsTrigger>
        </TabsList>

        <TabsContent value="base-results" className="space-y-6">

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-2xl font-bold text-blue-600">
              ${results.totalPaidIn.toFixed(1)}MM
            </div>
            <div className="text-sm text-slate-600">Total Fund Size</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-2xl font-bold text-green-600">
              ${results.avgDistributed.toFixed(1)}MM
            </div>
            <div className="text-sm text-slate-600">Avg Distributed</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {results.avgMOIC.toFixed(2)}x
            </div>
            <div className="text-sm text-slate-600">Avg MOIC</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-2xl font-bold text-orange-600">
              {results.successRate.toFixed(1)}%
            </div>
            <div className="text-sm text-slate-600">Success Rate</div>
          </CardContent>
        </Card>
        
        {results.avgTotalInvested && (
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-indigo-600">
                ${results.avgTotalInvested.toFixed(1)}MM
              </div>
              <div className="text-sm text-slate-600">Avg Total Invested</div>
            </CardContent>
          </Card>
        )}
        
        {results.totalRecycledCapital && results.totalRecycledCapital > 0 && (
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-teal-600">
                ${results.totalRecycledCapital.toFixed(1)}MM
              </div>
              <div className="text-sm text-slate-600">Avg Recycled</div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Fund MOIC Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Fund MOIC Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={moicBuckets}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="range" />
              <YAxis />
              <Tooltip 
                formatter={(value: number) => [value, 'Count']}
              />
              <Bar dataKey="count" fill="#8b5cf6" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Average Returns by Stage */}
      <Card>
        <CardHeader>
          <CardTitle>Average Returns by Stage</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={avgReturnsByStage}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="stage" />
              <YAxis />
              <Tooltip 
                formatter={(value: number) => [`${value.toFixed(2)}x`, 'Avg Return']}
              />
              <Bar dataKey="avgReturn" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Investment Performance - with navigation */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Investment Performance</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={prevSimulation}
                disabled={currentSimulation === 0}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm text-slate-600">
                Simulation {currentSimulation + 1} of {results.simulations.length}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={nextSimulation}
                disabled={currentSimulation === results.simulations.length - 1}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={currentSimulationData.slice(0, 20)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="companyName" />
              <YAxis />
              <Tooltip 
                formatter={(value: number, name: string) => [
                  `$${value.toFixed(2)}MM`, 
                  name === 'entryAmount' ? 'Entry' : 'Exit'
                ]}
              />
              <Bar dataKey="entryAmount" fill="#3b82f6" name="Entry Amount" />
              <Bar dataKey="exitAmount" fill="#10b981" name="Exit Amount" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Simulation Details - with navigation */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Simulation Details</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={prevSimulation}
                disabled={currentSimulation === 0}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm text-slate-600">
                Simulation {currentSimulation + 1} of {results.simulations.length}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={nextSimulation}
                disabled={currentSimulation === results.simulations.length - 1}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 p-3 bg-slate-50 rounded-lg">
            <div className="text-sm font-medium mb-2">Legend:</div>
            <div className="flex flex-wrap gap-4 text-xs text-slate-600">
              <div className="flex items-center gap-1">
                <Rocket className="w-3 h-3 text-orange-500" />
                <span>High Performer (2x+ MOIC)</span>
              </div>
              <div className="flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-blue-500" />
                <span>Received Follow-on</span>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Company</th>
                  <th className="text-left py-2">Exit Stage</th>
                  <th className="text-right py-2">Entry ($MM)</th>
                  <th className="text-right py-2">Follow-ons ($MM)</th>
                  <th className="text-right py-2">Exit ($MM)</th>
                  <th className="text-right py-2">MOIC</th>
                  <th className="text-right py-2">Initial Own.</th>
                  <th className="text-right py-2">Final Own.</th>
                  <th className="text-right py-2">Hold Period</th>
                </tr>
              </thead>
              <tbody>
                {currentSimulationData.map((result, index) => (
                  <tr key={index} className="border-b hover:bg-slate-50">
                    <td className="py-2 flex items-center gap-2">
                      {result.moic >= 2 && (
                        <Rocket className="w-4 h-4 text-orange-500" />
                      )}
                      {result.followOnInvestments && result.followOnInvestments.length > 0 && (
                        <span title="Received Follow-on Investment">
                          <TrendingUp className="w-4 h-4 text-blue-500" />
                        </span>
                      )}
                      {result.companyName}
                    </td>
                    <td className="py-2">
                      <Badge variant="outline" className={getStageColor(result.exitStage).badge}>
                        <span className={`inline-block w-2 h-2 rounded-full mr-2 align-middle ${getStageColor(result.exitStage).dot}`}></span>
                        {result.exitStage}
                      </Badge>
                    </td>
                    <td className="py-2 text-right font-mono">
                      ${result.entryAmount.toFixed(2)}
                    </td>
                    <td className="py-2 text-right font-mono text-sm">
                      {result.followOnInvestments && result.followOnInvestments.length > 0 ? (
                        <div className="space-y-1">
                          <div className="text-xs text-slate-600">
                            {result.followOnInvestments.length} rounds
                          </div>
                          <div className="text-xs">
                            ${result.followOnInvestments.reduce((sum, fo) => sum + fo.amount, 0).toFixed(2)}
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-2 text-right font-mono">
                      ${result.exitAmount.toFixed(2)}
                    </td>
                    <td className="py-2 text-right font-mono">
                      <span className={result.moic >= 1 ? 'text-green-600' : 'text-red-600'}>
                        {result.moic.toFixed(2)}x
                      </span>
                    </td>
                    <td className="py-2 text-right font-mono">
                      {result.initialOwnership.toFixed(1)}%
                    </td>
                    <td className="py-2 text-right font-mono">
                      {result.finalOwnership.toFixed(1)}%
                    </td>
                    <td className="py-2 text-right">
                      {result.holdingPeriod.toFixed(1)} yrs
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
        </TabsContent>

        <TabsContent value="sensitivity-analysis" className="space-y-6">
          {sensitivityAnalysis ? (
            <SensitivityAnalysisDashboard 
              analysis={sensitivityAnalysis}
              onExportResults={() => setShowExportDialog(true)}
              investments={investments}
            />
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Zap className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Run Sensitivity Analysis
                </h3>
                <p className="text-gray-600 mb-4">
                  Discover what assumptions you need to achieve higher MOIC targets.
                </p>
                <Button 
                  onClick={runSensitivityAnalysisHandler}
                  disabled={isRunningAnalysis || !params}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 relative overflow-hidden"
                  type="button"
                >
                  {isRunningAnalysis ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {Math.round(analysisProgress.progress || 0)}%
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      Run Sensitivity Analysis
                    </>
                  )}
                  
                  {/* Particules d'énergie */}
                  {!isRunningAnalysis && (
                    <>
                      <div className="absolute top-1 left-1/4 w-1 h-1 bg-white rounded-full opacity-70 animate-ping" style={{ animationDelay: '0s' }} />
                      <div className="absolute top-3 right-1/4 w-0.5 h-0.5 bg-white rounded-full opacity-60 animate-ping" style={{ animationDelay: '0.5s' }} />
                      <div className="absolute bottom-2 left-1/3 w-0.5 h-0.5 bg-white rounded-full opacity-50 animate-ping" style={{ animationDelay: '1s' }} />
                      <div className="absolute bottom-1 right-1/3 w-1 h-1 bg-white rounded-full opacity-40 animate-ping" style={{ animationDelay: '1.5s' }} />
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="forecast-analysis" className="space-y-6">
          <ForecastDashboard
            portfolioData={investments}
            simulationParams={params || {
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
            }}
            onClose={() => {}}
          />
        </TabsContent>
      </Tabs>

      {/* Export Dialog */}
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Export Simulation to Excel</DialogTitle>
            <DialogDescription>Select sheets to include ("All Outcomes" can be large) and file name.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Label htmlFor="fileName">File name</Label>
            <Input id="fileName" value={fileName} onChange={e=>setFileName(e.target.value)} />
            <div className="space-y-2">
              {[
                ['summary','Summary'],
                ['fundInputs','Fund Inputs'],
                ['assumptions','Assumptions'],
                ['allOutcomes','All Outcomes (large)'],
                ['avgOutcomes','Average Outcomes'],
                ['statistics','Statistics']
              ].map(([key,label])=> (
                <div key={key} className="flex items-center gap-2">
                  <Checkbox id={key} checked={selectedSheets[key as string]} onCheckedChange={()=>toggleSheet(key as string)} />
                  <Label htmlFor={key}>{label}</Label>
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={()=>setShowExportDialog(false)}>Cancel</Button>
              <Button onClick={()=>{exportToExcel(); setShowExportDialog(false);}}>Export</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Export Sensitivity Analysis Dialog */}
      <Dialog open={showSensitivityExportDialog} onOpenChange={setShowSensitivityExportDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5" />
              Export Sensitivity Analysis to Excel
            </DialogTitle>
            <DialogDescription>
              Select which MOIC targets and scenarios to include in your detailed Excel export. All underlying simulation data will be included.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* File Name */}
            <div className="space-y-2">
              <Label htmlFor="sensitivity-filename">File Name</Label>
              <Input
                id="sensitivity-filename"
                value={sensitivityFileName}
                onChange={(e) => setSensitivityFileName(e.target.value)}
                placeholder="sensitivity_analysis.xlsx"
              />
            </div>

            {/* MOIC Targets and Scenarios Selection */}
            {sensitivityAnalysis && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Select MOIC Targets and Scenarios</h3>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const allMOICs: {[key: string]: boolean} = {};
                        sensitivityAnalysis.targetScenarios.forEach(scenario => {
                          const moicKey = `${scenario.targetMOIC}x`;
                          allMOICs[moicKey] = true;
                        });
                        setSelectedMOICs(allMOICs);
                      }}
                      disabled={Object.keys(selectedMOICs).length === sensitivityAnalysis.targetScenarios.length && Object.values(selectedMOICs).every(Boolean)}
                    >
                      Select All
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedMOICs({})}
                      disabled={Object.values(selectedMOICs).every(v => !v)}
                    >
                      Clear All
                    </Button>
                  </div>
                </div>
                
                {sensitivityAnalysis.targetScenarios.map((scenario) => {
                  const moicKey = `${scenario.targetMOIC}x`;
                  const isSelectedMOIC = selectedMOICs[moicKey];
                  
                  return (
                    <div key={moicKey} className="border rounded-lg p-4 space-y-3">
                      {/* MOIC Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Checkbox
                            id={`moic-${moicKey}`}
                            checked={isSelectedMOIC}
                            onCheckedChange={() => toggleMOIC(moicKey)}
                          />
                          <Label htmlFor={`moic-${moicKey}`} className="text-lg font-semibold">
                            {scenario.targetMOIC}x MOIC Target
                          </Label>
                          <Badge className={scenario.isRealistic ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>
                            {scenario.isRealistic ? "Realistic" : "Challenging"}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600">
                          Achievability: {scenario.achievabilityScore.toFixed(1)}%
                        </div>
                      </div>

                      {/* Scenarios for this MOIC */}
                      {isSelectedMOIC && (
                        <div className="ml-6 space-y-2">
                          <h4 className="font-medium text-gray-700">Scenarios to include:</h4>
                          
                          {/* Baseline */}
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={`${moicKey}-baseline`}
                              checked={selectedScenarios[moicKey]?.['baseline'] || false}
                              onCheckedChange={() => toggleScenario(moicKey, 'baseline')}
                            />
                            <Label htmlFor={`${moicKey}-baseline`} className="text-sm">
                              Baseline (Current Performance)
                            </Label>
                          </div>

                          {/* Single Parameter Options */}
                          {scenario.singleParameterOptions.map((option, idx) => {
                            const scenarioKey = `single_${idx}_${option.parameterType}`;
                            return (
                              <div key={scenarioKey} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`${moicKey}-${scenarioKey}`}
                                  checked={selectedScenarios[moicKey]?.[scenarioKey] || false}
                                  onCheckedChange={() => toggleScenario(moicKey, scenarioKey)}
                                />
                                <Label htmlFor={`${moicKey}-${scenarioKey}`} className="text-sm">
                                  Single Parameter: {getParameterDisplayName(option.parameterType)}
                                  {option.achievable ? (
                                    <Badge className="ml-2 bg-green-100 text-green-700 text-xs">Achievable</Badge>
                                  ) : (
                                    <Badge className="ml-2 bg-orange-100 text-orange-700 text-xs">Challenging</Badge>
                                  )}
                                </Label>
                              </div>
                            );
                          })}

                          {/* Mixed Parameter Options */}
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={`${moicKey}-mixed`}
                              checked={selectedScenarios[moicKey]?.['mixed'] || false}
                              onCheckedChange={() => toggleScenario(moicKey, 'mixed')}
                            />
                            <Label htmlFor={`${moicKey}-mixed`} className="text-sm">
                              Mixed Parameter Optimization ({scenario.mixedParameterOptions?.length || 1} strategies)
                              <Badge className="ml-2 bg-blue-100 text-blue-700 text-xs">Recommended</Badge>
                            </Label>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Export Summary */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Export Summary</h4>
              <div className="text-sm text-blue-800 space-y-1">
                <div>Selected MOIC Targets: {Object.values(selectedMOICs).filter(Boolean).length}</div>
                <div>
                  Total Scenarios: {Object.entries(selectedScenarios).reduce((total, [moicKey, scenarios]) => {
                    if (selectedMOICs[moicKey]) {
                      return total + Object.values(scenarios).filter(Boolean).length;
                    }
                    return total;
                  }, 0)}
                </div>
                <div className="mt-2 text-xs">
                  ✓ Summary sheet with baseline and target overview<br/>
                  ✓ Detailed sheets for each selected MOIC target<br/>
                  ✓ Complete simulation results for all scenarios<br/>
                  ✓ Professional formatting with color-coded performance
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowSensitivityExportDialog(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={exportSensitivityToExcel}
                className="bg-green-600 hover:bg-green-700 text-white"
                disabled={Object.values(selectedMOICs).filter(Boolean).length === 0}
              >
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Export to Excel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>


    </div>
  );
};

export default PortfolioResults;

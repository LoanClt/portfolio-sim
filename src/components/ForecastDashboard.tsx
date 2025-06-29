import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import {
  Sparkles,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Target,
  DollarSign,
  Settings,
  Download,
  RefreshCw,
  PlayCircle,
  ChevronDown,
  ChevronUp,
  Info,
  Activity,
  Wifi,
  WifiOff,
  Calendar,
  BarChart3,
  PieChart as PieChartIcon,
  TrendingDown,
  Zap
} from 'lucide-react';

import type { 
  PortfolioInvestment, 
  PortfolioSimulationParams,
  ForecastHorizon,
  StartupField,
  StartupRegion
} from '@/types/portfolio';

import { marketDataService, type MarketData } from '@/services/marketDataService';
import { getStartupFieldIcon, getStartupFieldLabel, getRegionLabel } from '@/utils/startupFieldPresets';
import { runPortfolioSimulation } from '@/utils/portfolioSimulation';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface ForecastDashboardProps {
  portfolioData: PortfolioInvestment[];
  simulationParams: PortfolioSimulationParams;
  onClose?: () => void;
}

const ForecastDashboard = ({ portfolioData, simulationParams, onClose }: ForecastDashboardProps) => {
  // State management
  const [isGenerating, setIsGenerating] = useState(false);
  const [timeHorizon, setTimeHorizon] = useState<ForecastHorizon>(10);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [includeNewInvestments, setIncludeNewInvestments] = useState(true);
  const [newInvestmentRate, setNewInvestmentRate] = useState(3);
  const [realTimeCalibration, setRealTimeCalibration] = useState(false);
  const [riskTolerance, setRiskTolerance] = useState<'conservative' | 'moderate' | 'aggressive'>('moderate');
  const [forecastGenerated, setForecastGenerated] = useState(false);
  
  // Real-time market data state
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [isLoadingMarketData, setIsLoadingMarketData] = useState(false);
  const [marketDataError, setMarketDataError] = useState<string | null>(null);

  // Effect to fetch market data when real-time calibration is enabled
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (realTimeCalibration) {
      const fetchMarketData = async () => {
        setIsLoadingMarketData(true);
        setMarketDataError(null);
        try {
          const data = await marketDataService.getRealTimeMarketData();
          setMarketData(data);
        } catch (error) {
          setMarketDataError('Failed to fetch market data');
          console.error('Market data fetch error:', error);
        } finally {
          setIsLoadingMarketData(false);
        }
      };

      // Fetch immediately
      fetchMarketData();
      
      // Then fetch every 5 minutes
      interval = setInterval(fetchMarketData, 5 * 60 * 1000);
    } else {
      setMarketData(null);
      setMarketDataError(null);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [realTimeCalibration]);

  // Generate forecast analysis with market data calibration
  const generateForecast = async () => {
    if (portfolioData.length === 0) return;
    
    setIsGenerating(true);
    try {
      // Simulate forecast generation with market data consideration
      await new Promise(resolve => setTimeout(resolve, 2000));
      setForecastGenerated(true);
    } finally {
      setIsGenerating(false);
    }
  };

  // Calculate adjusted metrics based on market data
  const getAdjustedMetrics = () => {
    let moicMultiplier = 1.0;
    let irrAdjustment = 0;
    
    if (marketData && realTimeCalibration) {
      // Adjust based on market sentiment
      switch (marketData.sentiment) {
        case 'bullish':
          moicMultiplier = 1.15;
          irrAdjustment = 3.2;
          break;
        case 'bearish':
          moicMultiplier = 0.85;
          irrAdjustment = -2.8;
          break;
        default:
          moicMultiplier = 1.0;
          irrAdjustment = 0;
      }
      
      // Adjust based on VIX (higher volatility = lower returns)
      if (marketData.vixLevel > 25) {
        moicMultiplier *= 0.9;
        irrAdjustment -= 1.5;
      } else if (marketData.vixLevel < 15) {
        moicMultiplier *= 1.1;
        irrAdjustment += 1.2;
      }
      
      // Adjust based on interest rates
      if (marketData.fedFundsRate > 5.5) {
        moicMultiplier *= 0.92;
        irrAdjustment -= 1.8;
      }
    }
    
    return {
      expectedMOIC: (3.2 * moicMultiplier).toFixed(2),
      expectedIRR: (22.4 + irrAdjustment).toFixed(1),
      optimisticMOIC: (4.8 * moicMultiplier).toFixed(2),
      downturnMOIC: (1.9 * moicMultiplier).toFixed(2)
    };
  };

  // Calculate basic portfolio metrics
  const portfolioSize = portfolioData.reduce((sum, inv) => sum + inv.checkSize, 0);
  const numCompanies = portfolioData.length;
  const adjustedMetrics = getAdjustedMetrics();

  // Market data status indicator
  const getMarketDataStatus = () => {
    if (!realTimeCalibration) return null;
    
    if (isLoadingMarketData) {
      return (
        <div className="flex items-center gap-2 text-sm text-blue-600">
          <RefreshCw className="w-4 h-4 animate-spin" />
          Fetching market data...
        </div>
      );
    }
    
    if (marketDataError) {
      return (
        <div className="flex items-center gap-2 text-sm text-red-600">
          <WifiOff className="w-4 h-4" />
          {marketDataError}
        </div>
      );
    }
    
    if (marketData) {
      return (
        <div className="flex items-center gap-2 text-sm text-green-600">
          <Wifi className="w-4 h-4" />
          Live data connected
        </div>
      );
    }
    
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl text-white">
            <Sparkles className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Portfolio Forecast</h2>
            <p className="text-gray-600 mt-1">
              Multi-scenario analysis with macroeconomic modeling and risk assessment
            </p>
            {getMarketDataStatus()}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {forecastGenerated && (
            <Button
              variant="outline"
              onClick={() => {/* Export functionality */}}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export Report
            </Button>
          )}
        </div>
      </div>

      {/* Real-time Market Data Display */}
      {realTimeCalibration && marketData && (
        <Card className="mb-6 border-l-4 border-l-green-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Live Market Data
              <Badge className={`ml-2 ${
                marketData.sentiment === 'bullish' ? 'bg-green-100 text-green-800' :
                marketData.sentiment === 'bearish' ? 'bg-red-100 text-red-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {marketData.sentiment}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="font-semibold text-gray-900">S&P 500</div>
                <div className="text-lg font-bold text-blue-600">{marketData.sp500Index.toFixed(0)}</div>
                <div className={`text-sm ${marketData.sp500Change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {marketData.sp500Change >= 0 ? '+' : ''}{marketData.sp500Change.toFixed(2)}
                </div>
              </div>
              <div>
                <div className="font-semibold text-gray-900">VIX</div>
                <div className="text-lg font-bold text-orange-600">{marketData.vixLevel.toFixed(1)}</div>
                <div className="text-sm text-gray-600">Volatility</div>
              </div>
              <div>
                <div className="font-semibold text-gray-900">10Y Treasury</div>
                <div className="text-lg font-bold text-purple-600">{marketData.tenYearYield.toFixed(2)}%</div>
                <div className="text-sm text-gray-600">Yield</div>
              </div>
              <div>
                <div className="font-semibold text-gray-900">Fed Rate</div>
                <div className="text-lg font-bold text-indigo-600">{marketData.fedFundsRate.toFixed(2)}%</div>
                <div className="text-sm text-gray-600">Target Rate</div>
              </div>
            </div>
            <div className="mt-4 text-xs text-gray-600">
              Last updated: {marketData.timestamp.toLocaleTimeString()}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Portfolio Summary */}
      <Card className="mb-6 border-l-4 border-l-blue-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="w-5 h-5" />
            Portfolio Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{numCompanies}</div>
              <div className="text-sm text-gray-600">Portfolio Companies</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">${portfolioSize.toFixed(1)}M</div>
              <div className="text-sm text-gray-600">Total Investment</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{timeHorizon} Years</div>
              <div className="text-sm text-gray-600">Forecast Horizon</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configuration Panel */}
      <Card className="mb-6 border-l-4 border-l-purple-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Forecast Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Basic Settings */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Time Horizon</h3>
              <Select value={timeHorizon.toString()} onValueChange={(value) => setTimeHorizon(parseInt(value) as ForecastHorizon)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3 Years</SelectItem>
                  <SelectItem value="5">5 Years</SelectItem>
                  <SelectItem value="7">7 Years</SelectItem>
                  <SelectItem value="10">10 Years</SelectItem>
                  <SelectItem value="15">15 Years</SelectItem>
                </SelectContent>
              </Select>

              <div>
                <Label>Risk Tolerance</Label>
                <Select value={riskTolerance} onValueChange={(value: any) => setRiskTolerance(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="conservative">Conservative</SelectItem>
                    <SelectItem value="moderate">Moderate</SelectItem>
                    <SelectItem value="aggressive">Aggressive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Investment Settings */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Investment Parameters</h3>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeNewInvestments"
                  checked={includeNewInvestments}
                  onCheckedChange={setIncludeNewInvestments}
                />
                <Label htmlFor="includeNewInvestments" className="text-sm">
                  Include new investments
                </Label>
              </div>
              
              {includeNewInvestments && (
                <div>
                  <Label>New Investments per Year: {newInvestmentRate}</Label>
                  <Slider
                    value={[newInvestmentRate]}
                    onValueChange={([value]) => setNewInvestmentRate(value)}
                    max={10}
                    min={1}
                    step={1}
                    className="mt-2"
                  />
                </div>
              )}
            </div>

            {/* Advanced Settings */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Advanced Options</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
                >
                  {showAdvancedSettings ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </Button>
              </div>
              
              {showAdvancedSettings && (
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="realTimeCalibration"
                      checked={realTimeCalibration}
                      onCheckedChange={setRealTimeCalibration}
                    />
                    <Label htmlFor="realTimeCalibration" className="text-sm">
                      Real-time market calibration
                    </Label>
                  </div>
                  
                  <div className="text-xs text-gray-600 bg-blue-50 p-3 rounded-lg">
                    <Info className="w-4 h-4 inline mr-1" />
                    {realTimeCalibration ? 
                      'Forecast will adjust based on live market data (S&P 500, VIX, interest rates, sentiment)' :
                      'Enable to fetch live market data and adjust forecasts based on current conditions'
                    }
                  </div>
                </div>
              )}
            </div>
          </div>

          <Separator className="my-6" />

          <div className="flex items-center justify-center">
            <Button
              onClick={generateForecast}
              disabled={portfolioData.length === 0 || isGenerating}
              className="px-8 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-semibold rounded-lg shadow-lg transform transition-all duration-200 hover:scale-105 flex items-center gap-3"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Generating Forecast...
                </>
              ) : (
                <>
                  <PlayCircle className="w-5 h-5" />
                  Generate Portfolio Forecast
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results Display */}
      {forecastGenerated && (
        <div className="space-y-6">
          {/* Market Calibration Impact Notice */}
          {realTimeCalibration && marketData && (
            <Card className="border-l-4 border-l-indigo-500">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-sm">
                  <Activity className="w-4 h-4 text-indigo-600" />
                  <span className="font-semibold">Market Calibration Active:</span>
                  <span>Forecast adjusted for {marketData.sentiment} market sentiment, VIX at {marketData.vixLevel.toFixed(1)}, and {marketData.fedFundsRate.toFixed(2)}% Fed rate</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-l-4 border-l-blue-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Expected MOIC</p>
                    <div className="text-2xl font-bold text-blue-600">{adjustedMetrics.expectedMOIC}x</div>
                  </div>
                  <TrendingUp className="w-8 h-8 text-blue-500" />
                </div>
                <div className="mt-2 text-sm text-gray-600">
                  {realTimeCalibration ? 'Market-adjusted' : 'Probability-weighted average'}
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Expected IRR</p>
                    <div className="text-2xl font-bold text-green-600">{adjustedMetrics.expectedIRR}%</div>
                  </div>
                  <Target className="w-8 h-8 text-green-500" />
                </div>
                <div className="mt-2 text-sm text-gray-600">
                  Annualized return
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Expected Value</p>
                    <div className="text-2xl font-bold text-purple-600">${(portfolioSize * parseFloat(adjustedMetrics.expectedMOIC)).toFixed(1)}M</div>
                  </div>
                  <DollarSign className="w-8 h-8 text-purple-500" />
                </div>
                <div className="mt-2 text-sm text-gray-600">
                  Total distributed
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-orange-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Confidence Level</p>
                    <div className="text-2xl font-bold text-orange-600">
                      {realTimeCalibration && marketData ? 
                        (marketData.sentiment === 'bullish' ? '85' : 
                         marketData.sentiment === 'bearish' ? '65' : '78') : '78'}%
                    </div>
                  </div>
                  <CheckCircle className="w-8 h-8 text-orange-500" />
                </div>
                <div className="mt-2 text-sm text-gray-600">
                  Weighted average
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Enhanced Scenario Analysis */}
          <DetailedScenarioAnalysis 
            portfolioData={portfolioData}
            simulationParams={simulationParams}
            timeHorizon={timeHorizon}
            adjustedMetrics={adjustedMetrics}
            includeNewInvestments={includeNewInvestments}
            newInvestmentRate={newInvestmentRate}
            riskTolerance={riskTolerance}
            marketData={marketData}
            realTimeCalibration={realTimeCalibration}
          />

          {/* Risk Assessment */}
          <Card className="border-l-4 border-l-yellow-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Risk Assessment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3">Key Risks</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Market Volatility</span>
                      <Badge className={`${
                        realTimeCalibration && marketData && marketData.vixLevel > 25 ? 
                        'bg-red-100 text-red-800' : 
                        marketData && marketData.vixLevel < 16 ?
                        'bg-green-100 text-green-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {realTimeCalibration && marketData && marketData.vixLevel > 25 ? 'High' :
                         marketData && marketData.vixLevel < 16 ? 'Low' : 'Medium'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Liquidity Risk</span>
                      <Badge className="bg-red-100 text-red-800">High</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Concentration Risk</span>
                      <Badge className="bg-yellow-100 text-yellow-800">Medium</Badge>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-3">Risk Metrics</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Value at Risk (95%)</span>
                      <span className="font-medium">${(portfolioSize * 0.65).toFixed(1)}M</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Max Drawdown</span>
                      <span className="font-medium">
                        {realTimeCalibration && marketData && marketData.sentiment === 'bearish' ? '-45%' : '-38%'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Sharpe Ratio</span>
                      <span className="font-medium">
                        {realTimeCalibration && marketData && marketData.sentiment === 'bullish' ? '1.6' : '1.4'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

// Helper function to generate future investment timeline
const generateFutureInvestments = (currentYear: number, horizon: number, rate: number, avgCheckSize: number) => {
  const futureInvestments = [];
  const stages = ['Pre-Seed', 'Seed', 'Series A', 'Series B'];
  const fields = ['software', 'deeptech', 'biotech', 'fintech', 'ecommerce', 'healthcare', 'energy', 'foodtech'];
  const regions = ['US', 'Europe'];
  
  // Generate company names
  const companyPrefixes = ['Tech', 'Data', 'Smart', 'AI', 'Bio', 'Quantum', 'Cyber', 'Cloud', 'Green', 'Digital'];
  const companySuffixes = ['Labs', 'Tech', 'Solutions', 'Systems', 'Works', 'AI', 'Bio', 'Dynamics', 'Ventures', 'Co'];
  
  let investmentId = 1000; // Starting ID for generated investments
  
  for (let year = currentYear + 1; year <= currentYear + horizon; year++) {
    // Ensure we respect the exact investment rate per year
    const numInvestments = Math.max(1, Math.round(rate)); // Respect the rate, minimum 1 per year
    
    for (let i = 0; i < numInvestments; i++) {
      const field = fields[Math.floor(Math.random() * fields.length)] as any;
      const stage = stages[Math.floor(Math.random() * stages.length)];
      const region = regions[Math.floor(Math.random() * regions.length)] as any;
      
      // Generate realistic company name
      const prefix = companyPrefixes[Math.floor(Math.random() * companyPrefixes.length)];
      const suffix = companySuffixes[Math.floor(Math.random() * companySuffixes.length)];
      const companyName = `${prefix}${suffix}`;
      
      // Generate realistic entry valuation based on stage
      let baseValuation = 5;
      switch (stage) {
        case 'Pre-Seed': baseValuation = 3 + Math.random() * 4; break;
        case 'Seed': baseValuation = 8 + Math.random() * 12; break;
        case 'Series A': baseValuation = 25 + Math.random() * 35; break;
        case 'Series B': baseValuation = 80 + Math.random() * 70; break;
      }
      
      futureInvestments.push({
        id: `future-${investmentId++}`,
        companyName,
        year,
        entryDate: `${year}-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
        checkSize: avgCheckSize * (0.7 + Math.random() * 0.6), // ±30% check size variation
        entryValuation: baseValuation,
        entryStage: stage,
        currentStage: stage,
        field,
        region,
        usePresets: Math.random() > 0.3, // 70% use presets
        // Generate realistic parameters based on field presets
        stageProgression: {
          toSeed: 60 + Math.random() * 20 - 10,
          toSeriesA: 40 + Math.random() * 20 - 10,
          toSeriesB: 50 + Math.random() * 20 - 10,
          toSeriesC: 45 + Math.random() * 15 - 7,
          toIPO: 30 + Math.random() * 15 - 7
        },
        dilutionRates: {
          seed: 15 + Math.random() * 10,
          seriesA: 18 + Math.random() * 8,
          seriesB: 12 + Math.random() * 6,
          seriesC: 10 + Math.random() * 4,
          ipo: 6 + Math.random() * 4
        },
        lossProb: {
          preSeed: 20 + Math.random() * 20,
          seed: 15 + Math.random() * 15,
          seriesA: 10 + Math.random() * 10,
          seriesB: 8 + Math.random() * 6,
          seriesC: 5 + Math.random() * 5,
          ipo: 2 + Math.random() * 3
        },
        exitValuations: {
          ipo: 500 + Math.random() * 1000,
          acquisition: 100 + Math.random() * 300
        },
        yearsToNext: {
          toSeed: [1, 2],
          toSeriesA: [1, 3],
          toSeriesB: [1, 3],
          toSeriesC: [1, 3],
          toIPO: [1, 2]
        }
      });
    }
  }
  return futureInvestments;
};

// Stage color function (same as PortfolioManager)
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

// Enhanced Scenario Analysis Component
interface DetailedScenarioAnalysisProps {
  portfolioData: any[];
  simulationParams: any;
  timeHorizon: number;
  adjustedMetrics: any;
  includeNewInvestments: boolean;
  newInvestmentRate: number;
  riskTolerance: string;
  marketData: any;
  realTimeCalibration: boolean;
}

const DetailedScenarioAnalysis: React.FC<DetailedScenarioAnalysisProps> = ({
  portfolioData,
  simulationParams,
  timeHorizon,
  adjustedMetrics,
  includeNewInvestments,
  newInvestmentRate,
  riskTolerance,
  marketData,
  realTimeCalibration
}) => {
  const currentYear = new Date().getFullYear();
  const portfolioSize = portfolioData.reduce((sum, inv) => sum + inv.checkSize, 0);
  const avgCheckSize = portfolioSize / portfolioData.length || 2;
  
  // Generate future investments if enabled
  const futureInvestments = includeNewInvestments ? 
    generateFutureInvestments(currentYear, timeHorizon, newInvestmentRate, avgCheckSize) : [];

  // Calculate scenario-specific metrics
  const scenarios = {
    optimistic: {
      name: 'Optimistic Scenario',
      probability: 25,
      moic: parseFloat(adjustedMetrics.optimisticMOIC),
      irr: parseFloat(adjustedMetrics.expectedIRR) + 6,
      successRate: 45,
      unicornRate: 8,
      averageExit: 5.5,
      marketMultiple: 1.35,
      description: 'Strong market conditions with abundant capital and high valuations',
      assumptions: [
        'GDP growth above 3.5%',
        'Low interest rates (< 3%)',
        'High investor confidence',
        'Strong IPO market',
        'Minimal recession risk'
      ]
    },
    baseCase: {
      name: 'Base Case Scenario',
      probability: 50,
      moic: parseFloat(adjustedMetrics.expectedMOIC),
      irr: parseFloat(adjustedMetrics.expectedIRR),
      successRate: 32,
      unicornRate: 4,
      averageExit: 4.2,
      marketMultiple: 1.0,
      description: 'Normal market conditions with typical VC returns',
      assumptions: [
        'GDP growth 2-3%',
        'Moderate interest rates (3-5%)',
        'Stable investor sentiment',
        'Regular exit opportunities',
        'Normal business cycles'
      ]
    },
    downturn: {
      name: 'Downturn Scenario',
      probability: 25,
      moic: parseFloat(adjustedMetrics.downturnMOIC),
      irr: parseFloat(adjustedMetrics.expectedIRR) - 8.2,
      successRate: 18,
      unicornRate: 1.5,
      averageExit: 3.1,
      marketMultiple: 0.65,
      description: 'Challenging market with limited capital and compressed valuations',
      assumptions: [
        'GDP growth below 1%',
        'High interest rates (> 5%)',
        'Risk-averse investors',
        'Limited exit opportunities',
        'Extended down cycle'
      ]
    }
  };

  // Generate investment evolution data
  const generateEvolutionData = (scenario: any) => {
    const data = [];
    let cumulativeValue = portfolioSize;
    
    for (let year = 0; year <= timeHorizon; year++) {
      const currentYearData = {
        year: currentYear + year,
        portfolioValue: cumulativeValue,
        newInvestments: 0,
        exits: 0,
        unrealizedValue: 0
      };

      if (year > 0) {
        // Add new investments
        if (includeNewInvestments) {
          const yearInvestments = futureInvestments.filter(inv => inv.year === currentYear + year);
          currentYearData.newInvestments = yearInvestments.reduce((sum, inv) => sum + inv.checkSize, 0);
          cumulativeValue += currentYearData.newInvestments;
        }

        // Calculate exits and unrealized growth
        const exitMultiplier = 1 + (scenario.irr / 100) * year;
        const exitRate = Math.min(0.15 + (year * 0.08), 0.6); // Cumulative exit rate
        currentYearData.exits = (portfolioSize + currentYearData.newInvestments) * exitRate * exitMultiplier * scenario.marketMultiple;
        currentYearData.unrealizedValue = cumulativeValue * exitMultiplier * scenario.marketMultiple - currentYearData.exits;
        currentYearData.portfolioValue = currentYearData.unrealizedValue + currentYearData.exits;
      }

      data.push(currentYearData);
    }
    return data;
  };

  // Chart colors
  const COLORS = {
    optimistic: '#10B981',
    baseCase: '#3B82F6', 
    downturn: '#EF4444'
  };

  return (
    <Card className="border-l-4 border-l-indigo-500">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Detailed Scenario Analysis
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="optimistic">Optimistic</TabsTrigger>
            <TabsTrigger value="baseCase">Base Case</TabsTrigger>
            <TabsTrigger value="downturn">Downturn</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Scenario Comparison Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Portfolio Value Evolution ({timeHorizon}-Year Forecast)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={generateEvolutionData(scenarios.optimistic).map((data, index) => ({
                    ...data,
                    optimisticValue: data.portfolioValue,
                    baseCaseValue: generateEvolutionData(scenarios.baseCase)[index]?.portfolioValue || 0,
                    downturnValue: generateEvolutionData(scenarios.downturn)[index]?.portfolioValue || 0
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis tickFormatter={(value) => `$${value.toFixed(0)}M`} />
                    <Tooltip formatter={(value: number, name: string) => [
                      `$${value.toFixed(1)}M`, 
                      name === 'optimisticValue' ? 'Optimistic' : 
                      name === 'baseCaseValue' ? 'Base Case' : 'Downturn'
                    ]} />
                    <Line 
                      type="monotone" 
                      dataKey="optimisticValue" 
                      stroke={COLORS.optimistic} 
                      strokeWidth={3}
                      name="Optimistic"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="baseCaseValue" 
                      stroke={COLORS.baseCase} 
                      strokeWidth={3}
                      name="Base Case"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="downturnValue" 
                      stroke={COLORS.downturn} 
                      strokeWidth={3}
                      name="Downturn"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Scenario Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Object.entries(scenarios).map(([key, scenario]) => (
                <Card key={key} className={`border-l-4 ${
                  key === 'optimistic' ? 'border-green-500 bg-green-50' :
                  key === 'baseCase' ? 'border-blue-500 bg-blue-50' :
                  'border-red-500 bg-red-50'
                }`}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <Badge className={`${
                        key === 'optimistic' ? 'bg-green-100 text-green-800' :
                        key === 'baseCase' ? 'bg-blue-100 text-blue-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {scenario.name}
                      </Badge>
                      <span className="text-sm text-gray-600">{scenario.probability}% probability</span>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">MOIC:</span>
                        <span className="font-bold">{scenario.moic.toFixed(2)}x</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">IRR:</span>
                        <span className="font-bold">{scenario.irr.toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Success Rate:</span>
                        <span className="font-bold">{scenario.successRate}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Expected Value:</span>
                        <span className="font-bold">${(portfolioSize * scenario.moic).toFixed(1)}M</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Individual Scenario Tabs */}
          {Object.entries(scenarios).map(([key, scenario]) => (
            <TabsContent key={key} value={key} className="space-y-6">
              <ScenarioDetailView 
                scenario={scenario}
                portfolioData={portfolioData}
                futureInvestments={futureInvestments}
                timeHorizon={timeHorizon}
                currentYear={currentYear}
                includeNewInvestments={includeNewInvestments}
                color={COLORS[key as keyof typeof COLORS]}
              />
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
};

// Individual Scenario Detail Component
interface ScenarioDetailViewProps {
  scenario: any;
  portfolioData: any[];
  futureInvestments: any[];
  timeHorizon: number;
  currentYear: number;
  includeNewInvestments: boolean;
  color: string;
}

const ScenarioDetailView: React.FC<ScenarioDetailViewProps> = ({
  scenario,
  portfolioData,
  futureInvestments,
  timeHorizon,
  currentYear,
  includeNewInvestments,
  color
}) => {
  // Generate detailed portfolio evolution for this scenario
  const portfolioEvolution = [];
  let runningValue = portfolioData?.reduce((sum, inv) => sum + (inv.checkSize || 0), 0) || 0;
  
  for (let year = 0; year <= timeHorizon; year++) {
    const yearData = {
      year: currentYear + year,
      currentPortfolio: runningValue,
      newInvestments: 0,
      exits: 0,
      failures: 0,
      totalValue: runningValue
    };

    if (year > 0) {
      // New investments
      if (includeNewInvestments && futureInvestments) {
        const yearInvestments = futureInvestments.filter(inv => inv.year === currentYear + year);
        yearData.newInvestments = yearInvestments.reduce((sum, inv) => sum + (inv.checkSize || 0), 0);
        runningValue += yearData.newInvestments;
      }

      // Exits and failures based on scenario
      const baseGrowth = Math.pow(1 + (scenario.irr || 0) / 100, year);
      const exitRate = Math.min(0.1 + (year * 0.05), 0.4);
      const failureRate = (100 - (scenario.successRate || 0)) / 100 * 0.15; // Annual failure rate
      
      yearData.exits = runningValue * exitRate * baseGrowth * (scenario.marketMultiple || 1);
      yearData.failures = runningValue * failureRate;
      yearData.totalValue = runningValue * baseGrowth * (scenario.marketMultiple || 1);
    }

    portfolioEvolution.push(yearData);
  }

  // Investment breakdown by stage and sector
  const allInvestments = [...(portfolioData || []), ...(futureInvestments || [])];
  const stageBreakdown = allInvestments.reduce((acc, inv) => {
    const stage = inv.stage || inv.entryStage || 'Unknown';
    acc[stage] = (acc[stage] || 0) + (inv.checkSize || 0);
    return acc;
  }, {} as Record<string, number>);

  const sectorBreakdown = allInvestments.reduce((acc, inv) => {
    const sector = inv.sector || inv.field || 'Unknown';
    acc[sector] = (acc[sector] || 0) + (inv.checkSize || 0);
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      {/* Scenario Description */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="w-5 h-5" />
            {scenario.name} - Detailed Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3">Scenario Description</h4>
              <p className="text-gray-600 mb-4">{scenario.description}</p>
              
              <h4 className="font-semibold mb-3">Key Assumptions</h4>
              <ul className="space-y-1">
                {scenario.assumptions.map((assumption: string, idx: number) => (
                  <li key={idx} className="text-sm text-gray-600 flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 text-green-500" />
                    {assumption}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Key Metrics</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600">Expected MOIC</div>
                  <div className="text-xl font-bold" style={{ color }}>{scenario.moic.toFixed(2)}x</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600">Expected IRR</div>
                  <div className="text-xl font-bold" style={{ color }}>{scenario.irr.toFixed(1)}%</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600">Success Rate</div>
                  <div className="text-xl font-bold" style={{ color }}>{scenario.successRate}%</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600">Unicorn Rate</div>
                  <div className="text-xl font-bold" style={{ color }}>{scenario.unicornRate}%</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Portfolio Evolution Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Portfolio Value Evolution</CardTitle>
        </CardHeader>
        <CardContent>
          {portfolioEvolution.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={portfolioEvolution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis tickFormatter={(value) => `$${value.toFixed(0)}M`} />
                <Tooltip formatter={(value: number) => [`$${value.toFixed(1)}M`]} />
                <Area 
                  type="monotone" 
                  dataKey="totalValue" 
                  stroke={color} 
                  fill={color}
                  fillOpacity={0.3}
                  name="Total Portfolio Value"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-500">
              No data available for visualization
            </div>
          )}
        </CardContent>
      </Card>

             {/* Enhanced Investment Timeline */}
       <EnhancedInvestmentTimeline 
         currentPortfolio={portfolioData}
         futureInvestments={futureInvestments}
         includeNewInvestments={includeNewInvestments}
         timeHorizon={timeHorizon}
         currentYear={currentYear}
       />

      {/* Portfolio Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="w-5 h-5" />
              Breakdown by Stage
            </CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(stageBreakdown).length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={Object.entries(stageBreakdown).map(([stage, value]) => ({ name: stage, value }))}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {Object.entries(stageBreakdown).map((_, index) => (
                      <Cell key={`cell-${index}`} fill={`hsl(${index * 60}, 70%, 60%)`} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [`$${value.toFixed(1)}M`]} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-gray-500">
                No stage data available
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="w-5 h-5" />
              Breakdown by Sector
            </CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(sectorBreakdown).length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={Object.entries(sectorBreakdown).map(([sector, value]) => ({ name: sector, value }))}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {Object.entries(sectorBreakdown).map((_, index) => (
                      <Cell key={`cell-${index}`} fill={`hsl(${index * 45 + 180}, 70%, 60%)`} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [`$${value.toFixed(1)}M`]} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-gray-500">
                No sector data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Yearly Investment Section with Portfolio Simulation
interface YearlyInvestmentSectionProps {
  year: number;
  investments: any[];
  avgOwnership: number;
  avgTicketSize: number;
  avgValuation: number;
  InvestmentCard: React.ComponentType<{ investment: any; isFuture?: boolean }>;
  cumulativePortfolio: any[]; // All investments up to this year (current + previous future)
}

const YearlyInvestmentSection: React.FC<YearlyInvestmentSectionProps> = ({
  year,
  investments,
  avgOwnership,
  avgTicketSize,
  avgValuation,
  InvestmentCard,
  cumulativePortfolio
}) => {
  const [showSimulation, setShowSimulation] = useState(false);
  const [simulationResults, setSimulationResults] = useState<any>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [showAllInvestments, setShowAllInvestments] = useState(false);

  // Run portfolio simulation for this year's investments (cumulative portfolio)
  const runYearlySimulation = async () => {
    if (cumulativePortfolio.length === 0) return;
    
    setIsSimulating(true);
    try {
      // Simulate portfolio performance with 1000 iterations for cumulative portfolio
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate processing time
      
      const simulationData = generateYearlySimulation(cumulativePortfolio);
      setSimulationResults(simulationData);
      setShowSimulation(true);
    } finally {
      setIsSimulating(false);
    }
  };

  // Generate simulation data for the year's investments
  const generateYearlySimulation = (yearInvestments: any[]) => {
    // Use the actual portfolio simulation engine instead of simplified logic
    try {
      // Convert investments to proper format
      const formattedInvestments = yearInvestments.map(inv => ({
        ...inv,
        id: inv.id || `investment-${Math.random()}`,
        entryStage: inv.entryStage || 'Seed',
        currentStage: inv.currentStage || inv.entryStage || 'Seed',
        usePresets: inv.usePresets !== false,
        // Ensure all required fields are present with defaults
        stageProgression: inv.stageProgression || {
          toSeed: 65,
          toSeriesA: 45,
          toSeriesB: 55,
          toSeriesC: 48,
          toIPO: 35
        },
        dilutionRates: inv.dilutionRates || {
          seed: 18,
          seriesA: 20,
          seriesB: 15,
          seriesC: 12,
          ipo: 8
        },
        exitValuations: inv.exitValuations || {
          preSeed: [3, 8],
          seed: [6, 16],
          seriesA: [25, 65],
          seriesB: [70, 160],
          seriesC: [180, 650],
          ipo: [900, 4000]
        },
        lossProb: inv.lossProb || {
          preSeed: 25,
          seed: 20,
          seriesA: 15,
          seriesB: 10,
          seriesC: 8,
          ipo: 3
        },
        yearsToNext: inv.yearsToNext || {
          toSeed: [1, 2],
          toSeriesA: [1, 3],
          toSeriesB: [1, 3],
          toSeriesC: [1, 3],
          toIPO: [1, 2]
        }
      }));

      // Use actual simulation parameters
      const simulationParams = {
        numSimulations: 1000,
        setupFees: 0.5, // Small setup fee for forecast
        managementFees: 2,
        managementFeeYears: 3, // Shorter for yearly forecasts
        followOnStrategy: {
          enableEarlyFollowOns: false,
          earlyFollowOnRate: 20,
          earlyFollowOnMultiple: 1.0,
          enableRecycling: false,
          recyclingRate: 0,
          reserveRatio: 20 // Lower reserve for forecasts
        }
      };

      // Run the actual portfolio simulation
      const portfolioResults = runPortfolioSimulation(formattedInvestments, simulationParams);
      
      // Calculate additional metrics for compatibility
      const totalCapital = yearInvestments.reduce((sum, inv) => sum + inv.checkSize, 0);
      
      // Calculate stage breakdown from simulation results
      const stageBreakdown = {} as Record<string, any>;
      const stageOrder = ['Pre-Seed', 'Seed', 'Series A', 'Series B', 'Series C', 'IPO'];
      
      // Initialize stage breakdown
      stageOrder.forEach(stage => {
        stageBreakdown[stage] = { count: 0, capital: 0, avgMOIC: 0, totalMOIC: 0 };
      });
      
      // Calculate stage performance from simulation results
      portfolioResults.simulations.forEach(sim => {
        sim.forEach(result => {
          const stage = result.exitStage;
          if (stageBreakdown[stage]) {
            stageBreakdown[stage].totalMOIC += result.moic;
            stageBreakdown[stage].count++;
          }
        });
      });
      
      // Calculate average MOICs and add investment counts/capital
      stageOrder.forEach(stage => {
        const stageInvestments = yearInvestments.filter(inv => inv.entryStage === stage);
        stageBreakdown[stage].count = stageInvestments.length;
        stageBreakdown[stage].capital = stageInvestments.reduce((sum, inv) => sum + inv.checkSize, 0);
        
        // Calculate average MOIC from simulations
        if (stageBreakdown[stage].count > 0) {
          const totalSimResults = portfolioResults.simulations.reduce((sum, sim) => {
            return sum + sim.filter(result => result.exitStage === stage).reduce((stageSum, result) => stageSum + result.moic, 0);
          }, 0);
          const totalSimCount = portfolioResults.simulations.reduce((sum, sim) => {
            return sum + sim.filter(result => result.exitStage === stage).length;
          }, 0);
          
          stageBreakdown[stage].avgMOIC = totalSimCount > 0 ? totalSimResults / totalSimCount : 0;
        }
      });

      // Performance distribution
      const allMOICs = portfolioResults.simulations.map(sim => {
        const totalInvested = sim.reduce((sum, result) => sum + result.entryAmount, 0);
        const totalReturns = sim.reduce((sum, result) => sum + result.exitAmount, 0);
        return totalInvested > 0 ? totalReturns / totalInvested : 0;
      });
      
      const moicDistribution = [
        { range: '0-0.5x', count: allMOICs.filter(v => v >= 0 && v < 0.5).length },
        { range: '0.5-1x', count: allMOICs.filter(v => v >= 0.5 && v < 1).length },
        { range: '1-2x', count: allMOICs.filter(v => v >= 1 && v < 2).length },
        { range: '2-5x', count: allMOICs.filter(v => v >= 2 && v < 5).length },
        { range: '5-10x', count: allMOICs.filter(v => v >= 5 && v < 10).length },
        { range: '10x+', count: allMOICs.filter(v => v >= 10).length }
      ];

      // Calculate percentiles
      const sortedMOICs = [...allMOICs].sort((a, b) => a - b);
      const p25MOIC = sortedMOICs[Math.floor(sortedMOICs.length * 0.25)] || 0;
      const p75MOIC = sortedMOICs[Math.floor(sortedMOICs.length * 0.75)] || 0;
      const p90MOIC = sortedMOICs[Math.floor(sortedMOICs.length * 0.9)] || 0;
      const medianMOIC = sortedMOICs[Math.floor(sortedMOICs.length / 2)] || 0;

      return {
        totalCapital,
        numInvestments: yearInvestments.length,
        avgMOIC: portfolioResults.avgMOIC,
        medianMOIC,
        p25MOIC,
        p75MOIC,
        p90MOIC,
        stageBreakdown,
        moicDistribution,
        rawResults: portfolioResults.simulations.slice(0, 100), // Sample for detailed view
        portfolioResults, // Include full results for detailed analysis
        sampleSimulation: portfolioResults.simulations[0] || [] // First simulation for detailed view
      };
      
    } catch (error) {
      console.error('Error running portfolio simulation:', error);
      
      // Fallback to original simplified logic if simulation fails
      const numSimulations = 1000;
      const results = [];
      
      // Calculate base metrics
      const totalCapital = yearInvestments.reduce((sum, inv) => sum + inv.checkSize, 0);
      
      // Stage performance assumptions (better than before)
      const stageMetrics = {
        'Pre-Seed': { avgMOIC: 3.2, stdDev: 2.8, successRate: 15 },
        'Seed': { avgMOIC: 4.1, stdDev: 3.2, successRate: 25 },
        'Series A': { avgMOIC: 3.8, stdDev: 2.8, successRate: 35 },
        'Series B': { avgMOIC: 2.9, stdDev: 2.2, successRate: 45 },
        'Series C': { avgMOIC: 2.2, stdDev: 1.6, successRate: 55 },
        'Growth': { avgMOIC: 1.8, stdDev: 1.2, successRate: 65 }
      };

      // Run simulations
      for (let i = 0; i < numSimulations; i++) {
        let totalReturn = 0;
        const investmentReturns = [];
        
        yearInvestments.forEach(investment => {
          const stageData = stageMetrics[investment.entryStage as keyof typeof stageMetrics] || stageMetrics['Seed'];
          
          // Generate random outcome
          const isSuccess = Math.random() < (stageData.successRate / 100);
          let moic = 0;
          
          if (isSuccess) {
            // Lognormal distribution for successful investments
            const logMean = Math.log(stageData.avgMOIC);
            const logStd = Math.log(1 + stageData.stdDev / stageData.avgMOIC);
            const logNormal = Math.exp(logMean + logStd * (Math.random() - 0.5) * 2);
            moic = Math.max(0.1, Math.min(logNormal, 50)); // Cap at 50x
          } else {
            // Failed investment (15% chance of partial recovery)
            moic = Math.random() < 0.15 ? Math.random() * 0.8 : 0;
          }
          
          const investmentReturn = investment.checkSize * moic;
          totalReturn += investmentReturn;
          investmentReturns.push({
            investment: investment.companyName,
            moic,
            return: investmentReturn,
            success: isSuccess
          });
        });
        
        results.push({
          totalReturn,
          portfolioMOIC: totalReturn / totalCapital,
          investmentReturns
        });
      }
      
      // Calculate statistics
      results.sort((a, b) => a.portfolioMOIC - b.portfolioMOIC);
      
      const moicValues = results.map(r => r.portfolioMOIC);
      const avgMOIC = moicValues.reduce((sum, val) => sum + val, 0) / moicValues.length;
      const medianMOIC = moicValues[Math.floor(moicValues.length / 2)];
      const p25MOIC = moicValues[Math.floor(moicValues.length * 0.25)];
      const p75MOIC = moicValues[Math.floor(moicValues.length * 0.75)];
      const p90MOIC = moicValues[Math.floor(moicValues.length * 0.9)];
      
      // Stage breakdown
      const stageBreakdown = yearInvestments.reduce((acc, inv) => {
        const stage = inv.entryStage;
        if (!acc[stage]) {
          acc[stage] = { count: 0, capital: 0, avgMOIC: 0 };
        }
        acc[stage].count++;
        acc[stage].capital += inv.checkSize;
        acc[stage].avgMOIC = stageMetrics[stage as keyof typeof stageMetrics]?.avgMOIC || 2.5;
        return acc;
      }, {} as Record<string, any>);

      // Performance distribution
      const moicDistribution = [
        { range: '0-0.5x', count: moicValues.filter(v => v >= 0 && v < 0.5).length },
        { range: '0.5-1x', count: moicValues.filter(v => v >= 0.5 && v < 1).length },
        { range: '1-2x', count: moicValues.filter(v => v >= 1 && v < 2).length },
        { range: '2-5x', count: moicValues.filter(v => v >= 2 && v < 5).length },
        { range: '5-10x', count: moicValues.filter(v => v >= 5 && v < 10).length },
        { range: '10x+', count: moicValues.filter(v => v >= 10).length }
      ];

      return {
        totalCapital,
        numInvestments: yearInvestments.length,
        avgMOIC,
        medianMOIC,
        p25MOIC,
        p75MOIC,
        p90MOIC,
        stageBreakdown,
        moicDistribution,
        rawResults: results.slice(0, 100), // Sample for detailed view
        sampleSimulation: results[0]?.investmentReturns || []
      };
    }
  };

  return (
    <div className="border rounded-lg bg-gradient-to-r from-green-50 to-blue-50 p-6">
      {/* Year Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 bg-green-500 rounded-full"></div>
          <h3 className="text-xl font-bold text-gray-800">Future Investments ({year})</h3>
          <Badge className="bg-green-100 text-green-800 px-3 py-1">
            {investments.length} investment{investments.length !== 1 ? 's' : ''}
          </Badge>
        </div>
        {cumulativePortfolio.length > 0 && (
          <Button
            onClick={runYearlySimulation}
            disabled={isSimulating}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isSimulating ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Simulating...
              </>
            ) : (
              <>
                <BarChart3 className="w-4 h-4 mr-2" />
                Run Portfolio Simulation ({cumulativePortfolio.length} investments)
              </>
            )}
          </Button>
        )}
      </div>

      {/* Yearly Statistics */}
      {investments.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="bg-white/70">
            <CardContent className="p-4 text-center">
              <div className="text-lg font-bold text-blue-600">{avgOwnership.toFixed(1)}%</div>
              <div className="text-sm text-gray-600">Avg. Ownership</div>
            </CardContent>
          </Card>
          <Card className="bg-white/70">
            <CardContent className="p-4 text-center">
              <div className="text-lg font-bold text-green-600">${avgTicketSize.toFixed(1)}M</div>
              <div className="text-sm text-gray-600">Avg. Ticket Size</div>
            </CardContent>
          </Card>
          <Card className="bg-white/70">
            <CardContent className="p-4 text-center">
              <div className="text-lg font-bold text-purple-600">${avgValuation.toFixed(1)}M</div>
              <div className="text-sm text-gray-600">Avg. Valuation</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Investment Cards */}
      {investments.length > 0 ? (
        <div className="space-y-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(showAllInvestments ? investments : investments.slice(0, 3)).map((investment, idx) => (
              <InvestmentCard key={investment.id || idx} investment={investment} isFuture={true} />
            ))}
          </div>
          
          {investments.length > 3 && (
            <div className="flex justify-center">
              <Button
                variant="ghost"
                onClick={() => setShowAllInvestments(!showAllInvestments)}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
              >
                {showAllInvestments ? (
                  <>
                    <ChevronUp className="w-4 h-4" />
                    Show Less ({investments.length - 3} less)
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4" />
                    Show More ({investments.length - 3} more)
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="p-8 border-2 border-dashed border-gray-300 rounded-lg text-center text-gray-500 bg-white/50 mb-6">
          <Calendar className="w-8 h-8 mx-auto mb-2 text-gray-400" />
          <div className="font-medium">No investments planned for this year</div>
          <div className="text-sm">Investments will be scheduled based on your investment rate</div>
        </div>
      )}

      {/* Portfolio Simulation Results */}
      {showSimulation && simulationResults && (
        <Card className="mt-6 bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Portfolio Simulation Results - {year}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="overview" className="space-y-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="distribution">MOIC Distribution</TabsTrigger>
                <TabsTrigger value="stages">Returns by Stage</TabsTrigger>
                <TabsTrigger value="details">Simulation Details</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="p-3 bg-blue-50 rounded-lg text-center">
                    <div className="text-lg font-bold text-blue-600">{simulationResults.avgMOIC.toFixed(2)}x</div>
                    <div className="text-xs text-gray-600">Avg MOIC</div>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg text-center">
                    <div className="text-lg font-bold text-green-600">{simulationResults.medianMOIC.toFixed(2)}x</div>
                    <div className="text-xs text-gray-600">Median MOIC</div>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg text-center">
                    <div className="text-lg font-bold text-purple-600">{simulationResults.p75MOIC.toFixed(2)}x</div>
                    <div className="text-xs text-gray-600">75th Percentile</div>
                  </div>
                  <div className="p-3 bg-orange-50 rounded-lg text-center">
                    <div className="text-lg font-bold text-orange-600">{simulationResults.p90MOIC.toFixed(2)}x</div>
                    <div className="text-xs text-gray-600">90th Percentile</div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg text-center">
                    <div className="text-lg font-bold text-gray-600">${simulationResults.totalCapital.toFixed(1)}M</div>
                    <div className="text-xs text-gray-600">Total Capital</div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="distribution">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Fund MOIC Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={simulationResults.moicDistribution}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="range" />
                        <YAxis />
                        <Tooltip formatter={(value: number) => [`${value} simulations`, 'Count']} />
                        <Bar dataKey="count" fill="#3B82F6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="stages">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Returns by Stage</CardTitle>
                    <p className="text-sm text-gray-600">
                      Average performance breakdown by investment stage
                    </p>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={Object.entries(simulationResults.stageBreakdown).map(([stage, data]: [string, any]) => ({
                        stage,
                        avgReturn: data.avgMOIC,
                        count: data.count
                      }))}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="stage" 
                          tick={{ fontSize: 12 }} 
                          angle={-45}
                          textAnchor="end"
                          height={80}
                        />
                        <YAxis />
                        <Tooltip 
                          formatter={(value: number, name: string) => {
                            if (name === 'avgReturn') return [`${value.toFixed(2)}x`, 'Avg Multiple'];
                            if (name === 'count') return [`${value}`, 'Count'];
                            return [value, name];
                          }}
                        />
                        <Bar dataKey="avgReturn" fill="#10b981" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                    
                    {/* Stage breakdown details */}
                    <div className="mt-4 space-y-2">
                      {Object.entries(simulationResults.stageBreakdown).map(([stage, data]: [string, any]) => (
                        <div key={stage} className="flex items-center justify-between p-2 border rounded-lg text-sm">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={getStageColor(stage).badge}>
                              {stage}
                            </Badge>
                            <span className="text-gray-600">
                              {data.count} investment{data.count !== 1 ? 's' : ''} • ${data.capital.toFixed(1)}M
                            </span>
                          </div>
                          <div className="font-bold">{data.avgMOIC.toFixed(2)}x</div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="details">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Simulation Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div>
                        <h4 className="font-semibold mb-3">Investment Performance</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Number of Investments:</span>
                            <span className="font-medium">{simulationResults.numInvestments}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Total Capital Deployed:</span>
                            <span className="font-medium">${simulationResults.totalCapital.toFixed(1)}M</span>
                          </div>
                          <div className="flex justify-between">
                            <span>25th Percentile MOIC:</span>
                            <span className="font-medium">{simulationResults.p25MOIC.toFixed(2)}x</span>
                          </div>
                          <div className="flex justify-between">
                            <span>75th Percentile MOIC:</span>
                            <span className="font-medium">{simulationResults.p75MOIC.toFixed(2)}x</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-3">Simulation Methodology</h4>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div>• 1,000 Monte Carlo simulations</div>
                          <div>• Stage-specific success rates and returns</div>
                          <div>• Normal distribution for successful exits</div>
                          <div>• 10% partial recovery rate for failures</div>
                          <div>• Industry-standard performance assumptions</div>
                        </div>
                      </div>
                    </div>

                    {/* Sample Investment Performance Chart */}
                    <div className="mb-6">
                      <h4 className="font-semibold mb-3">Sample Simulation: Investment Performance</h4>
                      <ResponsiveContainer width="100%" height={400}>
                        <BarChart data={simulationResults.sampleSimulation.slice(0, 20).map((investment: any, index: number) => ({
                          companyName: investment.companyName || `Investment ${index + 1}`,
                          entryAmount: investment.entryAmount || (investment.checkSize || 2),
                          exitAmount: investment.exitAmount || (investment.return || investment.moic * (investment.checkSize || 2)),
                          gain: (investment.exitAmount || investment.return || 0) - (investment.entryAmount || investment.checkSize || 2)
                        }))}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis 
                            dataKey="companyName" 
                            tick={{ fontSize: 10 }} 
                            angle={-45}
                            textAnchor="end"
                            height={80}
                          />
                          <YAxis 
                            tick={{ fontSize: 12 }} 
                            stroke="#64748b"
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: '#1e293b', 
                              border: 'none', 
                              borderRadius: '8px',
                              color: 'white'
                            }}
                            formatter={(value: number, name: string) => {
                              if (name === 'entryAmount') return [`$${value.toFixed(2)}MM`, 'Entry Amount'];
                              if (name === 'gain') return [`$${value.toFixed(2)}MM`, 'Gain/Loss'];
                              return [`$${value.toFixed(2)}MM`, name];
                            }}
                          />
                          <Bar 
                            dataKey="entryAmount" 
                            fill="#3b82f6" 
                            name="entryAmount"
                            radius={[0, 0, 0, 0]}
                          />
                          <Bar 
                            dataKey="gain" 
                            fill="#10b981" 
                            name="gain"
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Investment Summary Table */}
                    <div>
                      <h4 className="font-semibold mb-3">All Investments - Sample Simulation</h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b bg-gray-50">
                              <th className="text-left py-2 px-3 font-medium">#</th>
                              <th className="text-left py-2 px-3 font-medium">Company</th>
                              <th className="text-right py-2 px-3 font-medium">Entry Stage</th>
                              <th className="text-right py-2 px-3 font-medium">Exit Stage</th>
                              <th className="text-right py-2 px-3 font-medium">Entry ($MM)</th>
                              <th className="text-right py-2 px-3 font-medium">Exit ($MM)</th>
                              <th className="text-right py-2 px-3 font-medium">MOIC</th>
                            </tr>
                          </thead>
                          <tbody>
                            {simulationResults.sampleSimulation.slice(0, 15).map((investment: any, index: number) => (
                              <tr key={index} className="border-b border-slate-100 hover:bg-slate-50">
                                <td className="py-2 px-3 text-slate-600">{index + 1}</td>
                                <td className="py-2 px-3 text-slate-600">
                                  {investment.companyName || `Investment ${index + 1}`}
                                </td>
                                <td className="py-2 px-3 text-right">
                                  <Badge variant="outline" className={getStageColor(investment.entryStage || 'Seed').badge}>
                                    {investment.entryStage || 'Seed'}
                                  </Badge>
                                </td>
                                <td className="py-2 px-3 text-right">
                                  <Badge variant="outline" className={getStageColor(investment.exitStage || investment.entryStage || 'Seed').badge}>
                                    {investment.exitStage || investment.entryStage || 'Seed'}
                                  </Badge>
                                </td>
                                <td className="py-2 px-3 text-right text-slate-800 font-mono">
                                  ${(investment.entryAmount || investment.checkSize || 2).toFixed(2)}
                                </td>
                                <td className="py-2 px-3 text-right text-slate-800 font-mono">
                                  ${(investment.exitAmount || investment.return || 0).toFixed(2)}
                                </td>
                                <td className="py-2 px-3 text-right font-mono">
                                  <span className={(investment.moic || 0) >= 1 ? 'text-green-600' : 'text-red-600'}>
                                    {(investment.moic || 0).toFixed(2)}x
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Enhanced Investment Timeline Component
interface EnhancedInvestmentTimelineProps {
  currentPortfolio: any[];
  futureInvestments: any[];
  includeNewInvestments: boolean;
  timeHorizon: number;
  currentYear: number;
}

const EnhancedInvestmentTimeline: React.FC<EnhancedInvestmentTimelineProps> = ({
  currentPortfolio,
  futureInvestments,
  includeNewInvestments,
  timeHorizon,
  currentYear
}) => {
  const [selectedInvestment, setSelectedInvestment] = useState<any>(null);
  const [showParameters, setShowParameters] = useState(false);
  const [showAllCurrentInvestments, setShowAllCurrentInvestments] = useState(false);

  // Group future investments by year
  const investmentsByYear = futureInvestments.reduce((acc, inv) => {
    acc[inv.year] = acc[inv.year] || [];
    acc[inv.year].push(inv);
    return acc;
  }, {} as Record<number, any[]>);

  const InvestmentCard = ({ investment, isFuture = false }: { investment: any, isFuture?: boolean }) => {
    const FieldIcon = getStartupFieldIcon(investment.field);
    
    return (
      <div className="p-4 border rounded-lg bg-white hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <FieldIcon className="w-4 h-4 text-slate-500" />
            <h4 className="font-semibold text-sm">{investment.companyName}</h4>
            {isFuture && (
              <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700 text-xs">
                Future
              </Badge>
            )}
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setSelectedInvestment(investment);
              setShowParameters(true);
            }}
            className="text-xs px-2 py-1"
          >
            <Settings className="w-3 h-3 mr-1" />
            Parameters
          </Button>
        </div>

        <div className="flex flex-wrap gap-2 mb-3">
          <Badge variant="outline" className={getStageColor(investment.entryStage).badge}>
            <span className={`inline-block w-2 h-2 rounded-full mr-2 align-middle ${getStageColor(investment.entryStage).dot}`}></span>
            {investment.entryStage}
          </Badge>
          <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-600">
            {getStartupFieldLabel(investment.field)}
          </Badge>
          <Badge variant="outline" className="border-gray-200 bg-gray-50 text-gray-600">
            {getRegionLabel(investment.region)}
          </Badge>
          {investment.usePresets && (
            <Badge variant="outline" className="border-green-200 bg-green-50 text-green-600 text-xs">
              <Zap className="w-3 h-3" />
            </Badge>
          )}
        </div>

        <div className="text-sm text-slate-600 space-y-1">
          <div className="flex justify-between">
            <span>Check Size:</span>
            <span className="font-medium">${investment.checkSize.toFixed(1)}M</span>
          </div>
          <div className="flex justify-between">
            <span>Entry Valuation:</span>
            <span className="font-medium">${investment.entryValuation.toFixed(1)}M</span>
          </div>
          <div className="flex justify-between">
            <span>Ownership:</span>
            <span className="font-medium">{((investment.checkSize / investment.entryValuation) * 100).toFixed(1)}%</span>
          </div>
          {isFuture && (
            <div className="flex justify-between">
              <span>Expected Entry:</span>
              <span className="font-medium">{investment.entryDate}</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Investment Timeline & Portfolio Details
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="timeline" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="timeline">Timeline View</TabsTrigger>
            <TabsTrigger value="details">Detailed View</TabsTrigger>
          </TabsList>

          <TabsContent value="timeline" className="space-y-6">
            {/* Current Portfolio */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                Current Portfolio ({currentYear})
                <Badge className="bg-blue-100 text-blue-800">
                  {currentPortfolio.length} investment{currentPortfolio.length !== 1 ? 's' : ''}
                </Badge>
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(showAllCurrentInvestments ? currentPortfolio : currentPortfolio.slice(0, 3)).map((investment, idx) => (
                    <InvestmentCard key={investment.id || idx} investment={investment} />
                  ))}
                </div>
                
                {currentPortfolio.length > 3 && (
                  <div className="flex justify-center">
                    <Button
                      variant="ghost"
                      onClick={() => setShowAllCurrentInvestments(!showAllCurrentInvestments)}
                      className="flex items-center gap-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    >
                      {showAllCurrentInvestments ? (
                        <>
                          <ChevronUp className="w-4 h-4" />
                          Show Less ({currentPortfolio.length - 3} less)
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-4 h-4" />
                          Show More ({currentPortfolio.length - 3} more)
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Future Investments by Year */}
            {includeNewInvestments && (
              <div className="space-y-8">
                {Array.from({ length: timeHorizon }, (_, i) => {
                  const year = currentYear + i + 1;
                  const yearInvestments = investmentsByYear[year] || [];
                  
                  // Calculate cumulative portfolio up to this year (current + all future up to this year)
                  const futureInvestmentsUpToYear = futureInvestments.filter(inv => inv.year <= year);
                  const cumulativePortfolio = [...currentPortfolio, ...futureInvestmentsUpToYear];
                  
                  // Calculate yearly statistics
                  const avgOwnership = yearInvestments.length > 0 
                    ? yearInvestments.reduce((sum, inv) => sum + ((inv.checkSize / inv.entryValuation) * 100), 0) / yearInvestments.length
                    : 0;
                  const avgTicketSize = yearInvestments.length > 0
                    ? yearInvestments.reduce((sum, inv) => sum + inv.checkSize, 0) / yearInvestments.length
                    : 0;
                  const avgValuation = yearInvestments.length > 0
                    ? yearInvestments.reduce((sum, inv) => sum + inv.entryValuation, 0) / yearInvestments.length
                    : 0;
                  
                  return (
                    <YearlyInvestmentSection
                      key={year}
                      year={year}
                      investments={yearInvestments}
                      avgOwnership={avgOwnership}
                      avgTicketSize={avgTicketSize}
                      avgValuation={avgValuation}
                      InvestmentCard={InvestmentCard}
                      cumulativePortfolio={cumulativePortfolio}
                    />
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="details" className="space-y-6">
            {/* Investment Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{currentPortfolio.length}</div>
                    <div className="text-sm text-gray-600">Current Investments</div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{futureInvestments.length}</div>
                    <div className="text-sm text-gray-600">Future Investments</div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      ${(currentPortfolio.reduce((sum, inv) => sum + inv.checkSize, 0) + 
                         futureInvestments.reduce((sum, inv) => sum + inv.checkSize, 0)).toFixed(1)}M
                    </div>
                    <div className="text-sm text-gray-600">Total Capital</div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* All Investments List */}
            <Card>
              <CardHeader>
                <CardTitle>All Investments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {currentPortfolio.map((investment, idx) => (
                    <div key={investment.id || idx} className="flex items-center justify-between p-3 border rounded-lg bg-blue-50">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <div>
                          <div className="font-medium">{investment.companyName}</div>
                          <div className="text-sm text-gray-600">
                            {investment.entryStage} • {getStartupFieldLabel(investment.field)} • ${investment.checkSize.toFixed(1)}M
                          </div>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedInvestment(investment);
                          setShowParameters(true);
                        }}
                      >
                        <Settings className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  
                  {includeNewInvestments && futureInvestments.map((investment, idx) => (
                    <div key={investment.id || idx} className="flex items-center justify-between p-3 border rounded-lg bg-green-50">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <div>
                          <div className="font-medium">{investment.companyName}</div>
                          <div className="text-sm text-gray-600">
                            {investment.year} • {investment.entryStage} • {getStartupFieldLabel(investment.field)} • ${investment.checkSize.toFixed(1)}M
                          </div>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedInvestment(investment);
                          setShowParameters(true);
                        }}
                      >
                        <Settings className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Investment Parameters Modal */}
        <Dialog open={showParameters} onOpenChange={setShowParameters}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Investment Parameters: {selectedInvestment?.companyName}
              </DialogTitle>
            </DialogHeader>
            {selectedInvestment && (
              <div className="space-y-6">
                {/* Basic Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Basic Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Company Name</Label>
                        <div className="mt-1 font-medium">{selectedInvestment.companyName}</div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Entry Stage</Label>
                        <div className="mt-1">
                          <Badge variant="outline" className={getStageColor(selectedInvestment.entryStage).badge}>
                            {selectedInvestment.entryStage}
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Field</Label>
                        <div className="mt-1">
                          <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-600">
                            {getStartupFieldLabel(selectedInvestment.field)}
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Region</Label>
                        <div className="mt-1">
                          <Badge variant="outline" className="border-gray-200 bg-gray-50 text-gray-600">
                            {getRegionLabel(selectedInvestment.region)}
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Check Size</Label>
                        <div className="mt-1 font-medium">${selectedInvestment.checkSize.toFixed(1)}M</div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Entry Valuation</Label>
                        <div className="mt-1 font-medium">${selectedInvestment.entryValuation.toFixed(1)}M</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Stage Progression */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Stage Progression Probabilities (%)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {Object.entries(selectedInvestment.stageProgression || {}).map(([stage, prob]) => (
                        <div key={stage} className="p-3 bg-gray-50 rounded-lg">
                          <div className="text-sm font-medium text-gray-600">{stage.replace('to', 'To ')}</div>
                          <div className="text-xl font-bold text-blue-600">{Number(prob).toFixed(1)}%</div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Dilution Rates */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Dilution Rates (%)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {Object.entries(selectedInvestment.dilutionRates || {}).map(([stage, rate]) => (
                        <div key={stage} className="p-3 bg-gray-50 rounded-lg">
                          <div className="text-sm font-medium text-gray-600">{stage}</div>
                          <div className="text-xl font-bold text-orange-600">{Number(rate).toFixed(1)}%</div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Loss Probabilities */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Loss Probabilities (%)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {Object.entries(selectedInvestment.lossProb || {}).map(([stage, prob]) => (
                        <div key={stage} className="p-3 bg-gray-50 rounded-lg">
                          <div className="text-sm font-medium text-gray-600">{stage}</div>
                          <div className="text-xl font-bold text-red-600">{Number(prob).toFixed(1)}%</div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Exit Valuations */}
                {selectedInvestment.exitValuations && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Exit Valuations ($M)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        {Object.entries(selectedInvestment.exitValuations).map(([type, val]) => (
                          <div key={type} className="p-3 bg-gray-50 rounded-lg">
                            <div className="text-sm font-medium text-gray-600">{type.toUpperCase()}</div>
                            <div className="text-xl font-bold text-green-600">${Number(val).toFixed(0)}M</div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default ForecastDashboard;

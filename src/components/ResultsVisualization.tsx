
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import type { SimulationResults, SimulationParams } from '@/types/simulation';

interface ResultsVisualizationProps {
  results: SimulationResults;
  params: SimulationParams;
}

const ResultsVisualization = ({ results, params }: ResultsVisualizationProps) => {
  // Prepare MOIC distribution data
  const moicBuckets = Array.from({ length: 10 }, (_, i) => ({
    range: `${i}x-${i + 1}x`,
    count: 0
  }));

  results.simulations.forEach(sim => {
    const bucket = Math.min(Math.floor(sim.moic), 9);
    moicBuckets[bucket].count++;
  });

  // Prepare sample investment data
  const sampleInvestmentData = results.sampleSimulation.map((inv, index) => ({
    investment: `#${index + 1}`,
    entry: inv.entryAmount,
    exit: inv.exitAmount,
    gain: inv.exitAmount - inv.entryAmount,
    entryStage: inv.entryStage,
    exitStage: inv.exitStage
  }));

  // Calculate performance by stage
  const stagePerformance = Object.keys(params.stageAllocations).map(stage => {
    const stageInvestments = results.simulations.flatMap(sim => 
      sim.investments.filter(inv => inv.entryStage === stage)
    );
    
    const avgReturn = stageInvestments.length > 0 
      ? stageInvestments.reduce((sum, inv) => sum + inv.exitAmount, 0) / 
        stageInvestments.reduce((sum, inv) => sum + inv.entryAmount, 0)
      : 0;

    return {
      stage,
      avgReturn,
      count: stageInvestments.length / params.numSimulations
    };
  });

  return (
    <div className="space-y-8">
      {/* MOIC Distribution */}
      <Card className="border-slate-200 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50 border-b">
          <CardTitle className="text-lg text-slate-800">Fund MOIC Distribution</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={moicBuckets}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                dataKey="range" 
                tick={{ fontSize: 12 }} 
                stroke="#64748b"
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
              />
              <Bar 
                dataKey="count" 
                fill="url(#purpleGradient)" 
                radius={[4, 4, 0, 0]}
              />
              <defs>
                <linearGradient id="purpleGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" />
                  <stop offset="100%" stopColor="#6366f1" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Stage Performance */}
      <Card className="border-slate-200 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
          <CardTitle className="text-lg text-slate-800">Average Returns by Stage</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stagePerformance}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                dataKey="stage" 
                tick={{ fontSize: 12 }} 
                stroke="#64748b"
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
                formatter={(value: number) => [`${value.toFixed(2)}x`, 'Avg Multiple']}
              />
              <Bar 
                dataKey="avgReturn" 
                fill="url(#greenGradient)" 
                radius={[4, 4, 0, 0]}
              />
              <defs>
                <linearGradient id="greenGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#059669" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Sample Investment Performance */}
      <Card className="border-slate-200 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 border-b">
          <CardTitle className="text-lg text-slate-800">
            Sample Simulation: Investment Performance
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={sampleInvestmentData.slice(0, 20)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                dataKey="investment" 
                tick={{ fontSize: 10 }} 
                stroke="#64748b"
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
                  if (name === 'entry') return [`$${value.toFixed(2)}MM`, 'Entry Amount'];
                  if (name === 'exit') return [`$${value.toFixed(2)}MM`, 'Exit Amount'];
                  return [`$${value.toFixed(2)}MM`, name];
                }}
              />
              <Bar 
                dataKey="entry" 
                fill="#3b82f6" 
                name="entry"
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
        </CardContent>
      </Card>

      {/* Investment Summary Table */}
      <Card className="border-slate-200 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50 border-b">
          <CardTitle className="text-lg text-slate-800">Sample Simulation Details</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-2 px-3 font-semibold text-slate-700">#</th>
                  <th className="text-left py-2 px-3 font-semibold text-slate-700">Entry Stage</th>
                  <th className="text-left py-2 px-3 font-semibold text-slate-700">Exit Stage</th>
                  <th className="text-right py-2 px-3 font-semibold text-slate-700">Entry ($MM)</th>
                  <th className="text-right py-2 px-3 font-semibold text-slate-700">Exit ($MM)</th>
                  <th className="text-right py-2 px-3 font-semibold text-slate-700">Multiple</th>
                </tr>
              </thead>
              <tbody>
                {sampleInvestmentData.slice(0, 10).map((inv, index) => (
                  <tr key={index} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-2 px-3 text-slate-600">{index + 1}</td>
                    <td className="py-2 px-3 text-slate-600">{inv.entryStage}</td>
                    <td className="py-2 px-3 text-slate-600">{inv.exitStage}</td>
                    <td className="py-2 px-3 text-right text-slate-800 font-mono">
                      ${inv.entry.toFixed(2)}
                    </td>
                    <td className="py-2 px-3 text-right text-slate-800 font-mono">
                      ${inv.exit.toFixed(2)}
                    </td>
                    <td className="py-2 px-3 text-right font-mono">
                      <span className={inv.exit >= inv.entry ? 'text-green-600' : 'text-red-600'}>
                        {(inv.exit / inv.entry).toFixed(2)}x
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResultsVisualization;

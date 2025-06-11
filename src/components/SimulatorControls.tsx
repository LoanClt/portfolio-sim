
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import type { SimulationParams } from '@/types/simulation';

interface SimulatorControlsProps {
  params: SimulationParams;
  onChange: (params: SimulationParams) => void;
}

const stages = ['Pre-Seed', 'Seed', 'Series A', 'Series B'];

const SimulatorControls = ({ params, onChange }: SimulatorControlsProps) => {
  const updateParam = <K extends keyof SimulationParams>(
    key: K,
    value: SimulationParams[K]
  ) => {
    onChange({ ...params, [key]: value });
  };

  const updateNestedParam = <T extends Record<string, any>>(
    category: keyof SimulationParams,
    key: string,
    value: any
  ) => {
    const updated = { ...params[category] as T, [key]: value };
    onChange({ ...params, [category]: updated });
  };

  return (
    <div className="space-y-6 p-6 max-h-[80vh] overflow-y-auto">
      {/* Fund Parameters */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="fundSize">Fund Size ($MM)</Label>
          <Input
            id="fundSize"
            type="number"
            value={params.fundSize}
            onChange={(e) => updateParam('fundSize', Number(e.target.value))}
            className="mt-1"
          />
        </div>

        <div>
          <Label>Initial Investment Stage</Label>
          <Select value={params.initialStage} onValueChange={(value) => updateParam('initialStage', value)}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {stages.map(stage => (
                <SelectItem key={stage} value={stage}>{stage}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Management Fee (%): {params.managementFeePct.toFixed(1)}</Label>
          <Slider
            value={[params.managementFeePct]}
            onValueChange={([value]) => updateParam('managementFeePct', value)}
            max={5}
            min={0}
            step={0.1}
            className="mt-2"
          />
        </div>

        <div>
          <Label>Management Fee Years: {params.managementFeeYears}</Label>
          <Slider
            value={[params.managementFeeYears]}
            onValueChange={([value]) => updateParam('managementFeeYears', value)}
            max={10}
            min={1}
            step={1}
            className="mt-2"
          />
        </div>

        <div>
          <Label>Number of Simulations: {params.numSimulations}</Label>
          <Slider
            value={[params.numSimulations]}
            onValueChange={([value]) => updateParam('numSimulations', value)}
            max={100000}
            min={10}
            step={100}
            className="mt-2"
          />
        </div>
      </div>

      <Separator />

      {/* Stage Allocations */}
      <div className="space-y-4">
        <h3 className="font-semibold text-sm uppercase tracking-wide text-slate-600">
          Stage Allocations (%)
        </h3>
        {Object.entries(params.stageAllocations).map(([stage, allocation]) => (
          <div key={stage}>
            <Label>{stage}: {allocation}%</Label>
            <Slider
              value={[allocation]}
              onValueChange={([value]) => updateNestedParam('stageAllocations', stage, value)}
              max={100}
              min={0}
              step={5}
              className="mt-2"
            />
          </div>
        ))}
      </div>

      <Separator />

      {/* Valuations */}
      <div className="space-y-4">
        <h3 className="font-semibold text-sm uppercase tracking-wide text-slate-600">
          Entry Valuations ($MM)
        </h3>
        {Object.entries(params.valuations).map(([stage, [min, max]]) => (
          <div key={stage} className="space-y-2">
            <Label className="text-xs">{stage}: ${min}MM - ${max}MM</Label>
            <div className="flex space-x-2">
              <Input
                type="number"
                value={min}
                onChange={(e) => {
                  const newMin = Number(e.target.value);
                  updateNestedParam('valuations', stage, [newMin, max]);
                }}
                className="text-xs"
                placeholder="Min"
              />
              <Input
                type="number"
                value={max}
                onChange={(e) => {
                  const newMax = Number(e.target.value);
                  updateNestedParam('valuations', stage, [min, newMax]);
                }}
                className="text-xs"
                placeholder="Max"
              />
            </div>
          </div>
        ))}
      </div>

      <Separator />

      {/* Check Sizes */}
      <div className="space-y-4">
        <h3 className="font-semibold text-sm uppercase tracking-wide text-slate-600">
          Check Sizes ($MM)
        </h3>
        {Object.entries(params.checkSizes).map(([stage, [min, max]]) => (
          <div key={stage} className="space-y-2">
            <Label className="text-xs">{stage}: ${min}MM - ${max}MM</Label>
            <div className="flex space-x-2">
              <Input
                type="number"
                value={min}
                onChange={(e) => {
                  const newMin = Number(e.target.value);
                  updateNestedParam('checkSizes', stage, [newMin, max]);
                }}
                className="text-xs"
                placeholder="Min"
                step="0.1"
              />
              <Input
                type="number"
                value={max}
                onChange={(e) => {
                  const newMax = Number(e.target.value);
                  updateNestedParam('checkSizes', stage, [min, newMax]);
                }}
                className="text-xs"
                placeholder="Max"
                step="0.1"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SimulatorControls;

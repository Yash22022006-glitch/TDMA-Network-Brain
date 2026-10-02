import React, { useState } from 'react';
import {
  RadioNode,
  ScheduleResult
} from '../types/tdma';
import { ColoringAlgorithm, getSlotColor } from '../utils/tdmaEngine';
import { Cpu, CheckCircle2, Sliders, Play, Clock, Sparkles } from 'lucide-react';

interface ScheduleOptimizerViewProps {
  nodes: RadioNode[];
  scheduleResult: ScheduleResult;
  algorithm: ColoringAlgorithm;
  onAlgorithmChange: (algo: ColoringAlgorithm) => void;
  onRunOptimization: () => void;
  isOptimizing?: boolean;
}

export const ScheduleOptimizerView: React.FC<ScheduleOptimizerViewProps> = ({
  nodes,
  scheduleResult,
  algorithm,
  onAlgorithmChange,
  onRunOptimization,
  isOptimizing = false
}) => {
  const [maxIterations, setMaxIterations] = useState(100);
  const [optStrategy, setOptStrategy] = useState('spatial-reuse');

  // Find max nodes assigned to any slot for bar chart scaling
  const maxSlotNodes = Math.max(
    ...scheduleResult.slotDistribution.map(s => s.nodes.length),
    1
  );

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Schedule Optimizer</h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Generate TDMA schedule using Distance-2 coloring and spatial reuse optimization
        </p>
      </div>

      {/* 3-Column Layout: Settings / Progress / Results */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Algorithm Settings (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
          <div className="flex items-center space-x-2">
            <Sliders className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-slate-900 text-base">Algorithm Settings</h3>
          </div>

          {/* Strategy selector */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              Coloring Strategy
            </label>
            <select
              value={algorithm}
              onChange={e => onAlgorithmChange(e.target.value as ColoringAlgorithm)}
              className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:outline-blue-500 cursor-pointer"
            >
              <option value="dsatur">Distance-2 Coloring (DSATUR)</option>
              <option value="largest-first">Welsh-Powell (Largest First)</option>
              <option value="greedy">Greedy (Deterministic)</option>
            </select>
            <p className="text-[11px] text-slate-400">
              DSATUR selects uncolored vertices with highest saturation degree for minimal chromatic number.
            </p>
          </div>

          {/* Optimization heuristic */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              Optimization
            </label>
            <select
              value={optStrategy}
              onChange={e => setOptStrategy(e.target.value)}
              className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:outline-blue-500 cursor-pointer"
            >
              <option value="spatial-reuse">Spatial Reuse (Greedy)</option>
              <option value="conflict-aware">Conflict-aware Reassignment</option>
              <option value="compaction">Iterative Slot Compaction</option>
            </select>
          </div>

          {/* Max Iterations */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              Max Iterations
            </label>
            <input
              type="number"
              value={maxIterations}
              onChange={e => setMaxIterations(Number(e.target.value))}
              min="10"
              max="500"
              className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:outline-blue-500"
            />
          </div>

          <button
            onClick={onRunOptimization}
            disabled={isOptimizing}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold rounded-xl shadow-md shadow-blue-500/25 transition text-xs flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
          >
            {isOptimizing ? (
              <>
                <Cpu className="w-4 h-4 animate-spin" />
                <span>Optimizing Schedule...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate Optimal Schedule</span>
              </>
            )}
          </button>
        </div>

        {/* Center Column: Optimization Progress (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
          <h3 className="font-bold text-slate-900 text-base">Optimization Progress</h3>

          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-blue-100">
            {scheduleResult.steps.map((step, idx) => {
              const isLast = idx === scheduleResult.steps.length - 1;
              return (
                <div key={step.step} className="relative group">
                  {/* Step indicator circle */}
                  <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold shadow-xs">
                    {step.step}
                  </div>

                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 text-xs">{step.name}</span>
                      <span className="text-xs font-mono font-bold text-blue-600 bg-white px-2 py-0.5 rounded-full border border-blue-100 shadow-xs">
                        Slots: {step.slots}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-snug">
                      {step.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Results & Slot Usage Distribution (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Results Summary Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-3.5">
            <h3 className="font-bold text-slate-900 text-base">Results</h3>

            <div className="space-y-3 text-sm divide-y divide-slate-100">
              <div className="flex justify-between items-center pt-1">
                <span className="text-slate-500">Initial Slots</span>
                <span className="font-bold text-slate-800">{scheduleResult.initialSlots}</span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-slate-500">Optimized Slots</span>
                <span className="font-bold text-blue-600 text-base">{scheduleResult.optimizedSlots}</span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-slate-500">Reduction</span>
                <span className="font-bold text-emerald-600">{scheduleResult.reductionPercent}%</span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-slate-500">Execution Time</span>
                <span className="font-mono font-semibold text-slate-700">
                  {scheduleResult.executionTimeMs} ms
                </span>
              </div>
            </div>
          </div>

          {/* Slot Usage Distribution Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Slot Usage Distribution</h3>

            <div className="space-y-3">
              {scheduleResult.slotDistribution.map(item => {
                const count = item.nodes.length;
                const widthPercent = (count / maxSlotNodes) * 100;
                return (
                  <div key={item.slot} className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-700 flex items-center space-x-1.5">
                        <span
                          className="w-2.5 h-2.5 rounded-full inline-block"
                          style={{ backgroundColor: item.color }}
                        />
                        <span>Slot {item.slot}</span>
                      </span>
                      <span className="font-mono text-slate-500 font-semibold">
                        {count} {count === 1 ? 'node' : 'nodes'}
                      </span>
                    </div>

                    {/* Bar with matching slot color */}
                    <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.max(widthPercent, 8)}%`,
                          backgroundColor: item.color
                        }}
                      />
                    </div>

                    <div className="text-[10px] text-slate-400 font-mono pl-4">
                      {item.nodes.join(', ')}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

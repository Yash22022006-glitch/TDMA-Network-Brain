import React, { useState } from 'react';
import {
  RadioNode,
  CommunicationEdge,
  ConflictEdge,
  ScheduleResult,
  ValidationReport
} from '../types/tdma';
import { NetworkGraphCanvas } from './NetworkGraphCanvas';
import {
  Radio,
  Share2,
  AlertTriangle,
  Layers,
  ArrowRight,
  ShieldCheck,
  PlayCircle,
  Table2,
  Cpu,
  ChevronDown
} from 'lucide-react';

interface DashboardViewProps {
  nodes: RadioNode[];
  communicationEdges: CommunicationEdge[];
  conflictEdges: ConflictEdge[];
  scheduleResult: ScheduleResult;
  validation: ValidationReport;
  radioRange: number;
  onNavigateTab: (tab: any) => void;
  onRunOptimization: () => void;
  onUpdateNodePosition?: (nodeId: string, newX: number, newY: number) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  nodes,
  communicationEdges,
  conflictEdges,
  scheduleResult,
  validation,
  radioRange,
  onNavigateTab,
  onRunOptimization,
  onUpdateNodePosition
}) => {
  const [topologyMode, setTopologyMode] = useState<'topology' | 'conflict' | 'combined'>('combined');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Overview header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Dashboard</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Overview of network topology, scheduling and simulation status
          </p>
        </div>
      </div>

      {/* Top 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Nodes Card */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs relative overflow-hidden group hover:border-blue-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {nodes.length}
            </span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
              <Radio className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 font-semibold text-slate-700 text-sm">Nodes</div>
          <div className="text-xs text-slate-400 mt-0.5">Input coordinates loaded</div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500 opacity-80" />
        </div>

        {/* Communication Links Card */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs relative overflow-hidden group hover:border-emerald-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {communicationEdges.length}
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <Share2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 font-semibold text-slate-700 text-sm">Communication Links</div>
          <div className="text-xs text-slate-400 mt-0.5">Within {radioRange} m range</div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500 opacity-80" />
        </div>

        {/* Conflict Pairs Card */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs relative overflow-hidden group hover:border-rose-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {conflictEdges.length}
            </span>
            <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 font-semibold text-slate-700 text-sm">Conflict Pairs</div>
          <div className="text-xs text-slate-400 mt-0.5">1-hop + 2-hop conflicts</div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-rose-500 opacity-80" />
        </div>

        {/* Time Slots Card */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs relative overflow-hidden group hover:border-purple-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {scheduleResult.optimizedSlots}
            </span>
            <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 font-semibold text-slate-700 text-sm">Time Slots</div>
          <div className="text-xs text-slate-400 mt-0.5">Optimized with spatial reuse</div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-purple-500 opacity-80" />
        </div>
      </div>

      {/* Main Grid: Network Topology & Schedule Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Network Topology (Col span 2) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-900 text-lg">Network Topology</h3>
              {/* Legend matching screenshot */}
              <div className="flex items-center space-x-4 mt-2 text-xs text-slate-600 font-medium">
                <span className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block"></span>
                  <span>Node</span>
                </span>
                <span className="flex items-center space-x-1.5">
                  <span className="w-4 h-0.5 bg-blue-600 inline-block"></span>
                  <span>Communication Link</span>
                </span>
                <span className="flex items-center space-x-1.5">
                  <span className="w-4 h-0.5 border-t border-dashed border-rose-500 inline-block"></span>
                  <span>Conflict Link (2-hop)</span>
                </span>
              </div>
            </div>

            {/* View selector dropdown */}
            <div className="flex items-center space-x-2">
              <div className="relative">
                <select
                  value={topologyMode}
                  onChange={e => setTopologyMode(e.target.value as any)}
                  className="appearance-none bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold py-1.5 pl-3 pr-8 rounded-lg cursor-pointer hover:bg-slate-100 transition focus:outline-none"
                >
                  <option value="combined">Combined View</option>
                  <option value="topology">Topology View</option>
                  <option value="conflict">Conflict View</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-2.5 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Interactive Graph Canvas */}
          <NetworkGraphCanvas
            nodes={nodes}
            communicationEdges={communicationEdges}
            conflictEdges={conflictEdges}
            nodeToSlot={scheduleResult.nodeToSlot}
            selectedNodeId={selectedNodeId}
            onSelectNode={setSelectedNodeId}
            onUpdateNodePosition={onUpdateNodePosition}
            viewMode={topologyMode}
            radioRangeMeters={radioRange}
            showRangeCircles={true}
            isDraggable={true}
            height={460}
          />
        </div>

        {/* Schedule Summary & Quick Actions (Col span 1) */}
        <div className="space-y-6">
          {/* Schedule Summary Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <h3 className="font-bold text-slate-900 text-base mb-4">Schedule Summary</h3>
            <div className="space-y-3.5 text-sm divide-y divide-slate-100">
              <div className="flex justify-between items-center pt-1">
                <span className="text-slate-500">Total Nodes</span>
                <span className="font-bold text-slate-800">{nodes.length}</span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-slate-500">Total Slots (Initial)</span>
                <span className="font-bold text-slate-800">{scheduleResult.initialSlots}</span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-slate-500">Total Slots (Optimized)</span>
                <span className="font-bold text-blue-600 text-base">{scheduleResult.optimizedSlots}</span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-slate-500">Slot Reduction</span>
                <span className="font-bold text-emerald-600">{scheduleResult.reductionPercent}%</span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-slate-500">Spatial Reuse</span>
                <span className="font-bold text-emerald-600">{scheduleResult.spatialReusePercent}%</span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-slate-500">Validation Status</span>
                {validation.valid ? (
                  <span className="inline-flex items-center text-emerald-600 font-bold text-xs bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                    Valid
                  </span>
                ) : (
                  <span className="inline-flex items-center text-rose-600 font-bold text-xs bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
                    <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                    {validation.violations.length} Conflicts
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-3">
            <h3 className="font-bold text-slate-900 text-base mb-1">Quick Actions</h3>

            <button
              onClick={onRunOptimization}
              className="w-full flex items-center justify-center space-x-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-md shadow-blue-500/25 transition text-sm cursor-pointer"
            >
              <Cpu className="w-4 h-4" />
              <span>Generate Schedule</span>
            </button>

            <button
              onClick={() => onNavigateTab('matrix')}
              className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold rounded-xl border border-slate-200 transition text-sm cursor-pointer"
            >
              <Table2 className="w-4 h-4 text-slate-500" />
              <span>View Matrix</span>
            </button>

            <button
              onClick={() => onNavigateTab('emane')}
              className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-xl border border-slate-200 transition text-sm cursor-pointer"
            >
              <PlayCircle className="w-4 h-4 text-blue-600" />
              <span>Run Simulation (EMANE)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

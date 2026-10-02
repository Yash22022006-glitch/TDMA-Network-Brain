import React, { useState } from 'react';
import { RadioNode, CommunicationEdge, ConflictEdge, ScheduleResult } from '../types/tdma';
import { NetworkGraphCanvas } from './NetworkGraphCanvas';
import { GitFork, Share2, AlertTriangle, Info } from 'lucide-react';

interface ConflictGraphViewProps {
  nodes: RadioNode[];
  communicationEdges: CommunicationEdge[];
  conflictEdges: ConflictEdge[];
  scheduleResult: ScheduleResult;
  radioRange: number;
}

export const ConflictGraphView: React.FC<ConflictGraphViewProps> = ({
  nodes,
  communicationEdges,
  conflictEdges,
  scheduleResult,
  radioRange
}) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const directCount = conflictEdges.filter(e => e.type === '1-hop').length;
  const twoHopCount = conflictEdges.filter(e => e.type === '2-hop').length;

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Conflict Graph</h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Visualize 1-hop, 2-hop relationships and the distance-2 conflict graph
        </p>
      </div>

      {/* Info Banner */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-rose-50 border border-blue-200/80 rounded-2xl p-4 flex items-start space-x-3 text-xs text-slate-700">
        <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-slate-900">Graph Theory & Conflict Modeling: </span>
          The <span className="font-semibold text-blue-700">Communication Graph</span> (left) defines who can hear each other directly within {radioRange}m.
          The <span className="font-semibold text-rose-700">Distance-2 Conflict Graph</span> (right) transforms direct links AND two-hop hidden-terminal relationships (radios sharing a common relay neighbor) into scheduling conflict edges. Coloring the conflict graph guarantees collision-free TDMA slots.
        </div>
      </div>

      {/* Comparison Stat Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 border border-blue-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              1-Hop Direct Links
            </div>
            <div className="text-2xl font-extrabold text-blue-600 mt-1">
              {directCount}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Share2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-rose-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              2-Hop Hidden-Terminal Conflicts
            </div>
            <div className="text-2xl font-extrabold text-rose-600 mt-1">
              {twoHopCount}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Conflict Edges
            </div>
            <div className="text-2xl font-extrabold text-slate-900 mt-1">
              {conflictEdges.length}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
            <GitFork className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Side-by-Side Visualizer */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left: Communication Graph (1-hop) in Blue */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-blue-600 inline-block" />
              <span>Communication Graph (1-hop)</span>
            </h3>
            <span className="text-xs font-mono font-medium text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
              {directCount} edges
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Physical RF connectivity graph: edge exists if distance(u, v) ≤ {radioRange}m.
          </p>

          <NetworkGraphCanvas
            nodes={nodes}
            communicationEdges={communicationEdges}
            conflictEdges={[]}
            nodeToSlot={scheduleResult.nodeToSlot}
            selectedNodeId={selectedNodeId}
            onSelectNode={setSelectedNodeId}
            viewMode="topology"
            show2HopLinks={false}
            radioRangeMeters={radioRange}
            height={460}
          />
        </div>

        {/* Right: Distance-2 Conflict Graph in Red/Coral */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-rose-500 inline-block" />
              <span>Distance-2 Conflict Graph</span>
            </h3>
            <span className="text-xs font-mono font-medium text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
              {conflictEdges.length} conflict edges
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Graph coloring target: edge exists if 1-hop OR 2-hop (shared common neighbor).
          </p>

          <NetworkGraphCanvas
            nodes={nodes}
            communicationEdges={[]}
            conflictEdges={conflictEdges}
            nodeToSlot={scheduleResult.nodeToSlot}
            selectedNodeId={selectedNodeId}
            onSelectNode={setSelectedNodeId}
            viewMode="conflict"
            show2HopLinks={true}
            radioRangeMeters={radioRange}
            height={460}
          />
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import {
  RadioNode,
  ConflictEdge,
  ValidationReport,
  Violation
} from '../types/tdma';
import { ShieldCheck, AlertTriangle, Check, X, Bug, RefreshCw } from 'lucide-react';

interface ValidationViewProps {
  nodes: RadioNode[];
  conflictEdges: ConflictEdge[];
  validation: ValidationReport;
  radioRange: number;
  nodeToSlot: Record<string, number>;
  onSimulateCollisionTest: (nodeA: string, nodeB: string) => void;
  onResetSchedule: () => void;
  isSimulatedViolation: boolean;
}

export const ValidationView: React.FC<ValidationViewProps> = ({
  nodes,
  conflictEdges,
  validation,
  radioRange,
  nodeToSlot,
  onSimulateCollisionTest,
  onResetSchedule,
  isSimulatedViolation
}) => {
  const [selectedPair, setSelectedPair] = useState<string>('');

  const checklistItems = [
    { label: 'Node Count', value: validation.nodeCount.toString(), ok: validation.nodeCount > 0 },
    { label: 'Communication Range', value: `${radioRange} m`, ok: true },
    { label: 'Direct Conflicts (1-hop)', value: validation.directConflictsCount.toString(), ok: true },
    { label: 'Two-Hop Conflicts', value: validation.twoHopConflictsCount.toString(), ok: true },
    { label: 'Total Conflict Edges', value: validation.totalConflictEdgesCount.toString(), ok: true },
    {
      label: 'Slot Assignments',
      value: validation.slotAssignmentsCount.toString(),
      ok: validation.slotAssignmentsCount === validation.nodeCount
    },
    { label: 'Matrix Dimensions', value: validation.matrixDimensions, ok: true },
    {
      label: 'Collision Checks',
      value: `${validation.collisionChecksPassed} / ${validation.totalCollisionChecks}`,
      ok: validation.violations.length === 0
    }
  ];

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Validation</h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Verify that the generated schedule is conflict-free
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Validation Audit Checklist (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
          <h3 className="font-bold text-slate-900 text-base">Schedule Audit Checklist</h3>

          <div className="divide-y divide-slate-100 text-sm">
            {checklistItems.map((item, idx) => (
              <div key={idx} className="py-3 flex items-center justify-between">
                <span className="text-slate-600 font-medium">{item.label}</span>
                <div className="flex items-center space-x-3">
                  <span className="font-bold text-slate-900 font-mono">{item.value}</span>
                  {item.ok ? (
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </span>
                  ) : (
                    <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
                      <X className="w-3.5 h-3.5 stroke-[3]" />
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Status Banner & Collision Stress Tester (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Main Status Banner */}
          {validation.valid ? (
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white shadow-lg shadow-emerald-500/20 space-y-2">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-black tracking-tight">SCHEDULE VALID</h3>
                  <div className="text-emerald-100 text-xs font-semibold uppercase tracking-wider">
                    Zero Violations
                  </div>
                </div>
              </div>
              <p className="text-emerald-50 text-xs leading-relaxed pt-2">
                No conflicting nodes share the same time slot. All 1-hop direct interference and 2-hop hidden terminal constraints are strictly satisfied.
              </p>
            </div>
          ) : (
            <div className="bg-gradient-to-br from-rose-500 to-red-600 rounded-2xl p-6 text-white shadow-lg shadow-rose-500/20 space-y-2">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-black tracking-tight">SCHEDULE INVALID</h3>
                  <div className="text-rose-100 text-xs font-semibold uppercase tracking-wider">
                    {validation.violations.length} Collisions Detected
                  </div>
                </div>
              </div>
              <p className="text-rose-50 text-xs leading-relaxed pt-2">
                Independent collision inspection caught active interference between conflicting nodes!
              </p>
              {isSimulatedViolation && (
                <button
                  onClick={onResetSchedule}
                  className="mt-3 w-full py-2 bg-white text-rose-600 font-bold rounded-xl text-xs flex items-center justify-center space-x-1.5 shadow-sm hover:bg-rose-50"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Restore Valid Schedule</span>
                </button>
              )}
            </div>
          )}

          {/* Violations List if any */}
          {validation.violations.length > 0 && (
            <div className="bg-white rounded-2xl border border-rose-200 p-5 shadow-xs space-y-3">
              <h4 className="font-bold text-rose-900 text-sm flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>Detected Violations ({validation.violations.length})</span>
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {validation.violations.map((v, i) => (
                  <div
                    key={i}
                    className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs space-y-1"
                  >
                    <div className="flex justify-between font-bold text-rose-900">
                      <span>{v.nodeA} ↔ {v.nodeB}</span>
                      <span className="font-mono bg-rose-200 text-rose-800 px-1.5 py-0.5 rounded">
                        Slot {v.slot}
                      </span>
                    </div>
                    <div className="text-[11px] text-rose-700">
                      Conflict Type: <span className="font-semibold">{v.type}</span>
                      {v.commonNeighbor && ` (Relay neighbor: ${v.commonNeighbor})`}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Interactive Collision Stress Tester */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center space-x-2">
              <Bug className="w-4 h-4 text-blue-600" />
              <h4 className="font-bold text-slate-900 text-sm">
                Independent Validator Stress Tester
              </h4>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Section 21 Requirement: <em>"Do not trust the coloring algorithm."</em> Test the independent validator by deliberately forcing an interfering node pair into the same time slot to observe instant violation detection.
            </p>

            <div className="space-y-2">
              <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider">
                Select Interfering Pair to Collide:
              </label>
              <select
                value={selectedPair}
                onChange={e => setSelectedPair(e.target.value)}
                className="w-full text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800"
              >
                <option value="">-- Choose a Conflict Edge --</option>
                {conflictEdges.slice(0, 15).map((e, idx) => (
                  <option key={idx} value={`${e.u},${e.v}`}>
                    {e.u} ↔ {e.v} ({e.type})
                  </option>
                ))}
              </select>

              <button
                disabled={!selectedPair}
                onClick={() => {
                  if (selectedPair) {
                    const [u, v] = selectedPair.split(',');
                    onSimulateCollisionTest(u, v);
                  }
                }}
                className="w-full py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold rounded-lg border border-rose-200 text-xs transition disabled:opacity-50"
              >
                Inject Conflict & Validate
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

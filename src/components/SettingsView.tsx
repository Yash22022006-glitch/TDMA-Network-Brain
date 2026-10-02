import React from 'react';
import { Settings, RefreshCw, Download, Database, Shield } from 'lucide-react';
import { ASSIGNMENT_4X4_GRID } from '../utils/presets';
import { RadioNode } from '../types/tdma';

interface SettingsViewProps {
  radioRange: number;
  onUpdateRange: (range: number) => void;
  onResetDefault: () => void;
  nodeCount: number;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  radioRange,
  onUpdateRange,
  onResetDefault,
  nodeCount
}) => {
  return (
    <div className="p-8 space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">System Settings</h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Configure physical radio parameters, solver constraints, and simulation profiles
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
        <div className="flex items-center space-x-3 border-b border-slate-100 pb-4">
          <Settings className="w-5 h-5 text-blue-600" />
          <h3 className="font-bold text-slate-900 text-base">Radio & Physical Layer Settings</h3>
        </div>

        <div className="space-y-4 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="font-bold text-slate-800">Communication Range Threshold (m)</div>
              <div className="text-slate-500">
                Euclidean cutoff distance for establishing 1-hop communication links.
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                value={radioRange}
                onChange={e => onUpdateRange(Number(e.target.value))}
                min="50"
                max="2000"
                step="50"
                className="w-28 px-3 py-1.5 font-mono text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
              />
              <span className="font-semibold text-slate-400">meters</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-100">
            <div>
              <div className="font-bold text-slate-800">Two-Hop Hidden Terminal Interference Avoidance</div>
              <div className="text-slate-500">
                Strict Distance-2 graph coloring constraint (Mandatory for collision avoidance).
              </div>
            </div>
            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 font-bold rounded-full border border-emerald-200 text-[11px]">
              Enforced (Active)
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-100">
            <div>
              <div className="font-bold text-slate-800">Deterministic Coloring Tie-Breaker</div>
              <div className="text-slate-500">
                Guarantees identical reproducible schedule outputs across runs (Degree → Saturation → Name).
              </div>
            </div>
            <span className="px-2.5 py-1 bg-blue-50 text-blue-700 font-bold rounded-full border border-blue-200 text-[11px]">
              Enabled
            </span>
          </div>
        </div>
      </div>

      {/* Preset & Reset actions */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <h3 className="font-bold text-slate-900 text-base">Benchmark Factory Reset</h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          Restore the official Vaan Megam Networks 16-node 4×4 grid assignment benchmark (300m grid spacing, 500m radio coverage).
        </p>
        <button
          onClick={onResetDefault}
          className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-xl text-xs flex items-center space-x-2 transition"
        >
          <RefreshCw className="w-3.5 h-3.5 text-slate-600" />
          <span>Reset to Official 16-Node Assignment</span>
        </button>
      </div>
    </div>
  );
};

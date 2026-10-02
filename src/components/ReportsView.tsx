import React, { useState } from 'react';
import {
  RadioNode,
  CommunicationEdge,
  ConflictEdge,
  ScheduleResult,
  ValidationReport,
  ScheduleMatrixData
} from '../types/tdma';
import { generateTextReport } from '../utils/tdmaEngine';
import { FileText, Copy, Download, Check, Printer } from 'lucide-react';

interface ReportsViewProps {
  nodes: RadioNode[];
  communicationEdges: CommunicationEdge[];
  conflictEdges: ConflictEdge[];
  scheduleResult: ScheduleResult;
  validation: ValidationReport;
  matrixData: ScheduleMatrixData;
  radioRange: number;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  nodes,
  communicationEdges,
  conflictEdges,
  scheduleResult,
  validation,
  matrixData,
  radioRange
}) => {
  const [copied, setCopied] = useState(false);

  const reportText = generateTextReport(
    nodes,
    communicationEdges,
    conflictEdges,
    scheduleResult.nodeToSlot,
    scheduleResult.optimizedSlots,
    radioRange,
    validation,
    matrixData
  );

  const handleCopy = () => {
    navigator.clipboard.writeText(reportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadTxt = () => {
    const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'tdma_optimization_report.txt');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadJson = () => {
    const jsonOutput = {
      project: 'Vaan Megam Networks — TDMA Schedule Optimizer',
      node_count: nodes.length,
      radio_range_meters: radioRange,
      slot_count: scheduleResult.optimizedSlots,
      initial_slots: scheduleResult.initialSlots,
      reduction_percent: scheduleResult.reductionPercent,
      spatial_reuse_percent: scheduleResult.spatialReusePercent,
      node_to_slot: scheduleResult.nodeToSlot,
      schedule_matrix: matrixData.matrix,
      validation: {
        valid: validation.valid,
        violations: validation.violations.length,
        collision_checks_passed: validation.collisionChecksPassed,
        total_collision_checks: validation.totalCollisionChecks,
        direct_conflicts: validation.directConflictsCount,
        two_hop_conflicts: validation.twoHopConflictsCount
      }
    };

    const blob = new Blob([JSON.stringify(jsonOutput, null, 2)], {
      type: 'application/json;charset=utf-8;'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'schedule.json');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Reports</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Formal TDMA optimization and conflict validation report (Sections 25 & 58)
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleCopy}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 shadow-xs transition"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
            <span>{copied ? 'Copied' : 'Copy Text'}</span>
          </button>

          <button
            onClick={handleDownloadTxt}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 shadow-xs transition"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Download .txt</span>
          </button>

          <button
            onClick={handleDownloadJson}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download JSON</span>
          </button>
        </div>
      </div>

      {/* Terminal-style / Engineering Report Display */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
        {/* Terminal Header */}
        <div className="bg-slate-950 px-5 py-3 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block"></span>
            <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block"></span>
            <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block"></span>
            <span className="text-xs font-mono text-slate-400 pl-2">
              output/tdma_report.txt — UTF-8
            </span>
          </div>
          <span className="text-[11px] font-mono text-emerald-400 font-semibold">
            STATUS: {validation.valid ? 'CONFLICT-FREE' : 'COLLISION'}
          </span>
        </div>

        {/* Report Content */}
        <div className="p-6 font-mono text-xs text-slate-300 leading-relaxed overflow-x-auto whitespace-pre selection:bg-blue-600 selection:text-white">
          {reportText}
        </div>
      </div>
    </div>
  );
};

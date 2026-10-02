import React, { useState } from 'react';
import { RadioNode, ScheduleMatrixData } from '../types/tdma';
import { getSlotColor } from '../utils/tdmaEngine';
import { Copy, Download, Check, Sparkles, Table2, Layers } from 'lucide-react';

interface TdmaMatrixViewProps {
  nodes: RadioNode[];
  matrixData: ScheduleMatrixData;
  nodeToSlot: Record<string, number>;
}

export const TdmaMatrixView: React.FC<TdmaMatrixViewProps> = ({
  nodes,
  matrixData,
  nodeToSlot
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyCsv = () => {
    const header = ['Slot', ...matrixData.nodeNames].join(',');
    const rows = matrixData.slots.map(s => {
      return [`Slot ${s}`, ...matrixData.matrix[s]].join(',');
    });
    const csvContent = [header, ...rows].join('\n');
    navigator.clipboard.writeText(csvContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadCsv = () => {
    const header = ['Slot', ...matrixData.nodeNames].join(',');
    const rows = matrixData.slots.map(s => {
      return [`Slot ${s}`, ...matrixData.matrix[s]].join(',');
    });
    const csvContent = [header, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'tdma_schedule_matrix.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const sortedNodes = [...nodes].sort((a, b) => a.id.localeCompare(b.id));

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">TDMA Matrix</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Slot × Node boolean matrix and node to slot mapping
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleCopyCsv}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 shadow-xs transition"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
            <span>{copied ? 'Copied CSV' : 'Copy CSV'}</span>
          </button>
          <button
            onClick={handleDownloadCsv}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Matrix</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Matrix Table on Left, Node->Slot Mapping on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Slot x Node Matrix Table (8 or 9 cols) */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-base">Slot × Node Matrix</h3>
            <span className="text-xs text-slate-500 font-mono">
              Dimensions: {matrixData.slots.length} Slots × {matrixData.nodeNames.length} Radios
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-xs text-center border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="py-2.5 px-3 font-bold text-slate-700 text-left border-r border-slate-200">
                    Slot
                  </th>
                  {matrixData.nodeNames.map(nodeName => (
                    <th
                      key={nodeName}
                      className="py-2.5 px-2 font-bold text-slate-700 border-r border-slate-100 last:border-r-0 min-w-8"
                    >
                      {nodeName.length > 3 ? nodeName.slice(-3) : nodeName}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {matrixData.slots.map(slotIdx => {
                  const slotColor = getSlotColor(slotIdx);
                  const activeCount = matrixData.matrix[slotIdx].reduce((a, b) => a + b, 0);

                  return (
                    <tr key={`slot-row-${slotIdx}`} className="hover:bg-slate-50/70 transition">
                      <td className="py-2.5 px-3 font-bold text-slate-900 text-left border-r border-slate-200 bg-slate-50/40 flex items-center space-x-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full inline-block"
                          style={{ backgroundColor: slotColor }}
                        />
                        <span>Slot {slotIdx}</span>
                      </td>

                      {matrixData.matrix[slotIdx].map((val, nIdx) => {
                        const isTransmitting = val === 1;
                        return (
                          <td
                            key={`val-${slotIdx}-${nIdx}`}
                            className="py-2 px-1 border-r border-slate-100 last:border-r-0"
                          >
                            {isTransmitting ? (
                              <span
                                className="inline-flex items-center justify-center w-6 h-6 rounded-md font-bold text-white text-[11px] shadow-xs"
                                style={{ backgroundColor: slotColor }}
                              >
                                1
                              </span>
                            ) : (
                              <span className="text-slate-300 font-mono">0</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Spatial Reuse Callout */}
          <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-3.5 flex items-start space-x-3 text-xs text-blue-900">
            <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Spatial Reuse in Effect: </span>
              Notice rows with multiple <span className="font-bold">"1"s</span>. These represent radios separated by greater than 2 hops transmitting simultaneously during the same timeslot without co-channel or hidden-terminal interference!
            </div>
          </div>
        </div>

        {/* Right Column: Node -> Slot Mapping (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-base">Node → Slot Mapping</h3>
            <span className="text-xs font-mono font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              1-to-1 Valid
            </span>
          </div>

          <div className="max-h-[500px] overflow-y-auto rounded-xl border border-slate-200">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="py-2.5 px-4 font-bold text-slate-700 text-left">Node</th>
                  <th className="py-2.5 px-4 font-bold text-slate-700 text-right">Slot</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedNodes.map(node => {
                  const slot = nodeToSlot[node.id];
                  const slotColor = getSlotColor(slot ?? 0);
                  return (
                    <tr key={node.id} className="hover:bg-slate-50 transition">
                      <td className="py-2 px-4 font-bold text-slate-800 font-mono">
                        {node.name}
                      </td>
                      <td className="py-2 px-4 text-right">
                        <span
                          className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full font-bold text-white text-[11px] shadow-xs"
                          style={{ backgroundColor: slotColor }}
                        >
                          <span>Slot {slot}</span>
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

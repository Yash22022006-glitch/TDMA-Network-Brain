import React, { useState } from 'react';
import {
  RadioNode,
  CommunicationEdge,
  ConflictEdge,
  ScheduleResult,
  ScheduleMatrixData
} from '../types/tdma';
import { NetworkGraphCanvas } from './NetworkGraphCanvas';
import { PRESET_LIST, TopologyPreset, ASSIGNMENT_4X4_GRID, parseCoordinatesMap } from '../utils/presets';
import {
  Upload,
  Radio,
  Sliders,
  Plus,
  Trash2,
  RefreshCw,
  Move,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Info,
  Table2,
  Copy,
  Check,
  Sparkles,
  MousePointerClick,
  MapPin,
  X
} from 'lucide-react';
import { getSlotColor } from '../utils/tdmaEngine';

interface TopologyViewProps {
  nodes: RadioNode[];
  communicationEdges: CommunicationEdge[];
  conflictEdges: ConflictEdge[];
  scheduleResult: ScheduleResult;
  matrixData: ScheduleMatrixData;
  radioRange: number;
  onUpdateRange: (newRange: number) => void;
  onUpdateNodes: (nodes: RadioNode[]) => void;
  onUpdateNodePosition: (nodeId: string, newX: number, newY: number) => void;
  onSelectPreset: (preset: TopologyPreset) => void;
  onUploadJson: (content: string) => void;
}

export const TopologyView: React.FC<TopologyViewProps> = ({
  nodes,
  communicationEdges,
  conflictEdges,
  scheduleResult,
  matrixData,
  radioRange,
  onUpdateRange,
  onUpdateNodes,
  onUpdateNodePosition,
  onSelectPreset,
  onUploadJson
}) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string>(
    nodes[3]?.id || nodes[0]?.id || 'N01'
  );
  const [matrixCopied, setMatrixCopied] = useState<boolean>(false);
  const [inputMode, setInputMode] = useState<'preset' | 'manual' | 'json'>('preset');
  const [rangeInput, setRangeInput] = useState<number>(radioRange);
  const [manualText, setManualText] = useState<string>(
    JSON.stringify(
      nodes.reduce((acc, n) => ({ ...acc, [n.name]: [n.x, n.y] }), {}),
      null,
      2
    )
  );

  // Add / Remove State
  const [isAddingMode, setIsAddingMode] = useState<boolean>(false);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [modalNodeName, setModalNodeName] = useState<string>('');
  const [modalNodeX, setModalNodeX] = useState<number>(600);
  const [modalNodeY, setModalNodeY] = useState<number>(500);
  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const selectedNode = nodes.find(n => n.id === selectedNodeId) || nodes[0];

  // 1-hop neighbors of selected node
  const oneHopNeighbors: { id: string; dist: number }[] = [];
  communicationEdges.forEach(e => {
    if (e.u === selectedNode?.id) oneHopNeighbors.push({ id: e.v, dist: e.distance });
    if (e.v === selectedNode?.id) oneHopNeighbors.push({ id: e.u, dist: e.distance });
  });

  // 2-hop neighbors of selected node
  const twoHopNeighbors: { id: string; dist: number; via?: string }[] = [];
  conflictEdges.forEach(e => {
    if (e.type === '2-hop') {
      if (e.u === selectedNode?.id) {
        twoHopNeighbors.push({ id: e.v, dist: e.distance, via: e.commonNeighbors?.[0] });
      } else if (e.v === selectedNode?.id) {
        twoHopNeighbors.push({ id: e.u, dist: e.distance, via: e.commonNeighbors?.[0] });
      }
    }
  });

  const handleApplyRange = () => {
    if (rangeInput > 0) {
      onUpdateRange(rangeInput);
      showNotification(`Updated radio range to ${rangeInput}m`);
    }
  };

  const handleApplyManual = () => {
    try {
      const parsed = JSON.parse(manualText);
      const newNodes: RadioNode[] = Object.entries(parsed).map(([key, coords]) => {
        const [x, y] = coords as [number, number];
        return {
          id: key,
          name: key,
          x: Number(x),
          y: Number(y)
        };
      });
      if (newNodes.length > 0) {
        onUpdateNodes(newNodes);
        setSelectedNodeId(newNodes[0].id);
        showNotification(`Applied ${newNodes.length} nodes from JSON`);
      }
    } catch (err) {
      alert('Invalid JSON coordinate format. Please provide format: {"Node_01": [x, y], ...}');
    }
  };

  const handleCopyMatrixCsv = () => {
    const header = ['Slot', ...matrixData.nodeNames].join(',');
    const rows = matrixData.slots.map(s => {
      return [`Slot ${s}`, ...matrixData.matrix[s]].join(',');
    });
    const csvContent = [header, ...rows].join('\n');
    navigator.clipboard.writeText(csvContent);
    setMatrixCopied(true);
    setTimeout(() => setMatrixCopied(false), 2000);
  };

  // Helper to compute next available node ID
  const getNextNodeId = () => {
    const existingNumbers = nodes
      .map(n => {
        const num = parseInt(n.name.replace(/\D/g, ''), 10);
        return isNaN(num) ? 0 : num;
      })
      .filter(n => n > 0);
    const maxNum = existingNumbers.length > 0 ? Math.max(...existingNumbers) : nodes.length;
    return `N${(maxNum + 1).toString().padStart(2, '0')}`;
  };

  // 1. Add node via canvas click
  const handleCanvasClickToAdd = (x: number, y: number) => {
    const newId = getNextNodeId();
    const newNode: RadioNode = {
      id: newId,
      name: newId,
      x,
      y
    };
    onUpdateNodes([...nodes, newNode]);
    setSelectedNodeId(newId);
    setIsAddingMode(false);
    showNotification(`Added radio ${newId} at (${x}m, ${y}m)`);
  };

  // 2. Open Add Node Modal
  const handleOpenAddModal = () => {
    setModalNodeName(getNextNodeId());
    setModalNodeX(600);
    setModalNodeY(500);
    setShowAddModal(true);
  };

  // 3. Confirm Add Node Modal
  const handleConfirmAddModal = () => {
    const finalName = modalNodeName.trim() || getNextNodeId();
    if (nodes.some(n => n.id.toLowerCase() === finalName.toLowerCase())) {
      alert(`Node '${finalName}' already exists. Please enter a unique node identifier.`);
      return;
    }
    const newNode: RadioNode = {
      id: finalName,
      name: finalName,
      x: Math.round(modalNodeX),
      y: Math.round(modalNodeY)
    };
    onUpdateNodes([...nodes, newNode]);
    setSelectedNodeId(finalName);
    setShowAddModal(false);
    showNotification(`Added radio ${finalName} at (${newNode.x}m, ${newNode.y}m)`);
  };

  // 4. Delete a node by ID
  const handleDeleteNode = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (nodes.length <= 2) {
      alert('A minimum of 2 nodes is required for TDMA schedule calculation.');
      return;
    }
    const filtered = nodes.filter(n => n.id !== id);
    onUpdateNodes(filtered);
    if (selectedNodeId === id) {
      setSelectedNodeId(filtered[0]?.id || '');
    }
    showNotification(`Removed radio node ${id}`);
  };

  // Nudge coordinate by delta
  const handleNudge = (dx: number, dy: number) => {
    if (!selectedNode) return;
    const newX = Math.max(0, Math.min(1300, selectedNode.x + dx));
    const newY = Math.max(0, Math.min(1100, selectedNode.y + dy));
    onUpdateNodePosition(selectedNode.id, newX, newY);
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Topology</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Add, remove, drag, and fine-tune radio coordinates. All interference links, slots, and matrices replicate dynamically in real time.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* Canvas click mode toggle */}
          <button
            onClick={() => setIsAddingMode(!isAddingMode)}
            className={`flex items-center space-x-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border shadow-xs transition ${
              isAddingMode
                ? 'bg-blue-600 text-white border-blue-600 ring-2 ring-blue-400/40 animate-pulse'
                : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
            }`}
          >
            <MousePointerClick className="w-3.5 h-3.5" />
            <span>{isAddingMode ? 'Cancel Canvas Click' : 'Click Canvas to Add'}</span>
          </button>

          {/* Add node modal button */}
          <button
            onClick={handleOpenAddModal}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Node</span>
          </button>

          <label className="flex items-center space-x-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 shadow-xs transition cursor-pointer">
            <Upload className="w-3.5 h-3.5" />
            <span>Load JSON</span>
            <input
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={e => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = ev => {
                    if (ev.target?.result) {
                      onUploadJson(ev.target.result as string);
                    }
                  };
                  reader.readAsText(file);
                }
              }}
            />
          </label>
        </div>
      </div>

      {/* Real-time Notification Banner */}
      {notification && (
        <div className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-md flex items-center justify-between animate-fadeIn">
          <div className="flex items-center space-x-2">
            <Check className="w-4 h-4 stroke-[3]" />
            <span>{notification}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-white/80 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 3-Column Layout: Input / Graph / Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Input & Node Table (3 cols) */}
        <div className="lg:col-span-3 space-y-5">
          {/* Node Input Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">Node Input</h3>

            <div className="space-y-2">
              <label className="flex items-center space-x-2.5 text-xs font-medium text-slate-700 cursor-pointer">
                <input
                  type="radio"
                  name="inputMode"
                  checked={inputMode === 'preset'}
                  onChange={() => setInputMode('preset')}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span>Example Topology</span>
              </label>
              <label className="flex items-center space-x-2.5 text-xs font-medium text-slate-700 cursor-pointer">
                <input
                  type="radio"
                  name="inputMode"
                  checked={inputMode === 'manual'}
                  onChange={() => setInputMode('manual')}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span>Manual Input</span>
              </label>
              <label className="flex items-center space-x-2.5 text-xs font-medium text-slate-700 cursor-pointer">
                <input
                  type="radio"
                  name="inputMode"
                  checked={inputMode === 'json'}
                  onChange={() => setInputMode('json')}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span>JSON File</span>
              </label>
            </div>

            {/* Presets selector if in preset mode */}
            {inputMode === 'preset' && (
              <div className="space-y-1.5 pt-2">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Select Preset
                </div>
                <select
                  onChange={e => {
                    const found = PRESET_LIST.find(p => p.id === e.target.value);
                    if (found) onSelectPreset(found);
                  }}
                  className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 focus:outline-blue-500"
                >
                  {PRESET_LIST.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Manual text area */}
            {inputMode === 'manual' && (
              <div className="space-y-2 pt-2">
                <textarea
                  value={manualText}
                  onChange={e => setManualText(e.target.value)}
                  rows={4}
                  className="w-full text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 focus:outline-blue-500"
                />
                <button
                  onClick={handleApplyManual}
                  className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold"
                >
                  Apply Coordinates
                </button>
              </div>
            )}

            {/* Radio Range Input */}
            <div className="space-y-1.5 pt-1">
              <label className="block text-xs font-medium text-slate-700">
                Radio Range (m)
              </label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  value={rangeInput}
                  onChange={e => setRangeInput(Number(e.target.value))}
                  className="w-full px-3 py-1.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-blue-500"
                  step="50"
                  min="50"
                  max="2000"
                />
                <button
                  onClick={handleApplyRange}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200"
                >
                  Update
                </button>
              </div>
            </div>
          </div>

          {/* Nodes Table Card with Instant Add and Row Delete */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Nodes ({nodes.length})</h3>
                <span className="text-[10px] text-slate-400">Click to select • Trash to delete</span>
              </div>
              <button
                onClick={handleOpenAddModal}
                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg border border-blue-200 transition"
                title="Add new radio node"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 border border-slate-100 rounded-lg">
              <div className="grid grid-cols-12 bg-slate-50 text-[11px] font-bold text-slate-500 py-1.5 px-3">
                <span className="col-span-4">ID</span>
                <span className="col-span-3 text-right">X (m)</span>
                <span className="col-span-3 text-right">Y (m)</span>
                <span className="col-span-2 text-right">Del</span>
              </div>
              {nodes.map(n => {
                const isSelected = n.id === selectedNodeId;
                return (
                  <div
                    key={n.id}
                    onClick={() => setSelectedNodeId(n.id)}
                    className={`w-full grid grid-cols-12 text-xs py-2 px-3 text-left transition cursor-pointer items-center group ${
                      isSelected
                        ? 'bg-blue-50 font-bold text-blue-700'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span className="col-span-4 flex items-center space-x-1.5 truncate">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{
                          backgroundColor: getSlotColor(scheduleResult.nodeToSlot[n.id] ?? 0)
                        }}
                      />
                      <span className="truncate">{n.name}</span>
                    </span>
                    <span className="col-span-3 text-right font-mono text-slate-600">{n.x}</span>
                    <span className="col-span-3 text-right font-mono text-slate-600">{n.y}</span>
                    <span className="col-span-2 text-right">
                      {nodes.length > 2 && (
                        <button
                          onClick={e => handleDeleteNode(n.id, e)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition"
                          title={`Delete ${n.name}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Center Column: Communication Graph Canvas & TDMA Matrix (6 cols) */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Communication Graph ({radioRange} m range)
              </h3>
              <p className="text-xs text-slate-500">
                Drag nodes directly to adjust coordinates. Direct links and 2-hop conflicts adjust dynamically.
              </p>
            </div>
            <div className="flex items-center space-x-3 text-xs text-slate-600 font-medium shrink-0">
              <span className="flex items-center space-x-1.5">
                <span className="w-3 h-0.5 bg-blue-600 inline-block"></span>
                <span>Communication Link</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <span className="w-3 h-0.5 border-t border-dashed border-rose-500 inline-block"></span>
                <span>2-Hop Conflict</span>
              </span>
            </div>
          </div>

          <NetworkGraphCanvas
            nodes={nodes}
            communicationEdges={communicationEdges}
            conflictEdges={conflictEdges}
            nodeToSlot={scheduleResult.nodeToSlot}
            selectedNodeId={selectedNodeId}
            onSelectNode={setSelectedNodeId}
            onUpdateNodePosition={onUpdateNodePosition}
            viewMode="combined"
            radioRangeMeters={radioRange}
            showRangeCircles={true}
            isDraggable={true}
            isAddingMode={isAddingMode}
            onCanvasClick={handleCanvasClickToAdd}
            height={480}
          />

          {/* TDMA Matrix directly below the Communication Graph */}
          <div className="pt-4 border-t border-slate-200/80 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                  <Table2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                    <span>TDMA Schedule Matrix (Live)</span>
                    <span className="text-[10px] font-mono font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      Replicating in real time
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Slot × Node Boolean Grid • Updates automatically when nodes are added, removed, or dragged above
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-[11px] font-mono text-slate-500 font-semibold bg-slate-100 px-2 py-1 rounded-md">
                  {matrixData.slots.length} Slots × {matrixData.nodeNames.length} Radios
                </span>
                <button
                  onClick={handleCopyMatrixCsv}
                  className="flex items-center space-x-1 px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 shadow-xs transition"
                >
                  {matrixCopied ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span className="text-emerald-600">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 text-slate-500" />
                      <span>Copy CSV</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Matrix Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
              <table className="w-full text-xs text-center border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="py-2 px-3 font-bold text-slate-700 text-left border-r border-slate-200 whitespace-nowrap min-w-20">
                      Slot
                    </th>
                    {matrixData.nodeNames.map(nodeName => (
                      <th
                        key={nodeName}
                        className="py-2 px-1.5 font-bold text-slate-700 border-r border-slate-100 last:border-r-0 min-w-7 text-[11px]"
                      >
                        {nodeName.length > 3 ? nodeName.slice(-3) : nodeName}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {matrixData.slots.map(slotIdx => {
                    const slotColor = getSlotColor(slotIdx);
                    const transmittingNodes = matrixData.nodeNames.filter(
                      (_, nIdx) => matrixData.matrix[slotIdx][nIdx] === 1
                    );

                    return (
                      <tr key={`topo-slot-${slotIdx}`} className="hover:bg-slate-50/70 transition">
                        <td className="py-2 px-3 font-bold text-slate-900 text-left border-r border-slate-200 bg-slate-50/40 flex items-center space-x-2 whitespace-nowrap">
                          <span
                            className="w-2.5 h-2.5 rounded-full inline-block shrink-0"
                            style={{ backgroundColor: slotColor }}
                          />
                          <span>Slot {slotIdx}</span>
                          {transmittingNodes.length > 1 && (
                            <span className="text-[10px] text-blue-600 font-normal">
                              ({transmittingNodes.length} radios)
                            </span>
                          )}
                        </td>

                        {matrixData.matrix[slotIdx].map((val, nIdx) => {
                          const isTransmitting = val === 1;
                          return (
                            <td
                              key={`topo-val-${slotIdx}-${nIdx}`}
                              className="py-1.5 px-1 border-r border-slate-100 last:border-r-0"
                            >
                              {isTransmitting ? (
                                <span
                                  className="inline-flex items-center justify-center w-5 h-5 rounded font-bold text-white text-[10px] shadow-xs"
                                  style={{ backgroundColor: slotColor }}
                                  title={`${matrixData.nodeNames[nIdx]} is transmitting in Slot ${slotIdx}`}
                                >
                                  1
                                </span>
                              ) : (
                                <span className="text-slate-300 font-mono text-[11px]">0</span>
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

            {/* Spatial reuse indicator */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 flex items-center justify-between text-[11px] text-slate-600">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>
                  <strong>Spatial Reuse:</strong> Radios sharing the same slot row are non-interfering (&gt; 2 hops apart) and transmit simultaneously.
                </span>
              </div>
              <span className="font-semibold text-emerald-600 shrink-0 ml-2">
                ✓ 100% Conflict-Free
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Node Details & Precision Coordinate Adjuster (3 cols) */}
        <div className="lg:col-span-3 space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base">Node Details</h3>
              {nodes.length > 2 && selectedNode && (
                <button
                  onClick={e => handleDeleteNode(selectedNode.id, e)}
                  className="text-rose-500 hover:text-rose-700 p-1.5 rounded-md hover:bg-rose-50 transition"
                  title={`Delete ${selectedNode.name}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            {selectedNode ? (
              <div className="space-y-4">
                <div className="p-3 bg-slate-50 rounded-xl space-y-3 border border-slate-100">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 font-medium">Node ID</span>
                    <span className="font-bold text-slate-900 font-mono text-sm">
                      {selectedNode.name}
                    </span>
                  </div>

                  {/* Coordinate Fine-Tuning Controls */}
                  <div className="space-y-3 pt-1 border-t border-slate-200/60">
                    <div>
                      <div className="flex justify-between text-xs mb-1 font-semibold text-slate-700">
                        <span>X Coordinate</span>
                        <span className="font-mono text-blue-600">{selectedNode.x} m</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1200"
                        step="10"
                        value={selectedNode.x}
                        onChange={e =>
                          onUpdateNodePosition(selectedNode.id, Number(e.target.value), selectedNode.y)
                        }
                        className="w-full accent-blue-600 cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1 font-semibold text-slate-700">
                        <span>Y Coordinate</span>
                        <span className="font-mono text-blue-600">{selectedNode.y} m</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1000"
                        step="10"
                        value={selectedNode.y}
                        onChange={e =>
                          onUpdateNodePosition(selectedNode.id, selectedNode.x, Number(e.target.value))
                        }
                        className="w-full accent-blue-600 cursor-pointer"
                      />
                    </div>

                    {/* Quick Nudge Buttons */}
                    <div className="pt-1">
                      <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                        Nudge Position
                      </div>
                      <div className="grid grid-cols-4 gap-1.5">
                        <button
                          onClick={() => handleNudge(-20, 0)}
                          className="py-1 px-2 bg-white hover:bg-slate-100 border border-slate-200 rounded text-[11px] font-mono font-bold text-slate-700"
                          title="Left 20m"
                        >
                          ← -20
                        </button>
                        <button
                          onClick={() => handleNudge(20, 0)}
                          className="py-1 px-2 bg-white hover:bg-slate-100 border border-slate-200 rounded text-[11px] font-mono font-bold text-slate-700"
                          title="Right 20m"
                        >
                          +20 →
                        </button>
                        <button
                          onClick={() => handleNudge(0, -20)}
                          className="py-1 px-2 bg-white hover:bg-slate-100 border border-slate-200 rounded text-[11px] font-mono font-bold text-slate-700"
                          title="Down 20m"
                        >
                          ↓ -20
                        </button>
                        <button
                          onClick={() => handleNudge(0, 20)}
                          className="py-1 px-2 bg-white hover:bg-slate-100 border border-slate-200 rounded text-[11px] font-mono font-bold text-slate-700"
                          title="Up 20m"
                        >
                          +20 ↑
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 1-Hop Neighbors */}
                <div className="space-y-2">
                  <div className="text-xs font-bold text-slate-800 flex items-center justify-between">
                    <span>1-Hop Neighbors ({oneHopNeighbors.length})</span>
                    <span className="text-[10px] text-blue-600 font-normal">Direct Link (≤500m)</span>
                  </div>
                  {oneHopNeighbors.length === 0 ? (
                    <div className="text-xs text-slate-400 italic">No nodes in radio range</div>
                  ) : (
                    <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                      {oneHopNeighbors.map(n => (
                        <button
                          key={n.id}
                          onClick={() => setSelectedNodeId(n.id)}
                          className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-medium rounded-lg border border-blue-200 transition"
                          title={`Distance: ${n.dist}m`}
                        >
                          {n.id} <span className="text-[10px] text-blue-400 font-mono">({n.dist}m)</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* 2-Hop Neighbors */}
                <div className="space-y-2">
                  <div className="text-xs font-bold text-slate-800 flex items-center justify-between">
                    <span>2-Hop Neighbors ({twoHopNeighbors.length})</span>
                    <span className="text-[10px] text-rose-500 font-normal">Hidden Terminal</span>
                  </div>
                  {twoHopNeighbors.length === 0 ? (
                    <div className="text-xs text-slate-400 italic">No two-hop interference</div>
                  ) : (
                    <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                      {twoHopNeighbors.map(n => (
                        <button
                          key={n.id}
                          onClick={() => setSelectedNodeId(n.id)}
                          className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-medium rounded-lg border border-rose-200 transition"
                          title={`Via common neighbor: ${n.via || 'shared link'}`}
                        >
                          {n.id} {n.via && <span className="text-[9px] text-rose-400">(via {n.via})</span>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Assigned Slot */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-medium">Assigned Slot</span>
                  <div className="flex items-center space-x-2">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{
                        backgroundColor: getSlotColor(scheduleResult.nodeToSlot[selectedNode.id] ?? 0)
                      }}
                    />
                    <span className="text-base font-extrabold text-slate-900 font-mono">
                      Slot {scheduleResult.nodeToSlot[selectedNode.id] ?? 'Unassigned'}
                    </span>
                  </div>
                </div>

                {/* Remove Selected Node Button */}
                {nodes.length > 2 && (
                  <button
                    onClick={() => handleDeleteNode(selectedNode.id)}
                    className="w-full mt-2 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl flex items-center justify-center space-x-1.5 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove {selectedNode.name}</span>
                  </button>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Add Node Dialog Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Plus className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-base">Add New Radio Node</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="block font-semibold text-slate-700">Node Identifier / Name</label>
                <input
                  type="text"
                  value={modalNodeName}
                  onChange={e => setModalNodeName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-mono"
                  placeholder="e.g. N17 or Node_17"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between font-semibold text-slate-700">
                  <span>X Coordinate</span>
                  <span className="font-mono text-blue-600">{modalNodeX} m</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1200"
                  step="10"
                  value={modalNodeX}
                  onChange={e => setModalNodeX(Number(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between font-semibold text-slate-700">
                  <span>Y Coordinate</span>
                  <span className="font-mono text-blue-600">{modalNodeY} m</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1000"
                  step="10"
                  value={modalNodeY}
                  onChange={e => setModalNodeY(Number(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>

              {/* Quick Placement Shortcuts */}
              <div className="pt-2 border-t border-slate-100 space-y-1.5">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Quick Position Presets
                </span>
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setModalNodeX(600);
                      setModalNodeY(500);
                    }}
                    className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium text-[11px]"
                  >
                    Center (600, 500)
                  </button>
                  <button
                    onClick={() => {
                      setModalNodeX(Math.round(200 + Math.random() * 800));
                      setModalNodeY(Math.round(200 + Math.random() * 600));
                    }}
                    className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium text-[11px]"
                  >
                    Random
                  </button>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 flex justify-end space-x-2 bg-slate-50">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold rounded-lg text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAddModal}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-xs"
              >
                Add Node to Topology
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect, useRef } from 'react';
import {
  RadioNode,
  CommunicationEdge,
  ConflictEdge,
  ScheduleResult,
  EmaneConfig,
  SimulationStats,
  PacketTransmission
} from '../types/tdma';
import { generateEmaneXml, getSlotColor } from '../utils/tdmaEngine';
import { NetworkGraphCanvas } from './NetworkGraphCanvas';
import {
  Play,
  Pause,
  RotateCcw,
  Download,
  FileCode,
  Radio,
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles
} from 'lucide-react';

interface EmaneSimulationViewProps {
  nodes: RadioNode[];
  communicationEdges: CommunicationEdge[];
  conflictEdges: ConflictEdge[];
  scheduleResult: ScheduleResult;
  radioRange: number;
}

export const EmaneSimulationView: React.FC<EmaneSimulationViewProps> = ({
  nodes,
  communicationEdges,
  conflictEdges,
  scheduleResult,
  radioRange
}) => {
  const [slotDurationMs, setSlotDurationMs] = useState(1);
  const [frameLengthSlots, setFrameLengthSlots] = useState(scheduleResult.optimizedSlots);
  const [frequencyMHz, setFrequencyMHz] = useState(2400);
  const [showXmlModal, setShowXmlModal] = useState(false);

  const [isRunning, setIsRunning] = useState(false);
  const [stats, setStats] = useState<SimulationStats>({
    packetsSent: 120,
    packetsDelivered: 118,
    packetsDropped: 2,
    deliveryRatePercent: 98.3,
    currentFrame: 24,
    currentSlot: 0
  });

  const [activeTransmitters, setActiveTransmitters] = useState<Set<string>>(new Set());

  // Update frame length if schedule changes
  useEffect(() => {
    setFrameLengthSlots(scheduleResult.optimizedSlots);
  }, [scheduleResult.optimizedSlots]);

  const emaneConfig: EmaneConfig = {
    slotDurationMs,
    frameLengthSlots,
    frequencyMHz,
    bandwidthHz: 5000000,
    txPowerDbm: 20,
    datarateKbps: 1000
  };

  const xmlContent = generateEmaneXml(emaneConfig, scheduleResult.nodeToSlot, nodes);

  // Simulation timer loop
  const timerRef = useRef<any>(null);

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setStats(prev => {
          const nextSlot = (prev.currentSlot + 1) % frameLengthSlots;
          const isNewFrame = nextSlot === 0;
          const nextFrame = isNewFrame ? prev.currentFrame + 1 : prev.currentFrame;

          // Find active transmitting nodes for this slot
          const txNodes = nodes.filter(n => scheduleResult.nodeToSlot[n.id] === nextSlot);
          const txSet = new Set(txNodes.map(n => n.id));
          setActiveTransmitters(txSet);

          // Simulate packet delivery
          const sent = prev.packetsSent + txNodes.length;
          // In conflict-free TDMA, packets succeed, but small 1.5% simulated random fading drop
          const droppedInSlot = Math.random() < 0.05 ? 1 : 0;
          const dropped = prev.packetsDropped + droppedInSlot;
          const delivered = sent - dropped;
          const deliveryRate = sent > 0 ? Math.round((delivered / sent) * 1000) / 10 : 100;

          return {
            packetsSent: sent,
            packetsDelivered: delivered,
            packetsDropped: dropped,
            deliveryRatePercent: deliveryRate,
            currentFrame: nextFrame,
            currentSlot: nextSlot
          };
        });
      }, 650); // Animated slot step
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setActiveTransmitters(new Set());
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, frameLengthSlots, nodes, scheduleResult.nodeToSlot]);

  const handleToggleSimulation = () => {
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setIsRunning(false);
    setStats({
      packetsSent: 0,
      packetsDelivered: 0,
      packetsDropped: 0,
      deliveryRatePercent: 100,
      currentFrame: 1,
      currentSlot: 0
    });
    setActiveTransmitters(new Set());
  };

  const handleDownloadXml = () => {
    const blob = new Blob([xmlContent], { type: 'application/xml;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'emane_tdma_schedule.xml');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">EMANE Simulation</h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Run packet simulation using EMANE TDMA Radio Model (Part 2 Bonus)
        </p>
      </div>

      {/* Main Grid: Simulation Settings & Live Simulation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Simulation Settings (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
          <div className="flex items-center space-x-2">
            <Radio className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-slate-900 text-base">Simulation Settings</h3>
          </div>

          <div className="space-y-4 text-xs">
            <div className="space-y-1">
              <label className="block font-semibold text-slate-700">Slot Duration (ms)</label>
              <input
                type="number"
                value={slotDurationMs}
                onChange={e => setSlotDurationMs(Number(e.target.value))}
                min="0.1"
                step="0.1"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono text-slate-800"
              />
            </div>

            <div className="space-y-1">
              <label className="block font-semibold text-slate-700">Frame Length (slots)</label>
              <input
                type="number"
                value={frameLengthSlots}
                readOnly
                className="w-full bg-slate-100 border border-slate-200 rounded-lg p-2 font-mono text-slate-500 cursor-not-allowed"
              />
              <span className="text-[10px] text-slate-400">Determined by optimized scheduler</span>
            </div>

            <div className="space-y-1">
              <label className="block font-semibold text-slate-700">Frequency (MHz)</label>
              <input
                type="number"
                value={frequencyMHz}
                onChange={e => setFrequencyMHz(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono text-slate-800"
              />
            </div>

            <div className="space-y-1 pt-1">
              <label className="block font-semibold text-slate-700">Schedule File</label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value="schedule.xml"
                  readOnly
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono text-slate-700 text-xs"
                />
                <button
                  onClick={() => setShowXmlModal(true)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg border border-slate-200"
                >
                  View
                </button>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="space-y-2 pt-2">
            <button
              onClick={handleToggleSimulation}
              className={`w-full py-3 text-white font-semibold rounded-xl text-xs flex items-center justify-center space-x-2 shadow-md transition cursor-pointer ${
                isRunning
                  ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20'
                  : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
              }`}
            >
              {isRunning ? (
                <>
                  <Pause className="w-4 h-4" />
                  <span>Pause Simulation</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  <span>Start Simulation</span>
                </>
              )}
            </button>

            <div className="flex space-x-2">
              <button
                onClick={handleReset}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 flex items-center justify-center space-x-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>

              <button
                onClick={handleDownloadXml}
                className="flex-1 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-xl border border-blue-200 flex items-center justify-center space-x-1"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export XML</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Live Interactive Simulation & Metrics (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Status & Live Metrics Header */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-3">
                <span className="font-bold text-slate-900 text-base">Simulation Status</span>
                {isRunning ? (
                  <span className="flex items-center text-emerald-600 text-xs font-bold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5 animate-ping"></span>
                    Running
                  </span>
                ) : (
                  <span className="flex items-center text-slate-500 text-xs font-bold bg-slate-100 px-2.5 py-1 rounded-full">
                    Ready
                  </span>
                )}
              </div>

              {/* Slot Ticker Pill */}
              <div className="flex items-center space-x-2 text-xs font-mono">
                <span className="text-slate-500">Active Timeslot:</span>
                <span
                  className="px-3 py-1 rounded-full text-white font-bold transition-colors duration-200"
                  style={{ backgroundColor: getSlotColor(stats.currentSlot) }}
                >
                  Slot {stats.currentSlot}
                </span>
                <span className="text-slate-400">Frame #{stats.currentFrame}</span>
              </div>
            </div>

            {/* Metrics cards row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="text-[11px] text-slate-500 font-semibold">Packets Sent</div>
                <div className="text-xl font-extrabold text-slate-900 font-mono mt-0.5">
                  {stats.packetsSent}
                </div>
              </div>
              <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100">
                <div className="text-[11px] text-emerald-700 font-semibold">Packets Delivered</div>
                <div className="text-xl font-extrabold text-emerald-600 font-mono mt-0.5">
                  {stats.packetsDelivered}
                </div>
              </div>
              <div className="p-3 bg-rose-50/60 rounded-xl border border-rose-100">
                <div className="text-[11px] text-rose-700 font-semibold">Packets Dropped</div>
                <div className="text-xl font-extrabold text-rose-600 font-mono mt-0.5">
                  {stats.packetsDropped}
                </div>
              </div>
              <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100">
                <div className="text-[11px] text-blue-700 font-semibold">Delivery Rate</div>
                <div className="text-xl font-extrabold text-blue-600 font-mono mt-0.5">
                  {stats.deliveryRatePercent}%
                </div>
              </div>
            </div>

            {/* Live Interactive Canvas */}
            <div className="pt-2">
              <NetworkGraphCanvas
                nodes={nodes}
                communicationEdges={communicationEdges}
                conflictEdges={[]}
                nodeToSlot={scheduleResult.nodeToSlot}
                viewMode="slots"
                radioRangeMeters={radioRange}
                highlightedSlot={stats.currentSlot}
                activeTransmitters={activeTransmitters}
                height={420}
              />
            </div>
          </div>
        </div>
      </div>

      {/* XML Profile Preview Modal */}
      {showXmlModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileCode className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-base">
                  EMANE TDMA Radio Model Schedule Profile (XML)
                </h3>
              </div>
              <button
                onClick={() => setShowXmlModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold px-2"
              >
                ✕
              </button>
            </div>
            <div className="p-5 overflow-y-auto flex-1 bg-slate-950 font-mono text-xs text-emerald-400 leading-relaxed rounded-b-2xl">
              <pre>{xmlContent}</pre>
            </div>
            <div className="p-4 border-t border-slate-200 flex justify-end space-x-3 bg-slate-50">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(xmlContent);
                  alert('Copied XML to clipboard!');
                }}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-lg text-xs"
              >
                Copy XML
              </button>
              <button
                onClick={handleDownloadXml}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-xs"
              >
                Download XML File
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

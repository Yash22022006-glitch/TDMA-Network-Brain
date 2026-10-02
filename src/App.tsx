/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useCallback } from 'react';
import { Sidebar, NavTab } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { TopologyView } from './components/TopologyView';
import { ConflictGraphView } from './components/ConflictGraphView';
import { ScheduleOptimizerView } from './components/ScheduleOptimizerView';
import { TdmaMatrixView } from './components/TdmaMatrixView';
import { ValidationView } from './components/ValidationView';
import { EmaneSimulationView } from './components/EmaneSimulationView';
import { ReportsView } from './components/ReportsView';
import { CliView } from './components/CliView';
import { SettingsView } from './components/SettingsView';

import { RadioNode, ScheduleResult } from './types/tdma';
import {
  PRESET_LIST,
  TACTICAL_FIELD_16,
  ASSIGNMENT_4X4_GRID,
  parseCoordinatesMap,
  TopologyPreset
} from './utils/presets';
import {
  buildCommunicationGraph,
  buildAdjacencyMap,
  buildConflictGraph,
  buildConflictAdjacency,
  generateSchedule,
  buildScheduleMatrix,
  validateSchedule,
  ColoringAlgorithm
} from './utils/tdmaEngine';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [currentPresetId, setCurrentPresetId] = useState<string>('tactical-16');
  const [radioRange, setRadioRange] = useState<number>(500);
  const [algorithm, setAlgorithm] = useState<ColoringAlgorithm>('dsatur');
  const [isOptimizing, setIsOptimizing] = useState<boolean>(false);

  // Initial nodes from default tactical field deployment
  const [nodes, setNodes] = useState<RadioNode[]>(() => parseCoordinatesMap(TACTICAL_FIELD_16));

  // Override slots for testing independent collision validator
  const [collisionOverride, setCollisionOverride] = useState<Record<string, number> | null>(null);

  // 1. Compute Communication Graph
  const communicationEdges = useMemo(() => {
    return buildCommunicationGraph(nodes, radioRange);
  }, [nodes, radioRange]);

  // 2. Compute Adjacency Map
  const adjMap = useMemo(() => {
    return buildAdjacencyMap(nodes, communicationEdges);
  }, [nodes, communicationEdges]);

  // 3. Compute Conflict Graph (1-hop + 2-hop)
  const conflictEdges = useMemo(() => {
    return buildConflictGraph(nodes, communicationEdges, adjMap);
  }, [nodes, communicationEdges, adjMap]);

  // 4. Compute Conflict Adjacency
  const conflictAdj = useMemo(() => {
    return buildConflictAdjacency(nodes, conflictEdges);
  }, [nodes, conflictEdges]);

  // 5. Generate Distance-2 Optimized Schedule
  const baseScheduleResult = useMemo(() => {
    return generateSchedule(nodes, conflictAdj, algorithm);
  }, [nodes, conflictAdj, algorithm]);

  // Apply manual collision override if stress test is active
  const scheduleResult: ScheduleResult = useMemo(() => {
    if (!collisionOverride) return baseScheduleResult;
    return {
      ...baseScheduleResult,
      nodeToSlot: {
        ...baseScheduleResult.nodeToSlot,
        ...collisionOverride
      }
    };
  }, [baseScheduleResult, collisionOverride]);

  // 6. Build Schedule Matrix (Slot x Node)
  const matrixData = useMemo(() => {
    return buildScheduleMatrix(nodes, scheduleResult.nodeToSlot, scheduleResult.slotCount);
  }, [nodes, scheduleResult.nodeToSlot, scheduleResult.slotCount]);

  // 7. Run Independent Collision Validation
  const validation = useMemo(() => {
    return validateSchedule(
      nodes,
      communicationEdges,
      conflictEdges,
      scheduleResult.nodeToSlot,
      scheduleResult.slotCount,
      radioRange
    );
  }, [nodes, communicationEdges, conflictEdges, scheduleResult.nodeToSlot, scheduleResult.slotCount, radioRange]);

  // Preset Handler
  const handleSelectPreset = useCallback((preset: TopologyPreset) => {
    setCollisionOverride(null);
    setCurrentPresetId(preset.id);
    setRadioRange(preset.radioRangeMeters);
    setNodes(parseCoordinatesMap(preset.nodes));
  }, []);

  // JSON Upload Handler
  const handleUploadJson = useCallback((jsonContent: string) => {
    try {
      const parsed = JSON.parse(jsonContent);
      const newNodes = parseCoordinatesMap(parsed);
      if (newNodes.length > 0) {
        setCollisionOverride(null);
        setCurrentPresetId('custom');
        setNodes(newNodes);
      }
    } catch (e) {
      alert('Error parsing JSON file. Expected format: {"Node_01": [x, y], ...}');
    }
  }, []);

  // Node List Update Handler (Adding / Removing Nodes - recalculates entire topology, conflicts, slots, matrix, and validation)
  const handleUpdateNodes = useCallback((newNodes: RadioNode[]) => {
    setCollisionOverride(null);
    setNodes(newNodes);
  }, []);

  // Real-time Coordinate Adjustment Handler (recalculates all distances, topology, conflicts, slots, and matrix)
  const handleUpdateNodePosition = useCallback((nodeId: string, newX: number, newY: number) => {
    setCollisionOverride(null);
    setNodes(prev =>
      prev.map(n => (n.id === nodeId ? { ...n, x: Math.round(newX), y: Math.round(newY) } : n))
    );
  }, []);

  // Recalculate schedule with slight visual delay feedback
  const handleRunOptimization = useCallback(() => {
    setIsOptimizing(true);
    setCollisionOverride(null);
    setTimeout(() => {
      setIsOptimizing(false);
    }, 250);
  }, []);

  // Simulate Collision test (assign both conflicting nodes to same slot)
  const handleSimulateCollisionTest = useCallback((nodeA: string, nodeB: string) => {
    setCollisionOverride({
      [nodeA]: 0,
      [nodeB]: 0
    });
  }, []);

  const handleResetSchedule = useCallback(() => {
    setCollisionOverride(null);
  }, []);

  const handleResetDefault = useCallback(() => {
    setCollisionOverride(null);
    setCurrentPresetId('assignment-4x4');
    setRadioRange(500);
    setNodes(parseCoordinatesMap(ASSIGNMENT_4X4_GRID));
  }, []);

  // Tab Titles
  const tabTitles: Record<NavTab, { title: string; subtitle: string }> = {
    dashboard: {
      title: 'Dashboard',
      subtitle: 'Overview of network topology, scheduling and simulation status'
    },
    topology: {
      title: 'Topology',
      subtitle: 'Load node coordinates and visualize the communication network'
    },
    'conflict-graph': {
      title: 'Conflict Graph',
      subtitle: 'Visualize 1-hop, 2-hop relationships and the distance-2 conflict graph'
    },
    optimizer: {
      title: 'Schedule Optimizer',
      subtitle: 'Generate TDMA schedule using Distance-2 coloring and spatial reuse optimization'
    },
    matrix: {
      title: 'TDMA Matrix',
      subtitle: 'Slot × Node boolean matrix and node to slot mapping'
    },
    validation: {
      title: 'Validation',
      subtitle: 'Verify that the generated schedule is conflict-free'
    },
    emane: {
      title: 'EMANE Simulation',
      subtitle: 'Run packet simulation using EMANE TDMA Radio Model'
    },
    reports: {
      title: 'Reports',
      subtitle: 'Detailed mathematical and scheduling summary'
    },
    cli: {
      title: 'Python CLI & Brain',
      subtitle: 'Centralized scheduler command-line interface & complexity'
    },
    settings: {
      title: 'Settings',
      subtitle: 'Physical parameters & algorithm configuration'
    }
  };

  const currentTabInfo = tabTitles[activeTab];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 font-sans">
      {/* Left Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        isValid={validation.valid}
        optimizedSlots={scheduleResult.optimizedSlots}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Header */}
        <Header
          title={currentTabInfo.title}
          subtitle={currentTabInfo.subtitle}
          currentPresetId={currentPresetId}
          onSelectPreset={handleSelectPreset}
          onUploadJson={handleUploadJson}
          onGenerateSchedule={handleRunOptimization}
          isValid={validation.valid}
          radioRange={radioRange}
        />

        {/* Scrollable View Container */}
        <main className="flex-1 overflow-y-auto bg-slate-50/50">
          {activeTab === 'dashboard' && (
            <DashboardView
              nodes={nodes}
              communicationEdges={communicationEdges}
              conflictEdges={conflictEdges}
              scheduleResult={scheduleResult}
              validation={validation}
              radioRange={radioRange}
              onNavigateTab={setActiveTab}
              onRunOptimization={handleRunOptimization}
              onUpdateNodePosition={handleUpdateNodePosition}
            />
          )}

          {activeTab === 'topology' && (
            <TopologyView
              nodes={nodes}
              communicationEdges={communicationEdges}
              conflictEdges={conflictEdges}
              scheduleResult={scheduleResult}
              matrixData={matrixData}
              radioRange={radioRange}
              onUpdateRange={setRadioRange}
              onUpdateNodes={handleUpdateNodes}
              onUpdateNodePosition={handleUpdateNodePosition}
              onSelectPreset={handleSelectPreset}
              onUploadJson={handleUploadJson}
            />
          )}

          {activeTab === 'conflict-graph' && (
            <ConflictGraphView
              nodes={nodes}
              communicationEdges={communicationEdges}
              conflictEdges={conflictEdges}
              scheduleResult={scheduleResult}
              radioRange={radioRange}
            />
          )}

          {activeTab === 'optimizer' && (
            <ScheduleOptimizerView
              nodes={nodes}
              scheduleResult={scheduleResult}
              algorithm={algorithm}
              onAlgorithmChange={setAlgorithm}
              onRunOptimization={handleRunOptimization}
              isOptimizing={isOptimizing}
            />
          )}

          {activeTab === 'matrix' && (
            <TdmaMatrixView
              nodes={nodes}
              matrixData={matrixData}
              nodeToSlot={scheduleResult.nodeToSlot}
            />
          )}

          {activeTab === 'validation' && (
            <ValidationView
              nodes={nodes}
              conflictEdges={conflictEdges}
              validation={validation}
              radioRange={radioRange}
              nodeToSlot={scheduleResult.nodeToSlot}
              onSimulateCollisionTest={handleSimulateCollisionTest}
              onResetSchedule={handleResetSchedule}
              isSimulatedViolation={collisionOverride !== null}
            />
          )}

          {activeTab === 'emane' && (
            <EmaneSimulationView
              nodes={nodes}
              communicationEdges={communicationEdges}
              conflictEdges={conflictEdges}
              scheduleResult={scheduleResult}
              radioRange={radioRange}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsView
              nodes={nodes}
              communicationEdges={communicationEdges}
              conflictEdges={conflictEdges}
              scheduleResult={scheduleResult}
              validation={validation}
              matrixData={matrixData}
              radioRange={radioRange}
            />
          )}

          {activeTab === 'cli' && (
            <CliView radioRange={radioRange} />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              radioRange={radioRange}
              onUpdateRange={setRadioRange}
              onResetDefault={handleResetDefault}
              nodeCount={nodes.length}
            />
          )}
        </main>
      </div>
    </div>
  );
}

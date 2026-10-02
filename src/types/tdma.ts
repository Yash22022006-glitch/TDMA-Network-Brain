export interface RadioNode {
  id: string;
  name: string;
  x: number;
  y: number;
  slot?: number;
}

export interface CommunicationEdge {
  u: string;
  v: string;
  distance: number;
}

export interface ConflictEdge {
  u: string;
  v: string;
  type: '1-hop' | '2-hop';
  distance: number;
  commonNeighbors?: string[];
}

export interface TopologyData {
  nodes: RadioNode[];
  communicationEdges: CommunicationEdge[];
  conflictEdges: ConflictEdge[];
  radioRangeMeters: number;
}

export interface OptimizationStep {
  step: number;
  name: string;
  description: string;
  slots: number;
}

export interface ScheduleResult {
  nodeToSlot: Record<string, number>;
  slotCount: number;
  initialSlots: number;
  optimizedSlots: number;
  reductionPercent: number;
  spatialReusePercent: number;
  executionTimeMs: number;
  steps: OptimizationStep[];
  slotDistribution: {
    slot: number;
    color: string;
    nodes: string[];
  }[];
}

export interface ScheduleMatrixData {
  slots: number[];
  nodeNames: string[];
  matrix: number[][]; // [slotIndex][nodeIndex] = 1 or 0
}

export interface Violation {
  nodeA: string;
  nodeB: string;
  slot: number;
  type: '1-hop' | '2-hop';
  commonNeighbor?: string;
  distance: number;
}

export interface ValidationReport {
  valid: boolean;
  nodeCount: number;
  radioRangeMeters: number;
  communicationEdgesCount: number;
  directConflictsCount: number;
  twoHopConflictsCount: number;
  totalConflictEdgesCount: number;
  slotAssignmentsCount: number;
  matrixDimensions: string;
  collisionChecksPassed: number;
  totalCollisionChecks: number;
  violations: Violation[];
}

export interface EmaneConfig {
  slotDurationMs: number;
  frameLengthSlots: number;
  frequencyMHz: number;
  bandwidthHz: number;
  txPowerDbm: number;
  datarateKbps: number;
}

export interface PacketTransmission {
  id: string;
  sourceId: string;
  destId: string;
  slot: number;
  progress: number; // 0 to 1
  status: 'transmitting' | 'delivered' | 'dropped';
  reason?: string;
}

export interface SimulationStats {
  packetsSent: number;
  packetsDelivered: number;
  packetsDropped: number;
  deliveryRatePercent: number;
  currentFrame: number;
  currentSlot: number;
}

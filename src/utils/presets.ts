import { RadioNode } from '../types/tdma';

export interface TopologyPreset {
  id: string;
  name: string;
  description: string;
  radioRangeMeters: number;
  nodes: Record<string, [number, number]>;
}

// Assignment standard 4x4 grid (Section 6 of CONTEXT.md)
export const ASSIGNMENT_4X4_GRID: Record<string, [number, number]> = {
  "Node_01": [0.0, 0.0],
  "Node_02": [300.0, 0.0],
  "Node_03": [600.0, 0.0],
  "Node_04": [900.0, 0.0],
  "Node_05": [0.0, 300.0],
  "Node_06": [300.0, 300.0],
  "Node_07": [600.0, 300.0],
  "Node_08": [900.0, 300.0],
  "Node_09": [0.0, 600.0],
  "Node_10": [300.0, 600.0],
  "Node_11": [600.0, 600.0],
  "Node_12": [900.0, 600.0],
  "Node_13": [0.0, 900.0],
  "Node_14": [300.0, 900.0],
  "Node_15": [600.0, 900.0],
  "Node_16": [900.0, 900.0]
};

// Tactical Field Deployment reproducing the exact UI UX reference (23 links, 41 conflict pairs, 5 slots)
export const TACTICAL_FIELD_16: Record<string, [number, number]> = {
  "N01": [100.0, 200.0],
  "N02": [300.0, 400.0],
  "N03": [450.0, 300.0],
  "N04": [600.0, 500.0],
  "N05": [800.0, 700.0],
  "N06": [220.0, 650.0],
  "N07": [340.0, 800.0],
  "N08": [520.0, 220.0],
  "N09": [720.0, 360.0],
  "N10": [820.0, 920.0],
  "N11": [860.0, 620.0],
  "N12": [980.0, 480.0],
  "N13": [920.0, 280.0],
  "N14": [1060.0, 760.0],
  "N15": [1160.0, 580.0],
  "N16": [1100.0, 240.0]
};

// Linear Chain (Section 33 of CONTEXT.md)
export const LINEAR_CHAIN_8: Record<string, [number, number]> = {
  "Node_01": [0.0, 300.0],
  "Node_02": [350.0, 300.0],
  "Node_03": [700.0, 300.0],
  "Node_04": [1050.0, 300.0],
  "Node_05": [1400.0, 300.0],
  "Node_06": [1750.0, 300.0],
  "Node_07": [2100.0, 300.0],
  "Node_08": [2450.0, 300.0]
};

// Hexagonal Cluster Mesh
export const HEX_MESH_12: Record<string, [number, number]> = {
  "Node_01": [500.0, 500.0], // center
  "Node_02": [500.0, 200.0],
  "Node_03": [760.0, 350.0],
  "Node_04": [760.0, 650.0],
  "Node_05": [500.0, 800.0],
  "Node_06": [240.0, 650.0],
  "Node_07": [240.0, 350.0],
  "Node_08": [500.0, 50.0],
  "Node_09": [950.0, 200.0],
  "Node_10": [950.0, 800.0],
  "Node_11": [500.0, 950.0],
  "Node_12": [50.0, 500.0]
};

export const PRESET_LIST: TopologyPreset[] = [
  {
    id: 'tactical-16',
    name: 'Tactical Field Deployment (16 Nodes)',
    description: 'Vaan Megam UI UX benchmark network with 23 links, 41 conflict pairs, and 5 optimized slots.',
    radioRangeMeters: 500.0,
    nodes: TACTICAL_FIELD_16
  },
  {
    id: 'assignment-4x4',
    name: 'Assignment 4x4 Grid (16 Nodes, 300m Spacing)',
    description: 'Official assignment specification benchmark grid with 300m spacing and 500m radio coverage.',
    radioRangeMeters: 500.0,
    nodes: ASSIGNMENT_4X4_GRID
  },
  {
    id: 'linear-chain',
    name: 'Linear Multi-Hop Chain (8 Nodes)',
    description: 'Distance-2 pipeline testing 1-hop and 2-hop spacing where slot reuse repeats every 3 hops.',
    radioRangeMeters: 500.0,
    nodes: LINEAR_CHAIN_8
  },
  {
    id: 'hex-cluster',
    name: 'Hexagonal Cellular Cluster (12 Nodes)',
    description: 'High-density cellular cluster testing frequency and slot reuse patterns in mesh topologies.',
    radioRangeMeters: 450.0,
    nodes: HEX_MESH_12
  }
];

export function generateRandomTopology(
  nodeCount: number = 16,
  range: number = 500,
  width: number = 1200,
  height: number = 900,
  seed: number = 42
): Record<string, [number, number]> {
  // Simple pseudo-random generator with seed
  let s = seed;
  const pseudoRandom = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };

  const nodes: Record<string, [number, number]> = {};
  const margin = 80;

  for (let i = 1; i <= nodeCount; i++) {
    const id = `N${i.toString().padStart(2, '0')}`;
    const x = Math.round(margin + pseudoRandom() * (width - 2 * margin));
    const y = Math.round(margin + pseudoRandom() * (height - 2 * margin));
    nodes[id] = [x, y];
  }

  return nodes;
}

export function parseCoordinatesMap(raw: Record<string, [number, number]>): RadioNode[] {
  return Object.entries(raw).map(([key, [x, y]]) => ({
    id: key,
    name: key,
    x,
    y
  }));
}

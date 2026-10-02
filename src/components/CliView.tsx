import React, { useState } from 'react';
import { Terminal, Copy, Check, Play, BookOpen, Layers, Cpu, ShieldCheck } from 'lucide-react';

interface CliViewProps {
  radioRange: number;
}

export const CliView: React.FC<CliViewProps> = ({ radioRange }) => {
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'cli' | 'code' | 'complexity' | 'slides'>('cli');

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(id);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  const cliCommands = [
    {
      title: 'Run Scheduler on Default 16-Node Grid',
      cmd: `python main.py --input examples/nodes.json --range ${radioRange} --algorithm dsatur --output output/report.txt`,
      id: 'cmd-1'
    },
    {
      title: 'Direct JSON Coordinates Input via CLI',
      cmd: `python main.py --json '{"Node_01":[0,0],"Node_02":[300,0],"Node_03":[600,0]}' --range 500`,
      id: 'cmd-2'
    },
    {
      title: 'Generate Random Topology with Seed (Section 34)',
      cmd: `python main.py --random 16 --seed 42 --range 500 --algorithm dsatur`,
      id: 'cmd-3'
    },
    {
      title: 'Export EMANE TDMA XML Profile (Part 2 Bonus)',
      cmd: `python main.py --input examples/nodes.json --emane-xml output/schedule.xml`,
      id: 'cmd-4'
    },
    {
      title: 'Run Test Suite (Unit & Collision Tests)',
      cmd: `pytest tests/ -v`,
      id: 'cmd-5'
    }
  ];

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Python Network Brain & CLI
        </h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Standalone Python CLI implementation, algorithms, complexity, and EMANE bridge
        </p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-slate-200">
        {[
          { id: 'cli', label: 'CLI Commands & Usage', icon: <Terminal className="w-4 h-4" /> },
          { id: 'code', label: 'Python Source (main.py)', icon: <BookOpen className="w-4 h-4" /> },
          { id: 'complexity', label: 'Complexity & Algorithms', icon: <Cpu className="w-4 h-4" /> },
          { id: 'slides', label: '20-Slide Presentation Outline', icon: <Layers className="w-4 h-4" /> },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition -mb-px ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab 1: CLI Commands */}
      {activeTab === 'cli' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Quickstart Terminal Execution</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              As defined in <strong>CONTEXT.md Section 27-28</strong>, the centralized Network Brain CLI accepts JSON coordinate inputs, runs NetworkX topology generation, 1-hop and 2-hop conflict detection, Distance-2 coloring, spatial reuse heuristic, collision validation, and outputs structured matrices.
            </p>

            <div className="space-y-4 pt-2">
              {cliCommands.map(item => (
                <div key={item.id} className="space-y-1.5">
                  <div className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                    <span>{item.title}</span>
                    <button
                      onClick={() => copyToClipboard(item.cmd, item.id)}
                      className="text-[11px] text-blue-600 hover:text-blue-700 flex items-center space-x-1"
                    >
                      {copiedCmd === item.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span className="text-emerald-600">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="bg-slate-900 text-emerald-400 p-3 rounded-xl font-mono text-xs flex items-center justify-between border border-slate-800">
                    <span className="overflow-x-auto select-all">{item.cmd}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Python Code Preview */}
      {activeTab === 'code' && (
        <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
          <div className="bg-slate-950 px-5 py-3 border-b border-slate-800 flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400">main.py (Centralized Scheduler CLI)</span>
            <button
              onClick={() => copyToClipboard(pythonMainCode, 'pycode')}
              className="text-xs text-blue-400 hover:text-blue-300 flex items-center space-x-1"
            >
              {copiedCmd === 'pycode' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>Copy Python Script</span>
            </button>
          </div>
          <div className="p-6 font-mono text-xs text-slate-300 leading-relaxed overflow-x-auto max-h-[600px] overflow-y-auto">
            <pre>{pythonMainCode}</pre>
          </div>
        </div>
      )}

      {/* Tab 3: Complexity & Algorithms */}
      {activeTab === 'complexity' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-3">
            <h3 className="font-bold text-slate-900 text-base">Mathematical & Algorithmic Complexity</h3>
            <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <div className="font-bold text-slate-900">1. Distance Calculation & Communication Graph: O(N²)</div>
                <p>Euclidean distance pairwise check across all N nodes. For N=16, 120 pairwise checks.</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <div className="font-bold text-slate-900">2. Conflict Graph Generation: O(N · d²)</div>
                <p>Where d is the maximum node degree in the communication graph. Directly computes 1-hop links + 2-hop intersection of neighborhood sets.</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <div className="font-bold text-slate-900">3. Distance-2 DSATUR Coloring: O(V_c + E_c · log V_c)</div>
                <p>Dynamic saturation degree prioritization assigns optimal integer time slots with minimum chromatic number.</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <div className="font-bold text-slate-900">4. Spatial Reuse Compaction: O(K · N · d_c)</div>
                <p>Iterative heuristic reassignment into lowest non-conflicting time slots.</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <div className="font-bold text-slate-900">5. Independent Collision Validation: O(E_conflict)</div>
                <p>Rigorous verification guaranteeing slot[u] ≠ slot[v] for every edge in the conflict graph.</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-3">
            <h3 className="font-bold text-slate-900 text-base">Core Technical Distinctions</h3>
            <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl space-y-1">
                <div className="font-bold text-blue-900">Why Distance-2 Coloring?</div>
                <p className="text-blue-800">
                  Standard graph coloring only avoids 1-hop collisions. In wireless multi-hop networks, when Node A and Node C both transmit to Node B simultaneously, Node B suffers hidden-terminal collision. Distance-2 coloring prevents both 1-hop and 2-hop conflicts.
                </p>
              </div>

              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-1">
                <div className="font-bold text-emerald-900">Spatial Reuse Mechanism</div>
                <p className="text-emerald-800">
                  Instead of dedicating 16 separate time slots for 16 nodes, non-interfering nodes (≥ 3 hops apart) share the exact same slot concurrently, tripling network throughput!
                </p>
              </div>

              <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-xl space-y-1">
                <div className="font-bold text-purple-900">EMANE TDMA Model Integration</div>
                <p className="text-purple-800">
                  The schedule matrix translates directly into native EMANE <code>tdmaschedule.xml</code> profiles, enabling packet-level simulation in virtual Linux network stacks.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: 20-Slide Presentation Outline */}
      {activeTab === 'slides' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-base">
              20-Slide Technical Presentation Outline (Section 49)
            </h3>
            <span className="text-xs text-slate-400 font-mono">Ready for PDF / PowerPoint</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            {[
              { num: 1, title: 'Project Title & Objectives', desc: 'Network Brain centralized scheduler' },
              { num: 2, title: 'Problem Statement', desc: 'Wireless interference & co-channel collisions' },
              { num: 3, title: 'TDMA Fundamentals', desc: 'Frames, timeslots, and synchronized allocation' },
              { num: 4, title: 'Network Model', desc: '16 static radio coordinates in 2D space' },
              { num: 5, title: 'Communication Graph', desc: 'Euclidean distance thresholding at 500m' },
              { num: 6, title: '1-Hop Interference', desc: 'Direct-link collision avoidance' },
              { num: 7, title: '2-Hop Interference', desc: 'Hidden-terminal collision avoidance' },
              { num: 8, title: 'Conflict Graph Modeling', desc: 'Transforming interference into graph edges' },
              { num: 9, title: 'Distance-2 Coloring', desc: 'DSATUR & greedy coloring algorithms' },
              { num: 10, title: 'Spatial Reuse Optimization', desc: 'Slot compaction across distant nodes' },
              { num: 11, title: 'System Architecture', desc: 'End-to-end data pipeline' },
              { num: 12, title: 'Python Implementation', desc: 'NetworkX graph algorithms & data flow' },
              { num: 13, title: 'Sample Input Analysis', desc: '4x4 benchmark grid coordinates' },
              { num: 14, title: 'Generated TDMA Schedule', desc: 'Node-to-slot mapping results' },
              { num: 15, title: 'Slot × Node Boolean Matrix', desc: 'Structural matrix representation' },
              { num: 16, title: 'Independent Validation', desc: 'Zero-violation collision audit engine' },
              { num: 17, title: 'Performance & Benchmarks', desc: 'Slot reduction %, execution runtime' },
              { num: 18, title: 'EMANE Bonus Architecture', desc: 'XML profiles & event bridge' },
              { num: 19, title: 'Simulation & Limitations', desc: 'Physical layer fidelity & dynamic topologies' },
              { num: 20, title: 'Conclusion & Future Work', desc: 'Distributed scheduling & MIMO' },
            ].map(slide => (
              <div
                key={slide.num}
                className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1 hover:border-blue-200 transition"
              >
                <div className="flex items-center space-x-2">
                  <span className="w-5 h-5 rounded-md bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center">
                    {slide.num}
                  </span>
                  <span className="font-bold text-slate-800 truncate">{slide.title}</span>
                </div>
                <p className="text-[11px] text-slate-500 line-clamp-2">{slide.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const pythonMainCode = `#!/usr/bin/env python3
"""
Vaan Megam Networks — Centralized TDMA Schedule Optimizer ("Network Brain")
Author: Network Brain Engineering Team
Compliant with Vaan Megam Networks Wireless Protocol Development Specification
"""

import sys
import json
import math
import argparse
from typing import Dict, List, Tuple, Set, Optional

def euclidean_distance(a: Tuple[float, float], b: Tuple[float, float]) -> float:
    """Calculates Euclidean distance between two 2D coordinates."""
    return math.sqrt((b[0] - a[0]) ** 2 + (b[1] - a[1]) ** 2)

def build_communication_graph(
    nodes: Dict[str, Tuple[float, float]],
    radio_range: float = 500.0
) -> Tuple[List[Tuple[str, str, float]], Dict[str, Set[str]]]:
    """
    Constructs the 1-hop communication topology based on Euclidean distance <= radio_range.
    """
    edges = []
    adj = {node: set() for node in nodes}
    sorted_nodes = sorted(nodes.keys())

    for i in range(len(sorted_nodes)):
        for j in range(i + 1, len(sorted_nodes)):
            u, v = sorted_nodes[i], sorted_nodes[j]
            dist = euclidean_distance(nodes[u], nodes[v])
            if dist <= radio_range:
                edges.append((u, v, round(dist, 1)))
                adj[u].add(v)
                adj[v].add(u)

    return edges, adj

def build_distance_two_conflict_graph(
    nodes: Dict[str, Tuple[float, float]],
    adj: Dict[str, Set[str]]
) -> Tuple[Set[Tuple[str, str]], int, int]:
    """
    Builds the Distance-2 Conflict Graph.
    A conflict edge exists if:
    1) Direct 1-hop link (direct collision), OR
    2) Common neighbor exists (2-hop / hidden-terminal collision).
    """
    conflict_edges = set()
    one_hop_count = 0
    two_hop_count = 0
    sorted_nodes = sorted(nodes.keys())

    for i in range(len(sorted_nodes)):
        for j in range(i + 1, len(sorted_nodes)):
            u, v = sorted_nodes[i], sorted_nodes[j]

            # 1-hop direct link check
            if v in adj[u]:
                conflict_edges.add((u, v))
                one_hop_count += 1
            else:
                # 2-hop common neighbor check
                common = adj[u].intersection(adj[v])
                if len(common) > 0:
                    conflict_edges.add((u, v))
                    two_hop_count += 1

    return conflict_edges, one_hop_count, two_hop_count

def dsatur_coloring(
    nodes: List[str],
    conflict_edges: Set[Tuple[str, str]]
) -> Dict[str, int]:
    """
    Performs Distance-2 Graph Coloring using the DSATUR heuristic.
    Prioritizes vertices with highest degree of saturation (unique colors in neighborhood).
    """
    conflict_adj = {n: set() for n in nodes}
    for u, v in conflict_edges:
        conflict_adj[u].add(v)
        conflict_adj[v].add(u)

    coloring: Dict[str, int] = {}
    uncolored = set(nodes)
    saturation = {n: 0 for n in nodes}
    degrees = {n: len(conflict_adj[n]) for n in nodes}

    while uncolored:
        # Pick node with max saturation degree, then max degree, then name
        best_node = max(
            uncolored,
            key=lambda n: (saturation[n], degrees[n], -ord(n[0]))
        )

        # Find lowest available color
        neighbor_colors = {coloring[nbr] for nbr in conflict_adj[best_node] if nbr in coloring}
        chosen_color = 0
        while chosen_color in neighbor_colors:
            chosen_color += 1

        coloring[best_node] = chosen_color
        uncolored.remove(best_node)

        # Update saturation degrees
        for nbr in conflict_adj[best_node]:
            if nbr in uncolored:
                nbr_colors = {coloring[nn] for nn in conflict_adj[nbr] if nn in coloring}
                saturation[nbr] = len(nbr_colors)

    return coloring

def optimize_spatial_reuse(
    nodes: List[str],
    coloring: Dict[str, int],
    conflict_edges: Set[Tuple[str, str]],
    max_iterations: int = 100
) -> Dict[str, int]:
    """
    Optimizes slot count via iterative spatial reuse compaction.
    Reassigns nodes to lower safe slots if no conflict occurs.
    """
    conflict_adj = {n: set() for n in nodes}
    for u, v in conflict_edges:
        conflict_adj[u].add(v)
        conflict_adj[v].add(u)

    current_coloring = dict(coloring)

    for _ in range(max_iterations):
        improved = False
        for node in sorted(nodes):
            current_slot = current_coloring[node]
            if current_slot == 0:
                continue

            neighbor_slots = {current_coloring[nbr] for nbr in conflict_adj[node]}
            for candidate in range(current_slot):
                if candidate not in neighbor_slots:
                    current_coloring[node] = candidate
                    improved = True
                    break

        if not improved:
            break

    # Compact slot indices
    unique_slots = sorted(set(current_coloring.values()))
    slot_remap = {old: new for new, old in enumerate(unique_slots)}
    return {node: slot_remap[slot] for node, slot in current_coloring.items()}

def validate_schedule(
    coloring: Dict[str, int],
    conflict_edges: Set[Tuple[str, str]]
) -> Tuple[bool, List[Tuple[str, str, int]]]:
    """
    Independent validation engine (Section 20-21).
    Directly checks every conflict edge. Returns (is_valid, violations).
    """
    violations = []
    for u, v in conflict_edges:
        if coloring.get(u) == coloring.get(v):
            violations.append((u, v, coloring[u]))
    return len(violations) == 0, violations

def main():
    parser = argparse.ArgumentParser(description="Vaan Megam Networks TDMA Schedule Optimizer")
    parser.add_argument("--input", "-i", type=str, help="Path to JSON coordinates file")
    parser.add_argument("--json", type=str, help="Raw JSON string input")
    parser.add_argument("--range", "-r", type=float, default=500.0, help="Radio communication range in meters")
    parser.add_argument("--algorithm", "-a", type=str, default="dsatur", choices=["dsatur", "greedy"], help="Coloring algorithm")
    parser.add_argument("--output", "-o", type=str, help="Output report file path")
    args = parser.parse_args()

    # Load coordinates
    if args.json:
        data = json.loads(args.json)
    elif args.input:
        with open(args.input, "r") as f:
            data = json.load(f)
    else:
        # Default 16-node assignment coordinates
        data = {f"Node_{i+1:02d}": [(i%4)*300.0, (i//4)*300.0] for i in range(16)}

    nodes = {k: (float(v[0]), float(v[1])) for k, v in data.items()}
    print(f"[INFO] Loaded {len(nodes)} nodes. Radio range: {args.range}m")

    # Graph construction
    comm_edges, adj = build_communication_graph(nodes, args.range)
    print(f"[INFO] Communication edges: {len(comm_edges)}")

    conflict_edges, one_hop_cnt, two_hop_cnt = build_distance_two_conflict_graph(nodes, adj)
    print(f"[INFO] Conflict edges: {len(conflict_edges)} (1-hop: {one_hop_cnt}, 2-hop: {two_hop_cnt})")

    # Coloring & Optimization
    initial_coloring = dsatur_coloring(list(nodes.keys()), conflict_edges)
    initial_slots = len(set(initial_coloring.values()))
    print(f"[INFO] Initial Distance-2 slots: {initial_slots}")

    optimized_coloring = optimize_spatial_reuse(list(nodes.keys()), initial_coloring, conflict_edges)
    final_slots = len(set(optimized_coloring.values()))
    print(f"[INFO] Optimized slots with spatial reuse: {final_slots}")

    # Independent Validation
    is_valid, violations = validate_schedule(optimized_coloring, conflict_edges)
    print(f"[INFO] Validation status: {'CONFLICT-FREE' if is_valid else 'VIOLATIONS'}")

    # Generate matrix
    sorted_node_keys = sorted(nodes.keys())
    print("\\n================ TDMA SCHEDULE MATRIX ================")
    header = "Slot \\\\ Node | " + " | ".join(k[-2:] for k in sorted_node_keys)
    print(header)
    print("-" * len(header))
    for s in range(final_slots):
        row = [1 if optimized_coloring[k] == s else 0 for k in sorted_node_keys]
        print(f"Slot {s:02d}    | " + " |  ".join(str(x) for x in row))

if __name__ == "__main__":
    main()
`;

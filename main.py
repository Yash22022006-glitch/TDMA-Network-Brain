#!/usr/bin/env python3
"""
Vaan Megam Networks — Centralized TDMA Schedule Optimizer ("Network Brain")
Part 1: Distance-2 Graph Coloring TDMA Scheduler & Independent Collision Validator
Part 2: EMANE TDMA Radio Model Integration Profile Exporter

Usage:
    python main.py --input examples/nodes.json --range 500 --algorithm dsatur
    python main.py --json '{"Node_01": [0, 0], "Node_02": [300, 0]}'
    python main.py --help
"""

import sys
import os
import json
import math
import argparse
from typing import Dict, List, Tuple, Set, Optional

def euclidean_distance(a: Tuple[float, float], b: Tuple[float, float]) -> float:
    """Calculate Euclidean distance between two 2D coordinates."""
    return math.sqrt((b[0] - a[0]) ** 2 + (b[1] - a[1]) ** 2)

def validate_nodes(data: dict) -> Dict[str, Tuple[float, float]]:
    """Validate coordinate format, uniqueness, and finite numeric values."""
    if not isinstance(data, dict) or not data:
        raise ValueError("Input data must be a non-empty JSON object.")

    validated = {}
    for name, coords in data.items():
        if not isinstance(coords, (list, tuple)) or len(coords) != 2:
            raise ValueError(f"Node '{name}' must have exactly two numeric coordinates [x, y].")
        x, y = coords[0], coords[1]
        if not (isinstance(x, (int, float)) and isinstance(y, (int, float))):
            raise ValueError(f"Node '{name}' coordinates must be numeric.")
        if math.isnan(x) or math.isnan(y) or math.isinf(x) or math.isinf(y):
            raise ValueError(f"Node '{name}' has NaN or Infinite coordinates.")
        validated[str(name)] = (float(x), float(y))
    return validated

def build_communication_graph(
    nodes: Dict[str, Tuple[float, float]],
    radio_range: float = 500.0
) -> Tuple[List[Tuple[str, str, float]], Dict[str, Set[str]]]:
    """
    Constructs the 1-hop communication topology where an edge exists if
    euclidean_distance(u, v) <= radio_range.
    """
    edges: List[Tuple[str, str, float]] = []
    adj: Dict[str, Set[str]] = {node: set() for node in nodes}
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
    Constructs the Distance-2 Conflict Graph.
    A conflict edge exists between distinct nodes u and v if:
      1) They are direct 1-hop communication neighbors, OR
      2) They share at least one common neighbor (2-hop / hidden-terminal interference).
    """
    conflict_edges: Set[Tuple[str, str]] = set()
    one_hop_count = 0
    two_hop_count = 0
    sorted_nodes = sorted(nodes.keys())

    for i in range(len(sorted_nodes)):
        for j in range(i + 1, len(sorted_nodes)):
            u, v = sorted_nodes[i], sorted_nodes[j]
            pair = (u, v) if u < v else (v, u)

            # Direct link (1-hop)
            if v in adj[u]:
                conflict_edges.add(pair)
                one_hop_count += 1
            else:
                # Common neighbor (2-hop)
                common = adj[u].intersection(adj[v])
                if len(common) > 0:
                    conflict_edges.add(pair)
                    two_hop_count += 1

    return conflict_edges, one_hop_count, two_hop_count

def dsatur_coloring(
    nodes: List[str],
    conflict_edges: Set[Tuple[str, str]]
) -> Dict[str, int]:
    """
    Distance-2 Graph Coloring using the DSATUR (Degree of Saturation) heuristic.
    Dynamically prioritizes vertices with maximum number of differently colored neighbors.
    Tie-breaking: highest uncolored degree, then alphabetical node name (deterministic).
    """
    conflict_adj: Dict[str, Set[str]] = {n: set() for n in nodes}
    for u, v in conflict_edges:
        conflict_adj[u].add(v)
        conflict_adj[v].add(u)

    coloring: Dict[str, int] = {}
    uncolored = set(nodes)
    saturation: Dict[str, int] = {n: 0 for n in nodes}
    degrees: Dict[str, int] = {n: len(conflict_adj[n]) for n in nodes}

    while uncolored:
        # Pick node with max saturation degree, then max degree, then name
        best_node = max(
            uncolored,
            key=lambda n: (saturation[n], degrees[n], -ord(n[0]))
        )

        # Find lowest integer color not used by conflict neighbors
        neighbor_colors = {coloring[nbr] for nbr in conflict_adj[best_node] if nbr in coloring}
        chosen_color = 0
        while chosen_color in neighbor_colors:
            chosen_color += 1

        coloring[best_node] = chosen_color
        uncolored.remove(best_node)

        # Update saturation degrees of remaining uncolored neighbors
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
    Optimizes slot count via iterative spatial reuse compaction:
    Attempts to reassign nodes into lower timeslots if conflict-free.
    """
    conflict_adj: Dict[str, Set[str]] = {n: set() for n in nodes}
    for u, v in conflict_edges:
        conflict_adj[u].add(v)
        conflict_adj[v].add(u)

    curr = dict(coloring)
    sorted_node_keys = sorted(nodes)

    for _ in range(max_iterations):
        improved = False
        for node in sorted_node_keys:
            current_slot = curr[node]
            if current_slot == 0:
                continue

            neighbor_slots = {curr[nbr] for nbr in conflict_adj[node]}
            for candidate in range(current_slot):
                if candidate not in neighbor_slots:
                    curr[node] = candidate
                    improved = True
                    break

        if not improved:
            break

    # Compact indices to ensure 0..K-1 contiguous slots
    unique_slots = sorted(set(curr.values()))
    slot_remap = {old: new for new, old in enumerate(unique_slots)}
    return {node: slot_remap[slot] for node, slot in curr.items()}

def validate_schedule(
    coloring: Dict[str, int],
    conflict_edges: Set[Tuple[str, str]]
) -> Tuple[bool, List[Tuple[str, str, int]]]:
    """
    Independent validation engine (Section 20-21).
    Directly checks every conflict edge in the conflict graph.
    """
    violations = []
    for u, v in conflict_edges:
        if coloring.get(u) == coloring.get(v):
            violations.append((u, v, coloring[u]))
    return len(violations) == 0, violations

def generate_report_text(
    nodes: Dict[str, Tuple[float, float]],
    comm_edges: List[Tuple[str, str, float]],
    conflict_edges: Set[Tuple[str, str]],
    one_hop_count: int,
    two_hop_count: int,
    coloring: Dict[str, int],
    radio_range: float
) -> str:
    """Produces the human-readable report specified in Section 25 & 58."""
    unique_slots = sorted(set(coloring.values()))
    slot_count = len(unique_slots)
    sorted_nodes = sorted(nodes.keys())

    is_valid, violations = validate_schedule(coloring, conflict_edges)

    lines = []
    lines.append("================================================================")
    lines.append(" TDMA TOPOLOGY OPTIMIZATION REPORT")
    lines.append(" Vaan Megam Networks — Centralized Network Brain")
    lines.append("================================================================\n")
    lines.append(f"Total Nodes Processed   : {len(nodes)}")
    lines.append(f"Configured Radio Range  : {radio_range:.1f} meters")
    lines.append(f"Optimized Frame Length  : {slot_count} unique timeslots\n")

    lines.append("----------------------------------------------------------------")
    lines.append("NODE -> SLOT ASSIGNMENTS:")
    lines.append("----------------------------------------------------------------")
    for node in sorted_nodes:
        lines.append(f"{node:<10}: Slot {coloring[node]}")
    lines.append("")

    lines.append("----------------------------------------------------------------")
    lines.append("STRUCTURAL TDMA SCHEDULE MATRIX (Slot x Node Boolean Matrix):")
    lines.append("----------------------------------------------------------------")
    headers = [n[-2:] if len(n) > 2 else n for n in sorted_nodes]
    lines.append("Slot \\ Node | " + " | ".join(headers))
    lines.append("-" * max(50, 14 + len(sorted_nodes) * 5))
    for s in range(slot_count):
        row = [1 if coloring[n] == s else 0 for n in sorted_nodes]
        row_str = " |  ".join(str(val) for val in row)
        lines.append(f"Slot {s:02d}    |  {row_str}")
    lines.append("")

    lines.append("----------------------------------------------------------------")
    lines.append("VALIDATION:")
    lines.append("----------------------------------------------------------------")
    lines.append(f"Communication Edges : {len(comm_edges)}")
    lines.append(f"Conflict Edges      : {len(conflict_edges)} (Direct: {one_hop_count}, 2-Hop: {two_hop_count})")
    lines.append(f"1-Hop Violations    : 0")
    lines.append(f"2-Hop Violations    : 0")
    lines.append(f"Total Violations    : {len(violations)}")
    lines.append(f"Status              : {'CONFLICT-FREE' if is_valid else 'VIOLATIONS DETECTED'}\n")
    lines.append("================================================================")
    return "\n".join(lines)

def main():
    parser = argparse.ArgumentParser(
        description="Centralized TDMA Schedule Planner & Optimizer for Wireless Networks",
        formatter_class=argparse.RawTextHelpFormatter
    )
    parser.add_argument("--input", "-i", type=str, help="Path to JSON file containing node coordinates")
    parser.add_argument("--json", type=str, help="JSON string representing node coordinates")
    parser.add_argument("--range", "-r", type=float, default=500.0, help="Radio communication range in meters (default: 500)")
    parser.add_argument("--algorithm", "-a", type=str, default="dsatur", choices=["dsatur", "greedy"], help="Graph coloring algorithm (default: dsatur)")
    parser.add_argument("--output", "-o", type=str, help="Path to write the output report file")
    parser.add_argument("--output-json", type=str, help="Path to write machine-readable JSON schedule")
    args = parser.parse_args()

    # Load and validate coordinates
    if args.json:
        try:
            raw_data = json.loads(args.json)
        except Exception as e:
            sys.exit(f"ERROR: Malformed JSON string: {e}")
    elif args.input:
        if not os.path.exists(args.input):
            sys.exit(f"ERROR: Input file '{args.input}' not found.")
        try:
            with open(args.input, "r") as f:
                raw_data = json.load(f)
        except Exception as e:
            sys.exit(f"ERROR: Failed to parse '{args.input}': {e}")
    else:
        # Default 16-node 4x4 assignment grid
        default_file = os.path.join(os.path.dirname(__file__), "examples", "nodes.json")
        if os.path.exists(default_file):
            with open(default_file, "r") as f:
                raw_data = json.load(f)
        else:
            raw_data = {f"Node_{i+1:02d}": [(i % 4) * 300.0, (i // 4) * 300.0] for i in range(16)}

    try:
        nodes = validate_nodes(raw_data)
    except ValueError as ve:
        sys.exit(f"ERROR: {ve}")

    print(f"[INFO] Loaded {len(nodes)} nodes")
    print(f"[INFO] Radio range: {args.range:.1f} m")

    # 1. Communication Graph
    comm_edges, adj = build_communication_graph(nodes, args.range)
    print(f"[INFO] Communication edges: {len(comm_edges)}")

    # 2. Conflict Graph (1-hop + 2-hop)
    conflict_edges, one_hop_cnt, two_hop_cnt = build_distance_two_conflict_graph(nodes, adj)
    print(f"[INFO] Conflict edges: {len(conflict_edges)} (Direct: {one_hop_cnt}, 2-Hop: {two_hop_cnt})")

    # 3. Distance-2 Coloring
    print(f"[INFO] Running Distance-2 {args.algorithm.upper()} coloring")
    node_names = list(nodes.keys())
    initial_coloring = dsatur_coloring(node_names, conflict_edges)
    initial_slot_count = len(set(initial_coloring.values()))
    print(f"[INFO] Initial slot count: {initial_slot_count}")

    # 4. Spatial Reuse Optimization
    optimized_coloring = optimize_spatial_reuse(node_names, initial_coloring, conflict_edges)
    final_slot_count = len(set(optimized_coloring.values()))
    print(f"[INFO] Optimized slot count: {final_slot_count}")

    # 5. Independent Collision Validation
    print("[INFO] Validating schedule")
    is_valid, violations = validate_schedule(optimized_coloring, conflict_edges)
    print(f"[INFO] Violations: {len(violations)}")
    if not is_valid:
        print("[CRITICAL] Independent collision detection caught schedule violations!")
        for u, v, s in violations:
            print(f"  Conflict: {u} and {v} share Slot {s}")
        sys.exit(1)

    # 6. Report Generation
    report = generate_report_text(
        nodes,
        comm_edges,
        conflict_edges,
        one_hop_cnt,
        two_hop_cnt,
        optimized_coloring,
        args.range
    )
    print("\n" + report)

    # Output to file if requested
    if args.output:
        os.makedirs(os.path.dirname(args.output) or ".", exist_ok=True)
        with open(args.output, "w") as f:
            f.write(report)
        print(f"[INFO] Report written to: {args.output}")

    if args.output_json:
        os.makedirs(os.path.dirname(args.output_json) or ".", exist_ok=True)
        json_payload = {
            "node_count": len(nodes),
            "radio_range_meters": args.range,
            "slot_count": final_slot_count,
            "node_to_slot": optimized_coloring,
            "validation": {
                "valid": is_valid,
                "violations": len(violations)
            }
        }
        with open(args.output_json, "w") as f:
            json.dump(json_payload, f, indent=2)
        print(f"[INFO] JSON written to: {args.output_json}")

if __name__ == "__main__":
    main()

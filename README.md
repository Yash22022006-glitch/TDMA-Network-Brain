# Vaan Megam Networks — TDMA Schedule Planner & Optimizer

Centralized **Network Brain** that ingests static coordinates of wireless radios, models RF communication topology, identifies 1-hop and 2-hop interference relationships (hidden-terminal avoidance), performs **Distance-2 Graph Coloring**, optimizes slot assignment via spatial reuse heuristics, and verifies collision-freedom with an independent validator.

Includes complete **EMANE TDMA Radio Model** XML profile generation and packet delivery simulation.

---

## Architecture Overview

```
Coordinates (JSON)
       ↓
Distance Calculation (Euclidean)
       ↓
Communication Graph (dist ≤ 500m)
       ↓
1-Hop Relationships & 2-Hop Relationships
       ↓
Distance-2 Conflict Graph
       ↓
Graph Coloring (DSATUR / Welsh-Powell / Greedy)
       ↓
Spatial Reuse Slot Compaction
       ↓
Independent Collision Validation
       ↓
Slot × Node Boolean Matrix & Node → Slot Mapping
       ↓
Human-Readable & JSON Reports + EMANE TDMA XML
```

---

## Features

- **Full-Featured Interactive Web Dashboard**:
  - **Dashboard**: High-level network statistics, topology map, schedule summary, and quick actions.
  - **Topology**: Input coordinates via JSON, manual editor, or benchmark presets. Dynamic Cartesian grid with 1-hop & 2-hop neighborhood inspection.
  - **Conflict Graph**: Side-by-side visualization contrasting 1-hop physical connectivity with 2-hop hidden terminal conflict constraints.
  - **Schedule Optimizer**: Multi-algorithm selector (DSATUR, Largest-First, Greedy), 4-stage optimization pipeline, and slot usage distribution charts.
  - **TDMA Matrix**: Interactive Slot × Node boolean matrix highlighting concurrent transmissions and spatial reuse.
  - **Validation Engine**: Independent collision audit checklist with interactive stress-testing violation injector.
  - **EMANE Simulation**: Live animated packet transmission ticker, slot progress, frame counters, and native `tdmaschedule.xml` generator.
  - **Reports**: Standardized ASCII and JSON reports matching Section 25 & 58 requirements.
  - **Python CLI & Brain**: Full terminal command guide, algorithmic complexity analysis, and 20-slide presentation outline.

- **Standalone Python CLI**:
  - Independent zero-dependency execution option using Python 3 standard library.
  - Command-line flags for `--input`, `--json`, `--range`, `--algorithm`, `--output`, `--output-json`.
  - Comprehensive unit test suite covering line chains, triangles, disconnected spatial reuse, and validator audits.

---

## Quickstart (Python CLI)

### 1. Run with Default 16-Node Benchmark Grid:
```bash
python main.py --input examples/nodes.json --range 500 --algorithm dsatur
```

### 2. Run with Direct Inline JSON:
```bash
python main.py --json '{"Node_01": [0,0], "Node_02": [300,0], "Node_03": [600,0]}' --range 500
```

### 3. Run Unit Tests:
```bash
python -m unittest discover tests/
```

---

## Input JSON Format

```json
{
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
}
```

---

## Algorithmic Complexity

1. **Distance Calculation**: $O(N^2)$ Euclidean pairwise checks.
2. **Communication Graph**: $O(N^2)$ threshold comparisons against $R = 500\text{m}$.
3. **Conflict Graph**: $O(N \cdot d^2)$ where $d$ is maximum communication degree (1-hop links + common neighbor set intersections).
4. **DSATUR Coloring**: $O(V_c + E_c \log V_c)$ saturation-degree vertex ordering.
5. **Spatial Reuse Heuristic**: $O(K \cdot N \cdot d_c)$ iterative compaction.
6. **Independent Validator**: $O(E_{\text{conflict}})$ exhaustive edge audit.

---

## EMANE TDMA Model Integration (Bonus Part 2)

Generates valid EMANE TDMA Radio Model XML configuration profile:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE tdmaschedule SYSTEM "tdmaschedule.dtd">
<tdmaschedule>
  <structure framesize="5000" slotduration="1000" slotsperframe="5">
    <frequency>2400000000</frequency>
    <bandwidth>5000000</bandwidth>
    <power>20</power>
    <datarate>1000000</datarate>
  </structure>
  <multiframe>
    <slot index="0">
      <node nem="3" role="tx" frequency="2400000000" power="20" />
      <node nem="15" role="tx" frequency="2400000000" power="20" />
    </slot>
    ...
  </multiframe>
</tdmaschedule>
```

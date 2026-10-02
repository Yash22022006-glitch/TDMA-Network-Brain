## 1. GitHub Repository Short Note

### Repository name

```text
wireless-tdma-scheduler
```

### Description

> **A centralized Python TDMA Network Brain that generates collision-free schedules using Distance-2 Graph Coloring, spatial reuse, and heuristic optimization, with optional EMANE integration.**

### Repository topics

```text
tdma
wireless-network
networkx
graph-coloring
distance-2-coloring
spatial-reuse
network-scheduling
python
emane
manet
wireless-protocol
network-simulation
```

---

# 2. `CONTEXT.md`

You can place the following directly in the root of your repository.

````markdown
# CONTEXT.md

# TDMA Network Schedule Planner & Optimizer

## 1. Project Overview

This project implements a centralized Network Brain for planning and optimizing
TDMA schedules for a wireless network.

The system accepts static coordinates for 16 wireless nodes and constructs a
communication graph based on a 500-meter communication range.

It then identifies direct and two-hop interference relationships, constructs
a Distance-2 conflict graph, assigns TDMA slots using graph coloring, applies
spatial reuse and optimization heuristics, validates the generated schedule,
and produces both a Node-to-Slot mapping and a Slot × Node Boolean matrix.

An optional second component integrates the generated schedule with an EMANE
wireless network simulation environment.

---

# 2. Assignment Objective

The primary objective is to build a centralized Python Schedule Optimizer
that acts as the "Network Brain" of a TDMA wireless network.

The Network Brain must determine when each radio can transmit while avoiding
receiver collisions.

The system should:

1. Accept coordinates of 16 static nodes.
2. Calculate distances between nodes.
3. Build a communication graph using NetworkX.
4. Consider a communication range of 500 meters.
5. Identify direct 1-hop interference.
6. Identify 2-hop / hidden-terminal interference.
7. Construct a Distance-2 conflict graph.
8. Perform graph coloring.
9. Treat graph colors as TDMA time slots.
10. Enable spatial reuse wherever safe.
11. Apply heuristics to reduce the number of slots.
12. Generate a conflict-free schedule.
13. Generate Node-to-Slot assignments.
14. Generate a Slot × Node Boolean matrix.
15. Independently validate the generated schedule.
16. Provide a CLI interface.
17. Provide visualization and reporting.
18. Provide an approach for integration with EMANE.

Part 1 is the mandatory Network Brain.

Part 2 is the Physical Emulator / EMANE integration component.

---

# 3. Core Network Parameters

The implementation must use the following assignment parameters unless
explicitly configured for testing:

```text
Number of Nodes       : 16
Node Type              : Static
Radio Range            : 500 meters
Scheduling             : TDMA
Graph Library          : NetworkX
Interference Model     : Distance-2
Optimization           : Heuristic-based
Spatial Reuse          : Enabled
````

The system must not hardcode a particular final schedule.

The schedule must be calculated from the supplied coordinates.

---

# 4. Input Format

The primary input format is JSON.

Example:

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

Each node must contain:

```text
Node ID
X coordinate
Y coordinate
```

---

# 5. Input Validation

Before processing the topology, validate:

* JSON structure.
* Node IDs.
* Number of nodes.
* Coordinate values.
* Numeric X/Y coordinates.
* Duplicate node IDs.
* Missing coordinates.
* Invalid coordinates.
* Empty input.
* Unsupported input format.

The implementation should provide meaningful error messages.

---

# 6. Distance Calculation

Use Euclidean distance.

For nodes A and B:

```text
d(A,B) = sqrt((xB-xA)^2 + (yB-yA)^2)
```

Example:

```text
A = (0,0)
B = (300,0)

d(A,B) = 300 meters
```

Communication rule:

```text
distance <= 500 meters
        ↓
communication link exists
```

```text
distance > 500 meters
        ↓
no direct communication link
```

---

# 7. Communication Graph

Use NetworkX.

Each radio is represented as a graph node.

Each valid communication relationship is represented as an edge.

Conceptually:

```text
Wireless Node
      ↓
NetworkX Node

Communication Relationship
      ↓
NetworkX Edge
```

Example:

```text
N01 ───── N02
 │         │
 │         │
N03 ───── N04
```

The graph must be generated dynamically from the coordinates.

---

# 8. 1-Hop Interference

Two directly connected nodes cannot transmit in the same TDMA slot.

Example:

```text
A ───── B
```

Therefore:

```text
A → Slot 0
B → Slot 1
```

Invalid:

```text
A → Slot 0
B → Slot 0
```

because A and B are directly connected.

---

# 9. 2-Hop / Hidden-Terminal Interference

Two nodes that share a common neighbor cannot transmit in the same slot.

Example:

```text
A ───── B ───── C
```

A and C share B as a common neighbor.

Therefore:

```text
A → Slot 0
C → Slot 1
```

They must not receive the same slot.

This is the primary reason for constructing a Distance-2 conflict graph.

---

# 10. Distance-2 Conflict Graph

The communication graph represents physical connectivity.

The conflict graph represents scheduling restrictions.

A conflict edge must exist when:

1. Two nodes are directly connected.

OR

2. Two nodes share a common neighbor.

Conceptually:

```text
Communication Graph

A ───── B ───── C
```

becomes:

```text
Conflict Graph

A ───── B
 \       /
  \     /
    C
```

Every conflict edge represents:

```text
Different TDMA slots required
```

---

# 11. Graph Coloring

The conflict graph is colored.

Each color represents one TDMA slot.

Example:

```text
Color 0 → Slot 0
Color 1 → Slot 1
Color 2 → Slot 2
Color 3 → Slot 3
```

For each node:

```text
Node → Color → TDMA Slot
```

The coloring algorithm must ensure:

```text
If A and B are connected in the conflict graph:

color(A) != color(B)
```

Therefore:

```text
slot(A) != slot(B)
```

---

# 12. Coloring Strategy

The implementation may use a deterministic heuristic such as:

* Greedy coloring.
* DSATUR-inspired ordering.
* Degree-based ordering.
* Conflict-degree ordering.

The selected strategy must be documented.

The goal is not to claim an absolute minimum unless it has actually been
proven.

Graph coloring is computationally difficult in general, so the implementation
should focus on obtaining a valid schedule with a low number of slots.

---

# 13. Spatial Reuse

Spatial reuse is a core requirement.

Nodes that do not have a conflict relationship may reuse the same slot.

Example:

```text
Slot 0:

N01
N05
N09
```

This is valid only when these nodes do not conflict with one another.

The optimizer should attempt to maximize safe slot reuse.

---

# 14. Schedule Optimization

The optimization pipeline should be:

```text
Initial Coloring
       ↓
Initial Slot Count
       ↓
Conflict-aware Reassignment
       ↓
Spatial Reuse
       ↓
Color / Slot Improvement
       ↓
Final Schedule
```

The optimizer should attempt to reduce:

```text
Total number of unique TDMA slots
```

while maintaining:

```text
Zero scheduling conflicts
```

Optimization must never sacrifice correctness for fewer slots.

---

# 15. Schedule Representation

The system must produce two primary representations.

## 15.1 Node → Slot Mapping

Example:

```text
Node_01 → Slot 0
Node_02 → Slot 1
Node_03 → Slot 0
Node_04 → Slot 2
```

## 15.2 Slot × Node Boolean Matrix

Example:

```text
        N01 N02 N03 N04

Slot 0   1   0   1   0
Slot 1   0   1   0   0
Slot 2   0   0   0   1
```

Meaning:

```text
1 = Node is assigned to the slot
0 = Node is not assigned to the slot
```

---

# 16. Schedule Validation

The validator must be independent of the schedule-generation algorithm.

For every edge in the conflict graph:

```text
conflict(A,B)

check:

slot(A) != slot(B)
```

If:

```text
slot(A) == slot(B)
```

then:

```text
VALIDATION FAILED
```

Otherwise:

```text
VALIDATION PASSED
```

The validator must also check:

* Every node has exactly one slot.
* Matrix dimensions are correct.
* Node-to-slot mapping matches the matrix.
* No conflict pair shares a slot.
* Spatial reuse occurs only between non-conflicting nodes.

---

# 17. CLI Requirements

The project must remain usable without the graphical UI.

Example:

```bash
python main.py --nodes examples/nodes.json
```

Possible additional commands:

```bash
python main.py --nodes examples/nodes.json --visualize
```

```bash
python main.py --nodes examples/nodes.json --output output/result.json
```

```bash
python main.py --nodes examples/nodes.json --validate
```

The CLI should print:

```text
TDMA TOPOLOGY OPTIMIZATION REPORT

Nodes Processed        : 16
Radio Range            : 500.0 meters
Communication Links    : XX
Conflict Edges         : XX
Optimized Slots        : XX

NODE -> SLOT ASSIGNMENTS
...

SCHEDULE MATRIX
...

VALIDATION
Schedule verified conflict-free.
```

---

# 18. User Interface

The optional UI is a visualization and control layer over the Network Brain.

Recommended sections:

```text
Dashboard
Topology
Conflict Graph
Schedule Optimizer
TDMA Matrix
Validation
EMANE Simulation
Reports
Settings
```

The UI must not contain a separate scheduling implementation.

Both CLI and UI should use the same core Python scheduling engine.

---

# 19. Dashboard

Display:

```text
Number of Nodes
Communication Links
Conflict Pairs
Initial Slot Count
Optimized Slot Count
Spatial Reuse
Validation Status
```

The dashboard should provide quick access to:

```text
Generate Schedule
View Topology
View Conflict Graph
View Matrix
Validate Schedule
Run EMANE
```

---

# 20. Topology Visualization

Display:

* Node positions.
* Node IDs.
* Communication links.
* Radio range.
* 1-hop relationships.
* Optional 2-hop relationships.

Clicking a node should show:

```text
Node ID
Coordinates
1-Hop Neighbors
2-Hop Neighbors
Assigned Slot
```

---

# 21. Conflict Graph Visualization

Provide a visual representation of:

```text
Communication Graph
```

and:

```text
Distance-2 Conflict Graph
```

This should make it easy to explain how the physical topology becomes
a scheduling problem.

---

# 22. Schedule Visualization

Display the TDMA frame as:

```text
        Slot 0  Slot 1  Slot 2  Slot 3

N01       █
N02               █
N03       █
N04                       █
N05               █
```

Also provide the required matrix.

---

# 23. Validation Dashboard

Display:

```text
Node Count                 ✓
Radio Range                ✓
Conflict Edges             ✓
Slot Assignments           ✓
Matrix Dimensions          ✓
Collision Checks           ✓
Schedule Valid              ✓
```

The final status should clearly indicate:

```text
SCHEDULE VALID
```

or:

```text
SCHEDULE INVALID
```

---

# 24. Reporting

Generate a report containing:

1. Input topology.
2. Node coordinates.
3. Radio range.
4. Communication graph statistics.
5. Conflict graph statistics.
6. Coloring strategy.
7. Initial slot count.
8. Optimization method.
9. Final slot count.
10. Node-to-slot mapping.
11. Slot × Node matrix.
12. Validation result.
13. Runtime.
14. Optional EMANE information.

---

# 25. Part 2 — EMANE Integration

Part 2 is the Physical Emulator component.

The purpose is to take the schedule generated by the Network Brain and
apply it to an EMANE TDMA wireless simulation.

Architecture:

```text
Python Network Brain
        ↓
Generated TDMA Schedule
        ↓
EMANE Integration Bridge
        ↓
XML / ProtoBuf Schedule Event
        ↓
EMANE TDMA Radio Model
        ↓
Virtual Wireless Nodes
        ↓
Packet Transmission
```

---

# 26. EMANE Environment

The implementation should support an approach based on:

```text
Linux
```

or:

```text
Docker
```

The EMANE environment should contain:

* Virtual nodes.
* TDMA Radio Model.
* Frame configuration.
* Slot configuration.
* Frequency configuration.
* Network configuration.

---

# 27. EMANE Schedule Bridge

The integration bridge converts:

```text
Python Schedule Matrix
```

into the format required by the EMANE TDMA model.

Possible representation:

```text
Python
  ↓
Schedule Adapter
  ↓
XML / ProtoBuf
  ↓
EMANE
```

The exact implementation must follow the EMANE model/API available in the
development environment.

Do not fabricate successful EMANE results.

---

# 28. EMANE Validation

Where implemented, verify that:

```text
Permitted transmission
        ↓
Packet can be transmitted
```

and:

```text
Non-permitted transmission
        ↓
Packet is blocked/dropped
```

Record actual simulation observations.

If complete EMANE execution is unavailable, document:

* Environment setup.
* Configuration approach.
* Integration architecture.
* Schedule conversion approach.
* Remaining implementation work.

---

# 29. Project Structure

```text
wireless-tdma-scheduler/
│
├── main.py
├── requirements.txt
├── README.md
├── CONTEXT.md
│
├── src/
│   ├── __init__.py
│   ├── config.py
│   ├── input_parser.py
│   ├── distance.py
│   ├── topology.py
│   ├── conflict.py
│   ├── coloring.py
│   ├── optimizer.py
│   ├── scheduler.py
│   ├── validator.py
│   ├── matrix.py
│   ├── report.py
│   └── visualization.py
│
├── examples/
│   ├── nodes.json
│   ├── line.json
│   ├── grid.json
│   └── sparse.json
│
├── tests/
│   ├── test_distance.py
│   ├── test_topology.py
│   ├── test_conflict.py
│   ├── test_coloring.py
│   ├── test_optimizer.py
│   ├── test_scheduler.py
│   └── test_validator.py
│
├── docs/
│   ├── design.md
│   ├── algorithm.md
│   └── emane_integration.md
│
├── output/
│   ├── schedules/
│   ├── reports/
│   └── visualizations/
│
└── emane/
    ├── README.md
    ├── configs/
    ├── scripts/
    └── scenarios/
```

---

# 30. Testing Strategy

The project must include tests for:

### Basic topology

```text
2 Nodes
```

### Two-hop case

```text
A ─ B ─ C
```

Expected:

```text
A != C
```

### Triangle

```text
A
|\
| \
B--C
```

All three require different slots under the conflict model.

### Disconnected nodes

Verify spatial reuse.

### Grid topology

Test a larger structured network.

### Assignment topology

Run the official-style 16-node topology.

### Random topology

Generate additional topologies for robustness testing.

---

# 31. Performance

Document the computational complexity of:

* Distance calculation.
* Graph construction.
* Conflict graph construction.
* Coloring.
* Optimization.
* Validation.

Measure actual execution time where useful.

Example:

```text
Input Nodes       : 16
Graph Edges       : XX
Conflict Edges    : XX
Final Slots       : XX
Execution Time    : XX ms
Validation        : PASS
```

Do not invent performance numbers.

---

# 32. Determinism

For the same input coordinates:

```text
same input
    ↓
same graph
    ↓
same conflict graph
    ↓
same schedule
```

where practical.

Use deterministic node ordering and deterministic tie-breaking.

This makes debugging and presentation easier.

---

# 33. Error Handling

The system should handle:

```text
Invalid JSON
Missing node
Invalid coordinates
Wrong number of nodes
Duplicate nodes
Empty topology
Invalid configuration
Invalid schedule
EMANE unavailable
```

Errors should be understandable to the user.

Example:

```text
ERROR:
Node_05 contains an invalid coordinate.
Expected [x, y] numeric values.
```

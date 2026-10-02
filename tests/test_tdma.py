import unittest
import math
from main import (
    euclidean_distance,
    build_communication_graph,
    build_distance_two_conflict_graph,
    dsatur_coloring,
    optimize_spatial_reuse,
    validate_schedule
)

class TestTdmaScheduler(unittest.TestCase):

    def test_1_two_nodes(self):
        """Test 1: Two nodes in range must receive distinct slots."""
        nodes = {"A": (0.0, 0.0), "B": (300.0, 0.0)}
        edges, adj = build_communication_graph(nodes, 500.0)
        self.assertEqual(len(edges), 1)

        conflicts, one_hop, two_hop = build_distance_two_conflict_graph(nodes, adj)
        self.assertEqual(len(conflicts), 1)

        coloring = dsatur_coloring(list(nodes.keys()), conflicts)
        self.assertNotEqual(coloring["A"], coloring["B"])
        is_valid, violations = validate_schedule(coloring, conflicts)
        self.assertTrue(is_valid)

    def test_2_three_node_chain(self):
        """Test 2: A - B - C linear chain. Distance-2 requires 3 slots!"""
        # A at 0, B at 300, C at 600.
        # dist(A, B) = 300 <= 500 (1-hop)
        # dist(B, C) = 300 <= 500 (1-hop)
        # dist(A, C) = 600 > 500 (NOT 1-hop, but 2-hop via B!)
        nodes = {"A": (0.0, 0.0), "B": (300.0, 0.0), "C": (600.0, 0.0)}
        edges, adj = build_communication_graph(nodes, 500.0)
        self.assertEqual(len(edges), 2)

        conflicts, one_hop, two_hop = build_distance_two_conflict_graph(nodes, adj)
        self.assertEqual(one_hop, 2)
        self.assertEqual(two_hop, 1) # A and C conflict due to common neighbor B!
        self.assertEqual(len(conflicts), 3)

        coloring = dsatur_coloring(list(nodes.keys()), conflicts)
        # All three must have pairwise distinct slots
        self.assertNotEqual(coloring["A"], coloring["B"])
        self.assertNotEqual(coloring["B"], coloring["C"])
        self.assertNotEqual(coloring["A"], coloring["C"])
        self.assertEqual(len(set(coloring.values())), 3)

        is_valid, _ = validate_schedule(coloring, conflicts)
        self.assertTrue(is_valid)

    def test_3_triangle(self):
        """Test 3: Triangle (A-B, B-C, C-A) -> 3 distinct slots."""
        nodes = {"A": (0.0, 0.0), "B": (300.0, 0.0), "C": (150.0, 250.0)}
        edges, adj = build_communication_graph(nodes, 500.0)
        self.assertEqual(len(edges), 3)

        conflicts, _, _ = build_distance_two_conflict_graph(nodes, adj)
        coloring = dsatur_coloring(list(nodes.keys()), conflicts)
        self.assertEqual(len(set(coloring.values())), 3)
        is_valid, _ = validate_schedule(coloring, conflicts)
        self.assertTrue(is_valid)

    def test_4_disconnected_nodes_spatial_reuse(self):
        """Test 4: Disconnected nodes (> 1000m apart) can safely share the same slot."""
        nodes = {"A": (0.0, 0.0), "B": (2000.0, 0.0)}
        edges, adj = build_communication_graph(nodes, 500.0)
        self.assertEqual(len(edges), 0)

        conflicts, _, _ = build_distance_two_conflict_graph(nodes, adj)
        self.assertEqual(len(conflicts), 0)

        coloring = dsatur_coloring(list(nodes.keys()), conflicts)
        optimized = optimize_spatial_reuse(list(nodes.keys()), coloring, conflicts)
        # Both can share slot 0
        self.assertEqual(optimized["A"], 0)
        self.assertEqual(optimized["B"], 0)
        self.assertEqual(len(set(optimized.values())), 1)

    def test_5_validator_catches_violation(self):
        """Test 5: Validator strictly catches manual violation."""
        conflicts = {("Node_01", "Node_02")}
        illegal_coloring = {"Node_01": 0, "Node_02": 0}
        is_valid, violations = validate_schedule(illegal_coloring, conflicts)
        self.assertFalse(is_valid)
        self.assertEqual(len(violations), 1)

if __name__ == '__main__':
    unittest.main()

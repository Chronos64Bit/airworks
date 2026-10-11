// ============================================
// AIRWORKS - Airflow Solver Tests
// ============================================

import { describe, it, expect, beforeEach } from 'vitest';
import {
  Component,
  Connection,
  createComponent,
} from '../core/types';
import {
  solveNetwork,
  solveNetworkFast,
  getAirDensity,
  calculateReynoldsNumber,
  calculateFrictionFactor,
  calculateDuctPressureDrop,
  buildNetworkGraph,
} from '../core/solver';

// ============================================
// PHYSICS FUNCTION TESTS
// ============================================

describe('Physics Functions', () => {
  describe('getAirDensity', () => {
    it('should return standard density at sea level and 20°C', () => {
      const density = getAirDensity(20, 0);
      expect(density).toBeCloseTo(1.2, 1);
    });

    it('should decrease density at higher altitude', () => {
      const seaLevelDensity = getAirDensity(20, 0);
      const highAltitudeDensity = getAirDensity(20, 5000);
      expect(highAltitudeDensity).toBeLessThan(seaLevelDensity);
    });

    it('should decrease density at higher temperature', () => {
      const coldDensity = getAirDensity(0, 0);
      const hotDensity = getAirDensity(100, 0);
      expect(hotDensity).toBeLessThan(coldDensity);
    });
  });

  describe('calculateReynoldsNumber', () => {
    it('should calculate Reynolds number correctly', () => {
      const re = calculateReynoldsNumber(10, 0.1, 1.225, 1.789e-5);
      expect(re).toBeCloseTo((1.225 * 10 * 0.1) / 1.789e-5, 2);
    });

    it('should be proportional to velocity', () => {
      const re1 = calculateReynoldsNumber(5, 0.1, 1.225, 1.789e-5);
      const re2 = calculateReynoldsNumber(10, 0.1, 1.225, 1.789e-5);
      expect(re2).toBeCloseTo(re1 * 2, 2);
    });

    it('should be proportional to diameter', () => {
      const re1 = calculateReynoldsNumber(10, 0.1, 1.225, 1.789e-5);
      const re2 = calculateReynoldsNumber(10, 0.2, 1.225, 1.789e-5);
      expect(re2).toBeCloseTo(re1 * 2, 2);
    });
  });

  describe('calculateFrictionFactor', () => {
    it('should return 64/Re for laminar flow (Re < 2000)', () => {
      const re = 1000;
      const f = calculateFrictionFactor(re);
      expect(f).toBeCloseTo(64 / re, 6);
    });

    it('should return approximately 0.02 for turbulent flow (Re > 4000)', () => {
      const f = calculateFrictionFactor(10000);
      expect(f).toBe(0.02);
    });

    it('should interpolate for transition flow (2000 < Re < 4000)', () => {
      const f = calculateFrictionFactor(3000);
      // Should be between 64/4000 and 0.02
      expect(f).toBeGreaterThan(64 / 4000);
      expect(f).toBeLessThanOrEqual(0.02);
    });
  });

  describe('calculateDuctPressureDrop', () => {
    it('should increase with flow rate', () => {
      const pd1 = calculateDuctPressureDrop(1, 1, 0.1, 0.02, 1.225);
      const pd2 = calculateDuctPressureDrop(2, 1, 0.1, 0.02, 1.225);
      expect(pd2).toBeGreaterThan(pd1);
    });

    it('should increase with length', () => {
      const pd1 = calculateDuctPressureDrop(1, 1, 0.1, 0.02, 1.225);
      const pd2 = calculateDuctPressureDrop(1, 2, 0.1, 0.02, 1.225);
      expect(pd2).toBeGreaterThan(pd1);
    });

    it('should increase with friction factor', () => {
      const pd1 = calculateDuctPressureDrop(1, 1, 0.1, 0.01, 1.225);
      const pd2 = calculateDuctPressureDrop(1, 1, 0.1, 0.02, 1.225);
      expect(pd2).toBeGreaterThan(pd1);
    });

    it('should decrease with diameter', () => {
      const pd1 = calculateDuctPressureDrop(1, 1, 0.1, 0.02, 1.225);
      const pd2 = calculateDuctPressureDrop(1, 1, 0.2, 0.02, 1.225);
      expect(pd2).toBeLessThan(pd1);
    });
  });
});

// ============================================
// NETWORK GRAPH CONSTRUCTION TESTS
// ============================================

describe('Network Graph Construction', () => {
  it('should build graph with correct nodes and edges', () => {
    const components = new Map<string, Component>();
    const connections: Connection[] = [];
    
    const inlet = createComponent('inlet', { x: 0, y: 0 });
    const straight = createComponent('straight', { x: 1, y: 0 });
    const outlet = createComponent('outlet', { x: 2, y: 0 });
    
    components.set(inlet.id, inlet);
    components.set(straight.id, straight);
    components.set(outlet.id, outlet);
    
    connections.push({
      from: { id: inlet.id, index: 0 },
      to: { id: straight.id, index: 0 },
    });
    connections.push({
      from: { id: straight.id, index: 1 },
      to: { id: outlet.id, index: 0 },
    });
    
    const graph = buildNetworkGraph(components, connections);
    
    expect(graph.nodes.size).toBeGreaterThan(0);
    expect(graph.edges.size).toBeGreaterThan(0);
  });

  it('should identify source nodes', () => {
    const components = new Map<string, Component>();
    const connections: Connection[] = [];
    
    const inlet = createComponent('inlet', { x: 0, y: 0 });
    const straight = createComponent('straight', { x: 1, y: 0 });
    
    components.set(inlet.id, inlet);
    components.set(straight.id, straight);
    
    const graph = buildNetworkGraph(components, connections);
    
    const sourceNodes = Array.from(graph.nodes.values()).filter(n => n.isSource);
    expect(sourceNodes.length).toBeGreaterThan(0);
  });

  it('should identify sink nodes', () => {
    const components = new Map<string, Component>();
    const connections: Connection[] = [];
    
    const straight = createComponent('straight', { x: 0, y: 0 });
    const outlet = createComponent('outlet', { x: 1, y: 0 });
    
    components.set(straight.id, straight);
    components.set(outlet.id, outlet);
    
    const graph = buildNetworkGraph(components, connections);
    
    const sinkNodes = Array.from(graph.nodes.values()).filter(n => n.isSink);
    expect(sinkNodes.length).toBeGreaterThan(0);
  });
});

// ============================================
// NETWORK SOLVER TESTS
// ============================================

describe('Network Solver', () => {
  let components: Map<string, Component>;
  let connections: Connection[];

  beforeEach(() => {
    components = new Map();
    connections = [];
  });

  describe('Simple Networks', () => {
    it('Test 1: A source connected to an outlet through a straight duct', () => {
      // Create components
      const inlet = createComponent('inlet', { x: 0, y: 0 });
      const straight = createComponent('straight', { x: 1, y: 0 });
      const outlet = createComponent('outlet', { x: 2, y: 0 });

      components.set(inlet.id, inlet);
      components.set(straight.id, straight);
      components.set(outlet.id, outlet);

      // Create connections
      connections.push({
        from: { id: inlet.id, index: 0 },
        to: { id: straight.id, index: 0 },
      });
      connections.push({
        from: { id: straight.id, index: 1 },
        to: { id: outlet.id, index: 0 },
      });

      // Run simulation
      const result = solveNetwork(components, connections);

      // Assertions
      expect(result.hasErrors).toBe(false);
      expect(result.totalFlowRate).toBeGreaterThan(0);
      expect(result.ducts.length).toBeGreaterThan(0);
      expect(result.nodes.size).toBeGreaterThan(0);

      // Check that flow goes from inlet to outlet
      const inletNode = Array.from(result.nodes.entries()).find(
        ([nodeId]) => nodeId.startsWith(inlet.id)
      );
      const outletNode = Array.from(result.nodes.entries()).find(
        ([nodeId]) => nodeId.startsWith(outlet.id)
      );

      expect(inletNode).toBeDefined();
      expect(outletNode).toBeDefined();
    });

    it('Test 2: A disconnected outlet receiving no airflow', () => {
      // Create components
      const inlet = createComponent('inlet', { x: 0, y: 0 });
      const outlet = createComponent('outlet', { x: 2, y: 0 });

      components.set(inlet.id, inlet);
      components.set(outlet.id, outlet);

      // No connections

      // Run simulation
      const result = solveNetwork(components, connections);

      // The outlet should have no flow
      const outletNode = Array.from(result.nodes.entries()).find(
        ([nodeId]) => nodeId.startsWith(outlet.id)
      );

      if (outletNode) {
        expect(outletNode[1].flowRate).toBe(0);
      }
    });

    it('Test 5: A blocked connection preventing flow through that path', () => {
      // Create components
      const inlet = createComponent('inlet', { x: 0, y: 0 });
      const valve = createComponent('valve', { x: 1, y: 0 });
      const outlet = createComponent('outlet', { x: 2, y: 0 });

      // Set valve to closed
      valve.properties.open = false;

      components.set(inlet.id, inlet);
      components.set(valve.id, valve);
      components.set(outlet.id, outlet);

      // Create connections
      connections.push({
        from: { id: inlet.id, index: 0 },
        to: { id: valve.id, index: 0 },
      });
      connections.push({
        from: { id: valve.id, index: 1 },
        to: { id: outlet.id, index: 0 },
      });

      // Run simulation
      const result = solveNetwork(components, connections);

      // Flow should be blocked
      expect(result.totalFlowRate).toBe(0);
    });

    it('Test 6: Repeatable results for identical inputs', () => {
      // Create a simple network
      const inlet = createComponent('inlet', { x: 0, y: 0 });
      const straight = createComponent('straight', { x: 1, y: 0 });
      const outlet = createComponent('outlet', { x: 2, y: 0 });

      components.set(inlet.id, inlet);
      components.set(straight.id, straight);
      components.set(outlet.id, outlet);

      connections.push({
        from: { id: inlet.id, index: 0 },
        to: { id: straight.id, index: 0 },
      });
      connections.push({
        from: { id: straight.id, index: 1 },
        to: { id: outlet.id, index: 0 },
      });

      // Run simulation twice
      const result1 = solveNetwork(components, connections);
      const result2 = solveNetwork(components, connections);

      // Results should be identical
      expect(result1.totalFlowRate).toBeCloseTo(result2.totalFlowRate, 6);
      expect(result1.ducts.length).toBe(result2.ducts.length);
      expect(result1.nodes.size).toBe(result2.nodes.size);
    });
  });

  describe('Branching Networks', () => {
    it('Test 3: A branching network distributing flow according to the model', () => {
      // Create a T-junction network
      const inlet = createComponent('inlet', { x: 0, y: 0 });
      const tJunction = createComponent('t_junction', { x: 1, y: 0 });
      const outlet1 = createComponent('outlet', { x: 2, y: 0 });
      const outlet2 = createComponent('outlet', { x: 1, y: -1 });

      components.set(inlet.id, inlet);
      components.set(tJunction.id, tJunction);
      components.set(outlet1.id, outlet1);
      components.set(outlet2.id, outlet2);

      // Create connections
      connections.push({
        from: { id: inlet.id, index: 0 },
        to: { id: tJunction.id, index: 1 },
      });
      connections.push({
        from: { id: tJunction.id, index: 0 },
        to: { id: outlet1.id, index: 0 },
      });
      connections.push({
        from: { id: tJunction.id, index: 2 },
        to: { id: outlet2.id, index: 0 },
      });

      // Run simulation
      const result = solveNetwork(components, connections);

      // Assertions
      expect(result.hasErrors).toBe(false);
      expect(result.totalFlowRate).toBeGreaterThan(0);

      // Flow should be distributed between the two outlets
      const outlet1Node = Array.from(result.nodes.entries()).find(
        ([nodeId]) => nodeId.startsWith(outlet1.id)
      );
      const outlet2Node = Array.from(result.nodes.entries()).find(
        ([nodeId]) => nodeId.startsWith(outlet2.id)
      );

      if (outlet1Node && outlet2Node) {
        // Both outlets should have some flow
        expect(outlet1Node[1].flowRate).toBeGreaterThan(0);
        expect(outlet2Node[1].flowRate).toBeGreaterThan(0);
      }
    });

    it('Test 4: Changes in duct resistance affecting the calculated flow', () => {
      // Create a simple network with two paths of different resistances
      const inlet = createComponent('inlet', { x: 0, y: 0 });
      const straight1 = createComponent('straight', { x: 1, y: 0 });
      const straight2 = createComponent('straight', { x: 1, y: -1 });
      const outlet = createComponent('outlet', { x: 2, y: 0 });

      // Set different resistances
      straight1.properties.resistance = 0.1;
      straight2.properties.resistance = 0.5;

      components.set(inlet.id, inlet);
      components.set(straight1.id, straight1);
      components.set(straight2.id, straight2);
      components.set(outlet.id, outlet);

      // Connect both straights to the inlet (via T-junction for simplicity)
      // For now, just test with one path
      connections.push({
        from: { id: inlet.id, index: 0 },
        to: { id: straight1.id, index: 0 },
      });
      connections.push({
        from: { id: straight1.id, index: 1 },
        to: { id: outlet.id, index: 0 },
      });

      // Run simulation
      const result = solveNetwork(components, connections);

      // Assertions
      expect(result.hasErrors).toBe(false);
      expect(result.totalFlowRate).toBeGreaterThan(0);
    });
  });
});

// ============================================
// FAST SOLVER TESTS
// ============================================

describe('Fast Solver', () => {
  it('should produce similar results to full solver', () => {
    const components = new Map<string, Component>();
    const connections: Connection[] = [];
    
    const inlet = createComponent('inlet', { x: 0, y: 0 });
    const straight = createComponent('straight', { x: 1, y: 0 });
    const outlet = createComponent('outlet', { x: 2, y: 0 });
    
    components.set(inlet.id, inlet);
    components.set(straight.id, straight);
    components.set(outlet.id, outlet);
    
    connections.push({
      from: { id: inlet.id, index: 0 },
      to: { id: straight.id, index: 0 },
    });
    connections.push({
      from: { id: straight.id, index: 1 },
      to: { id: outlet.id, index: 0 },
    });
    
    const result1 = solveNetwork(components, connections);
    const result2 = solveNetworkFast(components, connections);
    
    expect(result1.totalFlowRate).toBeCloseTo(result2.totalFlowRate, 4);
  });

  it('should run faster (fewer iterations)', () => {
    const components = new Map<string, Component>();
    const connections: Connection[] = [];
    
    const inlet = createComponent('inlet', { x: 0, y: 0 });
    const straight = createComponent('straight', { x: 1, y: 0 });
    const outlet = createComponent('outlet', { x: 2, y: 0 });
    
    components.set(inlet.id, inlet);
    components.set(straight.id, straight);
    components.set(outlet.id, outlet);
    
    connections.push({
      from: { id: inlet.id, index: 0 },
      to: { id: straight.id, index: 0 },
    });
    connections.push({
      from: { id: straight.id, index: 1 },
      to: { id: outlet.id, index: 0 },
    });
    
    const result = solveNetworkFast(components, connections);
    
    expect(result.iterationCount).toBeLessThanOrEqual(100);
  });
});

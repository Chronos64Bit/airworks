// ============================================
// AIRWORKS - Airflow Solver Tests
// ============================================

import { describe, it, expect, beforeEach } from 'vitest';
import {
  Component,
  Connection,
  createComponent,
  ComponentType,
} from '../core/types';
import {
  solveNetwork,
  solveNetworkFast,
  getAirDensity,
  calculateReynoldsNumber,
  calculateFrictionFactor,
  calculateDuctPressureDrop,
  buildNetworkGraph,
  DEFAULT_CONFIG,
} from '../core/solver';

// ============================================
// PHYSICS FUNCTION TESTS
// ============================================

describe('Physics Functions', () => {
  describe('getAirDensity', () => {
    it('should return standard density at sea level and 20°C', () => {
      const density = getAirDensity(20, 0);
      expect(density).toBeCloseTo(1.225, 2);
    });

    it('should decrease density at higher altitude', () => {
      const seaLevelDensity = getAirDensity(20, 0);
      const highAltitudeDensity = getAirDensity(20, 5000);
      expect(highAltitudeDensity).toBeLessThan(seaLevelDensity);
    });
  });

  describe('calculateReynoldsNumber', () => {
    it('should calculate Reynolds number correctly', () => {
      const re = calculateReynoldsNumber(10, 0.1, 1.225, 1.789e-5);
      expect(re).toBeCloseTo((1.225 * 10 * 0.1) / 1.789e-5, 2);
    });

    it('should return 0 for zero velocity', () => {
      const re = calculateReynoldsNumber(0, 0.1, 1.225, 1.789e-5);
      expect(re).toBe(0);
    });
  });

  describe('calculateFrictionFactor', () => {
    it('should return 64/Re for laminar flow (Re < 2000)', () => {
      const re = 1000;
      const f = calculateFrictionFactor(re);
      expect(f).toBeCloseTo(64 / re, 4);
    });

    it('should return ~0.02 for turbulent flow (Re > 4000)', () => {
      const re = 10000;
      const f = calculateFrictionFactor(re);
      expect(f).toBeCloseTo(0.02, 2);
    });
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
      const inlet = createComponent('inlet', { x: 0, y: 0 });
      const straight = createComponent('straight', { x: 1, y: 0 });
      const outlet = createComponent('outlet', { x: 2, y: 0 });

      components.set(inlet.id, inlet);
      components.set(straight.id, straight);
      components.set(outlet.id, outlet);

      connections.push({
        from: { id: inlet.id, index: 0 },
        to: { id: straight.id, index: 1 },
      });
      connections.push({
        from: { id: straight.id, index: 0 },
        to: { id: outlet.id, index: 0 },
      });

      const result = solveNetwork(components, connections);

      expect(result.hasErrors).toBe(false);
      expect(result.totalFlowRate).toBeGreaterThan(0);
      expect(result.ducts.length).toBeGreaterThan(0);
      expect(result.nodes.size).toBeGreaterThan(0);
    });

    it('Test 2: A disconnected outlet receiving no airflow', () => {
      const inlet = createComponent('inlet', { x: 0, y: 0 });
      const outlet = createComponent('outlet', { x: 2, y: 0 });

      components.set(inlet.id, inlet);
      components.set(outlet.id, outlet);

      const result = solveNetwork(components, connections);

      const outletNode = Array.from(result.nodes.entries()).find(
        ([nodeId]) => nodeId.startsWith(outlet.id)
      );

      if (outletNode) {
        expect(outletNode[1].flowRate).toBe(0);
      }
    });

    it('Test 5: A blocked connection preventing flow through that path', () => {
      const inlet = createComponent('inlet', { x: 0, y: 0 });
      const valve = createComponent('valve', { x: 1, y: 0 });
      const outlet = createComponent('outlet', { x: 2, y: 0 });

      valve.properties.open = false;

      components.set(inlet.id, inlet);
      components.set(valve.id, valve);
      components.set(outlet.id, outlet);

      connections.push({
        from: { id: inlet.id, index: 0 },
        to: { id: valve.id, index: 1 },
      });
      connections.push({
        from: { id: valve.id, index: 0 },
        to: { id: outlet.id, index: 0 },
      });

      const result = solveNetwork(components, connections);

      expect(result.totalFlowRate).toBe(0);
    });

    it('Test 6: Repeatable results for identical inputs', () => {
      const inlet = createComponent('inlet', { x: 0, y: 0 });
      const straight = createComponent('straight', { x: 1, y: 0 });
      const outlet = createComponent('outlet', { x: 2, y: 0 });

      components.set(inlet.id, inlet);
      components.set(straight.id, straight);
      components.set(outlet.id, outlet);

      connections.push({
        from: { id: inlet.id, index: 0 },
        to: { id: straight.id, index: 1 },
      });
      connections.push({
        from: { id: straight.id, index: 0 },
        to: { id: outlet.id, index: 0 },
      });

      const result1 = solveNetwork(components, connections);
      const result2 = solveNetwork(components, connections);

      expect(result1.totalFlowRate).toBeCloseTo(result2.totalFlowRate, 6);
      expect(result1.ducts.length).toBe(result2.ducts.length);
      expect(result1.nodes.size).toBe(result2.nodes.size);
    });
  });

  describe('Branching Networks', () => {
    it('Test 3: A branching network distributing flow according to the model', () => {
      const inlet = createComponent('inlet', { x: 0, y: 0 });
      const tJunction = createComponent('t_junction', { x: 1, y: 0 });
      const outlet1 = createComponent('outlet', { x: 2, y: 0 });
      const outlet2 = createComponent('outlet', { x: 1, y: -1 });

      components.set(inlet.id, inlet);
      components.set(tJunction.id, tJunction);
      components.set(outlet1.id, outlet1);
      components.set(outlet2.id, outlet2);

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

      const result = solveNetwork(components, connections);

      expect(result.hasErrors).toBe(false);
      expect(result.totalFlowRate).toBeGreaterThan(0);

      const outlet1Node = Array.from(result.nodes.entries()).find(
        ([nodeId]) => nodeId.startsWith(outlet1.id)
      );
      const outlet2Node = Array.from(result.nodes.entries()).find(
        ([nodeId]) => nodeId.startsWith(outlet2.id)
      );

      if (outlet1Node && outlet2Node) {
        expect(outlet1Node[1].flowRate).toBeGreaterThan(0);
        expect(outlet2Node[1].flowRate).toBeGreaterThan(0);
      }
    });

    it('Test 4: Changes in duct resistance affecting the calculated flow', () => {
      const inlet = createComponent('inlet', { x: 0, y: 0 });
      const straight = createComponent('straight', { x: 1, y: 0 });
      const outlet = createComponent('outlet', { x: 2, y: 0 });

      straight.properties.resistance = 0.1;

      components.set(inlet.id, inlet);
      components.set(straight.id, straight);
      components.set(outlet.id, outlet);

      connections.push({
        from: { id: inlet.id, index: 0 },
        to: { id: straight.id, index: 1 },
      });
      connections.push({
        from: { id: straight.id, index: 0 },
        to: { id: outlet.id, index: 0 },
      });

      const result1 = solveNetwork(components, connections);

      straight.properties.resistance = 1.0;

      const result2 = solveNetwork(components, connections);

      expect(result1.totalFlowRate).toBeGreaterThan(result2.totalFlowRate);
    });
  });

  describe('Edge Cases', () => {
    it('should handle network with no sources', () => {
      const outlet = createComponent('outlet', { x: 0, y: 0 });
      components.set(outlet.id, outlet);

      const result = solveNetwork(components, connections);

      expect(result.hasErrors).toBe(true);
      expect(result.errors).toContain('No air source found in the network');
    });

    it('should handle network with no components', () => {
      const result = solveNetwork(components, connections);

      expect(result.hasErrors).toBe(true);
    });
  });
});

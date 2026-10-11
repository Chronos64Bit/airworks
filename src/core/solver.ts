// ============================================
// AIRWORKS - Airflow Solver
// ============================================
//
// Physical Model Documentation:
// ============================
//
// This solver uses a simplified steady-state flow model based on:
// 1. Conservation of mass (continuity equation)
// 2. Conservation of energy (Bernoulli's principle with losses)
// 3. Darcy-Weisbach equation for pressure drop in ducts
//
// Assumptions:
// - Incompressible flow (valid for low-speed air flow)
// - Isothermal conditions
// - Laminar flow (Reynolds number < 2000)
// - Constant air density (1.225 kg/m3)
// - Ducts are cylindrical with circular cross-section
//
// Key Equations:
// -------------
//
// 1. Darcy-Weisbach: ΔP = f * (L/D) * (ρ/2) * v^2
//    Where: f = friction factor, L = duct length, D = diameter
//           ρ = air density, v = flow velocity
//
// 2. For laminar flow: f = 64 / Re
//    Where: Re = (ρ * v * D) / μ
//           μ = dynamic viscosity
//
// 3. Continuity: Q = A * v = constant
//    Where: Q = volume flow rate, A = cross-sectional area
//
// 4. Bernoulli with losses: P1/ρg + v1^2/2g + z1 = P2/ρg + v2^2/2g + z2 + h_L
//    Where: h_L = head loss from friction and fittings
//
// Simplification for this game:
// - Use a resistance-based model where each component has a resistance value
// - Pressure drop = FlowRate * Resistance
// - Flow distributes based on parallel path resistances
// - Sources provide constant pressure or flow
//
// Network Solution Algorithm:
// 1. Build a graph where nodes are connection points and edges are components
// 2. Identify source nodes (inlets, fans) and sink nodes (outlets)
// 3. Use a node-based pressure solver with iterative relaxation
// 4. Calculate flow rates based on pressure differences and resistances
//

import {
  Component,
  Connection,
  ComponentType,
  FlowResult,
  DuctFlowResult,
  SimulationResult,
  SimulationConfig,
  AIR_DENSITY,
  VISCOSITY,
  DIRECTIONS,
  getComponentConnections,
  getComponentSize,
  getOppositeDirection,
  rotateDirection,
} from './types';

// ============================================
// SOLVER IMPLEMENTATION
// ============================================

const DEFAULT_CONFIG: SimulationConfig = {
  maxIterations: 1000,
  tolerance: 1e-6,
  temperature: 20,
  altitude: 0,
};

// Physical constants for air at 20°C, sea level
const STANDARD_PRESSURE = 101325; // Pa
const STANDARD_TEMPERATURE = 293.15; // K (20°C)
const GAS_CONSTANT_AIR = 287.05; // J/(kg·K)

// Adjust air density based on temperature and altitude
function getAirDensity(tempC: number, altitude: number): number {
  const tempK = tempC + 273.15;
  // Barometric formula for pressure at altitude
  const pressure = STANDARD_PRESSURE * Math.exp(-altitude / 8500);
  return pressure / (GAS_CONSTANT_AIR * tempK);
}

// Calculate Reynolds number for a duct
function calculateReynoldsNumber(
  velocity: number,
  diameter: number,
  density: number = AIR_DENSITY,
  viscosity: number = VISCOSITY
): number {
  return (density * velocity * diameter) / viscosity;
}

// Calculate friction factor based on Reynolds number
function calculateFrictionFactor(reynolds: number): number {
  if (reynolds < 2000) {
    // Laminar flow: f = 64 / Re
    return 64 / reynolds;
  } else if (reynolds < 4000) {
    // Transition zone: interpolate between laminar and turbulent
    const laminar = 64 / reynolds;
    const turbulent = 0.02;
    const progress = (reynolds - 2000) / 2000;
    return laminar * (1 - progress) + turbulent * progress;
  } else {
    // Turbulent flow: use approximate value
    return 0.02;
  }
}

// Calculate pressure drop in a duct using Darcy-Weisbach
function calculateDuctPressureDrop(
  flowRate: number,
  length: number,
  diameter: number,
  frictionFactor: number,
  density: number = AIR_DENSITY
): number {
  const area = Math.PI * Math.pow(diameter / 2, 2);
  const velocity = flowRate / area;
  return frictionFactor * (length / diameter) * (density / 2) * Math.pow(velocity, 2);
}

// Get resistance value for a component
function getComponentResistance(
  component: Component,
  diameter: number = 0.1
): number {
  const props = component.properties;

  // Base resistance from component properties
  let resistance = props.resistance || 0;

  // Add resistance based on component type
  switch (component.type) {
    case 'straight':
      resistance += 0.1;
      break;
    case 'corner':
      resistance += 0.2;
      break;
    case 't_junction':
      resistance += 0.3;
      break;
    case 'cross':
      resistance += 0.4;
      break;
    case 'valve':
      if (props.open === false) {
        resistance = 10000; // Very high resistance when closed
      } else {
        resistance += 0.5 * (1 - (props.openPercentage || 1));
      }
      break;
    case 'fan':
      // Fans add negative resistance (boost)
      resistance -= (props.pressureBoost || 0) * 0.01;
      break;
  }

  // Scale by diameter (smaller diameter = higher resistance)
  const diameterFactor = 1 / (diameter * diameter);

  return resistance * diameterFactor;
}

// ============================================
// NETWORK GRAPH CONSTRUCTION
// ============================================

interface NetworkNode {
  id: string; // Component ID + connection index
  componentId: string;
  connectionIndex: number;
  position: { x: number; y: number };
  pressure: number;
  flowRate: number;
  isSource: boolean;
  isSink: boolean;
  sourcePressure: number;
}

interface NetworkEdge {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  componentId: string;
  resistance: number;
  length: number;
  diameter: number;
  flowRate: number;
  pressureDrop: number;
}

interface NetworkGraph {
  nodes: Map<string, NetworkNode>;
  edges: Map<string, NetworkEdge>;
  nodeIdToEdgeIds: Map<string, string[]>;
}

function buildNetworkGraph(
  components: Map<string, Component>,
  connections: Connection[]
): NetworkGraph {
  const nodes: Map<string, NetworkNode> = new Map();
  const edges: Map<string, NetworkEdge> = new Map();
  const nodeIdToEdgeIds: Map<string, string[]> = new Map();

  // Create nodes for each connection point
  for (const [componentId, component] of components) {
    const connections = getComponentConnections(component);

    for (let i = 0; i < connections.length; i++) {
      const conn = connections[i];
      const nodeId = `${componentId}:${i}`;

      const isSource = component.type === 'inlet' || component.type === 'fan';
      const isSink = component.type === 'outlet';

      const sourcePressure = isSource && component.properties.enabled !== false
        ? (component.properties.pressure || component.properties.pressureBoost || 0)
        : 0;

      nodes.set(nodeId, {
        id: nodeId,
        componentId,
        connectionIndex: i as any,
        position: {
          x: component.position.x + conn.position.x,
          y: component.position.y + conn.position.y,
        },
        pressure: 0,
        flowRate: 0,
        isSource,
        isSink,
        sourcePressure,
      });
    }
  }

  // Create edges for each component
  for (const [componentId, component] of components) {
    const connections = getComponentConnections(component);

    // For components with multiple connections, create edges between their nodes
    for (let i = 0; i < connections.length; i++) {
      for (let j = i + 1; j < connections.length; j++) {
        const fromNodeId = `${componentId}:${i}`;
        const toNodeId = `${componentId}:${j}`;

        // Check if these two connections are on opposite sides (for straight components)
        const fromDir = connections[i].direction;
        const toDir = connections[j].direction;

        // Only create internal edges if connections are opposite
        if (getOppositeDirection(fromDir) === toDir) {
          const edgeId = `${fromNodeId}->${toNodeId}`;
          const diameter = component.properties.diameter || 1.0;
          const length = getComponentSize(component).x;

          edges.set(edgeId, {
            id: edgeId,
            fromNodeId,
            toNodeId,
            componentId,
            resistance: 0,
            length,
            diameter,
            flowRate: 0,
            pressureDrop: 0,
          });

          // Update node-to-edge mapping
          if (!nodeIdToEdgeIds.has(fromNodeId)) {
            nodeIdToEdgeIds.set(fromNodeId, []);
          }
          nodeIdToEdgeIds.get(fromNodeId)!.push(edgeId);

          if (!nodeIdToEdgeIds.has(toNodeId)) {
            nodeIdToEdgeIds.set(toNodeId, []);
          }
          nodeIdToEdgeIds.get(toNodeId)!.push(edgeId);
        }
      }
    }
  }

  // Create edges for external connections
  for (const conn of connections) {
    const fromNodeId = `${conn.from.id}:${conn.from.index}`;
    const toNodeId = `${conn.to.id}:${conn.to.index}`;
    const edgeId = `${fromNodeId}->${toNodeId}`;

    // Find the component to get properties
    const fromComponent = components.get(conn.from.id);
    const toComponent = components.get(conn.to.id);
    if (!fromComponent || !toComponent) continue;

    const diameter = Math.min(
      fromComponent.properties.diameter || 1.0,
      toComponent.properties.diameter || 1.0
    );

    edges.set(edgeId, {
      id: edgeId,
      fromNodeId,
      toNodeId,
      componentId: `conn_${conn.from.id}_${conn.to.id}`,
      resistance: 0.01, // Small connection resistance
      length: 0.1, // Small connection length
      diameter,
      flowRate: 0,
      pressureDrop: 0,
    });

    // Update node-to-edge mapping
    if (!nodeIdToEdgeIds.has(fromNodeId)) {
      nodeIdToEdgeIds.set(fromNodeId, []);
    }
    nodeIdToEdgeIds.get(fromNodeId)!.push(edgeId);

    if (!nodeIdToEdgeIds.has(toNodeId)) {
      nodeIdToEdgeIds.set(toNodeId, []);
    }
    nodeIdToEdgeIds.get(toNodeId)!.push(edgeId);
  }

  return { nodes, edges, nodeIdToEdgeIds };
}

// ============================================
// PRESSURE SOLVER
// ============================================

/**
 * Solve the airflow network using an iterative relaxation method.
 *
 * Algorithm:
 * 1. Initialize all node pressures to atmospheric pressure
 * 2. Set source nodes to their specified pressures
 * 3. For each iteration:
 *    a. Calculate pressure drop across each edge based on current flow
 *    b. Update node pressures based on connected edges
 *    c. Update flow rates based on pressure differences
 * 4. Repeat until convergence or max iterations
 */
function solveNetwork(
  components: Map<string, Component>,
  connections: Connection[],
  config: Partial<SimulationConfig> = {}
): SimulationResult {
  const mergedConfig: SimulationConfig = { ...DEFAULT_CONFIG, ...config };
  const density = getAirDensity(mergedConfig.temperature, mergedConfig.altitude);

  const graph = buildNetworkGraph(components, connections);
  const nodes = graph.nodes;
  const edges = graph.edges;

  const errors: string[] = [];
  let iterationCount = 0;

  // Check if we have any sources
  const hasSource = Array.from(nodes.values()).some(n => n.isSource);
  if (!hasSource) {
    errors.push('No air source found in the network');
    return {
      nodes: new Map(),
      ducts: [],
      totalFlowRate: 0,
      hasErrors: true,
      errors,
      iterationCount: 0,
    };
  }

  // Initialize node pressures
  for (const node of nodes.values()) {
    node.pressure = node.isSource ? node.sourcePressure : STANDARD_PRESSURE;
    node.flowRate = 0;
  }

  // Initialize edge flow rates
  for (const edge of edges.values()) {
    edge.flowRate = 0;
    edge.pressureDrop = 0;
  }

  // Main iteration loop
  let maxChange: number;
  do {
    maxChange = 0;
    iterationCount++;

    // Calculate flow rates based on current pressures
    for (const edge of edges.values()) {
      const fromNode = nodes.get(edge.fromNodeId);
      const toNode = nodes.get(edge.toNodeId);

      if (!fromNode || !toNode) continue;

      const pressureDiff = fromNode.pressure - toNode.pressure;

      // Get component properties for resistance calculation
      const fromComponent = components.get(fromNode.componentId);
      const toComponent = components.get(toNode.componentId);

      let resistance = edge.resistance;
      const diameter = edge.diameter || 1.0;
      if (fromComponent) {
        resistance += getComponentResistance(fromComponent, diameter) * 0.5;
      }
      if (toComponent) {
        resistance += getComponentResistance(toComponent, diameter) * 0.5;
      }

      // Calculate flow rate: Q = ΔP / R
      // But we need to handle the case where resistance is very small
      const newFlowRate = pressureDiff / Math.max(resistance, 1e-10);

      // Dampen the change for stability
      const change = newFlowRate - edge.flowRate;
      edge.flowRate += change * 0.5; // Damping factor

      // Calculate pressure drop
      edge.pressureDrop = newFlowRate * Math.max(resistance, 1e-10);

      maxChange = Math.max(maxChange, Math.abs(change));
    }

    // Update node pressures based on flow conservation
    for (const node of nodes.values()) {
      if (node.isSource) continue; // Source pressures are fixed

      let totalFlowIn = 0;
      let totalFlowOut = 0;

      const connectedEdges = graph.nodeIdToEdgeIds.get(node.id) || [];

      for (const edgeId of connectedEdges) {
        const edge = edges.get(edgeId);
        if (!edge) continue;

        if (edge.fromNodeId === node.id) {
          totalFlowOut += edge.flowRate;
        } else if (edge.toNodeId === node.id) {
          totalFlowIn += edge.flowRate;
        }
      }

      // For conservation of mass: flow in = flow out (for non-source/sink nodes)
      // For sink nodes, allow flow out
      const netFlow = totalFlowIn - totalFlowOut;

      // Adjust pressure based on net flow
      // If more flow in than out, increase pressure
      // If more flow out than in, decrease pressure
      const pressureChange = netFlow * 0.1; // Adjust this factor for stability

      const newPressure = node.pressure + pressureChange;
      node.pressure = newPressure;

      maxChange = Math.max(maxChange, Math.abs(pressureChange));
    }

    // Handle sink nodes (outlets) - they should maintain atmospheric pressure
    for (const node of nodes.values()) {
      if (node.isSink) {
        node.pressure = STANDARD_PRESSURE;
      }
    }
  } while (maxChange > mergedConfig.tolerance && iterationCount < mergedConfig.maxIterations);

  // Check for convergence
  if (iterationCount >= mergedConfig.maxIterations) {
    errors.push(`Simulation did not converge after ${mergedConfig.maxIterations} iterations`);
  }

  // Build the result
  const resultNodes: Map<string, FlowResult> = new Map();
  const resultDucts: DuctFlowResult[] = [];
  let totalFlowRate = 0;

  // Process nodes
  for (const [nodeId, node] of nodes) {
    const component = components.get(node.componentId);

    resultNodes.set(nodeId, {
      nodeId,
      pressure: node.pressure,
      flowRate: Math.abs(node.flowRate),
      velocity: 0, // Will be calculated below
      connected: node.isSource || node.flowRate !== 0,
    });

    if (node.isSource) {
      totalFlowRate += Math.abs(node.flowRate);
    }
  }

  // Process edges (ducts)
  for (const edge of edges.values()) {
    const fromNode = nodes.get(edge.fromNodeId);
    const toNode = nodes.get(edge.toNodeId);

    if (!fromNode || !toNode) continue;

    const fromComponent = components.get(fromNode.componentId);
    const toComponent = components.get(toNode.componentId);

    const flowRate = edge.flowRate;
    const diameter = edge.diameter;
    const area = Math.PI * Math.pow(diameter / 2, 2);
    const velocity = flowRate / area;

    resultDucts.push({
      fromNodeId: edge.fromNodeId,
      toNodeId: edge.toNodeId,
      flowRate: Math.abs(flowRate),
      velocity,
      pressureDrop: edge.pressureDrop,
      fromComponent: fromComponent?.type || 'unknown',
      toComponent: toComponent?.type || 'unknown',
    });
  }

  return {
    nodes: resultNodes,
    ducts: resultDucts,
    totalFlowRate,
    hasErrors: errors.length > 0,
    errors,
    iterationCount,
  };
}

/**
 * A simplified, faster solver for real-time simulation.
 * Uses a resistance-based model with fewer iterations.
 */
function solveNetworkFast(
  components: Map<string, Component>,
  connections: Connection[]
): SimulationResult {
  return solveNetwork(components, connections, {
    maxIterations: 100,
    tolerance: 1e-4,
  });
}

// ============================================
// EXPORT
// ============================================

export {
  buildNetworkGraph,
  getAirDensity,
  calculateReynoldsNumber,
  calculateFrictionFactor,
  calculateDuctPressureDrop,
  getComponentResistance,
  solveNetwork,
  solveNetworkFast,
  DEFAULT_CONFIG,
};

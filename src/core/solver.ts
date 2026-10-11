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
// - Constant air density (1.225 kg/m³)
// - Ducts are cylindrical with circular cross-section
//
// Key Equations:
// -------------
//
// 1. Darcy-Weisbach: ΔP = f * (L/D) * (ρ/2) * v²
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
// 4. Bernoulli with losses: P₁/ρg + v₁²/2g + z₁ = P₂/ρg + v₂²/2g + z₂ + h_L
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
  FlowResult,
  DuctFlowResult,
  SimulationResult,
  SimulationConfig,
  AIR_DENSITY,
  VISCOSITY,
  getComponentConnections,
  getComponentSize,
  getOppositeDirection,
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
export function getAirDensity(tempC: number, altitude: number): number {
  const tempK = tempC + 273.15;
  // Barometric formula for pressure at altitude
  const pressure = STANDARD_PRESSURE * Math.exp(-altitude / 8500);
  return pressure / (GAS_CONSTANT_AIR * tempK);
}

// Calculate Reynolds number for a duct
export function calculateReynoldsNumber(
  velocity: number,
  diameter: number,
  density: number = AIR_DENSITY,
  viscosity: number = VISCOSITY
): number {
  return (density * velocity * diameter) / viscosity;
}

// Calculate friction factor for a duct
export function calculateFrictionFactor(reynolds: number): number {
  if (reynolds < 2000) {
    // Laminar flow
    return 64 / reynolds;
  } else if (reynolds < 4000) {
    // Transition flow - linear interpolation
    return 64 / 2000 + (0.0316 / Math.pow(4000, 0.25) - 64 / 2000) * (reynolds - 2000) / 2000;
  } else {
    // Turbulent flow - Colebrook approximation
    // Simplified: use 0.02 as a reasonable estimate for smooth ducts
    return 0.02;
  }
}

// Calculate pressure drop for a straight duct using Darcy-Weisbach
export function calculateDuctPressureDrop(
  flowRate: number,
  diameter: number,
  length: number,
  resistance: number,
  density: number = AIR_DENSITY
): number {
  const area = Math.PI * Math.pow(diameter / 2, 2);
  const velocity = flowRate / area;
  
  if (velocity === 0) return 0;
  
  const reynolds = calculateReynoldsNumber(velocity, diameter, density);
  const friction = calculateFrictionFactor(reynolds);
  
  // Darcy-Weisbach: ΔP = f * (L/D) * (ρ/2) * v²
  const pressureDrop = friction * (length / diameter) * (density / 2) * Math.pow(velocity, 2);
  
  // Add component-specific resistance
  return pressureDrop + resistance * flowRate * flowRate;
}

// Component-specific resistance calculations
export function getComponentResistance(
  component: Component,
  flowRate: number,
  density: number = AIR_DENSITY
): number {
  const props = component.properties;
  const diameter = props.diameter || 1.0;
  const length = getComponentSize(component).x; // Using x-dimension as length
  const baseResistance = props.resistance || 0;
  
  switch (component.type) {
    case 'straight':
      return baseResistance + calculateDuctPressureDrop(flowRate, diameter, length, 0, density) / Math.max(flowRate, 1e-10);
    
    case 'corner':
      // 90-degree bend: add loss coefficient (typically 0.3-0.5 for 90° bend)
      const bendLoss = 0.4 * (density / 2) * Math.pow(flowRate / (Math.PI * Math.pow(diameter / 2, 2)), 2);
      return baseResistance + bendLoss / Math.max(flowRate, 1e-10);
    
    case 't_junction':
      // T-junction: add loss coefficient for branching
      return baseResistance * 1.5; // 50% more resistance for branching
    
    case 'cross':
      return baseResistance * 2.0; // 100% more resistance for cross
    
    case 'valve':
      if (!props.open) return Infinity; // Closed valve = infinite resistance
      const openFactor = props.openPercentage / 100;
      return baseResistance / Math.pow(openFactor, 2); // Resistance inversely proportional to open area
    
    case 'inlet':
    case 'outlet':
      return baseResistance;
    
    case 'fan':
      if (!props.enabled) return Infinity;
      // Fan adds negative resistance (boosts flow)
      return -props.pressureBoost / Math.max(flowRate, 1e-10);
    
    default:
      return baseResistance;
  }
}

// ============================================
// NETWORK GRAPH CONSTRUCTION
// ============================================

interface NetworkNode {
  id: string;
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

export function buildNetworkGraph(
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
  
  // Create edges for external connections
  for (const conn of connections) {
    const fromNodeId = `${conn.from.id}:${conn.from.index}`;
    const toNodeId = `${conn.to.id}:${conn.to.index}`;
    
    const edgeId = `${fromNodeId}->${toNodeId}`;
    
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
      resistance: 0.01,
      length: 0.1,
      diameter,
      flowRate: 0,
      pressureDrop: 0,
    });
    
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
 */
export function solveNetwork(
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
      
      if (fromComponent) {
        resistance += getComponentResistance(fromComponent, Math.abs(edge.flowRate), density) * 0.5;
      }
      if (toComponent) {
        resistance += getComponentResistance(toComponent, Math.abs(edge.flowRate), density) * 0.5;
      }
      
      // Calculate flow rate: Q = ΔP / R
      const newFlowRate = pressureDiff / Math.max(resistance, 1e-10);
      
      // Dampen the change for stability
      const change = newFlowRate - edge.flowRate;
      edge.flowRate += change * 0.5;
      
      // Calculate pressure drop
      edge.pressureDrop = newFlowRate * Math.max(resistance, 1e-10);
      
      maxChange = Math.max(maxChange, Math.abs(change));
    }
    
    // Update node pressures based on flow conservation
    for (const node of nodes.values()) {
      if (node.isSource) continue;
      
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
      
      // For conservation of mass
      const netFlow = totalFlowIn - totalFlowOut;
      
      // Adjust pressure based on net flow
      const pressureChange = netFlow * 0.1;
      
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
  
  for (const [nodeId, node] of nodes) {
    resultNodes.set(nodeId, {
      nodeId,
      pressure: node.pressure,
      flowRate: Math.abs(node.flowRate),
      velocity: 0,
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
    
    const flowRate = edge.flowRate;
    const diameter = edge.diameter;
    const area = Math.PI * Math.pow(diameter / 2, 2);
    const velocity = flowRate / area;
    
    // Determine direction
    let direction = 0;
    if (flowRate > 0) {
      direction = fromNode.connectionIndex as any;
    } else if (flowRate < 0) {
      direction = toNode.connectionIndex as any;
    }
    
    resultDucts.push({
      fromNode: edge.fromNodeId,
      toNode: edge.toNodeId,
      flowRate: Math.abs(flowRate),
      velocity: Math.abs(velocity),
      pressureDrop: Math.abs(edge.pressureDrop),
      direction: direction as any,
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

// ============================================
// SIMPLIFIED SOLVER (for real-time gameplay)
// ============================================

/**
 * A simplified, faster solver for real-time simulation.
 */
export function solveNetworkFast(
  components: Map<string, Component>,
  connections: Connection[]
): SimulationResult {
  return solveNetwork(components, connections, {
    maxIterations: 100,
    tolerance: 1e-4,
  });
}

export {
  buildNetworkGraph,
  getAirDensity,
  calculateReynoldsNumber,
  calculateFrictionFactor,
  calculateDuctPressureDrop,
  getComponentResistance,
  DEFAULT_CONFIG,
};

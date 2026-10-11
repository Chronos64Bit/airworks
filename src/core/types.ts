// ============================================
// AIRWORKS - Core Type Definitions
// ============================================

// ============================================
// GRID AND POSITION TYPES
// ============================================

export interface Vector2 {
  x: number;
  y: number;
}

export interface GridPosition extends Vector2 {
  x: number;
  y: number;
}

// ============================================
// COMPONENT DIRECTION AND ROTATION
// ============================================

export type Direction = 0 | 1 | 2 | 3; // 0=Right, 1=Down, 2=Left, 3=Up
export type Rotation = 0 | 1 | 2 | 3; // 0=0°, 1=90°, 2=180°, 3=270°

export const DIRECTIONS: Direction[] = [0, 1, 2, 3];
export const DIRECTION_VECTORS: Record<Direction, Vector2> = {
  0: { x: 1, y: 0 },  // Right
  1: { x: 0, y: 1 },  // Down
  2: { x: -1, y: 0 }, // Left
  3: { x: 0, y: -1 }, // Up
};

export const OPPOSITE_DIRECTION: Record<Direction, Direction> = {
  0: 2,
  1: 3,
  2: 0,
  3: 1,
};

export function rotateDirection(dir: Direction, rotation: Rotation): Direction {
  return ((dir + rotation) % 4) as Direction;
}

export function getOppositeDirection(dir: Direction): Direction {
  return OPPOSITE_DIRECTION[dir];
}

// ============================================
// COMPONENT TYPES
// ============================================

export type ComponentType = 
  | 'straight'
  | 'corner'
  | 't_junction'
  | 'cross'
  | 'inlet'
  | 'outlet'
  | 'fan'
  | 'valve';

// Connection points on a component (max 4 for our 2D grid system)
export type ConnectionIndex = 0 | 1 | 2 | 3;

export interface ComponentConnection {
  index: ConnectionIndex;
  direction: Direction;
  position: Vector2; // Relative position from component center
}

export interface ComponentDefinition {
  type: ComponentType;
  name: string;
  description: string;
  size: Vector2; // Grid size (width, height)
  connections: ComponentConnection[];
  defaultProperties: Record<string, any>;
  color: string;
  icon: string;
}

export const COMPONENT_DEFINITIONS: Record<ComponentType, ComponentDefinition> = {
  straight: {
    type: 'straight',
    name: 'Straight Duct',
    description: 'Connects two opposite sides',
    size: { x: 1, y: 1 },
    connections: [
      { index: 0, direction: 0, position: { x: 0.5, y: 0 } },  // Right
      { index: 1, direction: 2, position: { x: -0.5, y: 0 } }, // Left
    ],
    defaultProperties: {
      resistance: 0.1,
      diameter: 1.0,
    },
    color: '#4A90D9',
    icon: '⟋',
  },
  corner: {
    type: 'corner',
    name: 'Corner Duct',
    description: '90-degree bend',
    size: { x: 1, y: 1 },
    connections: [
      { index: 0, direction: 0, position: { x: 0.5, y: 0 } },  // Right
      { index: 1, direction: 3, position: { x: 0, y: -0.5 } }, // Up
    ],
    defaultProperties: {
      resistance: 0.15,
      diameter: 1.0,
      bendAngle: 90,
    },
    color: '#4A90D9',
    icon: '⟋',
  },
  t_junction: {
    type: 't_junction',
    name: 'T-Junction',
    description: 'Three-way connection',
    size: { x: 1, y: 1 },
    connections: [
      { index: 0, direction: 0, position: { x: 0.5, y: 0 } },   // Right
      { index: 1, direction: 2, position: { x: -0.5, y: 0 } },  // Left
      { index: 2, direction: 3, position: { x: 0, y: -0.5 } },  // Up
    ],
    defaultProperties: {
      resistance: 0.1,
      diameter: 1.0,
    },
    color: '#4A90D9',
    icon: 'T',
  },
  cross: {
    type: 'cross',
    name: 'Cross Junction',
    description: 'Four-way connection',
    size: { x: 1, y: 1 },
    connections: [
      { index: 0, direction: 0, position: { x: 0.5, y: 0 } },   // Right
      { index: 1, direction: 2, position: { x: -0.5, y: 0 } },  // Left
      { index: 2, direction: 1, position: { x: 0, y: 0.5 } },   // Down
      { index: 3, direction: 3, position: { x: 0, y: -0.5 } },  // Up
    ],
    defaultProperties: {
      resistance: 0.05,
      diameter: 1.0,
    },
    color: '#4A90D9',
    icon: '+',
  },
  inlet: {
    type: 'inlet',
    name: 'Air Inlet',
    description: 'Air source',
    size: { x: 1, y: 1 },
    connections: [
      { index: 0, direction: 0, position: { x: 0.5, y: 0 } },  // Right (output)
    ],
    defaultProperties: {
      pressure: 100.0,
      flowRate: 10.0,
      enabled: true,
    },
    color: '#5CB85C',
    icon: '→',
  },
  outlet: {
    type: 'outlet',
    name: 'Air Outlet',
    description: 'Air exhaust',
    size: { x: 1, y: 1 },
    connections: [
      { index: 0, direction: 2, position: { x: -0.5, y: 0 } }, // Left (input)
    ],
    defaultProperties: {
      resistance: 0.0,
      diameter: 1.0,
    },
    color: '#D9534F',
    icon: '←',
  },
  fan: {
    type: 'fan',
    name: 'Fan',
    description: 'Boosts airflow',
    size: { x: 1, y: 1 },
    connections: [
      { index: 0, direction: 0, position: { x: 0.5, y: 0 } },  // Right (output)
      { index: 1, direction: 2, position: { x: -0.5, y: 0 } }, // Left (input)
    ],
    defaultProperties: {
      pressureBoost: 50.0,
      flowRate: 15.0,
      enabled: true,
      efficiency: 0.8,
    },
    color: '#F0AD4E',
    icon: 'F',
  },
  valve: {
    type: 'valve',
    name: 'Valve',
    description: 'Controls flow',
    size: { x: 1, y: 1 },
    connections: [
      { index: 0, direction: 0, position: { x: 0.5, y: 0 } },  // Right
      { index: 1, direction: 2, position: { x: -0.5, y: 0 } }, // Left
    ],
    defaultProperties: {
      resistance: 0.5,
      diameter: 1.0,
      open: true,
      openPercentage: 100,
    },
    color: '#5BC0DE',
    icon: 'V',
  },
};

// ============================================
// COMPONENT INSTANCE
// ============================================

export interface ComponentId {
  id: string;
}

export interface Component extends ComponentId {
  type: ComponentType;
  position: GridPosition;
  rotation: Rotation;
  properties: Record<string, any>;
}

// ============================================
// CONNECTION AND NETWORK TYPES
// ============================================

export interface Connection {
  from: ComponentId & { index: ConnectionIndex };
  to: ComponentId & { index: ConnectionIndex };
}

export interface Network {
  components: Map<string, Component>;
  connections: Connection[];
}

// ============================================
// SIMULATION TYPES
// ============================================

// Physical model constants
export const AIR_DENSITY = 1.225; // kg/m³ at sea level
export const VISCOSITY = 1.789e-5; // Dynamic viscosity of air (Pa·s)

// Simplified flow model using Darcy-Weisbach approximation
export interface FlowResult {
  nodeId: string;
  pressure: number; // Pressure at this node (Pa)
  flowRate: number; // Volume flow rate (m³/s)
  velocity: number; // Flow velocity (m/s)
  connected: boolean; // Whether this node is connected to a source
}

export interface DuctFlowResult {
  fromNode: string;
  toNode: string;
  flowRate: number; // Volume flow rate through this duct (m³/s)
  velocity: number; // Flow velocity (m/s)
  pressureDrop: number; // Pressure drop across this duct (Pa)
  direction: Direction; // Flow direction
}

export interface SimulationResult {
  nodes: Map<string, FlowResult>;
  ducts: DuctFlowResult[];
  totalFlowRate: number;
  hasErrors: boolean;
  errors: string[];
  iterationCount: number;
}

export interface SimulationConfig {
  maxIterations: number;
  tolerance: number;
  temperature: number; // °C
  altitude: number; // meters
}

// ============================================
// PARTICLE SYSTEM TYPES
// ============================================

export interface Particle {
  id: number;
  position: Vector2; // World position
  velocity: Vector2;
  path: Vector2[]; // Path history for visualization
  age: number;
  maxAge: number;
  size: number;
  color: string;
}

export interface ParticleSystemConfig {
  particleCount: number;
  spawnRate: number;
  maxAge: number;
  particleSize: number;
  colors: string[];
}

// ============================================
// GAME STATE TYPES
// ============================================

export type SimulationState = 'stopped' | 'running' | 'paused';

export interface GameState {
  components: Map<string, Component>;
  connections: Connection[];
  simulationState: SimulationState;
  simulationResult: SimulationResult | null;
  selectedComponentId: string | null;
  hoverComponentId: string | null;
  placementComponent: Component | null;
  placementValid: boolean;
  gridSize: Vector2;
  zoom: number;
  panOffset: Vector2;
  history: GameStateHistory;
}

export interface GameStateHistory {
  past: GameState[];
  future: GameState[];
}

// ============================================
// SAVE/LOAD TYPES
// ============================================

export const SAVE_FORMAT_VERSION = 1;

export interface SaveData {
  version: number;
  timestamp: string;
  name: string;
  components: Component[];
  connections: Connection[];
  gridSize: Vector2;
  zoom: number;
  panOffset: Vector2;
}

export interface SavedProject {
  metadata: {
    version: number;
    timestamp: string;
    name: string;
    airworksVersion: string;
  };
  data: SaveData;
}

// ============================================
// UI TYPES
// ============================================

export interface ToolbarItem {
  type: ComponentType;
  label: string;
  icon: string;
  color: string;
}

export interface StatusInfo {
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  timestamp: number;
}

// ============================================
// UTILITY TYPES
// ============================================

export function generateId(): string {
  return Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
}

export function createComponent(type: ComponentType, position: GridPosition): Component {
  const def = COMPONENT_DEFINITIONS[type];
  return {
    id: generateId(),
    type,
    position: { ...position },
    rotation: 0,
    properties: { ...def.defaultProperties },
  };
}

export function getComponentConnections(component: Component): ComponentConnection[] {
  const def = COMPONENT_DEFINITIONS[component.type];
  return def.connections.map(conn => ({
    ...conn,
    direction: rotateDirection(conn.direction, component.rotation),
  }));
}

export function getComponentSize(component: Component): Vector2 {
  return COMPONENT_DEFINITIONS[component.type].size;
}

export function getComponentWorldBounds(component: Component): { min: Vector2; max: Vector2 } {
  const size = getComponentSize(component);
  const halfWidth = size.x / 2;
  const halfHeight = size.y / 2;
  
  return {
    min: { x: component.position.x - halfWidth, y: component.position.y - halfHeight },
    max: { x: component.position.x + halfWidth, y: component.position.y + halfHeight },
  };
}

export function areComponentsOverlapping(a: Component, b: Component): boolean {
  const aBounds = getComponentWorldBounds(a);
  const bBounds = getComponentWorldBounds(b);
  
  return !(
    aBounds.max.x < bBounds.min.x ||
    aBounds.min.x > bBounds.max.x ||
    aBounds.max.y < bBounds.min.y ||
    aBounds.min.y > bBounds.max.y
  );
}

export function canConnect(a: Component, aIndex: ConnectionIndex, b: Component, bIndex: ConnectionIndex): boolean {
  const aConns = getComponentConnections(a);
  const bConns = getComponentConnections(b);
  
  const aConn = aConns[aIndex];
  const bConn = bConns[bIndex];
  
  if (!aConn || !bConn) return false;
  
  // Check if directions are opposite
  return getOppositeDirection(aConn.direction) === bConn.direction;
}

export function getConnectionPosition(component: Component, index: ConnectionIndex): Vector2 {
  const conns = getComponentConnections(component);
  const conn = conns[index];
  if (!conn) return component.position;
  
  return {
    x: component.position.x + conn.position.x,
    y: component.position.y + conn.position.y,
  };
}

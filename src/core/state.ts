// ============================================
// AIRWORKS - Game State Management
// ============================================

import {
  Component,
  Connection,
  ComponentType,
  GameState,
  GameStateHistory,
  SimulationState,
  Vector2,
  createComponent,
  generateId,
} from './types';
import { solveNetworkFast, SimulationResult } from './solver';

// ============================================
// INITIAL STATE
// ============================================

const INITIAL_GRID_SIZE: Vector2 = { x: 20, y: 20 };
const INITIAL_ZOOM = 1.0;
const INITIAL_PAN: Vector2 = { x: 0, y: 0 };

export function createInitialState(): GameState {
  return {
    components: new Map(),
    connections: [],
    simulationState: 'stopped',
    simulationResult: null,
    selectedComponentId: null,
    hoverComponentId: null,
    placementComponent: null,
    placementValid: true,
    gridSize: { ...INITIAL_GRID_SIZE },
    zoom: INITIAL_ZOOM,
    panOffset: { ...INITIAL_PAN },
    history: {
      past: [],
      future: [],
    },
  };
}

// ============================================
// STATE UPDATES
// ============================================

// Component placement
export function placeComponent(
  state: GameState,
  componentType: ComponentType,
  position: Vector2
): GameState {
  const newComponent = createComponent(componentType, position);
  
  const newComponents = new Map(state.components);
  newComponents.set(newComponent.id, newComponent);
  
  return {
    ...state,
    components: newComponents,
    selectedComponentId: newComponent.id,
    placementComponent: null,
    placementValid: true,
    history: pushToHistory(state.history, state),
  };
}

// Component selection
export function selectComponent(state: GameState, componentId: string | null): GameState {
  return {
    ...state,
    selectedComponentId: componentId,
  };
}

// Component hover
export function hoverComponent(state: GameState, componentId: string | null): GameState {
  return {
    ...state,
    hoverComponentId: componentId,
  };
}

// Component deletion
export function deleteComponent(state: GameState, componentId: string): GameState {
  if (!state.components.has(componentId)) return state;
  
  const newComponents = new Map(state.components);
  newComponents.delete(componentId);
  
  // Remove connections involving this component
  const newConnections = state.connections.filter(
    conn => conn.from.id !== componentId && conn.to.id !== componentId
  );
  
  // Clear selection if deleted component was selected
  const newSelectedId = state.selectedComponentId === componentId 
    ? null 
    : state.selectedComponentId;
  
  return {
    ...state,
    components: newComponents,
    connections: newConnections,
    selectedComponentId: newSelectedId,
    history: pushToHistory(state.history, state),
  };
}

// Component movement
export function moveComponent(
  state: GameState,
  componentId: string,
  newPosition: Vector2
): GameState {
  if (!state.components.has(componentId)) return state;
  
  const component = state.components.get(componentId)!;
  const newComponent: Component = {
    ...component,
    position: { ...newPosition },
  };
  
  const newComponents = new Map(state.components);
  newComponents.set(componentId, newComponent);
  
  return {
    ...state,
    components: newComponents,
    history: pushToHistory(state.history, state),
  };
}

// Component rotation
export function rotateComponent(state: GameState, componentId: string): GameState {
  if (!state.components.has(componentId)) return state;
  
  const component = state.components.get(componentId)!;
  const newRotation = ((component.rotation + 1) % 4) as any;
  
  const newComponent: Component = {
    ...component,
    rotation: newRotation,
  };
  
  const newComponents = new Map(state.components);
  newComponents.set(componentId, newComponent);
  
  return {
    ...state,
    components: newComponents,
    history: pushToHistory(state.history, state),
  };
}

// Component property update
export function updateComponentProperty(
  state: GameState,
  componentId: string,
  property: string,
  value: any
): GameState {
  if (!state.components.has(componentId)) return state;
  
  const component = state.components.get(componentId)!;
  const newComponent: Component = {
    ...component,
    properties: {
      ...component.properties,
      [property]: value,
    },
  };
  
  const newComponents = new Map(state.components);
  newComponents.set(componentId, newComponent);
  
  return {
    ...state,
    components: newComponents,
  };
}

// Connection creation
export function createConnection(
  state: GameState,
  from: { id: string; index: number },
  to: { id: string; index: number }
): GameState {
  // Check if connection already exists
  const connectionExists = state.connections.some(
    conn => 
      (conn.from.id === from.id && conn.fromIndex === from.index &&
       conn.to.id === to.id && conn.toIndex === to.index) ||
      (conn.from.id === to.id && conn.fromIndex === to.index &&
       conn.to.id === from.id && conn.toIndex === from.index)
  );
  
  if (connectionExists) return state;
  
  const newConnection: Connection = {
    from: { id: from.id, index: from.index as any },
    to: { id: to.id, index: to.index as any },
  };
  
  const newConnections = [...state.connections, newConnection];
  
  return {
    ...state,
    connections: newConnections,
    history: pushToHistory(state.history, state),
  };
}

// Connection removal
export function removeConnection(
  state: GameState,
  connection: Connection
): GameState {
  const newConnections = state.connections.filter(
    conn => 
      !(conn.from.id === connection.from.id && 
        conn.fromIndex === connection.fromIndex &&
        conn.to.id === connection.to.id &&
        conn.toIndex === connection.toIndex)
  );
  
  return {
    ...state,
    connections: newConnections,
    history: pushToHistory(state.history, state),
  };
}

// ============================================
// SIMULATION CONTROLS
// ============================================

// Start simulation
export function startSimulation(state: GameState): GameState {
  if (state.simulationState === 'running') return state;
  
  const result = solveNetworkFast(state.components, state.connections);
  
  return {
    ...state,
    simulationState: 'running',
    simulationResult: result,
  };
}

// Pause simulation
export function pauseSimulation(state: GameState): GameState {
  if (state.simulationState !== 'running') return state;
  
  return {
    ...state,
    simulationState: 'paused',
  };
}

// Reset simulation
export function resetSimulation(state: GameState): GameState {
  return {
    ...state,
    simulationState: 'stopped',
    simulationResult: null,
  };
}

// Step simulation (single frame)
export function stepSimulation(state: GameState): GameState {
  if (state.simulationState === 'running') return state;
  
  const result = solveNetworkFast(state.components, state.connections);
  
  return {
    ...state,
    simulationResult: result,
  };
}

// ============================================
// CAMERA CONTROLS
// ============================================

// Set zoom
export function setZoom(state: GameState, zoom: number): GameState {
  return {
    ...state,
    zoom: Math.max(0.1, Math.min(zoom, 10)),
  };
}

// Set pan offset
export function setPanOffset(state: GameState, offset: Vector2): GameState {
  return {
    ...state,
    panOffset: { ...offset },
  };
}

// Adjust zoom
export function adjustZoom(state: GameState, delta: number): GameState {
  return setZoom(state, state.zoom + delta);
}

// Adjust pan
export function adjustPan(state: GameState, delta: Vector2): GameState {
  return setPanOffset(state, {
    x: state.panOffset.x + delta.x,
    y: state.panOffset.y + delta.y,
  });
}

// Reset camera
export function resetCamera(state: GameState): GameState {
  return {
    ...state,
    zoom: INITIAL_ZOOM,
    panOffset: { ...INITIAL_PAN },
  };
}

// ============================================
// PLACEMENT PREVIEW
// ============================================

// Set placement component
export function setPlacementComponent(
  state: GameState,
  componentType: ComponentType | null,
  position: Vector2 | null
): GameState {
  if (!componentType || !position) {
    return {
      ...state,
      placementComponent: null,
      placementValid: true,
    };
  }
  
  const placementComponent = createComponent(componentType, position);
  
  // Check validity
  const placementValid = !Array.from(state.components.values()).some(
    existing => {
      return existing.position.x === position.x && existing.position.y === position.y;
    }
  );
  
  return {
    ...state,
    placementComponent,
    placementValid,
  };
}

// Update placement position
export function updatePlacementPosition(
  state: GameState,
  position: Vector2
): GameState {
  if (!state.placementComponent) {
    return state;
  }
  
  const placementComponent = {
    ...state.placementComponent,
    position: { ...position },
  };
  
  // Check validity
  const placementValid = !Array.from(state.components.values()).some(
    existing => {
      return existing.position.x === position.x && existing.position.y === position.y;
    }
  );
  
  return {
    ...state,
    placementComponent,
    placementValid,
  };
}

// ============================================
// HISTORY MANAGEMENT
// ============================================

const MAX_HISTORY = 100;

function pushToHistory(history: GameStateHistory, state: GameState): GameStateHistory {
  const newPast = [...history.past, { ...state }];
  
  // Limit history size
  if (newPast.length > MAX_HISTORY) {
    newPast.shift();
  }
  
  return {
    past: newPast,
    future: [], // Clear redo stack on new action
  };
}

// Undo
export function undo(state: GameState): GameState {
  if (state.history.past.length === 0) return state;
  
  const lastState = state.history.past[state.history.past.length - 1];
  const newPast = state.history.past.slice(0, -1);
  const newFuture = [state, ...state.history.future];
  
  return {
    ...lastState,
    history: {
      past: newPast,
      future: newFuture,
    },
  };
}

// Redo
export function redo(state: GameState): GameState {
  if (state.history.future.length === 0) return state;
  
  const nextState = state.history.future[0];
  const newFuture = state.history.future.slice(1);
  const newPast = [...state.history.past, state];
  
  return {
    ...nextState,
    history: {
      past: newPast,
      future: newFuture,
    },
  };
}

// ============================================
// SAVE/LOAD
// ============================================

import { SaveData, SAVE_FORMAT_VERSION } from './types';

export function saveState(state: GameState, name: string = 'Untitled'): SaveData {
  return {
    version: SAVE_FORMAT_VERSION,
    timestamp: new Date().toISOString(),
    name,
    components: Array.from(state.components.values()),
    connections: state.connections,
    gridSize: state.gridSize,
    zoom: state.zoom,
    panOffset: state.panOffset,
  };
}

export function loadState(saveData: SaveData): GameState {
  const components = new Map<string, Component>();
  for (const component of saveData.components) {
    components.set(component.id, { ...component });
  }
  
  return {
    components,
    connections: saveData.connections || [],
    simulationState: 'stopped',
    simulationResult: null,
    selectedComponentId: null,
    hoverComponentId: null,
    placementComponent: null,
    placementValid: true,
    gridSize: saveData.gridSize || { ...INITIAL_GRID_SIZE },
    zoom: saveData.zoom || INITIAL_ZOOM,
    panOffset: saveData.panOffset || { ...INITIAL_PAN },
    history: {
      past: [],
      future: [],
    },
  };
}

// ============================================
// SELECTORS
// ============================================

export function getComponent(state: GameState, id: string) {
  return state.components.get(id);
}

export function getConnectionsForComponent(state: GameState, componentId: string) {
  return state.connections.filter(
    conn => conn.from.id === componentId || conn.to.id === componentId
  );
}

export function hasSources(state: GameState): boolean {
  return Array.from(state.components.values()).some(
    c => c.type === 'inlet' || c.type === 'fan'
  );
}

export function hasOutlets(state: GameState): boolean {
  return Array.from(state.components.values()).some(
    c => c.type === 'outlet'
  );
}

export {
  INITIAL_GRID_SIZE,
  INITIAL_ZOOM,
  INITIAL_PAN,
};

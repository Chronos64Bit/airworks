// ============================================
// AIRWORKS - Game State Hook
// ============================================

import { useReducer, useCallback } from 'react';
import {
  GameState,
  ComponentType,
  Component,
  Connection,
  Vector2,
  SimulationState,
  createInitialState,
  placeComponent,
  selectComponent,
  hoverComponent,
  deleteComponent,
  moveComponent,
  rotateComponent,
  updateComponentProperty,
  createConnection,
  removeConnection,
  startSimulation,
  pauseSimulation,
  resetSimulation,
  setZoom,
  setPanOffset,
  adjustZoom,
  adjustPan,
  resetCamera,
  setPlacementComponent,
  updatePlacementPosition,
  undo,
  redo,
  saveState,
  loadState,
  getComponent,
  getConnectionsForComponent,
  hasSources,
  hasOutlets,
  SaveData,
} from '../core/state';

// ============================================
// ACTION TYPES
// ============================================

type Action =
  | { type: 'PLACE_COMPONENT'; payload: { componentType: ComponentType; position: Vector2 } }
  | { type: 'SELECT_COMPONENT'; payload: string | null }
  | { type: 'HOVER_COMPONENT'; payload: string | null }
  | { type: 'DELETE_COMPONENT'; payload: string }
  | { type: 'MOVE_COMPONENT'; payload: { componentId: string; position: Vector2 } }
  | { type: 'ROTATE_COMPONENT'; payload: string }
  | { type: 'UPDATE_PROPERTY'; payload: { componentId: string; property: string; value: any } }
  | { type: 'CREATE_CONNECTION'; payload: { from: { id: string; index: number }; to: { id: string; index: number } } }
  | { type: 'REMOVE_CONNECTION'; payload: Connection }
  | { type: 'START_SIMULATION' }
  | { type: 'PAUSE_SIMULATION' }
  | { type: 'RESET_SIMULATION' }
  | { type: 'SET_ZOOM'; payload: number }
  | { type: 'SET_PAN'; payload: Vector2 }
  | { type: 'ADJUST_ZOOM'; payload: number }
  | { type: 'ADJUST_PAN'; payload: Vector2 }
  | { type: 'RESET_CAMERA' }
  | { type: 'SET_PLACEMENT'; payload: { componentType: ComponentType | null; position: Vector2 | null } }
  | { type: 'UPDATE_PLACEMENT_POSITION'; payload: Vector2 }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'LOAD_STATE'; payload: SaveData }
  | { type: 'RESET' };

// ============================================
// REDUCER
// ============================================

function gameStateReducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'PLACE_COMPONENT':
      return placeComponent(state, action.payload.componentType, action.payload.position);
    
    case 'SELECT_COMPONENT':
      return selectComponent(state, action.payload);
    
    case 'HOVER_COMPONENT':
      return hoverComponent(state, action.payload);
    
    case 'DELETE_COMPONENT':
      return deleteComponent(state, action.payload);
    
    case 'MOVE_COMPONENT':
      return moveComponent(state, action.payload.componentId, action.payload.position);
    
    case 'ROTATE_COMPONENT':
      return rotateComponent(state, action.payload);
    
    case 'UPDATE_PROPERTY':
      return updateComponentProperty(state, action.payload.componentId, action.payload.property, action.payload.value);
    
    case 'CREATE_CONNECTION':
      return createConnection(state, action.payload.from, action.payload.to);
    
    case 'REMOVE_CONNECTION':
      return removeConnection(state, action.payload);
    
    case 'START_SIMULATION':
      return startSimulation(state);
    
    case 'PAUSE_SIMULATION':
      return pauseSimulation(state);
    
    case 'RESET_SIMULATION':
      return resetSimulation(state);
    
    case 'SET_ZOOM':
      return setZoom(state, action.payload);
    
    case 'SET_PAN':
      return setPanOffset(state, action.payload);
    
    case 'ADJUST_ZOOM':
      return adjustZoom(state, action.payload);
    
    case 'ADJUST_PAN':
      return adjustPan(state, action.payload);
    
    case 'RESET_CAMERA':
      return resetCamera(state);
    
    case 'SET_PLACEMENT':
      return setPlacementComponent(state, action.payload.componentType, action.payload.position);
    
    case 'UPDATE_PLACEMENT_POSITION':
      return updatePlacementPosition(state, action.payload);
    
    case 'UNDO':
      return undo(state);
    
    case 'REDO':
      return redo(state);
    
    case 'LOAD_STATE':
      return loadState(action.payload);
    
    case 'RESET':
      return createInitialState();
    
    default:
      return state;
  }
}

// ============================================
// HOOK IMPLEMENTATION
// ============================================

export function useGameState() {
  const [state, dispatch] = useReducer(gameStateReducer, createInitialState());
  
  // ============================================
  // ACTION DISPATCHERS
  // ============================================
  
  const placeComponent = useCallback((componentType: ComponentType, position: Vector2) => {
    dispatch({ type: 'PLACE_COMPONENT', payload: { componentType, position } });
  }, []);
  
  const selectComponent = useCallback((componentId: string | null) => {
    dispatch({ type: 'SELECT_COMPONENT', payload: componentId });
  }, []);
  
  const hoverComponent = useCallback((componentId: string | null) => {
    dispatch({ type: 'HOVER_COMPONENT', payload: componentId });
  }, []);
  
  const deleteSelectedComponent = useCallback(() => {
    if (state.selectedComponentId) {
      dispatch({ type: 'DELETE_COMPONENT', payload: state.selectedComponentId });
    }
  }, [state.selectedComponentId]);
  
  const deleteComponent = useCallback((componentId: string) => {
    dispatch({ type: 'DELETE_COMPONENT', payload: componentId });
  }, []);
  
  const moveComponent = useCallback((componentId: string, position: Vector2) => {
    dispatch({ type: 'MOVE_COMPONENT', payload: { componentId, position } });
  }, []);
  
  const rotateSelectedComponent = useCallback(() => {
    if (state.selectedComponentId) {
      dispatch({ type: 'ROTATE_COMPONENT', payload: state.selectedComponentId });
    }
  }, [state.selectedComponentId]);
  
  const rotateComponent = useCallback((componentId: string) => {
    dispatch({ type: 'ROTATE_COMPONENT', payload: componentId });
  }, []);
  
  const updateComponentProperty = useCallback((componentId: string, property: string, value: any) => {
    dispatch({ type: 'UPDATE_PROPERTY', payload: { componentId, property, value } });
  }, []);
  
  const createConnection = useCallback((from: { id: string; index: number }, to: { id: string; index: number }) => {
    dispatch({ type: 'CREATE_CONNECTION', payload: { from, to } });
  }, []);
  
  const removeConnection = useCallback((connection: Connection) => {
    dispatch({ type: 'REMOVE_CONNECTION', payload: connection });
  }, []);
  
  const startSimulation = useCallback(() => {
    dispatch({ type: 'START_SIMULATION' });
  }, []);
  
  const pauseSimulation = useCallback(() => {
    dispatch({ type: 'PAUSE_SIMULATION' });
  }, []);
  
  const resetSimulation = useCallback(() => {
    dispatch({ type: 'RESET_SIMULATION' });
  }, []);
  
  const stepSimulation = useCallback(() => {
    dispatch({ type: 'STEP_SIMULATION' });
  }, []);
  
  const setZoom = useCallback((zoom: number) => {
    dispatch({ type: 'SET_ZOOM', payload: zoom });
  }, []);
  
  const setPanOffset = useCallback((offset: Vector2) => {
    dispatch({ type: 'SET_PAN', payload: offset });
  }, []);
  
  const adjustZoom = useCallback((delta: number) => {
    dispatch({ type: 'ADJUST_ZOOM', payload: delta });
  }, []);
  
  const adjustPan = useCallback((delta: Vector2) => {
    dispatch({ type: 'ADJUST_PAN', payload: delta });
  }, []);
  
  const resetCamera = useCallback(() => {
    dispatch({ type: 'RESET_CAMERA' });
  }, []);
  
  const setPlacementComponent = useCallback((componentType: ComponentType | null, position: Vector2 | null) => {
    dispatch({ type: 'SET_PLACEMENT', payload: { componentType, position } });
  }, []);
  
  const updatePlacementPosition = useCallback((position: Vector2) => {
    dispatch({ type: 'UPDATE_PLACEMENT_POSITION', payload: position });
  }, []);
  
  const undo = useCallback(() => {
    dispatch({ type: 'UNDO' });
  }, []);
  
  const redo = useCallback(() => {
    dispatch({ type: 'REDO' });
  }, []);
  
  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);
  
  const loadState = useCallback((saveData: SaveData) => {
    dispatch({ type: 'LOAD_STATE', payload: saveData });
  }, []);
  
  const saveGameState = useCallback((name: string = 'Untitled') => {
    return {
      version: 1,
      timestamp: new Date().toISOString(),
      name,
      components: Array.from(state.components.values()),
      connections: state.connections,
      gridSize: state.gridSize,
      zoom: state.zoom,
      panOffset: state.panOffset,
    };
  }, [state]);
  
  // ============================================
  // UTILITY FUNCTIONS
  // ============================================
  
  const getComponentAtPosition = useCallback((
    worldPos: Vector2,
    tolerance: number = 0.5
  ): Component | null => {
    for (const component of state.components.values()) {
      const size = { x: 1, y: 1 };
      const halfWidth = size.x / 2;
      const halfHeight = size.y / 2;
      
      const minX = component.position.x - halfWidth - tolerance;
      const maxX = component.position.x + halfWidth + tolerance;
      const minY = component.position.y - halfHeight - tolerance;
      const maxY = component.position.y + halfHeight + tolerance;
      
      if (
        worldPos.x >= minX && worldPos.x <= maxX &&
        worldPos.y >= minY && worldPos.y <= maxY
      ) {
        return component;
      }
    }
    return null;
  }, [state.components]);
  
  const getConnectionAtPosition = useCallback((
    worldPos: Vector2,
    tolerance: number = 0.2
  ): Connection | null => {
    for (const conn of state.connections) {
      const fromComponent = state.components.get(conn.from.id);
      const toComponent = state.components.get(conn.to.id);
      
      if (!fromComponent || !toComponent) continue;
      
      const fromConns = getConnectionsForComponent(state, fromComponent.id);
      const toConns = getConnectionsForComponent(state, toComponent.id);
      
      if (fromConns.length === 0 || toConns.length === 0) continue;
    }
    return null;
  }, [state.components, state.connections]);
  
  const getConnectionPointAtPosition = useCallback((
    worldPos: Vector2,
    tolerance: number = 0.2
  ): { componentId: string; index: number } | null => {
    for (const [componentId, component] of state.components) {
      const connections = getConnectionsForComponent(state, componentId);
      
      for (let i = 0; i < connections.length; i++) {
        const conn = connections[i];
        if (!conn) continue;
        
        const connWorld = {
          x: component.position.x + conn.position.x,
          y: component.position.y + conn.position.y,
        };
        
        const dx = worldPos.x - connWorld.x;
        const dy = worldPos.y - connWorld.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist <= tolerance) {
          return { componentId, index: i };
        }
      }
    }
    return null;
  }, [state.components, state.connections]);
  
  // ============================================
  // RETURN VALUE
  // ============================================
  
  return {
    state,
    placeComponent,
    selectComponent,
    hoverComponent,
    deleteComponent,
    deleteSelectedComponent,
    moveComponent,
    rotateComponent,
    rotateSelectedComponent,
    updateComponentProperty,
    createConnection,
    removeConnection,
    startSimulation,
    pauseSimulation,
    resetSimulation,
    stepSimulation,
    setZoom,
    setPanOffset,
    adjustZoom,
    adjustPan,
    resetCamera,
    setPlacementComponent,
    updatePlacementPosition,
    undo,
    redo,
    saveGameState,
    loadState,
    reset,
    getComponentAtPosition,
    getConnectionAtPosition,
    getConnectionPointAtPosition,
  };
}

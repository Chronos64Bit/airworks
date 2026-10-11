// ============================================
// AIRWORKS - State Management Tests
// ============================================

import { describe, it, expect, beforeEach } from 'vitest';
import {
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
  undo,
  redo,
  saveState,
  loadState,
  getComponent,
  getConnectionsForComponent,
  hasSources,
  hasOutlets,
  GameState,
} from '../core/state';
import { ComponentType, createComponent, Component } from '../core/types';

// ============================================
// INITIAL STATE TESTS
// ============================================

describe('Initial State', () => {
  it('should create empty initial state', () => {
    const state = createInitialState();
    
    expect(state.components.size).toBe(0);
    expect(state.connections.length).toBe(0);
    expect(state.simulationState).toBe('stopped');
    expect(state.simulationResult).toBeNull();
    expect(state.selectedComponentId).toBeNull();
    expect(state.hoverComponentId).toBeNull();
    expect(state.placementComponent).toBeNull();
    expect(state.placementValid).toBe(true);
    expect(state.zoom).toBe(1);
    expect(state.panOffset).toEqual({ x: 0, y: 0 });
    expect(state.history.past.length).toBe(0);
    expect(state.history.future.length).toBe(0);
  });

  it('should have default grid size', () => {
    const state = createInitialState();
    expect(state.gridSize).toEqual({ x: 20, y: 20 });
  });
});

// ============================================
// COMPONENT PLACEMENT TESTS
// ============================================

describe('Component Placement', () => {
  let state: GameState;

  beforeEach(() => {
    state = createInitialState();
  });

  it('should place component at specified position', () => {
    const newState = placeComponent(state, 'straight', { x: 5, y: 5 });
    
    expect(newState.components.size).toBe(1);
    
    const component = newState.components.values().next().value;
    expect(component.position).toEqual({ x: 5, y: 5 });
    expect(component.type).toBe('straight');
  });

  it('should select placed component', () => {
    const newState = placeComponent(state, 'straight', { x: 5, y: 5 });
    
    expect(newState.selectedComponentId).not.toBeNull();
    expect(newState.components.get(newState.selectedComponentId!)).toBeDefined();
  });

  it('should add to history on placement', () => {
    const newState = placeComponent(state, 'straight', { x: 5, y: 5 });
    
    expect(newState.history.past.length).toBe(1);
    expect(newState.history.future.length).toBe(0);
  });

  it('should clear placement component after placement', () => {
    const newState = placeComponent(state, 'straight', { x: 5, y: 5 });
    
    expect(newState.placementComponent).toBeNull();
  });

  it('should create multiple components', () => {
    let newState = placeComponent(state, 'straight', { x: 0, y: 0 });
    newState = placeComponent(newState, 'corner', { x: 1, y: 0 });
    newState = placeComponent(newState, 'inlet', { x: 2, y: 0 });
    
    expect(newState.components.size).toBe(3);
  });
});

// ============================================
// COMPONENT SELECTION TESTS
// ============================================

describe('Component Selection', () => {
  let state: GameState;
  let component: Component;

  beforeEach(() => {
    state = createInitialState();
    component = createComponent('straight', { x: 0, y: 0 });
    state.components.set(component.id, component);
  });

  it('should select component by ID', () => {
    const newState = selectComponent(state, component.id);
    
    expect(newState.selectedComponentId).toBe(component.id);
  });

  it('should clear selection with null', () => {
    const selectedState = selectComponent(state, component.id);
    const newState = selectComponent(selectedState, null);
    
    expect(newState.selectedComponentId).toBeNull();
  });

  it('should not modify other state on selection', () => {
    const newState = selectComponent(state, component.id);
    
    expect(newState.components.size).toBe(1);
    expect(newState.connections.length).toBe(0);
  });
});

// ============================================
// COMPONENT HOVER TESTS
// ============================================

describe('Component Hover', () => {
  let state: GameState;
  let component: Component;

  beforeEach(() => {
    state = createInitialState();
    component = createComponent('straight', { x: 0, y: 0 });
    state.components.set(component.id, component);
  });

  it('should set hover component ID', () => {
    const newState = hoverComponent(state, component.id);
    
    expect(newState.hoverComponentId).toBe(component.id);
  });

  it('should clear hover with null', () => {
    const hoveredState = hoverComponent(state, component.id);
    const newState = hoverComponent(hoveredState, null);
    
    expect(newState.hoverComponentId).toBeNull();
  });
});

// ============================================
// COMPONENT DELETION TESTS
// ============================================

describe('Component Deletion', () => {
  let state: GameState;
  let component1: Component;
  let component2: Component;

  beforeEach(() => {
    state = createInitialState();
    component1 = createComponent('straight', { x: 0, y: 0 });
    component2 = createComponent('corner', { x: 1, y: 0 });
    state.components.set(component1.id, component1);
    state.components.set(component2.id, component2);
    
    // Create a connection
    state.connections.push({
      from: { id: component1.id, index: 0 },
      to: { id: component2.id, index: 0 },
    });
  });

  it('should delete component by ID', () => {
    const newState = deleteComponent(state, component1.id);
    
    expect(newState.components.size).toBe(1);
    expect(newState.components.has(component1.id)).toBe(false);
    expect(newState.components.has(component2.id)).toBe(true);
  });

  it('should remove connections involving deleted component', () => {
    const newState = deleteComponent(state, component1.id);
    
    expect(newState.connections.length).toBe(0);
  });

  it('should clear selection if deleted component was selected', () => {
    state.selectedComponentId = component1.id;
    const newState = deleteComponent(state, component1.id);
    
    expect(newState.selectedComponentId).toBeNull();
  });

  it('should add to history on deletion', () => {
    const newState = deleteComponent(state, component1.id);
    
    expect(newState.history.past.length).toBe(1);
  });

  it('should not modify state if component does not exist', () => {
    const newState = deleteComponent(state, 'non-existent-id');
    
    expect(newState.components.size).toBe(2);
    expect(newState.connections.length).toBe(1);
  });
});

// ============================================
// COMPONENT MOVEMENT TESTS
// ============================================

describe('Component Movement', () => {
  let state: GameState;
  let component: Component;

  beforeEach(() => {
    state = createInitialState();
    component = createComponent('straight', { x: 0, y: 0 });
    state.components.set(component.id, component);
  });

  it('should move component to new position', () => {
    const newState = moveComponent(state, component.id, { x: 5, y: 5 });
    
    const movedComponent = newState.components.get(component.id)!;
    expect(movedComponent.position).toEqual({ x: 5, y: 5 });
  });

  it('should add to history on movement', () => {
    const newState = moveComponent(state, component.id, { x: 5, y: 5 });
    
    expect(newState.history.past.length).toBe(1);
  });

  it('should not modify state if component does not exist', () => {
    const newState = moveComponent(state, 'non-existent-id', { x: 5, y: 5 });
    
    expect(newState.components.get(component.id)!.position).toEqual({ x: 0, y: 0 });
  });
});

// ============================================
// COMPONENT ROTATION TESTS
// ============================================

describe('Component Rotation', () => {
  let state: GameState;
  let component: Component;

  beforeEach(() => {
    state = createInitialState();
    component = createComponent('straight', { x: 0, y: 0 });
    state.components.set(component.id, component);
  });

  it('should rotate component clockwise', () => {
    let newState = rotateComponent(state, component.id);
    expect(newState.components.get(component.id)!.rotation).toBe(1);
    
    newState = rotateComponent(newState, component.id);
    expect(newState.components.get(component.id)!.rotation).toBe(2);
    
    newState = rotateComponent(newState, component.id);
    expect(newState.components.get(component.id)!.rotation).toBe(3);
    
    newState = rotateComponent(newState, component.id);
    expect(newState.components.get(component.id)!.rotation).toBe(0);
  });

  it('should add to history on rotation', () => {
    const newState = rotateComponent(state, component.id);
    
    expect(newState.history.past.length).toBe(1);
  });
});

// ============================================
// COMPONENT PROPERTY UPDATE TESTS
// ============================================

describe('Component Property Update', () => {
  let state: GameState;
  let component: Component;

  beforeEach(() => {
    state = createInitialState();
    component = createComponent('valve', { x: 0, y: 0 });
    state.components.set(component.id, component);
  });

  it('should update component property', () => {
    const newState = updateComponentProperty(state, component.id, 'open', false);
    
    const updatedComponent = newState.components.get(component.id)!;
    expect(updatedComponent.properties.open).toBe(false);
  });

  it('should add new property if not existing', () => {
    const newState = updateComponentProperty(state, component.id, 'newProperty', 'value');
    
    const updatedComponent = newState.components.get(component.id)!;
    expect(updatedComponent.properties.newProperty).toBe('value');
  });

  it('should not modify state if component does not exist', () => {
    const newState = updateComponentProperty(state, 'non-existent-id', 'open', false);
    
    expect(newState.components.get(component.id)!.properties.open).toBe(true);
  });
});

// ============================================
// CONNECTION TESTS
// ============================================

describe('Connections', () => {
  let state: GameState;
  let component1: Component;
  let component2: Component;

  beforeEach(() => {
    state = createInitialState();
    component1 = createComponent('straight', { x: 0, y: 0 });
    component2 = createComponent('straight', { x: 1, y: 0 });
    state.components.set(component1.id, component1);
    state.components.set(component2.id, component2);
  });

  it('should create connection between components', () => {
    const newState = createConnection(state, 
      { id: component1.id, index: 0 },
      { id: component2.id, index: 1 }
    );
    
    expect(newState.connections.length).toBe(1);
    expect(newState.connections[0].from.id).toBe(component1.id);
    expect(newState.connections[0].from.index).toBe(0);
    expect(newState.connections[0].to.id).toBe(component2.id);
    expect(newState.connections[0].to.index).toBe(1);
  });

  it('should not create duplicate connections', () => {
    let newState = createConnection(state, 
      { id: component1.id, index: 0 },
      { id: component2.id, index: 1 }
    );
    
    newState = createConnection(newState, 
      { id: component1.id, index: 0 },
      { id: component2.id, index: 1 }
    );
    
    expect(newState.connections.length).toBe(1);
  });

  it('should remove connection', () => {
    const connection = {
      from: { id: component1.id, index: 0 },
      to: { id: component2.id, index: 1 },
    };
    
    let newState = createConnection(state, 
      { id: component1.id, index: 0 },
      { id: component2.id, index: 1 }
    );
    
    newState = removeConnection(newState, connection);
    
    expect(newState.connections.length).toBe(0);
  });

  it('should add to history on connection creation', () => {
    const newState = createConnection(state, 
      { id: component1.id, index: 0 },
      { id: component2.id, index: 1 }
    );
    
    expect(newState.history.past.length).toBe(1);
  });
});

// ============================================
// SIMULATION CONTROL TESTS
// ============================================

describe('Simulation Controls', () => {
  let state: GameState;

  beforeEach(() => {
    state = createInitialState();
  });

  it('should start simulation', () => {
    const newState = startSimulation(state);
    
    expect(newState.simulationState).toBe('running');
    expect(newState.simulationResult).not.toBeNull();
  });

  it('should not start already running simulation', () => {
    state.simulationState = 'running';
    const newState = startSimulation(state);
    
    expect(newState.simulationState).toBe('running');
  });

  it('should pause simulation', () => {
    state.simulationState = 'running';
    const newState = pauseSimulation(state);
    
    expect(newState.simulationState).toBe('paused');
  });

  it('should not pause non-running simulation', () => {
    const newState = pauseSimulation(state);
    
    expect(newState.simulationState).toBe('stopped');
  });

  it('should reset simulation', () => {
    state.simulationState = 'running';
    state.simulationResult = {} as any;
    
    const newState = resetSimulation(state);
    
    expect(newState.simulationState).toBe('stopped');
    expect(newState.simulationResult).toBeNull();
  });
});

// ============================================
// HISTORY TESTS
// ============================================

describe('History Management', () => {
  let state: GameState;

  beforeEach(() => {
    state = createInitialState();
  });

  it('should undo last action', () => {
    state = placeComponent(state, 'straight', { x: 0, y: 0 });
    expect(state.components.size).toBe(1);
    
    const newState = undo(state);
    expect(newState.components.size).toBe(0);
  });

  it('should not undo if history is empty', () => {
    const newState = undo(state);
    expect(newState.components.size).toBe(0);
  });

  it('should redo undone action', () => {
    state = placeComponent(state, 'straight', { x: 0, y: 0 });
    state = undo(state);
    expect(state.components.size).toBe(0);
    
    const newState = redo(state);
    expect(newState.components.size).toBe(1);
  });

  it('should not redo if future is empty', () => {
    const newState = redo(state);
    expect(newState.components.size).toBe(0);
  });

  it('should clear redo stack on new action', () => {
    state = placeComponent(state, 'straight', { x: 0, y: 0 });
    state = undo(state);
    
    // Future should have the undone state
    expect(state.history.future.length).toBe(1);
    
    // New action should clear future
    state = placeComponent(state, 'corner', { x: 1, y: 0 });
    expect(state.history.future.length).toBe(0);
  });

  it('should limit history size', () => {
    // Add more than MAX_HISTORY actions
    for (let i = 0; i < 150; i++) {
      state = placeComponent(state, 'straight', { x: i, y: 0 });
    }
    
    // History should be capped at MAX_HISTORY (100)
    expect(state.history.past.length).toBeLessThanOrEqual(100);
  });
});

// ============================================
// SAVE/LOAD TESTS
// ============================================

describe('Save/Load', () => {
  let state: GameState;

  beforeEach(() => {
    state = createInitialState();
    state = placeComponent(state, 'straight', { x: 0, y: 0 });
    state = placeComponent(state, 'inlet', { x: 1, y: 0 });
  });

  it('should save state', () => {
    const saveData = saveState(state, 'Test Save');
    
    expect(saveData.version).toBe(1);
    expect(saveData.name).toBe('Test Save');
    expect(saveData.components.length).toBe(2);
    expect(saveData.connections.length).toBe(0);
  });

  it('should load state', () => {
    const saveData = saveState(state, 'Test Save');
    
    const newState = loadState(saveData);
    
    expect(newState.components.size).toBe(2);
    expect(newState.simulationState).toBe('stopped');
    expect(newState.simulationResult).toBeNull();
  });

  it('should preserve component properties on save/load', () => {
    // Update a component property
    const component = Array.from(state.components.values()).next().value;
    state = updateComponentProperty(state, component.id, 'resistance', 0.5);
    
    const saveData = saveState(state, 'Test Save');
    const newState = loadState(saveData);
    
    const loadedComponent = newState.components.get(component.id)!;
    expect(loadedComponent.properties.resistance).toBe(0.5);
  });
});

// ============================================
// SELECTOR TESTS
// ============================================

describe('Selectors', () => {
  let state: GameState;
  let component1: Component;
  let component2: Component;

  beforeEach(() => {
    state = createInitialState();
    component1 = createComponent('inlet', { x: 0, y: 0 });
    component2 = createComponent('outlet', { x: 1, y: 0 });
    state.components.set(component1.id, component1);
    state.components.set(component2.id, component2);
  });

  it('should get component by ID', () => {
    const retrieved = getComponent(state, component1.id);
    expect(retrieved).toEqual(component1);
  });

  it('should return undefined for non-existent component', () => {
    const retrieved = getComponent(state, 'non-existent-id');
    expect(retrieved).toBeUndefined();
  });

  it('should get connections for component', () => {
    state.connections.push({
      from: { id: component1.id, index: 0 },
      to: { id: component2.id, index: 0 },
    });
    
    const connections = getConnectionsForComponent(state, component1.id);
    expect(connections.length).toBe(1);
  });

  it('should check if network has sources', () => {
    expect(hasSources(state)).toBe(true);
    
    state.components.clear();
    state.components.set(component2.id, component2);
    expect(hasSources(state)).toBe(false);
  });

  it('should check if network has outlets', () => {
    expect(hasOutlets(state)).toBe(true);
    
    state.components.clear();
    state.components.set(component1.id, component1);
    expect(hasOutlets(state)).toBe(false);
  });
});

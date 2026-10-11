// ============================================
// AIRWORKS - Canvas Renderer
// ============================================

import {
  Component,
  Connection,
  Vector2,
  GridPosition,
  getComponentConnections,
  getComponentSize,
  DIRECTION_VECTORS,
  COMPONENT_DEFINITIONS,
} from './types';

// ============================================
// RENDERER CONSTANTS
// ============================================

export const GRID_CELL_SIZE = 60; // pixels
const LINE_WIDTH = 2;
const SELECTION_LINE_WIDTH = 3;
const COMPONENT_PADDING = 4;
const CONNECTION_INDICATOR_SIZE = 8;

// Colors
export const COLORS = {
  background: '#0D1117',
  grid: '#161B22',
  gridLine: '#21262D',
  gridCenter: '#30363D',
  
  duct: '#4A90D9',
  ductHover: '#58A6FF',
  ductSelected: '#79C0FF',
  ductInvalid: '#F85149',
  
  inlet: '#5CB85C',
  inletHover: '#6BC963',
  inletSelected: '#82E079',
  
  outlet: '#D9534F',
  outletHover: '#E36259',
  outletSelected: '#FF7B72',
  
  fan: '#F0AD4E',
  fanHover: '#F7C357',
  fanSelected: '#FFD379',
  
  valve: '#5BC0DE',
  valveHover: '#6DC8E2',
  valveSelected: '#85E2F5',
  
  particle: '#79C0FF',
  particleFast: '#58A6FF',
  particleSlow: '#4A90D9',
  
  text: '#E6EDF3',
  textSecondary: '#8B949E',
  textError: '#F85149',
  
  connected: '#5CB85C',
  disconnected: '#F85149',
  
  selection: '#79C0FF',
  selectionFill: 'rgba(121, 192, 255, 0.1)',
  
  placementValid: '#5CB85C',
  placementInvalid: '#F85149',
};

// ============================================
// CANVAS UTILITIES
// ============================================

export function gridToWorld(grid: GridPosition): Vector2 {
  return {
    x: grid.x * GRID_CELL_SIZE,
    y: grid.y * GRID_CELL_SIZE,
  };
}

export function worldToScreen(
  world: Vector2,
  zoom: number,
  panOffset: Vector2,
  canvasWidth: number,
  canvasHeight: number
): Vector2 {
  const centerX = canvasWidth / 2;
  const centerY = canvasHeight / 2;
  
  return {
    x: (world.x - panOffset.x) * zoom + centerX,
    y: (world.y - panOffset.y) * zoom + centerY,
  };
}

export function screenToWorld(
  screen: Vector2,
  zoom: number,
  panOffset: Vector2,
  canvasWidth: number,
  canvasHeight: number
): Vector2 {
  const centerX = canvasWidth / 2;
  const centerY = canvasHeight / 2;
  
  return {
    x: (screen.x - centerX) / zoom + panOffset.x,
    y: (screen.y - centerY) / zoom + panOffset.y,
  };
}

export function worldToGrid(world: Vector2): GridPosition {
  return {
    x: Math.floor(world.x / GRID_CELL_SIZE + 0.5),
    y: Math.floor(world.y / GRID_CELL_SIZE + 0.5),
  };
}

export function snapToGrid(world: Vector2): Vector2 {
  const grid = worldToGrid(world);
  return gridToWorld(grid);
}

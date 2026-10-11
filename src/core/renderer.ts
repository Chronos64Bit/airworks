// ============================================
// AIRWORKS - Canvas Renderer
// ============================================

import {
  Component,
  Connection,
  Vector2,
  GridPosition,
  ComponentType,
  FlowResult,
  SimulationResult,
  SimulationState,
  CanvasContext as CanvasContextType,
  getComponentConnections,
  getComponentSize,
  getConnectionPosition,
  COMPONENT_DEFINITIONS,
} from './types';

// ============================================
// CONSTANTS
// ============================================

const GRID_CELL_SIZE = 60; // pixels
const GRID_LINE_WIDTH = 1;
const GRID_LINE_COLOR = '#2a2a2a';
const COMPONENT_LINE_WIDTH = 2;
const SELECTION_INDICATOR_SIZE = 8;
const CONNECTION_LINE_WIDTH = 2;
const FLOW_INDICATOR_SIZE = 4;

const COLORS = {
  // Background
  background: '#121212',
  canvasBackground: '#1a1a1a',
  
  // Grid
  gridPrimary: '#2a2a2a',
  gridSecondary: '#1e1e1e',
  
  // Components
  componentBase: '#4a4a4a',
  componentHighlight: '#6a6a6a',
  componentSelected: '#0078d4',
  componentHover: '#00bcf2',
  componentInvalid: '#d32f2f',
  
  // Component type colors
  straight: '#648dae',
  corner: '#648dae',
  t_junction: '#648dae',
  cross: '#648dae',
  inlet: '#4caf50',
  outlet: '#f44336',
  fan: '#2196f3',
  valve: '#ff9800',
  
  // Connections
  connection: '#888888',
  connectionActive: '#00bcf2',
  connectionInvalid: '#d32f2f',
  connectionHighlight: '#ffeb3b',
  
  // Flow visualization
  flowParticle: '#00bcf2',
  flowParticleFast: '#40c9f7',
  flowParticleSlow: '#0069c0',
  
  // UI
  textPrimary: '#e0e0e0',
  textSecondary: '#a0a0a0',
  textDisabled: '#606060',
  
  // Status
  statusOk: '#4caf50',
  statusWarning: '#ff9800',
  statusError: '#f44336',
  
  // Toolbar
  toolbarBackground: '#1e1e1e',
  toolbarButton: '#333333',
  toolbarButtonHover: '#444444',
  toolbarButtonActive: '#0078d4',
  
  // Property panel
  panelBackground: '#1e1e1e',
  panelBorder: '#333333',
  
  // Simulation
  simulationRunning: '#4caf50',
  simulationPaused: '#ff9800',
  simulationStopped: '#f44336',
};

// ============================================
// INTERFACES
// ============================================

interface CanvasContext extends CanvasContextType {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  zoom: number;
  panOffset: Vector2;
  gridSize: Vector2;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

// ============================================
// COORDINATE TRANSFORMATIONS
// ============================================

function gridToWorld(grid: GridPosition): Vector2 {
  return {
    x: grid.x * GRID_CELL_SIZE + GRID_CELL_SIZE / 2,
    y: grid.y * GRID_CELL_SIZE + GRID_CELL_SIZE / 2,
  };
}

function worldToScreen(
  world: Vector2,
  zoom: number = 1,
  panOffset: Vector2 = { x: 0, y: 0 }
): Vector2 {
  return {
    x: (world.x - panOffset.x) * zoom,
    y: (world.y - panOffset.y) * zoom,
  };
}

function screenToWorld(
  screen: Vector2,
  zoom: number = 1,
  panOffset: Vector2 = { x: 0, y: 0 }
): Vector2 {
  return {
    x: screen.x / zoom + panOffset.x,
    y: screen.y / zoom + panOffset.y,
  };
}

function worldToGrid(world: Vector2): GridPosition {
  return {
    x: Math.floor(world.x / GRID_CELL_SIZE),
    y: Math.floor(world.y / GRID_CELL_SIZE),
  };
}

function snapToGrid(world: Vector2): Vector2 {
  const grid = worldToGrid(world);
  return gridToWorld(grid);
}

// ============================================
// RENDERING UTILITIES
// ============================================

function getComponentColor(component: Component): string {
  return COMPONENT_DEFINITIONS[component.type]?.color || COLORS.componentBase;
}

function getFlowColor(flowRate: number, maxFlowRate: number): string {
  if (maxFlowRate <= 0) return COLORS.flowParticle;
  
  const normalized = flowRate / maxFlowRate;
  
  if (normalized > 0.7) return COLORS.flowParticleFast;
  if (normalized > 0.3) return COLORS.flowParticle;
  return COLORS.flowParticleSlow;
}

// ============================================
// GRID RENDERING
// ============================================

function renderGrid(ctx: CanvasRenderingContext2D, canvasContext: CanvasContext): void {
  const { canvas, zoom, panOffset } = canvasContext;
  
  ctx.save();
  ctx.strokeStyle = GRID_LINE_COLOR;
  ctx.lineWidth = GRID_LINE_WIDTH / zoom;
  
  // Calculate visible area
  const startX = Math.floor(panOffset.x / GRID_CELL_SIZE);
  const startY = Math.floor(panOffset.y / GRID_CELL_SIZE);
  const endX = Math.ceil((panOffset.x + canvas.width / zoom) / GRID_CELL_SIZE);
  const endY = Math.ceil((panOffset.y + canvas.height / zoom) / GRID_CELL_SIZE);
  
  // Draw vertical lines
  for (let x = startX; x <= endX; x++) {
    const worldX = x * GRID_CELL_SIZE;
    const screenX = (worldX - panOffset.x) * zoom;
    
    ctx.beginPath();
    ctx.moveTo(screenX, 0);
    ctx.lineTo(screenX, canvas.height);
    ctx.stroke();
  }
  
  // Draw horizontal lines
  for (let y = startY; y <= endY; y++) {
    const worldY = y * GRID_CELL_SIZE;
    const screenY = (worldY - panOffset.y) * zoom;
    
    ctx.beginPath();
    ctx.moveTo(0, screenY);
    ctx.lineTo(canvas.width, screenY);
    ctx.stroke();
  }
  
  ctx.restore();
}

// ============================================
// COMPONENT RENDERING
// ============================================

function renderComponentConnection(
  ctx: CanvasRenderingContext2D,
  component: Component,
  connectionIndex: number,
  canvasContext: CanvasContext
): void {
  const connections = getComponentConnections(component);
  const conn = connections[connectionIndex];
  const worldPos = getConnectionPosition(component, connectionIndex);
  const screenPos = worldToScreen(worldPos, canvasContext.zoom, canvasContext.panOffset);
  
  ctx.save();
  ctx.fillStyle = COLORS.connection;
  ctx.beginPath();
  ctx.arc(screenPos.x, screenPos.y, 4 / canvasContext.zoom, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function renderComponent(
  ctx: CanvasRenderingContext2D,
  component: Component,
  canvasContext: CanvasContext,
  isSelected: boolean = false,
  isHovered: boolean = false
): void {
  const worldPos = {
    x: component.position.x * GRID_CELL_SIZE + GRID_CELL_SIZE / 2,
    y: component.position.y * GRID_CELL_SIZE + GRID_CELL_SIZE / 2,
  };
  const screenPos = worldToScreen(worldPos, canvasContext.zoom, canvasContext.panOffset);
  const size = getComponentSize(component);
  const sizeX = size.x * GRID_CELL_SIZE;
  const sizeY = size.y * GRID_CELL_SIZE;
  
  const color = isSelected
    ? COLORS.componentSelected
    : isHovered
      ? COLORS.componentHover
      : getComponentColor(component);
  
  const lineWidth = COMPONENT_LINE_WIDTH / canvasContext.zoom;
  
  ctx.save();
  ctx.translate(screenPos.x, screenPos.y);
  ctx.rotate((component.rotation * Math.PI) / 2);
  
  // Draw component body
  ctx.fillStyle = color;
  ctx.strokeStyle = COLORS.componentBase;
  ctx.lineWidth = lineWidth;
  
  // Draw different shapes based on component type
  switch (component.type) {
    case 'straight':
      ctx.fillRect(-sizeX / 2, -sizeY / 6, sizeX, sizeY / 3);
      ctx.strokeRect(-sizeX / 2, -sizeY / 6, sizeX, sizeY / 3);
      break;
      
    case 'corner':
      ctx.beginPath();
      ctx.moveTo(-sizeX / 2, 0);
      ctx.lineTo(0, 0);
      ctx.lineTo(0, -sizeY / 2);
      ctx.lineWidth = sizeY / 3;
      ctx.stroke();
      break;
      
    case 't_junction':
      ctx.fillRect(-sizeX / 2, -sizeY / 6, sizeX, sizeY / 3);
      ctx.fillRect(-sizeY / 6, -sizeY / 2, sizeY / 3, sizeY);
      ctx.strokeRect(-sizeX / 2, -sizeY / 6, sizeX, sizeY / 3);
      ctx.strokeRect(-sizeY / 6, -sizeY / 2, sizeY / 3, sizeY);
      break;
      
    case 'cross':
      ctx.fillRect(-sizeX / 2, -sizeY / 6, sizeX, sizeY / 3);
      ctx.fillRect(-sizeY / 6, -sizeY / 2, sizeY / 3, sizeY);
      ctx.strokeRect(-sizeX / 2, -sizeY / 6, sizeX, sizeY / 3);
      ctx.strokeRect(-sizeY / 6, -sizeY / 2, sizeY / 3, sizeY);
      break;
      
    case 'inlet':
      ctx.beginPath();
      ctx.arc(0, 0, sizeX / 2, 0, Math.PI * 2);
      ctx.fill();
      
      for (let i = 0; i < 3; i++) {
        const angle = (i * Math.PI * 2) / 3;
        ctx.strokeStyle = COLORS.inlet;
        ctx.lineWidth = lineWidth * 2;
        ctx.beginPath();
        ctx.moveTo(Math.cos(angle) * sizeX / 4, Math.sin(angle) * sizeX / 4);
        ctx.lineTo(Math.cos(angle) * sizeX / 2, Math.sin(angle) * sizeX / 2);
        ctx.stroke();
      }
      break;
      
    case 'outlet':
      ctx.beginPath();
      ctx.arc(0, 0, sizeX / 2, 0, Math.PI * 2);
      ctx.fill();
      
      for (let i = 0; i < 4; i++) {
        const angle = (i * Math.PI) / 2;
        ctx.strokeStyle = COLORS.outlet;
        ctx.lineWidth = lineWidth;
        ctx.beginPath();
        ctx.moveTo(Math.cos(angle) * sizeX / 3, Math.sin(angle) * sizeX / 3);
        ctx.lineTo(Math.cos(angle) * sizeX / 2, Math.sin(angle) * sizeX / 2);
        ctx.stroke();
      }
      break;
      
    case 'fan':
      ctx.beginPath();
      ctx.arc(0, 0, sizeX / 2, 0, Math.PI * 2);
      ctx.fill();
      
      for (let i = 0; i < 4; i++) {
        const angle = (i * Math.PI) / 2 + Math.PI / 4;
        ctx.strokeStyle = COLORS.fan;
        ctx.lineWidth = lineWidth * 2;
        ctx.beginPath();
        ctx.moveTo(Math.cos(angle) * sizeX / 4, Math.sin(angle) * sizeX / 4);
        ctx.lineTo(Math.cos(angle) * sizeX / 2, Math.sin(angle) * sizeX / 2);
        ctx.stroke();
      }
      break;
      
    case 'valve':
      ctx.fillRect(-sizeX / 2, -sizeY / 6, sizeX, sizeY / 3);
      ctx.strokeRect(-sizeX / 2, -sizeY / 6, sizeX, sizeY / 3);
      
      if (component.properties.open !== false) {
        ctx.fillStyle = COLORS.valve;
        ctx.beginPath();
        ctx.arc(sizeX / 2, 0, sizeY / 4, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
      
    default:
      ctx.fillRect(-sizeX / 2, -sizeY / 6, sizeX, sizeY / 3);
      ctx.strokeRect(-sizeX / 2, -sizeY / 6, sizeX, sizeY / 3);
  }
  
  ctx.restore();
  
  const connections = getComponentConnections(component);
  for (let i = 0; i < connections.length; i++) {
    renderComponentConnection(ctx, component, i, canvasContext);
  }
}

// ============================================
// CONNECTION RENDERING
// ============================================

function renderConnection(
  ctx: CanvasRenderingContext2D,
  connection: Connection,
  components: Map<string, Component>,
  canvasContext: CanvasContext,
  isActive: boolean = false
): void {
  const fromComponent = components.get(connection.from.id);
  const toComponent = components.get(connection.to.id);
  
  if (!fromComponent || !toComponent) return;
  
  const fromWorldPos = getConnectionPosition(fromComponent, connection.from.index);
  const toWorldPos = getConnectionPosition(toComponent, connection.to.index);
  const fromScreenPos = worldToScreen(fromWorldPos, canvasContext.zoom, canvasContext.panOffset);
  const toScreenPos = worldToScreen(toWorldPos, canvasContext.zoom, canvasContext.panOffset);
  
  const color = isActive ? COLORS.connectionActive : COLORS.connection;
  const lineWidth = CONNECTION_LINE_WIDTH / canvasContext.zoom;
  
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';
  
  ctx.beginPath();
  ctx.moveTo(fromScreenPos.x, fromScreenPos.y);
  
  const midX = (fromScreenPos.x + toScreenPos.x) / 2;
  const midY = (fromScreenPos.y + toScreenPos.y) / 2;
  const controlX = midX + (toScreenPos.y - fromScreenPos.y) * 0.2;
  const controlY = midY + (fromScreenPos.x - toScreenPos.x) * 0.2;
  
  ctx.quadraticCurveTo(controlX, controlY, toScreenPos.x, toScreenPos.y);
  ctx.stroke();
  
  ctx.restore();
}

// ============================================
// FLOW INDICATORS
// ============================================

function renderFlowIndicators(
  ctx: CanvasRenderingContext2D,
  simulationResult: SimulationResult,
  components: Map<string, Component>,
  canvasContext: CanvasContext
): void {
  if (!simulationResult || !simulationResult.ducts) return;
  
  const maxFlowRate = Math.max(
    ...simulationResult.ducts.map(d => d.flowRate),
    1
  );
  
  for (const duct of simulationResult.ducts) {
    if (duct.flowRate === 0) continue;
    
    const fromParts = duct.fromNodeId.split(':');
    const toParts = duct.toNodeId.split(':');
    
    const fromComponent = components.get(fromParts[0]);
    const toComponent = components.get(toParts[0]);
    
    if (!fromComponent || !toComponent) continue;
    
    const fromWorldPos = getConnectionPosition(fromComponent, parseInt(fromParts[1]));
    const toWorldPos = getConnectionPosition(toComponent, parseInt(toParts[1]));
    const fromScreenPos = worldToScreen(fromWorldPos, canvasContext.zoom, canvasContext.panOffset);
    const toScreenPos = worldToScreen(toWorldPos, canvasContext.zoom, canvasContext.panOffset);
    
    const color = getFlowColor(duct.flowRate, maxFlowRate);
    const lineWidth = Math.max(1, duct.flowRate / maxFlowRate * 4) / canvasContext.zoom;
    
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    
    ctx.beginPath();
    ctx.moveTo(fromScreenPos.x, fromScreenPos.y);
    ctx.lineTo(toScreenPos.x, toScreenPos.y);
    ctx.stroke();
    
    ctx.restore();
  }
}

// ============================================
// SELECTION INDICATORS
// ============================================

function renderSelectionIndicators(
  ctx: CanvasRenderingContext2D,
  selectedComponentId: string | null,
  components: Map<string, Component>,
  canvasContext: CanvasContext
): void {
  if (!selectedComponentId) return;
  
  const component = components.get(selectedComponentId);
  if (!component) return;
  
  const worldPos = {
    x: component.position.x * GRID_CELL_SIZE + GRID_CELL_SIZE / 2,
    y: component.position.y * GRID_CELL_SIZE + GRID_CELL_SIZE / 2,
  };
  const screenPos = worldToScreen(worldPos, canvasContext.zoom, canvasContext.panOffset);
  const size = getComponentSize(component);
  const sizeX = size.x * GRID_CELL_SIZE;
  const sizeY = size.y * GRID_CELL_SIZE;
  
  ctx.save();
  ctx.strokeStyle = COLORS.componentSelected;
  ctx.lineWidth = SELECTION_INDICATOR_SIZE / canvasContext.zoom;
  ctx.setLineDash([5 / canvasContext.zoom, 5 / canvasContext.zoom]);
  
  ctx.translate(screenPos.x, screenPos.y);
  ctx.rotate((component.rotation * Math.PI) / 2);
  
  ctx.beginPath();
  ctx.rect(
    -sizeX / 2 - SELECTION_INDICATOR_SIZE / 2,
    -sizeY / 2 - SELECTION_INDICATOR_SIZE / 2,
    sizeX + SELECTION_INDICATOR_SIZE,
    sizeY + SELECTION_INDICATOR_SIZE
  );
  ctx.stroke();
  
  ctx.restore();
}

// ============================================
// PLACEMENT PREVIEW
// ============================================

function renderPlacementPreview(
  ctx: CanvasRenderingContext2D,
  component: Component | null,
  isValid: boolean,
  canvasContext: CanvasContext
): void {
  if (!component) return;
  
  const worldPos = {
    x: component.position.x * GRID_CELL_SIZE + GRID_CELL_SIZE / 2,
    y: component.position.y * GRID_CELL_SIZE + GRID_CELL_SIZE / 2,
  };
  const screenPos = worldToScreen(worldPos, canvasContext.zoom, canvasContext.panOffset);
  
  ctx.save();
  ctx.globalAlpha = 0.6;
  ctx.translate(screenPos.x, screenPos.y);
  ctx.rotate((component.rotation * Math.PI) / 2);
  
  const color = isValid ? COLORS.componentHighlight : COLORS.componentInvalid;
  const size = getComponentSize(component);
  const sizeX = size.x * GRID_CELL_SIZE;
  const sizeY = size.y * GRID_CELL_SIZE;
  
  ctx.fillStyle = color;
  ctx.fillRect(-sizeX / 2, -sizeY / 6, sizeX, sizeY / 3);
  
  ctx.restore();
}

// ============================================
// CANVAS RENDERER
// ============================================

class CanvasRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private particleSystem: ParticleSystem | null;
  private lastFrameTime: number;
  private animationFrameId: number | null;
  
  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.particleSystem = null;
    this.lastFrameTime = 0;
    this.animationFrameId = null;
  }
  
  render(state: {
    components: Map<string, Component>;
    connections: Connection[];
    simulationState: SimulationState;
    simulationResult: SimulationResult | null;
    selectedComponentId: string | null;
    hoverComponentId: string | null;
    placementComponent: Component | null;
    placementValid: boolean;
    zoom: number;
    panOffset: Vector2;
  }) {
    const width = this.canvas.width;
    const height = this.canvas.height;
    const canvasContext: CanvasContext = {
      canvas: this.canvas,
      ctx: this.ctx,
      zoom: state.zoom,
      panOffset: state.panOffset,
      gridSize: { x: 20, y: 20 },
    };
    
    // Clear canvas
    this.ctx.fillStyle = COLORS.canvasBackground;
    this.ctx.fillRect(0, 0, width, height);
    
    // Render grid
    renderGrid(this.ctx, canvasContext);
    
    // Render connections (behind components)
    for (const connection of state.connections) {
      renderConnection(
        this.ctx,
        connection,
        state.components,
        canvasContext,
        false
      );
    }
    
    // Render components
    for (const [id, component] of state.components) {
      const isSelected = state.selectedComponentId === id;
      const isHovered = state.hoverComponentId === id;
      
      renderComponent(this.ctx, component, canvasContext, isSelected, isHovered);
    }
    
    // Render flow indicators
    if (state.simulationResult) {
      renderFlowIndicators(
        this.ctx,
        state.simulationResult,
        state.components,
        canvasContext
      );
    }
    
    // Render selection indicators
    renderSelectionIndicators(
      this.ctx,
      state.selectedComponentId,
      state.components,
      canvasContext
    );
    
    // Render placement preview
    if (state.placementComponent) {
      renderPlacementPreview(
        this.ctx,
        state.placementComponent,
        state.placementValid,
        canvasContext
      );
    }
  }
  
  resize(width: number, height: number) {
    this.canvas.width = width * window.devicePixelRatio;
    this.canvas.height = height * window.devicePixelRatio;
    this.canvas.style.width = width + 'px';
    this.canvas.style.height = height + 'px';
    
    // Scale context for high DPI
    this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  }
  
  startAnimation() {
    if (this.animationFrameId) return;
    
    const animate = (timestamp: number) => {
      this.animationFrameId = requestAnimationFrame(animate);
    };
    
    this.animationFrameId = requestAnimationFrame(animate);
  }
  
  stopAnimation() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }
  
  clearParticles() {
    if (this.particleSystem) {
      this.particleSystem.clear();
    }
  }
}

class ParticleSystem {
  private particles: Particle[] = [];
  private maxParticles: number;
  
  constructor(maxParticles: number = 100) {
    this.maxParticles = maxParticles;
  }
  
  update(deltaTime: number) {
    this.particles = this.particles.filter(p => p.life < p.maxLife);
    
    for (const particle of this.particles) {
      particle.x += particle.vx * deltaTime * 60;
      particle.y += particle.vy * deltaTime * 60;
      particle.life += deltaTime * 60;
    }
  }
  
  addParticle(particle: Particle) {
    if (this.particles.length >= this.maxParticles) return;
    this.particles.push(particle);
  }
  
  render(ctx: CanvasRenderingContext2D, canvasContext: CanvasContext) {
    for (const particle of this.particles) {
      const screenPos = worldToScreen(
        { x: particle.x, y: particle.y },
        canvasContext.zoom,
        canvasContext.panOffset
      );
      
      ctx.save();
      ctx.fillStyle = particle.color;
      ctx.globalAlpha = 1 - particle.life / particle.maxLife;
      ctx.beginPath();
      ctx.arc(
        screenPos.x,
        screenPos.y,
        particle.size / canvasContext.zoom,
        0,
        Math.PI * 2
      );
      ctx.fill();
      ctx.restore();
    }
  }
  
  clear() {
    this.particles = [];
  }
}

// ============================================
// EXPORT
// ============================================

export {
  renderGrid,
  renderComponent,
  renderConnection,
  renderFlowIndicators,
  renderSelectionIndicators,
  renderPlacementPreview,
  worldToScreen,
  screenToWorld,
  worldToGrid,
  snapToGrid,
  gridToWorld,
  GRID_CELL_SIZE,
  COLORS,
  type CanvasContext,
  CanvasRenderer,
  ParticleSystem,
};

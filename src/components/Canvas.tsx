// ============================================
// AIRWORKS - Construction Canvas Component
// ============================================

import React, { useEffect, useRef, useCallback, useState } from 'react';
import {
  ComponentType,
  Vector2,
  Component,
  getComponentConnections,
  getComponentSize,
  snapToGrid,
  screenToWorld,
  worldToScreen,
  GRID_CELL_SIZE,
  COLORS,
} from '../core/renderer';
import { useGameState } from '../hooks/useGameState';

interface CanvasProps {
  width: number;
  height: number;
}

const CanvasComponent: React.FC<CanvasProps> = ({ width, height }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvasContext, setCanvasContext] = useState<{
    ctx: CanvasRenderingContext2D | null;
    dpr: number;
  }>({ ctx: null, dpr: 1 });

  const {
    state,
    placeComponent,
    selectComponent,
    hoverComponent,
    setPlacementComponent,
    getComponentAtPosition,
  } = useGameState();

  // Active placement component type
  const [activeComponentType, setActiveComponentType] = useState<ComponentType | null>(null);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext('2d')!;
    ctx.scale(dpr, dpr);
    
    setCanvasContext({ ctx, dpr });
  }, [width, height]);

  // Handle canvas click for placement
  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (!canvasRef.current || !activeComponentType) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const screenPos = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };

    const worldPos = screenToWorld(
      screenPos,
      state.zoom,
      state.panOffset,
      width,
      height
    );

    const gridPos = snapToGrid(worldPos);

    // Check if position is valid
    const componentAtPos = getComponentAtPosition(gridPos);
    
    if (!componentAtPos) {
      placeComponent(activeComponentType, gridPos);
      setActiveComponentType(null);
      setPlacementComponent(null, null);
    }
  }, [activeComponentType, width, height, state, getComponentAtPosition, placeComponent, setPlacementComponent]);

  // Handle canvas mouse move for hover
  const handleCanvasMouseMove = useCallback((e: React.MouseEvent) => {
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const screenPos = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };

    const worldPos = screenToWorld(
      screenPos,
      state.zoom,
      state.panOffset,
      width,
      height
    );

    const gridPos = snapToGrid(worldPos);
    const componentAtPos = getComponentAtPosition(gridPos);

    if (componentAtPos) {
      hoverComponent(componentAtPos.id);
    } else {
      hoverComponent(null);
    }

    // Update placement preview
    if (activeComponentType) {
      const componentAtGrid = getComponentAtPosition(gridPos);
      const valid = !componentAtGrid;
      setPlacementComponent(activeComponentType, gridPos);
    }
  }, [activeComponentType, width, height, state, getComponentAtPosition, hoverComponent, setPlacementComponent]);

  // Handle canvas wheel for zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    
    const deltaY = e.deltaY;
    const zoomFactor = deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.1, Math.min(state.zoom * zoomFactor, 10));

    // Calculate pan adjustment to zoom towards mouse
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const screenPos = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };

    const worldPos = screenToWorld(
      screenPos,
      state.zoom,
      state.panOffset,
      width,
      height
    );

    const newPanX = state.panOffset.x - (worldPos.x * (newZoom - state.zoom));
    const newPanY = state.panOffset.y - (worldPos.y * (newZoom - state.zoom));

    // These would be dispatched via the game state hook
    // For now, we'll handle this in the main App component
  }, [state, width, height]);

  // Render the canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvasContext.ctx;
    
    if (!canvas || !ctx) return;

    // Clear canvas
    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, width, height);

    // This is a simplified render - the full renderer would be more complex
    // For now, just show a placeholder
    ctx.fillStyle = '#161B22';
    ctx.fillRect(0, 0, width, height);

    // Draw grid
    ctx.strokeStyle = COLORS.gridLine;
    ctx.lineWidth = 1;

    const startGridX = Math.floor((-state.panOffset.x) / GRID_CELL_SIZE);
    const endGridX = Math.ceil((width / state.zoom - state.panOffset.x) / GRID_CELL_SIZE);
    const startGridY = Math.floor((-state.panOffset.y) / GRID_CELL_SIZE);
    const endGridY = Math.ceil((height / state.zoom - state.panOffset.y) / GRID_CELL_SIZE);

    ctx.beginPath();
    for (let x = startGridX; x <= endGridX; x++) {
      const screenX = (x * GRID_CELL_SIZE + state.panOffset.x) * state.zoom;
      ctx.moveTo(screenX, 0);
      ctx.lineTo(screenX, height);
    }
    for (let y = startGridY; y <= endGridY; y++) {
      const screenY = (y * GRID_CELL_SIZE + state.panOffset.y) * state.zoom;
      ctx.moveTo(0, screenY);
      ctx.lineTo(width, screenY);
    }
    ctx.stroke();

    // Draw components
    for (const [id, component] of state.components) {
      const screenPos = worldToScreen(
        { x: component.position.x * GRID_CELL_SIZE, y: component.position.y * GRID_CELL_SIZE },
        state.zoom,
        state.panOffset,
        width,
        height
      );

      const size = getComponentSize(component);
      const halfWidth = (size.x * GRID_CELL_SIZE) / 2;
      const halfHeight = (size.y * GRID_CELL_SIZE) / 2;

      // Draw component background
      ctx.fillStyle = state.selectedComponentId === id ? COLORS.ductSelected : COLORS.duct;
      ctx.fillRect(
        screenPos.x - halfWidth,
        screenPos.y - halfHeight,
        size.x * GRID_CELL_SIZE,
        size.y * GRID_CELL_SIZE
      );

      // Draw component icon
      const def = { icon: 'O', color: '#4A90D9' };
      ctx.fillStyle = def.color;
      ctx.font = `${GRID_CELL_SIZE * 0.6}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(def.icon, screenPos.x, screenPos.y);
    }

    // Draw connections
    for (const conn of state.connections) {
      const fromComponent = state.components.get(conn.from.id);
      const toComponent = state.components.get(conn.to.id);
      
      if (!fromComponent || !toComponent) continue;

      const fromConns = getComponentConnections(fromComponent);
      const toConns = getComponentConnections(toComponent);
      
      const fromConn = fromConns[conn.from.index];
      const toConn = toConns[conn.to.index];
      
      if (!fromConn || !toConn) continue;

      const fromScreen = worldToScreen(
        {
          x: fromComponent.position.x * GRID_CELL_SIZE + fromConn.position.x * GRID_CELL_SIZE,
          y: fromComponent.position.y * GRID_CELL_SIZE + fromConn.position.y * GRID_CELL_SIZE,
        },
        state.zoom,
        state.panOffset,
        width,
        height
      );

      const toScreen = worldToScreen(
        {
          x: toComponent.position.x * GRID_CELL_SIZE + toConn.position.x * GRID_CELL_SIZE,
          y: toComponent.position.y * GRID_CELL_SIZE + toConn.position.y * GRID_CELL_SIZE,
        },
        state.zoom,
        state.panOffset,
        width,
        height
      );

      ctx.strokeStyle = COLORS.duct;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(fromScreen.x, fromScreen.y);
      ctx.lineTo(toScreen.x, toScreen.y);
      ctx.stroke();
    }

    // Draw placement preview
    if (state.placementComponent) {
      const screenPos = worldToScreen(
        { x: state.placementComponent.position.x * GRID_CELL_SIZE, y: state.placementComponent.position.y * GRID_CELL_SIZE },
        state.zoom,
        state.panOffset,
        width,
        height
      );

      const size = getComponentSize(state.placementComponent);
      const halfWidth = (size.x * GRID_CELL_SIZE) / 2;
      const halfHeight = (size.y * GRID_CELL_SIZE) / 2;

      ctx.globalAlpha = 0.5;
      ctx.fillStyle = state.placementValid ? COLORS.placementValid : COLORS.placementInvalid;
      ctx.fillRect(
        screenPos.x - halfWidth,
        screenPos.y - halfHeight,
        size.x * GRID_CELL_SIZE,
        size.y * GRID_CELL_SIZE
      );
      ctx.globalAlpha = 1;
    }

    // Draw selection indicator
    if (state.selectedComponentId) {
      const component = state.components.get(state.selectedComponentId);
      if (component) {
        const screenPos = worldToScreen(
          { x: component.position.x * GRID_CELL_SIZE, y: component.position.y * GRID_CELL_SIZE },
          state.zoom,
          state.panOffset,
          width,
          height
        );

        const size = getComponentSize(component);
        const halfWidth = (size.x * GRID_CELL_SIZE) / 2 + 4;
        const halfHeight = (size.y * GRID_CELL_SIZE) / 2 + 4;

        ctx.strokeStyle = COLORS.selection;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.rect(
          screenPos.x - halfWidth,
          screenPos.y - halfHeight,
          size.x * GRID_CELL_SIZE + 8,
          size.y * GRID_CELL_SIZE + 8
        );
        ctx.stroke();
      }
    }
  }, [state, width, height, canvasContext, activeComponentType]);

  // Set active component type
  const setActiveComponent = useCallback((type: ComponentType | null) => {
    setActiveComponentType(type);
    if (type) {
      setPlacementComponent(type, null);
    } else {
      setPlacementComponent(null, null);
    }
  }, [setPlacementComponent]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        display: 'block',
        cursor: activeComponentType ? 'crosshair' : 'default',
        width: '100%',
        height: '100%',
      }}
      onClick={handleCanvasClick}
      onMouseMove={handleCanvasMouseMove}
      onWheel={handleWheel}
      onContextMenu={(e) => e.preventDefault()}
    />
  );
};

export default CanvasComponent;

// ============================================
// AIRWORKS - Construction Canvas Component
// ============================================

import React, { useEffect, useRef, useCallback } from 'react';
import { useGameState } from '../hooks/useGameState';
import { CanvasRenderer, worldToScreen, screenToWorld, snapToGrid, GRID_CELL_SIZE } from '../core/renderer';
import { ComponentType, Vector2, Component, getComponentConnections, getConnectionPosition } from '../core/types';

interface CanvasProps {
  width: number;
  height: number;
}

export const Canvas: React.FC<CanvasProps> = ({ width, height }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<CanvasRenderer | null>(null);
  
  const {
    state,
    placeComponent,
    selectComponent,
    hoverComponent,
    setPlacementComponent,
    updatePlacementPosition,
    handleCanvasMouseDown,
    handleCanvasMouseMove,
    handleCanvasMouseUp,
    handleCanvasWheel,
    handleCanvasDrag,
    handleKeyDown,
    getComponentAtPosition,
    getConnectionPointAtPosition,
  } = useGameState();
  
  // Active placement component type
  const [activeComponentType, setActiveComponentType] = React.useState<ComponentType | null>(null);
  
  // Initialize renderer
  useEffect(() => {
    if (canvasRef.current) {
      rendererRef.current = new CanvasRenderer(canvasRef.current);
      rendererRef.current.resize(width, height);
    }
    
    return () => {
      if (rendererRef.current) {
        rendererRef.current.stopAnimation();
        rendererRef.current = null;
      }
    };
  }, [width, height]);
  
  // Handle resize
  useEffect(() => {
    if (rendererRef.current) {
      rendererRef.current.resize(width, height);
    }
  }, [width, height]);
  
  // Render loop
  useEffect(() => {
    if (!rendererRef.current) return;
    
    const renderFrame = () => {
      if (rendererRef.current && canvasRef.current) {
        rendererRef.current.render({
          components: state.components,
          connections: state.connections,
          simulationState: state.simulationState,
          simulationResult: state.simulationResult,
          selectedComponentId: state.selectedComponentId,
          hoverComponentId: state.hoverComponentId,
          placementComponent: state.placementComponent,
          placementValid: state.placementValid,
          zoom: state.zoom,
          panOffset: state.panOffset,
        });
      }
      
      requestAnimationFrame(renderFrame);
    };
    
    renderFrame();
    
    return () => {
      // No cleanup needed for render loop
    };
  }, [state]);
  
  // Mouse event handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const screenPos = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
    
    // Check if we're placing a component
    if (activeComponentType) {
      const worldPos = screenToWorld(
        screenPos,
        state.zoom,
        state.panOffset
      );
      const gridPos = snapToGrid(worldPos);
      
      // Check if position is valid (no overlapping)
      const componentAtPos = getComponentAtPosition(gridPos);
      
      if (!componentAtPos) {
        placeComponent(activeComponentType, gridPos);
        setActiveComponentType(null);
      }
      return;
    }
    
    // Handle normal mouse down
    handleCanvasMouseDown(screenPos, width, height, state.zoom, state.panOffset);
  }, [activeComponentType, width, height, state, getComponentAtPosition, placeComponent, handleCanvasMouseDown]);
  
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const screenPos = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
    
    // Check for component hover
    const worldPos = screenToWorld(
      screenPos,
      state.zoom,
      state.panOffset
    );
    const componentAtPos = getComponentAtPosition(worldPos);
    if (componentAtPos) {
      hoverComponent(componentAtPos.id);
    } else {
      hoverComponent(null);
    }
    
    // Check for connection point hover
    const connectionPoint = getConnectionPointAtPosition(worldPos);
    
    // If placing a component, update placement position
    if (activeComponentType) {
      const gridPos = snapToGrid(worldPos);
      const componentAtGrid = getComponentAtPosition(gridPos);
      const valid = !componentAtGrid;
      
      setPlacementComponent(activeComponentType, gridPos);
      // validity is handled by state
    }
    
    handleCanvasMouseMove(screenPos, width, height, state.zoom, state.panOffset);
  }, [activeComponentType, width, height, state, getComponentAtPosition, getConnectionPointAtPosition, hoverComponent, handleCanvasMouseMove]);
  
  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const screenPos = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
    
    handleCanvasMouseUp(screenPos, width, height, state.zoom, state.panOffset);
  }, [width, height, state, handleCanvasMouseUp]);
  
  const handleWheel = useCallback((e: React.WheelEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const screenPos = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
    
    handleCanvasWheel(e.deltaY, screenPos, width, height, state.zoom, state.panOffset);
    e.preventDefault();
  }, [width, height, state, handleCanvasWheel]);
  
  // Keyboard events
  useEffect(() => {
    const handleKeyDownWrapper = (e: KeyboardEvent) => {
      handleKeyDown(e);
    };
    
    window.addEventListener('keydown', handleKeyDownWrapper);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDownWrapper);
    };
  }, [handleKeyDown]);
  
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
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
      }}
      onMouseLeave={() => hoverComponent(null)}
    >
      <canvas
        ref={canvasRef}
        style={{
          display: 'block',
          cursor: activeComponentType ? 'crosshair' : 'default',
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        onContextMenu={(e) => e.preventDefault()}
      />
      
      {/* Tooltip for placement */}
      {activeComponentType && (
        <div
          style={{
            position: 'absolute',
            bottom: 20,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(0, 0, 0, 0.8)',
            color: '#fff',
            padding: '8px 16px',
            borderRadius: 4,
            fontSize: 14,
            pointerEvents: 'none',
          }}
        >
          Placing: {activeComponentType}
          <span style={{ marginLeft: 8, color: '#888' }}>
            (Click to place, ESC to cancel)
          </span>
        </div>
      )}
    </div>
  );
};

export default Canvas;

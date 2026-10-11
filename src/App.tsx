// ============================================
// AIRWORKS - Main Application Component
// ============================================

import React, { useState, useCallback } from 'react';
import { useGameState } from './hooks/useGameState';
import { Canvas } from './components/Canvas';
import { Toolbar } from './components/Toolbar';
import { PropertyPanel } from './components/PropertyPanel';
import { SimulationControls } from './components/SimulationControls';
import { SaveLoadControls } from './components/SaveLoadControls';
import { StatusBar } from './components/StatusBar';
import { ComponentType, Component } from './core/types';

// ============================================
// APP COMPONENT
// ============================================

const App: React.FC = () => {
  const {
    state,
    placeComponent,
    selectComponent,
    hoverComponent,
    deleteSelectedComponent,
    rotateSelectedComponent,
    updateComponentProperty,
    startSimulation,
    pauseSimulation,
    resetSimulation,
    stepSimulation,
    saveGameState,
    loadState,
    reset,
    setPlacementComponent,
    updatePlacementPosition,
    getComponentAtPosition,
  } = useGameState();

  // Active component type for placement
  const [activeComponentType, setActiveComponentType] = useState<ComponentType | null>(null);

  // Handle component selection from toolbar
  const handleSelectComponent = useCallback((type: ComponentType | null) => {
    setActiveComponentType(type);
    if (type) {
      setPlacementComponent(type, null);
    } else {
      setPlacementComponent(null, null);
    }
  }, [setPlacementComponent]);

  // Get selected component
  const selectedComponent = state.selectedComponentId 
    ? state.components.get(state.selectedComponentId) || null
    : null;

  // Handle property update
  const handleUpdateProperty = useCallback((property: string, value: any) => {
    if (selectedComponent) {
      updateComponentProperty(selectedComponent.id, property, value);
    }
  }, [selectedComponent, updateComponentProperty]);

  // ============================================
  // RENDER
  // ============================================

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: '#0D1117',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        userSelect: 'none',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          background: '#161B22',
          borderBottom: '1px solid #21262D',
          height: 40,
          display: 'flex',
          alignItems: 'center',
          padding: '0 16px',
          gap: 16,
        }}
      >
        <div
          style={{
            fontSize: 16,
            fontWeight: 600,
            color: '#E6EDF3',
          }}
        >
          AIRWORKS
        </div>
        
        <div
          style={{
            fontSize: 12,
            color: '#8B949E',
          }}
        >
          Build the Flow
        </div>
        
        <div
          style={{
            marginLeft: 'auto',
            display: 'flex',
            gap: 16,
          }}
        >
          <button
            onClick={() => setActiveComponentType(null)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#8B949E',
              fontSize: 11,
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#E6EDF3';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#8B949E';
            }}
          >
            Clear Selection
          </button>
        </div>
      </div>

      {/* Main content */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          overflow: 'hidden',
        }}
      >
        {/* Toolbar */}
        <Toolbar
          onSelectComponent={handleSelectComponent}
          selectedComponentType={activeComponentType}
        />

        {/* Main canvas area */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          {/* Canvas */}
          <div
            style={{
              flex: 1,
              overflow: 'hidden',
            }}
          >
            <Canvas
              width={window.innerWidth - 80 - 250 - 250}
              height={window.innerHeight - 40 - 32}
            />
          </div>

          {/* Status Bar */}
          <StatusBar
            componentCount={state.components.size}
            connectionCount={state.connections.length}
            simulationResult={state.simulationResult}
            zoom={state.zoom}
            panOffset={state.panOffset}
          />
        </div>

        {/* Property Panel */}
        <PropertyPanel
          component={selectedComponent}
          onUpdateProperty={handleUpdateProperty}
          onDelete={deleteSelectedComponent}
          onRotate={rotateSelectedComponent}
        />

        {/* Simulation Controls */}
        <SimulationControls
          simulationState={state.simulationState}
          simulationResult={state.simulationResult}
          onStart={startSimulation}
          onPause={pauseSimulation}
          onReset={resetSimulation}
          onStep={stepSimulation}
          canRun={state.components.size > 0}
        />

        {/* Save/Load Controls */}
        <SaveLoadControls
          onSave={saveGameState}
          onLoad={loadState}
          onReset={reset}
        />
      </div>
    </div>
  );
};

export default App;

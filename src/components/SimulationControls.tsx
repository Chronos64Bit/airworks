// ============================================
// AIRWORKS - Simulation Controls Component
// ============================================

import React from 'react';
import { SimulationState, SimulationResult } from '../core/types';

interface SimulationControlsProps {
  simulationState: SimulationState;
  simulationResult: SimulationResult | null;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  onStep: () => void;
  canRun: boolean;
}

export const SimulationControls: React.FC<SimulationControlsProps> = ({
  simulationState,
  simulationResult,
  onStart,
  onPause,
  onReset,
  onStep,
  canRun,
}) => {
  const isRunning = simulationState === 'running';
  const isPaused = simulationState === 'paused';
  const isStopped = simulationState === 'stopped';
  
  const hasErrors = simulationResult?.hasErrors || false;
  const totalFlowRate = simulationResult?.totalFlowRate || 0;
  const iterationCount = simulationResult?.iterationCount || 0;

  return (
    <div
      style={{
        background: '#161B22',
        borderLeft: '1px solid #21262D',
        width: 250,
        height: '100%',
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      {/* Header */}
      <div
        style={{
          fontSize: 14,
          fontWeight: 600,
          color: '#E6EDF3',
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        }}
      >
        Simulation
      </div>

      {/* Status */}
      <div
        style={{
          padding: 8,
          background: '#0D1117',
          borderRadius: 4,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: isRunning ? '#5CB85C' : isPaused ? '#F0AD4E' : '#8B949E',
          }}
        />
        <span style={{ fontSize: 12, color: '#E6EDF3' }}>
          {isRunning ? 'Running' : isPaused ? 'Paused' : 'Stopped'}
        </span>
        
        {!canRun && !isRunning && (
          <span
            style={{
              marginLeft: 'auto',
              fontSize: 10,
              color: '#F85149',
            }}
          >
            Add a source and outlet
          </span>
        )}
      </div>

      {/* Controls */}
      <div
        style={{
          display: 'flex',
          gap: 4,
        }}
      >
        {!isRunning && (
          <button
            onClick={onStart}
            disabled={!canRun}
            style={{
              flex: 1,
              background: canRun ? '#5CB85C' : '#21262D',
              border: 'none',
              borderRadius: 4,
              padding: 8,
              cursor: canRun ? 'pointer' : 'not-allowed',
              color: '#fff',
              fontSize: 12,
              fontWeight: 500,
            }}
            onMouseEnter={(e) => {
              if (canRun) {
                e.currentTarget.style.background = '#6BC963';
              }
            }}
            onMouseLeave={(e) => {
              if (canRun) {
                e.currentTarget.style.background = '#5CB85C';
              }
            }}
            title={!canRun ? 'Add at least one inlet/fan and one outlet' : 'Start simulation (Space)'}
          >
            Start
          </button>
        )}
        
        {isRunning && (
          <button
            onClick={onPause}
            style={{
              flex: 1,
              background: '#F0AD4E',
              border: 'none',
              borderRadius: 4,
              padding: 8,
              cursor: 'pointer',
              color: '#fff',
              fontSize: 12,
              fontWeight: 500,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#F7C357';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#F0AD4E';
            }}
            title="Pause simulation (Space)"
          >
            Pause
          </button>
        )}
        
        {(isPaused || isStopped) && (
          <button
            onClick={onStep}
            style={{
              flex: 1,
              background: '#4A90D9',
              border: 'none',
              borderRadius: 4,
              padding: 8,
              cursor: 'pointer',
              color: '#fff',
              fontSize: 12,
              fontWeight: 500,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#58A6FF';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#4A90D9';
            }}
            title="Step simulation"
          >
            Step
          </button>
        )}
        
        <button
          onClick={onReset}
          style={{
            flex: 1,
            background: '#D9534F',
            border: 'none',
            borderRadius: 4,
            padding: 8,
            cursor: 'pointer',
            color: '#fff',
            fontSize: 12,
            fontWeight: 500,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#E36259';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#D9534F';
          }}
          title="Reset simulation"
        >
          Reset
        </button>
      </div>

      {/* Results */}
      {simulationResult && (
        <div
          style={{
            padding: 8,
            background: '#0D1117',
            borderRadius: 4,
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              color: '#8B949E',
              marginBottom: 8,
            }}
          >
            Results
          </div>
          
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 11,
              }}
            >
              <span style={{ color: '#8B949E' }}>Total Flow Rate:</span>
              <span style={{ color: '#E6EDF3' }}>
                {totalFlowRate.toFixed(4)} m³/s
              </span>
            </div>
            
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 11,
              }}
            >
              <span style={{ color: '#8B949E' }}>Iterations:</span>
              <span style={{ color: '#E6EDF3' }}>
                {iterationCount}
              </span>
            </div>
            
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 11,
              }}
            >
              <span style={{ color: '#8B949E' }}>Nodes:</span>
              <span style={{ color: '#E6EDF3' }}>
                {simulationResult.nodes.size}
              </span>
            </div>
            
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 11,
              }}
            >
              <span style={{ color: '#8B949E' }}>Ducts:</span>
              <span style={{ color: '#E6EDF3' }}>
                {simulationResult.ducts.length}
              </span>
            </div>
          </div>
          
          {hasErrors && (
            <div
              style={{
                marginTop: 8,
                padding: 4,
                background: '#F8514920',
                border: '1px solid #F85149',
                borderRadius: 4,
                fontSize: 10,
                color: '#F85149',
              }}
            >
              {simulationResult.errors.map((error, index) => (
                <div key={index}>{error}</div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Keyboard shortcuts help */}
      <div
        style={{
          marginTop: 'auto',
          paddingTop: 8,
          borderTop: '1px solid #21262D',
          fontSize: 10,
          color: '#8B949E',
        }}
      >
        <div><strong>Space</strong> Start/Pause</div>
        <div><strong>R</strong> Rotate</div>
        <div><strong>Delete</strong> Delete</div>
        <div><strong>Ctrl+Z</strong> Undo</div>
        <div><strong>Ctrl+Y</strong> Redo</div>
      </div>
    </div>
  );
};

export default SimulationControls;

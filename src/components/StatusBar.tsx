// ============================================
// AIRWORKS - Status Bar Component
// ============================================

import React from 'react';
import { SimulationResult, Vector2 } from '../core/types';

interface StatusBarProps {
  componentCount: number;
  connectionCount: number;
  simulationResult: SimulationResult | null;
  zoom: number;
  panOffset: Vector2;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  componentCount,
  connectionCount,
  simulationResult,
  zoom,
  panOffset,
}) => {
  const hasErrors = simulationResult?.hasErrors || false;
  const totalFlowRate = simulationResult?.totalFlowRate || 0;

  return (
    <div
      style={{
        background: '#161B22',
        borderTop: '1px solid #21262D',
        height: 32,
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        gap: 16,
        fontSize: 11,
        color: '#8B949E',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <span style={{ color: '#4A90D9' }}>Components:</span>
        <span style={{ color: '#E6EDF3' }}>{componentCount}</span>
      </div>
      
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <span style={{ color: '#5BC0DE' }}>Connections:</span>
        <span style={{ color: '#E6EDF3' }}>{connectionCount}</span>
      </div>
      
      {simulationResult && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span style={{ color: '#5CB85C' }}>Flow Rate:</span>
          <span style={{ color: '#E6EDF3' }}>{totalFlowRate.toFixed(4)} m³/s</span>
        </div>
      )}
      
      {hasErrors && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            color: '#F85149',
          }}
        >
          ⚠ {simulationResult?.errors[0]}
        </div>
      )}
      
      <div
        style={{
          marginLeft: 'auto',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <span>Zoom: {(zoom * 100).toFixed(0)}%</span>
        <span>Pan: ({panOffset.x.toFixed(1)}, {panOffset.y.toFixed(1)})</span>
      </div>
    </div>
  );
};

export default StatusBar;

// ============================================
// AIRWORKS - Component Toolbar
// ============================================

import React from 'react';
import { ComponentType, COMPONENT_DEFINITIONS } from '../core/types';

interface ToolbarProps {
  onSelectComponent: (type: ComponentType | null) => void;
  selectedComponentType: ComponentType | null;
}

export const Toolbar: React.FC<ToolbarProps> = ({ onSelectComponent, selectedComponentType }) => {
  const components = Object.entries(COMPONENT_DEFINITIONS).map(([type, def]) => ({
    type: type as ComponentType,
    name: def.name,
    icon: def.icon,
    color: def.color,
  }));
  
  return (
    <div
      style={{
        background: '#161B22',
        borderRight: '1px solid #21262D',
        width: 80,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        padding: 8,
        gap: 4,
      }}
    >
      <div
        style={{
          color: '#8B949E',
          fontSize: 10,
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          marginBottom: 8,
          textAlign: 'center',
        }}
      >
        Components
      </div>
      
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 4,
          flex: 1,
        }}
      >
        {components.map(({ type, name, icon, color }) => (
          <button
            key={type}
            onClick={() => onSelectComponent(type)}
            style={{
              background: selectedComponentType === type ? color + '20' : 'transparent',
              border: selectedComponentType === type ? `2px solid ${color}` : '1px solid #21262D',
              borderRadius: 4,
              padding: 8,
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: selectedComponentType === type ? color : '#8B949E',
              fontSize: 18,
              transition: 'all 0.15s ease',
              aspectRatio: 1,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = color + '15';
              e.currentTarget.style.color = color;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = selectedComponentType === type ? color + '20' : 'transparent';
              e.currentTarget.style.color = selectedComponentType === type ? color : '#8B949E';
            }}
            title={name}
          >
            <span style={{ fontSize: 20 }}>{icon}</span>
            <span style={{ fontSize: 8, marginTop: 2, fontWeight: 500 }}>
              {name.split(' ')[0]}
            </span>
          </button>
        ))}
      </div>
      
      <div
        style={{
          marginTop: 'auto',
          paddingTop: 8,
          borderTop: '1px solid #21262D',
        }}
      >
        <button
          onClick={() => onSelectComponent(null)}
          style={{
            background: 'transparent',
            border: '1px solid #21262D',
            borderRadius: 4,
            padding: 8,
            cursor: 'pointer',
            color: '#8B949E',
            width: '100%',
            fontSize: 12,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#21262D';
            e.currentTarget.style.color = '#fff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = '#8B949E';
          }}
          title="Cancel placement (ESC)"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default Toolbar;

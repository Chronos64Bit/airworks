// ============================================
// AIRWORKS - Property Panel Component
// ============================================

import React from 'react';
import { Component, ComponentType, COMPONENT_DEFINITIONS } from '../core/types';

interface PropertyPanelProps {
  component: Component | null;
  onUpdateProperty: (property: string, value: any) => void;
  onDelete: () => void;
  onRotate: () => void;
}

export const PropertyPanel: React.FC<PropertyPanelProps> = ({
  component,
  onUpdateProperty,
  onDelete,
  onRotate,
}) => {
  if (!component) {
    return (
      <div
        style={{
          background: '#161B22',
          borderLeft: '1px solid #21262D',
          width: 250,
          height: '100%',
          padding: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#8B949E',
          fontSize: 12,
        }}
      >
        Select a component to view properties
      </div>
    );
  }

  const def = COMPONENT_DEFINITIONS[component.type];
  const properties = Object.entries(component.properties);

  // Handle different property types
  const renderPropertyInput = (name: string, value: any, type: string) => {
    switch (type) {
      case 'boolean':
        return (
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={value}
              onChange={(e) => onUpdateProperty(name, e.target.checked)}
              style={{ width: 16, height: 16 }}
            />
            <span style={{ fontSize: 12, color: '#E6EDF3' }}>
              {name.replace(/([A-Z])/g, ' $1')}
            </span>
          </label>
        );

      case 'number':
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: '#E6EDF3', minWidth: 80 }}>
              {name.replace(/([A-Z])/g, ' $1')}
            </span>
            <input
              type="number"
              value={value}
              onChange={(e) => onUpdateProperty(name, parseFloat(e.target.value) || 0)}
              style={{
                background: '#0D1117',
                border: '1px solid #21262D',
                borderRadius: 4,
                padding: 4,
                color: '#E6EDF3',
                fontSize: 12,
                width: 80,
              }}
            />
          </div>
        );

      default:
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: '#E6EDF3', minWidth: 80 }}>
              {name.replace(/([A-Z])/g, ' $1')}
            </span>
            <span style={{ fontSize: 12, color: '#8B949E' }}>
              {JSON.stringify(value)}
            </span>
          </div>
        );
    }
  };

  // Special handling for percentage
  const getPropertyType = (name: string, value: any): string => {
    if (name === 'openPercentage') return 'number';
    return typeof value;
  };

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
        overflowY: 'auto',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          paddingBottom: 8,
          borderBottom: '1px solid #21262D',
        }}
      >
        <span
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: def.color,
          }}
        >
          {def.icon}
        </span>
        <span style={{ fontSize: 14, fontWeight: 600, color: '#E6EDF3' }}>
          {def.name}
        </span>
      </div>

      {/* Type */}
      <div style={{ fontSize: 10, color: '#8B949E' }}>
        {def.description}
      </div>

      {/* Actions */}
      <div
        style={{
          display: 'flex',
          gap: 4,
        }}
      >
        <button
          onClick={onRotate}
          style={{
            flex: 1,
            background: '#0D1117',
            border: '1px solid #21262D',
            borderRadius: 4,
            padding: 8,
            cursor: 'pointer',
            color: '#E6EDF3',
            fontSize: 12,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#21262D';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#0D1117';
          }}
          title="Rotate (R)"
        >
          Rotate
        </button>
        <button
          onClick={onDelete}
          style={{
            flex: 1,
            background: '#0D1117',
            border: '1px solid #F85149',
            borderRadius: 4,
            padding: 8,
            cursor: 'pointer',
            color: '#F85149',
            fontSize: 12,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#F8514920';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#0D1117';
          }}
          title="Delete (Delete)"
        >
          Delete
        </button>
      </div>

      {/* Properties */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        <div
          style={{
            fontSize: 10,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            color: '#8B949E',
          }}
        >
          Properties
        </div>
        
        {properties.map(([name, value]) => {
          const type = getPropertyType(name, value);
          return (
            <div
              key={name}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 6,
                background: '#0D1117',
                borderRadius: 4,
              }}
            >
              {renderPropertyInput(name, value, type)}
            </div>
          );
        })}
      </div>

      {/* Position info */}
      <div
        style={{
          marginTop: 'auto',
          paddingTop: 8,
          borderTop: '1px solid #21262D',
          fontSize: 10,
          color: '#8B949E',
        }}
      >
        Position: ({component.position.x}, {component.position.y})
        <br />
        Rotation: {component.rotation * 90}°
      </div>
    </div>
  );
};

export default PropertyPanel;

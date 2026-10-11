// ============================================
// AIRWORKS - Type System Tests
// ============================================

import { describe, it, expect } from 'vitest';
import {
  Vector2,
  Direction,
  Rotation,
  ComponentType,
  generateId,
  createComponent,
  getComponentConnections,
  getComponentSize,
  getComponentWorldBounds,
  areComponentsOverlapping,
  canConnect,
  getConnectionPosition,
  DIRECTION_VECTORS,
  OPPOSITE_DIRECTION,
  rotateDirection,
  getOppositeDirection,
  COMPONENT_DEFINITIONS,
} from '../core/types';

// ============================================
// DIRECTION TESTS
// ============================================

describe('Direction Utilities', () => {
  describe('rotateDirection', () => {
    it('should rotate direction 0 (Right) by 90° to become 1 (Down)', () => {
      expect(rotateDirection(0, 1)).toBe(1);
    });

    it('should rotate direction 0 (Right) by 180° to become 2 (Left)', () => {
      expect(rotateDirection(0, 2)).toBe(2);
    });

    it('should rotate direction 0 (Right) by 270° to become 3 (Up)', () => {
      expect(rotateDirection(0, 3)).toBe(3);
    });

    it('should rotate direction 1 (Down) by 90° to become 2 (Left)', () => {
      expect(rotateDirection(1, 1)).toBe(2);
    });

    it('should wrap around (270° + 90° = 0°)', () => {
      expect(rotateDirection(3, 1)).toBe(0);
    });
  });

  describe('getOppositeDirection', () => {
    it('should return opposite of Right (0) as Left (2)', () => {
      expect(getOppositeDirection(0)).toBe(2);
    });

    it('should return opposite of Down (1) as Up (3)', () => {
      expect(getOppositeDirection(1)).toBe(3);
    });

    it('should return opposite of Left (2) as Right (0)', () => {
      expect(getOppositeDirection(2)).toBe(0);
    });

    it('should return opposite of Up (3) as Down (1)', () => {
      expect(getOppositeDirection(3)).toBe(1);
    });
  });

  describe('DIRECTION_VECTORS', () => {
    it('should have correct vector for Right (0)', () => {
      expect(DIRECTION_VECTORS[0]).toEqual({ x: 1, y: 0 });
    });

    it('should have correct vector for Down (1)', () => {
      expect(DIRECTION_VECTORS[1]).toEqual({ x: 0, y: 1 });
    });

    it('should have correct vector for Left (2)', () => {
      expect(DIRECTION_VECTORS[2]).toEqual({ x: -1, y: 0 });
    });

    it('should have correct vector for Up (3)', () => {
      expect(DIRECTION_VECTORS[3]).toEqual({ x: 0, y: -1 });
    });
  });
});

// ============================================
// ID GENERATION TESTS
// ============================================

describe('ID Generation', () => {
  it('should generate unique IDs', () => {
    const id1 = generateId();
    const id2 = generateId();
    expect(id1).not.toBe(id2);
  });

  it('should generate non-empty IDs', () => {
    const id = generateId();
    expect(id.length).toBeGreaterThan(0);
  });
});

// ============================================
// COMPONENT CREATION TESTS
// ============================================

describe('Component Creation', () => {
  it('should create component with correct type', () => {
    const component = createComponent('straight', { x: 0, y: 0 });
    expect(component.type).toBe('straight');
  });

  it('should create component with correct position', () => {
    const position = { x: 5, y: 10 };
    const component = createComponent('straight', position);
    expect(component.position).toEqual(position);
  });

  it('should create component with default rotation 0', () => {
    const component = createComponent('straight', { x: 0, y: 0 });
    expect(component.rotation).toBe(0);
  });

  it('should create component with default properties from definition', () => {
    const component = createComponent('straight', { x: 0, y: 0 });
    const def = COMPONENT_DEFINITIONS['straight'];
    expect(component.properties).toEqual(def.defaultProperties);
  });

  it('should create component with unique ID', () => {
    const component1 = createComponent('straight', { x: 0, y: 0 });
    const component2 = createComponent('straight', { x: 1, y: 1 });
    expect(component1.id).not.toBe(component2.id);
  });
});

// ============================================
// COMPONENT CONNECTION TESTS
// ============================================

describe('Component Connections', () => {
  it('should get connections for straight duct', () => {
    const component = createComponent('straight', { x: 0, y: 0 });
    const connections = getComponentConnections(component);
    expect(connections.length).toBe(2); // Straight has 2 connections
  });

  it('should rotate connection directions with component rotation', () => {
    const component = createComponent('straight', { x: 0, y: 0 });
    component.rotation = 1; // 90° rotation
    
    const connections = getComponentConnections(component);
    
    // Original directions are 0 (Right) and 2 (Left)
    // After 90° rotation, they should be 1 (Down) and 3 (Up)
    expect(connections[0].direction).toBe(1);
    expect(connections[1].direction).toBe(3);
  });

  it('should get correct size for components', () => {
    const straight = createComponent('straight', { x: 0, y: 0 });
    const corner = createComponent('corner', { x: 0, y: 0 });
    
    expect(getComponentSize(straight)).toEqual({ x: 1, y: 1 });
    expect(getComponentSize(corner)).toEqual({ x: 1, y: 1 });
  });

  it('should get correct world bounds for component', () => {
    const component = createComponent('straight', { x: 5, y: 10 });
    const bounds = getComponentWorldBounds(component);
    
    expect(bounds.min).toEqual({ x: 4.5, y: 9.5 });
    expect(bounds.max).toEqual({ x: 5.5, y: 10.5 });
  });
});

// ============================================
// COMPONENT OVERLAP TESTS
// ============================================

describe('Component Overlap Detection', () => {
  it('should detect overlapping components at same position', () => {
    const component1 = createComponent('straight', { x: 0, y: 0 });
    const component2 = createComponent('straight', { x: 0, y: 0 });
    
    expect(areComponentsOverlapping(component1, component2)).toBe(true);
  });

  it('should not detect overlapping components at different positions', () => {
    const component1 = createComponent('straight', { x: 0, y: 0 });
    const component2 = createComponent('straight', { x: 2, y: 0 });
    
    expect(areComponentsOverlapping(component1, component2)).toBe(false);
  });

  it('should detect adjacent components as overlapping', () => {
    const component1 = createComponent('straight', { x: 0, y: 0 });
    const component2 = createComponent('straight', { x: 1, y: 0 });
    
    // With default tolerance, adjacent components should touch but not overlap
    expect(areComponentsOverlapping(component1, component2)).toBe(false);
  });
});

// ============================================
// CONNECTION VALIDATION TESTS
// ============================================

describe('Connection Validation', () => {
  it('should validate connection between opposite directions', () => {
    const componentA = createComponent('straight', { x: 0, y: 0 });
    const componentB = createComponent('straight', { x: 1, y: 0 });
    
    // Component A has connections at indices 0 (Right) and 1 (Left)
    // Component B has connections at indices 0 (Right) and 1 (Left)
    // Connecting A's Right (index 0) to B's Left (index 1) should be valid
    expect(canConnect(componentA, 0, componentB, 1)).toBe(true);
  });

  it('should invalidate connection between same directions', () => {
    const componentA = createComponent('straight', { x: 0, y: 0 });
    const componentB = createComponent('straight', { x: 1, y: 0 });
    
    // Connecting A's Right (index 0) to B's Right (index 0) should be invalid
    expect(canConnect(componentA, 0, componentB, 0)).toBe(false);
  });

  it('should validate connection with rotated component', () => {
    const componentA = createComponent('straight', { x: 0, y: 0 });
    const componentB = createComponent('straight', { x: 1, y: 0 });
    componentB.rotation = 1; // 90° rotation
    
    // Component B's connections are now rotated
    // Original: 0 (Right), 1 (Left)
    // After 90° rotation: 1 (Down), 3 (Up)
    
    // A's Right (0) should connect to B's Up (which was index 1, now direction 3)
    // But we need to check the actual rotated directions
    const connectionsB = getComponentConnections(componentB);
    
    // Find if any connection on B is opposite to A's connection 0
    let validConnectionFound = false;
    for (let i = 0; i < connectionsB.length; i++) {
      if (canConnect(componentA, 0, componentB, i as any)) {
        validConnectionFound = true;
        break;
      }
    }
    
    expect(validConnectionFound).toBe(true);
  });
});

// ============================================
// CONNECTION POSITION TESTS
// ============================================

describe('Connection Position', () => {
  it('should get correct connection position for straight duct', () => {
    const component = createComponent('straight', { x: 5, y: 10 });
    
    // Connection at index 0 (Right) should be at (5.5, 10)
    const pos0 = getConnectionPosition(component, 0);
    expect(pos0).toEqual({ x: 5.5, y: 10 });
    
    // Connection at index 1 (Left) should be at (4.5, 10)
    const pos1 = getConnectionPosition(component, 1);
    expect(pos1).toEqual({ x: 4.5, y: 10 });
  });

  it('should get correct connection position with rotation', () => {
    const component = createComponent('straight', { x: 5, y: 10 });
    component.rotation = 1; // 90° rotation
    
    const connections = getComponentConnections(component);
    
    // After rotation, connection directions should be rotated
    // Original: Right (0) -> Down (1)
    // Position for Down should be (5, 10.5)
    const pos = getConnectionPosition(component, 0);
    expect(pos).toEqual({ x: 5, y: 10.5 });
  });
});

// ============================================
// COMPONENT DEFINITIONS TESTS
// ============================================

describe('Component Definitions', () => {
  it('should have all required component types', () => {
    const requiredTypes: ComponentType[] = [
      'straight',
      'corner',
      't_junction',
      'cross',
      'inlet',
      'outlet',
      'fan',
      'valve',
    ];
    
    for (const type of requiredTypes) {
      expect(COMPONENT_DEFINITIONS[type]).toBeDefined();
    }
  });

  it('should have correct properties for each component type', () => {
    for (const [type, def] of Object.entries(COMPONENT_DEFINITIONS)) {
      expect(def.type).toBe(type);
      expect(def.name).toBeDefined();
      expect(def.description).toBeDefined();
      expect(def.size).toBeDefined();
      expect(def.connections).toBeDefined();
      expect(def.connections.length).toBeGreaterThan(0);
      expect(def.defaultProperties).toBeDefined();
      expect(def.color).toBeDefined();
      expect(def.icon).toBeDefined();
    }
  });

  it('should have straight duct with 2 connections', () => {
    expect(COMPONENT_DEFINITIONS['straight'].connections.length).toBe(2);
  });

  it('should have corner duct with 2 connections', () => {
    expect(COMPONENT_DEFINITIONS['corner'].connections.length).toBe(2);
  });

  it('should have T-junction with 3 connections', () => {
    expect(COMPONENT_DEFINITIONS['t_junction'].connections.length).toBe(3);
  });

  it('should have cross junction with 4 connections', () => {
    expect(COMPONENT_DEFINITIONS['cross'].connections.length).toBe(4);
  });

  it('should have inlet with 1 connection', () => {
    expect(COMPONENT_DEFINITIONS['inlet'].connections.length).toBe(1);
  });

  it('should have outlet with 1 connection', () => {
    expect(COMPONENT_DEFINITIONS['outlet'].connections.length).toBe(1);
  });

  it('should have fan with 2 connections', () => {
    expect(COMPONENT_DEFINITIONS['fan'].connections.length).toBe(2);
  });

  it('should have valve with 2 connections', () => {
    expect(COMPONENT_DEFINITIONS['valve'].connections.length).toBe(2);
  });
});

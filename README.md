# Airworks - Build the Flow

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![GitHub Release](https://img.shields.io/github/v/release/Chronos64Bit/airworks)](https://github.com/Chronos64Bit/airworks/releases)

**Airworks** is a duct construction and airflow simulation game inspired by DUCTWORKS on Roblox. Build complex duct networks, configure air sources, and observe the resulting airflow in a polished, technical sandbox environment.

> **By The Ventryx Company**

## Features

### Construction
- **Grid-based workspace** with snapping and predictable placement
- **Multiple component types**:
  - Straight ducts
  - 90-degree corner ducts
  - T-junctions (3-way connections)
  - Cross junctions (4-way connections)
  - Air inlets (sources)
  - Air outlets (exhausts)
  - Fans (flow boosters)
  - Valves (flow controllers)
- **Component rotation** in 90-degree increments
- **Connection validation** with visual feedback
- **Undo/Redo** support

### Airflow Simulation
- **Real physical model** based on:
  - Conservation of mass (continuity equation)
  - Darcy-Weisbach equation for pressure drop
  - Reynolds number calculations
  - Friction factor approximations
- **Configurable properties**:
  - Duct resistance
  - Duct diameter
  - Source pressure/flow rate
  - Valve open percentage
  - Fan boost pressure
- **Branching network support** with automatic flow distribution
- **Disconnected component detection**

### Visualization
- **Animated particles** following calculated flow paths
- **Flow speed indicators** with color coding
- **Pressure displays** at each component
- **Flow rate indicators** on ducts
- **Direction arrows** showing flow direction

### Interface
- **Dark, technical theme** with minimal design
- **Component toolbar** for quick placement
- **Property panel** for component configuration
- **Simulation controls** (start, pause, reset, step)
- **Save/Load system** with local storage
- **Keyboard shortcuts** for efficient workflow
- **Zoom and pan** for navigating large networks
- **Status bar** with real-time information

## Installation

### From Release

Download the latest release for your platform from the [Releases page](https://github.com/Chronos64Bit/airworks/releases):

- **Windows**: `airworks-windows-x64.exe`
- **Linux**: `airworks-linux-x64.AppImage`

### From Source

```bash
# Clone the repository
git clone https://github.com/Chronos64Bit/airworks.git
cd airworks

# Install dependencies
npm install

# Build the application
npm run build

# Run in development mode
npm run dev

# Or build for production with Tauri
npm run tauri
```

## Usage

### Basic Controls

| Key | Action |
|-----|--------|
| **Mouse Left** | Place component / Select component |
| **Mouse Right** | Cancel placement / Deselect |
| **Mouse Wheel** | Zoom in/out |
| **Space** | Start/Pause simulation |
| **R** | Rotate selected component |
| **Delete/Backspace** | Delete selected component |
| **Ctrl+Z** | Undo |
| **Ctrl+Y** | Redo |
| **0** | Reset camera |
| **+/-** | Zoom in/out |

### Building a Network

1. **Select a component** from the toolbar on the left
2. **Click on the grid** to place the component
3. **Rotate components** with the R key or by clicking the Rotate button
4. **Connect components** by placing them adjacent to each other
5. **Add an inlet** (air source) and **outlet** (air exhaust)
6. **Click Start** to run the simulation

### Tips

- **Inlets** and **Fans** are air sources - you need at least one in your network
- **Outlets** are required for airflow to exit the system
- **Valves** can be opened/closed to control flow
- **T-Junctions** and **Cross Junctions** allow for branching networks
- Use **Save** to store your designs and **Load** to restore them

## Development

### Project Structure

```
airworks/
├── src/
│   ├── core/
│   │   ├── types.ts          # Type definitions
│   │   ├── solver.ts         # Airflow simulation solver
│   │   ├── state.ts          # Game state management
│   │   └── renderer.ts       # Canvas rendering
│   ├── components/
│   │   ├── Canvas.tsx        # Main construction canvas
│   │   ├── Toolbar.tsx       # Component toolbar
│   │   ├── PropertyPanel.tsx  # Component properties
│   │   ├── SimulationControls.tsx
│   │   ├── SaveLoadControls.tsx
│   │   └── StatusBar.tsx
│   ├── hooks/
│   │   └── useGameState.ts   # React state hook
│   ├── App.tsx               # Main application
│   └── main.tsx              # Entry point
├── src-tauri/
│   ├── Cargo.toml
│   └── tauri.conf.json       # Tauri configuration
├── package.json
├── README.md
└── vite.config.ts
```

### Technology Stack

- **Frontend**: React 18 + TypeScript
- **Rendering**: HTML Canvas
- **Styling**: CSS with inline styles
- **Desktop**: Tauri 2.x
- **Testing**: Vitest
- **Build**: Vite
- **CI/CD**: GitHub Actions with Blacksmith

### Available Scripts

```bash
# Development
npm run dev              # Start development server
npm run build            # Build for production
npm run preview          # Preview production build

# Tauri
npm run tauri            # Run Tauri application

# Testing
npm run test             # Run all tests
npm run test:coverage    # Run tests with coverage
```

## Physical Model

Airworks uses a simplified steady-state flow model with the following assumptions:

1. **Incompressible flow** (valid for low-speed air flow)
2. **Isothermal conditions**
3. **Laminar flow** (Reynolds number < 2000)
4. **Constant air density** (1.225 kg/m³ at sea level, 20°C)
5. **Cylindrical ducts** with circular cross-section

### Key Equations

1. **Darcy-Weisbach**: ΔP = f × (L/D) × (ρ/2) × v²
   - f = friction factor
   - L = duct length
   - D = diameter
   - ρ = air density
   - v = flow velocity

2. **Friction Factor (Laminar)**: f = 64 / Re
   - Re = Reynolds number = (ρ × v × D) / μ
   - μ = dynamic viscosity

3. **Continuity**: Q = A × v = constant
   - Q = volume flow rate
   - A = cross-sectional area

4. **Bernoulli with losses**: P₁/ρg + v₁²/2g + z₁ = P₂/ρg + v₂²/2g + z₂ + h_L

### Network Solution

The solver uses an iterative relaxation method:

1. Build a graph where nodes are connection points and edges are components
2. Identify source nodes (inlets, fans) and sink nodes (outlets)
3. Initialize all node pressures to atmospheric pressure
4. Set source nodes to their specified pressures
5. For each iteration:
   - Calculate pressure drop across each edge based on current flow
   - Update node pressures based on connected edges
   - Update flow rates based on pressure differences
6. Repeat until convergence or max iterations

## Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Inspired by **DUCTWORKS** on Roblox
- Built with **Tauri**, **React**, and **TypeScript**
- Powered by **The Ventryx Company**

---

© 2024 The Ventryx Company. All rights reserved.

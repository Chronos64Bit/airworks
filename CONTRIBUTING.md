# Contributing to Airworks

Thank you for your interest in contributing to **Airworks**! This document outlines how you can help improve the project.

## Getting Started

### Prerequisites

- **Node.js** 18+ (recommended: 20)
- **pnpm** 8+ (recommended for faster installs)
- **Rust** 1.70+ (for Tauri)
- **Git**

### Installation

```bash
# Clone the repository
git clone https://github.com/Chronos64Bit/airworks.git
cd airworks

# Install dependencies (using pnpm)
pnpm install

# Or using npm
npm install
```

### Development

```bash
# Start development server
npm run dev

# Open in browser: http://localhost:5173
```

### Building

```bash
# Build frontend
npm run build

# Build with Tauri
npm run tauri
```

## Contribution Guidelines

### Code Style

- **TypeScript**: Use strict typing throughout
- **React**: Use functional components with hooks
- **Formatting**: Follow existing code patterns
- **Comments**: Use sparingly, only for complex logic
- **Tests**: Add tests for new features and bug fixes

### Commit Messages

Use [Conventional Commits](https://www.conventionalcommits.org/) format:

```
feat: add new component type
fix: correct airflow calculation in branching networks
chore: update dependencies
docs: add installation instructions
```

### Pull Requests

1. Fork the repository
2. Create a feature branch (`git checkout -b feat/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feat/amazing-feature`)
5. Open a Pull Request

### Testing

All changes should pass existing tests:

```bash
npm run test
```

Add tests for new functionality in the `__tests__` directory.

## Project Structure

```
airworks/
├── src/
│   ├── core/           # Core game logic
│   │   ├── types.ts    # Type definitions
│   │   ├── solver.ts   # Airflow simulation
│   │   ├── state.ts    # Game state management
│   │   └── renderer.ts # Canvas rendering
│   ├── components/     # React components
│   ├── hooks/          # React hooks
│   └── App.tsx         # Main application
├── src-tauri/         # Tauri configuration
└── package.json       # Project configuration
```

## Reporting Issues

When reporting issues, please include:

- **OS and version**
- **Browser** (if web version)
- **Steps to reproduce**
- **Expected behavior**
- **Actual behavior**
- **Screenshots or videos** (if applicable)

## Feature Requests

Feature requests are welcome! Please open an issue with:

- **Detailed description** of the feature
- **Use case** or problem it solves
- **Mockups or examples** (if applicable)

## Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md).

## License

By contributing to this project, you agree that your contributions will be licensed under the **MIT License**.

---

Thank you for contributing to Airworks!

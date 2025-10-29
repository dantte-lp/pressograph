# Pressograph

> Professional pressure test visualization platform with React, TypeScript, and PostgreSQL

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/dantte-lp/pressograph/blob/master/LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.2-61dafb)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-22-339933)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-18-336791)](https://www.postgresql.org/)
[![GitHub Issues](https://img.shields.io/github/issues/dantte-lp/pressograph)](https://github.com/dantte-lp/pressograph/issues)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/dantte-lp/pressograph/blob/master/CONTRIBUTING.md)

**Live Demo**: [pressograph.infra4.dev](https://pressograph.infra4.dev)

## Features

- ⚡ **Modern Stack**: React 19, TypeScript 5.7, Vite 6, Tailwind CSS 3.4
- 🎨 **Dark/Light Theme** with persistent settings
- 📊 **Canvas-based Charts** with high resolution rendering
- 📤 **Export**: PNG (4K), PDF (A4 landscape), JSON (settings)
- 🔄 **Hot Reload** in development mode
- 🐳 **Containerization**: Podman/Docker with multi-stage build
- 📱 **Responsive Design** for mobile devices
- 💾 **Persistent Storage** of settings in localStorage
- 🎯 **TypeScript** strict typing
- 🧩 **Modular Architecture** with reusable components

## Technology Stack

### Frontend
- **React 19** - UI library
- **TypeScript 5.7** - static typing
- **Vite 6** - build tool and dev server
- **Tailwind CSS 3.4** - utility-first CSS framework
- **Zustand 5** - state management
- **jsPDF 2.5** - PDF generation
- **date-fns 4.1** - date manipulation

### Infrastructure
- **Podman/Docker** - containerization
- **Nginx 1.29 (Trixie)** - production web server
- **Node.js (current-trixie-slim)** - build runtime

## Quick Start

### Requirements
- Podman or Docker
- Podman Compose or Docker Compose

### Development

```bash
# Start dev server with hot reload
make dev

# Available at: http://localhost:5173
```

### Production

```bash
# Build production image
make build

# Start production server
make prod

# Available at: http://localhost:8080
```

### All Makefile Commands

```bash
make help              # Show all commands
make dev               # Start dev server
make dev-build         # Rebuild and start dev
make dev-down          # Stop dev server
make build             # Build production image
make prod              # Start production
make prod-down         # Stop production
make logs              # Show logs (ENV=dev|prod)
make clean             # Remove containers and images
make stop              # Stop all containers
make install           # Install dependencies locally
make lint              # Run ESLint
make test              # Run tests
make status            # Show container status
make info              # System information
make rebuild           # Full rebuild
make restart-dev       # Restart dev
make restart-prod      # Restart prod
```

## Project Structure

```
pressure-test-visualizer/
├── deploy/
│   ├── compose/
│   │   ├── docker-compose.dev.yml    # Development configuration
│   │   └── docker-compose.prod.yml   # Production configuration
│   ├── Containerfile                 # Multi-stage build
│   └── nginx.conf                    # Nginx configuration
├── src/
│   ├── components/
│   │   ├── ui/                       # UI components (Button, Input, Select)
│   │   ├── forms/                    # Forms (parameters, pressure tests)
│   │   └── graph/                    # Graph and export
│   ├── store/
│   │   ├── useTestStore.ts           # Zustand store for settings
│   │   └── useThemeStore.ts          # Zustand store for theme
│   ├── types/
│   │   └── index.ts                  # TypeScript types
│   ├── utils/
│   │   ├── helpers.ts                # Helper functions
│   │   ├── graphGenerator.ts         # Graph data generation
│   │   ├── canvasRenderer.ts         # Canvas rendering
│   │   └── export.ts                 # PNG/PDF/JSON export
│   ├── App.tsx                       # Main component
│   ├── main.tsx                      # Entry point
│   └── index.css                     # Global styles
├── public/                           # Static files
├── index.html                        # HTML template
├── package.json                      # Dependencies
├── vite.config.ts                    # Vite configuration
├── tailwind.config.js                # Tailwind configuration
├── tsconfig.json                     # TypeScript configuration
├── Makefile                          # Management commands
└── README.md                         # Documentation
```

## Architecture

### State Management (Zustand)

The application uses two stores:

1. **useTestStore** - test settings
   - Test parameters (pressure, temperature, dates)
   - Intermediate pressure tests
   - Templates and presets
   - Import/export settings

2. **useThemeStore** - theme management
   - Dark/light mode toggle
   - localStorage persistence

### Graph Generation

1. **graphGenerator.ts** - data point creation with:
   - Pressure ramp-up (30 seconds)
   - Hold with fluctuations
   - Pressure release
   - Intermediate pressure tests

2. **canvasRenderer.ts** - Canvas rendering:
   - Axes and grid
   - Graph with fill
   - Information panel
   - Theme adaptation

### Export

- **PNG**: Canvas → Blob → Download (4x resolution)
- **PDF**: Canvas → jsPDF → Download (A4 landscape)
- **JSON**: Settings → JSON → Download

## Docker Images

### Development
```yaml
image: node:current-trixie-slim
```
- Hot reload with Vite
- Volume mapping for code
- Port 5173

### Production
```dockerfile
# Build stage
FROM node:current-trixie-slim AS builder
# ... application build

# Runtime stage
FROM nginx:1.29-trixie-perl
# ... copy dist
```
- Multi-stage optimized build
- Nginx for static files
- Port 8080
- Health checks

## Features

### Test Parameters
- Test number
- Start/end date and time
- Test duration
- Working and maximum pressure
- Ambient temperature
- Pressure test duration

### Intermediate Pressure Tests
- Add/remove tests
- Time (hours from start)
- Duration (minutes)
- Quick presets: 6h, 8h, 12h, 24h

### Templates
- **Standard** (15.33h, 3 checks)
- **Daily** (24h, 5 checks)
- **Extended** (48h, 7 checks)
- Reset to default values

### Export/Import
- Export graph to PNG (high resolution)
- Export graph to PDF (A4 landscape)
- Export settings to JSON
- Import settings from JSON

### Theming
- Light theme
- Dark theme
- Saved preferences
- Graph theme adaptation

## Development

### Local Installation (without containers)

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build
npm run build

# Preview production build
npm run preview

# Linting
npm run lint
```

### Adding New Components

1. Create component in `src/components/`
2. Define types in `src/types/`
3. Export through `index.ts`
4. Use Tailwind CSS for styling
5. Follow existing patterns

### Working with Canvas

Rendering uses Canvas API with:
- High DPI support (scaling)
- Adaptive colors (theme)
- Optimized redrawing

## Production Deployment

### Using Podman/Docker

```bash
# 1. Build image
make build

# 2. Start container
make prod

# 3. Check health
curl http://localhost:8080/health
```

### Using systemd (Quadlet)

Create file `/etc/containers/systemd/pressure-test-visualizer.container`:

```ini
[Container]
Image=pressure-test-visualizer:latest
ContainerName=pressure-test-visualizer
PublishPort=8080:80
Network=bridge

[Service]
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl start pressure-test-visualizer
sudo systemctl enable pressure-test-visualizer
```

## Configuration

### Vite
Settings in `vite.config.ts`:
- Server host: 0.0.0.0 (for Docker)
- Port: 5173
- Hot reload with polling

### Nginx
Configuration in `deploy/nginx.conf`:
- Gzip compression
- Static file caching
- Security headers
- Health check endpoint

### Tailwind CSS
Configuration in `tailwind.config.js`:
- Dark mode: class
- Content: HTML and TSX files

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Quick Links
- [Bug Reports](https://github.com/dantte-lp/pressograph/issues/new?template=bug_report.md)
- [Feature Requests](https://github.com/dantte-lp/pressograph/issues/new?template=feature_request.md)
- [Security Policy](SECURITY.md)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- 📚 [Documentation](https://github.com/dantte-lp/pressograph/tree/master/docs)
- 🐛 [Issue Tracker](https://github.com/dantte-lp/pressograph/issues)
- 💬 [Discussions](https://github.com/dantte-lp/pressograph/discussions)
- 📧 Email: pavel.lavrukhin@infra4.dev

## Acknowledgments

Built with ❤️ by [Pavel Lavrukhin](https://github.com/dantte-lp)

Special thanks to:
- [React Team](https://react.dev/) for React 19
- [NextUI Team](https://nextui.org/) for HeroUI components
- [Tailwind Labs](https://tailwindcss.com/) for Tailwind CSS
- [PostgreSQL Global Development Group](https://www.postgresql.org/)
- All our [contributors](https://github.com/dantte-lp/pressograph/graphs/contributors)

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=dantte-lp/pressograph&type=Date)](https://star-history.com/#dantte-lp/pressograph&Date)

---

**Made with ❤️ using React, TypeScript, PostgreSQL, and Podman**

# Pressograph Documentation

Welcome to the official documentation for **Pressograph** - a professional pressure test visualization platform.

## Overview

Pressograph is a comprehensive solution for creating, managing, and sharing pressure test graphs. Built with modern web technologies, it provides a powerful yet intuitive interface for visualizing hydraulic pressure tests over time.

## Key Features

### 🎨 Professional Visualization
- Generate high-quality pressure test graphs
- Support for multiple pressure levels and complex test scenarios
- Customizable display options and formatting
- Export to PNG and PDF formats

### 🔗 Shareable Links
- Create public share links without authentication
- Configure expiration times and view limits
- Control download permissions
- Track view analytics

### 🔐 Secure Authentication
- JWT-based authentication system
- Role-based access control (Admin, User, Viewer)
- API key support for programmatic access
- Secure refresh token rotation

### 📊 Admin Dashboard
- User management and permissions
- Usage analytics and statistics
- System configuration
- Audit logging

### 🚀 RESTful API
- Comprehensive REST API for automation
- OpenAPI 3.0 specification
- Rate limiting and quotas
- Webhook support (coming soon)

## Quick Links

- [Installation Guide](getting-started/installation.md)
- [API Reference](api/overview.md)
- [Release Notes](release-notes.md)
- [Roadmap](TODO.md)

## Technology Stack

- **Frontend**: React 19.2.0, TypeScript 5.9, Vite 7.1.12, HeroUI 2.8.5, Tailwind CSS 4.1.16
- **Backend**: Node.js 24 LTS, Next.js 16.0, TypeScript 5.9, PostgreSQL 18.0, Valkey 9
- **Deployment**: Podman, Docker-compatible compose
- **Documentation**: MkDocs Material

## System Requirements

- Node.js 24+ (Container Runtime - provided by node:lts-trixie base image)
- PostgreSQL 18+ (Database)
- Valkey 9+ (Cache)
- Podman or Docker (Container Runtime)
- Modern web browser with ES2020 support
- **Note**: All development happens inside the container via `task dev:enter`

## Support

- [GitHub Issues](https://github.com/dantte-lp/pressograph/issues)
- [API Documentation](api/overview.md)
- [Installation Guide](getting-started/installation.md)

## License

This project is licensed under the MIT License. See the LICENSE file for details.

---

**Getting Started?** Head over to the [Installation Guide](getting-started/installation.md) to begin.

# Release Notes

## Version 1.0.2 - Setup Improvements & Build Optimization (2025-10-28)

### 🔧 Setup & Database

**New Features:**
- Added database size display in Setup page Database Schema section
- Added schema version display in Setup page (tracks database migration version)
- Enhanced setup status endpoint to return database size (`pg_size_pretty`) and schema version

**Fixed Issues:**
- Fixed initialization error when database tables already exist but are empty
- Fixed migration logic to only run when tables don't exist (prevents "relation already exists" error)
- Improved initialization flow: check connection → check tables → run migrations only if needed

### 🏗️ Build System

**Container Changes:**
- Migrated backend Dockerfile from `node:22-alpine` to `node:22-trixie-slim` for consistency
- Updated package manager from `apk` (Alpine) to `apt-get` (Debian)
- Updated user creation commands to use Debian syntax (`groupadd`/`useradd` instead of `addgroup`/`adduser`)
- Changed to buildah-based builds (using `buildah bud`) instead of `podman build`

**Technical Details:**
- Backend: `/opt/projects/repositories/pressure-test-visualizer/server/Dockerfile`
  - Multi-stage build now uses `node:22-trixie-slim` in both stages
  - Proper cleanup of apt lists to reduce image size: `rm -rf /var/lib/apt/lists/*`
- Frontend: `/opt/projects/repositories/pressure-test-visualizer/deploy/Containerfile`
  - Already using `node:22-trixie-slim` and `nginx:1.29-trixie-perl`

### 📊 API Changes

**Setup Endpoint Enhancements:**
- `GET /api/v1/setup/status` now returns:
  - `schema.size` - Database size in human-readable format (e.g., "9110 kB")
  - `schema.version` - Current schema version from app_settings table

**Example Response:**
```json
{
  "success": true,
  "initialized": true,
  "userCount": 1,
  "database": { ... },
  "schema": {
    "tables": [...],
    "tableCount": 7,
    "totalRows": 5,
    "size": "9110 kB",
    "version": "initial"
  }
}
```

### 🎨 UI Changes

**Setup Page:**
- Database Schema section now displays information in 2x2 grid:
  - Tables count
  - Total rows
  - **Database size** (new)
  - **Schema version** (new)

### 🛠️ Technical Changes

**Files Modified:**
- `server/src/controllers/setup.controller.ts` - Added database size and schema version queries
- `src/pages/Setup.tsx` - Added UI display for database size and schema version
- `server/Dockerfile` - Migrated from Alpine to Debian Trixie base image

**Build Process:**
- Containers now built with `buildah bud` command
- Frontend: `buildah bud -t pressograph-frontend:latest -f deploy/Containerfile --build-arg VITE_API_URL=/api .`
- Backend: `buildah bud -t pressograph-backend:latest -f server/Dockerfile server/`

### 📝 Known Issues

None currently reported.

---

## Version 1.0.1 - UI Improvements & Authentication (2025-10-28)

### 🎨 UI/UX Improvements

**Fixed Issues:**
- Fixed Select component text visibility in both dark and light themes
- Fixed Russian text appearing in EN language mode for Test Parameters and Intermediate Pressure Tests sections
- Fixed text spacing in test summary (missing space before "МПа" unit)
- Fixed missing translations for section headers, field labels, and units across all components

**Component Updates:**
- Replaced language and theme toggle buttons with HeroUI Switch components for better UX
- Changed time input format to 24-hour format (removed AM/PM)
- Enhanced visual hierarchy with proper translation keys

**New Translations (28 keys added):**
- Section headers (generalInformation, timeParameters, pressureParameters, displaySettings, etc.)
- Test field labels (testPressure, minPressure, maxPressure, targetPressure, holdDrift)
- Units (unitHours, unitMinutes, unitMPa)
- Action labels (duplicate, delete, optional, defaultValue)

### 🔐 Authentication System

**New Features:**
- Created authentication store (useAuthStore) with Zustand + localStorage persistence
- Implemented user session management (login, logout, token storage)
- Added role-based access control (admin, user, viewer)

**Navigation Changes:**
- Removed registration button from navigation menu (private project)
- Implemented conditional rendering for login/logout buttons based on authentication state
- Added user profile dropdown with account information and logout option
- Help link now always visible in navigation
- History and Admin links visible only for authenticated users
- Admin link visible only for users with admin role

**New Pages:**
- `/login` - Professional login page with gradient background and error handling
- Reorganized app structure with React Router for multi-page navigation

### 🛠️ Technical Changes

**Dependencies:**
- Added `react-router-dom` for client-side routing

**Project Structure:**
- Created `/src/pages` directory for page components
- Created `/src/store/useAuthStore.ts` for authentication state management
- Refactored App.tsx to use BrowserRouter and Routes
- Created HomePage component (extracted from App.tsx)

**Translation Files Updated:**
- `src/i18n/locales/en.ts` - Added 28 new translation keys
- `src/i18n/locales/ru.ts` - Added 28 new translation keys

**Components Updated:**
- `TestParametersForm.tsx` - All hardcoded text replaced with translation keys
- `PressureTestsList.tsx` - All hardcoded text replaced with translation keys
- `LanguageToggle.tsx` - Replaced Button with Switch component
- `ThemeToggle.tsx` - Replaced Button with Switch component
- `NavBar.tsx` - Added authentication-based conditional rendering

### 📝 Known Issues

None currently reported.

---

## Version 1.0.0 - Initial Release (2025-10-28)

### 🎉 First Public Release

This is the initial release of Pressograph - a professional pressure test visualization platform.

### ✨ Features

#### Graph Generation
- **Complex Pressure Test Support**: Create graphs with multiple pressure levels (0-70 MPa)
- **Controlled Pressure Drift**: Define intermediate pressure holds between tests
- **Multiple Test Scenarios**: Support for 24+ hour tests spanning multiple days
- **Flexible Test Parameters**: Configure individual pressure, duration, drift, and target values
- **Professional Visualization**: High-quality graph rendering with customizable display options

#### User Interface
- **Modern Design System**: Built with HeroUI 2.8.5 and Tailwind CSS 4.1.16
- **Dual Language Support**: Full Russian and English translations
- **Dark/Light Theme**: Professional theme switcher with system preference detection
- **Responsive Layout**: Works seamlessly on desktop and mobile devices
- **localStorage Persistence**: Settings automatically saved across sessions

#### Template Presets
- **Daily Test Preset**: Quick setup for 24-hour daily tests
- **Extended Test Preset**: 48-hour test configuration
- **Custom Configuration**: Full manual control over all parameters
- **Quick Interval Templates**: Pre-configured test intervals (0.5h, 1h, 2h, 4h, 6h, 12h)

#### Backend API
- **RESTful API**: Comprehensive REST API with Express.js 4.18.2
- **JWT Authentication**: Secure authentication with access/refresh tokens
- **Role-Based Access Control**: Admin, User, and Viewer roles
- **PostgreSQL 18.0 Database**: High-performance database with JSONB support
- **API Rate Limiting**: Protection against abuse
- **Audit Logging**: Complete activity tracking

#### Public Sharing
- **Shareable Links**: Generate unique public links for graphs
- **Access Control**: Configure expiration times and view limits
- **Download Permissions**: Control whether downloads are allowed
- **View Analytics**: Track share link usage

#### Documentation
- **OpenAPI 3.0 Specification**: Complete API documentation
- **Swagger UI**: Interactive API explorer at `/api-docs`
- **Automatic Generation**: OpenAPI spec generated from code annotations
- **MkDocs Documentation**: Professional documentation site
- **Installation Guide**: Step-by-step setup instructions

#### DevOps
- **Podman Compose**: Production-ready containerization
- **PostgreSQL Optimization**: Performance-tuned database configuration
- **Health Checks**: Built-in health monitoring endpoints
- **Graceful Shutdown**: Proper cleanup on server termination
- **Logging**: Winston-based structured logging

### 🗄️ Database

#### Schema
- Users table with role-based access
- Refresh tokens with automatic cleanup
- Graph generation history
- Public share links
- Audit log
- API keys (for future API access)
- Application settings

#### Extensions
- `uuid-ossp` - UUID generation
- `pg_trgm` - Trigram text search
- `pg_stat_statements` - Query statistics
- `btree_gin` - GIN index support
- `btree_gist` - GIST index support

### 📊 Performance

- **Optimized Database**: Configured for mixed read/write workload
- **Connection Pooling**: pg pool with proper resource management
- **Indexed Queries**: Strategic indexes on frequently queried columns
- **JSONB Storage**: Efficient storage of test settings
- **Parallel Queries**: PostgreSQL parallel execution enabled

### 🔒 Security

- **Password Hashing**: bcrypt with salt rounds
- **JWT Tokens**: Secure token-based authentication
- **Token Rotation**: Refresh token rotation on use
- **CORS Protection**: Configurable allowed origins
- **Helmet.js**: Security headers middleware
- **Rate Limiting**: Request throttling per endpoint
- **Input Validation**: express-validator for all inputs

### 🌐 API Endpoints

#### Authentication
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/logout` - User logout
- `GET /api/v1/auth/me` - Get current user

#### Graphs
- `POST /api/v1/graph/generate` - Generate graph
- `POST /api/v1/graph/export/png` - Export PNG (planned)
- `POST /api/v1/graph/export/pdf` - Export PDF (planned)
- `POST /api/v1/graph/validate` - Validate settings
- `GET /api/v1/graph/history` - Generation history
- `POST /api/v1/graph/share` - Create share link

#### Public (No Auth)
- `GET /api/v1/public/share/:token` - View shared graph
- `GET /api/v1/public/share/:token/download` - Download graph
- `GET /api/v1/public/share/:token/info` - Share link info

#### Admin
- `GET /api/v1/admin/dashboard` - Dashboard data
- `GET /api/v1/admin/users` - List users
- Admin user management endpoints

### 🛠️ Technical Stack

**Frontend:**
- React 19.2.0
- TypeScript 5.8.0
- Vite 7.1.12
- HeroUI 2.8.5
- Tailwind CSS 4.1.16
- Zustand (state management)
- i18next (internationalization)

**Backend:**
- Node.js 22.19.0
- Express.js 4.18.2
- TypeScript 5.3.3
- PostgreSQL 18.0
- JWT authentication
- Winston logging
- Swagger JSDoc

**DevOps:**
- Podman Compose
- PostgreSQL 18.0-bookworm
- Multi-stage Dockerfiles
- Health checks
- Volume management

### 📝 Known Limitations

- PNG export not yet implemented (backend)
- PDF export not yet implemented (backend)
- User registration disabled (private project)
- No webhook support yet
- No SDK libraries yet

### 🔄 Migration Notes

This is the initial release - no migrations required.

### 📚 Documentation

- [Installation Guide](getting-started/installation.md)
- [Quick Start](getting-started/quickstart.md)
- [API Reference](api/overview.md)
- [Admin Guide](admin/dashboard.md)

### 🙏 Credits

Built with ❤️ by the Pressograph team.

Special thanks to:
- React team for React 19
- NextUI team for HeroUI
- Tailwind Labs for Tailwind CSS
- PostgreSQL Global Development Group

### 📄 License

MIT License - See LICENSE file for details

---

## Upcoming Releases

### Version 1.1.0 (Planned)

- Backend PNG/PDF export implementation
- Webhook support
- Real-time graph updates (WebSocket)
- Batch graph generation API
- Advanced analytics dashboard
- Email notifications for share links
- GraphQL API (experimental)

### Version 1.2.0 (Planned)

- Multi-tenant support
- Custom branding
- Advanced reporting
- Data export (CSV, Excel)
- Integration with external systems
- Mobile app (React Native)

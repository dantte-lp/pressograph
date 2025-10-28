# Release Notes

This document provides an overview of all Pressograph releases. For detailed release notes, see the individual release files in the [releases](releases/) directory.

## Latest Release

### [v1.0.0 - Initial Production Release](releases/v1.0.0.md) (2025-10-28)

First production release of Pressograph with full-stack implementation.

**Highlights:**
- ⚡ Modern Stack: React 19, TypeScript 5.7, Node.js 22, PostgreSQL 18
- 🎨 Dark/Light Theme with persistent settings
- 📊 Canvas-based high-resolution graph rendering
- 📤 Export to PNG (4K), PDF (A4), JSON
- 🔐 JWT authentication with role-based access control
- 🐳 Podman pod deployment infrastructure
- 🌐 Multi-language support (Russian/English)

[View Full Release Notes →](releases/v1.0.0.md)

---

## Previous Releases

### [v1.0.2 - Setup Improvements & Build Optimization](releases/v1.0.2.md) (2025-10-28)

Patch release with database initialization improvements and Dockerfile migration to Debian.

**Key Changes:**
- Fixed initialization error when tables already exist
- Migrated backend from Alpine to Debian Trixie
- Added database size and schema version display
- Enhanced setup status endpoint

[View Full Release Notes →](releases/v1.0.2.md)

### [v1.0.1 - UI Improvements & Authentication](releases/v1.0.1.md) (2025-10-28)

Minor release adding authentication system and UI enhancements.

**Key Changes:**
- Implemented JWT authentication with role-based access
- Fixed Select component visibility in dark/light themes
- Added 28 new translation keys
- Replaced toggle buttons with HeroUI Switch components
- Created login page and navigation structure

[View Full Release Notes →](releases/v1.0.1.md)

---

## Release Types

- **MAJOR** - Breaking changes, significant new features
- **MINOR** - New features, backward-compatible
- **PATCH** - Bug fixes, minor improvements

## Upcoming Releases

### Version 1.1.0 (Planned)

**Planned Features:**
- Backend PNG/PDF export implementation
- Webhook support
- Real-time graph updates (WebSocket)
- Batch graph generation API
- Advanced analytics dashboard
- Email notifications for share links
- GraphQL API (experimental)

### Version 1.2.0 (Planned)

**Planned Features:**
- Multi-tenant support
- Custom branding
- Advanced reporting
- Data export (CSV, Excel)
- Integration with external systems
- Mobile app (React Native)

---

## Version History

| Version | Release Date | Type | Status |
|---------|--------------|------|--------|
| [v1.0.0](releases/v1.0.0.md) | 2025-10-28 | MAJOR | ✅ Production |
| [v1.0.1](releases/v1.0.1.md) | 2025-10-28 | MINOR | ✅ Production |
| [v1.0.2](releases/v1.0.2.md) | 2025-10-28 | PATCH | ✅ Production |

---

## Resources

- [GitHub Releases](https://github.com/dantte-lp/pressograph/releases)
- [Full Changelog](https://github.com/dantte-lp/pressograph/commits/master)
- [Issue Tracker](https://github.com/dantte-lp/pressograph/issues)
- [Roadmap](TODO.md)

## Contributing

For guidelines on reporting issues and suggesting features, see our [GitHub Issues](https://github.com/dantte-lp/pressograph/issues) page.

---

**Last Updated:** 2025-10-28

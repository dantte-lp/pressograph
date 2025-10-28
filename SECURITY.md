# Security Policy

## Supported Versions

We release patches for security vulnerabilities in the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take the security of Pressograph seriously. If you believe you have found a security vulnerability, please report it to us as described below.

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, please report them via email to:
- **Email**: pavel.lavrukhin@infra4.dev
- **Subject**: [SECURITY] Brief description of the issue

You should receive a response within 48 hours. If for some reason you do not, please follow up via email to ensure we received your original message.

Please include the following information in your report:

- Type of issue (e.g., SQL injection, XSS, authentication bypass, etc.)
- Full paths of source file(s) related to the manifestation of the issue
- The location of the affected source code (tag/branch/commit or direct URL)
- Any special configuration required to reproduce the issue
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit it

This information will help us triage your report more quickly.

## Preferred Languages

We prefer all communications to be in English or Russian.

## Security Update Process

1. **Report Reception**: Security reports are received and acknowledged within 48 hours
2. **Assessment**: The security team assesses the vulnerability and determines severity
3. **Fix Development**: A fix is developed and tested in a private repository
4. **Coordinated Disclosure**:
   - Critical vulnerabilities: Patch released within 7 days
   - High severity: Patch released within 14 days
   - Medium/Low severity: Patch released in next regular update
5. **Public Disclosure**: After the patch is released, the vulnerability is disclosed publicly

## Security Best Practices

When deploying Pressograph in production:

### Authentication & Authorization
- Change default admin credentials immediately after initialization
- Use strong passwords (minimum 12 characters, mixed case, numbers, symbols)
- Enable JWT token rotation
- Configure appropriate session timeouts
- Restrict admin panel access to trusted networks

### Database Security
- Use strong PostgreSQL passwords
- Isolate database in a private network
- Enable PostgreSQL SSL connections
- Regularly backup database with encryption
- Implement database connection pooling limits

### Network Security
- Deploy behind a reverse proxy (nginx, Traefik, Caddy)
- Use HTTPS/TLS for all connections (Let's Encrypt recommended)
- Configure CORS appropriately for your domain
- Implement rate limiting to prevent abuse
- Use firewall rules to restrict database access

### Application Security
- Keep all dependencies up to date (`npm audit`)
- Set `NODE_ENV=production` in production
- Configure appropriate `ALLOWED_ORIGINS`
- Disable debug/development features
- Implement comprehensive logging and monitoring

### Container Security
- Run containers as non-root user (already configured)
- Use minimal base images (we use debian-trixie-slim)
- Regularly update container images
- Scan images for vulnerabilities (`podman scan` or Trivy)
- Limit container resources (CPU, memory)

### Environment Variables
- Never commit `.env` files to version control
- Use secrets management (Vault, Docker Secrets, etc.)
- Rotate JWT secrets regularly
- Use different secrets for dev/staging/production

## Security Features

Pressograph includes the following security features:

### Built-in Protection
- ✅ bcrypt password hashing (salt rounds: 10)
- ✅ JWT authentication with access/refresh tokens
- ✅ Token expiration and rotation
- ✅ Role-based access control (RBAC)
- ✅ Helmet.js security headers
- ✅ CORS protection
- ✅ SQL injection prevention (parameterized queries)
- ✅ XSS protection
- ✅ Input validation and sanitization
- ✅ Rate limiting per endpoint
- ✅ Audit logging for all actions
- ✅ Non-root container user

### Database Security
- ✅ PostgreSQL 18 with latest security patches
- ✅ Parameterized queries (pg-pool)
- ✅ Connection pooling with limits
- ✅ Database user isolation
- ✅ Prepared statements

### API Security
- ✅ Authentication required for sensitive endpoints
- ✅ API key support for programmatic access
- ✅ Request size limits
- ✅ JSON schema validation
- ✅ Error message sanitization

## Known Security Considerations

### Share Links
- Share links are public by default (no authentication required)
- Consider implementing:
  - Expiration times
  - View count limits
  - IP-based access restrictions (future feature)

### Admin Panel
- Admin panel is accessible to all authenticated admin users
- Consider implementing:
  - 2FA for admin accounts (future feature)
  - Admin action approval workflow (future feature)
  - Separate admin network access

### API Keys
- API keys are stored as hashes in the database
- Keys are visible only once during creation
- Consider implementing:
  - Key rotation reminders
  - Key usage monitoring
  - Anomaly detection (future feature)

## Compliance

Pressograph is designed with security best practices in mind, but compliance with specific regulations (GDPR, HIPAA, SOC 2, etc.) depends on your deployment configuration and usage.

For compliance assistance, please contact: pavel.lavrukhin@infra4.dev

## Security Checklist for Production

Before deploying to production, ensure:

- [ ] Changed default admin password
- [ ] Configured strong JWT_SECRET
- [ ] Enabled HTTPS/TLS
- [ ] Set NODE_ENV=production
- [ ] Configured ALLOWED_ORIGINS
- [ ] Isolated database in private network
- [ ] Enabled database SSL
- [ ] Configured firewall rules
- [ ] Set up regular backups
- [ ] Implemented monitoring and alerting
- [ ] Reviewed and tested rate limits
- [ ] Configured proper logging
- [ ] Scanned containers for vulnerabilities
- [ ] Reviewed all environment variables
- [ ] Set up intrusion detection (recommended)

## Contact

For security-related inquiries:
- **Security Email**: pavel.lavrukhin@infra4.dev
- **PGP Key**: Available upon request
- **Bug Bounty**: Not currently available

## Attribution

We appreciate responsible disclosure. Security researchers who report valid vulnerabilities will be credited in our security advisories (unless they prefer to remain anonymous).

## Updates

This security policy was last updated: 2025-10-28

We may update this policy from time to time. Please check back regularly for the latest version.

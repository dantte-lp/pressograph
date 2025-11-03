# Contributing to Pressograph

Thank you for your interest in contributing to Pressograph! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [How to Contribute](#how-to-contribute)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Testing](#testing)
- [Documentation](#documentation)

## Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inspiring community for all. Please be respectful and constructive in all interactions.

### Expected Behavior

- Use welcoming and inclusive language
- Be respectful of differing viewpoints and experiences
- Gracefully accept constructive criticism
- Focus on what is best for the community
- Show empathy towards other community members

### Unacceptable Behavior

- Trolling, insulting/derogatory comments, and personal or political attacks
- Public or private harassment
- Publishing others' private information without permission
- Other conduct which could reasonably be considered inappropriate

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR-USERNAME/pressograph.git
   cd pressograph
   ```
3. **Add upstream remote**:
   ```bash
   git remote add upstream https://github.com/dantte-lp/pressograph.git
   ```
4. **Create a branch** for your changes:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development Setup

### Prerequisites

- **Podman** or Docker
- **Podman Compose** or Docker Compose
- **Node.js 22** (for local development)
- **PostgreSQL 18** (if not using containers)

### Local Development with Containers

```bash
# Start development environment
make dev

# Access at http://localhost:5173 (frontend) and http://localhost:3001 (backend)
```

### Local Development without Containers

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd server && npm install && cd ..

# Start PostgreSQL (adjust connection in .env)
# Create .env file based on .env.example

# Run migrations
cd server && npm run migrate && cd ..

# Start backend (in one terminal)
cd server && npm run dev

# Start frontend (in another terminal)
npm run dev
```

## How to Contribute

### Reporting Bugs

Before creating bug reports, please check existing issues. When creating a bug report, include:

- **Clear title and description**
- **Steps to reproduce** the issue
- **Expected behavior** vs **actual behavior**
- **Screenshots** if applicable
- **Environment details**:
  - OS and version
  - Node.js version
  - Browser (for frontend issues)
  - Podman/Docker version

**Bug Report Template**:

```markdown
### Bug Description

[Clear description of the bug]

### Steps to Reproduce

1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

### Expected Behavior

[What you expected to happen]

### Actual Behavior

[What actually happened]

### Screenshots

[If applicable]

### Environment

- OS: [e.g. Ubuntu 22.04]
- Node.js: [e.g. 22.19.0]
- Browser: [e.g. Chrome 120]
- Version: [e.g. 1.0.2]
```

### Suggesting Features

Feature suggestions are welcome! Please:

1. **Check existing feature requests** first
2. **Provide a clear use case** for the feature
3. **Explain the expected behavior**
4. **Consider implementation complexity**

**Feature Request Template**:

```markdown
### Feature Description

[Clear description of the feature]

### Use Case

[Why is this feature needed? What problem does it solve?]

### Proposed Solution

[How would you like to see this implemented?]

### Alternatives Considered

[What other solutions did you consider?]

### Additional Context

[Any other relevant information]
```

### Submitting Changes

1. **Update your fork** with latest upstream:

   ```bash
   git fetch upstream
   git checkout master
   git merge upstream/master
   ```

2. **Create a feature branch**:

   ```bash
   git checkout -b feature/amazing-feature
   ```

3. **Make your changes** following our coding standards

4. **Test your changes** thoroughly

5. **Commit your changes** with clear messages

6. **Push to your fork**:

   ```bash
   git push origin feature/amazing-feature
   ```

7. **Create a Pull Request** on GitHub

## Coding Standards

### TypeScript/JavaScript

- **Use TypeScript** for all new code
- **Follow existing code style** (check `.eslintrc`)
- **Use meaningful variable names**
- **Add JSDoc comments** for public APIs
- **Prefer functional programming** patterns
- **Avoid `any` types** - use proper typing

**Example**:

```typescript
/**
 * Generates pressure test data points
 * @param settings - Test configuration settings
 * @returns Array of data points with time and pressure values
 */
export function generatePressureData(settings: TestSettings): DataPoint[] {
  // Implementation
}
```

### React Components

- **Use functional components** with hooks
- **Extract reusable logic** into custom hooks
- **Keep components small** and focused
- **Use TypeScript interfaces** for props
- **Implement proper error boundaries**

**Example**:

```typescript
interface TestFormProps {
  onSubmit: (data: TestData) => void;
  initialValues?: TestData;
}

export const TestForm: React.FC<TestFormProps> = ({ onSubmit, initialValues }) => {
  // Implementation
};
```

### Backend API

- **Use Express Router** for route organization
- **Implement proper error handling**
- **Validate all inputs** with express-validator
- **Use async/await** for asynchronous code
- **Add OpenAPI documentation** for all endpoints

**Example**:

```typescript
/**
 * @openapi
 * /api/v1/graph/generate:
 *   post:
 *     summary: Generate pressure test graph
 *     tags: [Graph]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/GraphSettings'
 */
router.post(
  '/generate',
  authenticate,
  [body('testNumber').notEmpty(), body('pressure').isNumeric()],
  validate,
  graphController.generate
);
```

### CSS/Styling

- **Use Tailwind CSS** utilities first
- **Follow mobile-first** approach
- **Maintain dark mode** compatibility
- **Use HeroUI components** when possible
- **Avoid custom CSS** unless necessary

### Database

- **Use parameterized queries** always
- **Create migrations** for schema changes
- **Add appropriate indexes**
- **Document schema changes** in migration files
- **Use transactions** for multi-step operations

## Commit Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/):

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `ci`: CI/CD changes

### Examples

```bash
feat(graph): add support for multi-day pressure tests

- Implement date range handling
- Add visualization for tests spanning multiple days
- Update graph canvas renderer

Closes #123
```

```bash
fix(auth): resolve token expiration issue

The refresh token was not being properly validated,
causing premature session expiration.

Fixes #456
```

```bash
docs(api): update OpenAPI spec for v1.1

- Add new graph export endpoints
- Document share link parameters
- Fix typos in authentication section
```

## Pull Request Process

### Before Submitting

1. **Update documentation** if needed
2. **Add tests** for new features
3. **Ensure all tests pass**: `npm test`
4. **Run linter**: `npm run lint`
5. **Build successfully**: `npm run build`
6. **Update CHANGELOG.md** if applicable

### PR Title Format

Use conventional commit format:

```
feat(scope): add amazing feature
fix(scope): resolve critical bug
```

### PR Description Template

```markdown
## Description

[Clear description of changes]

## Type of Change

- [ ] Bug fix (non-breaking change that fixes an issue)
- [ ] New feature (non-breaking change that adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Testing

- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Screenshots (if applicable)

[Add screenshots for UI changes]

## Checklist

- [ ] My code follows the project's code style
- [ ] I have performed a self-review
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have updated the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix/feature works
- [ ] New and existing unit tests pass locally
- [ ] Any dependent changes have been merged

## Related Issues

Closes #[issue number]
```

### Review Process

1. **Automated checks** must pass (linting, tests, build)
2. **At least one approval** required from maintainers
3. **Address review feedback** promptly
4. **Keep PR focused** - one feature/fix per PR
5. **Rebase if needed** to keep history clean

### After Approval

1. **Squash commits** if requested
2. **Update branch** with latest master
3. **Wait for maintainer** to merge

## Testing

### Running Tests

```bash
# Frontend tests
npm test

# Backend tests
cd server && npm test

# E2E tests (if available)
npm run test:e2e

# Coverage report
npm run test:coverage
```

### Writing Tests

- **Write tests** for all new features
- **Update tests** when modifying existing code
- **Aim for >80% coverage** on new code
- **Test edge cases** and error conditions

**Example**:

```typescript
describe('generatePressureData', () => {
  it('should generate correct number of data points', () => {
    const settings: TestSettings = {
      duration: 60,
      interval: 1,
      pressure: 10,
    };

    const result = generatePressureData(settings);

    expect(result).toHaveLength(61); // 0 to 60 inclusive
  });

  it('should handle zero duration', () => {
    const settings: TestSettings = {
      duration: 0,
      interval: 1,
      pressure: 10,
    };

    const result = generatePressureData(settings);

    expect(result).toHaveLength(1);
  });
});
```

## Documentation

### Code Documentation

- **Add JSDoc comments** for public functions
- **Document complex logic** with inline comments
- **Update README.md** for significant changes
- **Maintain API documentation** in OpenAPI spec

### User Documentation

Documentation is located in the `docs/` directory:

- `docs/getting-started/` - Installation and quick start guides
- `docs/user-guide/` - User tutorials and guides
- `docs/api/` - API reference documentation
- `docs/admin/` - Administrative documentation
- `docs/development/` - Developer documentation

When adding features:

1. **Update relevant user guide** sections
2. **Add API documentation** for new endpoints
3. **Include code examples**
4. **Add screenshots** for UI features

## Project Structure

```
pressograph/
├── src/                    # Frontend source code
│   ├── components/         # React components
│   ├── pages/              # Page components
│   ├── store/              # Zustand stores
│   ├── utils/              # Utility functions
│   ├── types/              # TypeScript types
│   └── i18n/               # Translations
├── server/                 # Backend source code
│   ├── src/
│   │   ├── controllers/    # Request handlers
│   │   ├── routes/         # Route definitions
│   │   ├── middleware/     # Express middleware
│   │   ├── config/         # Configuration
│   │   └── utils/          # Utility functions
│   └── migrations/         # Database migrations
├── docs/                   # Documentation
├── deploy/                 # Deployment configurations
│   ├── compose/            # Docker Compose files
│   ├── Containerfile       # Frontend Dockerfile
│   └── nginx.conf          # Nginx configuration
└── tests/                  # Test files

## Questions?

- **GitHub Issues**: [Create an issue](https://github.com/dantte-lp/pressograph/issues)
- **Discussions**: [Start a discussion](https://github.com/dantte-lp/pressograph/discussions)
- **Email**: pavel.lavrukhin@infra4.dev

## License

By contributing to Pressograph, you agree that your contributions will be licensed under the MIT License.

## Thank You!

Your contributions make Pressograph better for everyone. We appreciate your time and effort! 🎉
```

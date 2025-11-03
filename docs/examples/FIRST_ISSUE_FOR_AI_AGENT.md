# First Issue Template for AI Agent

**Purpose**: Ready-to-use first issue that demonstrates full AI agent workflow
**Complexity**: 3 story points (1 day)
**Type**: Feature
**Risk**: Low

---

## Issue Template (Copy-Paste to GitHub)

````markdown
# Add Health Check Endpoint Enhancement

**Type**: Feature
**Story Points**: 3
**Sprint**: Current Sprint
**Priority**: Medium
**Estimated Time**: 1 day

## User Story

As a DevOps engineer, I want the /health endpoint to return detailed service status so that I can monitor application health more effectively.

## Problem Context

Currently, the `/health` endpoint returns a simple OK response. For production monitoring and alerting, we need more detailed information about service health including:

- Service identification (name, version)
- Overall health status
- Database connectivity
- Timestamp for monitoring staleness

## Acceptance Criteria

- [ ] Endpoint returns JSON with service name, version, status, timestamp
- [ ] Endpoint checks database connectivity (simple SELECT 1 query)
- [ ] Endpoint returns 200 HTTP status if healthy, 503 if unhealthy
- [ ] Unit tests cover all scenarios (healthy, unhealthy, edge cases)
- [ ] Integration test verifies endpoint end-to-end
- [ ] Documentation updated in README and API docs
- [ ] Logging added for health check failures

## Technical Details

**File to Modify**: `server/src/routes/health.ts`

**Current Implementation**:

```typescript
router.get('/health', (req, res) => {
  res.json({ status: 'OK' });
});
```
````

**Desired Implementation**:

```typescript
router.get('/health', async (req, res) => {
  // Check database connectivity
  // Return detailed status
  // Log failures
});
```

**Response Format**:

```json
{
  "service": "pressograph",
  "version": "1.2.0",
  "status": "healthy" | "unhealthy",
  "timestamp": "2025-11-01T10:30:00.000Z",
  "database": "connected" | "disconnected"
}
```

**Database Check**:

- Use simple `SELECT 1` query for speed (<100ms)
- Add 5-second timeout to prevent hanging
- Log failures at WARN level

**HTTP Status Codes**:

- 200: All systems healthy
- 503: Service Unavailable (database unreachable or other critical failure)

**Testing Requirements**:

- Unit tests for healthy state (200 response)
- Unit tests for unhealthy state (503 response)
- Unit tests for all response fields
- Integration test for end-to-end flow
- Edge case: Database timeout
- Edge case: Database connection failure

## Dependencies

- None - This is a self-contained enhancement

## Risks

- Low risk - Non-critical monitoring feature
- No breaking changes to existing functionality
- Limited blast radius if bugs occur

## Definition of Done

**Code Quality**:

- [ ] Code follows style guide (ESLint, Prettier)
- [ ] No TypeScript errors (strict mode)
- [ ] No linting errors or warnings
- [ ] Code is self-documenting with clear variable names
- [ ] Complex logic has explanatory comments
- [ ] No commented-out code
- [ ] No console.log statements (use logger)
- [ ] No hardcoded values (use constants or environment variables)

**Testing**:

- [ ] Unit tests written for new functionality
- [ ] All tests passing (`npm test`)
- [ ] Test coverage ≥60% overall
- [ ] Edge cases covered (database down, timeout)
- [ ] Error conditions tested

**Code Review**:

- [ ] Pull request created and linked to this issue
- [ ] Self-reviewed before requesting review
- [ ] At least one team member reviewed and approved
- [ ] All review comments addressed or discussed
- [ ] No unresolved conversations

**Documentation**:

- [ ] README updated (if needed)
- [ ] API documentation updated (JSDoc/Swagger)
- [ ] Inline code comments for complex logic
- [ ] CHANGELOG.md updated with changes

**Internationalization (i18n)**:

- [ ] N/A (backend API endpoint, no UI text)

**Accessibility (WCAG 2.1 AA)**:

- [ ] N/A (backend API endpoint)

**Performance**:

- [ ] Health check responds in <100ms (normal case)
- [ ] Timeout configured (5 seconds max)
- [ ] No memory leaks
- [ ] No performance regression

**Security**:

- [ ] No sensitive data in code (no passwords, tokens, etc.)
- [ ] Input validation implemented (N/A - no input)
- [ ] XSS vulnerabilities prevented (N/A - JSON API)
- [ ] Dependencies checked for vulnerabilities (`npm audit`)

**Acceptance**:

- [ ] All acceptance criteria met
- [ ] Product Owner reviewed and approved
- [ ] Edge cases handled gracefully
- [ ] Error messages clear and actionable

**Deployment & Integration**:

- [ ] Code merged to main branch
- [ ] CI/CD pipeline passing (all checks green)
- [ ] Deployed to staging environment
- [ ] Smoke tests passed on staging

**Cleanup**:

- [ ] No dead code remaining
- [ ] Temporary files removed
- [ ] Debug code removed
- [ ] Git branch deleted after merge

## Implementation Guidance

**Recommended Approach (TDD)**:

1. **Write tests first**:

   ```typescript
   // tests/health.test.ts
   describe('GET /health', () => {
     it('should return 200 when healthy', async () => {
       const response = await request(app).get('/health');
       expect(response.status).toBe(200);
     });

     it('should return detailed health info', async () => {
       const response = await request(app).get('/health');
       expect(response.body).toHaveProperty('service', 'pressograph');
       expect(response.body).toHaveProperty('version');
       expect(response.body).toHaveProperty('status', 'healthy');
       expect(response.body).toHaveProperty('timestamp');
       expect(response.body).toHaveProperty('database', 'connected');
     });

     it('should return 503 when database is down', async () => {
       jest.spyOn(db, 'query').mockRejectedValue(new Error('Connection failed'));
       const response = await request(app).get('/health');
       expect(response.status).toBe(503);
       expect(response.body.database).toBe('disconnected');
     });
   });
   ```

2. **Run tests** (verify they fail)

3. **Implement feature**:

   ```typescript
   import { Router } from 'express';
   import { db } from '../db';
   import { logger } from '../utils/logger';
   import packageJson from '../../package.json';

   router.get('/health', async (req, res) => {
     let databaseStatus = 'connected';
     let httpStatus = 200;
     let overallStatus = 'healthy';

     try {
       await db.query('SELECT 1', [], { timeout: 5000 });
     } catch (error) {
       databaseStatus = 'disconnected';
       httpStatus = 503;
       overallStatus = 'unhealthy';
       logger.warn('Health check failed: Database unreachable', { error: error.message });
     }

     res.status(httpStatus).json({
       service: 'pressograph',
       version: packageJson.version,
       status: overallStatus,
       timestamp: new Date().toISOString(),
       database: databaseStatus,
     });
   });
   ```

4. **Run tests** (verify they pass)

5. **Refactor** (if needed)

**Estimated Breakdown**:

- Setup and planning: 30 min
- Write tests (TDD): 1 hour
- Implement feature: 1 hour
- Documentation: 30 min
- Code review and polish: 1 hour
- **Total**: ~4 hours

## References

- **AI Agent Instructions**: `/opt/projects/repositories/project-genesis/docs/scrum/AI_AGENT_INSTRUCTIONS.md`
- **Definition of Done**: `/opt/projects/repositories/project-genesis/docs/scrum/DEFINITION_OF_DONE.md`
- **Testing Guide**: `/opt/projects/repositories/pressograph/docs/server/TESTING.md`
- **API Documentation**: `/opt/projects/repositories/pressograph/docs/api/overview.md`

## Questions?

If anything is unclear:

1. Comment on this issue with your question
2. Tag @product-owner or @scrum-master
3. Add `needs-discussion` label if clarification needed

**DO NOT start work if this issue doesn't meet Definition of Ready.**

## Labels

- `type:feature`
- `priority:medium`
- `points:3`
- `sprint:planned` (will change to `sprint:in-progress` → `sprint:review` → `sprint:done`)

## Milestone

Assign to current sprint milestone.

````

---

## Why This Is a Good First Issue

**Criteria for Good First Issue**:

1. **Small Scope** ✓
   - 3 story points (~4 hours)
   - Single file modification
   - Self-contained feature

2. **Clear Requirements** ✓
   - Detailed acceptance criteria
   - Response format specified
   - Technical details provided
   - Example implementation included

3. **Low Risk** ✓
   - Non-critical monitoring feature
   - No breaking changes
   - Limited blast radius

4. **Self-Contained** ✓
   - No dependencies on other issues
   - No external API integrations
   - No database migrations

5. **Representative** ✓
   - Demonstrates full workflow (backend + tests + docs)
   - TDD approach
   - Quality standards
   - Code review process

6. **Educational Value** ✓
   - Introduces testing patterns
   - Demonstrates error handling
   - Shows logging best practices
   - Teaches API documentation

7. **Quick Feedback** ✓
   - Easy to verify (curl the endpoint)
   - Clear success/failure criteria
   - Fast review cycle

**Learning Outcomes**:

After completing this issue, the AI agent will understand:
- Complete GitHub workflow (issue → branch → PR → review → merge)
- Test-Driven Development (TDD)
- Definition of Done compliance
- Code quality standards (TypeScript, ESLint, Prettier)
- Documentation practices (CHANGELOG, JSDoc/Swagger)
- Error handling and logging
- PR review process
- Sprint workflow and ceremonies

---

## Variations for Different Contexts

### Variation 1: Frontend First Issue

```markdown
# Add Theme Toggle Accessibility Improvements

**User Story**: As a keyboard user, I want to toggle theme using keyboard so that I can switch between dark/light mode without a mouse.

**Acceptance Criteria**:
- [ ] Theme toggle button is keyboard accessible (Tab navigation)
- [ ] Theme toggle has proper ARIA labels
- [ ] Theme toggle supports Enter and Space key activation
- [ ] Focus indicator clearly visible
- [ ] Screen reader announces theme change

**Technical Details**:
- File: `src/components/ThemeToggle.tsx`
- Add keyboard event handlers
- Add ARIA attributes
- Test with screen reader

**Story Points**: 2 (4 hours)
````

### Variation 2: Bug Fix First Issue

```markdown
# Fix Theme Switching Performance Lag

**Problem**: Theme switching takes 800ms, causes UI freeze.

**User Story**: As a user, I want instant theme switching so that the app remains responsive.

**Acceptance Criteria**:

- [ ] Theme switch completes in <100ms
- [ ] No visual glitches during transition
- [ ] All tests passing
- [ ] Performance verified with React DevTools Profiler

**Root Cause**: GraphCanvas component re-renders on every state change.

**Solution**: Add React.memo and useShallow to Zustand state.

**Story Points**: 3 (1 day)
```

### Variation 3: Documentation First Issue

```markdown
# Update API Documentation for Authentication Endpoints

**User Story**: As a frontend developer, I want complete API documentation so that I can integrate authentication correctly.

**Acceptance Criteria**:

- [ ] All authentication endpoints documented (login, logout, refresh, register)
- [ ] Request/response examples provided
- [ ] Error codes documented
- [ ] Swagger/OpenAPI annotations added
- [ ] Postman collection updated

**Technical Details**:

- Files: `docs/api/authentication.md`, `server/src/routes/auth.ts`
- Use Swagger/JSDoc format
- Include curl examples

**Story Points**: 2 (4 hours)
```

### Variation 4: Technical Debt First Issue

```markdown
# Configure ESLint with Recommended Rules

**User Story**: As a developer, I want consistent code style so that the codebase is maintainable.

**Acceptance Criteria**:

- [ ] ESLint configured with TypeScript rules
- [ ] Prettier integrated with ESLint
- [ ] Pre-commit hooks set up (Husky)
- [ ] All existing code passes linting
- [ ] CI/CD enforces linting

**Technical Details**:

- Install: eslint, @typescript-eslint/parser, @typescript-eslint/eslint-plugin
- Configure: .eslintrc.json
- Add: npm run lint script

**Story Points**: 2 (4 hours)
```

---

## Creating the Issue in GitHub

```bash
# Create issue from template
gh issue create \
  --title "Add health check endpoint enhancement" \
  --body "$(cat /opt/projects/repositories/pressograph/docs/examples/FIRST_ISSUE_FOR_AI_AGENT.md)" \
  --label "type:feature,priority:medium,points:3" \
  --milestone "Sprint 1: Foundation & Setup"

# Verify issue created
gh issue list --label "type:feature" --limit 1
```

---

## Success Metrics

**First issue is successful if**:

- AI agent completes issue within estimated time (3 points = 1 day)
- All Definition of Done criteria met
- PR approved without major changes requested
- AI agent demonstrates understanding of workflow
- AI agent asks clarifying questions when needed
- AI agent communicates progress effectively

**Red flags to watch for**:

- Issue takes >2x estimated time (estimation problem)
- Multiple rounds of PR changes (requirements unclear)
- DoD criteria not met (process not understood)
- No daily updates (communication gap)
- Direct commits to main (workflow not followed)

**Corrective actions**:

- If struggling: Pair program through the issue
- If unclear: Improve issue template with more details
- If slow: Check for blockers, adjust estimate
- If quality issues: Review DoD checklist together
- If process violations: Re-review AI_AGENT_INSTRUCTIONS.md

---

**Version**: 1.0
**Last Updated**: 2025-11-01
**Maintained By**: Pressograph Team

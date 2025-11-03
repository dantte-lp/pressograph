# AI Agent Onboarding Guide - Pressograph

**Version**: 1.0
**Last Updated**: 2025-11-01
**Purpose**: Complete onboarding process for AI agents joining Pressograph development

---

## Table of Contents

1. [Prerequisites (Human Setup)](#1-prerequisites-human-setup)
2. [AI Agent Onboarding Process](#2-ai-agent-onboarding-process)
3. [Mandatory Reading](#3-mandatory-reading-for-ai-agents)
4. [First Task Workflow](#4-first-task-workflow)
5. [Daily Workflow](#5-daily-workflow)
6. [Common Scenarios](#6-common-scenarios)
7. [Troubleshooting](#7-troubleshooting)

---

## 1. Prerequisites (Human Setup)

**Before onboarding an AI agent, the human Product Owner/Scrum Master must complete:**

### 1.1 Verify Project Genesis Access

```bash
# Check Project Genesis exists and is accessible
ls -la /opt/projects/repositories/project-genesis/docs/scrum/

# Expected files:
# - AI_AGENT_INSTRUCTIONS.md (complete AI agent manual)
# - SCRUM_PROCESS.md (Scrum framework)
# - DEFINITION_OF_DONE.md (quality checklist)
# - BACKLOG_REFINEMENT.md (Definition of Ready)
# - ESTIMATION_GUIDE.md (story pointing)
```

**Action**: If any file is missing, do NOT proceed. Fix Project Genesis first.

### 1.2 Verify Pressograph Configuration

```bash
# Check .scrum-config points to Project Genesis
cat /opt/projects/repositories/pressograph/.scrum-config | grep scrum_framework

# Expected output:
# scrum_framework: ../project-genesis

# Check project is ready for development
cd /opt/projects/repositories/pressograph
npm install  # Should complete without errors
npm test     # Should pass (or have known failing tests documented)
npm run dev  # Should start dev server
```

**Action**: If setup fails, resolve issues before onboarding AI agent.

### 1.3 Create First Sprint

**If no sprint exists yet:**

```bash
# Create first sprint milestone
gh api repos/dantte-lp/pressograph/milestones \
  -X POST \
  -f title="Sprint 1: Foundation & Setup" \
  -f description="## Sprint Goal
Establish development environment and complete initial features.

## Sprint Dates
- Start: $(date -I)
- End: $(date -I -d '+14 days')

## Capacity
- Team capacity: 25 story points
- Velocity target: 25 points
- Buffer: 15% for unknowns" \
  -f due_on="$(date -I -d '+14 days')T23:59:59Z"
```

**Action**: Verify milestone created with `gh api repos/dantte-lp/pressograph/milestones`

### 1.4 Create Initial Issues

**Create 3-5 starter issues for the AI agent:**

```bash
# Example: Create first issue
gh issue create \
  --title "Add health check endpoint enhancement" \
  --body "$(cat <<'EOF'
## User Story
As a DevOps engineer, I want the /health endpoint to return detailed service status so that I can monitor application health effectively.

## Acceptance Criteria
- [ ] Endpoint returns JSON with service name, version, status, timestamp
- [ ] Endpoint checks database connectivity
- [ ] Endpoint returns 200 if healthy, 503 if unhealthy
- [ ] Unit tests cover all scenarios
- [ ] Integration test verifies endpoint
- [ ] Documentation updated in README

## Technical Details
- File to modify: `server/src/routes/health.ts`
- Add database ping check
- Add timestamp field
- Follow TypeScript strict mode

## Definition of Done
Standard DoD from Project Genesis applies (see /opt/projects/repositories/project-genesis/docs/scrum/DEFINITION_OF_DONE.md)

## Estimate
3 story points (1 day)
EOF
)" \
  --label "type:feature,priority:medium" \
  --milestone "Sprint 1: Foundation & Setup"
```

**Action**: Create 3-5 similar issues, ensuring variety (feature, bug, documentation).

### 1.5 Understand Current Project State

**Read these handoff reports:**

- `/opt/projects/repositories/pressograph/HANDOFF_REPORT_INFRASTRUCTURE.md`
- `/opt/projects/repositories/pressograph/HANDOFF_REPORT_FRONTEND.md`

**Action**: Familiarize yourself with what's already built and what's pending.

---

## 2. AI Agent Onboarding Process

**Estimated time**: 60 minutes total

### Step 1: Read Mandatory Documentation (30 minutes)

**Priority 1 - MANDATORY (read in order):**

1. **AI Agent Operating Manual** (20 minutes):

   ```
   /opt/projects/repositories/project-genesis/docs/scrum/AI_AGENT_INSTRUCTIONS.md
   ```

   - Complete workflow for GitHub + Scrum
   - All processes, ceremonies, standards
   - Commit conventions, PR templates, DoD checklists

2. **Definition of Done Checklist** (5 minutes):

   ```
   /opt/projects/repositories/project-genesis/docs/scrum/DEFINITION_OF_DONE.md
   ```

   - Universal DoD (12 criteria)
   - Type-specific DoD (feature, bug, refactoring, documentation)
   - Quality gates

3. **Pressograph README** (5 minutes):

   ```
   /opt/projects/repositories/pressograph/README.md
   ```

   - Tech stack (React 19, TypeScript, Node.js, PostgreSQL)
   - Container setup (Podman, no Alpine)
   - Quick start commands

4. **Pressograph Configuration** (2 minutes):
   ```
   /opt/projects/repositories/pressograph/.scrum-config
   ```

   - Sprint settings (2 weeks, 25 point velocity)
   - Project-specific DoD additions
   - Technology stack policies

**Priority 2 - RECOMMENDED (read as needed):**

5. **Scrum Process Guide**:

   ```
   /opt/projects/repositories/project-genesis/docs/scrum/SCRUM_PROCESS.md
   ```

   - Sprint ceremonies in detail
   - Backlog management
   - Team collaboration

6. **Estimation Guide**:
   ```
   /opt/projects/repositories/project-genesis/docs/scrum/ESTIMATION_GUIDE.md
   ```

   - Story point scale (Fibonacci)
   - Estimation factors
   - Examples by size

### Step 2: Understand Project Context (15 minutes)

**Review current sprint:**

```bash
# List current sprint issues
gh issue list --milestone "Sprint 1: Foundation & Setup" --json number,title,labels

# View sprint milestone details
gh api repos/dantte-lp/pressograph/milestones | \
  jq '.[] | select(.title | startswith("Sprint 1"))'

# Check Product Backlog
gh issue list --milestone "Product Backlog" --json number,title,labels
```

**Review technology stack:**

- **Frontend**: React 19.2.0, TypeScript 5.9, Vite 7.1.12, Tailwind CSS
- **Backend**: Node.js 22 LTS, Express.js, TypeScript, PostgreSQL 18
- **Container**: Podman (NOT Docker), Debian Trixie base images (NO Alpine)
- **Testing**: Vitest, coverage ≥60%
- **Code Quality**: ESLint, Prettier, TypeScript strict mode

**Review project structure:**

```bash
cd /opt/projects/repositories/pressograph

# Key directories
tree -L 2 -I 'node_modules|dist'
```

### Step 3: Environment Setup (10 minutes)

**Install dependencies:**

```bash
cd /opt/projects/repositories/pressograph

# Install all dependencies
npm install

# Verify installation
npm run lint        # Should complete without errors
npm run type-check  # Should complete without errors
npm test            # Should pass (or show documented failures)
```

**Start development environment:**

```bash
# Option 1: Local development (without containers)
npm run dev

# Option 2: Full stack with Podman Compose
make init-env-dev
make dev-compose
```

**Verify environment:**

```bash
# Check frontend (if running locally)
curl http://localhost:5173/health

# Check backend
curl http://localhost:3001/health

# Check database (if using Podman Compose)
podman exec pressograph-db-1 pg_isready
```

### Step 4: Verify GitHub Access (5 minutes)

**Test GitHub CLI:**

```bash
# Verify authentication
gh auth status

# List issues
gh issue list --limit 5

# Test PR creation (dry run)
gh pr create --help
```

**If authentication fails:**

```bash
# Authenticate with GitHub
gh auth login

# Follow prompts to authenticate
```

### Step 5: Confirm Understanding (Quick Checklist)

**Before starting work, confirm you understand:**

- [ ] I know where to find the complete AI Agent Instructions
- [ ] I understand the Definition of Done checklist
- [ ] I know the tech stack (React 19, TypeScript, Node.js, PostgreSQL, Podman)
- [ ] I know the sprint duration (2 weeks) and velocity target (25 points)
- [ ] I understand the GitHub workflow (issues → branches → PRs → review → merge)
- [ ] I know the branching convention (type/issue-number-description)
- [ ] I know the commit convention (Conventional Commits)
- [ ] I understand WIP limits (max 2 in-progress issues)
- [ ] I know how to update issue status daily
- [ ] I know when to escalate (blockers, unclear requirements)

**If ANY checkbox is unchecked, re-read the relevant documentation section.**

---

## 3. Mandatory Reading for AI Agents

### 3.1 Critical Documents (MUST READ)

| Document                  | Path                                                                             | Read Time | Purpose                                     |
| ------------------------- | -------------------------------------------------------------------------------- | --------- | ------------------------------------------- |
| **AI Agent Instructions** | `/opt/projects/repositories/project-genesis/docs/scrum/AI_AGENT_INSTRUCTIONS.md` | 20 min    | Complete operating manual for all AI agents |
| **Definition of Done**    | `/opt/projects/repositories/project-genesis/docs/scrum/DEFINITION_OF_DONE.md`    | 5 min     | Quality checklist before closing issues     |
| **Pressograph README**    | `/opt/projects/repositories/pressograph/README.md`                               | 5 min     | Project overview, tech stack, quick start   |
| **Scrum Config**          | `/opt/projects/repositories/pressograph/.scrum-config`                           | 2 min     | Project-specific settings and policies      |

**Total time**: 32 minutes

### 3.2 Reference Documents (Read as Needed)

| Document                | Path                                                                           | Purpose                      |
| ----------------------- | ------------------------------------------------------------------------------ | ---------------------------- |
| **Scrum Process**       | `/opt/projects/repositories/project-genesis/docs/scrum/SCRUM_PROCESS.md`       | Detailed Scrum framework     |
| **Estimation Guide**    | `/opt/projects/repositories/project-genesis/docs/scrum/ESTIMATION_GUIDE.md`    | Story point estimation       |
| **Backlog Refinement**  | `/opt/projects/repositories/project-genesis/docs/scrum/BACKLOG_REFINEMENT.md`  | Definition of Ready          |
| **Team Collaboration**  | `/opt/projects/repositories/project-genesis/docs/scrum/TEAM_COLLABORATION.md`  | Distributed team practices   |
| **Retrospective Guide** | `/opt/projects/repositories/project-genesis/docs/scrum/RETROSPECTIVE_GUIDE.md` | Sprint retrospective formats |

### 3.3 Quick Reference Card

**Keep this handy during development:**

```
PROJECT: Pressograph
TYPE: React 19 + TypeScript + Node.js + PostgreSQL
SPRINT: 2 weeks (Monday to Sunday)
VELOCITY: 25 story points
WIP LIMIT: 2 in-progress issues max

WORKFLOW:
1. Select issue from sprint milestone
2. Verify Definition of Ready
3. Create branch: type/issue-number-description
4. Implement with TDD
5. Commit: type: description (#issue)
6. Create PR with DoD checklist
7. Request review
8. Address feedback
9. Merge (squash)
10. Close issue with comment

DOD CHECKLIST (12 universal criteria):
✓ Code style (ESLint, Prettier)
✓ No TypeScript errors (strict mode)
✓ Tests written (coverage ≥60%)
✓ PR reviewed and approved
✓ i18n keys for all text
✓ Accessibility (WCAG 2.1 AA)
✓ Performance (no unnecessary re-renders)
✓ Security (input validation, no XSS)
✓ Documentation updated
✓ CHANGELOG updated
✓ CI/CD passing
✓ Deployed to staging

DAILY:
- Update in-progress issues (comment by 10:00 UTC)
- Check assigned issues (gh issue list --assignee @me)
- Respond to PR reviews (within 4 hours)
- Flag blockers immediately

ESCALATE IF:
- Blocked >24 hours
- Unclear requirements
- Conflicting instructions
- Security vulnerability
- Breaking change needed
```

---

## 4. First Task Workflow

**Complete example of executing your first task from start to finish.**

### Step 1: Select Issue from Sprint

```bash
# List current sprint issues
gh issue list --milestone "Sprint 1: Foundation & Setup" --state open

# Example output:
# #4  Add health check endpoint enhancement  type:feature,priority:medium

# View issue details
gh issue view 4
```

**Verify issue meets Definition of Ready:**

- [ ] Clear title
- [ ] User story or problem statement
- [ ] Acceptance criteria (3-8 items)
- [ ] Story points estimated
- [ ] No blockers
- [ ] Small enough (<8 points)
- [ ] Testable
- [ ] Understood

**If Definition of Ready is NOT met:**

- DO NOT start work
- Comment on issue requesting clarification
- Tag Product Owner
- Work on different issue

### Step 2: Assign Issue and Update Status

```bash
# Assign issue to yourself
gh issue edit 4 --add-assignee @me

# Update status label
gh issue edit 4 --add-label "sprint:in-progress"

# Comment with start notification
gh issue comment 4 --body "Starting work on this issue. ETA: 1 day (2025-11-02)"
```

### Step 3: Create Feature Branch

```bash
# Checkout main and pull latest
git checkout main
git pull origin main

# Create feature branch
git checkout -b feature/4-health-check-enhancement

# Verify branch
git branch --show-current
# Output: feature/4-health-check-enhancement
```

### Step 4: Implement Feature (TDD)

**Test-Driven Development approach:**

1. **Write test first** (RED):

```typescript
// server/src/routes/__tests__/health.test.ts
describe('GET /health', () => {
  it('should return detailed health status', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('service', 'pressograph');
    expect(response.body).toHaveProperty('version');
    expect(response.body).toHaveProperty('status', 'healthy');
    expect(response.body).toHaveProperty('timestamp');
    expect(response.body).toHaveProperty('database', 'connected');
  });

  it('should return 503 if database is down', async () => {
    // Mock database connection failure
    jest.spyOn(db, 'query').mockRejectedValue(new Error('Connection failed'));

    const response = await request(app).get('/health');

    expect(response.status).toBe(503);
    expect(response.body.status).toBe('unhealthy');
    expect(response.body.database).toBe('disconnected');
  });
});
```

2. **Run test** (verify it fails):

```bash
npm test -- health.test.ts
# Expected: Test fails (endpoint not implemented yet)
```

3. **Implement feature** (GREEN):

```typescript
// server/src/routes/health.ts
import { Router, Request, Response } from 'express';
import { db } from '../db';
import packageJson from '../../package.json';

const router = Router();

router.get('/health', async (req: Request, res: Response) => {
  let databaseStatus = 'connected';
  let httpStatus = 200;
  let overallStatus = 'healthy';

  try {
    // Check database connectivity
    await db.query('SELECT 1');
  } catch (error) {
    databaseStatus = 'disconnected';
    httpStatus = 503;
    overallStatus = 'unhealthy';
  }

  res.status(httpStatus).json({
    service: 'pressograph',
    version: packageJson.version,
    status: overallStatus,
    timestamp: new Date().toISOString(),
    database: databaseStatus,
  });
});

export default router;
```

4. **Run test again** (verify it passes):

```bash
npm test -- health.test.ts
# Expected: All tests pass
```

5. **Refactor** (if needed):

```bash
# Run full test suite
npm test

# Check coverage
npm run test:coverage
# Ensure coverage ≥60%
```

### Step 5: Verify Code Quality

```bash
# Lint check
npm run lint
# Expected: No errors

# Type check
npm run type-check
# Expected: No TypeScript errors

# Format code
npm run format
# Expected: Code formatted

# Build
npm run build
# Expected: Build succeeds
```

### Step 6: Update Documentation

**Update README (if needed):**

```bash
# Edit README.md to mention enhanced health endpoint
# (Only if endpoint is new or significantly changed)
```

**Update CHANGELOG:**

```markdown
## [Unreleased]

### Added

- Enhanced health check endpoint with database connectivity check (#4)
- Health endpoint now returns service name, version, timestamp
- Health endpoint returns 503 if database is disconnected
```

**Update API documentation (if applicable):**

```typescript
// Add Swagger/JSDoc annotations
/**
 * @swagger
 * /health:
 *   get:
 *     summary: Get service health status
 *     description: Returns detailed health information including database connectivity
 *     responses:
 *       200:
 *         description: Service is healthy
 *       503:
 *         description: Service is unhealthy
 */
```

### Step 7: Commit Changes

```bash
# Stage changes
git add .

# Commit with conventional commit message
git commit -m "feat: enhance health check endpoint (#4)

Add detailed health status response with database connectivity check.
Endpoint now returns service name, version, timestamp, and database status.
Returns 503 status code if database is unreachable.

Relates to #4"

# Verify commit
git log -1 --oneline
```

### Step 8: Push Branch and Create PR

```bash
# Push branch
git push -u origin feature/4-health-check-enhancement

# Create pull request
gh pr create \
  --title "Add enhanced health check endpoint (#4)" \
  --body "$(cat <<'EOF'
## Changes
Enhanced the `/health` endpoint to return detailed service status information.

## Related Issues
Closes #4

## Type of Change
- [x] New feature
- [ ] Bug fix
- [ ] Refactoring
- [ ] Documentation
- [ ] Performance improvement
- [ ] Test coverage

## How to Test
1. Start development server: `npm run dev`
2. Test healthy state: `curl http://localhost:3001/health`
3. Expected: 200 status with JSON containing service, version, status, timestamp, database
4. Stop database: `podman stop pressograph-db-1`
5. Test unhealthy state: `curl http://localhost:3001/health`
6. Expected: 503 status with database: "disconnected"

## Definition of Done Checklist

### Code Quality
- [x] Code follows style guide (ESLint, Prettier)
- [x] No TypeScript errors (strict mode)
- [x] No linting errors or warnings
- [x] Code is self-documenting
- [x] Complex logic has comments
- [x] No commented-out code
- [x] No console.log statements
- [x] No hardcoded values

### Testing
- [x] Unit tests written
- [x] All tests passing
- [x] Coverage ≥60%
- [x] Edge cases covered (database down)
- [x] Error conditions tested

### Code Review
- [ ] PR created and linked (this PR)
- [x] Self-reviewed
- [ ] Approved by team member (pending)
- [ ] All comments addressed (pending)
- [ ] No unresolved conversations (pending)

### Documentation
- [x] README updated (not needed - minor enhancement)
- [x] API docs updated (JSDoc added)
- [x] Inline comments added
- [x] CHANGELOG.md updated

### i18n
- [x] All text uses i18n keys (N/A - API endpoint, no UI text)

### Accessibility
- [x] N/A (backend API endpoint)

### Performance
- [x] No performance concerns (simple SELECT 1 query)

### Security
- [x] No sensitive data in code
- [x] Input validation implemented (N/A - no input)
- [x] XSS prevention verified (N/A - JSON API)
- [x] npm audit clean

### Acceptance
- [x] All acceptance criteria met
- [ ] Product Owner approved (pending)
- [x] Edge cases handled (database down)
- [x] Error messages clear

### Deployment
- [ ] Merged to main (pending)
- [ ] CI/CD passing (pending)
- [ ] Deployed to staging (pending)
- [ ] Smoke tests passed (pending)

### Cleanup
- [x] No dead code
- [x] Temporary files removed
- [x] Debug code removed
- [ ] Git branch deleted (after merge)

## Notes for Reviewers
- Database connectivity check uses simple `SELECT 1` query (fast, lightweight)
- Returns 503 (Service Unavailable) instead of 500 when database is down
- No breaking changes to existing health endpoint contract

**Estimated review time**: 10 minutes
EOF
)" \
  --base main
```

### Step 9: Update Issue Status

```bash
# Update issue label
gh issue edit 4 --remove-label "sprint:in-progress" --add-label "sprint:review"

# Comment on issue
gh issue comment 4 --body "PR created: #[PR-NUMBER]

Implementation complete. All DoD criteria met except those pending review.

**Summary**:
- Enhanced /health endpoint with database connectivity check
- Added comprehensive tests (100% coverage for health route)
- Updated documentation (CHANGELOG, JSDoc)
- All quality checks passing (lint, type-check, tests, build)

**Next Steps**:
- Awaiting code review
- Will address feedback promptly
- Will merge after approval

ETA for completion: Today (2025-11-02) pending review"
```

### Step 10: Respond to Review Feedback

**When reviewer comments:**

```bash
# View review comments
gh pr view [PR-NUMBER] --comments

# Address feedback
# ... make code changes ...

# Commit updates
git add .
git commit -m "fix: address PR review comments

- Add error logging for database connection failures
- Improve test coverage for edge cases

Relates to #4"

# Push updates
git push

# Respond to review comments
gh pr comment [PR-NUMBER] --body "Thanks for the feedback! I've addressed all comments:

1. Added error logging for database failures
2. Improved test coverage to include timeout scenarios
3. Updated variable naming for clarity

Ready for re-review."
```

### Step 11: Merge PR

**After approval:**

```bash
# Merge with squash
gh pr merge [PR-NUMBER] --squash --delete-branch

# Verify issue auto-closed (if "Closes #4" was in PR description)
gh issue view 4
# Status should be "Closed"

# If issue didn't auto-close, close manually
gh issue close 4 --comment "Completed and merged via PR #[PR-NUMBER].

All Definition of Done criteria verified:
✓ Code quality (ESLint, TypeScript strict mode)
✓ Tests (100% coverage for health route)
✓ Code review (approved)
✓ Documentation (CHANGELOG, JSDoc)
✓ Deployment (merged to main, CI/CD passing)

Deployed to staging: https://dev-pressograph.infra4.dev/health"
```

### Step 12: Verify Deployment

```bash
# Check deployment status
gh run list --limit 5

# Verify on staging
curl https://dev-pressograph.infra4.dev/api/health

# Expected response:
# {
#   "service": "pressograph",
#   "version": "1.1.0",
#   "status": "healthy",
#   "timestamp": "2025-11-02T10:30:00.000Z",
#   "database": "connected"
# }
```

**Congratulations! You've completed your first task following the full Scrum workflow.**

---

## 5. Daily Workflow

**What to do every day as an AI agent:**

### Morning Routine (10:00 UTC)

```bash
# 1. Check assigned issues
gh issue list --assignee @me --state open

# 2. Check PRs awaiting your review
gh pr list --review-requested @me

# 3. Check PRs you created
gh pr list --author @me --state open
```

### Update In-Progress Issues

**For EACH issue with `sprint:in-progress` label:**

```bash
gh issue comment [ISSUE-NUMBER] --body "## Daily Update - $(date -I)

**Progress Yesterday**:
- Completed backend API implementation
- Added unit tests (90% coverage)
- Fixed linting errors

**Work Today**:
- Add integration tests
- Update documentation
- Create PR

**Blockers**: None

**ETA**: Complete today ($(date -I))"
```

### Respond to PR Reviews

**Within 4 hours during work hours:**

```bash
# Check PR review status
gh pr view [PR-NUMBER] --json reviewDecision,reviews

# If changes requested, address feedback
# ... make changes ...
# ... commit and push ...

# Comment when ready for re-review
gh pr comment [PR-NUMBER] --body "All review comments addressed. Ready for re-review."
```

### Check for Blockers

**If blocked:**

```bash
# Add blocked label
gh issue edit [ISSUE-NUMBER] --add-label "blocked"

# Comment with details
gh issue comment [ISSUE-NUMBER] --body "**BLOCKED**

**Blocker**: Cannot proceed due to [reason]

**Impact**: Work stopped on [specific task]

**Options**:
1. [Option 1 to unblock]
2. [Option 2 to unblock]

**Requesting**: @product-owner decision by [date/time]

**Urgency**: [High/Medium/Low]"

# Tag relevant person
```

### End of Day Checklist

- [ ] All in-progress issues updated with daily comment
- [ ] All PR reviews responded to
- [ ] Blockers flagged and escalated
- [ ] Work committed to Git (at least 1 commit/day)
- [ ] WIP limit maintained (≤2 in-progress issues)

---

## 6. Common Scenarios

### Scenario 1: Starting a New Feature

```bash
# 1. Find unassigned issue from current sprint
gh issue list --milestone "Sprint 1" --no-assignee --label "type:feature"

# 2. Verify Definition of Ready
gh issue view [ISSUE-NUMBER]

# 3. Assign and start
gh issue edit [ISSUE-NUMBER] --add-assignee @me --add-label "sprint:in-progress"

# 4. Create branch
git checkout -b feature/[ISSUE-NUMBER]-[description]

# 5. Implement with TDD
# ... write tests first ...
# ... implement feature ...
# ... verify DoD ...

# 6. Create PR
gh pr create --title "[Type] [Description] (#[ISSUE-NUMBER])" --body "[PR template]"

# 7. Update issue status
gh issue edit [ISSUE-NUMBER] --remove-label "sprint:in-progress" --add-label "sprint:review"
```

### Scenario 2: Fixing a Bug

```bash
# 1. Create issue (if not exists)
gh issue create \
  --title "Fix theme switching performance lag" \
  --body "## Problem
Theme switching takes 800ms, causes UI freeze.

## Steps to Reproduce
1. Click theme toggle
2. Observe delay

## Expected Behavior
Theme switch in <100ms

## Actual Behavior
Theme switch takes ~800ms

## Root Cause
GraphCanvas re-renders on every state change.

## Proposed Solution
Add React.memo and useShallow to Zustand state.

## Acceptance Criteria
- [ ] Theme switch completes in <100ms
- [ ] No visual glitches during transition
- [ ] All tests passing
- [ ] Performance verified with React DevTools Profiler" \
  --label "type:bug,priority:high" \
  --milestone "Sprint 1"

# 2. Add regression test (TDD)
# ... write test that reproduces bug ...

# 3. Fix bug
# ... implement fix ...

# 4. Verify fix
npm test
npm run lint

# 5. Document root cause in PR
gh pr create --body "## Root Cause
GraphCanvas component re-renders on every Zustand state change.

## Solution
- Added React.memo to GraphCanvas
- Used useShallow wrapper for Zustand selectors
- Memoized expensive calculations with useMemo

## Performance Impact
- Before: 800ms theme switch time
- After: 95ms theme switch time
- Improvement: 88% faster

## Prevention
Added ESLint rule to enforce React.memo for large components."
```

### Scenario 3: Refactoring Code

```bash
# 1. Create refactoring issue
gh issue create \
  --title "Refactor GraphCanvas component for better readability" \
  --label "type:refactoring,priority:medium"

# 2. IMPORTANT: Verify no functional changes
# All tests must still pass without modification

# 3. Implement refactoring
# ... extract functions ...
# ... improve naming ...
# ... reduce complexity ...

# 4. Run tests (should pass without changes)
npm test
# If tests fail, refactoring broke functionality - FIX IT

# 5. Verify metrics improved
# - Code complexity reduced?
# - Readability improved?
# - Performance maintained?

# 6. Document in PR
gh pr create --body "## Refactoring Goals
- Reduce GraphCanvas complexity from 85 to <50
- Extract reusable hooks
- Improve variable naming

## Changes
- Extracted useGraphData hook
- Extracted useGraphRenderer hook
- Renamed unclear variables (d → dataPoint, x → xCoordinate)

## Verification
- All tests pass (no modifications needed)
- Code coverage maintained (67%)
- Performance maintained (verified with DevTools)
- Build size unchanged

## No Functional Changes
This is pure refactoring. No user-visible changes."
```

### Scenario 4: Writing Documentation

```bash
# 1. Create documentation issue
gh issue create \
  --title "Update API documentation for share endpoints" \
  --label "type:documentation,priority:low"

# 2. Update documentation
# ... edit README, API docs, etc. ...

# 3. Verify documentation
# - Accuracy: All information correct?
# - Completeness: All features documented?
# - Clarity: Easy to understand?
# - Examples: Working code samples?
# - Links: No broken links?

# 4. Run link checker (if available)
npm run check-links  # (if configured)

# 5. Create PR with screenshots
gh pr create --body "## Documentation Updates
- Added /api/share endpoint documentation
- Added examples for creating share links
- Updated authentication section
- Fixed broken links

## Screenshots
[Attach screenshots showing before/after]

## Verification
- All links verified
- Code examples tested
- Spelling checked
- Grammar reviewed"
```

### Scenario 5: Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- health.test.ts

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm run test:coverage

# View coverage report
open coverage/index.html

# Run tests for specific component
npm test -- --grep "GraphCanvas"
```

---

## 7. Troubleshooting

### Issue: Definition of Ready Not Met

**Problem**: Issue lacks clear acceptance criteria, story points, or other required fields.

**Solution**:

```bash
# 1. DO NOT start work

# 2. Comment on issue
gh issue comment [ISSUE-NUMBER] --body "This issue does not meet Definition of Ready.

**Missing**:
- [ ] Clear acceptance criteria (only 1 criterion, need 3-8)
- [ ] Story point estimation (no points:X label)
- [ ] Technical details (no implementation approach)

**Requested**: @product-owner please refine this issue before development starts.

**Reference**: Definition of Ready - /opt/projects/repositories/project-genesis/docs/scrum/BACKLOG_REFINEMENT.md

I will work on a different issue while waiting."

# 3. Work on different issue
gh issue list --assignee @me --state open
```

### Issue: Blocked for >24 Hours

**Problem**: Cannot proceed due to external dependency, unclear requirements, or technical blocker.

**Solution**:

```bash
# 1. Add blocked label IMMEDIATELY
gh issue edit [ISSUE-NUMBER] --add-label "blocked"

# 2. Document blocker
gh issue comment [ISSUE-NUMBER] --body "**BLOCKED** for [X] hours

**Blocker Description**:
[Clear description of what is blocking you]

**Impact**:
- Cannot complete [specific task]
- Sprint commitment at risk
- [X] story points affected

**Tried**:
- [What you've already tried to resolve]

**Need**:
- [What you need to unblock]

**Options**:
1. [Option 1 with pros/cons]
2. [Option 2 with pros/cons]
3. [Option 3 with pros/cons]

**Recommendation**: [Your recommended option]

**Urgency**: HIGH - Need decision by [specific date/time]

@scrum-master @product-owner"

# 3. Work on different issue
gh issue edit [DIFFERENT-ISSUE] --add-assignee @me
```

### Issue: PR Rejected by Reviewer

**Problem**: Code reviewer requested changes, provided critical feedback, or blocked PR.

**Solution**:

```bash
# 1. READ FEEDBACK CAREFULLY
gh pr view [PR-NUMBER] --comments

# 2. ASK CLARIFYING QUESTIONS (if unclear)
gh pr comment [PR-NUMBER] --body "@reviewer Thanks for the review. I have a question about your comment on line 42:

> \"This approach might cause memory leaks\"

**Question**: Which specific approach are you referring to? The event listener registration or the state management?

**Context**: I'm using useEffect cleanup to remove listeners. Is there an edge case I'm missing?

Please clarify so I can address this properly."

# 3. ADDRESS FEEDBACK
# ... make code changes ...

# 4. COMMIT FIXES
git add .
git commit -m "fix: address PR review feedback

- Fixed potential memory leak in event listeners
- Improved error handling as suggested
- Added tests for edge cases

Relates to #[ISSUE-NUMBER]"

git push

# 5. RESPOND TO REVIEWER
gh pr comment [PR-NUMBER] --body "All feedback addressed:

✓ Fixed memory leak by adding cleanup in useEffect
✓ Improved error handling with try-catch
✓ Added tests for edge cases (coverage now 95%)
✓ Renamed unclear variables as suggested

Changes committed: [commit SHA]

Ready for re-review. Thank you for the thorough review!"

# 6. REQUEST RE-REVIEW
gh pr edit [PR-NUMBER] --add-reviewer @reviewer
```

### Issue: Definition of Done Too Complex

**Problem**: Struggling to meet all 12 universal DoD criteria, feeling overwhelmed.

**Solution**:

**Focus on critical items first:**

1. **Must Have** (blocking issues):
   - Code compiles (no TypeScript errors)
   - Tests pass
   - Linting passes
   - PR approved

2. **Should Have** (important but not blocking):
   - Test coverage ≥60%
   - Documentation updated
   - i18n keys added
   - Accessibility verified

3. **Nice to Have** (polish):
   - Performance optimization
   - Code comments
   - CHANGELOG updated

**Ask for help:**

```bash
gh issue comment [ISSUE-NUMBER] --body "I'm having difficulty meeting all DoD criteria for this issue.

**Completed** (8/12):
- [x] Code follows style guide
- [x] No TypeScript errors
- [x] Tests written and passing
- [x] PR created
- [x] Self-reviewed
- [x] Documentation updated
- [x] Security validated
- [x] CI/CD passing

**Struggling** (4/12):
- [ ] i18n keys (unclear which strings need translation)
- [ ] Accessibility (how to test WCAG 2.1 AA compliance?)
- [ ] Performance (React DevTools Profiler confusing)
- [ ] Deployed to staging (don't have staging access)

**Request**: @scrum-master Can we review DoD checklist together? I want to ensure I understand all criteria correctly.

**Urgency**: Medium - Issue otherwise complete"
```

### Issue: Conflicting Requirements

**Problem**: User story conflicts with technical constraints, acceptance criteria contradict each other.

**Solution**:

```bash
# 1. DO NOT GUESS OR ASSUME
# 2. DO NOT IMPLEMENT CONFLICTING FEATURES

# 3. DOCUMENT CONFLICT CLEARLY
gh issue comment [ISSUE-NUMBER] --body "**CONFLICT DETECTED**

I've identified conflicting requirements in this issue:

**Conflict**:
- Acceptance Criterion #2 says: \"Share links expire after 7 days\"
- Acceptance Criterion #5 says: \"Users can set custom expiration (7-90 days)\"

**Question**: Should expiration be:
- Fixed at 7 days (criterion #2)?
- Customizable 7-90 days (criterion #5)?
- Default 7 days with optional customization?

**Impact**:
- Database schema differs based on approach
- UI complexity varies
- API contract changes

**Options**:
1. Fixed 7 days (simpler, less flexible)
2. Customizable (complex, more flexible)
3. Default 7 days + optional custom (balanced)

**Recommendation**: Option 3 (default with customization)

**Urgency**: HIGH - Blocked until resolved

@product-owner Please clarify before I proceed.

**Status**: Adding 'blocked' label until resolved"

# 4. ADD BLOCKED LABEL
gh issue edit [ISSUE-NUMBER] --add-label "blocked,needs-discussion"

# 5. WORK ON DIFFERENT ISSUE
```

### Issue: Tests Failing After Merge

**Problem**: PR merged but CI/CD pipeline failing on main branch.

**Solution**:

```bash
# 1. ACKNOWLEDGE IMMEDIATELY
gh issue comment [ISSUE-NUMBER] --body "**POST-MERGE FAILURE DETECTED**

Tests passing on feature branch but failing on main after merge.

**Error**: [paste error message]

**Investigating**: Checking for merge conflicts or race conditions.

ETA for fix: 1 hour"

# 2. CREATE HOTFIX BRANCH
git checkout main
git pull origin main
git checkout -b hotfix/[ISSUE-NUMBER]-test-failures

# 3. REPRODUCE LOCALLY
npm install  # Ensure dependencies match main
npm test     # Should reproduce failure

# 4. FIX ISSUE
# ... debug and fix ...

# 5. VERIFY FIX
npm test  # All tests pass

# 6. CREATE EMERGENCY PR
gh pr create \
  --title "Hotfix: Resolve test failures from #[ISSUE-NUMBER]" \
  --label "priority:critical,type:bug" \
  --body "## Emergency Fix
Tests failing on main after merge of #[ISSUE-NUMBER].

## Root Cause
[Explain why tests failed]

## Fix
[Explain what was changed]

## Verification
- [x] All tests passing locally
- [x] Linting passing
- [x] Build successful

## Request
Fast-track review needed to unblock CI/CD."

# 7. REQUEST URGENT REVIEW
# Ping team members for immediate review

# 8. AFTER MERGE, UPDATE ORIGINAL ISSUE
gh issue comment [ISSUE-NUMBER] --body "Post-merge test failures resolved via hotfix PR #[HOTFIX-PR-NUMBER].

**Lesson Learned**: [What to do differently next time]

**Prevention**: [How to prevent similar issues]"
```

---

## Summary

**You are now ready to start development on Pressograph!**

**Quick recap:**

1. **Read** mandatory documentation (AI_AGENT_INSTRUCTIONS.md, DEFINITION_OF_DONE.md)
2. **Select** issue from current sprint milestone
3. **Verify** Definition of Ready
4. **Create** feature branch (type/issue-number-description)
5. **Implement** with TDD
6. **Verify** Definition of Done
7. **Create** PR with complete checklist
8. **Respond** to review feedback
9. **Merge** and close issue
10. **Update** daily with progress

**Remember:**

- WIP limit: Max 2 in-progress issues
- Daily updates: Comment by 10:00 UTC
- Escalate: Blockers >24 hours
- DoD: All 12 criteria before closing

**Need help?**

- Check: `/opt/projects/repositories/project-genesis/docs/scrum/AI_AGENT_INSTRUCTIONS.md`
- Ask: Comment on issue with `@scrum-master` or `@product-owner`
- Escalate: Add `blocked` or `needs-discussion` label

**Next Step**: Go to [AI Agent Quick Start](./AI_AGENT_QUICK_START.md) for a condensed checklist.

---

**Version**: 1.0
**Last Updated**: 2025-11-01
**Maintained By**: Pressograph Team

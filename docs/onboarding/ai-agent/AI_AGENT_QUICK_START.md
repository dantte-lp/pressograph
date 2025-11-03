# AI Agent Quick Start - Pressograph

**Purpose**: Condensed, copy-paste ready checklist for immediate onboarding and development.

---

## Step 1: Read Documentation (30 minutes)

**MANDATORY - Read in order:**

- [ ] Read: `/opt/projects/repositories/project-genesis/docs/scrum/AI_AGENT_INSTRUCTIONS.md` (20 min)
- [ ] Read: `/opt/projects/repositories/project-genesis/docs/scrum/DEFINITION_OF_DONE.md` (5 min)
- [ ] Read: `/opt/projects/repositories/pressograph/README.md` (5 min)
- [ ] Read: `/opt/projects/repositories/pressograph/.scrum-config` (2 min)

---

## Step 2: Understand Project (15 minutes)

**Review current sprint:**

```bash
# List current sprint issues
gh issue list --milestone "$(gh api repos/dantte-lp/pressograph/milestones | jq -r '.[0].title')" --json number,title,labels

# Check assigned issues
gh issue list --assignee @me --state open
```

**Technology Stack:**

- **Frontend**: React 19.2.0, TypeScript 5.9, Vite 7.1.12, Tailwind CSS 4
- **Backend**: Node.js 22 LTS, Express.js, TypeScript, PostgreSQL 18
- **Container**: Podman (NOT Docker), Debian Trixie base (NO Alpine)
- **Testing**: Vitest, coverage ≥60%
- **Quality**: ESLint, Prettier, TypeScript strict mode

**Project Configuration:**

- Sprint duration: 2 weeks
- Velocity target: 25 story points
- WIP limit: 2 in-progress issues max
- Story points: Fibonacci (1, 2, 3, 5, 8, 13)

---

## Step 3: Environment Setup (10 minutes)

```bash
# Navigate to project
cd /opt/projects/repositories/pressograph

# Install dependencies
npm install

# Verify setup
npm run lint        # Should complete without errors
npm run type-check  # Should complete without errors
npm test            # Should pass (or show documented failures)

# Start development environment (choose one):

# Option 1: Local development
npm run dev

# Option 2: Full stack with Podman Compose
make init-env-dev
make dev-compose
```

**Verify environment:**

```bash
# Check services
curl http://localhost:5173/       # Frontend
curl http://localhost:3001/health # Backend
```

**Verify GitHub access:**

```bash
# Test GitHub CLI
gh auth status
gh issue list --limit 5
```

---

## Step 4: Start First Task (Now!)

### 4.1 Select Issue

```bash
# List current sprint issues
gh issue list --milestone "Sprint 1" --state open --no-assignee

# View issue details
gh issue view [ISSUE-NUMBER]
```

### 4.2 Verify Definition of Ready

- [ ] Clear title
- [ ] User story or problem statement
- [ ] Acceptance criteria (3-8 items)
- [ ] Story points estimated (`points:X` label)
- [ ] No blockers
- [ ] Small enough (<8 points)
- [ ] Testable
- [ ] Understood

**If NOT ready**: Comment on issue requesting clarification, work on different issue.

### 4.3 Assign and Start

```bash
# Assign to yourself
gh issue edit [ISSUE-NUMBER] --add-assignee @me

# Update status
gh issue edit [ISSUE-NUMBER] --add-label "sprint:in-progress"

# Comment with start notification
gh issue comment [ISSUE-NUMBER] --body "Starting work on this issue. ETA: [date]"
```

### 4.4 Create Branch

```bash
# Checkout main and pull latest
git checkout main
git pull origin main

# Create feature branch
git checkout -b [type]/[issue-number]-[brief-description]

# Examples:
# feature/4-health-check-enhancement
# bugfix/23-theme-performance
# refactor/42-graphcanvas-optimization
# docs/21-api-documentation
```

### 4.5 Implement with TDD

**Test-Driven Development:**

1. Write test first (RED)
2. Run test (verify it fails)
3. Implement feature (GREEN)
4. Run test (verify it passes)
5. Refactor (if needed)

```bash
# Run tests during development
npm test -- [test-file].test.ts

# Check coverage
npm run test:coverage
```

### 4.6 Verify Code Quality

```bash
# Before committing, run all checks
npm run lint        # ESLint check
npm run format      # Prettier format
npm run type-check  # TypeScript check
npm test            # All tests
npm run build       # Build check
```

### 4.7 Verify Definition of Done

**Before creating PR, verify ALL criteria:**

**Code Quality (8/8)**:

- [ ] Code follows style guide (ESLint, Prettier)
- [ ] No TypeScript errors (strict mode)
- [ ] No linting errors or warnings
- [ ] Code is self-documenting
- [ ] Complex logic has comments
- [ ] No commented-out code
- [ ] No console.log statements
- [ ] No hardcoded values

**Testing (5/5)**:

- [ ] Unit tests written
- [ ] All tests passing
- [ ] Coverage ≥60%
- [ ] Edge cases covered
- [ ] Error conditions tested

**Documentation (4/4)**:

- [ ] README updated (if needed)
- [ ] API docs updated
- [ ] Inline comments added
- [ ] CHANGELOG.md updated

**i18n (3/3)**:

- [ ] All text uses i18n keys (if UI change)
- [ ] Translations for ru/en provided
- [ ] No hardcoded strings

**Accessibility (6/6)** (if UI change):

- [ ] Semantic HTML
- [ ] Proper heading hierarchy
- [ ] ARIA labels added
- [ ] Keyboard navigation works
- [ ] Focus indicators visible
- [ ] Color contrast ≥4.5:1

**Performance (4/4)** (if frontend change):

- [ ] No unnecessary re-renders
- [ ] Memoization used (React.memo, useMemo, useCallback)
- [ ] Zustand uses useShallow
- [ ] Images optimized

**Security (4/4)**:

- [ ] No sensitive data in code
- [ ] Input validation implemented
- [ ] XSS prevention verified
- [ ] npm audit clean

**Acceptance (4/4)**:

- [ ] All acceptance criteria met
- [ ] Product Owner approved (if needed)
- [ ] Edge cases handled
- [ ] Error messages clear

### 4.8 Commit and Push

```bash
# Stage changes
git add .

# Commit with conventional commit message
git commit -m "[type]: [description] (#[issue-number])

[Detailed description of changes]

Relates to #[issue-number]"

# Examples:
# feat: add health check endpoint (#4)
# fix: resolve theme switching lag (#23)
# refactor: extract GraphCanvas hooks (#42)
# docs: update API documentation (#21)

# Push branch
git push -u origin [branch-name]
```

### 4.9 Create Pull Request

```bash
gh pr create \
  --title "[Type] [Description] (#[ISSUE-NUMBER])" \
  --body "$(cat <<'EOF'
## Changes
[Brief description of what changed and why]

## Related Issues
Closes #[ISSUE-NUMBER]

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Refactoring
- [ ] Documentation
- [ ] Performance improvement
- [ ] Test coverage

## How to Test
1. [Step 1]
2. [Step 2]
3. [Expected behavior]

## Definition of Done Checklist

### Code Quality
- [ ] Code follows style guide (ESLint, Prettier)
- [ ] No TypeScript errors (strict mode)
- [ ] No linting errors or warnings
- [ ] Code is self-documenting
- [ ] Complex logic has comments
- [ ] No commented-out code
- [ ] No console.log statements
- [ ] No hardcoded values

### Testing
- [ ] Unit tests written
- [ ] All tests passing
- [ ] Coverage ≥60%
- [ ] Edge cases covered
- [ ] Error conditions tested

### Code Review
- [ ] PR created and linked
- [ ] Self-reviewed
- [ ] Approved by team member
- [ ] All comments addressed
- [ ] No unresolved conversations

### Documentation
- [ ] README updated (if needed)
- [ ] API docs updated
- [ ] Inline comments added
- [ ] CHANGELOG.md updated

### i18n
- [ ] All text uses i18n keys
- [ ] Translations for ru/en provided
- [ ] No hardcoded strings

### Accessibility
- [ ] Semantic HTML
- [ ] Proper heading hierarchy
- [ ] ARIA labels added
- [ ] Keyboard navigation works
- [ ] Focus indicators visible
- [ ] Color contrast ≥4.5:1

### Performance
- [ ] No unnecessary re-renders
- [ ] Memoization used
- [ ] Zustand uses useShallow
- [ ] Images optimized

### Security
- [ ] No sensitive data in code
- [ ] Input validation implemented
- [ ] XSS prevention verified
- [ ] npm audit clean

### Acceptance
- [ ] All acceptance criteria met
- [ ] Product Owner approved
- [ ] Edge cases handled
- [ ] Error messages clear

### Deployment
- [ ] Merged to main
- [ ] CI/CD passing
- [ ] Deployed to staging
- [ ] Smoke tests passed

### Cleanup
- [ ] No dead code
- [ ] Temporary files removed
- [ ] Debug code removed
- [ ] Git branch deleted

## Notes for Reviewers
[Specific areas to focus on, new dependencies, breaking changes]

**Estimated review time**: [X] minutes
EOF
)" \
  --base main
```

### 4.10 Update Issue Status

```bash
# Update label
gh issue edit [ISSUE-NUMBER] --remove-label "sprint:in-progress" --add-label "sprint:review"

# Comment on issue
gh issue comment [ISSUE-NUMBER] --body "PR created: #[PR-NUMBER]

Implementation complete. All DoD criteria met except those pending review.

**Next Steps**:
- Awaiting code review
- Will address feedback promptly
- Will merge after approval

ETA: [date]"
```

### 4.11 Respond to Review

**When reviewer comments:**

```bash
# View comments
gh pr view [PR-NUMBER] --comments

# Address feedback
# ... make changes ...

# Commit updates
git add .
git commit -m "fix: address PR review comments

[Description of changes]

Relates to #[issue-number]"

git push

# Respond to reviewer
gh pr comment [PR-NUMBER] --body "All feedback addressed. Ready for re-review."
```

### 4.12 Merge and Close

**After approval:**

```bash
# Merge with squash
gh pr merge [PR-NUMBER] --squash --delete-branch

# Close issue (if not auto-closed)
gh issue close [ISSUE-NUMBER] --comment "Completed and merged via PR #[PR-NUMBER]. All DoD criteria verified."
```

---

## Daily Checklist

**Every day:**

```bash
# Check assigned issues
gh issue list --assignee @me --state open

# Check PRs awaiting review
gh pr list --review-requested @me

# Check your PRs
gh pr list --author @me --state open
```

**Update in-progress issues (by 10:00 UTC):**

```bash
gh issue comment [ISSUE-NUMBER] --body "## Daily Update - $(date -I)

**Progress Yesterday**:
- [What you completed]

**Work Today**:
- [What you're working on]

**Blockers**: [None / Description]

**ETA**: [Expected completion date]"
```

**Respond to PR reviews:**

- Within 4 hours during work hours
- Address all comments
- Request re-review when ready

**Flag blockers immediately:**

```bash
# Add blocked label
gh issue edit [ISSUE-NUMBER] --add-label "blocked"

# Comment with details
gh issue comment [ISSUE-NUMBER] --body "**BLOCKED**

**Reason**: [Why blocked]
**Impact**: [What's affected]
**Need**: [What you need to unblock]
**Urgency**: [High/Medium/Low]

@scrum-master @product-owner"
```

---

## Reference Card (Keep Handy)

### Quick Commands

```bash
# Issues
gh issue list --assignee @me
gh issue view [NUMBER]
gh issue edit [NUMBER] --add-label "sprint:in-progress"
gh issue comment [NUMBER] --body "Update"
gh issue close [NUMBER]

# Pull Requests
gh pr list --author @me
gh pr create --title "Title" --body "Description"
gh pr view [NUMBER]
gh pr merge [NUMBER] --squash --delete-branch

# Git
git checkout -b feature/4-description
git add .
git commit -m "feat: description (#4)"
git push -u origin feature/4-description

# Quality Checks
npm run lint
npm run type-check
npm test
npm run test:coverage
npm run build
```

### Story Points Scale

| Points | Time    | Complexity | Example                          |
| ------ | ------- | ---------- | -------------------------------- |
| 1      | <2h     | Trivial    | Typo fix, config change          |
| 2      | 2-4h    | Small      | Minor UI tweak, small docs       |
| 3      | 1 day   | Medium     | API endpoint, moderate feature   |
| 5      | 2 days  | Large      | Significant feature, UI redesign |
| 8      | 4 days  | Very Large | Major feature, large refactor    |
| 13     | 1+ week | Epic       | **SPLIT THIS**                   |

### Branch Naming

```
feature/[issue-number]-[description]
bugfix/[issue-number]-[description]
refactor/[issue-number]-[description]
docs/[issue-number]-[description]
```

### Commit Message Format

```
[type]: [description] (#[issue-number])

[detailed description]

Relates to #[issue-number]
```

**Types**: feat, fix, refactor, docs, test, chore, perf, style

### Definition of Done (Quick Check)

- ✓ Code style (ESLint, Prettier)
- ✓ No TypeScript errors
- ✓ Tests pass (coverage ≥60%)
- ✓ PR reviewed and approved
- ✓ i18n keys (if UI)
- ✓ Accessibility (WCAG 2.1 AA, if UI)
- ✓ Performance (no unnecessary re-renders, if frontend)
- ✓ Security (input validation, no XSS)
- ✓ Documentation updated
- ✓ CHANGELOG updated
- ✓ CI/CD passing
- ✓ Deployed to staging

### WIP Limits

- **Max 2** issues with `sprint:in-progress` label
- Finish current work before starting new work

### Daily Updates

- Post by **10:00 UTC**
- Comment on **ALL** in-progress issues
- Include: Progress, Today's work, Blockers, ETA

### Escalation

**Escalate immediately if:**

- Blocked >24 hours
- Unclear requirements
- Conflicting instructions
- Security vulnerability
- Breaking change needed

**How to escalate:**

```bash
gh issue edit [NUMBER] --add-label "blocked"
gh issue comment [NUMBER] --body "**BLOCKED** [details] @scrum-master"
```

---

## Common Pitfalls (Avoid These!)

❌ **DON'T**:

- Start work without GitHub issue
- Skip Definition of Ready check
- Commit directly to main
- Skip tests ("I'll add them later")
- Skip linting ("I'll fix it before PR")
- Create PR without DoD checklist
- Merge without approval
- Go silent for >24 hours on active work
- Work on >2 issues simultaneously
- Guess when requirements unclear

✅ **DO**:

- Create issue before starting work
- Verify Definition of Ready
- Create feature branch
- Write tests first (TDD)
- Run quality checks before commit
- Fill out complete PR template
- Wait for approval before merge
- Update issues daily
- Respect WIP limit (≤2 in-progress)
- Ask when in doubt

---

## Help and Support

**Need help?**

1. **Check documentation**:
   - `/opt/projects/repositories/project-genesis/docs/scrum/AI_AGENT_INSTRUCTIONS.md`
   - `/opt/projects/repositories/pressograph/docs/AI_AGENT_ONBOARDING.md`

2. **Ask on issue**:

   ```bash
   gh issue comment [NUMBER] --body "Question: [your question] @scrum-master"
   ```

3. **Escalate**:
   ```bash
   gh issue edit [NUMBER] --add-label "needs-discussion"
   ```

**Troubleshooting**:

- Definition of Ready not met → Comment on issue, work on different issue
- Blocked >24h → Add `blocked` label, escalate
- PR rejected → Read feedback, ask questions, address comments
- DoD too complex → Focus on critical items, ask for help
- Conflicting requirements → Add `needs-discussion`, escalate

---

## Next Steps

**After completing first task:**

1. Review what went well and what didn't
2. Identify areas for improvement
3. Bring to Sprint Retrospective
4. Continue with next sprint task

**Keep improving:**

- Learn from PR reviews
- Refine estimation accuracy
- Improve code quality
- Increase velocity

**Stay engaged:**

- Participate in Sprint ceremonies
- Propose process improvements
- Help other team members
- Contribute to documentation

---

**You're ready to start! Good luck! 🚀**

For detailed explanations, see [AI Agent Onboarding Guide](./AI_AGENT_ONBOARDING.md).

---

**Version**: 1.0
**Last Updated**: 2025-11-01
**Maintained By**: Pressograph Team

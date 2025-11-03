# User Actions for AI-Assisted Development

**Purpose**: Exactly what YOU (the human) need to do to enable effective AI agent development on Pressograph.
**Audience**: Product Owner, Scrum Master, Human Developers
**Last Updated**: 2025-11-01

---

## Quick Answer: What Are Your Actions?

As the human overseeing AI-assisted development, your role is:

1. **Prepare the environment** (one-time setup)
2. **Create and refine issues** (ongoing backlog management)
3. **Onboard AI agents** (when adding new AI developers)
4. **Monitor progress** (daily oversight)
5. **Review and approve work** (code review and acceptance)
6. **Guide the process** (Scrum ceremonies and course correction)

**Estimated time commitment**:

- **Initial setup**: 2-4 hours (one-time)
- **Daily**: 30-60 minutes (issue review, PR approval, unblocking)
- **Weekly**: 2-3 hours (Sprint Planning, Review, Retrospective)

---

## Table of Contents

1. [Before Starting Development](#1-before-starting-development)
2. [When Onboarding AI Agent](#2-when-onboarding-ai-agent)
3. [During Development (Daily Tasks)](#3-during-development-daily-tasks)
4. [Sprint Ceremonies (Your Role)](#4-sprint-ceremonies-your-role)
5. [Monitoring AI Agent Performance](#5-monitoring-ai-agent-performance)
6. [Troubleshooting and Intervention](#6-troubleshooting-and-intervention)

---

## 1. Before Starting Development

### 1.1 Verify Project Infrastructure

**Check Project Genesis is accessible:**

```bash
# Verify Project Genesis exists
ls -la /opt/projects/repositories/project-genesis/docs/scrum/

# Expected files:
# - AI_AGENT_INSTRUCTIONS.md
# - SCRUM_PROCESS.md
# - DEFINITION_OF_DONE.md
# - BACKLOG_REFINEMENT.md
# - ESTIMATION_GUIDE.md
```

**Action**: If any file is missing, do NOT proceed. Set up Project Genesis first.

**Check .scrum-config:**

```bash
cat /opt/projects/repositories/pressograph/.scrum-config | grep scrum_framework

# Expected output:
# scrum_framework: ../project-genesis
```

**Action**: If not pointing to Project Genesis, update `.scrum-config`.

### 1.2 Create GitHub Milestones (Sprints)

**Create first sprint milestone:**

```bash
# Create Sprint 1 milestone
gh api repos/dantte-lp/pressograph/milestones \
  -X POST \
  -f title="Sprint 1: Foundation & Setup" \
  -f description="## Sprint Goal
Establish development environment and complete initial features.

## Committed Work
- Setup automated testing infrastructure
- Implement user authentication
- Create basic UI components

## Capacity
- Team capacity: 25 story points
- Velocity (last 3 sprints): N/A (first sprint)
- Buffer: 15% for unknowns

## Sprint Dates
- Start: $(date -I)
- End: $(date -I -d '+14 days')
- Sprint Review: $(date -I -d '+13 days') 14:00 UTC
- Retrospective: $(date -I -d '+13 days') 16:00 UTC" \
  -f due_on="$(date -I -d '+14 days')T23:59:59Z"

# Verify milestone created
gh api repos/dantte-lp/pressograph/milestones | jq '.[0].title'
```

**Create Product Backlog milestone:**

```bash
# Create Product Backlog milestone (for unscheduled issues)
gh api repos/dantte-lp/pressograph/milestones \
  -X POST \
  -f title="Product Backlog" \
  -f description="Issues that are ready for development but not yet assigned to a sprint."
```

**Action**: Repeat for subsequent sprints as needed.

### 1.3 Create Labels

**Verify required labels exist:**

```bash
# List existing labels
gh label list

# Create missing labels (if needed)
gh label create "type:feature" --description "New feature" --color "0e8a16"
gh label create "type:bug" --description "Bug fix" --color "d73a4a"
gh label create "type:refactoring" --description "Code refactoring" --color "fbca04"
gh label create "type:documentation" --description "Documentation update" --color "0075ca"
gh label create "type:technical-debt" --description "Technical debt" --color "b60205"

gh label create "priority:critical" --description "Critical priority" --color "b60205"
gh label create "priority:high" --description "High priority" --color "d93f0b"
gh label create "priority:medium" --description "Medium priority" --color "fbca04"
gh label create "priority:low" --description "Low priority" --color "0e8a16"

gh label create "points:1" --description "1 story point" --color "c2e0c6"
gh label create "points:2" --description "2 story points" --color "bfdadc"
gh label create "points:3" --description "3 story points" --color "c5def5"
gh label create "points:5" --description "5 story points" --color "d4c5f9"
gh label create "points:8" --description "8 story points" --color "f9c5d1"
gh label create "points:13" --description "13 story points (split this)" --color "d93f0b"

gh label create "sprint:planned" --description "Committed to sprint" --color "0e8a16"
gh label create "sprint:in-progress" --description "Currently working" --color "fbca04"
gh label create "sprint:review" --description "PR created, awaiting review" --color "0075ca"
gh label create "sprint:done" --description "Completed and verified" --color "0e8a16"

gh label create "blocked" --description "Work is blocked" --color "b60205"
gh label create "needs-discussion" --description "Needs discussion" --color "d4c5f9"
gh label create "process-improvement" --description "Process improvement" --color "0075ca"
```

**Action**: Verify all labels exist. AI agent will use these for issue tracking.

### 1.4 Create Initial Issues

**Create 5-10 starter issues for AI agent to work on.**

**Template for creating issues:**

```bash
gh issue create \
  --title "[Type] Brief description" \
  --body "$(cat <<'EOF'
## User Story (for features)
As a [role], I want [feature] so that [benefit].

## Problem Statement (for bugs)
[What is broken and impact]

## Acceptance Criteria
- [ ] Specific, testable criterion 1
- [ ] Specific, testable criterion 2
- [ ] Specific, testable criterion 3

## Technical Details
[Implementation approach, files to modify, dependencies]

## Definition of Done
Standard DoD from Project Genesis applies:
- All code follows style guide (ESLint, Prettier, TypeScript strict mode)
- Tests written (coverage ≥60%)
- PR reviewed and approved
- Documentation updated
- i18n keys added (if UI change)
- Accessibility verified (WCAG 2.1 AA, if UI change)
- CI/CD passing
- Deployed to staging

## Estimate
[X] story points ([Y] days)
EOF
)" \
  --label "type:feature,priority:medium" \
  --milestone "Sprint 1: Foundation & Setup"
```

**Example issues to create:**

1. **Health Check Enhancement** (3 points):

   ```bash
   gh issue create \
     --title "Add health check endpoint enhancement" \
     --body "..." \
     --label "type:feature,priority:medium,points:3" \
     --milestone "Sprint 1"
   ```

2. **ESLint Configuration** (2 points):

   ```bash
   gh issue create \
     --title "Configure ESLint with recommended rules" \
     --body "..." \
     --label "type:technical-debt,priority:high,points:2" \
     --milestone "Sprint 1"
   ```

3. **Documentation Update** (1 point):

   ```bash
   gh issue create \
     --title "Update API documentation for authentication endpoints" \
     --body "..." \
     --label "type:documentation,priority:low,points:1" \
     --milestone "Sprint 1"
   ```

4. **Bug Fix** (3 points):

   ```bash
   gh issue create \
     --title "Fix theme switching performance lag" \
     --body "..." \
     --label "type:bug,priority:high,points:3" \
     --milestone "Sprint 1"
   ```

5. **Feature** (5 points):
   ```bash
   gh issue create \
     --title "Implement user profile page" \
     --body "..." \
     --label "type:feature,priority:medium,points:5" \
     --milestone "Sprint 1"
   ```

**Action**: Create 5-10 issues with variety (features, bugs, documentation, technical debt).

### 1.5 Understand Current Project State

**Read handoff reports:**

- `/opt/projects/repositories/pressograph/HANDOFF_REPORT_INFRASTRUCTURE.md`
- `/opt/projects/repositories/pressograph/HANDOFF_REPORT_FRONTEND.md`

**Review codebase:**

```bash
cd /opt/projects/repositories/pressograph

# Review project structure
tree -L 2 -I 'node_modules|dist'

# Check recent changes
git log --oneline --graph --decorate -20

# Review open issues
gh issue list --state open
```

**Action**: Familiarize yourself with what's built, what's pending, and known issues.

---

## 2. When Onboarding AI Agent

### 2.1 Point AI Agent to Documentation

**Provide AI agent with these paths:**

```markdown
Welcome to the Pressograph project! Please start by reading the following documentation:

**MANDATORY (read in order, ~30 minutes total):**

1. AI Agent Operating Manual (20 min):
   /opt/projects/repositories/project-genesis/docs/scrum/AI_AGENT_INSTRUCTIONS.md

2. Definition of Done Checklist (5 min):
   /opt/projects/repositories/project-genesis/docs/scrum/DEFINITION_OF_DONE.md

3. Pressograph README (5 min):
   /opt/projects/repositories/pressograph/README.md

4. Pressograph Configuration (2 min):
   /opt/projects/repositories/pressograph/.scrum-config

**QUICK START:**

For immediate onboarding, see:
/opt/projects/repositories/pressograph/docs/AI_AGENT_QUICK_START.md

**COMPLETE GUIDE:**

For detailed workflow, see:
/opt/projects/repositories/pressograph/docs/AI_AGENT_ONBOARDING.md

After reading, confirm understanding by checking the Quick Start checklist.
```

### 2.2 Provide Context About Current Sprint

**Share sprint information:**

```markdown
**Current Sprint**: Sprint 1: Foundation & Setup
**Sprint Goal**: Establish development environment and complete initial features
**Sprint Dates**: 2025-11-01 to 2025-11-14 (2 weeks)
**Velocity Target**: 25 story points
**Team Capacity**: 25 story points (adjust based on availability)

**Committed Work** (example):

- Health check enhancement (3 points)
- ESLint configuration (2 points)
- API documentation update (1 point)
- Theme switching bug fix (3 points)
- User profile page (5 points)
- Testing infrastructure (5 points)
- Database migration system (5 points)

**Total**: 24 points (within capacity)

**View sprint issues**:
gh issue list --milestone "Sprint 1"
```

### 2.3 Assign First Issue

**Select appropriate first issue:**

Criteria for good first issue:

- **Small scope** (2-3 story points)
- **Clear requirements** (meets Definition of Ready)
- **Low risk** (not critical functionality)
- **Self-contained** (minimal dependencies)
- **Representative** (demonstrates full workflow)

**Assign issue:**

```bash
# Assign issue to AI agent
gh issue edit [ISSUE-NUMBER] --add-assignee @ai-agent-username

# Comment with guidance
gh issue comment [ISSUE-NUMBER] --body "This is your first issue!

Please:
1. Verify it meets Definition of Ready
2. Create feature branch: feature/[issue-number]-[description]
3. Implement with TDD
4. Verify Definition of Done before creating PR
5. Update this issue daily with progress

If anything is unclear, ask questions by commenting here with @[your-username].

Expected completion: 1-2 days"
```

### 2.4 Set Expectations

**Communicate expectations:**

```markdown
**Development Workflow:**

1. Work on one issue at a time (WIP limit: 2 max)
2. Update issue status daily with progress comment (by 10:00 UTC)
3. Create PR when implementation complete
4. Respond to PR review feedback within 4 hours (during work hours)
5. Flag blockers immediately (add "blocked" label + comment)

**Quality Standards:**

- All code must meet Definition of Done (12 universal criteria)
- Tests required (coverage ≥60%)
- TypeScript strict mode (no errors)
- ESLint passing (no warnings)
- Code reviewed and approved before merge

**Communication:**

- Comment on issues daily with progress
- Ask questions if requirements unclear
- Escalate blockers >24 hours
- Participate in Sprint ceremonies (Planning, Review, Retrospective)

**Sprint Commitment:**

- Committed work is PROTECTED (no new scope mid-sprint)
- If cannot complete, notify immediately
- Work pulled from Product Backlog to replace removed work
```

---

## 3. During Development (Daily Tasks)

### 3.1 Review Pull Requests

**Daily PR review (priority task):**

```bash
# List PRs awaiting your review
gh pr list --review-requested @me

# View PR details
gh pr view [PR-NUMBER]

# Review code changes
gh pr diff [PR-NUMBER]

# Check Definition of Done
# Verify AI agent filled out DoD checklist in PR description
```

**Review checklist:**

- [ ] Code follows style guide
- [ ] TypeScript strict mode (no errors)
- [ ] Tests written and passing
- [ ] Coverage ≥60%
- [ ] Documentation updated
- [ ] CHANGELOG updated
- [ ] Acceptance criteria met
- [ ] No security vulnerabilities

**Provide feedback:**

```bash
# Approve PR
gh pr review [PR-NUMBER] --approve --body "LGTM! Code is clean, tests comprehensive, DoD met. Great work!"

# Request changes
gh pr review [PR-NUMBER] --request-changes --body "Please address the following before merge:

1. Line 42: This could cause a memory leak. Add cleanup in useEffect.
2. Line 78: Missing error handling for API failure.
3. Tests: Add test case for edge condition (empty array).

Otherwise looks good!"

# Comment (non-blocking feedback)
gh pr comment [PR-NUMBER] --body "Nice work! A few optional suggestions:

- Consider using useMemo for expensive calculation on line 56
- Variable naming: 'data' could be more specific ('chartData'?)

Not blocking, just ideas for future improvements."
```

**Action**: Review PRs within 4 hours during work hours. Approve if DoD met, request changes if issues found.

### 3.2 Monitor Issue Progress

**Check issue updates:**

```bash
# List in-progress issues
gh issue list --label "sprint:in-progress" --state open

# View issue details and comments
gh issue view [ISSUE-NUMBER]
```

**Red flags to watch for:**

- No daily update for >24 hours
- Issue stuck in same state for >3 days
- Blocker not escalated
- Work started without meeting Definition of Ready
- Multiple issues in-progress for single AI agent (>2)

**Intervention when needed:**

```bash
# If no update >24 hours
gh issue comment [ISSUE-NUMBER] --body "@ai-agent-username Can you provide a status update on this issue?

Expected daily updates by 10:00 UTC. Please let me know:
- Current progress
- Any blockers
- Expected completion date

Thanks!"

# If blocker detected
gh issue view [ISSUE-NUMBER]
# Check if "blocked" label added
# Check if escalation comment posted
# Take action to unblock (provide decision, clarify requirements, etc.)
```

### 3.3 Unblock AI Agent

**Common blockers and how to resolve:**

**Blocker: Unclear requirements**

```bash
gh issue comment [ISSUE-NUMBER] --body "Regarding your question about [topic]:

**Clarification**: [Clear explanation]

**Expected behavior**: [Specific behavior]

**Example**: [Code example or screenshot]

Does this answer your question? Please confirm understanding before proceeding."
```

**Blocker: Conflicting requirements**

```bash
gh issue comment [ISSUE-NUMBER] --body "Good catch on the conflicting requirements!

**Decision**: [Your decision]

**Reasoning**: [Why this approach]

**Action**: Please proceed with [specific approach]

I've updated the issue description to reflect this decision."

# Update issue description
gh issue edit [ISSUE-NUMBER] --body "[Updated description with clarification]"
```

**Blocker: External dependency**

```bash
gh issue comment [ISSUE-NUMBER] --body "I understand you're blocked by [external dependency].

**Action Plan**:
1. I will [your action to resolve]
2. Expected resolution: [timeframe]
3. In the meantime, please work on [alternative issue]

I've moved this issue to next sprint due to the blocker."

# Update milestone
gh issue edit [ISSUE-NUMBER] --milestone "Sprint 2"

# Assign alternative work
gh issue edit [OTHER-ISSUE] --add-assignee @ai-agent-username
```

### 3.4 Update Sprint Board

**Track sprint progress:**

```bash
# View sprint status
gh issue list --milestone "Sprint 1" --json number,title,labels,state

# Calculate velocity
gh issue list --milestone "Sprint 1" --state closed --json labels | \
  jq '[.[] | .labels[] | select(.name | startswith("points:")) | .name[7:] | tonumber] | add'
```

**Update sprint documentation:**

Track progress in a sprint tracking document (optional):

```markdown
# Sprint 1: Foundation & Setup

**Sprint Goal**: Establish development environment and complete initial features

**Dates**: 2025-11-01 to 2025-11-14

**Velocity Target**: 25 points

## Progress

**Completed** (12 points):

- [x] #4 - Health check enhancement (3 points)
- [x] #5 - ESLint configuration (2 points)
- [x] #6 - API documentation (1 point)
- [x] #7 - Theme switching bug fix (3 points)
- [x] #8 - Testing infrastructure (3 points)

**In Progress** (8 points):

- [ ] #9 - User profile page (5 points) - 60% complete
- [ ] #10 - Database migrations (3 points) - 30% complete

**Not Started** (5 points):

- [ ] #11 - Performance optimization (5 points)

**Velocity**: 12/25 points (48% - on track for Sprint Day 7)
```

---

## 4. Sprint Ceremonies (Your Role)

### 4.1 Sprint Planning (Start of Sprint)

**Duration**: 4 hours
**Your role**: Product Owner / Scrum Master

**Preparation (before Sprint Planning):**

1. **Refine Product Backlog**:
   - Review all issues in Product Backlog
   - Ensure top 10-15 issues meet Definition of Ready
   - Prioritize by business value

2. **Define Sprint Goal**:
   - What should be accomplished this sprint?
   - One sentence, clear objective

**During Sprint Planning:**

```bash
# 1. Present Sprint Goal
# Explain to AI agent what the sprint aims to achieve

# 2. Review Product Backlog
gh issue list --milestone "Product Backlog" --json number,title,labels

# 3. Select issues for sprint
# Discuss with AI agent:
# - Which issues align with Sprint Goal?
# - What is AI agent's capacity? (estimate based on velocity)
# - Any dependencies or risks?

# 4. Estimate unestimated stories
# For each issue, discuss:
# - Complexity
# - Effort
# - Uncertainty
# - Risk
# Add points:X label after consensus

# 5. Commit to Sprint Backlog
# Move issues to Sprint milestone
gh issue edit [ISSUE-NUMBER] --milestone "Sprint 1: Foundation & Setup"
gh issue edit [ISSUE-NUMBER] --add-label "sprint:planned"

# 6. Verify commitment
# Total points ≤ velocity target (25 points)
# Sprint Goal achievable with committed work?
```

**After Sprint Planning:**

```bash
# Update sprint milestone description
gh api repos/dantte-lp/pressograph/milestones/[MILESTONE-NUMBER] \
  -X PATCH \
  -f description="## Sprint Goal
[Sprint goal]

## Committed Work
- #[N] - [Title] ([X] points)
- #[N] - [Title] ([X] points)
...

## Capacity
- Team capacity: 25 story points
- Velocity (last 3 sprints): [avg velocity]
- Buffer: 15% for unknowns

## Sprint Dates
- Start: $(date -I)
- End: $(date -I -d '+14 days')
- Sprint Review: $(date -I -d '+13 days') 14:00 UTC
- Retrospective: $(date -I -d '+13 days') 16:00 UTC"
```

### 4.2 Daily Scrum (Daily, Async)

**Duration**: 15 minutes (or async via issue comments)
**Your role**: Observer / Scrum Master

**Async Daily Scrum:**

AI agent posts daily update on each in-progress issue by 10:00 UTC.

**Your review:**

```bash
# Check for daily updates
gh issue list --label "sprint:in-progress" --json number,title,comments

# Read updates
gh issue view [ISSUE-NUMBER]
```

**Your responses:**

- **If on track**: Acknowledge with thumbs up or brief comment
- **If blocker**: Provide guidance, unblock, or escalate
- **If unclear**: Ask clarifying questions
- **If off track**: Discuss adjustments, offer help

**Example responses:**

```bash
# On track
gh issue comment [ISSUE-NUMBER] --body "Great progress! Keep it up. 👍"

# Blocker detected
gh issue comment [ISSUE-NUMBER] --body "I see you're blocked on [blocker].

I'll [action to unblock]. Expect resolution by [time].

In the meantime, can you work on [alternative task]?"

# Off track
gh issue comment [ISSUE-NUMBER] --body "I notice this is taking longer than estimated.

**Original estimate**: 3 points (1 day)
**Actual time**: 3 days

Can we discuss what's causing the delay? Possible reasons:
- Underestimated complexity?
- Unclear requirements?
- Technical challenges?

Let's adjust the estimate and learn for future sprints."
```

**Action**: Review daily updates, respond to blockers, keep team on track.

### 4.3 Sprint Review (End of Sprint)

**Duration**: 2 hours
**Your role**: Product Owner

**Preparation (1 day before):**

```bash
# List completed work
gh issue list --milestone "Sprint 1" --state closed

# List uncompleted work
gh issue list --milestone "Sprint 1" --state open

# Calculate velocity
gh issue list --milestone "Sprint 1" --state closed --json labels | \
  jq '[.[] | .labels[] | select(.name | startswith("points:")) | .name[7:] | tonumber] | add'
```

**During Sprint Review:**

1. **Review Sprint Goal**: Was it achieved?

2. **Demo completed work**:
   - AI agent demonstrates each completed feature
   - You review functionality on staging
   - Verify acceptance criteria met

3. **Review incomplete work**:
   - Discuss why not completed
   - Decide: move to next sprint or back to backlog?

4. **Collect feedback**:
   - What worked well?
   - What could be improved?
   - New features needed?

5. **Update Product Backlog**:
   - Add new issues from feedback
   - Reprioritize based on learnings

**After Sprint Review:**

```bash
# Close completed issues (if not already closed)
gh issue close [ISSUE-NUMBER] --comment "Reviewed and accepted in Sprint Review. DoD verified. Deployed to staging."

# Move uncompleted issues
gh issue edit [ISSUE-NUMBER] --milestone "Sprint 2" --remove-label "sprint:in-progress"
gh issue comment [ISSUE-NUMBER] --body "Moved to Sprint 2 due to [reason]. [X]% complete. Remaining work: [description]"

# Create Sprint Summary
# Document in /docs/releases/sprint-1-summary.md
```

### 4.4 Sprint Retrospective (After Sprint Review)

**Duration**: 1.5 hours
**Your role**: Scrum Master

**Format** (rotate formats each sprint):

1. **Start-Stop-Continue**: What to start/stop/continue doing?
2. **Mad-Sad-Glad**: What made you mad/sad/glad?
3. **4Ls**: Liked, Learned, Lacked, Longed For

**Your preparation:**

```bash
# Review sprint metrics
# - Velocity (planned vs actual)
# - Completion rate
# - Blocked issues count
# - PR review time
# - DoD compliance rate
```

**During Retrospective:**

1. **Set the stage**: Create safe environment for honest feedback

2. **Gather data**:
   - What happened this sprint? (facts, not feelings)
   - Review metrics

3. **Generate insights**:
   - What patterns do we see?
   - What's the root cause?
   - What can we improve?

4. **Decide actions**:
   - Pick 1-3 actionable improvements
   - Assign owners and deadlines
   - Create GitHub issues for action items

5. **Close retrospective**:
   - Thank AI agent for participation
   - Commit to implementing action items

**Example action items:**

```bash
# Action item: Improve estimation accuracy
gh issue create \
  --title "Improve story point estimation accuracy" \
  --body "## Context
Our velocity this sprint was 18 points vs 25 planned (72% accuracy).

## Action
- Review estimation guide with team
- Calibrate estimation using past sprints
- Track actual vs estimated time

## Success Criteria
- Next sprint: 85%+ accuracy (planned vs actual velocity)

## Owner
@scrum-master

## Deadline
Before Sprint 2 Planning" \
  --label "process-improvement" \
  --assignee @scrum-master
```

---

## 5. Monitoring AI Agent Performance

### 5.1 Daily Check-ins

**What to monitor daily:**

```bash
# 1. Issue updates
gh issue list --label "sprint:in-progress" --json number,title,updatedAt | \
  jq '.[] | {number, title, lastUpdate: .updatedAt}'

# 2. PR activity
gh pr list --author @ai-agent-username --json number,title,reviews,checks

# 3. Blockers
gh issue list --label "blocked" --state open
```

**Red flags:**

- No update >24 hours
- Same issue in-progress >5 days
- PR not created after >3 days of work
- Multiple failed CI/CD checks
- PR open >3 days without review
- Blockers not escalated

**Action on red flags:**

```bash
# Reach out to AI agent
gh issue comment [ISSUE-NUMBER] --body "@ai-agent-username Status update please?

Expected daily updates by 10:00 UTC. Let me know if you're blocked or need help."
```

### 5.2 Check Definition of Done Compliance

**Review PR DoD checklists:**

```bash
# View PR description
gh pr view [PR-NUMBER]

# Check if all DoD items checked
# Verify claims by reviewing code
```

**Common DoD violations:**

- Tests not written or insufficient coverage
- TypeScript errors ignored
- Documentation not updated
- CHANGELOG not updated
- i18n keys missing (hardcoded strings)
- Accessibility not verified
- Performance not checked

**Action on DoD violations:**

```bash
gh pr review [PR-NUMBER] --request-changes --body "DoD Checklist Incomplete

**Issues**:
1. Tests: Coverage is 45% (need ≥60%)
2. Documentation: README not updated with new endpoint
3. i18n: Hardcoded string on line 42 ('Submit' should use t('common.submit'))

Please address these before merge. All DoD criteria must be met.

**Reference**: /opt/projects/repositories/project-genesis/docs/scrum/DEFINITION_OF_DONE.md"
```

### 5.3 Track Velocity and Burndown

**Calculate sprint progress:**

```bash
# Completed points
COMPLETED=$(gh issue list --milestone "Sprint 1" --state closed --json labels | \
  jq '[.[] | .labels[] | select(.name | startswith("points:")) | .name[7:] | tonumber] | add')

# Total committed points
TOTAL=$(gh issue list --milestone "Sprint 1" --json labels | \
  jq '[.[] | .labels[] | select(.name | startswith("points:")) | .name[7:] | tonumber] | add')

# Completion percentage
echo "Velocity: $COMPLETED / $TOTAL points ($(echo "scale=2; $COMPLETED * 100 / $TOTAL" | bc)%)"
```

**Create burndown chart** (manual or automated):

```
Sprint 1 Burndown

25 |●
   |  ●
20 |    ●
   |      ●
15 |        ●
   |          ○  ← Ideal
10 |            ●
   |              ●
5  |                ●
   |                  ●
0  |____________________●
   D1 D2 D3 D4 D5 D6 D7 D8 D9 D10 D11 D12 D13 D14

● Actual
○ Ideal
```

**Action**: If significantly off track, discuss with AI agent in daily updates.

### 5.4 Code Quality Metrics

**Monitor code quality:**

```bash
# Test coverage
npm run test:coverage

# TypeScript errors
npm run type-check

# Linting issues
npm run lint

# Build status
npm run build
```

**Track trends:**

- Is test coverage increasing or decreasing?
- Are TypeScript errors being introduced?
- Are linting violations recurring?
- Are build times increasing?

**Action**: Address quality regressions immediately.

---

## 6. Troubleshooting and Intervention

### 6.1 AI Agent Not Following Process

**Symptom**: AI agent skipping steps, not updating issues, ignoring DoD, etc.

**Diagnosis:**

```bash
# Check recent activity
gh issue list --author @ai-agent-username --json number,title,createdAt,labels
gh pr list --author @ai-agent-username --json number,title,createdAt,reviews
```

**Common issues:**

- Creating PRs without linked issues
- Not updating issue status daily
- Not filling out DoD checklist
- Committing directly to main
- Not responding to PR reviews

**Intervention:**

```bash
gh issue comment [ISSUE-NUMBER] --body "I noticed some process deviations.

**Issues observed**:
1. No daily updates on in-progress issues
2. PR created without DoD checklist
3. Direct commits to main branch

**Required**:
Please review the AI Agent Instructions:
/opt/projects/repositories/project-genesis/docs/scrum/AI_AGENT_INSTRUCTIONS.md

**Specifically**:
- Section 6.2.1: Daily progress reporting (REQUIRED by 10:00 UTC)
- Section 4.2: Definition of Done (all criteria must be met)
- Section 5.1: Branching strategy (NO direct commits to main)

**Action**:
- Comment on all in-progress issues with today's update
- Update PR with complete DoD checklist
- Revert direct commits and create proper feature branch

Let's get back on track. Let me know if any part of the process is unclear."
```

### 6.2 Quality Issues Recurring

**Symptom**: Same quality issues appearing in multiple PRs.

**Diagnosis:**

Pattern of:

- Missing tests
- TypeScript errors
- Linting violations
- Documentation gaps
- Performance issues

**Intervention:**

```bash
gh pr comment [PR-NUMBER] --body "I'm seeing a pattern of quality issues across your PRs.

**Recurring issues**:
1. Test coverage below 60% (last 3 PRs)
2. TypeScript strict mode violations (last 2 PRs)
3. Missing CHANGELOG updates (last 4 PRs)

**Root cause discussion needed**:
- Are the DoD criteria unclear?
- Is the tooling not working correctly?
- Are there time pressures causing shortcuts?

Let's schedule a pairing session to:
1. Review DoD checklist together
2. Set up pre-commit hooks for quality checks
3. Create automated reminders for common items

**Immediate action**:
Before creating next PR, run this checklist:
- [ ] npm run test:coverage → ≥60%
- [ ] npm run type-check → 0 errors
- [ ] npm run lint → 0 errors/warnings
- [ ] CHANGELOG.md updated
- [ ] README updated (if needed)

Quality is non-negotiable. Let's work together to meet standards consistently."
```

### 6.3 Blockers Not Being Escalated

**Symptom**: AI agent stuck on issue for >24h but no blocker label or escalation.

**Diagnosis:**

```bash
# Check issue update frequency
gh issue view [ISSUE-NUMBER] --json comments | \
  jq '.comments[] | {author: .author.login, createdAt}'

# Last update >24h ago with no progress?
```

**Intervention:**

```bash
gh issue comment [ISSUE-NUMBER] --body "I notice this issue has been in-progress for 3 days without significant progress.

**Expected**:
- Issues should be completed within estimated time (this was 3 points = 1 day)
- If blocked >24 hours, add 'blocked' label and escalate

**Status check**:
- Are you blocked? If yes, add 'blocked' label and explain blocker
- Is estimate wrong? Let's re-estimate
- Is scope too large? Let's split the issue

**Action**:
Please provide status update including:
1. What's completed so far (%)
2. What's blocking (if anything)
3. Revised ETA for completion

**Escalation process**:
If blocked, you MUST:
1. Add 'blocked' label to issue
2. Comment with blocker details
3. Tag @scrum-master or @product-owner
4. Provide options for unblocking

Let's get this unblocked. I'm here to help!"
```

### 6.4 Sprint Goal at Risk

**Symptom**: Halfway through sprint, committed work unlikely to complete.

**Diagnosis:**

```bash
# Calculate remaining work
REMAINING=$(gh issue list --milestone "Sprint 1" --state open --json labels | \
  jq '[.[] | .labels[] | select(.name | startswith("points:")) | .name[7:] | tonumber] | add')

echo "Remaining work: $REMAINING points"
echo "Days remaining: [calculate days until sprint end]"
echo "Points per day needed: [remaining / days]"
```

**Intervention:**

```bash
gh issue create \
  --title "Sprint Goal at Risk - Immediate Action Required" \
  --body "## Situation
We are halfway through Sprint 1 with significant work remaining.

**Metrics**:
- Completed: 8/25 points (32%)
- Remaining: 17 points
- Days remaining: 7 days
- Required velocity: 2.4 points/day (vs current 1.1 points/day)

**Sprint Goal**: [Sprint goal]
**At Risk**: YES

**Options**:
1. Remove scope (drop lowest priority issues)
2. Extend hours (overtime - NOT RECOMMENDED)
3. Accept partial completion (move work to next sprint)

**Recommendation**: Option 1 + Option 3

**Action Plan**:
1. Protect Sprint Goal: Keep issues critical to Sprint Goal
2. Remove non-critical work: Move #10, #11 to Sprint 2
3. Focus: AI agent works ONLY on Sprint Goal items
4. Daily check-ins: Increase oversight

**Decision needed**: @product-owner please approve scope reduction.

cc: @ai-agent-username" \
  --label "priority:critical,needs-discussion"
```

---

## Summary: Your Daily/Weekly Checklist

### Daily (30-60 minutes)

- [ ] Review PRs awaiting your approval
- [ ] Check in-progress issues for daily updates
- [ ] Respond to blockers and questions
- [ ] Unblock AI agent if stuck
- [ ] Monitor sprint progress (velocity, burndown)

### Weekly (2-3 hours)

**Sprint Planning** (start of sprint):

- [ ] Define Sprint Goal
- [ ] Refine Product Backlog (top 10-15 issues)
- [ ] Review and estimate stories with AI agent
- [ ] Commit to Sprint Backlog (≤25 points)
- [ ] Update sprint milestone

**Sprint Review** (end of sprint):

- [ ] Review completed work on staging
- [ ] Accept or reject completed features
- [ ] Discuss incomplete work
- [ ] Update Product Backlog with new ideas
- [ ] Calculate velocity

**Sprint Retrospective** (after review):

- [ ] Review sprint metrics
- [ ] Identify what went well/poorly
- [ ] Create 1-3 action items for improvement
- [ ] Document lessons learned

### As Needed

- [ ] Create new issues for Product Backlog
- [ ] Refine issues (add acceptance criteria, technical details)
- [ ] Onboard new AI agents
- [ ] Update process documentation
- [ ] Escalate critical issues

---

## Next Steps

**After completing this setup:**

1. **Onboard AI agent**: Point to [AI Agent Onboarding Guide](./AI_AGENT_ONBOARDING.md)
2. **Assign first issue**: Select 2-3 point starter issue
3. **Monitor daily**: Review updates and PRs
4. **Provide feedback**: Coach AI agent through first few issues
5. **Iterate**: Improve process based on retrospective learnings

**Remember**: Your role is to guide, unblock, and maintain quality. The AI agent executes, but you ensure direction and standards.

---

**Version**: 1.0
**Last Updated**: 2025-11-01
**Maintained By**: Pressograph Team

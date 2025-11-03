# Examples

Example code, configurations, and templates for AI agent onboarding and test data.

## Files

### AI Agent Onboarding

- `AI_AGENT_ONBOARDING_EXAMPLE.md` - Complete AI agent onboarding conversation example
- `FIRST_ISSUE_FOR_AI_AGENT.md` - First issue template for AI agents

### Test Data

- `example_complex_test.json` - Example complex test configuration

## Test Data Examples

### example_complex_test.json

Complex 24-hour pressure test example with multiple intermediate pressure checks.

**Features demonstrated:**

- 24.25 hour test duration (multi-day test)
- 5 pressure test stages with varying parameters
- Initial pressurization (0→32 MPa)
- Working pressure hold (70 MPa)
- Intermediate pressure checks at 0.5h, 8h, 17h, and 24h
- Controlled pressure drift (holdDrift parameter)
- Target pressure specification for intermediate tests

**Usage:**

Import this configuration via the UI:

1. Click "Import Settings" button
2. Select `example_complex_test.json`
3. Review and adjust parameters
4. Generate graph

Or use via API:

```bash
curl -X POST http://localhost:3001/api/v1/graph/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d @docs/examples/example_complex_test.json
```

## Creating Your Own Examples

Example JSON structure:

```json
{
  "testNumber": "YYYYMMDD-XX",
  "startDate": "YYYY-MM-DD",
  "startTime": "HH:MM:SS",
  "endDate": "YYYY-MM-DD",
  "endTime": "HH:MM:SS",
  "testDuration": 24.25,
  "workingPressure": 70,
  "maxPressure": 72,
  "temperature": 90,
  "pressureDuration": 15,
  "graphTitle": "Test Title",
  "showInfo": "under",
  "date": "YYYY-MM-DD",
  "pressureTests": [
    {
      "id": "test1",
      "time": 0,
      "duration": 30,
      "pressure": 32,
      "minPressure": 32,
      "maxPressure": 32,
      "targetPressure": 32,
      "holdDrift": 0
    }
  ]
}
```

## More Examples Coming Soon

- Simple 8-hour test
- Standard 15.33-hour test with 3 checks
- Extended 48-hour test with 7 checks
- Multi-level pressure test
- High-pressure test (>100 MPa)

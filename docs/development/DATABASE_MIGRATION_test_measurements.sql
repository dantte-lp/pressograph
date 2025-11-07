-- Migration: Add test_measurements table for real-time test run data
-- Date: 2025-11-07
-- Related to: Issue #96 - Run Test Interface Implementation
-- Commit: d8922f01

-- Create test_measurements table
CREATE TABLE IF NOT EXISTS test_measurements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_run_id UUID NOT NULL REFERENCES test_runs(id) ON DELETE CASCADE,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  pressure NUMERIC(10, 3) NOT NULL,
  temperature NUMERIC(6, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create index on test_run_id for faster queries
CREATE INDEX IF NOT EXISTS idx_test_measurements_test_run_id 
  ON test_measurements(test_run_id);

-- Create index on timestamp for time-series queries
CREATE INDEX IF NOT EXISTS idx_test_measurements_timestamp 
  ON test_measurements(test_run_id, timestamp DESC);

-- Add comment
COMMENT ON TABLE test_measurements IS 'Stores individual pressure and temperature measurements recorded during test runs for real-time monitoring and historical analysis';
COMMENT ON COLUMN test_measurements.test_run_id IS 'Foreign key to test_runs table (cascades on delete)';
COMMENT ON COLUMN test_measurements.timestamp IS 'Exact time when measurement was taken';
COMMENT ON COLUMN test_measurements.pressure IS 'Pressure value in test-configured units (MPa/Bar/PSI)';
COMMENT ON COLUMN test_measurements.temperature IS 'Optional temperature reading in Celsius';

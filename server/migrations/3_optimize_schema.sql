-- ═══════════════════════════════════════════════════════════════════
-- Migration: Schema Optimization and Performance Improvements
-- ═══════════════════════════════════════════════════════════════════
-- Adds missing indexes, constraints, and optimizations for production

-- ═══════════════════════════════════════════════════════════════════
-- Partitioning Preparation for graph_history (for future scaling)
-- ═══════════════════════════════════════════════════════════════════
-- Note: Actual partitioning would require table recreation
-- This migration adds indexes to support future partitioning

-- Add composite index for common query patterns
CREATE INDEX IF NOT EXISTS idx_graph_history_user_created
  ON graph_history(user_id, created_at DESC);

-- Add index for filtering by date range
CREATE INDEX IF NOT EXISTS idx_graph_history_created_date
  ON graph_history(DATE(created_at));

-- Add index for export format filtering
CREATE INDEX IF NOT EXISTS idx_graph_history_format_created
  ON graph_history(export_format, created_at DESC);

-- ═══════════════════════════════════════════════════════════════════
-- Audit Log Optimization
-- ═══════════════════════════════════════════════════════════════════

-- Composite index for common audit queries
CREATE INDEX IF NOT EXISTS idx_audit_log_user_action_created
  ON audit_log(user_id, action, created_at DESC);

-- Index for resource lookups
CREATE INDEX IF NOT EXISTS idx_audit_log_resource
  ON audit_log(resource_type, resource_id);

-- ═══════════════════════════════════════════════════════════════════
-- Share Links Optimization
-- ═══════════════════════════════════════════════════════════════════

-- Composite index for active share links
CREATE INDEX IF NOT EXISTS idx_share_links_active
  ON share_links(graph_id, expires_at)
  WHERE expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP;

-- ═══════════════════════════════════════════════════════════════════
-- Refresh Tokens Cleanup
-- ═══════════════════════════════════════════════════════════════════

-- Add index for cleanup queries (expired tokens)
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expired
  ON refresh_tokens(expires_at)
  WHERE revoked_at IS NULL;

-- ═══════════════════════════════════════════════════════════════════
-- Performance Statistics
-- ═══════════════════════════════════════════════════════════════════

-- Create statistics for query planner optimization
DO $$
BEGIN
  -- graph_history: JSONB settings column
  IF NOT EXISTS (
    SELECT 1 FROM pg_statistic_ext
    WHERE staname = 'graph_history_settings_stats'
  ) THEN
    CREATE STATISTICS graph_history_settings_stats (dependencies)
      ON user_id, settings FROM graph_history;
  END IF;

  -- audit_log: Multi-column statistics
  IF NOT EXISTS (
    SELECT 1 FROM pg_statistic_ext
    WHERE staname = 'audit_log_stats'
  ) THEN
    CREATE STATISTICS audit_log_stats (dependencies, ndistinct)
      ON user_id, action, resource_type FROM audit_log;
  END IF;
END $$;

-- ═══════════════════════════════════════════════════════════════════
-- Table Maintenance Settings
-- ═══════════════════════════════════════════════════════════════════

-- Set autovacuum settings for high-traffic tables
ALTER TABLE graph_history SET (
  autovacuum_vacuum_scale_factor = 0.05,
  autovacuum_analyze_scale_factor = 0.02
);

ALTER TABLE audit_log SET (
  autovacuum_vacuum_scale_factor = 0.05,
  autovacuum_analyze_scale_factor = 0.02
);

-- ═══════════════════════════════════════════════════════════════════
-- Add constraints for data integrity
-- ═══════════════════════════════════════════════════════════════════

-- Ensure positive file size
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'graph_history_file_size_positive'
  ) THEN
    ALTER TABLE graph_history
      ADD CONSTRAINT graph_history_file_size_positive
      CHECK (file_size IS NULL OR file_size > 0);
  END IF;
END $$;

-- Ensure positive generation time
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'graph_history_generation_time_positive'
  ) THEN
    ALTER TABLE graph_history
      ADD CONSTRAINT graph_history_generation_time_positive
      CHECK (generation_time_ms IS NULL OR generation_time_ms > 0);
  END IF;
END $$;

-- Ensure API key rate limit is reasonable
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'api_keys_rate_limit_reasonable'
  ) THEN
    ALTER TABLE api_keys
      ADD CONSTRAINT api_keys_rate_limit_reasonable
      CHECK (rate_limit > 0 AND rate_limit <= 10000);
  END IF;
END $$;

-- Ensure share link view count is non-negative
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'share_links_view_count_non_negative'
  ) THEN
    ALTER TABLE share_links
      ADD CONSTRAINT share_links_view_count_non_negative
      CHECK (view_count >= 0);
  END IF;
END $$;

-- ═══════════════════════════════════════════════════════════════════
-- Cleanup Functions
-- ═══════════════════════════════════════════════════════════════════

-- Function to clean up expired tokens
CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM refresh_tokens
  WHERE expires_at < CURRENT_TIMESTAMP
    AND revoked_at IS NULL;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up old audit logs (older than 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs(days INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM audit_log
  WHERE created_at < CURRENT_TIMESTAMP - (days || ' days')::INTERVAL;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up expired share links
CREATE OR REPLACE FUNCTION cleanup_expired_share_links()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM share_links
  WHERE expires_at IS NOT NULL
    AND expires_at < CURRENT_TIMESTAMP;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ═══════════════════════════════════════════════════════════════════
-- Monitoring Views
-- ═══════════════════════════════════════════════════════════════════

-- View for table sizes and bloat
CREATE OR REPLACE VIEW v_table_sizes AS
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total_size,
  pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) AS table_size,
  pg_size_pretty(pg_indexes_size(schemaname||'.'||tablename)) AS indexes_size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- View for index usage statistics
CREATE OR REPLACE VIEW v_index_usage AS
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan AS index_scans,
  idx_tup_read AS tuples_read,
  idx_tup_fetch AS tuples_fetched,
  pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_stat_user_indexes
ORDER BY idx_scan ASC;

-- View for unused indexes (candidates for removal)
CREATE OR REPLACE VIEW v_unused_indexes AS
SELECT
  schemaname,
  tablename,
  indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_stat_user_indexes
WHERE idx_scan = 0
  AND indexrelname NOT LIKE '%_pkey'
ORDER BY pg_relation_size(indexrelid) DESC;

-- ═══════════════════════════════════════════════════════════════════
-- Success Message
-- ═══════════════════════════════════════════════════════════════════

DO $$
BEGIN
  RAISE NOTICE 'Schema optimization migration completed successfully!';
  RAISE NOTICE 'Added % new indexes', (
    SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public'
  );
  RAISE NOTICE 'Created cleanup functions and monitoring views';
END $$;

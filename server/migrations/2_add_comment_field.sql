-- ═══════════════════════════════════════════════════════════════════
-- Migration: Add comment field to graph_history table
-- ═══════════════════════════════════════════════════════════════════

-- Add comment column to graph_history table
ALTER TABLE graph_history ADD COLUMN IF NOT EXISTS comment TEXT;

-- Create index for comment field (useful for searching)
CREATE INDEX IF NOT EXISTS idx_graph_history_comment ON graph_history USING gin(to_tsvector('english', COALESCE(comment, '')));

-- ═══════════════════════════════════════════════════════════════════
-- Initial Database Schema
-- ═══════════════════════════════════════════════════════════════════

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";      -- UUID generation functions
CREATE EXTENSION IF NOT EXISTS "pg_trgm";        -- Trigram text search
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements"; -- Query statistics
CREATE EXTENSION IF NOT EXISTS "btree_gin";      -- GIN index support for btree types
CREATE EXTENSION IF NOT EXISTS "btree_gist";     -- GIST index support for btree types

-- Users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('admin', 'user', 'viewer')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP
);

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- API Keys table
CREATE TABLE api_keys (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  key_hash VARCHAR(255) NOT NULL,
  name VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  rate_limit INTEGER DEFAULT 100,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_used_at TIMESTAMP
);

CREATE INDEX idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX idx_api_keys_key_hash ON api_keys(key_hash);

-- Graph generation history
CREATE TABLE graph_history (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  api_key_id INTEGER REFERENCES api_keys(id) ON DELETE SET NULL,
  test_number VARCHAR(50),
  settings JSONB NOT NULL,
  export_format VARCHAR(10) CHECK (export_format IN ('png', 'pdf', 'json')),
  file_path VARCHAR(500),
  file_size INTEGER,
  generation_time_ms INTEGER,
  status VARCHAR(20) DEFAULT 'success' CHECK (status IN ('success', 'failed', 'pending')),
  error_message TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_graph_history_user_id ON graph_history(user_id);
CREATE INDEX idx_graph_history_created_at ON graph_history(created_at);
CREATE INDEX idx_graph_history_test_number ON graph_history(test_number);
CREATE INDEX idx_graph_history_settings_gin ON graph_history USING gin(settings);
CREATE INDEX idx_graph_history_status ON graph_history(status);

-- Refresh tokens
CREATE TABLE refresh_tokens (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  revoked_at TIMESTAMP
);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token_hash ON refresh_tokens(token_hash);
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);

-- Audit log
CREATE TABLE audit_log (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(50) NOT NULL,
  resource_type VARCHAR(50),
  resource_id INTEGER,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at);
CREATE INDEX idx_audit_log_action ON audit_log(action);
CREATE INDEX idx_audit_log_details_gin ON audit_log USING gin(details);

-- Application settings
CREATE TABLE app_settings (
  id SERIAL PRIMARY KEY,
  key VARCHAR(100) UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_app_settings_key ON app_settings(key);

-- Public share links for graphs
CREATE TABLE share_links (
  id SERIAL PRIMARY KEY,
  share_token VARCHAR(64) UNIQUE NOT NULL,
  graph_id INTEGER REFERENCES graph_history(id) ON DELETE CASCADE,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  expires_at TIMESTAMP,
  view_count INTEGER DEFAULT 0,
  max_views INTEGER,
  allow_download BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_share_links_token ON share_links(share_token);
CREATE INDEX idx_share_links_graph_id ON share_links(graph_id);
CREATE INDEX idx_share_links_expires_at ON share_links(expires_at);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for users table
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger for app_settings table
CREATE TRIGGER update_app_settings_updated_at BEFORE UPDATE ON app_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

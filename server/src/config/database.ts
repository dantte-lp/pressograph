// ═══════════════════════════════════════════════════════════════════
// PostgreSQL Database Configuration
// ═══════════════════════════════════════════════════════════════════

import { Pool, PoolConfig } from 'pg';
import { logger } from '../utils/logger';

// Use DATABASE_URL if available, otherwise use individual env vars
const config: PoolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    }
  : {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'pressure_test_db',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '',
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    };

export const pool = new Pool(config);

// Test connection
pool.on('connect', () => {
  logger.info('✅ PostgreSQL connected');
});

pool.on('error', (err) => {
  logger.error('PostgreSQL error:', err);
});

// Helper function to execute queries
export const query = async (text: string, params?: any[]) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    logger.debug('Query executed', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    logger.error('Query error', { text, error });
    throw error;
  }
};

// Test database connection
export const testConnection = async (): Promise<boolean> => {
  try {
    await pool.query('SELECT NOW()');
    return true;
  } catch (error) {
    logger.error('Failed to connect to database:', error);
    return false;
  }
};

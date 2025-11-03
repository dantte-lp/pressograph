module.exports = {
  apps: [
    {
      name: 'nextjs-dev',
      script: 'pnpm',
      args: 'dev',
      cwd: '/workspace',
      interpreter: 'none',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
        PORT: '3000',
      },
      error_file: '/tmp/pm2/nextjs-error.log',
      out_file: '/tmp/pm2/nextjs-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
    },
    {
      name: 'drizzle-studio',
      script: 'pnpm',
      args: 'db:studio',
      cwd: '/workspace',
      interpreter: 'none',
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'development',
      },
      error_file: '/tmp/pm2/drizzle-error.log',
      out_file: '/tmp/pm2/drizzle-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
    },
  ],
};

module.exports = {
  apps: [
    {
      name: 'train-api',
      cwd: './api',
      script: 'dist/src/main.js',
      instances: 1,
      exec_mode: 'fork', // Giữ fork vì NestJS có Socket.io, Cron scheduler, BullMQ
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 9000,
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 9000,
      },
      error_file: '../logs/api-error.log',
      out_file: '../logs/api-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs: true,
    },
    {
      name: 'train-web',
      cwd: './web',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 4000',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 4000,
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 4000,
      },
      error_file: '../logs/web-error.log',
      out_file: '../logs/web-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs: true,
    },
  ],
};

module.exports = {
  apps: [
    {
      name: 'mupi-api',
      script: 'dist/main.js',
      exec_mode: 'cluster',
      instances: 'max',
      max_memory_restart: '500M',
      env_production: {
        NODE_ENV: 'production',
      },
      out_file: './logs/mupi-api.out.log',
      error_file: './logs/mupi-api.error.log',
      time: true,
    },
  ],
};


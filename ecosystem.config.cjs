module.exports = {
  apps: [
    {
      name: "japanese-news-pwa",
      script: "node_modules/next/dist/bin/next",
      args: "start",
      cwd: __dirname,
      exec_mode: "fork",
      instances: 1,
      env: {
        NODE_ENV: "production",
        HOSTNAME: "0.0.0.0",
        PORT: process.env.PORT || "3000",
      },
      max_memory_restart: "512M",
      time: true,
    },
  ],
};

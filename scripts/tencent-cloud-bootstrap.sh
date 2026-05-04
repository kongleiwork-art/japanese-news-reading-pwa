#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/japanese-news-pwa}"
NODE_MAJOR="${NODE_MAJOR:-22}"

if [ "$(id -u)" -eq 0 ]; then
  echo "Run this script as the deploy user, not root."
  exit 1
fi

sudo apt-get update
sudo apt-get install -y ca-certificates curl git nginx

if ! command -v node >/dev/null 2>&1 || ! node -v | grep -Eq "^v${NODE_MAJOR}\."; then
  curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" | sudo -E bash -
  sudo apt-get install -y nodejs
fi

sudo npm install -g pm2

sudo mkdir -p "$APP_DIR"
sudo chown -R "$USER:$USER" "$APP_DIR"

sudo systemctl enable nginx
sudo systemctl start nginx

pm2 startup systemd -u "$USER" --hp "$HOME"

echo "Tencent Cloud bootstrap finished."
echo "Deploy path: $APP_DIR"

#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/japanese-news-pwa}"
NODE_MAJOR="${NODE_MAJOR:-22}"

if [ "$(id -u)" -eq 0 ]; then
  echo "Run this script as the deploy user, not root."
  exit 1
fi

install_packages() {
  if command -v apt-get >/dev/null 2>&1; then
    sudo apt-get update
    sudo apt-get install -y ca-certificates curl git nginx
    return
  fi

  if command -v dnf >/dev/null 2>&1; then
    sudo dnf install -y ca-certificates curl git nginx
    return
  fi

  if command -v yum >/dev/null 2>&1; then
    sudo yum install -y ca-certificates curl git nginx
    return
  fi

  echo "Unsupported Linux distribution: apt-get, dnf, or yum is required."
  exit 1
}

install_node() {
  if command -v node >/dev/null 2>&1 && node -v | grep -Eq "^v${NODE_MAJOR}\."; then
    return
  fi

  if command -v apt-get >/dev/null 2>&1; then
    curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" | sudo -E bash -
    sudo apt-get install -y nodejs
    return
  fi

  if command -v dnf >/dev/null 2>&1; then
    curl -fsSL "https://rpm.nodesource.com/setup_${NODE_MAJOR}.x" | sudo -E bash -
    sudo dnf install -y nodejs
    return
  fi

  if command -v yum >/dev/null 2>&1; then
    curl -fsSL "https://rpm.nodesource.com/setup_${NODE_MAJOR}.x" | sudo -E bash -
    sudo yum install -y nodejs
    return
  fi

  echo "Unsupported Linux distribution: apt-get, dnf, or yum is required."
  exit 1
}

install_packages

install_node

sudo npm install -g pm2

sudo mkdir -p "$APP_DIR"
sudo chown -R "$USER:$USER" "$APP_DIR"

sudo systemctl enable nginx
sudo systemctl start nginx

pm2 startup systemd -u "$USER" --hp "$HOME"

echo "Tencent Cloud bootstrap finished."
echo "Deploy path: $APP_DIR"

#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/japanese-news-pwa}"
NODE_MAJOR="${NODE_MAJOR:-22}"
NODE_MIRROR="${NODE_MIRROR:-https://npmmirror.com/mirrors/node}"

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
    if curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" | sudo -E bash -; then
      sudo apt-get install -y nodejs
      return
    fi
  fi

  if command -v dnf >/dev/null 2>&1; then
    if curl -fsSL "https://rpm.nodesource.com/setup_${NODE_MAJOR}.x" | sudo -E bash -; then
      sudo dnf install -y nodejs
      return
    fi
  fi

  if command -v yum >/dev/null 2>&1; then
    if curl -fsSL "https://rpm.nodesource.com/setup_${NODE_MAJOR}.x" | sudo -E bash -; then
      if sudo yum install -y nodejs; then
        return
      fi
    fi
  fi

  install_node_from_tarball
}

install_node_from_tarball() {
  local arch
  local node_arch
  local archive
  local tmpdir

  arch="$(uname -m)"
  case "$arch" in
    x86_64) node_arch="x64" ;;
    aarch64 | arm64) node_arch="arm64" ;;
    *)
      echo "Unsupported CPU architecture: $arch"
      exit 1
      ;;
  esac

  tmpdir="$(mktemp -d)"
  archive="$(curl -fsSL "${NODE_MIRROR}/latest-v${NODE_MAJOR}.x/" \
    | grep -Eo "node-v${NODE_MAJOR}\\.[0-9]+\\.[0-9]+-linux-${node_arch}\\.tar\\.xz" \
    | head -n 1)"

  if [ -z "$archive" ]; then
    echo "Could not find a Node.js ${NODE_MAJOR} linux-${node_arch} archive from ${NODE_MIRROR}."
    exit 1
  fi

  curl -fsSL "${NODE_MIRROR}/latest-v${NODE_MAJOR}.x/${archive}" -o "${tmpdir}/${archive}"
  sudo rm -rf /opt/nodejs
  sudo mkdir -p /opt/nodejs
  sudo tar -xJf "${tmpdir}/${archive}" -C /opt/nodejs --strip-components=1
  sudo ln -sf /opt/nodejs/bin/node /usr/local/bin/node
  sudo ln -sf /opt/nodejs/bin/npm /usr/local/bin/npm
  sudo ln -sf /opt/nodejs/bin/npx /usr/local/bin/npx
  rm -rf "$tmpdir"
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

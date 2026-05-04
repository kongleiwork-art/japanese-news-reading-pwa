# Tencent Cloud Lighthouse Deployment

This project is a Next.js app with dynamic App Router pages and API routes, so the first production deployment should run it as a Node.js server instead of exporting a static site.

## What This Setup Adds

- `ecosystem.config.cjs`: PM2 process definition for `npm run start`.
- `deploy/nginx-japanese-news-pwa.conf`: Nginx reverse proxy template for port `3000`.
- `.github/workflows/deploy-tencent-cloud.yml`: GitHub Actions workflow that builds on GitHub, then SSHes into Tencent Cloud and restarts PM2.
- `scripts/tencent-cloud-bootstrap.sh`: one-time Ubuntu server bootstrap script.

## 1. Create The Tencent Cloud Server

Use Tencent Cloud Lighthouse with Ubuntu 22.04 or 24.04. Open these firewall ports:

- `22` for SSH.
- `80` for HTTP.
- `443` for HTTPS, when you add TLS.

Use Node.js 22 on the server. Next.js 16 needs a modern Node.js runtime.

## 2. Run The One-Time Server Bootstrap

SSH into the server as your deploy user, then run:

```bash
curl -fsSL https://raw.githubusercontent.com/YOUR_GITHUB_USER/YOUR_REPO/main/scripts/tencent-cloud-bootstrap.sh | bash
```

If you want a custom deploy path:

```bash
APP_DIR=/var/www/japanese-news-pwa bash scripts/tencent-cloud-bootstrap.sh
```

## 3. Add GitHub Actions Secrets

In GitHub, open:

```text
Repository -> Settings -> Secrets and variables -> Actions -> New repository secret
```

Add:

```text
TENCENT_HOST       Tencent Cloud public IP or domain
TENCENT_USER       SSH user, for example ubuntu
TENCENT_SSH_KEY    Private key that can SSH into the server
```

Optional:

```text
TENCENT_SSH_PORT   Defaults to 22
TENCENT_APP_DIR    Defaults to /var/www/japanese-news-pwa
TENCENT_REPO_URL   Use git@github.com:USER/REPO.git for private repos
```

For a private GitHub repo, also add a deploy key to the GitHub repository or set `TENCENT_REPO_URL` to an authenticated clone URL.

## 4. Configure Nginx

Copy the Nginx template on the server:

```bash
sudo cp /var/www/japanese-news-pwa/deploy/nginx-japanese-news-pwa.conf /etc/nginx/sites-available/japanese-news-pwa
sudo ln -s /etc/nginx/sites-available/japanese-news-pwa /etc/nginx/sites-enabled/japanese-news-pwa
sudo nginx -t
sudo systemctl reload nginx
```

If you have a domain, edit `server_name _;` to your domain:

```nginx
server_name example.com www.example.com;
```

## 5. Deploy

Push to `main`:

```bash
git push origin main
```

GitHub Actions will:

1. Install dependencies.
2. Run `npm run build`.
3. SSH into Tencent Cloud.
4. Pull the latest `main`.
5. Run `npm ci`.
6. Run `npm run build`.
7. Start or reload PM2.

You can also trigger it manually from:

```text
GitHub -> Actions -> Deploy to Tencent Cloud -> Run workflow
```

## 6. Useful Server Commands

```bash
pm2 status
pm2 logs japanese-news-pwa
pm2 restart japanese-news-pwa
sudo nginx -t
sudo systemctl reload nginx
```

## 7. HTTPS Later

After the domain resolves to Tencent Cloud, install Certbot or use Tencent Cloud EdgeOne/CDN in front of the server. For mainland China production traffic, complete ICP filing before binding a mainland-hosted domain.

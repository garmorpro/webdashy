# DEPLOYMENT.md

How to stand up the Ubuntu Server VM (on Proxmox) and run WebDashy on it. Current setup is **IP-only, no TLS** — domain + HTTPS come later once Cloudflare access is available (see the last section).

Workflow: this repo is developed/updated here and pushed to GitHub; the VM pulls the repo and runs it. You control the VM directly — nothing here requires SSH access from the development side.

---

## Part A — Create the VM

Follow [infra/PROXMOX_VM_SETUP.md](./infra/PROXMOX_VM_SETUP.md): create the Ubuntu 24.04 LTS VM in Proxmox, install the OS, enable the QEMU guest agent, confirm SSH access.

## Part B — Bootstrap the server (one-time)

SSH into the new VM, then:

```bash
git clone https://github.com/garmorpro/webdashy.git
cd webdashy
chmod +x infra/bootstrap.sh
sudo ./infra/bootstrap.sh
```

This installs Docker + Compose, sets up `ufw` (allows SSH, 80, 443 only), enables `fail2ban`, turns on unattended security upgrades, and adds a swap file if RAM is under ~6GB.

After it finishes:

```bash
newgrp docker   # or log out and back in
```

so your user can run `docker` without `sudo`.

## Part C — Configure environment variables

Still in the `webdashy` directory on the VM:

```bash
cp .env.example .env
nano .env   # or your editor of choice
```

At minimum, set:
- A strong `POSTGRES_PASSWORD`, updated to match inside `DATABASE_URL` too
- `AUTH_SECRET` — generate with `openssl rand -base64 32`

Leave `ADMIN_NAME`/`ADMIN_EMAIL`/`ADMIN_PASSWORD` commented out — your actual account is created in the browser via `/setup` (see Part D), not through `.env`. They're only there for emergency recovery later.

Never commit `.env` — it's gitignored.

## Part D — Run the stack

```bash
docker compose up -d --build
docker compose ps
```

This brings up:
- `db` — Postgres 16
- `app` — the WebDashy Next.js app (built from the repo's `Dockerfile`)
- `nginx` — reverse proxy on port 80, forwarding to `app:3000`

Then apply migrations and seed reference data (categories only — no admin account, that happens next):

```bash
docker compose exec app npx prisma migrate deploy
docker compose exec app npm run db:seed
```

Visit `http://<vm-ip>/setup` — since the database has no users yet, this creates your admin account through a real form (name, email, password). It signs you in automatically once created, and **this page permanently stops working the moment that first account exists** — visiting it again just redirects to `/login`. That confirms the VM, Docker, Postgres, app, Nginx, and admin auth are all working end-to-end.

**Locked out later?** Set `ADMIN_EMAIL`/`ADMIN_PASSWORD` in `.env` and run `docker compose exec app npm run db:seed` again — it upserts by email, safely resetting that account rather than creating a duplicate. Unset those vars again afterward.

## Ongoing deploys

Once the app is live, a normal update cycle on the VM looks like:

```bash
cd webdashy
git pull
docker compose up -d --build
docker compose exec app npx prisma migrate deploy   # if there are new migrations
```

---

## Firewall / Port Summary

| Port | Purpose | Exposed |
|---|---|---|
| 22 | SSH | Yes (ufw: OpenSSH) |
| 80 | HTTP (Nginx) | Yes |
| 443 | HTTPS (Nginx, Cloudflare Origin Certificate) | Yes |
| 5432 | Postgres | No — bound to `127.0.0.1` only inside the VM, not reachable from outside |

---

## Domain + TLS via Cloudflare

`webdashy.com` is proxied through Cloudflare with a Cloudflare Origin Certificate on nginx — not Let's Encrypt/Certbot. This is the simpler option specifically because Cloudflare sits in front: Cloudflare trusts its own Origin CA directly, so there's no HTTP-01 challenge, no renewal cron job, and the cert is valid for 15 years.

**In the Cloudflare dashboard:**

1. **DNS** → add an `A` record: `webdashy.com` → the VM's public IP. Proxy status: **Proxied** (orange cloud) — this hides the VM's real IP from visitors and gives some DDoS protection for free. Repeat for `www` if you want that to work too.
2. **SSL/TLS → Overview** → encryption mode: **Full (strict)**.
3. **SSL/TLS → Edge Certificates** → turn on **Always Use HTTPS**.
4. **SSL/TLS → Origin Server** → **Create Certificate**. Defaults are fine (RSA, covers `webdashy.com` + `*.webdashy.com`, 15 years). This gives you two blocks of text — an **Origin Certificate** and a **Private Key**.

**On the VM** (repo already has the nginx config + compose wiring for this — `git pull` first if you haven't):

```bash
mkdir -p nginx/certs
nano nginx/certs/cert.pem   # paste the Origin Certificate block, save
nano nginx/certs/key.pem    # paste the Private Key block, save
docker compose up -d --build
```

These two files live only on the VM — `nginx/certs/` is gitignored (a private key should never be committed, even to a private repo).

**Verify:**

```bash
curl -I https://webdashy.com
```

Should return `200` with no certificate warnings. `http://webdashy.com` should 301-redirect to the `https://` version. Direct IP access (`http://<vm-ip>/`) keeps working over plain HTTP as a fallback — a Cloudflare Origin Certificate only covers the domain, not the raw IP, so that path intentionally isn't HTTPS.

No app config changes needed for this — `getAbsoluteUrl()` (used for portal links and the notification email's admin link) already builds URLs from the request's actual `Host`/`X-Forwarded-Proto` headers, so it automatically produces `https://webdashy.com/...` links once traffic arrives through Cloudflare, no hardcoded URL anywhere to update. Same for Auth.js (`trustHost: true`), which needs no `AUTH_URL` override.

**If you ever rotate the Origin Certificate**: replace both files and `docker compose up -d --force-recreate nginx` (see the nginx-config-doesn't-hot-reload gotcha below).

## Maintenance Notes

- **Backups**: the Postgres data lives in the `webdashy_db_data` Docker volume. Back it up regularly, e.g. `docker compose exec db pg_dump -U $POSTGRES_USER $POSTGRES_DB > backup.sql`.
- **OS updates**: `unattended-upgrades` handles security patches automatically; do a manual `sudo apt update && sudo apt upgrade` periodically too.
- **Logs**: `docker compose logs -f [service]`.
- **Disk space**: template screenshots + Postgres data grow over time — monitor with `df -h` and extend the Proxmox virtual disk if needed.
- **Nginx config changes don't hot-reload**: `docker compose up -d --build` only rebuilds/recreates the `app` service (the one with a `build:` directive) — if you edit `nginx/webdashy.conf` or swap the TLS cert files without touching app code, the already-running `nginx` container keeps its old config in memory. Force it to pick up the change: `docker compose up -d --force-recreate nginx`.

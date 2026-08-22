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

At minimum, set a strong `POSTGRES_PASSWORD` and update `DATABASE_URL` to match. Never commit `.env` — it's gitignored.

## Part D — Run the stack

```bash
docker compose up -d --build
docker compose ps
```

This brings up:
- `db` — Postgres 16
- `app` — the WebDashy Next.js app (built from the repo's `Dockerfile`)
- `nginx` — reverse proxy on port 80, forwarding to `app:3000`

First boot needs the database schema created:

```bash
docker compose exec app npx prisma migrate deploy
```

(Until the first real migration is committed, `npx prisma db push` also works to sync the schema for development purposes — see ROADMAP.md Phase 2+.)

Visit `http://<vm-ip>/` — you should see the WebDashy dashboard. That confirms the VM, Docker, Postgres, app, and Nginx are all working end-to-end.

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
| 443 | HTTPS (Nginx, once TLS is set up) | Yes (allowed now, unused until TLS) |
| 5432 | Postgres | No — bound to `127.0.0.1` only inside the VM, not reachable from outside |

---

## Future: Domain + TLS via Cloudflare

Not done yet — revisit once Cloudflare access is available. At that point:

1. Point an A record at the VM's public/reachable IP in Cloudflare.
2. On the VM, install Certbot (`sudo apt install certbot python3-certbot-nginx`).
3. Run `sudo certbot --nginx -d yourdomain.com` — it edits `nginx/webdashy.conf`-equivalent config in place, or you add a second `server` block manually for port 443 with the issued cert paths.
4. Uncomment the `443:443` port mapping in `docker-compose.yml`.
5. If Cloudflare proxying (orange cloud) is enabled, set Cloudflare SSL mode to **Full (strict)** once the origin cert is in place.
6. Update `AUTH_URL` (or equivalent) in `.env` to the real `https://` domain.

## Maintenance Notes

- **Backups**: the Postgres data lives in the `webdashy_db_data` Docker volume. Back it up regularly, e.g. `docker compose exec db pg_dump -U $POSTGRES_USER $POSTGRES_DB > backup.sql`.
- **OS updates**: `unattended-upgrades` handles security patches automatically; do a manual `sudo apt update && sudo apt upgrade` periodically too.
- **Logs**: `docker compose logs -f [service]`.
- **Disk space**: template screenshots + Postgres data grow over time — monitor with `df -h` and extend the Proxmox virtual disk if needed.

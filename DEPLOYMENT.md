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
| 80 | HTTP (Nginx) | Yes, from the local network — there's no public IP, so this isn't internet-reachable directly. The only path in from the internet is Cloudflare Tunnel, which makes an outbound connection out and needs no inbound port opened at all. |
| 5432 | Postgres | No — bound to `127.0.0.1` only inside the VM, not reachable from outside |

No port 443 — TLS is terminated entirely at Cloudflare's edge (see "Domain + TLS via Cloudflare Tunnel" below), so nginx never needs to speak HTTPS itself.

---

## Domain + TLS via Cloudflare Tunnel

**This VM has no public IP.** It's reached from the internet exclusively through **Cloudflare Tunnel** (`cloudflared`, running as a service on the VM itself), not direct DNS-to-IP + port forwarding. This means there's no Origin Certificate, no port 443 to open, and no Let's Encrypt/Certbot anywhere in the picture — Cloudflare terminates TLS entirely at their own edge, and the tunnel carries plain HTTP from Cloudflare to nginx on port 80.

(An earlier version of this doc described setting up a Cloudflare Origin Certificate on nginx instead — that was written assuming a directly-public-IP VM, which turned out to be wrong for this deployment. Left this note so future-us doesn't wonder why that approach isn't here.)

**Cloudflare Zero Trust dashboard** (Access / Tunnels, not the regular DNS tab):

- **Tunnels** → the tunnel running on this VM should show as **Connected**.
- That tunnel's **Published application routes** maps `webdashy.com` → `http://<vm-private-ip>` (port 80, matching nginx). DNS for `webdashy.com` is managed automatically by this route (a `CNAME` to `<tunnel-id>.cfargotunnel.com`) — no manual `A` record needed, unlike a normal Cloudflare setup.

**On the VM**: nothing extra to configure for this beyond the repo's existing `nginx/webdashy.conf`, which already handles it — it's a single plain-HTTP-on-port-80 listener, which is exactly what the tunnel expects. `docker-compose.yml` doesn't publish 443 at all (there's no public IP for anything to reach it on anyway).

One correctness detail worth knowing: `cloudflared` sets `X-Forwarded-Proto: https` on requests it forwards (since it knows the original visitor connection was HTTPS), and nginx is configured to preserve that header rather than overwrite it with its own `$scheme` (which would incorrectly say `http` for every tunneled request). This matters because `getAbsoluteUrl()` (portal links, the notification email's admin link) and Auth.js's secure-cookie behavior both read that header — get it wrong and portal links would show `http://` instead of `https://`.

**Verify**:

```bash
curl -I https://webdashy.com
```

Should return `200`. Direct IP access from your local network (`http://<vm-ip>/`) keeps working too — that's the LAN-only fallback, not a public path (there's no public IP for the outside world to reach it on).

**If a fresh/just-changed tunnel route doesn't resolve right away**: this is normal DNS propagation, not a broken config. Two things to know so you don't chase a phantom bug:

- A brand new Tunnel public hostname route can take a few minutes to fully propagate a proper dual-stack (A + AAAA) DNS record across Cloudflare's edge — right after creating/changing one, it's possible to briefly see only an `AAAA` (IPv6) record and no `A` (IPv4) one, which will fail to connect from an IPv6-less network. Query Cloudflare's own resolver directly to check the current authoritative state, bypassing any local caching: `dig @1.1.1.1 A webdashy.com +short`.
- **Test from a real external client** (your phone on cellular, or any machine off this VM/LAN), not `curl` on the VM itself. The VM's own local DNS resolver can cache a stale "no record" answer from before propagation finished, and keep failing long after the real world has moved on — that's a local-cache artifact, not a sign anything is actually broken. (`sudo resolvectl flush-caches` clears it if you want the VM's own testing to catch up, but it's not required for real visitors.)

## Maintenance Notes

- **Backups**: the Postgres data lives in the `webdashy_db_data` Docker volume. Back it up regularly, e.g. `docker compose exec db pg_dump -U $POSTGRES_USER $POSTGRES_DB > backup.sql`.
- **OS updates**: `unattended-upgrades` handles security patches automatically; do a manual `sudo apt update && sudo apt upgrade` periodically too.
- **Logs**: `docker compose logs -f [service]`.
- **Disk space**: template screenshots + Postgres data grow over time — monitor with `df -h` and extend the Proxmox virtual disk if needed.
- **Nginx config changes don't hot-reload**: `docker compose up -d --build` only rebuilds/recreates the `app` service (the one with a `build:` directive) — if you edit `nginx/webdashy.conf` or swap the TLS cert files without touching app code, the already-running `nginx` container keeps its old config in memory. Force it to pick up the change: `docker compose up -d --force-recreate nginx`.

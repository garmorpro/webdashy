#!/usr/bin/env bash
#
# WebDashy — Ubuntu Server bootstrap script
#
# Run this ONCE on a fresh Ubuntu 24.04 LTS Server VM (see PROXMOX_VM_SETUP.md).
# It prepares the host to run WebDashy via Docker Compose:
#   - system updates + unattended security upgrades
#   - firewall (ufw): allow SSH, HTTP, HTTPS only
#   - fail2ban for SSH brute-force protection
#   - Docker Engine + Compose plugin (official Docker repo, not the snap)
#   - adds the invoking user to the `docker` group
#   - optional swap file if RAM is low
#
# Usage:
#   chmod +x bootstrap.sh
#   sudo ./bootstrap.sh
#
# Idempotent-ish: safe to re-run, but designed for a fresh VM.

set -euo pipefail

if [[ $EUID -ne 0 ]]; then
  echo "Please run as root (sudo ./bootstrap.sh)" >&2
  exit 1
fi

# The user who invoked sudo — gets added to the docker group.
TARGET_USER="${SUDO_USER:-root}"

echo "==> Updating system packages"
apt update
apt -y upgrade

echo "==> Installing base packages"
apt install -y \
  ca-certificates \
  curl \
  gnupg \
  git \
  ufw \
  fail2ban \
  unattended-upgrades \
  apt-transport-https \
  software-properties-common

echo "==> Setting timezone (adjust as needed)"
timedatectl set-timezone UTC || true

echo "==> Configuring unattended security upgrades"
dpkg-reconfigure -f noninteractive unattended-upgrades

echo "==> Configuring firewall (ufw)"
ufw default deny incoming
ufw default allow outgoing
ufw allow OpenSSH
ufw allow 80/tcp   # HTTP (Nginx)
ufw allow 443/tcp  # HTTPS (Nginx, once TLS is configured)
ufw --force enable
ufw status verbose

echo "==> Configuring fail2ban (SSH jail, defaults are sane)"
systemctl enable --now fail2ban

echo "==> Installing Docker Engine + Compose plugin (official repo)"
if ! command -v docker &> /dev/null; then
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
  chmod a+r /etc/apt/keyrings/docker.asc

  ARCH="$(dpkg --print-architecture)"
  CODENAME="$(. /etc/os-release && echo "$VERSION_CODENAME")"
  echo \
    "deb [arch=${ARCH} signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu ${CODENAME} stable" \
    > /etc/apt/sources.list.d/docker.list

  apt update
  apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
else
  echo "Docker already installed, skipping."
fi

systemctl enable --now docker

if [[ "$TARGET_USER" != "root" ]]; then
  echo "==> Adding '${TARGET_USER}' to the docker group"
  usermod -aG docker "$TARGET_USER"
  echo "NOTE: ${TARGET_USER} must log out and back in (or run 'newgrp docker') for this to take effect."
fi

echo "==> Checking memory / swap"
TOTAL_MEM_MB=$(free -m | awk '/^Mem:/{print $2}')
if [[ "$TOTAL_MEM_MB" -lt 6000 && ! -f /swapfile ]]; then
  echo "Total RAM is ${TOTAL_MEM_MB}MB — adding a 2GB swap file as a safety net for builds."
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
else
  echo "Skipping swap file (sufficient RAM or swap already present)."
fi

echo ""
echo "==> Bootstrap complete."
echo "Docker version: $(docker --version)"
echo "Compose version: $(docker compose version)"
echo ""
echo "Next steps:"
echo "  1. Log out and back in (so docker group membership applies), or run: newgrp docker"
echo "  2. Clone the repo:  git clone https://github.com/garmorpro/webdashy.git"
echo "  3. Follow DEPLOYMENT.md to configure .env and run docker compose up -d"

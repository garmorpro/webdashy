# Proxmox VM Setup — WebDashy

Steps to create the Ubuntu Server VM on your Proxmox host. This VM will run Docker, Postgres, Nginx, and the WebDashy app.

---

## 1. Recommended VM Specs

| Resource | Minimum | Recommended |
|---|---|---|
| vCPU | 2 | 4 |
| RAM | 4 GB | 8 GB |
| Disk | 40 GB | 60 GB+ (grows with template screenshots + DB) |
| Network | 1 NIC, bridged (`vmbr0`) | same |
| OS | Ubuntu Server 24.04 LTS | same |

Notes:
- 8 GB RAM gives headroom for `next build` (memory-hungry) running alongside Postgres and Docker.
- Give the disk room to grow — template screenshots and Postgres data both accumulate. You can always extend the virtual disk later.

## 2. Download the ISO

Grab the **Ubuntu Server 24.04 LTS** ISO (`ubuntu-24.04-live-server-amd64.iso`) from ubuntu.com and upload it to your Proxmox node's ISO storage (Datacenter → Storage → local → ISO Images → Upload).

## 3. Create the VM

In the Proxmox web UI, **Create VM**:

- **General**: Name = `webdashy` (or similar), VM ID as assigned.
- **OS**: Use the uploaded Ubuntu 24.04 ISO, Guest OS type = Linux, version = 6.x - 2.6 Kernel.
- **System**:
  - Machine: `q35`
  - BIOS: `OVMF (UEFI)` — add an EFI disk when prompted.
  - Enable **Qemu Agent** (checkbox) — lets Proxmox report the VM's IP address, do clean shutdowns, etc.
- **Disks**:
  - Bus/Device: `VirtIO SCSI` (or `VirtIO Block`) for performance.
  - Size: 60 GB (per table above).
  - Enable **Discard** if backing storage supports TRIM (SSD).
- **CPU**:
  - Sockets: 1, Cores: 4 (or 2 minimum).
  - Type: `host` (best performance, ties VM to this host's CPU family).
- **Memory**: 8192 MB (or 4096 MB minimum). Leave ballooning at default unless you have a reason to disable it.
- **Network**: Bridge = `vmbr0`, Model = `VirtIO (paravirtualized)`.
- **Confirm** and start the VM.

## 4. Install Ubuntu Server

Boot the VM and run through the Ubuntu Server installer:

- Keep it minimal — don't install the optional server snaps (Docker will be installed manually via `bootstrap.sh` to get the latest version, not the snap).
- **Enable OpenSSH server** when prompted — you'll need it to SSH in.
- Create your admin user during install (this becomes your sudo user).
- Set a static IP if your network supports DHCP reservations, or configure a static IP now via netplan. A stable IP matters since you're accessing this by IP for now (no domain yet).
- Finish install, reboot, remove the ISO from the VM's CD drive (Proxmox → Hardware → CD/DVD → do not use any media), so it boots from disk.

## 5. Install the Qemu Guest Agent (inside the VM)

```bash
sudo apt update
sudo apt install -y qemu-guest-agent
sudo systemctl enable --now qemu-guest-agent
```

This lets the Proxmox UI show the VM's actual IP under the **Summary** tab — useful since you'll be connecting by IP.

## 6. Confirm SSH access

From another machine on your network:

```bash
ssh youruser@<vm-ip>
```

Once this works, move on to [`bootstrap.sh`](./bootstrap.sh) — see [DEPLOYMENT.md](../DEPLOYMENT.md) for the full sequence.

## 7. Recommended: take a Proxmox snapshot

After the base OS install + guest agent (before running bootstrap.sh), take a Proxmox snapshot. Gives you a clean rollback point if a later step needs a redo.

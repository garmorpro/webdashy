# TLS certificates go here — never in git

Place two files in this directory directly on the VM (not through a commit):

- `cert.pem` — the Cloudflare Origin Certificate
- `key.pem` — its private key

Generate both in the Cloudflare dashboard: **SSL/TLS → Origin Server → Create Certificate**. See [DEPLOYMENT.md](../../DEPLOYMENT.md) for the full walkthrough.

Both filenames are gitignored (everything in this directory except this README and `.gitkeep`) — a private key should never be committed, even to a private repo.

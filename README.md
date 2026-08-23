# WebDashy

A private web application for managing a library of reusable website templates and presenting curated template selections to prospective website clients.

> I maintain the templates. I create a potential client. I choose a few templates that fit that client. WebDashy generates a unique client portal. I send the link to the client. The client previews the options and selects their favorite.

Think **Template Library + Lightweight CRM + Client Selection Portal**.

Full product specification: [product-build.md](./product-build.md)
Technical design: [ARCHITECTURE.md](./ARCHITECTURE.md)
Build plan: [ROADMAP.md](./ROADMAP.md)
Server setup & deploys: [DEPLOYMENT.md](./DEPLOYMENT.md)

---

## How it works

WebDashy follows one client through an 8-step pipeline, shown as a stepper at the top of every client's page:

1. **Add Lead** — add a prospective client to the CRM.
2. **Contact** — reach out; mark them Contacted/Interested, or Lost.
3. **Portal Sent** — pick a curated set of templates (2–8) and generate a unique, unguessable portal link, e.g. `webdashy.com/p/acme-construction-x7f92`. No account needed on the client's end.
4. **Template & Plan** — the client previews each template live and picks one, alongside a pricing plan (managed once under Settings, reused across every client).
5. **Invoice** — fill in project requirements, then generate and email an invoice (PDF attached).
6. **Building** — mark the project in progress once the invoice is paid.
7. **Delivered** — enter the live URL; WebDashy emails the client a review link where they approve or request changes.
8. **Complete** — once the client approves and the invoice is paid, the project is marked Won.

Target: from "add a client" to "send a portal link" in under two minutes.

---

## Tech Stack

- [Next.js](https://nextjs.org/) (App Router) + TypeScript
- React + [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- PostgreSQL + [Prisma](https://www.prisma.io/)
- Auth.js v5 (Credentials provider) for admin authentication
- Docker-compatible, self-hostable

## Project Status

Phases 1–5 are live: the admin shell (now behind real login), full Template and Client CRUD, the Portal Builder (select templates, generate a unique link), and the public `/p/[token]` selection page with email notification on selection. Real portal view/selection tracking (Phase 6) and a live Dashboard (Phase 7) are the next gaps — template screenshots are also still pasted URLs rather than uploaded files. See [ROADMAP.md](./ROADMAP.md) for full phase status.

## Getting Started

```bash
npm install
cp .env.example .env   # then set DATABASE_URL to a real Postgres instance
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Templates, Clients, and Portals are all backed by real data; Settings is still a placeholder route.

Useful scripts:

```bash
npm run build        # production build
npm run lint          # eslint
npm run db:generate   # regenerate the Prisma client after schema changes
npm run db:migrate    # create/apply a migration in development
npm run db:deploy     # apply pending migrations (production)
npm run db:seed       # seed reference categories
npm run db:studio     # browse the database with Prisma Studio
```

### Environment Variables

Never commit real values — use [.env.example](./.env.example) as the template and keep `.env` gitignored.

- `DATABASE_URL` — PostgreSQL connection string (required)
- `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` — used by the `db` service in [docker-compose.yml](./docker-compose.yml)
- `GMAIL_USER` / `GMAIL_APP_PASSWORD` / `NOTIFY_EMAIL_TO` — email notification when a client selects a template. Optional — if unset, notifications are silently skipped (the selection itself still works). `GMAIL_APP_PASSWORD` must be a Google [App Password](https://myaccount.google.com/apppasswords), not the account's regular password.
- `MAIL_FROM` — optional, defaults to `GMAIL_USER`. Overrides the visible "From" address on the notification email (e.g. `garrett@webdashy.com`) while `GMAIL_USER` stays the actual SMTP login — only takes effect once that address is verified as a Gmail "Send mail as" alias.
- `AUTH_SECRET` — required. Signs admin session JWTs (Auth.js, Credentials provider). Generate with `openssl rand -base64 32`.
- `ADMIN_NAME` / `ADMIN_EMAIL` / `ADMIN_PASSWORD` — optional, emergency-recovery only. Your actual admin account is created through `/setup` in the browser (a one-time page, only reachable while the database has no users) — these vars exist purely so `npm run db:seed` can create-or-reset that account by email if you're ever locked out.

## Development Rules

See product-build.md §39 for the full list. Highlights:

- Read the complete product specification before changing code.
- Implement one roadmap milestone at a time — do not build V2 features early.
- Keep public portal code (`app/p/`) logically separated from the admin experience.
- Run builds and lint after meaningful changes; don't silently ignore errors.
- Never commit credentials or secrets.

## License

Private project — not licensed for external use.

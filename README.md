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

1. Add website templates to the library (screenshots + live demo URLs).
2. Add a prospective client.
3. Pick a curated set of templates (2–8) for that client.
4. WebDashy generates a unique, unguessable portal link, e.g. `webdashy.com/p/acme-construction-x7f92`.
5. Send the link to the client — no account needed on their end.
6. The client previews each template live, then confirms their favorite.
7. WebDashy records the selection and notifies you.

Target: from "add a client" to "send a portal link" in under two minutes.

---

## Tech Stack

- [Next.js](https://nextjs.org/) (App Router) + TypeScript
- React + [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- PostgreSQL + [Prisma](https://www.prisma.io/)
- Auth.js (or equivalent) for admin authentication
- Docker-compatible, self-hostable

## Project Status

Phase 1 (Foundation) and Phase 2 (Template Library) are largely in place: the admin shell/nav, Prisma schema + initial migration, and full Template CRUD (list with search/filters, create, edit, archive, delete) are working against a real database. Admin authentication is still outstanding, and template screenshots are pasted URLs for now rather than uploaded files. See [ROADMAP.md](./ROADMAP.md) for full phase status.

## Getting Started

```bash
npm install
cp .env.example .env   # then set DATABASE_URL to a real Postgres instance
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The admin shell, sidebar navigation, and Templates page (with mock data) are live; Clients, Portals, and Settings are placeholder routes pending later roadmap phases.

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
- Admin auth provider credentials — not wired up yet; documented here once chosen (see ARCHITECTURE.md §9 Open Decisions)

## Development Rules

See product-build.md §39 for the full list. Highlights:

- Read the complete product specification before changing code.
- Implement one roadmap milestone at a time — do not build V2 features early.
- Keep public portal code (`app/p/`) logically separated from the admin experience.
- Run builds and lint after meaningful changes; don't silently ignore errors.
- Never commit credentials or secrets.

## License

Private project — not licensed for external use.

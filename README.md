# WebDashy

A private web application for managing a library of reusable website templates and presenting curated template selections to prospective website clients.

> I maintain the templates. I create a potential client. I choose a few templates that fit that client. WebDashy generates a unique client portal. I send the link to the client. The client previews the options and selects their favorite.

Think **Template Library + Lightweight CRM + Client Selection Portal**.

Full product specification: [product-build.md](./product-build.md)
Technical design: [ARCHITECTURE.md](./ARCHITECTURE.md)
Build plan: [ROADMAP.md](./ROADMAP.md)

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

Early scaffolding stage — see [ROADMAP.md](./ROADMAP.md) for current phase status.

## Getting Started

_To be filled in once the application is scaffolded (Phase 1 of the roadmap)._

```bash
# planned
npm install
npm run dev
```

### Environment Variables

_Document required environment variables here as they're introduced. Never commit real values — use `.env.example` as the template and keep `.env` gitignored._

Anticipated variables:

- `DATABASE_URL` — PostgreSQL connection string
- Admin auth provider credentials (exact variables depend on the chosen provider)

## Development Rules

See product-build.md §39 for the full list. Highlights:

- Read the complete product specification before changing code.
- Implement one roadmap milestone at a time — do not build V2 features early.
- Keep public portal code (`app/p/`) logically separated from the admin experience.
- Run builds and lint after meaningful changes; don't silently ignore errors.
- Never commit credentials or secrets.

## License

Private project — not licensed for external use.

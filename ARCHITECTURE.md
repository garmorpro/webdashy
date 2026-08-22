# ARCHITECTURE.md

This document describes the technical architecture for **WebDashy**, based on the product specification in [product-build.md](./product-build.md). It is a living document — update it as real implementation decisions are made.

---

## 1. Overview

WebDashy is a Next.js application with two distinct surfaces sharing one codebase and one database:

- **Admin app** — authenticated, internal tool for managing templates, clients, and portals.
- **Public portal** — unauthenticated, token-secured pages (`/p/[token]`) shown to prospective clients.

These two surfaces must stay logically separated in code (routing, layouts, components) even though they share data models and utilities.

---

## 2. Technology Stack

| Concern | Choice |
|---|---|
| Framework | Next.js (App Router) |
| Language | TypeScript |
| UI | React + Tailwind CSS |
| Component library | shadcn/ui |
| Database | PostgreSQL |
| ORM | Prisma |
| Admin authentication | Auth.js v5, Credentials provider (email + password against `User.passwordHash`, JWT sessions) |
| Client portal "authentication" | None — unguessable random token in the URL |
| Deployment | Docker-compatible, self-hostable — Ubuntu Server VM on Proxmox, see [DEPLOYMENT.md](./DEPLOYMENT.md) |

Rationale for swapping the auth provider, if it happens, should be recorded here.

---

## 3. Project Structure (target)

```
webdashy/
├── app/
│   ├── (admin)/                # authenticated admin surface
│   │   ├── layout.tsx          # sidebar + admin shell
│   │   ├── page.tsx            # Dashboard
│   │   ├── templates/
│   │   │   ├── page.tsx
│   │   │   ├── new/page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── clients/
│   │   │   ├── page.tsx
│   │   │   ├── new/page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── portals/
│   │   │   └── page.tsx
│   │   └── settings/
│   │       └── page.tsx
│   ├── p/
│   │   └── [token]/
│   │       └── page.tsx        # public client portal — no admin layout
│   ├── api/                    # route handlers (or use server actions)
│   └── layout.tsx               # root layout (fonts, providers)
├── components/
│   ├── admin/                  # admin-only components
│   ├── portal/                 # public-portal-only components
│   └── ui/                     # shared shadcn/ui primitives
├── lib/
│   ├── db.ts                   # Prisma client singleton
│   ├── auth.ts                 # admin auth config
│   ├── tokens.ts                # portal token generation/validation
│   └── tracking.ts             # portal event tracking helpers
├── prisma/
│   └── schema.prisma
├── ARCHITECTURE.md
├── ROADMAP.md
├── README.md
└── product-build.md
```

Admin and public-portal components/routes are kept in separate directories on purpose (§10 of the spec: the public portal must not resemble or share layout with the admin dashboard).

---

## 4. Data Model

Modeled with Prisma. See `prisma/schema.prisma` once created; conceptual model below.

**User** — admin account. `id, name, email, createdAt, updatedAt`

**Template** — a reusable website template. `id, name, slug, description, categoryId, thumbnailUrl, desktopScreenshotUrl, mobileScreenshotUrl, previewUrl, repositoryUrl, status (Active/Draft/Archived), createdAt, updatedAt`

**Category** — `id, name, slug`

**Tag** / **TemplateTag** — many-to-many tagging for templates.

**Client** — a prospective client. `id, businessName, contactName, email, phone, industry, status, leadSource, estimatedValue, notes, createdAt, updatedAt`

**Portal** — a generated, tokenized selection page for one client. `id, clientId, token, message, status (Draft/Active/Viewed/Selected/Disabled), firstViewedAt, lastViewedAt, viewCount, createdAt, updatedAt`

**PortalTemplate** — join table, templates included in a portal, with `displayOrder`.

**PortalEvent** — lightweight analytics log. `id, portalId, templateId?, eventType (PORTAL_VIEWED / TEMPLATE_PREVIEWED / TEMPLATE_SELECTED), createdAt`

**TemplateSelection** — the confirmed choice for a portal. `id, portalId, templateId, selectedAt`

### Relationships

- One `Client` → many `Portal`s.
- One `Portal` → one `Client`.
- One `Portal` → many `Template`s (via `PortalTemplate`).
- One `Template` → many `Portal`s.
- One `Portal` → at most one confirmed `TemplateSelection`.

---

## 5. Routing

**Internal (authenticated):**

```
/                    Dashboard
/templates           Template library
/templates/new       Add template
/templates/[id]      Template details / edit
/clients             Client CRM
/clients/new         New client
/clients/[id]        Client details, portal builder, activity feed
/portals             Portal management
/settings            Settings
```

**Public (unauthenticated):**

```
/p/[token]           Client template selection portal
```

All `/p/[token]` routes must render `noindex` metadata and must resolve data strictly by the opaque `token` — never by internal numeric/sequential IDs.

---

## 6. Authentication & Security

- **Admin routes** are protected by `src/proxy.ts` (Next.js's proxy/middleware, checked on every request before it reaches a page) using [Auth.js](https://authjs.dev) v5 with the Credentials provider — email + password checked against `User.passwordHash` (bcrypt) in Postgres, JWT session strategy (no separate session table). No admin route is reachable without a valid session; unauthenticated requests redirect to `/login` with the original path preserved as `callbackUrl`.
  - V1 supports exactly one administrator, created via `npm run db:seed` from `ADMIN_EMAIL`/`ADMIN_PASSWORD` env vars (upserted by email — re-running the seed after changing the password resets it). The schema (a real `User` table, not a hardcoded credential) allows adding real multi-user support later without a rework.
  - Server actions themselves are *not* individually auth-checked — proxy-level protection of the pages that can reach them is the enforced boundary for V1. Revisit if multi-user support or a public write surface beyond the token-scoped portal actions is ever added.
- **Public portal** has no login. Security is based entirely on the token being long, cryptographically random, and unguessable (e.g., generated with a CSPRNG, not a sequential ID or predictable slug+counter). `/p/[token]` and `/api/auth/*` are explicitly excluded from the proxy's auth check.
- Public API/data access for a given token must only ever return data belonging to that portal's client — no cross-client leakage, even under enumeration attempts.
- Public portal pages set `noindex` (and ideally `nofollow`) via metadata to keep them out of search engines.
- Secrets and credentials are never committed; required environment variables are documented in `README.md`.

---

## 7. Portal Tracking

Tracking is intentionally lightweight (see spec §18). Each meaningful client-side action against a portal writes a `PortalEvent` row and updates denormalized counters/timestamps on `Portal` (`viewCount`, `firstViewedAt`, `lastViewedAt`) for fast dashboard/list reads without aggregating events on every page load.

---

## 8. Design System

- Admin surface: light backgrounds, dark navy text, blue primary actions, rounded cards, soft shadows, thin neutral borders, generous whitespace — professional SaaS aesthetic, not playful.
- Public portal: dark navy gradient header, white content area, centered client branding, large template screenshots, minimal nav, obvious CTAs — must feel trustworthy enough to send directly to a paying client.
- Shared shadcn/ui primitives live in `components/ui/`; admin- and portal-specific compositions stay in their own directories so the two surfaces can diverge visually without fighting each other.

---

## 9. Open Decisions

Track architecture decisions still pending here as they come up, e.g.:

- Image storage/hosting strategy for template screenshots (local vs S3-compatible/object storage vs CDN) — still open, screenshots are pasted URLs for now.
- Selection-notification email currently sends via Gmail SMTP as the real Gmail address (displayed as "WebDashy"). Sending as `garrett@webdashy.com` needs DNS access to that domain first (not currently available — see DEPLOYMENT.md), then one of: (a) Cloudflare Email Routing forwarding that address to Gmail so it can be verified as a Gmail "Send mail as" alias, or (b) switching to a transactional provider (Resend/SendGrid) with the domain verified via SPF/DKIM — the more standard approach, and probably the better long-term choice regardless of the domain-sender question.

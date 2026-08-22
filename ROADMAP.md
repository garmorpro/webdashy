# ROADMAP.md

Development plan for WebDashy, derived from [product-build.md](./product-build.md) §34. Work proceeds one phase at a time — later phases should not be started early.

---

## Phase 1 — Foundation

- Initialize Next.js + TypeScript project.
- Configure Tailwind CSS and shadcn/ui.
- Configure PostgreSQL + Prisma.
- Configure admin authentication.
- Build the application shell and sidebar navigation.
- Create placeholder routes: Dashboard, Templates, Clients, Portals, Settings.
- Establish the shared design system (colors, spacing, typography, base components).

## Phase 2 — Template Library

- Template database model + migrations.
- Template gallery (card grid) with mock/seed data.
- Search and category filters.
- Template detail page.
- Create / edit template forms.
- Live preview links.

## Phase 3 — Clients

- Client database model + migrations.
- Client list (table view with status, portal, templates, activity columns).
- Client detail/record page.
- Client statuses (Lead → Contacted → ... → Won/Lost).
- Add / edit client forms.

## Phase 4 — Portal Builder

Inside the client record:

- "Create Portal" flow (select templates, 2–8 limit, optional reordering).
- Portal message customization (with default copy).
- Unique cryptographically random token generation.
- Copy portal link action.

## Phase 5 — Public Portal

- `/p/[token]` route, isolated from the admin layout.
- Portal hero: client name, welcome message.
- Template selection grid (4/2/1 columns by breakpoint).
- View Preview (opens live demo in new tab).
- Choose This Template → confirmation modal → success state.
- `noindex` metadata and strict per-token data scoping.

## Phase 6 — Tracking

- Portal view tracking (`viewCount`, `firstViewedAt`, `lastViewedAt`).
- Template preview click tracking.
- Selection tracking (`TemplateSelection`).
- Internal client activity feed built from `PortalEvent` history.

## Phase 7 — Dashboard

- Build once real data exists from prior phases.
- Metrics: total templates, total clients, active portals, templates shared, portal views, selections.
- Recent activity feed.

## Phase 8 — Polish

- Responsive design pass across admin and portal.
- Loading, empty, and error states.
- Toast notifications.
- Accessibility pass.
- Performance pass (image optimization, especially for template screenshots).
- SEO blocking confirmed on all public portal routes.
- Security review (token strength, cross-client data isolation, admin route gating).

---

## MVP Definition

MVP = Phases 1–6 plus a minimal Phase 7/8, matching product-build.md §30:

- Admin authentication
- Template library with CRUD, screenshots, preview URLs
- Client CRM with CRUD
- Portal builder (template selection, unique URL)
- Public portal with View Preview / Choose This Template / confirmation
- Portal + preview + selection tracking
- Client activity timeline
- Copy portal URL, portal status
- Responsive portal

Explicitly out of scope for MVP (product-build.md §31): billing/Stripe, subscription tiers, email campaigns, full sales CRM, automated deployment, AI generation, client accounts/messaging, contracts, invoicing, project management, website editor, domain/hosting management.

**Success metric:** add a client → generate and send a portal link in **under two minutes**.

---

## Post-MVP Backlog (V2 candidates)

Not to be started until MVP is working end-to-end (product-build.md §32):

- Automated email sending of portals from within WebDashy.
- Client branding on portals (client logo).
- Custom/white-label branding (remove WebDashy branding).
- Template favorites/shortlisting before final selection.
- Client feedback notes on templates.
- "None of these are quite right" custom request flow.
- Analytics: conversion rate, most previewed/selected templates, selection rate by industry.
- Template recommendations by client industry (AI matching).

---

## Status

_Update this section as phases complete._

- [ ] Phase 1 — Foundation (app shell, nav, design system done; admin authentication still outstanding)
- [x] Phase 2 — Template Library (schema/migrations, full CRUD, search/filters, detail page — verified live on the VM, 2026-08-22; screenshot *upload* deferred — thumbnail/screenshot fields take a pasted URL for now, no storage pipeline yet)
- [x] Phase 3 — Clients (full CRUD, status tracking — verified live on the VM, 2026-08-22; "Template Portal" section on the client record intentionally deferred to Phase 4)
- [x] Phase 4 — Portal Builder (create/edit templates flow, unique token, copy link — verified live on the VM, 2026-08-22; later extended with a modal wizard + row actions on the Clients list)
- [x] Phase 5 — Public Portal (full client-facing selection flow, confirm → success screen, email notification on selection — verified live on the VM, 2026-08-22)
- [ ] Phase 6 — Tracking (viewCount/firstViewedAt/lastViewedAt, PortalEvent logging, activity feed — not started; Portals/Clients pages currently show real structure but viewCount stays honestly at 0)
- [ ] Phase 7 — Dashboard (still mock data — natural to build after Phase 6 gives it something real to show)
- [ ] Phase 8 — Polish

**Also done, outside the phase list**: real brand colors/logo throughout (admin + public portal), row actions (Start Portal wizard, Edit, Archive, Delete) on Clients, row actions (Copy Link, Open, Edit Templates, Disable, Reset Selection) on Portals.

**Admin authentication (§25) is now live** — Auth.js Credentials provider, single admin account, JWT sessions. See ARCHITECTURE.md §6.

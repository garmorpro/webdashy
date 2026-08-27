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

**TemplateSelection** — the confirmed choice for a portal. `id, portalId, templateId, planId?, selectedAt`

### Client pipeline (added after V1)

A 10-step pipeline layered on top of the original selection flow: **Add Lead → Contact → Questionnaire Sent → Questionnaire Done → Portal Sent → Template & Plan → Invoice → Building → Delivered → Complete**. `ClientStatus` gained `INVOICE_SENT`/`DELIVERED` (with the first pipeline build) and `QUESTIONNAIRE_SENT`/`QUESTIONNAIRE_DONE` (with the Design Questionnaire below); `src/lib/client-status.ts`'s `pipelineStepIndex()` maps a status to a stepper position, shown at the top of every client detail page (`ClientStepper`) — it's fully data-driven off `PIPELINE_STEPS`, so a future pipeline change is just an array + switch-statement edit, no component change needed. Each pipeline stage after template+plan selection is its own model, all keyed 1:1 off `Portal` (not `Client`) since they describe one specific project:

**Plan** — a reusable pricing tier, managed in Settings and offered on every portal (unlike `Template`, plans aren't curated per-portal — see product-build.md's original template-curation design vs. this simpler global-catalog approach for plans). `id, name, price, tagline, features (string[]), isActive, displayOrder, createdAt, updatedAt`

**AppSettings** — single-row app config (`id` is always the literal `"singleton"`). `showPricingInPortal` (toggles whether `Plan.price` is shown to clients — off shows "Custom quote after selection" instead), `invoiceFromName/Address/PaymentInstructions/Terms` (used on every invoice PDF/email).

**ProjectRequirements** — admin-filled project scope, one per portal, unlocked once a template+plan is selected. `id, portalId (unique), pages (string[]), features (string[]), contentStatus (enum), targetLaunchDate?, notes?`

**Invoice** / **InvoiceLineItem** — track-only invoicing (no live payment processor yet — see §9). `Invoice: id, invoiceNumber (e.g. INV-2026-0001, unique), clientId, portalId?, status (Draft/Sent/Paid), issueDate, dueDate?, taxAmount, sentAt?, paidAt?, stripeInvoiceId?/stripePaymentUrl?` (reserved, unused columns for a future real Stripe swap-in). `InvoiceLineItem: id, invoiceId, description, amount, displayOrder`. Rendered to PDF via `@react-pdf/renderer` (`src/lib/invoice-pdf.tsx`) — chosen over a headless-Chromium/Puppeteer screenshot approach specifically to avoid another fragile native-binary Docker dependency (see the Prisma CLI symlink incident in deployment history).

**Delivery** — build status + the client-review loop, one per portal. `id, portalId (unique), status (Building/Delivered), stagingUrl?, liveUrl?, reviewToken? (unique, same unguessable-token security model as Portal.token), reviewStatus (Awaiting/Approved/ChangesRequested), reviewFeedback?, deliveredAt?, reviewedAt?`

**DesignQuestionnaire** — sent once a lead confirms they want a site, filled in *before* a portal exists, so unlike the models above it's keyed 1:1 off `Client`, not `Portal`. `id, clientId (unique), token (unique, same unguessable-token model as Portal.token), status (Sent/InProgress/Submitted), answers (Json?), sentAt, submittedAt?`. `answers` is deliberately one JSON blob keyed by field id (`src/lib/questionnaire-schema.ts` — ~35 fields across 6 sections, ported question-for-question from the source PDF) rather than a column per question, since this app's first Json column: nothing here needs to be individually queried/filtered the way `ProjectRequirements.pages`/`features` do, and a JSON blob means adding or rewording a question later never needs a migration. Public route `/q/[token]` (`src/app/q/[token]/page.tsx`) renders a multi-step wizard (`QuestionnaireWizard`) that autosaves via `saveQuestionnaireProgress` (debounced + on section-change) while `status !== SUBMITTED`; once `submitQuestionnaire` flips it to `SUBMITTED` the same route instead renders a locked "under review" confirmation and rejects any further save/submit call against that token. Same public-action trust model as `confirmPortalSelection`/`approveDelivery` (§6) — both actions re-resolve everything from the token, never trust a caller-supplied id.

A client's `status` reaches `WON` once **both** halves of the final "Complete" step are true — the client approved the delivery AND every invoice tied to that portal is paid — via `maybeCompleteProject()` (`src/lib/project-completion.ts`), called from both the admin's "Mark as Paid" action and the client's "Approve" action, since either can happen first.

### Relationships

- One `Client` → many `Portal`s (in practice capped at one active portal per client by `createPortal`'s own guard — a second portal is only reachable via a stale link, and redirects rather than creating a duplicate).
- One `Portal` → one `Client`.
- One `Portal` → many `Template`s (via `PortalTemplate`).
- One `Template` → many `Portal`s.
- One `Portal` → at most one confirmed `TemplateSelection`, which references at most one `Plan`.
- One `Portal` → at most one `ProjectRequirements`, one `Delivery`, and many `Invoice`s (a client could be invoiced more than once for follow-on work).

---

## 5. Routing

**Internal (authenticated):**

```
/                    Dashboard
/templates           Template library
/templates/new       Add template
/templates/[id]      Template details / edit
/clients             Client CRM (portal status now shown inline per row — the old standalone /portals list page was removed)
/clients/new         New client
/clients/[id]        Client details, portal builder, activity feed
/settings            Settings
```

**Public (unauthenticated) / externally-callable:**

```
/p/[token]                    Client template + plan selection portal
/r/[token]                    Client delivery review (approve / request changes)
/q/[token]                    Design Questionnaire — client fills it in (or, once submitted, sees a locked confirmation)
/api/invoices/[id]/pdf        Admin-only invoice PDF view/download (a real route, not a Server Action — see §6)
/api/leads                    POST-only lead-creation webhook, protected by a static API key rather than a session — see §6
```

`/p/[token]`, `/r/[token]`, and `/q/[token]` must all render `noindex` metadata and must resolve data strictly by their own opaque token — never by internal numeric/sequential IDs.

---

## 6. Authentication & Security

- **Admin routes** are protected by `src/proxy.ts` (Next.js's proxy/middleware, checked on every request before it reaches a page) using [Auth.js](https://authjs.dev) v5 with the Credentials provider — email + password checked against `User.passwordHash` (bcrypt) in Postgres, JWT session strategy (no separate session table). No admin route is reachable without a valid session; unauthenticated requests redirect to `/login` with the original path preserved as `callbackUrl`.
  - V1 supports exactly one administrator, created through `/setup` — a page reachable only while `User` has zero rows, that creates the account via a real form and then permanently redirects to `/login` once it exists. This avoids a plaintext password ever needing to sit in `.env`. `ADMIN_NAME`/`ADMIN_EMAIL`/`ADMIN_PASSWORD` env vars still exist as a `npm run db:seed`-driven emergency recovery path (upserts by email) for if you're ever locked out AND can't receive the reset email below. Once signed in, the Settings page (`updateProfile`/`changePassword` in `src/lib/actions/account.ts`) is the normal way to manage the account — the schema (a real `User` table, not a hardcoded credential) allows adding real multi-user support later without a rework.
  - **Forgot password**: `/forgot-password` → `/reset-password/[token]` (`src/lib/actions/password-reset.ts`). Same unguessable-token security model as the public portal/review links — `User.resetTokenHash` stores a SHA-256 hash of a 256-bit random token, never the raw token (only the emailed link has that), expires after 1 hour, and is cleared the moment it's used. The request step always returns the same generic "check your inbox" response whether or not the email matched an account, so it can't be used to probe which address the admin account uses. Both routes are excluded from `proxy.ts`'s auth check for the same reason `/login` and `/setup` are — this has to work while logged out.
  - Every admin-only Server Action (`src/lib/actions/{clients,portals,templates,plans,settings,requirements,invoices,delivery}.ts`, plus `sendQuestionnaire` in `questionnaire.ts`) checks the session itself (`requireAdmin()`/`auth()` as the first line) rather than relying solely on proxy-level page protection. This matters because Next dispatches Server Actions by an internal action ID, not by the request's page pathname — so proxy.ts's exclusion of `/p/`, `/r/`, and `/q/` (needed to keep the public portal, review page, and questionnaire unauthenticated) doesn't actually stop a raw request to one of those excluded paths, carrying the right action ID, from invoking an admin action. `/api/invoices/[id]/pdf` is a real route (not a Server Action) so the pathname matcher does cover it, but it checks `auth()` too for the same defense-in-depth reason.
- **Public portal, delivery review, and design questionnaire** have no login. Security is based entirely on their token being long, cryptographically random, and unguessable (e.g., generated with a CSPRNG, not a sequential ID or predictable slug+counter) — `generatePortalToken()`/`generateReviewToken()`/`generateQuestionnaireToken()` in `src/lib/tokens.ts`. `/p/[token]`, `/r/[token]`, `/q/[token]`, and `/api/auth/*` are explicitly excluded from the proxy's auth check. The Server Actions those pages call (`confirmPortalSelection`, `approveDelivery`, `requestChanges`, `saveQuestionnaireProgress`, `submitQuestionnaire`) are intentionally public for the same reason, and re-validate every id they're passed (template, plan) — or, for the questionnaire, resolve everything from the token itself rather than trusting any caller-supplied id — against the token-resolved portal/delivery/questionnaire rather than trusting the client.
- **Leads webhook** (`POST /api/leads`, `src/app/api/leads/route.ts`) — built for an Apple Shortcut, but works from anything that can send a JSON POST. Excluded from `proxy.ts`'s session check like `/p/`/`/r/` above, but unlike those it's protected by a **static API key** instead of an unguessable per-resource token, since there's no per-client resource to scope a token to here — the whole endpoint is one admin-wide credential. Managed from Settings → API Access (`regenerateApiKey`/`revokeApiKey` in `src/lib/actions/settings.ts`): only a SHA-256 hash of the key is ever stored (`AppSettings.apiKeyHash`, same pattern as `User.resetTokenHash`), the raw key is shown to the admin exactly once at generation time, and the route compares the hash of the caller's key against the stored hash with `crypto.timingSafeEqual` rather than `===`. Creates a `Client` with `status: "LEAD"` and `leadSource` defaulting to `"Apple Shortcut"`; only `businessName`/`contactName`/`email` are required, matching the same "bare minimum" fields as the mobile Quick Add Lead sheet.
- Public API/data access for a given token must only ever return data belonging to that portal's client — no cross-client leakage, even under enumeration attempts.
- Public portal/review/questionnaire pages set `noindex` (and ideally `nofollow`) via metadata to keep them out of search engines.
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
- Selection-notification email still sends via Gmail SMTP (not a transactional provider like Resend/SendGrid with SPF/DKIM — that would be the more standard long-term choice, but Gmail SMTP is fine at this volume). The visible "From" address is now configurable via `MAIL_FROM` (see `.env.example`), separate from `GMAIL_USER` (the actual SMTP login) — set to `garrett@webdashy.com` once Cloudflare Email Routing (forwarding that address to Gmail) lets it be verified as a Gmail "Send mail as" alias in Gmail's own settings. The client-facing invoice and delivery-review emails added with the client pipeline reuse the same Gmail SMTP transport.
- Invoicing is deliberately track-only for now — `Invoice.status` is set to `PAID` by the admin manually clicking "Mark as Paid," there's no real payment processor. `Invoice.stripeInvoiceId`/`stripePaymentUrl` are reserved, unused columns so a real Stripe integration can slot in later (a real "Pay Online" link/webhook replacing the manual mark-paid step) without another schema migration.

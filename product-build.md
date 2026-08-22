# WebDashy

## Product Build Portfolio

### Product concept

**WebDashy** is a private web application for managing a library of reusable website templates and presenting curated template selections to prospective website clients.

The core idea is simple:

> I maintain the templates.  
> I create a potential client.  
> I choose a few templates that fit that client.  
> WebDashy generates a unique client portal.  
> I send the link to the client.  
> The client previews the options and selects their favorite.

WebDashy should feel like a combination of:

**Template Library + Lightweight CRM + Client Selection Portal**

The application is primarily an internal tool for me, while each prospective client receives a clean public-facing portal.

---

# 1. Product Goal

The goal is to make selling websites faster.

Instead of sending screenshots, individual links, or explaining design concepts over email, I should be able to say:

**"I've picked a few website styles I think would work well for your business. Take a look here and choose your favorite."**

The client receives one personalized URL containing only the templates I selected for them.

Example:

`webdashy.com/p/acme-construction-x7f92`

The client does **not** need an account.

---

# 2. Core Workflow

The primary workflow is:

**Lead → Client Record → Select Templates → Generate Portal → Share Link → Client Previews → Client Selects → Notification → Build Website**

### Example

Potential client:

**Acme Construction**

I create Acme Construction inside WebDashy.

I select:

- Modern Construction
- Construction Pro
- Builder Elite
- Industrial Strength

WebDashy generates:

`webdashy.com/p/acme-construction-x7f92`

I email that link to the client.

The client opens it and sees only those four templates.

Each template has:

**View Preview**

and

**Choose This Template**

The client can explore the full demo before making a choice.

Once they choose one, WebDashy records the selection and notifies me.

---

# 3. Application Structure

The internal application should contain the following primary areas:

## Dashboard

High-level overview of activity.

Show metrics such as:

- Total templates
- Total potential clients
- Active portals
- Templates shared
- Portal views
- Template selections
- Recent client activity

Example recent activity:

**Acme Construction**  
Selected Modern Construction  
5 minutes ago

**Bloom & Co. Marketing**  
Viewed their portal  
2 hours ago

**NextGen Roofing**  
Portal created  
Yesterday

---

# 4. Template Library

This is the heart of WebDashy.

The page should visually resemble a premium SaaS template marketplace.

## Page title

**All Templates**

Subtitle:

**Beautiful, customizable website templates to help your clients stand out.**

## Search

Search templates by:

- Template name
- Industry
- Category
- Tags

## Filters

Categories could include:

- All
- Business
- Local Services
- Construction
- Restaurant
- Ecommerce
- Portfolio
- Health & Wellness
- Professional Services
- Other

## Template cards

Each template should display:

- Screenshot/thumbnail
- Template name
- Category
- Favorite icon
- Preview button
- More menu

Example:

**Modern Construction**

Business / Construction

`Preview`

Templates should be displayed in a responsive card grid.

---

# 5. Template Record

Each template should have its own internal record.

Example fields:

### Basic Information

Template Name  
Template Slug  
Description  
Category  
Industry  
Tags

### Preview

Thumbnail Image  
Desktop Screenshot  
Mobile Screenshot

### URLs

Live Demo URL  
Repository URL, if applicable

### Status

Active  
Draft  
Archived

### Metadata

Date Added  
Date Updated

---

# 6. Clients CRM

The Clients page acts as a lightweight CRM for prospective website clients.

This does **not** need to become a full Salesforce-style CRM.

Keep it intentionally simple.

## Client list

Columns:

| Client            | Status   | Portal | Templates | Portal Activity | Last Activity |
| ----------------- | -------- | ------ | --------- | --------------- | ------------- |
| Acme Construction | Active   | Active | 4         | Viewed          | Today         |
| Bloom & Co.       | Active   | Active | 3         | Not Viewed      | Yesterday     |
| FitLife Studio    | Selected | Active | 4         | Selected        | May 17        |

## Client statuses

Suggested statuses:

- Lead
- Contacted
- Interested
- Portal Sent
- Viewed
- Template Selected
- Building
- Won
- Lost

---

# 7. Client Record

Clicking a client opens their complete record.

Example:

# Acme Construction

### Contact

Business Name  
Contact Name  
Email  
Phone  
Website  
Industry

### Lead Information

Lead Source  
Lead Status  
Estimated Project Value  
Notes

### Template Portal

Portal Status  
Portal URL  
Templates Shared  
Created Date  
Last Viewed  
Total Views

### Selection

Selected Template  
Selection Date

---

# 8. Create Client Flow

Button:

**+ Add New Client**

Open a modal or page.

Fields:

Business Name  
Contact Name  
Email  
Phone — optional  
Industry  
Notes — optional

Button:

**Create Client**

After creation, redirect to the client record.

---

# 9. Create Client Portal

Inside the client record there should be a section:

# Template Portal

Button:

**Create Portal**

The flow should be extremely easy.

### Step 1 — Select Templates

Display the existing template library.

Allow me to select multiple templates.

Example:

✓ Modern Construction  
✓ Construction Pro  
✓ Builder Elite  
✓ Industrial Strength

Suggested initial limit:

**2–8 templates**

The system should encourage curated selections rather than sending the client the entire library.

### Step 2 — Portal Message

Allow optional customization.

Default:

**Thanks for working with me! Please browse the templates below and choose the one that best fits your vision.**

### Step 3 — Generate Portal

Click:

**Generate Client Portal**

WebDashy creates a unique public URL.

Example:

`webdashy.com/p/acme-construction-x7f92`

---

# 10. Unique Client Portal

The public client portal should NOT look like the admin dashboard.

It should feel polished, premium, simple, and intentionally minimal.

The client should have one job:

**Preview templates and choose their favorite.**

No sidebar.

No login.

No admin controls.

---

# 11. Client Portal Header

Example:

WebDashy logo

---

### Acme Construction

**Website Template Selection**

Thanks for working with me! Please browse the templates below and choose the one that best fits your vision.

---

Optional top-right link:

**Need help? Contact me**

---

# 12. Template Selection Grid

Heading:

# Choose Your Favorite Template

Subtitle:

**Preview each website and select the design that best fits your business.**

Templates appear in a responsive grid.

Desktop:

4 cards per row where space allows.

Tablet:

2 cards.

Mobile:

1 card.

---

# 13. Client Template Cards

Every client-facing template card should contain:

Template Screenshot

Template Name

Category

Two buttons displayed side-by-side:

### View Preview

Secondary/outlined button.

Include an eye icon.

Clicking this opens the template's live demo.

Prefer opening in a new browser tab.

### Choose This Template

Primary button.

This should be visually more prominent.

Example:

`👁 View Preview` | `Choose This Template`

---

# 14. Template Preview Behavior

The **View Preview** button should open the actual working template.

The client should be able to:

- Scroll the website
- Navigate pages
- See desktop layout
- Experience interactions
- View the design as if it were a real website

The preview should not interfere with the client's WebDashy portal session.

Use a new tab initially.

---

# 15. Selecting a Template

When the client presses:

**Choose This Template**

DO NOT immediately finalize the selection.

Open a confirmation modal.

Example:

# Choose Modern Construction?

You've selected **Modern Construction** for your website.

You can preview the template again before confirming.

Buttons:

**Cancel**

**View Preview**

**Confirm Selection**

---

# 16. Selection Confirmation

After confirmation, show a success screen.

Example:

# Great choice!

You selected:

### Modern Construction

I'll be notified of your selection and can begin working with you on your website.

**Selected August 24, 2026**

The portal can remain available afterward for reference.

---

# 17. Selection Rules

For V1:

A client may select **one template**.

Once confirmed:

- Store the selected template
- Store selection timestamp
- Mark client status as `Template Selected`
- Mark portal status as `Selected`

Allow the administrator to manually reset the selection if necessary.

---

# 18. Portal Tracking

Track lightweight engagement analytics.

Do not overbuild analytics in V1.

Track:

### Portal Created

Timestamp portal was generated.

### Portal Views

Number of times portal has been opened.

### First Viewed

Timestamp.

### Last Viewed

Timestamp.

### Template Preview

Track when a client clicks View Preview.

### Selection

Track which template was chosen and when.

---

# 19. Internal Activity Timeline

Client records should contain a simple activity feed.

Example:

**Today, 3:42 PM**  
Acme Construction selected Modern Construction.

**Today, 3:35 PM**  
Modern Construction preview opened.

**Today, 3:32 PM**  
Client portal viewed.

**Yesterday, 4:15 PM**  
Client portal created.

This provides lightweight sales intelligence without creating a complex CRM.

---

# 20. Portal Management

Add a **Portals** section to the application.

Display:

Client  
Portal Status  
Templates Shared  
Views  
Selected Template  
Created  
Last Activity

Statuses:

Draft  
Active  
Viewed  
Selected  
Disabled

Admin actions:

Copy Portal Link  
Open Portal  
Edit Templates  
Disable Portal  
Reset Selection

---

# 21. Internal Navigation

Suggested sidebar:

### Main

Dashboard  
Templates  
Categories  
Clients  
Portals

### Optional Later

Custom Requests  
Analytics  
Brand Kit

### System

Settings

---

# 22. Design Direction

The entire application should follow the visual style established in the mockups.

Design characteristics:

- Modern SaaS aesthetic
- White/light gray backgrounds
- Dark navy text
- Blue primary actions
- Rounded cards
- Soft shadows
- Thin neutral borders
- Large whitespace
- Clean typography
- Minimal visual clutter
- Professional rather than playful

Avoid overly colorful dashboards.

Primary emphasis should be on template screenshots.

---

# 23. Public Portal Design

The public portal should use:

Dark navy gradient header

White content area

Centered client branding

Large template screenshots

Minimal navigation

Very obvious calls to action

The portal needs to feel trustworthy enough that I can send it directly to a paying client.

---

# 24. Mobile Experience

The portal is especially important on mobile because clients may open the link from email or text.

Mobile portal:

Client name

Short welcome message

Single-column template cards

Large screenshot

Template name

`View Preview`

`Choose This Template`

Buttons should be easy to tap.

The admin application should also be responsive, but desktop optimization is the priority for internal management.

---

# 25. Authentication

## Admin

WebDashy itself should require authentication.

V1 may support only one administrator.

Architecture should still allow multi-user support later.

Possible authentication:

- Auth.js
- Clerk
- Supabase Auth

Choose whichever integrates cleanly with the final technology stack.

## Client Portal

NO client authentication.

Security comes from an unguessable portal token.

Example:

`/p/acme-construction-x7f92h4ks`

Never expose sequential IDs publicly.

---

# 26. Suggested Technology Stack

Preferred architecture:

### Framework

Next.js

### Language

TypeScript

### UI

React

Tailwind CSS

### Component Library

shadcn/ui

### Database

PostgreSQL

### ORM

Prisma

### Authentication

Auth.js or equivalent

### Deployment

Docker-compatible

The application should be easy to self-host if desired.

---

# 27. Suggested Database Model

## User

id  
name  
email  
createdAt  
updatedAt

---

## Template

id  
name  
slug  
description  
categoryId  
thumbnailUrl  
desktopScreenshotUrl  
mobileScreenshotUrl  
previewUrl  
repositoryUrl  
status  
createdAt  
updatedAt

---

## Category

id  
name  
slug

---

## Tag

id  
name

---

## TemplateTag

templateId  
tagId

---

## Client

id  
businessName  
contactName  
email  
phone  
industry  
status  
leadSource  
estimatedValue  
notes  
createdAt  
updatedAt

---

## Portal

id  
clientId  
token  
message  
status  
firstViewedAt  
lastViewedAt  
viewCount  
createdAt  
updatedAt

---

## PortalTemplate

id  
portalId  
templateId  
displayOrder

---

## PortalEvent

id  
portalId  
templateId — optional  
eventType  
createdAt

Possible event types:

PORTAL_VIEWED  
TEMPLATE_PREVIEWED  
TEMPLATE_SELECTED

---

## TemplateSelection

id  
portalId  
templateId  
selectedAt

---

# 28. Important Relationships

One Client may have one or more Portals.

A Portal belongs to one Client.

A Portal contains multiple Templates.

Templates may appear inside many Portals.

A Portal may contain one confirmed TemplateSelection.

---

# 29. Suggested URL Structure

### Internal

`/`

Dashboard

`/templates`

Template library

`/templates/new`

Add template

`/templates/[id]`

Template details

`/clients`

Client CRM

`/clients/new`

New client

`/clients/[id]`

Client details

`/portals`

Portal management

`/settings`

Settings

### Public

`/p/[token]`

Client template selection portal

---

# 30. MVP

The first production milestone should focus only on the core workflow.

## MVP MUST HAVE

- Admin authentication
- Template library
- Add/edit/delete templates
- Template screenshots
- Template preview URLs
- Client CRM
- Add/edit clients
- Create client portal
- Select templates for portal
- Unique portal URL
- Public portal
- View Preview button
- Choose This Template button
- Confirmation modal
- Save template selection
- Portal view tracking
- Template preview tracking
- Client activity timeline
- Copy portal URL
- Portal status
- Responsive portal

---

# 31. NOT MVP

Do not build these during the first phase:

- Billing
- Stripe
- Multiple subscription tiers
- Complex email campaigns
- Full sales CRM
- Automated website deployment
- AI website generation
- Client accounts
- Client messaging system
- Contracts
- Invoicing
- Project management
- Website editor
- Domain purchasing
- Hosting management

These can be evaluated after the core workflow is working.

---

# 32. Future Features

Possible V2 features:

### Automated Email

Send portal directly from WebDashy.

### Client Branding

Portal displays client's logo.

### Custom Branding

Remove WebDashy branding.

### Template Favorites

Client can shortlist templates before final selection.

### Feedback

Client can leave notes such as:

"I like the layout but prefer the colors from Template 2."

### Custom Requests

Client can select:

**None of these are quite right**

and submit requirements.

### Analytics

See:

Portal conversion rate  
Most previewed templates  
Most selected templates  
Selection rate by industry

### Template Recommendations

Automatically recommend templates based on client industry.

### AI Matching

Example:

Client industry = Roofing

WebDashy recommends:

Roofing Pro  
Contractor Elite  
Local Services Dark

---

# 33. Build Philosophy

The application should be kept intentionally simple.

Do not build unnecessary abstractions.

Do not create enterprise complexity.

Prioritize:

1. Reliability
2. Clean architecture
3. Great UI
4. Fast workflow
5. Easy maintenance
6. Responsive design

The primary measure of success is:

**How quickly can I go from finding a potential client to sending them a professional template selection link?**

Target:

**Under two minutes.**

---

# 34. Recommended Development Order

## Phase 1 — Foundation

Create application.

Configure:

Next.js  
TypeScript  
Tailwind  
shadcn/ui  
PostgreSQL  
Prisma  
Authentication

Create application shell and navigation.

---

## Phase 2 — Template Library

Build:

Template database

Template gallery

Template cards

Categories

Search

Template details

Create/edit template

Live preview links

---

## Phase 3 — Clients

Build:

Client database

Client list

Client record

Client statuses

Add/edit client

---

## Phase 4 — Portal Builder

Inside client record:

Create Portal

Select Templates

Reorder Templates

Portal Message

Generate Unique Token

Copy Portal Link

---

## Phase 5 — Public Portal

Build:

`/p/[token]`

Portal hero

Client name

Welcome message

Template grid

View Preview

Choose This Template

Confirmation modal

Success state

---

## Phase 6 — Tracking

Implement:

Portal views

First viewed

Last viewed

Preview clicks

Selections

Activity feed

---

## Phase 7 — Dashboard

Build useful overview cards and recent activity.

Do this after actual data exists.

---

## Phase 8 — Polish

Responsive design

Loading states

Empty states

Error states

Toast notifications

Accessibility

Performance

SEO blocking for private client portals

Security review

---

# 35. Security Requirements

Public portals must use long cryptographically random tokens.

Do not expose internal database IDs.

Public portals should contain:

`noindex`

to prevent search engine indexing.

Ensure public endpoints only expose information explicitly associated with that portal.

A visitor to one portal must never be able to retrieve another client's information.

Admin routes require authentication.

---

# 36. Performance Requirements

Template screenshots may be large.

Use optimized images and appropriate responsive sizes.

Pages should feel immediate.

Avoid loading every full-resolution screenshot when only thumbnails are displayed.

Public portal should perform especially well because it represents the quality of the website service itself.

---

# 37. UX Details

When copying a portal:

**Portal link copied**

When client hasn't viewed it:

**Not viewed yet**

When they have:

**Viewed 2 hours ago**

After selection:

**Modern Construction Selected**

The application should communicate status without requiring me to dig through menus.

---

# 38. Empty States

## No Templates

**Build your template library**

Add your first website template to start creating client portals.

`Add Template`

## No Clients

**Add your first potential client**

Create a client and send them a personalized template selection portal.

`Add Client`

## No Portal

**No template portal yet**

Choose a few templates and create a personalized selection portal for this client.

`Create Portal`

---

# 39. Codex Development Rules

When implementing this project:

1. Read this complete product specification before changing code.
2. Create an `ARCHITECTURE.md`.
3. Create a `ROADMAP.md`.
4. Create a `README.md`.
5. Keep architecture straightforward.
6. Implement one milestone at a time.
7. Do not prematurely build V2 features.
8. Keep UI consistent across screens.
9. Use reusable components where they genuinely reduce duplication.
10. Keep public portal code separated logically from the admin experience.
11. Run builds after meaningful changes.
12. Run linting and tests where applicable.
13. Do not silently ignore errors.
14. Document required environment variables.
15. Never commit credentials or secrets.

---

# 40. Initial Codex Assignment

Use the following as the first task after providing Codex this portfolio:

## Assignment

Build the initial foundation for **WebDashy** based on the attached product portfolio.

Before implementing major product functionality:

1. Inspect the repository.
2. Create `ARCHITECTURE.md`.
3. Create `ROADMAP.md`.
4. Create or update `README.md`.
5. Define the application's core domain models.
6. Create the primary application shell.
7. Implement the sidebar/navigation.
8. Create placeholder routes for:
   - Dashboard
   - Templates
   - Clients
   - Portals
   - Settings
9. Establish the shared design system.
10. Build the Templates page using mock data to closely match the provided UI reference.

Do not implement the complete application in one pass.

Once the foundation and Templates page are complete:

- run the production build,
- resolve errors,
- summarize what changed,
- list files created or modified,
- identify the next recommended milestone.

Preserve the visual direction from the provided WebDashy mockups.

---

# 41. Definition of Success

WebDashy V1 is successful when I can:

**1. Add a website template**

↓

**2. Add a potential client**

↓

**3. Pick several templates for that client**

↓

**4. Generate a unique link**

↓

**5. Send the link to the client**

↓

**6. Client clicks View Preview**

↓

**7. Client clicks Choose This Template**

↓

**8. Client confirms their choice**

↓

**9. WebDashy records the selection**

↓

**10. I can immediately see which design they chose**

That is the product.

Everything else should support this workflow rather than distract from it.

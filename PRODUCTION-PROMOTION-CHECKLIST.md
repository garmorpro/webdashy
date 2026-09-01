# WebDashy Production Promotion Checklist

Use this checklist whenever promoting changes from `develop` to `main`.

## Code promotion
- Merge tested feature branches into `develop`
- Verify `develop` is clean and pushed
- Merge `develop` into `main`
- Push `main`

## Production environment
- Keep production database separate from dev
- Set `SITE_URL=https://webdashy.com`
- Ensure `EMAIL_DRY_RUN` is unset or `false`
- Keep real production Gmail credentials configured
- Keep production `AUTH_SECRET`
- Do not copy dev `.env` into production

## Database
- Back up the production PostgreSQL database before applying migrations
- Review pending migrations before deployment
- Run:
  `docker compose exec app npx prisma migrate deploy`
- Verify migrations complete successfully

## Docker deployment
- Pull the latest `main` branch
- Rebuild production containers
- Restart production stack
- Verify app, database, and Nginx containers are healthy

## Nginx / Cloudflare
- Confirm production route points to `webdashy.com`
- Confirm Nginx forwards:
  - `Host`
  - `X-Forwarded-Host`
  - `X-Forwarded-Proto`
- Verify generated client-facing links use `https://webdashy.com`

## Workflow V2
- Verify existing clients receive correct workflow-stage backfill
- Verify new clients begin at `ADD_LEAD`
- Test Contact
- Test Questionnaire
- Test Portal
- Test Template & Plan
- Test Build Setup
- Test Website Draft
- Test Client Review
- Test Revisions / Approved
- Test Invoice
- Test Payment Received
- Test Launch & Handoff
- Test Client Care

## Email
- Send a real test questionnaire email
- Send a real portal email
- Verify client-facing links use production URLs
- Verify no `[EMAIL DRY RUN]` logs appear

## Final verification
- Login to https://webdashy.com
- Open an existing client
- Create a temporary test client if needed
- Verify workflow and client data
- Check application logs for errors

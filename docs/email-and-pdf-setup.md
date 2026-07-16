# Email sharing & A4 PDF — setup

Quotations and bills render as **A4 documents** and can be printed, downloaded as
PDF, shared on WhatsApp, and emailed. This guide covers the two pieces that need
configuration: **server-side PDF** and the **email provider**. Everything works
out of the box with no credentials (log emails + browser "Save as PDF"); the
steps below enable real sending and server-generated PDF files.

All configuration is environment variables in `apps/api/.env` (see
`apps/api/.env.example` for the full, documented list).

---

## 1. Server-side PDF (Puppeteer)

True PDF **files** (used for email attachments) are produced with headless
Chromium via Puppeteer. On-screen print/download always works without this via
the browser's "Save as PDF".

- **Default:** `pnpm install` downloads Chromium automatically — the build is
  approved in `pnpm-workspace.yaml` (`onlyBuiltDependencies: [..., puppeteer]`).
- **Reuse an existing browser** (skip the ~150 MB download): set
  `PUPPETEER_EXECUTABLE_PATH` to a Chrome/Chromium binary. Examples:
  - macOS: `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`
  - Debian/Ubuntu server: `/usr/bin/chromium` (after `apt-get install -y chromium`)
- **Fallback:** if no browser is available the API serves print-ready A4 HTML and
  the emailer attaches the HTML document instead of a PDF — nothing breaks.

Verify: share a quotation by email and check the API log. A successful run shows
`[mail:log] … attachments=1` with **no** `PDF generation failed` warning.

---

## 2. Email provider

Selected by `MAIL_PROVIDER` (`log` | `resend` | `smtp`). Templates and the
sender name/address are also configurable under **Settings → Sharing**
(`emailSenderName`, `emailSenderAddress`, subject/body templates).

### `log` (default — no credentials)
Records the email (recipient, subject, attachment count) to the API log and
reports success. Ideal for development and demos.

```
MAIL_PROVIDER=log
MAIL_FROM=Hardware POS <no-reply@hardware-pos.local>
```

### `resend` (recommended for production)
1. Sign up at https://resend.com and **verify your sending domain**.
2. Create an API key.
3. Configure:
   ```
   MAIL_PROVIDER=resend
   RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxx
   MAIL_FROM=Quotes <quotes@yourdomain.com>   # must be on the verified domain
   ```
The PDF is attached automatically.

### `smtp` (SendGrid, Mailgun, Gmail, or any SMTP)
```
MAIL_PROVIDER=smtp
SMTP_HOST=smtp.yourprovider.com
SMTP_PORT=587           # 465 if using TLS
SMTP_SECURE=false       # true for port 465
SMTP_USER=apikey-or-username
SMTP_PASS=your-password
MAIL_FROM=Quotes <quotes@yourdomain.com>
```
(SendGrid: host `smtp.sendgrid.net`, user `apikey`, pass = your SendGrid API key.)

If provider config is missing or a send fails, the service degrades to the log
provider / a `FAILED` result and logs why — the API never crashes on a bad email
config.

---

## 3. WhatsApp & public share links

WhatsApp sharing opens a `wa.me` deep link with a prefilled message + a public,
tokenised link to the A4 document (`PUBLIC_SHARE_BASE_URL/public/quotations/:token`).
Set `PUBLIC_SHARE_BASE_URL` to a URL reachable by recipients (defaults to the
local API). The message template lives in **Settings → Sharing**. A future
WhatsApp Business API integration can attach the PDF directly — the share is
already logged per-send in `QuotationShareLog` for that.

---

## Quick reference (apps/api/.env)

| Var | Purpose | Default |
| --- | --- | --- |
| `MAIL_PROVIDER` | `log` \| `resend` \| `smtp` | `log` |
| `MAIL_FROM` | From header | placeholder |
| `RESEND_API_KEY` | Resend key (when `resend`) | — |
| `SMTP_HOST/PORT/SECURE/USER/PASS` | SMTP config (when `smtp`) | port 587 |
| `PUPPETEER_EXECUTABLE_PATH` | Chrome/Chromium binary | bundled Chromium |
| `PUBLIC_SHARE_BASE_URL` | Base for public share links | local API |

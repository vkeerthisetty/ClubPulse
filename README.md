# ClubPulse

ClubPulse helps club organisers collect anonymous event feedback and turn it into protected reports and follow-up actions. Participants use a one-use invitation instead of creating a personal account. Administrators have a separate, server-protected workspace.

Built with **MongoDB, Express, React and Node.js (MERN)**, with separate invitation-issuer and feedback-collector services.

## Live website

- [Website](https://clubpulse-web-vkeerthi.onrender.com/)
- [Interactive practice workspace](https://clubpulse-web-vkeerthi.onrender.com/#try)
- [Read-only sample reports](https://clubpulse-web-vkeerthi.onrender.com/#demo)
- [Participant sign-in](https://clubpulse-web-vkeerthi.onrender.com/#participant)
- [Administrator sign-in](https://clubpulse-web-vkeerthi.onrender.com/#admin/login)
- [How anonymity works](https://clubpulse-web-vkeerthi.onrender.com/#proof)

The demo uses existing Render addresses. A custom domain is optional and no domain purchase is needed. Keep both services on Free plans. Free hosting can sleep or encounter limits; uninterrupted availability is not guaranteed. This repository does not verify account billing settings.

The current interface uses framed illustrations, large serif headings, paper backgrounds, muted panels and prominent lime action buttons. Pixel icons are original ClubPulse artwork, not copied Streamline assets. The favicon is `public/favicon.svg`; the self-hosted Anton font includes its OFL licence. Sample responses are labelled rather than presented as real usage.

## Try both sides for an evaluation

1. Open **Try the interactive demo** at `/#try`.
2. Use the prepared invitation, sign in as a participant and submit a rating, topic and optional comment.
3. Switch to **Practice organiser**. Generate more invitations or create another practice event.
4. Add the four labelled example responses, then close and seal the practice report.
5. Explore graphs, written comments, report tools and action planning.

The practice workspace uses the blind-signature flow without granting access to the real administrator account. Its session lasts 30 minutes and can end sooner on a service restart. Practice data is held in memory separately from real event records. Practice sealing skips the cooldown; the five-response minimum still applies.

The public `/#demo` page is a separate read-only tour. The latest live check showed **four sample events, 20 sample responses and a 4.2/5 average**. These are demonstration fixtures, not real attendance or product usage.

### Demonstrate a real event

1. Sign in with the administrator account configured in Render. Local-preview credentials do not work on the deployment.
2. Open **Events**, select an open real event and generate invitations.
3. Distribute one code and the event link per participant. The app does not send codes by email or SMS.
4. In a separate browser profile or private window, open the participant link, exchange an unused code and submit feedback.
5. Show an **already released report** for immediate report viewing. New real submissions do not release reports immediately.
6. A new real report needs event closure, at least five valid responses and a 15-minute cooldown. Load Statistics after eligibility to seal it.

Do not reopen/reclose an event merely to inspect feedback. Reclosing an unpublished event restarts its cooldown. Sealed real events cannot reopen.

## Pages and features

| Page | Route | Features |
| --- | --- | --- |
| Event directory | `/#` | Browse events and enter participant or evaluation flows |
| Participant portal | `/#participant`, `/#participant/EVENT_ID` | One-use invitation exchange, rating, topic, optional comment, confirmation |
| Privacy explanation | `/#proof` | Issuer/collector flow, stored data and limitations |
| Practice workspace | `/#try`, `/#try/organiser` | Temporary roles, events, invitations, examples and sealing |
| Sample reports | `/#demo` | Labelled examples, charts, comment explorer and report tools |
| Administrator login | `/#admin/login` | Email/password login, password visibility toggle, errors |
| Statistics | `/#admin/statistics` | Whole-event reports, graphs, comparisons, action board and exports |
| Released comments | `/#admin/feedback` | Written feedback from eligible sealed reports, selected by event |
| Events | `/#admin/events` | Create/edit, search, open/closed filters, close/reopen eligible events, generate/revoke invitations |
| Privacy and diagnostics | `/#admin/privacy` | Privacy details and database/issuer connectivity checks |

Existing legacy administrator bookmarks still require authentication. Participant codes never grant an administrator role. All protected APIs independently enforce administrator sessions.

### Statistics and visual reports

- Overall rating gauge on a 1–5 scale.
- Report-availability donut separating released, collecting, cooldown, protected and sample events.
- Event-score plots and released-response volume bars with clickable whole-event selection.
- Sort by event date, highest score or most released responses.
- Accessible chart descriptions and a toggleable chart-data table.
- **View graphs** and **Read written comments** shortcuts.
- Rating/topic breakdowns with count/percentage controls when disclosure thresholds permit.
- Release ledger, metric glossary, manual refresh and copyable takeaways.
- Comparison of two real sealed events, excluding samples as baselines. Comparisons do not establish significance or causation.
- Aggregate CSV export and downloadable HTML report brief, printable to PDF.
- Listening prompts derived by simple keyword rules from released comments, for human review rather than AI sentiment classification.

Charts use eligible report aggregates only. Protected counts and provisional scores are not drawn as zero. Volume bars are not attendance figures or response rates. Refreshing administrator statistics also refreshes event options to prevent stale report selectors.

### Comments, actions and invitations

To read real written feedback, open **Released comments** and select its event after the report is sealed. Reports can be viewed repeatedly. Released comments retain their event association but have no linked rating, topic, respondent ID or submission time. They are shuffled into a stable order. Sample/practice comment search runs locally on already released text and does not create backend reporting slices.

The action board supports tasks, responsible roles, due dates, Planned/In progress/Done status, progress totals, suggestions, removal with undo and validated JSON import/export. Tasks are scoped to report selection and saved in browser storage, **not synced between administrators or devices**. Report briefs exclude comments and action notes.

Invitation downloads and printable invitation cards contain access codes. Distribute them privately; never commit them. Revocation affects unused matching codes and cannot undo a completed exchange.

## How anonymity works

```text
Browser creates random token and blinds it
    -> Issuer receives invitation code + blinded token
    -> Issuer validates one-use code and returns blinded signature
Browser unblinds signature
    -> Collector receives signed token + feedback, without invitation code
    -> Collector verifies signature and rejects token reuse
Protected collection -> closure -> minimum + cooldown -> sealed report
```

The issuer owns invitation hashes and event private signing keys. The collector holds public keys and feedback. Production requires separate HTTPS origins. Internal operations require `ISSUER_ADMIN_SECRET`, which is never sent to browsers.

Cloudflare's RFC 9474 **RSABSSA-SHA384-PSS-Randomized** suite uses a separate 2048-bit RSA key per event. Canonical token hashes prevent replay, including alternate-Base64 representations. A one-use code prevents code reuse, not one person receiving multiple invitations.

Issuance and feedback requests omit cookies and referrers. Real feedback rejects invitation/identity fields, cookies and Authorization headers. Feedback records contain a random UUID, event ID, rating, topic, comment and token hash. They do not contain names, emails, invitation codes, submission timestamps, IP addresses or user-agent fields. Event metadata still has event dates and cooldown deadlines.

### Report privacy rules

A real report releases only when the event is **closed**, has **at least five valid responses**, and **15 minutes have passed since closure**. The first eligible authenticated statistics/export request seals and persists it; no scheduled job is needed. Real sealed reports are immutable and cannot reopen.

Exact counts and scores stay hidden before release. Reporting APIs allow whole-event selection only and reject rating, topic, search and submission-date slices. Each rating/topic cell and its complement need at least five responses. If small cells would be exposed, the entire breakdown is withheld. Positive-rate reporting needs five positive and five non-positive responses. Combining reports does not reconstruct suppressed cells.

CSV exports contain sealed event aggregates only, excluding comments, invitations, tokens and submission times.

### Security limits

**Blind signatures are not end-to-end encryption of feedback.** Someone with privileged database access can read stored comments. HTTPS protects transport; database permissions, storage protection and backups are separate responsibilities.

Identifying details in comments can reveal authors. The form warns about identifiers and checks for contact-like text locally, but cannot detect every identifying detail. Hosting providers, proxies and MongoDB operational metadata may reveal network timing. Neither service installs request/body access logging, but this does not disable provider-controlled logs. Rate limiting uses temporary HMAC-derived network keys in memory.

Use separately scoped database users, restricted hosting/operator access and controlled logs/backups. Separate services under one operator do not eliminate traffic correlation. This is threshold-based disclosure reduction, not differential privacy, perfect anonymity or an independently audited security guarantee.

References: [RFC 9474](https://www.rfc-editor.org/rfc/rfc9474.html), [Cloudflare blindrsa-ts](https://github.com/cloudflare/blindrsa-ts), [OWASP logging guidance](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html).

## Stack and source layout

| Technology | Role |
| --- | --- |
| React 19 + Vite | Interactive participant/organiser UI and production frontend build |
| Express 5 + Node.js 24 | APIs, administrator sessions, issuance coordination and static serving |
| MongoDB + Mongoose 8 | Persistent real events, feedback, signing material and sealed reports in separate databases |
| Cloudflare blindrsa-ts | Token blinding, signing, unblinding and verification |
| Helmet + express-rate-limit | Security headers and request limits |

React keeps the interactive pages and report selection in sync. Express and Node handle validation and cryptographic workflows on the server. MongoDB stores the event/report documents; its transactions protect the collection/closure boundary. Local preview and practice instead use temporary memory.

| Source | Responsibility |
| --- | --- |
| `src/main.jsx`, `src/Front.jsx` | Routing, authentication, participant flow and public pages |
| `src/atelier.css`, `src/lucid.css`, `src/PixelIcon.jsx` | Shared visual system and original icons |
| `src/Dashboard.jsx`, `src/FeedbackCharts.jsx`, `src/chartData.js` | Dashboard and protected chart data |
| `src/ReportStudio.jsx`, `src/actionImport.js` | Comparison, briefs and action board |
| `src/EventWorkspace.jsx`, `src/ReviewTools.jsx` | Events, invitation cards, comments and diagnostics |
| `src/Evaluator.jsx`, `server/evaluator.js`, `server/evaluatorIssuer.js` | Practice workflow |
| `server/index.js`, `server/issuer.js` | Collector and issuer entry points |
| `server/store.js`, `server/privacy.js` | Persistence, sealing and suppression |
| `src/http.js`, `server/issuerClient.js` | Hosting recovery and issuer readiness |
| `tests/` | Integration, privacy, chart, practice, import and recovery tests |

## Run locally

Install **Node.js 24** as specified in `.nvmrc`.

```powershell
npm ci
npm run dev
```

Open http://localhost:3000. Without a database URI or external issuer configuration, development starts a temporary collector on port 3000 and issuer on port 3001, in one process on this computer. This is not infrastructure isolation.

Local-only administrator credentials: `admin@clubpulse.local` / `local-preview-only`.

Local preview seeds one **24-Hour Hackathon**, five synthetic ratings and a fixed **4.2/5** report. Development invitation `HACKATHON-DEMO-2026` works once per restart. New submissions do not change that frozen sample report. These credentials and code are not production access.

### Persistent local setup

MongoDB must be an Atlas cluster or local **replica set**. Standalone `mongod` cannot support the collector's transaction boundary.

1. Copy `.env.example` to `.env` and `.env.issuer.example` to `.env.issuer`.
2. Configure separate `clubpulse_collector` and `clubpulse_issuer` databases, each with its own scoped database user.
3. Fill the URIs, administrator credentials, `SESSION_SECRET` and `ISSUER_ADMIN_SECRET`. Use the same issuer secret on both services.
4. Keep `DEMO_MODE=false` and configure `ISSUER_URL` for the external issuer listener.
5. Generate each secret separately:

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

6. Start the issuer in one terminal:

```powershell
node --env-file=.env.issuer server/issuer.js
```

7. Start the collector in another:

```powershell
npm run dev
```

The collector loads `.env` automatically. Never commit real environment files. Persistent models use `CollectorEventV2` and `CollectorFeedbackV2`; legacy timestamped data is not automatically imported.

## Local presentation backup

From the source checkout, run `npm ci` and `npm run build`, then double-click **Start-ClubPulse-Demo.cmd**.

The separately prepared Windows package, if supplied, includes Node, dependencies and the built interface. It needs no installation or internet. Generated packages are Git-ignored; cloning this repository does not include the ZIP.

- Opens `http://localhost:3040/#try`; issuer uses port 3041.
- Binds only to this laptop and uses temporary data.
- Keep the command window open; closing it stops both local listeners.
- Uses the local-only administrator credentials above.
- Does not copy real hosted reports or MongoDB records.

See [Presentation quick start](PRESENTATION_QUICK_START.md). Clearly describe the backup as a local demonstration.

## Render and MongoDB deployment

The existing deployment uses two Node web services. Static-only hosting cannot run these backends.

| Setting | Collector / website | Issuer |
| --- | --- | --- |
| Build | `npm ci && npm run build` | `npm ci` |
| Start | `npm start` | `npm run issuer` |
| Health path | `/api/health` | `/health` |
| `NODE_ENV` | `production` | `production` |
| `DEMO_MODE` | `false` | `false` |
| Database variable | `MONGODB_URI` | `ISSUER_MONGODB_URI` |
| Internal secret | `ISSUER_ADMIN_SECRET` | Same `ISSUER_ADMIN_SECRET` |
| Frontend origin | `PUBLIC_ORIGIN` | Same `PUBLIC_ORIGIN` |

Set collector-only `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `SESSION_SECRET` and `ISSUER_URL`. Use actual HTTPS origins and let Render assign its port. Never expose secrets through Vite/browser variables.

In Atlas, scope database permissions and allow the required hosting outbound ranges. Replace a connection template's password placeholder with the URL-encoded password **without angle brackets**. Never publish the completed URI.

Check the current plan of each service is **Free** before saving infrastructure changes. Do not enable paid instances, add-ons or database capacity for this demo. A custom domain is optional and registration can cost money. If hostnames change, update both services' `PUBLIC_ORIGIN`, the collector's `ISSUER_URL` when applicable, DNS/TLS and browser checks.

After deploying, verify both health endpoints, frontend, favicon, `demo:false`, separate issuer origin, administrator authentication and narrow-screen layout. Exercise writes in the isolated practice workspace or a designated test event. Inspect existing reports without reopening or closing them. Verify provider logging/retention independently.

## Reliability and troubleshooting

- **Slow invitation generation:** Free services may be waking. The collector checks issuer readiness using safe health reads before sending an operation. Open practice before presenting or use the local backup; availability is not guaranteed.
- **Admin login rejected:** use the account configured in Render. Email is trimmed and case-normalised; passwords must match. Event codes and local-preview credentials do not grant production admin access. Ten failed login attempts within 15 minutes cause a temporary limit.
- **Signed out after deployment:** sessions live in server memory for up to eight hours and disappear on restart. Sign in again. Keep one collector instance until shared sessions are implemented.
- **Invalid/revoked/exchanged code:** use an unused code for the correct open event. Retry interrupted exchange in the original tab where token state was retained. Losing browser session storage can lose the token.
- **Expired practice:** start fresh. Service restarts clear practice state.
- **Protected comments/report:** check closure, minimum and cooldown. Protected does not mean empty. Refresh Statistics after eligibility and select the correct event in Released comments.
- **Missing event option:** refresh Statistics or reload; the updated client synchronises event options with statistics responses.
- **Interrupted event creation:** the client retains a request ID and the server deduplicates matching retries. Check Events before starting a separate new request.
- **Temporary hosting HTML/non-JSON response:** the client displays a hosting error and keeps form state. Safe reads may retry; writes are not blindly replayed.
- **Connection failure:** administrator diagnostics check database and issuer connectivity.

Do not repeatedly click state-changing buttons during timeouts or disable privacy rules for a presentation.

## Verification

```powershell
npm test
npm run build
git diff --check
```

The 14 automated tests cover real blind issuance across local listeners, administrator boundaries, forbidden identity fields, forged tokens, replay, minimum/cooldown, immutable reports, complementary suppression, stripped comment metadata, aggregate exports, practice isolation, validated action imports, chart eligibility, read-only retries and issuer readiness. Test-only accelerated cooldown does not change production rules.

### Latest read-only deployment check: 29 October 2026

- Source checked: `aaf2839`, including visual charts and event-selector refresh.
- Collector health: `ok:true`, `demo:false`; issuer health: `ok:true`.
- Configuration: five-response minimum, 15-minute cooldown, separate HTTPS issuer.
- Public showcase: four sample events, 20 sample responses and 20 sample comments.
- Deployed JavaScript and CSS asset names match the current production build.
- All **14 tests passed** with local server networking permitted; production build passed.

These checks are not a new authenticated production workflow audit or verification of account billing. No real event was reopened, closed or populated during this documentation check.

## Repository and safe updates

Repository: [vkeerthisetty/ClubPulse](https://github.com/vkeerthisetty/ClubPulse).

Review `git status` and stage intended files individually. Never stage real environment files, signing keys, database dumps, invitation downloads or private screenshots. Example environment files contain templates only.

Official infrastructure references: [Render web services](https://render.com/docs/web-services), [Free service limits](https://render.com/docs/free), [Atlas free cluster limitations](https://www.mongodb.com/docs/atlas/reference/free-shared-limitations/).

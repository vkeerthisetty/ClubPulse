# ClubPulse verification, 26 October 2026

## Production checks completed before deployment

The owner signed into the live administrator workspace for verification.

| Workflow | Observed result |
| --- | --- |
| Database, issuer credential, origin separation, HTTPS diagnostics | All four ready |
| Create a real collection event | Succeeded |
| Edit event description | Succeeded |
| Generate two invitations | Succeeded |
| Revoke one invitation | Succeeded; participant exchange rejected that code |
| Exchange remaining valid invitation | Succeeded across separate production origins |
| Submit anonymous feedback | Received confirmation |
| Close test event | Succeeded; invitations disabled |
| Select test cohort in statistics | Protected; export disabled |
| Return to released club reports | Still 20 sample responses; test response excluded |
| CSV export | Downloaded; four report rows, no system event or individual comment |
| Copy report | Clipboard contains the released 20-response summary |
| Administrator sign-out | Returned to sign-in screen |

One closed event named `SYSTEM CHECK / not a club event` remains in the administrator register. It contains one explicitly marked technical test response. It is below the five-response release minimum and cannot contribute to released reports. No genuine participant data or existing reports were deleted or changed.

## Browser checks on the updated source

- Header Give feedback, prominent hero entry action, proof links and working ruler navigation.
- Home and participant-entry layout at 390px; no horizontal overflow observed.
- Report Overview, Analysis, Events & comparison and Action studio views.
- Count/percent switch and downloadable report brief.
- Comment search, clear search and progressive loading (verified in the preceding audit; controls retained).
- Invitation link copying, plaintext code download, printable invitation cards and dialog close.
- Privacy simulator transitions to released only with closure, sufficient responses and cooldown; reopening protects it again.
- Isolated component fixture: baseline/follow-up comparison displays +0.6, suggested action insertion, status change, action export, remove, undo and duplicate-safe import.
- Action imports display a success status, distinct from an error.

The isolated `tests/ui-fixture.html` is served only by the development preview. It is not a production build entry and its sample figures are never stored in MongoDB or published as participant data.

## Regression protections

The automated suite covers blind-signature verification, revoked invitations, retries of identical exchanges, rejection of different blinded requests for an already exchanged code, token replay, tampered signatures, cookie/authorization omission, forbidden identity fields, hostile origins, administrator authorization, report minimum/cooldown, immutable cohorts, small-cell/complement suppression, scoped totals, aggregate-only exports and action import validation.

## Issues found and fixed

- Report selection briefly showed the previous scope's numbers. Pending scopes now hide previous metrics and disable export.
- Public demo and private administrator reporting shared one event selection. They now keep independent scopes.
- Protected reports suggested a negative conclusion despite having no released score. They now explicitly defer judgment.
- Production demonstration reports exposed collection controls. They are now read-only and excluded from participant sign-in.
- Primary participant entry was visually weak. It now uses a larger chartreuse button and has a second prominent entry in the header.

Blind signatures separate invitations from responses. They do not prevent identifying prose or hosting-level timing/network correlation. This verification is functional testing, not an independent security audit.

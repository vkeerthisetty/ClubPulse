# ClubPulse feature audit, 26 October 2026

## Implemented in this audit

- Correct whole-event filtering in the public demonstration, including headline aggregates and comments. Only synthetic demo reports can be selected publicly.
- Correct demo privacy navigation to the public proof page.
- Demo loading errors now expose a retry control.
- Searchable, progressively loaded demonstration comments with event context and explicit synthetic-data disclosure. Search does not change statistical cohorts.
- Administrator-only service diagnostics: database reachability, authenticated issuer connectivity, distinct origins and HTTPS configuration. No invitations or responses are created.
- Downloadable printable invitation cards, generated locally from the current code batch. Cards contain private one-use codes and must not be published.

## Verification

- Production client build passes.
- Seven automated integration/privacy tests pass. Integration covers administrator authentication, forged participant credentials, event creation, invitation generation, blind signing, submission, duplicate prevention, cookie omission, sealing, cooldown, suppressed breakdowns, exports, logout, and the new protected diagnostics endpoint.
- Local browser checks: administrator login, event creation, invitation generation, printable-card control, comment search, public privacy navigation, and successful service diagnostics.
- Live read-only checks: collector health and showcase respond; statistics and exports reject unauthenticated access with HTTP 401.

## Limits and follow-up

- Local tests do not prove that production service credentials match. Run the administrator connection check on the deployed system to verify that configuration. Previous production event provisioning had failed and cannot be declared repaired without this check.
- Free Render instances sleep. A cold start was observed during this audit.
- Sample data is illustrative, never evidence of real users or adoption.
- Reports deliberately suppress small groups. They do not offer individual tracking, arbitrary date slices, or identity-linked sentiment analysis.
- The application has not received an independent security audit. Hosting metadata and identifying prose remain anonymity risks.
- Organiser action plans are saved in the current browser, not synchronised across devices.

## Comparable products reviewed

- Slido security: https://www.slido.com/security. Anonymous participation does not mean the infrastructure receives no technical data.
- AllVoices anonymous follow-up: https://support.allvoices.co/hc/en-us/articles/8497467861019-What-if-someone-reports-something-serious-and-we-need-them-to-come-forward. Private two-way follow-up is a useful future direction, but adding it here needs a deliberate receipt and disclosure design rather than linking identities to sealed reports.

These products offer comparable anonymous participation workflows; this review does not establish that they use ClubPulse's blind-signature protocol.

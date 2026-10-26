# ClubPulse Atelier redesign

The existing React/Express application, routes, MongoDB collections, separate issuer, report sealing and data are retained.

## Visual foundation

Reference inspected: https://www.awwwards.com/sites/nesils-lucid-dreams and https://nesilnoble.com/.
The adaptation uses the reference's large serif typography, framed illustration and ruler motif. ClubPulse uses parchment, forest ink, sage and vermilion to respect its existing no-purple preference. No reference artwork or fonts were copied.

PixelIcon.jsx contains original pixel-grid SVG artwork. No Streamline icon files, logos or licensed paths are included. OrbitArtwork.jsx is also original project artwork.

## Page coverage

- Home: split typographic composition and original privacy illustration; event directory rows; participant/organiser entrances.
- Proof: editorial reading layout, numbered privacy sequence, retained interactive release simulator.
- Demo and administrator statistics: four report views instead of a continuous panel stack. All existing charts, comparisons, notes, ledger, exports and actions remain accessible.
- Administrator sign-in: split dark/light composition and focused form.
- Participant sign-in and feedback: focused form canvas and restrained rating controls.
- Feedback: readable comment rows, retained search and whole-event scope.
- Events: searchable register with status filters and inline editing/revocation.
- Privacy: revised information hierarchy and retained service diagnostics.
- Shared dialogs, navigation, typography, forms, focus states and small-screen layouts.

## New capabilities

1. Edit event name, date and description before report sealing. Invitations and cryptographic event IDs stay valid. Sealed event details cannot change.
2. Revoke specific unused invitation codes. Only hashes are retained; no attendee identity is added. Exchanged tokens remain valid. Revocation is checked again during atomic token exchange to handle races.
3. Import downloaded action plans into their original report scope, preserving existing actions and skipping exact duplicates. Invalid files fail before changes are applied; input size and action counts are bounded.
4. Search and filter the organiser event register by status.

The action board remains browser-local. No paid services or new trackers were introduced.

## Verification

- Production build and eight automated tests pass, including event editing, sealed-event protection, invitation revocation, retained validity of exchanged tokens, action import validation and existing privacy controls.
- Local browser checks pass for home, proof, demo, administrator login, statistics views, released feedback, event creation/editing/search/revocation, service diagnostics, action-plan file import, participant invitation exchange and feedback submission.
- Tested mobile home, participant form, event register and analysis at a 390px viewport; no horizontal overflow was observed in the checked home, register or analysis views.
- Navigation/modal stacking regression found during testing was fixed. Pixel icons have consistent sizing and the compact sign-out control has an explicit accessible name.

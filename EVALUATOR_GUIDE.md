# Interactive evaluator guide

The existing ClubPulse app has a public, isolated evaluator workspace at `/#try`. Clicking a sample event or its **Try event** button opens a fresh practice space for that event. A participant code is prepared automatically. No private administrator password is shared.

## Suggested walkthrough

1. Click a sample event on the homepage.
2. In **Participant**, click **Sign in with event code**. The temporary one-use invitation is already filled in.
3. Select a rating and topic, write a practice comment, and submit.
4. Click **Switch to practice organiser**.
5. Click **Add 4 labelled examples**, then **Close and seal practice report**.
6. Explore the report, comments, exports and action board. Your practice entry and the four examples form the sealed five-response cohort.
7. In the practice organiser view, create another temporary event or generate another invitation.

There is also a completed workshop containing five explicitly labelled example entries. Selecting **Practice report** before submitting opens that completed example. Real club collection remains invitation-gated and administrator management remains password-protected.

## What is real and what is practice-only

- The browser uses the existing Cloudflare RFC 9474 blind-signature library.
- A separate issuer service signs blinded tokens. The collector receives the public key, verifies the unblinded signature, and rejects repeated tokens.
- Practice submissions omit account cookies, authorization and evaluator-session headers.
- Practice administrator requests use a separate temporary session credential. It does not authorize any real administrator route.
- Data stays in bounded, isolated memory maps on the existing collector and issuer services. No practice event, response or signing key is written to the real MongoDB collections.
- The report minimum and small-cell rules still apply. Only practice sealing skips the 15-minute cooldown, clearly disclosed on screen. Real events retain the cooldown.
- Practice sessions expire after 30 minutes or a collector restart; signing-service restarts also invalidate practice invitations. **Start fresh practice** prepares a new session.
- Each session has one completed example and up to two collection events. Invitation and response limits prevent the practice feature from consuming unbounded resources.
- Action-plan notes use the existing browser-local storage and can be downloaded separately.

## Hosting cost

No new hosting service, paid API, storage plan, subscription or upgrade was added. This feature reuses the existing two Render services and adds no MongoDB practice storage.

Render Free services sleep after 15 idle minutes and can take about a minute to wake. Their included bandwidth, build minutes and shared free-instance hours still apply. If an account has a payment method, Render's documented bandwidth/build overage policies may apply. Account billing settings require a signed-in Render session to verify; the application cannot guarantee a host's billing policy.

Sources: https://render.com/docs/free and https://www.mongodb.com/docs/atlas/tutorial/deploy-free-tier-cluster/.

## Verification

`tests/evaluator.test.js` checks both role flows, signature verification, replay rejection, credential omission, cross-session ownership, normal administrator authorization, report sealing and complete separation from real events/reports. Existing integration and privacy tests remain enabled.

Local browser verification completed: clicking a homepage event, prepared invitation exchange, participant submission, role switching, four-example insertion, practice sealing, seeing the submitted comment in the five-response report, creating a second practice event, and submitting to that event. The production build and all nine automated tests pass.

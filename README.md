# ABC Tutoring prototype

A mobile-first GitHub Pages prototype created from customer discovery with Dana.

## Parent experience

1. Choose a subject and grade.
2. Compare matching tutors, qualifications, rates, formats, and service areas.
3. Select an available one-hour appointment.
4. Enter contact and student details without creating an account.
5. Review the tutor, time, format, and expected cost before confirming.
6. Receive a confirmation while the selected slot becomes unavailable locally.

The tutor profiles and photos in this assessment prototype are fictional.

## Local preview

Serve the repository with any static file server, then open `index.html` through
that server. For example:

```powershell
python -m http.server 4173
```

Then visit `http://127.0.0.1:4173/`.

## PostHog setup

Edit `config.js` and set:

- `posthogKey` to the public project key beginning with `phc_`
- `posthogHost` to the project's ingestion host
- `contactEmail` to Dana's contact email

Do not add a PostHog personal API key, GitHub token, or other private credential.

Custom events:

- `tutor_search_submitted`
- `tutor_search_no_results`
- `tutor_profile_viewed`
- `appointment_time_selected`
- `booking_form_started`
- `booking_review_viewed`
- `booking_completed`
- `booking_conflict_seen`

Names and email addresses are deliberately excluded from PostHog event
properties. Autocapture and session recording are disabled for this prototype.

### Generate demonstration traffic

After configuring PostHog, run:

```powershell
node scripts/simulate-traffic.cjs
```

The script sends fictional, anonymous journeys through PostHog's public batch
capture endpoint. Every generated event includes `simulation: true`, making
demonstration activity easy to distinguish or filter. It includes completed
bookings, funnel drop-offs, no-result searches, and Facebook, direct, Google,
and community-newsletter traffic sources. No names or email addresses are used.

## Availability limitation

The prototype stores booked slot identifiers in `localStorage`, so a booking is
retained after refresh and synchronized between tabs in the same browser. A
static GitHub Pages site cannot synchronize bookings across different devices.
A production version should use shared server-side or calendar-backed storage
with an atomic availability check to prevent real-world double-bookings.

# Climbing Training — Product Context

A training app for climbing. Athletes follow training plans assigned by their
coach, log those sessions, and track progress over time. The app is coach-centric:
an athlete without an assigned plan has no use for it.

- Vocabulary and roles: [GLOSSARY.md](../GLOSSARY.md)
- Decisions with rationale: [docs/adr/](./adr/)

## How it fits together

- **Onboarding**: the admin seeds trainer accounts; a trainer shares a
  single-use **Invite Link**; an athlete signing up through it is linked to that
  trainer. Admin accounts are bootstrapped outside the app.
- **Planning**: the trainer composes a **Training Plan** ("routine") from the
  global exercise catalog — weeks → ordered sessions → exercises with reps ×
  sets — and links it to an athlete (**Assignment**, one active at a time).
  Plans are edited live; replaced plans are archived, never deleted.
- **Executing**: the athlete picks a session from their plan and marks it
  complete (**Completion** — the only recorded state). Adherence per week is
  the trainer's review signal.
- **Catalog growth**: trainers propose exercises as **Drafts**; the admin
  reviews, edits, and accepts them into the global, never-deleted catalog.
- **Movement**: trainers can **Transfer** athletes between them; the athlete
  keeps plan and logs, and the new trainer may replace the plan.

## Open Questions

1. **Grading systems**: Which grading systems are in scope, and is grade
   conversion needed? _(Deferred until metrics enter scope.)_

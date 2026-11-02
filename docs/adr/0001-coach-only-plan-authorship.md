# Coach-only plan authorship

Most training apps let athletes self-coach: build their own plans and log freely.
We deliberately rejected that. Plans are authored exclusively by coaches and
assigned to athletes; an athlete cannot create plans and cannot log anything
outside their assigned plan. An athlete without an assigned plan has no use for
the app.

We chose this because the product's value is the coach–athlete relationship, not
self-serve training: the coach controls what the athlete trains, and the
athlete's side of the app is execution and adherence, not programming. This
shaped the model fundamentally — onboarding is a coach-driven flow, an athlete
account alone is inert, and "deactivating" a coach or assignment freezes the
athlete's ability to train in the app.

## Considered Options

- **Self-coached mode** (athlete authors own plans): rejected — dilutes the
  coach-centric product and doubles the plan-authoring surface for v1.
- **Hybrid** (coach-authored plans plus ad-hoc sessions): rejected — ad-hoc
  sessions are invisible to the coach, undermining adherence tracking, the
  thing the coach reviews.

## Consequences

- Every athlete requires a coach–athlete link before the app is usable.
- Logging is only possible against planned sessions of the assigned plan.

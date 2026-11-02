# Logs record completion only (for now)

Athlete logs are completion markers, not training records. A log states that a
planned session was done — nothing about which exercises were performed, at what
intensity, or how they felt. The athlete cannot log beyond the plan's
prescriptions, and within the plan there is no exercise-level detail.

This is a deliberate v1 starting point, **not** the end state: exercise-level
detail in logs is planned for later. The simplicity is intentional — it keeps the
athlete's logging friction near zero (one tap per session) while the coach's
primary review signal is plan adherence: which prescribed sessions were completed.

A future reader seeing logs with no content should not "fix" them by adding
exercise detail; that detail is deferred, not forgotten.

## Considered Options

- **Detailed logging from day one** (sets, reps, RPE per exercise): rejected for
  v1 — high friction for athletes, and the coach's first-order question is "did
  they do the plan?", not "what exactly did they do?".
- **Completion-only forever**: rejected — exercise-level detail is the natural
  next step once the plan–log model exists.

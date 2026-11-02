# Climbing Training

The domain vocabulary for a coach-centric climbing training app: athletes follow
training plans assigned by their coach, log those sessions, and track progress
over time. Product context and open questions live in
[docs/context.md](./docs/context.md); decisions with rationale live in
[docs/adr/](./docs/adr/).

## Roles

**Athlete**:
The primary actor. Follows the training plan assigned by their coach, executes
sessions, and logs results. An athlete cannot create plans and cannot log
sessions outside of what their assigned plan prescribes. Without an assigned
plan, the athlete has no use for the app.
_Avoid_: User, trainee, climber (when talking about the app's role)

**Coach**:
Designs, assigns, and reviews training plans for one or more athletes. Every
athlete in the app has (or is waiting for) a coach. A coach may also be an
athlete (trains themselves) — these are two roles of the same person, not two
separate accounts.
_Avoid_: Trainer, instructor

**Admin**:
A pure administrative role: creates trainer accounts, manages user accounts, and
curates the global exercise catalog and its tag vocabulary. Does not author
routines and is not involved in day-to-day training; an admin cannot train or be
trained. Admin accounts are seeded manually (bootstrap) — they cannot be created
through the app or the invite-link system.
_Avoid_: Superuser, staff

## Language

### Planning

**Training Plan**:
A structured sequence of training content (sessions and exercises) intended to
produce a training adaptation over time. Always authored by a coach; athletes
receive plans only by assignment. Edited live: changes apply immediately to
every athlete the plan is linked to. In everyday speech this is a _routine_ —
acceptable in conversation, but write Training Plan in code and docs.
_Avoid_: Program, schedule

**Assignment**:
The link by which a coach gives a training plan to an athlete. An athlete has at
most one active assignment at a time; linking a new plan archives the previous
one — history is kept, never deleted.
_Avoid_: Enrollment, invite (reserved for signup links), share

**Session**:
A single planned or completed unit of training. A session contains one or more
exercises. The athlete opens a session and marks it complete — completion is the
only recorded state (an "in progress" state may come later to track session
time). Sessions in a plan form an ordered sequence within weeks. A _planned
session_ is what the plan prescribes; a _logged session_ is one the athlete
marked complete.
_Avoid_: Workout, training day, practice

**Week**:
A group of sessions within a plan. Organizational, not calendar-bound: a week is
complete when its sessions are done, not when a date passes. Completing all
sessions of each week is the athlete's responsibility; the coach reviews
adherence per week.
_Avoid_: Block (a former, heavier concept: a multi-week training phase)

**Exercise**:
A specific movement or drill with a fixed description and, optionally, a
demonstration video or animated GIF — either uploaded or embedded by link.
Accepted exercises live in a single global catalog; every coach composes plans
from the same catalog, filtered by tags. Coaches propose new exercises as
drafts; the admin reviews, edits, and accepts them. Accepted exercises are
never deleted — they accumulate as the catalog. Reps and sets are prescribed
per exercise within a plan, never on the exercise itself.
_Avoid_: Movement, drill

**Draft**:
A coach's proposed exercise, private to that coach and the admin. The coach
edits the draft freely (description, demo media, tag proposals) until the admin
accepts it into the catalog — acceptance freezes authorship: from then on only
the admin edits it, live for all plans using it. A rejected draft is removed.
_Avoid_: Proposal, request, submission

**Tag**:
A label from a fixed, admin-managed vocabulary (e.g. upper body, pull, forearm,
core) used to filter exercises when composing a plan. An exercise carries
several tags; the vocabulary is flat — no hierarchy. Vocabulary values are
language-neutral English keys; the Spanish-only UI displays Spanish labels for
them (the mapping lives in the presentation layer).
_Avoid_: Category, muscle group, body part

**Rep**:
A single execution of an exercise, prescribed as reps × sets on the exercise
within a plan.
_Avoid_: Repetition, series

**Set**:
A group of repetitions of an exercise, performed back to back. Prescribed per
exercise within a plan, so the same exercise can require different volumes in
different plans.
_Avoid_: Series

### Executing & Logging

**Log**:
The athlete's record that a planned session from their assigned plan was
completed. In the first version a log marks completion only, with no
exercise-level detail about what was actually performed; detail is a planned
later addition (see ADR 0002).
_Avoid_: Diary, journal, history, workout log

**Completion**:
The act of marking a planned session as done by creating its log. One log per
planned session; a session is either completed or not.
_Avoid_: Check-in, attendance

**History**:
An athlete's accumulated record of past (archived) plans and the completion logs
of each, visible to the current coach — so a new coach can see what the athlete
has done over time. Athletes also see their own history.
_Avoid_: Archive (that's the plan's state, not the record)

### Linking

**Invite Link**:
A single-use signup link generated by a coach. An athlete signing up through it
is automatically linked to that coach. The only way into the app for an athlete.
_Avoid_: Shared link, referral link

**Transfer**:
A coach handing an athlete to another coach. An athlete is linked to exactly one
coach at a time; transfer changes which one. The athlete keeps their current
plan and logs; the receiving coach may link a different plan in place of the
previous coach's (archiving it, per Assignment).
_Avoid_: Reassign, move

**RPE**:
Rate of Perceived Exertion. The athlete's subjective measure of how hard a set,
session, or climb felt, typically on a 0–10 scale.
_Avoid_: Effort, difficulty

### Climbing Metrics

These terms are part of the domain language but are out of scope for the first
version, where logs carry no detail for them to attach to.

**Grade**:
The difficulty of a climb, per a grading system (e.g. V-scale for bouldering,
French/YDS for routes).
_Avoid_: Level, difficulty (when referring to a climb's rating)

**Send**:
A completed ascent of a climb by the athlete, in a session or log.
_Avoid_: Ascent, completion

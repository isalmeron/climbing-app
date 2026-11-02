# A global, admin-curated exercise catalog

Exercises are the building blocks coaches compose into plans. We went through
three candidate shapes:

1. **Per-trainer private catalogs** — our first decision, before any code
   existed. Rejected when we saw the consequence: every coach duplicates the
   same entries (each with their own description and video), and cross-coach
   reuse is impossible.
2. **Global, coach-created** — anyone creates, creator edits. Rejected because
   exercises are edited _live_ into plans (ADR on live plan edits): one coach's
   edit would silently change another coach's athletes' plans.
3. **Global, admin-curated, coach-drafted** — **chosen.** Coaches author
   exercises as drafts; the admin reviews, edits, and accepts them into the
   catalog. Coaches compose plans from accepted exercises only.

The catalog is **never deleted** (append-and-edit by admin only): plans are
live-edited and archived rather than versioned, so deleting an exercise would
corrupt every plan containing it, including archived plans that make up an
athlete's history. An obsolete exercise is simply never added to new plans.

Admin edits _do_ apply live to all plans using the exercise — this coupling is
accepted because the admin is a trusted curator, unlike anonymous cross-coach
edits in shape 2. In practice the catalog is meant to be stable: descriptions
are "fixed".

Accepted exercises enter through a **draft workflow**: a coach drafts an
exercise (description, demo media, tag proposals), editable by its author until
accepted. Admin reviews the queue, edits anything, and accepts or rejects.
Acceptance freezes authorship — from that point the exercise behaves per the
rules above (admin-only edits, no deletion). Rejected drafts are removed
together with their uploads. This keeps the catalog growing from the people who
know the movements, with the admin as the single quality gate.

## Considered Options

- Per-trainer private catalogs (our initial choice): duplication, no reuse.
- Coach-created global with owner edits: silent cross-coach coupling.
- Soft-delete / hide flag: no coaching value in v1; obsolete exercises just stop
  being used.

## Consequences

- Exercises have a lifecycle: Draft (author-editable, private) → Accepted
  (admin-owned, global, immutable-per-ADR). No delete path for accepted
  exercises in the UI or API; storage of accepted exercises grows
  monotonically (accepted — exercises are tiny).
- Admin v1 tooling includes a review queue: list drafts, edit, accept/reject.
- Rejected drafts and their uploaded media are cleaned up.
- Cold start: the admin seeds the initial catalog manually; growth after that
  is coach-drafted.
- Cross-coach reuse is the default; per-trainer variants are expressed as
  separate catalog entries proposed as new drafts.

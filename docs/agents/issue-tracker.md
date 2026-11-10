# Issue tracker: Notion

Issues and specs for this repo live as rows in the **Issues** database inside the
climbing teamspace. Use the Notion MCP tools for every operation — there is no
`gh`-style CLI here.

## Target

- Database: **Issues** (canonical tasks database), parent = Teamspace Home:
  https://app.notion.com/p/c58aca7adc68832080f601dbac4c6278
- Data source id: `a9d97991-9883-42db-9149-4b23a1638b96`
- Database URL: https://app.notion.com/p/a1bdd9e9d16d4ba0a100d10c75e184d8
- Statuses: `Not started` → `In progress` → `Done`
- **Epic**: a **relation** to the **Epics** database (data source
  `40eaca7a-dc68-80ec-9aef-000b8b4dd219`), not a text property. Every new issue
  gets an Epic. Known epics (canonical page URLs — pass these in the `Epic`
  property as a URL array when creating issues):
  - **Admin** — admin-performed work: coach invites, exercise curation, user
    management. https://app.notion.com/40eaca7adc6880309030fc5b4f827810
  - **Coach** — coach-facing product work.
    https://app.notion.com/40eaca7adc688031a3a8d4e61f508cf8
  - **Deployment** — infra and go-live.
    https://app.notion.com/40eaca7adc688071a3efd741752ac374
    History note: the former text epic `Exercises` was converted into the
    **Admin** relation epic (its issues were migrated). Don't recreate it.
    Creating an issue with `"Epic": "Admin"` (a plain string) fails validation —
    always use the URL array form.

## Conventions

- **Create an issue**: `notion_create_pages` with this data source as parent;
  page title = issue title, page body = the spec/description in markdown.
- **Read an issue**: `notion_fetch` with the page URL or id.
- **List / query**: `notion_query_data_sources` (read-only SQLite SQL), e.g.
  open issues `WHERE status != 'Done'`, or issues matching a tag.
- **Comment**: `notion_create_comment` on the issue page.
- **Apply / change status**: `notion_update_page` (properties).
- **Close**: append a closing comment, then set status to `Done`. Do not trash
  issues — `Done` is the terminal state.
- **Blocking**: a `Blocked by: <issue url>` line at the top of the body. An
  issue is startable when every listed blocker is `Done`. The database has no
  native dependency property.

## When a skill says "publish to the issue tracker"

Create a row in the **Issues** database.

## When a skill says "fetch the relevant ticket"

`notion_fetch` the page the user names or links.

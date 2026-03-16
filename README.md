# Mentions Rollup

**See everything you've written about a topic — automatically.**

Drop `[[wiki links]]` in your daily notes as you write. Open any topic page and see every mention, with full context, rolled up chronologically. See open tasks from across your vault collected in one place. No filing. No tagging. No structure required.

## The problem

You keep a daily note. You mention `[[Home Assistant]]` when you change a config, `[[Tailscale]]` when you debug networking, `[[Project X]]` when you have an idea. Those mentions are scattered across hundreds of daily notes.

When you open your Home Assistant page, you want to see *what you actually wrote* — not a list of 35 links you'd have to click one by one.

Obsidian's backlinks pane shows you the pages, but the context is tiny and you can't embed it in your note. Dataview can list the links, but can't render the content properly.

## Usage

Add a single code block to any page:

````
```mentions
```
````

The plugin finds every page in your vault that links to the current page, extracts the relevant content, and renders it with full markdown formatting.

### Writing (daily notes)

Write naturally. The only rule: **mention the topic with a wiki link.**

For dedicated sections, put the link in a heading:

```markdown
# 2026-03-14

Had a mass of errands today.

## [[Home Assistant]]

Renewed the SSL cert. Had to regenerate the key.

Also updated the MQTT broker password.

## Other stuff

Called mom. [[Tailscale]] was acting weird after the HA update.
```

### Reading (topic pages)

Your topic page has whatever static reference info you want, plus the rollup:

```markdown
# Home Assistant

## Quick Reference
- **IP:** 192.168.1.50
- **Hardware:** Home Assistant Green

## History

```mentions
```
```

### Two-tier extraction

What the plugin captures depends on *where* your link appears:

| Where you put the link | What gets extracted |
|---|---|
| `## [[Topic]]` | Everything under that heading until the next heading of the same level |
| `A paragraph mentioning [[Topic]]` | Just that paragraph |
| `- A bullet mentioning [[Topic]]` | The enclosing bullet group |

**Heading mention** = dedicated section → captures all content until next same-level heading or EOF. Sub-headings within the section are preserved.

**Inline mention** = passing reference → captures just the enclosing paragraph or bullet list.

## Task Rollup

The plugin also aggregates **tasks** that mention a page. Add a `mention-tasks` code block to see open tasks from across your vault:

````
```mention-tasks
```
````

Each task shows a jump-to-source icon (↗) that navigates directly to the task line in its source file. Wiki links within task text remain clickable.

### Task options

````
```mention-tasks
show: open
sort: earliest
group: #discuss
from: "daily/"
limit: 20
```
````

| Option | Default | Description |
|--------|---------|-------------|
| `show` | `open` | `open`, `completed`, or `all` — which tasks to display |
| `sort` | `earliest` | `earliest` / `latest` (by due date, undated last) or `a-z` / `z-a` (by filename) |
| `from` | *(entire vault)* | Comma-separated folder paths to include (e.g., `daily/, projects/`) |
| `ignore` | none | Comma-separated folder paths to exclude (e.g., `templates/, archive/`) |
| `group` | none | A tag name (e.g., `#discuss`) — splits tasks into tagged/other groups |
| `limit` | none | Maximum number of tasks to show |

Tasks support two due date formats: `📅 YYYY-MM-DD` and `[due:: YYYY-MM-DD]`.

Custom checkbox statuses (e.g., `- [/]`, `- [-]`) are treated as open.

## Mentions Options

````
```mentions
sort: newest
limit: 50
from: "daily-notes/"
```
````

| Option | Default | Description |
|--------|---------|-------------|
| `sort` | `newest` | `newest` or `oldest` — sort order by source filename (reverse-alphabetical or alphabetical) |
| `limit` | none | Maximum number of source files to show |
| `from` | *(entire vault)* | Comma-separated folder paths to include (e.g., `daily/, projects/`) |
| `ignore` | none | Comma-separated folder paths to exclude (e.g., `templates/, archive/`) |

All options are optional.

## Settings

Open **Settings → Mentions Rollup** to configure vault-wide defaults for both mentions and task blocks. Any option set in the settings tab becomes the default for all code blocks of that type. Individual code blocks can still override any default.

### Clearing a default in a code block

If you've set a default `from` folder in settings but want a specific block to search the entire vault, use `from: all`. Similarly, `ignore: none` clears a default ignore list for that block.

If you have a folder literally named `all` or `none`, quote the value: `from: "all"`.

## Installation

### From community plugins

1. Open **Settings → Community plugins → Browse**
2. Search "Mentions Rollup"
3. Install and enable

### Manual

1. Download `main.js`, `manifest.json`, and `styles.css` from the latest [release](../../releases)
2. Create `.obsidian/plugins/mentions-rollup/` in your vault
3. Copy the files there
4. Enable in **Settings → Community plugins**

## FAQ

**Does it work with non-daily notes?**
Yes. It finds mentions from *any* page that links to the current one.

**What if I mention the same topic twice in one note?**
Both blocks are shown, in the order they appear.

**What about performance?**
The plugin uses Obsidian's metadata cache to find backlinked pages (O(1) lookup). It only loads files that actually link to you.

**Does it handle aliases?**
`[[Home Assistant|HA]]` and `[[Home Assistant]]` both work — matching is on the link target, not display text.

**Can I complete tasks from the rollup?**
Not currently. The rollup is read-only — click the ↗ icon to jump to the source and manage the task there.

**What if I have `[[Home]]` and `[[Home Assistant]]`?**
No false matches. The plugin uses Obsidian's resolved link index, not substring matching.

## Development

```bash
npm install
npm run dev      # watch mode
npm run build    # production build
npm test         # run tests
```

## License

MIT

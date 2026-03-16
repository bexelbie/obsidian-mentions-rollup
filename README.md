# Mentions Rollup

You keep a daily note. You mention `[[Home Assistant]]` when you change a config, `[[Tailscale]]` when you debug networking, `[[Jan Novak]]` when you agree on a decision. Six months later those mentions are scattered across hundreds of notes.

Obsidian's backlinks pane tells you *where* you mentioned something. This plugin shows you *what you wrote*.

Drop a code block on any topic page and every mention rolls up with full context - the actual paragraphs and sections, rendered in place. A second code block collects open tasks. No filing, no tagging, no structure beyond the wiki links you already write.

## What it looks like

Your daily note is normal writing:

```markdown
## [[Home Assistant]]

Renewed the SSL cert. Had to regenerate the key after the
HA update broke the old one.

## Other stuff

Called mom. [[Tailscale]] was acting weird after the update.
- [ ] Debug [[Tailscale]] subnet routing 📅 2026-03-20
```

Your topic page (`Home Assistant.md`) has whatever reference info you want, plus this:

````markdown
## History

```mentions
```

## Tasks

```mention-tasks
```
````

The plugin fills in the rest - every mention with its surrounding context, every open task with a link back to the source.

## How extraction works

The plugin finds every note that links to the current page, reads the content, and decides what to extract based on where the link appears.

**Link in a heading** - captures the full section under that heading, down to the next heading of the same or higher level. Sub-headings are preserved. This is the common case for daily notes where you give a topic its own section.

**Link in body text** - captures the enclosing context. If there is a heading above the mention, you get that entire section. If the mention is in preamble text before any heading, you get the paragraph or list block.

Deduplication is automatic. Multiple mentions in one section produce one extraction, not three copies of the same content.

## The `mentions` block

````markdown
```mentions
sort: newest
limit: 50
from: "daily/, projects/"
ignore: "templates/, archive/"
```
````

All options are optional. An empty block works.

| Option | Default | Values | Effect |
|---|---|---|---|
| `sort` | `newest` | `newest`, `oldest` | File ordering by name. `newest` reverses alphabetical order - works well for daily notes named `YYYY-MM-DD`. |
| `limit` | none | positive integer | Cap the number of source files shown. |
| `from` | entire vault | comma-separated folder paths | Only include backlinks from these folders. |
| `ignore` | none | comma-separated folder paths | Exclude backlinks from these folders. |

## The `mention-tasks` block

Collects markdown tasks whose text contains a wiki link to the current page. Each task shows a jump-to-source icon that opens the file and scrolls to the line.

````markdown
```mention-tasks
show: open
sort: earliest
group: #discuss
limit: 20
from: "daily/"
ignore: "archive/"
```
````

| Option | Default | Values | Effect |
|---|---|---|---|
| `show` | `open` | `open`, `completed`, `all` | Filter by completion status. |
| `sort` | `earliest` | `earliest`, `latest`, `a-z`, `z-a` | `earliest`/`latest` sort by due date (undated tasks last). `a-z`/`z-a` sort by source filename. |
| `group` | none | a tag like `#discuss` | Splits tasks into two groups - tagged first, then everything else. |
| `limit` | none | positive integer | Cap the number of tasks shown. |
| `from` | entire vault | comma-separated folder paths | Only include tasks from these folders. |
| `ignore` | none | comma-separated folder paths | Exclude tasks from these folders. |

**Due dates.** Two formats are recognized for sorting: `📅 YYYY-MM-DD` (emoji) and `[due:: YYYY-MM-DD]` (Dataview inline field).

**Checkboxes.** `- [x]` and `- [X]` count as completed. Everything else (`- [ ]`, `- [/]`, `- [-]`) counts as open.

## Settings

**Settings → Mentions Rollup** lets you set vault-wide defaults for both block types. Anything you set there applies to every block unless overridden inline.

To clear a default inside a specific block, use the sentinel values:

- `from: all` - ignore the default and search the entire vault
- `ignore: none` - ignore the default and skip nothing

If you have a folder literally named `all` or `none`, quote it: `from: "all"`.

## Installation

This plugin is not in the community catalog yet.

1. Download `main.js`, `manifest.json`, and `styles.css` from the latest [release](../../releases).
2. Create `.obsidian/plugins/mentions-rollup/` in your vault.
3. Copy the three files into that folder.
4. Enable the plugin under **Settings → Community plugins**.

## FAQ

**Does it work with non-daily notes?**
Yes. Any note that links to the current page is a valid source.

**What about aliases?**
`[[Home Assistant|HA]]` and `[[folder/Home Assistant]]` both match a page named `Home Assistant.md`. Frontmatter aliases work too.

**Will `[[Home]]` match `[[Home Assistant]]`?**
No. Matching uses the full wiki link target, not substrings.

**Can I complete tasks from the rollup?**
No. The rollup is read-only. Use the jump-to-source icon to edit in the original note.

## Development

```bash
npm install
npm run dev      # watch mode
npm run build    # production build
npm test         # run tests
```

### Test vault

The repository includes a `test-vault/` directory with sample daily notes, topic pages, and tasks. The vault's plugin directory contains symlinks back to the repo root's `main.js`, `manifest.json`, and `styles.css`, so you need a build before it works:

```bash
npm install && npm run build
```

Then open `test-vault/` as a vault in Obsidian. Alternatively, install the plugin into the test vault from a release and skip the build step.

## License

MIT

// ABOUTME: Code block processor for the ```mention-tasks``` block.
// ABOUTME: Discovers backlinks, extracts tasks, filters/sorts/groups, and renders a task list.

import { App, Component, MarkdownPostProcessorContext, MarkdownRenderer, TFile, setIcon } from "obsidian";
import { findBacklinks } from "./processor";
import { extractTasks } from "./task-extractor";
import { parseTaskOptions } from "./task-config";
import { TaskItem, TaskOptions } from "./types";

/**
 * Process a ```mention-tasks``` code block: find backlinks, extract tasks, render.
 */
export async function processTasksBlock(
	source: string,
	el: HTMLElement,
	ctx: MarkdownPostProcessorContext,
	app: App,
	component: Component,
	settingsDefaults?: Partial<TaskOptions>,
): Promise<void> {
	const options = parseTaskOptions(source, settingsDefaults);
	const currentPath = ctx.sourcePath;
	const currentName = currentPath.replace(/\.md$/, "").split("/").pop() ?? "";

	if (!currentName) {
		el.createEl("p", { text: "Could not determine page name.", cls: "mention-tasks-error" });
		return;
	}

	const backlinkPaths = findBacklinks(app, currentPath);

	let filteredPaths = backlinkPaths;
	if (options.from) {
		const folders = options.from;
		filteredPaths = filteredPaths.filter((p) => folders.some((dir) => p.startsWith(dir)));
	}
	if (options.ignore) {
		const ignored = options.ignore;
		filteredPaths = filteredPaths.filter((p) => !ignored.some((dir) => p.startsWith(dir)));
	}

	// Extract tasks from all backlinked files
	const allTasks: TaskItem[] = [];
	for (const path of filteredPaths) {
		const file = app.vault.getAbstractFileByPath(path);
		if (!(file instanceof TFile)) continue;

		const content = await app.vault.cachedRead(file);
		const rawTasks = extractTasks(content, currentName);

		for (const raw of rawTasks) {
			allTasks.push({
				...raw,
				sourcePath: path,
				sourceName: file.basename,
			});
		}
	}

	// Filter by completion status
	const filtered = filterTasks(allTasks, options);

	// Sort
	const sorted = sortTasks(filtered, options);

	// Apply limit
	const limited = options.limit ? sorted.slice(0, options.limit) : sorted;

	if (limited.length === 0) {
		const emptyText = options.show === "completed" ? "No completed tasks." : "No open tasks.";
		el.createEl("p", { text: emptyText, cls: "mention-tasks-empty" });
		return;
	}

	// Group and render
	const container = el.createDiv({ cls: "mention-tasks-rollup" });

	if (options.group) {
		await renderGrouped(container, limited, options.group, app, component);
	} else {
		await renderTaskList(container, limited, app, component);
	}
}

/**
 * Filter tasks by completion status.
 */
function filterTasks(tasks: TaskItem[], options: TaskOptions): TaskItem[] {
	if (options.show === "all") return tasks;
	if (options.show === "completed") return tasks.filter((t) => t.completed);
	return tasks.filter((t) => !t.completed);
}

/**
 * Sort tasks according to the sort option.
 */
function sortTasks(tasks: TaskItem[], options: TaskOptions): TaskItem[] {
	const sorted = [...tasks];

	switch (options.sort) {
		case "earliest":
			sorted.sort((a, b) => {
				if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
				if (a.dueDate && !b.dueDate) return -1;
				if (!a.dueDate && b.dueDate) return 1;
				return b.sourceName.localeCompare(a.sourceName);
			});
			break;
		case "latest":
			sorted.sort((a, b) => {
				if (a.dueDate && b.dueDate) return b.dueDate.localeCompare(a.dueDate);
				if (a.dueDate && !b.dueDate) return -1;
				if (!a.dueDate && b.dueDate) return 1;
				return a.sourceName.localeCompare(b.sourceName);
			});
			break;
		case "a-z":
			sorted.sort((a, b) => a.sourceName.localeCompare(b.sourceName));
			break;
		case "z-a":
			sorted.sort((a, b) => b.sourceName.localeCompare(a.sourceName));
			break;
	}

	return sorted;
}

/**
 * Render tasks split into two groups by tag presence.
 */
async function renderGrouped(
	container: HTMLElement,
	tasks: TaskItem[],
	groupTag: string,
	app: App,
	component: Component,
): Promise<void> {
	const tagged = tasks.filter((t) => t.tags.includes(groupTag));
	const other = tasks.filter((t) => !t.tags.includes(groupTag));

	// Derive heading from tag name: "#discuss" → "Discuss"
	const tagLabel = groupTag.replace(/^#/, "");
	const heading = tagLabel.charAt(0).toUpperCase() + tagLabel.slice(1);

	if (tagged.length > 0) {
		const group = container.createDiv({ cls: "mention-tasks-group" });
		group.createEl("h3", { text: heading, cls: "mention-tasks-group-heading" });
		await renderTaskList(group, tagged, app, component);
	}

	if (other.length > 0) {
		const group = container.createDiv({ cls: "mention-tasks-group" });
		if (tagged.length > 0) {
			group.createEl("h3", { text: "Other", cls: "mention-tasks-group-heading" });
		}
		await renderTaskList(group, other, app, component);
	}
}

/**
 * Open a source file and scroll to a specific line.
 */
function openSourceAtLine(app: App, sourcePath: string, line: number): void {
	const file = app.vault.getAbstractFileByPath(sourcePath);
	if (file instanceof TFile) {
		app.workspace.getLeaf().openFile(file, { eState: { line } });
	}
}

/**
 * Strip the markdown task checkbox prefix (e.g., "- [ ] " or "  - [x] ") from a task line,
 * returning just the task body text.
 */
function stripTaskPrefix(text: string): string {
	return text.replace(/^\s*- \[.\]\s*/, "");
}

/**
 * Render a flat list of task items with jump-to-source icons.
 */
async function renderTaskList(
	container: HTMLElement,
	tasks: TaskItem[],
	app: App,
	component: Component,
): Promise<void> {
	for (const task of tasks) {
		const itemCls = task.completed ? "mention-tasks-item mention-tasks-completed" : "mention-tasks-item";
		const item = container.createDiv({ cls: itemCls });

		const sourceLink = item.createEl("span", {
			cls: "mention-tasks-source-link",
			attr: {
				"aria-label": `Open in ${task.sourceName}`,
				role: "button",
				tabindex: "0",
			},
		});
		setIcon(sourceLink, "arrow-up-right");
		sourceLink.addEventListener("click", () => {
			openSourceAtLine(app, task.sourcePath, task.sourceLine);
		});
		sourceLink.addEventListener("keydown", (e: KeyboardEvent) => {
			if (e.key === "Enter" || e.key === " ") {
				e.preventDefault();
				openSourceAtLine(app, task.sourcePath, task.sourceLine);
			}
		});

		const content = item.createDiv({ cls: "mention-tasks-content" });
		await MarkdownRenderer.render(app, stripTaskPrefix(task.text), content, task.sourcePath, component);
	}
}

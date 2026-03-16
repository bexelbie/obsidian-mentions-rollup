// ABOUTME: Shared TypeScript interfaces for the mentions rollup plugin.
// ABOUTME: Defines data structures for mention blocks, task items, and code block options.

/**
 * A block of content extracted from a source file that mentions the target page.
 */
export interface MentionBlock {
	/** Whether the mention was in a heading (full section) or inline (paragraph only). */
	type: "heading" | "inline";
	/** The extracted markdown content. */
	content: string;
}

/**
 * All mention blocks extracted from a single source file.
 */
export interface FileMentions {
	/** The vault-relative path of the source file. */
	sourcePath: string;
	/** The basename of the source file (for display and sorting). */
	sourceName: string;
	/** The extracted mention blocks from this file. */
	blocks: MentionBlock[];
}

/**
 * Options parsed from the mentions code block.
 */
export interface MentionsOptions {
	/** Sort order by source filename. */
	sort: "newest" | "oldest";
	/** Maximum number of source files to display. */
	limit: number | null;
	/** Folder paths to include. Use "all" to override a default. */
	from: string[] | null;
	/** Folder paths to exclude from results. Use "none" to override a default. */
	ignore: string[] | null;
}

/**
 * A single task extracted from a source file that mentions the target page.
 */
export interface TaskItem {
	/** The full markdown task line (e.g., "- [ ] Do the thing [[Person]]"). */
	text: string;
	/** Whether the task is completed ([x] or [X]). */
	completed: boolean;
	/** Parsed due date in YYYY-MM-DD format, or null if none found. */
	dueDate: string | null;
	/** All tags found in the task text (e.g., ["#discuss", "#urgent"]). */
	tags: string[];
	/** Zero-indexed line number in the original source file. */
	sourceLine: number;
	/** The vault-relative path of the source file. */
	sourcePath: string;
	/** The basename of the source file (for display). */
	sourceName: string;
}

/**
 * Options parsed from the mention-tasks code block.
 */
export interface TaskOptions {
	/** Filter by completion status. */
	show: "open" | "completed" | "all";
	/** Sort order for tasks. */
	sort: "earliest" | "latest" | "a-z" | "z-a";
	/** Folder paths to include. Use "all" to override a default. */
	from: string[] | null;
	/** Folder paths to exclude from results. Use "none" to override a default. */
	ignore: string[] | null;
	/** Tag to split tasks into two groups (e.g., "#discuss"). */
	group: string | null;
	/** Maximum number of tasks to display. */
	limit: number | null;
}

/**
 * Plugin-wide settings with defaults for both block types.
 */
export interface PluginSettings {
	mentions: MentionsOptions;
	tasks: TaskOptions;
}

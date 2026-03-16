// ABOUTME: Extracts task lines from file content that mention a target page.
// ABOUTME: Parses completion status, due dates (emoji and dataview), and tags.

import { buildLinkPattern, stripFrontmatter } from "./extractor";

/**
 * A raw task extracted from file content (before source file metadata is attached).
 */
export interface RawTask {
	/** The full markdown task line. */
	text: string;
	/** Whether the task is completed ([x] or [X]). */
	completed: boolean;
	/** Parsed due date in YYYY-MM-DD format, or null. */
	dueDate: string | null;
	/** All tags found in the task text. */
	tags: string[];
	/** Zero-indexed line number in the original file (including frontmatter). */
	sourceLine: number;
}

/** Matches a markdown task checkbox: - [ ], - [x], - [/], etc. Allows leading whitespace. */
const TASK_PATTERN = /^\s*- \[(.)\]\s/;

/** Matches emoji due date: 📅 YYYY-MM-DD */
const EMOJI_DUE_PATTERN = /📅\s*(\d{4}-\d{2}-\d{2})/;

/** Matches dataview inline due date: [due:: YYYY-MM-DD] */
const DATAVIEW_DUE_PATTERN = /\[due::\s*(\d{4}-\d{2}-\d{2})\]/;

/** Matches tags outside of wikilinks. Extracts #tagname tokens. */
function extractTags(line: string): string[] {
	// Remove wikilinks first so we don't match [[Page#section]] as a tag
	const withoutLinks = line.replace(/\[\[[^\]]*\]\]/g, "");
	const matches = withoutLinks.match(/(?:^|\s)#([a-zA-Z][\w/-]*)/g);
	if (!matches) return [];
	return matches.map((m) => m.trim());
}

/**
 * Parse a due date from a task line. Checks emoji format first, then dataview.
 */
function parseDueDate(line: string): string | null {
	const emojiMatch = EMOJI_DUE_PATTERN.exec(line);
	if (emojiMatch) return emojiMatch[1]!;

	const dvMatch = DATAVIEW_DUE_PATTERN.exec(line);
	if (dvMatch) return dvMatch[1]!;

	return null;
}

/**
 * Count the number of lines consumed by YAML frontmatter (including delimiters
 * and the trailing newline). This is the line offset to add to stripped-content
 * line indices to get original file line numbers.
 */
function frontmatterLineCount(text: string): number {
	if (!text.startsWith("---")) return 0;
	const endIdx = text.indexOf("\n---", 3);
	if (endIdx === -1) return 0;
	// stripFrontmatter slices at endIdx + 4, which keeps the \n after closing ---.
	// That \n becomes a phantom empty first line in the stripped content.
	// Subtract 1 to account for it.
	return text.slice(0, endIdx + 4).split("\n").length - 1;
}

/**
 * Extract task lines from file content that mention the given page name.
 *
 * Returns raw tasks without source file metadata (caller adds sourcePath/sourceName).
 */
export function extractTasks(text: string, pageName: string | string[]): RawTask[] {
	if (!text.trim()) return [];

	const fmOffset = frontmatterLineCount(text);
	const content = stripFrontmatter(text);
	const linkPattern = buildLinkPattern(pageName);
	const lines = content.split("\n");
	const tasks: RawTask[] = [];

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i]!;
		const taskMatch = TASK_PATTERN.exec(line);
		if (!taskMatch) continue;

		if (!linkPattern.test(line)) continue;

		const checkboxChar = taskMatch[1]!;
		const completed = checkboxChar === "x" || checkboxChar === "X";

		tasks.push({
			text: line,
			completed,
			dueDate: parseDueDate(line),
			tags: extractTags(line),
			sourceLine: i + fmOffset,
		});
	}

	return tasks;
}

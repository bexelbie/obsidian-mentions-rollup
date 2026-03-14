// ABOUTME: Shared TypeScript interfaces for the mentions rollup plugin.
// ABOUTME: Defines the data structures for extracted mention blocks and code block options.

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
	/** Restrict to files within this folder path. */
	from: string | null;
}

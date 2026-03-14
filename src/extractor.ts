// ABOUTME: Extracts mention blocks from file content using two-tier logic.
// ABOUTME: Heading mentions get full sections; inline mentions get enclosing paragraphs.

import { MentionBlock } from "./types";

/**
 * Build a regex that matches a wiki link to the target page.
 * Handles: [[Page]], [[Page|alias]], [[Page#section]], [[Page#section|alias]]
 * Does NOT match [[PageExtra]] (requires end of link target before |, #, or ]]).
 */
function buildLinkPattern(pageName: string): RegExp {
	const escaped = pageName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	return new RegExp(`\\[\\[${escaped}([|#\\]][^\\]]*)?\\]\\]`, "i");
}

/**
 * Return the heading level (number of # characters) for a line, or 0 if not a heading.
 */
function headingLevel(line: string): number {
	const match = /^(#{1,6})\s/.exec(line);
	return match ? match[1]!.length : 0;
}

/**
 * Strip YAML frontmatter from file content.
 * Returns the content after the closing --- delimiter.
 */
function stripFrontmatter(text: string): string {
	if (!text.startsWith("---")) return text;
	const endIdx = text.indexOf("\n---", 3);
	if (endIdx === -1) return text;
	return text.slice(endIdx + 4);
}

/**
 * Split text into "blocks" — groups of lines separated by blank lines.
 * Each block tracks its start and end line indices.
 */
interface TextBlock {
	lines: string[];
	startLine: number;
	endLine: number;
}

function splitIntoBlocks(lines: string[]): TextBlock[] {
	const blocks: TextBlock[] = [];
	let currentLines: string[] = [];
	let startLine = 0;

	for (let i = 0; i < lines.length; i++) {
		if (lines[i]!.trim() === "") {
			if (currentLines.length > 0) {
				blocks.push({ lines: currentLines, startLine, endLine: i - 1 });
				currentLines = [];
			}
			startLine = i + 1;
		} else {
			currentLines.push(lines[i]!);
		}
	}
	if (currentLines.length > 0) {
		blocks.push({ lines: currentLines, startLine, endLine: lines.length - 1 });
	}

	return blocks;
}

/**
 * Extract mention blocks from file content for a given page name.
 *
 * Two-tier extraction:
 * 1. Heading mention: if [[pageName]] is in a heading, capture everything
 *    from that heading to the next heading of same/higher level (or EOF).
 * 2. Inline mention: if [[pageName]] is in body text, capture the enclosing
 *    paragraph (text between blank lines).
 *
 * Heading mentions suppress inline extraction for lines within their range.
 */
export function extractMentions(text: string, pageName: string): MentionBlock[] {
	if (!text.trim()) return [];

	const content = stripFrontmatter(text);
	const linkPattern = buildLinkPattern(pageName);
	const lines = content.split("\n");

	// Pass 1: find heading sections that mention the target
	const headingSections: { startLine: number; endLine: number; content: string }[] = [];

	for (let i = 0; i < lines.length; i++) {
		const level = headingLevel(lines[i]!);
		if (level === 0) continue;
		if (!linkPattern.test(lines[i]!)) continue;

		// Found a heading with our link — capture until next heading of same/higher level
		const sectionLines = [lines[i]!];
		let j = i + 1;
		while (j < lines.length) {
			const nextLevel = headingLevel(lines[j]!);
			if (nextLevel > 0 && nextLevel <= level) break;
			sectionLines.push(lines[j]!);
			j++;
		}

		// Trim trailing blank lines
		while (sectionLines.length > 1 && sectionLines[sectionLines.length - 1]!.trim() === "") {
			sectionLines.pop();
		}

		headingSections.push({
			startLine: i,
			endLine: j - 1,
			content: sectionLines.join("\n"),
		});
	}

	// Pass 2: find inline (paragraph) mentions not covered by heading sections
	const blocks = splitIntoBlocks(lines);
	const inlineMentions: MentionBlock[] = [];

	for (const block of blocks) {
		const blockText = block.lines.join("\n");
		if (!linkPattern.test(blockText)) continue;

		// Skip if this block's first line is a heading we already captured
		if (headingLevel(block.lines[0]!) > 0 && linkPattern.test(block.lines[0]!)) continue;

		// Skip if this block falls within any heading section
		const coveredByHeading = headingSections.some(
			(hs) => block.startLine >= hs.startLine && block.endLine <= hs.endLine
		);
		if (coveredByHeading) continue;

		inlineMentions.push({ type: "inline", content: blockText });
	}

	// Combine: heading sections first (in document order), then inline mentions
	const result: MentionBlock[] = [
		...headingSections.map((hs) => ({ type: "heading" as const, content: hs.content })),
		...inlineMentions,
	];

	return result;
}

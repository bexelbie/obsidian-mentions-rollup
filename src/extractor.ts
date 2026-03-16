// ABOUTME: Extracts mention blocks from file content using two-tier logic.
// ABOUTME: Heading mentions get full sections; inline mentions expand to enclosing section (or paragraph if no heading above).

import { MentionBlock } from "./types";

/**
 * Build a regex that matches a wiki link to the target page.
 * Handles: [[Page]], [[Page|alias]], [[Page#section]], [[Page#section|alias]]
 * Also matches folder-qualified links: [[folder/Page]], [[a/b/Page|alias]]
 * Accepts a single name or array of names (for frontmatter alias support).
 * Does NOT match [[PageExtra]] (requires end of link target before |, #, or ]]).
 */
export function buildLinkPattern(pageName: string | string[]): RegExp {
	const names = Array.isArray(pageName) ? pageName : [pageName];
	const escaped = names.map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
	const nameAlt = escaped.length === 1 ? escaped[0]! : `(?:${escaped.join("|")})`;
	return new RegExp(`\\[\\[(?:[^\\[\\]]*\\/)?${nameAlt}([|#\\]][^\\]]*)?\\]\\]`, "i");
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
export function stripFrontmatter(text: string): string {
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
 * Find the enclosing heading section for a given line index.
 * Walks backward to find the nearest heading, then forward to find the end of that section.
 * Returns null if no heading exists above the line (preamble text).
 */
function findEnclosingSection(lines: string[], lineIndex: number): { startLine: number; endLine: number; level: number } | null {
	// Walk backward to find nearest heading
	let headingLine = -1;
	let headingLvl = 0;
	for (let i = lineIndex; i >= 0; i--) {
		const lvl = headingLevel(lines[i]!);
		if (lvl > 0) {
			headingLine = i;
			headingLvl = lvl;
			break;
		}
	}
	if (headingLine === -1) return null;

	// Walk forward from heading to find end of section
	let endLine = lines.length - 1;
	for (let j = headingLine + 1; j < lines.length; j++) {
		const nextLevel = headingLevel(lines[j]!);
		if (nextLevel > 0 && nextLevel <= headingLvl) {
			endLine = j - 1;
			break;
		}
	}

	return { startLine: headingLine, endLine, level: headingLvl };
}

/**
 * Extract mention blocks from file content for a given page name.
 *
 * Two-tier extraction:
 * 1. Heading mention: if [[pageName]] is in a heading, capture everything
 *    from that heading to the next heading of same/higher level (or EOF).
 * 2. Inline mention: if [[pageName]] is in body text and there's a heading
 *    above, capture the full enclosing section. If no heading above (preamble),
 *    capture just the enclosing paragraph.
 *
 * Heading mentions suppress inline extraction for lines within their range.
 * Section-level inline captures are deduplicated.
 */
export function extractMentions(text: string, pageName: string | string[]): MentionBlock[] {
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

	// Pass 2: find inline mentions not covered by heading sections.
	// If under a heading, expand to the full enclosing section. Otherwise, capture paragraph.
	const blocks = splitIntoBlocks(lines);
	const inlineMentions: MentionBlock[] = [];
	const capturedSectionStarts = new Set<number>();

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

		// Try to expand to enclosing section
		const enclosing = findEnclosingSection(lines, block.startLine);
		if (enclosing) {
			// Dedup: only capture each section once
			if (capturedSectionStarts.has(enclosing.startLine)) continue;
			capturedSectionStarts.add(enclosing.startLine);

			const sectionLines = lines.slice(enclosing.startLine, enclosing.endLine + 1);
			// Trim trailing blank lines
			while (sectionLines.length > 1 && sectionLines[sectionLines.length - 1]!.trim() === "") {
				sectionLines.pop();
			}
			inlineMentions.push({ type: "heading", content: sectionLines.join("\n") });
		} else {
			// No heading above — fall back to paragraph
			inlineMentions.push({ type: "inline", content: blockText });
		}
	}

	// Combine: heading sections first (in document order), then inline mentions
	const result: MentionBlock[] = [
		...headingSections.map((hs) => ({ type: "heading" as const, content: hs.content })),
		...inlineMentions,
	];

	return result;
}

/**
 * Strip fenced code blocks from markdown content to prevent nested rollup processing.
 * Replaces ```...``` blocks with a placeholder note.
 */
export function stripCodeFences(content: string): string {
	return content.replace(/^```[^\n]*\n[\s\S]*?^```$/gm, "*\\[code block omitted\\]*");
}

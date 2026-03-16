// ABOUTME: Code block processor for the ```mentions``` block.
// ABOUTME: Discovers backlinks, extracts content, and renders mentions on topic pages.

import { App, Component, MarkdownPostProcessorContext, MarkdownRenderer, setIcon, TFile } from "obsidian";
import { extractMentions } from "./extractor";
import { parseOptions } from "./config";
import { FileMentions } from "./types";

/**
 * Process a ```mentions``` code block: find backlinks, extract content, render.
 */
export async function processMentionsBlock(
	source: string,
	el: HTMLElement,
	ctx: MarkdownPostProcessorContext,
	app: App,
	component: Component,
): Promise<void> {
	const options = parseOptions(source);
	const currentPath = ctx.sourcePath;
	const currentName = currentPath.replace(/\.md$/, "").split("/").pop() ?? "";

	if (!currentName) {
		el.createEl("p", { text: "Could not determine page name.", cls: "mentions-rollup-error" });
		return;
	}

	const backlinkPaths = findBacklinks(app, currentPath);

	let filteredPaths = backlinkPaths;
	if (options.from) {
		filteredPaths = backlinkPaths.filter((p) => p.startsWith(options.from!));
	}

	const allMentions: FileMentions[] = [];
	for (const path of filteredPaths) {
		const file = app.vault.getAbstractFileByPath(path);
		if (!(file instanceof TFile)) continue;

		const content = await app.vault.cachedRead(file);
		const blocks = extractMentions(content, currentName);
		if (blocks.length === 0) continue;

		allMentions.push({
			sourcePath: path,
			sourceName: file.basename,
			blocks,
		});
	}

	allMentions.sort((a, b) => {
		const cmp = a.sourceName.localeCompare(b.sourceName);
		return options.sort === "newest" ? -cmp : cmp;
	});

	const limited = options.limit ? allMentions.slice(0, options.limit) : allMentions;

	if (limited.length === 0) {
		el.createEl("p", { text: "No mentions found.", cls: "mentions-rollup-empty" });
		return;
	}

	const container = el.createDiv({ cls: "mentions-rollup" });

	for (const fileMention of limited) {
		const fileSection = container.createDiv({ cls: "mentions-rollup-file" });

		// Render source file name as a clickable link with file icon
		const header = fileSection.createDiv({ cls: "mentions-rollup-file-header" });
		const icon = header.createSpan({ cls: "mentions-rollup-file-icon" });
		setIcon(icon, "file-text");
		await MarkdownRenderer.render(
			app,
			`[[${fileMention.sourceName}]]`,
			header,
			ctx.sourcePath,
			component,
		);

		for (const block of fileMention.blocks) {
			const blockEl = fileSection.createDiv({
				cls: `mentions-rollup-block mentions-rollup-${block.type}`,
			});
			// Render with source file's path so its wiki links resolve correctly
			await MarkdownRenderer.render(
				app,
				block.content,
				blockEl,
				fileMention.sourcePath,
				component,
			);
		}
	}
}

/**
 * Find all vault files that link to the given target path.
 * Uses Obsidian's resolved link index for O(1)-ish lookup.
 */
export function findBacklinks(app: App, targetPath: string): string[] {
	const resolvedLinks = app.metadataCache.resolvedLinks;
	const backlinks: string[] = [];

	for (const sourcePath of Object.keys(resolvedLinks)) {
		const links = resolvedLinks[sourcePath];
		if (links && links[targetPath]) {
			backlinks.push(sourcePath);
		}
	}

	return backlinks;
}

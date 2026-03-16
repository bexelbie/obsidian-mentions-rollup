// ABOUTME: Code block processor for the ```mentions``` block.
// ABOUTME: Discovers backlinks, extracts content, and renders mentions on topic pages.

import { App, Component, MarkdownPostProcessorContext, MarkdownRenderer, setIcon, TFile } from "obsidian";
import { extractMentions, stripCodeFences } from "./extractor";
import { parseOptions } from "./config";
import { FileMentions, MentionsOptions } from "./types";
import { buildLinkNames } from "./link-utils";

/**
 * Process a ```mentions``` code block: find backlinks, extract content, render.
 */
export async function processMentionsBlock(
	source: string,
	el: HTMLElement,
	ctx: MarkdownPostProcessorContext,
	app: App,
	component: Component,
	settingsDefaults?: Partial<MentionsOptions>,
): Promise<void> {
	const options = parseOptions(source, settingsDefaults);
	const currentPath = ctx.sourcePath;
	const currentName = currentPath.replace(/\.md$/, "").split("/").pop() ?? "";

	if (!currentName) {
		el.createEl("p", { text: "Could not determine page name.", cls: "mentions-rollup-error" });
		return;
	}

	const linkNames = buildLinkNames(app, currentPath, currentName);

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

	const allMentions: FileMentions[] = [];
	for (const path of filteredPaths) {
		const file = app.vault.getAbstractFileByPath(path);
		if (!(file instanceof TFile)) continue;

		let content: string;
		try {
			content = await app.vault.cachedRead(file);
		} catch {
			continue;
		}
		const blocks = extractMentions(content, linkNames);
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
		const pathWithoutExt = fileMention.sourcePath.replace(/\.md$/, "");
		await MarkdownRenderer.render(
			app,
			`[[${pathWithoutExt}|${fileMention.sourceName}]]`,
			header,
			ctx.sourcePath,
			component,
		);

		for (const block of fileMention.blocks) {
			const blockEl = fileSection.createDiv({
				cls: `mentions-rollup-block mentions-rollup-${block.type}`,
			});
			// Strip code fences to prevent nested rollup recursion
			const safeContent = stripCodeFences(block.content);
			await MarkdownRenderer.render(
				app,
				safeContent,
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

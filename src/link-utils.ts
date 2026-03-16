// ABOUTME: Shared utilities for link name resolution using the Obsidian API.
// ABOUTME: Builds link name arrays from basename, path, and frontmatter aliases.

import { App, TFile } from "obsidian";

/**
 * Build an array of names that a page may be linked by.
 * Includes: the basename, the path without extension, and any frontmatter aliases.
 * Deduplicates and returns in a stable order.
 */
export function buildLinkNames(app: App, currentPath: string, currentName: string): string[] {
	const names = new Set<string>();
	names.add(currentName);

	const pathWithoutExt = currentPath.replace(/\.md$/, "");
	if (pathWithoutExt !== currentName) {
		names.add(pathWithoutExt);
	}

	const file = app.vault.getAbstractFileByPath(currentPath);
	if (file instanceof TFile) {
		const cache = app.metadataCache.getFileCache(file);
		const aliases: unknown = cache?.frontmatter?.aliases;
		if (Array.isArray(aliases)) {
			for (const alias of aliases) {
				if (typeof alias === "string" && alias.trim()) {
					names.add(alias.trim());
				}
			}
		} else if (typeof aliases === "string" && aliases.trim()) {
			names.add(aliases.trim());
		}
	}

	return [...names];
}

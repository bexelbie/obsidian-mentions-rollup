// ABOUTME: Parses options from a mention-tasks code block.
// ABOUTME: Supports show, sort, from, group, and limit options.

import { TaskOptions } from "./types";

const DEFAULTS: TaskOptions = {
	show: "open",
	sort: "due",
	from: null,
	group: null,
	limit: null,
};

/**
 * Parse the text content of a ```mention-tasks``` code block into options.
 */
export function parseTaskOptions(source: string): TaskOptions {
	const opts: TaskOptions = { ...DEFAULTS };

	for (const line of source.split("\n")) {
		const trimmed = line.trim();
		if (!trimmed) continue;

		const colonIdx = trimmed.indexOf(":");
		if (colonIdx === -1) continue;

		const key = trimmed.slice(0, colonIdx).trim().toLowerCase();
		const rawValue = trimmed.slice(colonIdx + 1).trim();

		switch (key) {
			case "show": {
				const val = rawValue.toLowerCase();
				if (val === "open" || val === "completed" || val === "all") {
					opts.show = val;
				}
				break;
			}
			case "sort": {
				const val = rawValue.toLowerCase();
				if (val === "due" || val === "source" || val === "newest" || val === "oldest") {
					opts.sort = val;
				}
				break;
			}
			case "from": {
				const stripped = rawValue.replace(/^["']|["']$/g, "");
				if (stripped) {
					opts.from = stripped;
				}
				break;
			}
			case "group": {
				if (!rawValue) break;
				opts.group = rawValue.startsWith("#") ? rawValue : `#${rawValue}`;
				break;
			}
			case "limit": {
				const num = parseInt(rawValue, 10);
				if (!isNaN(num) && num > 0) {
					opts.limit = num;
				}
				break;
			}
		}
	}

	return opts;
}

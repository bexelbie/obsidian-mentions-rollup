// ABOUTME: Parses options from a mention-tasks code block.
// ABOUTME: Supports show, sort, from, group, and limit options.

import { TaskOptions } from "./types";

const DEFAULTS: TaskOptions = {
	show: "open",
	sort: "earliest",
	from: null,
	ignore: null,
	group: null,
	limit: null,
};

/**
 * Parse the text content of a ```mention-tasks``` code block into options.
 * If settings defaults are provided, they are used as the base and
 * code block values override them.
 */
export function parseTaskOptions(source: string, defaults?: Partial<TaskOptions>): TaskOptions {
	const opts: TaskOptions = { ...DEFAULTS, ...defaults };

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
				if (val === "earliest" || val === "latest" || val === "a-z" || val === "z-a") {
					opts.sort = val;
				}
				break;
			}
			case "from": {
				const stripped = rawValue.replace(/^["']|["']$/g, "");
				if (stripped.toLowerCase() === "all" && !/^["']/.test(rawValue)) {
					opts.from = null;
				} else if (stripped) {
					opts.from = stripped.split(",").map((s) => s.trim()).filter(Boolean);
				}
				break;
			}
			case "ignore": {
				const stripped = rawValue.replace(/^["']|["']$/g, "");
				if (stripped.toLowerCase() === "none" && !/^["']/.test(rawValue)) {
					opts.ignore = null;
				} else if (stripped) {
					opts.ignore = stripped.split(",").map((s) => s.trim()).filter(Boolean);
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

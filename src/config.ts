// ABOUTME: Parses options from a mentions code block.
// ABOUTME: Supports sort (newest/oldest), limit (number), and from (folder path).

import { MentionsOptions } from "./types";

const DEFAULTS: MentionsOptions = {
	sort: "newest",
	limit: null,
	from: null,
	ignore: null,
};

/**
 * Parse the text content of a ```mentions``` code block into options.
 * If settings defaults are provided, they are used as the base and
 * code block values override them.
 */
export function parseOptions(source: string, defaults?: Partial<MentionsOptions>): MentionsOptions {
	const opts: MentionsOptions = { ...DEFAULTS, ...defaults };

	for (const line of source.split("\n")) {
		const trimmed = line.trim();
		if (!trimmed) continue;

		const colonIdx = trimmed.indexOf(":");
		if (colonIdx === -1) continue;

		const key = trimmed.slice(0, colonIdx).trim().toLowerCase();
		const rawValue = trimmed.slice(colonIdx + 1).trim();

		switch (key) {
			case "sort": {
				const val = rawValue.toLowerCase();
				if (val === "oldest" || val === "newest") {
					opts.sort = val;
				}
				break;
			}
			case "limit": {
				const num = parseInt(rawValue, 10);
				if (!isNaN(num) && num > 0) {
					opts.limit = num;
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
		}
	}

	return opts;
}

// ABOUTME: Tests for the code block options parser.
// ABOUTME: Validates parsing of sort, limit, and from options from mentions code blocks.

import { describe, it, expect } from "vitest";
import { parseOptions } from "./config";

describe("parseOptions", () => {
	it("returns defaults for empty input", () => {
		const opts = parseOptions("");
		expect(opts.sort).toBe("newest");
		expect(opts.limit).toBeNull();
		expect(opts.from).toBeNull();
	});

	it("returns defaults for whitespace-only input", () => {
		const opts = parseOptions("   \n  \n  ");
		expect(opts.sort).toBe("newest");
		expect(opts.limit).toBeNull();
		expect(opts.from).toBeNull();
	});

	it("parses sort: oldest", () => {
		const opts = parseOptions("sort: oldest");
		expect(opts.sort).toBe("oldest");
	});

	it("parses sort: newest explicitly", () => {
		const opts = parseOptions("sort: newest");
		expect(opts.sort).toBe("newest");
	});

	it("parses limit as a number", () => {
		const opts = parseOptions("limit: 50");
		expect(opts.limit).toBe(50);
	});

	it("ignores limit of 0", () => {
		const opts = parseOptions("limit: 0");
		expect(opts.limit).toBeNull();
	});

	it("ignores negative limit", () => {
		const opts = parseOptions("limit: -5");
		expect(opts.limit).toBeNull();
	});

	it("ignores non-numeric limit", () => {
		const opts = parseOptions("limit: abc");
		expect(opts.limit).toBeNull();
	});

	it("parses from as a folder path", () => {
		const opts = parseOptions('from: "daily-notes/"');
		expect(opts.from).toBe("daily-notes/");
	});

	it("parses from without quotes", () => {
		const opts = parseOptions("from: daily-notes/");
		expect(opts.from).toBe("daily-notes/");
	});

	it("strips surrounding quotes from from", () => {
		const opts = parseOptions("from: 'daily-notes/'");
		expect(opts.from).toBe("daily-notes/");
	});

	it("parses all options together", () => {
		const opts = parseOptions("sort: oldest\nlimit: 20\nfrom: \"journal/\"");
		expect(opts.sort).toBe("oldest");
		expect(opts.limit).toBe(20);
		expect(opts.from).toBe("journal/");
	});

	it("ignores unknown keys", () => {
		const opts = parseOptions("sort: newest\nfoo: bar\nlimit: 10");
		expect(opts.sort).toBe("newest");
		expect(opts.limit).toBe(10);
		expect(opts.from).toBeNull();
	});

	it("handles extra whitespace around values", () => {
		const opts = parseOptions("sort:   oldest  \n  limit:  30  ");
		expect(opts.sort).toBe("oldest");
		expect(opts.limit).toBe(30);
	});

	it("is case-insensitive for sort value", () => {
		const opts = parseOptions("sort: Oldest");
		expect(opts.sort).toBe("oldest");
	});

	it("defaults invalid sort value to newest", () => {
		const opts = parseOptions("sort: alphabetical");
		expect(opts.sort).toBe("newest");
	});
});

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
		expect(opts.from).toEqual(["daily-notes/"]);
	});

	it("parses from without quotes", () => {
		const opts = parseOptions("from: daily-notes/");
		expect(opts.from).toEqual(["daily-notes/"]);
	});

	it("strips surrounding quotes from from", () => {
		const opts = parseOptions("from: 'daily-notes/'");
		expect(opts.from).toEqual(["daily-notes/"]);
	});

	it("parses multiple comma-separated from folders", () => {
		const opts = parseOptions("from: daily/, projects/");
		expect(opts.from).toEqual(["daily/", "projects/"]);
	});

	it("parses all options together", () => {
		const opts = parseOptions("sort: oldest\nlimit: 20\nfrom: \"journal/\"");
		expect(opts.sort).toBe("oldest");
		expect(opts.limit).toBe(20);
		expect(opts.from).toEqual(["journal/"]);
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

	// --- ignore option ---

	it("defaults ignore to null", () => {
		const opts = parseOptions("");
		expect(opts.ignore).toBeNull();
	});

	it("parses single ignore folder", () => {
		const opts = parseOptions("ignore: templates/");
		expect(opts.ignore).toEqual(["templates/"]);
	});

	it("parses multiple comma-separated ignore folders", () => {
		const opts = parseOptions("ignore: templates/, archive/, menu/");
		expect(opts.ignore).toEqual(["templates/", "archive/", "menu/"]);
	});

	it("trims whitespace in comma-separated ignore folders", () => {
		const opts = parseOptions("ignore:  templates/ ,  archive/  ");
		expect(opts.ignore).toEqual(["templates/", "archive/"]);
	});

	it("filters empty entries from ignore list", () => {
		const opts = parseOptions("ignore: templates/,,archive/");
		expect(opts.ignore).toEqual(["templates/", "archive/"]);
	});

	it("parses quoted ignore value as literal folder", () => {
		const opts = parseOptions('ignore: "none"');
		expect(opts.ignore).toEqual(["none"]);
	});

	// --- keyword handling ---

	it("treats bare 'all' in from as null (clear default)", () => {
		const opts = parseOptions("from: all");
		expect(opts.from).toBeNull();
	});

	it("treats bare 'ALL' in from as null (case-insensitive)", () => {
		const opts = parseOptions("from: ALL");
		expect(opts.from).toBeNull();
	});

	it("treats quoted 'all' in from as literal folder name", () => {
		const opts = parseOptions('from: "all"');
		expect(opts.from).toEqual(["all"]);
	});

	it("treats bare 'none' in ignore as null (clear default)", () => {
		const opts = parseOptions("ignore: none");
		expect(opts.ignore).toBeNull();
	});

	it("treats bare 'NONE' in ignore as null (case-insensitive)", () => {
		const opts = parseOptions("ignore: NONE");
		expect(opts.ignore).toBeNull();
	});

	it("treats quoted 'none' in ignore as literal folder name", () => {
		const opts = parseOptions('ignore: "none"');
		expect(opts.ignore).toEqual(["none"]);
	});

	// --- settings defaults ---

	it("uses settings defaults as base", () => {
		const opts = parseOptions("", { from: ["daily/"], ignore: ["templates/"] });
		expect(opts.from).toEqual(["daily/"]);
		expect(opts.ignore).toEqual(["templates/"]);
		expect(opts.sort).toBe("newest");
	});

	it("code block values override settings defaults", () => {
		const opts = parseOptions("from: journal/", { from: ["daily/"] });
		expect(opts.from).toEqual(["journal/"]);
	});

	it("from: all clears a settings default", () => {
		const opts = parseOptions("from: all", { from: ["daily/"] });
		expect(opts.from).toBeNull();
	});

	it("ignore: none clears a settings default", () => {
		const opts = parseOptions("ignore: none", { ignore: ["templates/"] });
		expect(opts.ignore).toBeNull();
	});
});

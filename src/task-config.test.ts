// ABOUTME: Tests for the mention-tasks code block options parser.
// ABOUTME: Validates parsing of show, sort, from, group, and limit options.

import { describe, it, expect } from "vitest";
import { parseTaskOptions } from "./task-config";

describe("parseTaskOptions", () => {
	it("returns defaults for empty input", () => {
		const opts = parseTaskOptions("");
		expect(opts.show).toBe("open");
		expect(opts.sort).toBe("due");
		expect(opts.from).toBeNull();
		expect(opts.group).toBeNull();
		expect(opts.limit).toBeNull();
	});

	it("returns defaults for whitespace-only input", () => {
		const opts = parseTaskOptions("   \n  \n  ");
		expect(opts.show).toBe("open");
		expect(opts.sort).toBe("due");
		expect(opts.from).toBeNull();
		expect(opts.group).toBeNull();
		expect(opts.limit).toBeNull();
	});

	describe("show option", () => {
		it("parses show: open", () => {
			expect(parseTaskOptions("show: open").show).toBe("open");
		});

		it("parses show: completed", () => {
			expect(parseTaskOptions("show: completed").show).toBe("completed");
		});

		it("parses show: all", () => {
			expect(parseTaskOptions("show: all").show).toBe("all");
		});

		it("is case-insensitive", () => {
			expect(parseTaskOptions("show: Completed").show).toBe("completed");
		});

		it("defaults invalid show value to open", () => {
			expect(parseTaskOptions("show: done").show).toBe("open");
		});
	});

	describe("sort option", () => {
		it("parses sort: due", () => {
			expect(parseTaskOptions("sort: due").sort).toBe("due");
		});

		it("parses sort: source", () => {
			expect(parseTaskOptions("sort: source").sort).toBe("source");
		});

		it("parses sort: newest", () => {
			expect(parseTaskOptions("sort: newest").sort).toBe("newest");
		});

		it("parses sort: oldest", () => {
			expect(parseTaskOptions("sort: oldest").sort).toBe("oldest");
		});

		it("is case-insensitive", () => {
			expect(parseTaskOptions("sort: Due").sort).toBe("due");
		});

		it("defaults invalid sort value to due", () => {
			expect(parseTaskOptions("sort: alphabetical").sort).toBe("due");
		});
	});

	describe("from option", () => {
		it("parses from with double quotes", () => {
			expect(parseTaskOptions('from: "daily-notes/"').from).toBe("daily-notes/");
		});

		it("parses from with single quotes", () => {
			expect(parseTaskOptions("from: 'daily-notes/'").from).toBe("daily-notes/");
		});

		it("parses from without quotes", () => {
			expect(parseTaskOptions("from: daily-notes/").from).toBe("daily-notes/");
		});

		it("ignores empty from value", () => {
			expect(parseTaskOptions("from: ").from).toBeNull();
		});
	});

	describe("group option", () => {
		it("parses group with hash tag", () => {
			expect(parseTaskOptions("group: #discuss").group).toBe("#discuss");
		});

		it("parses group without hash prefix", () => {
			expect(parseTaskOptions("group: discuss").group).toBe("#discuss");
		});

		it("ignores empty group value", () => {
			expect(parseTaskOptions("group: ").group).toBeNull();
		});

		it("is case-sensitive for tag names", () => {
			expect(parseTaskOptions("group: #Discuss").group).toBe("#Discuss");
		});
	});

	describe("limit option", () => {
		it("parses positive limit", () => {
			expect(parseTaskOptions("limit: 20").limit).toBe(20);
		});

		it("ignores limit of 0", () => {
			expect(parseTaskOptions("limit: 0").limit).toBeNull();
		});

		it("ignores negative limit", () => {
			expect(parseTaskOptions("limit: -5").limit).toBeNull();
		});

		it("ignores non-numeric limit", () => {
			expect(parseTaskOptions("limit: abc").limit).toBeNull();
		});
	});

	it("parses all options together", () => {
		const opts = parseTaskOptions(
			'show: completed\nsort: newest\nfrom: "journal/"\ngroup: #discuss\nlimit: 10'
		);
		expect(opts.show).toBe("completed");
		expect(opts.sort).toBe("newest");
		expect(opts.from).toBe("journal/");
		expect(opts.group).toBe("#discuss");
		expect(opts.limit).toBe(10);
	});

	it("ignores unknown keys", () => {
		const opts = parseTaskOptions("show: all\nfoo: bar\nlimit: 5");
		expect(opts.show).toBe("all");
		expect(opts.limit).toBe(5);
	});

	it("handles extra whitespace around values", () => {
		const opts = parseTaskOptions("show:   completed  \n  limit:  30  ");
		expect(opts.show).toBe("completed");
		expect(opts.limit).toBe(30);
	});
});

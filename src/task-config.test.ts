// ABOUTME: Tests for the mention-tasks code block options parser.
// ABOUTME: Validates parsing of show, sort, from, group, and limit options.

import { describe, it, expect } from "vitest";
import { parseTaskOptions } from "./task-config";

describe("parseTaskOptions", () => {
	it("returns defaults for empty input", () => {
		const opts = parseTaskOptions("");
		expect(opts.show).toBe("open");
		expect(opts.sort).toBe("earliest");
		expect(opts.from).toBeNull();
		expect(opts.group).toBeNull();
		expect(opts.limit).toBeNull();
	});

	it("returns defaults for whitespace-only input", () => {
		const opts = parseTaskOptions("   \n  \n  ");
		expect(opts.show).toBe("open");
		expect(opts.sort).toBe("earliest");
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
		it("parses sort: earliest", () => {
			expect(parseTaskOptions("sort: earliest").sort).toBe("earliest");
		});

		it("parses sort: latest", () => {
			expect(parseTaskOptions("sort: latest").sort).toBe("latest");
		});

		it("parses sort: a-z", () => {
			expect(parseTaskOptions("sort: a-z").sort).toBe("a-z");
		});

		it("parses sort: z-a", () => {
			expect(parseTaskOptions("sort: z-a").sort).toBe("z-a");
		});

		it("is case-insensitive", () => {
			expect(parseTaskOptions("sort: Earliest").sort).toBe("earliest");
		});

		it("defaults invalid sort value to earliest", () => {
			expect(parseTaskOptions("sort: alphabetical").sort).toBe("earliest");
		});
	});

	describe("from option", () => {
		it("parses from with double quotes", () => {
			expect(parseTaskOptions('from: "daily-notes/"').from).toEqual(["daily-notes/"]);
		});

		it("parses from with single quotes", () => {
			expect(parseTaskOptions("from: 'daily-notes/'").from).toEqual(["daily-notes/"]);
		});

		it("parses from without quotes", () => {
			expect(parseTaskOptions("from: daily-notes/").from).toEqual(["daily-notes/"]);
		});

		it("parses multiple comma-separated from folders", () => {
			expect(parseTaskOptions("from: daily/, projects/").from).toEqual(["daily/", "projects/"]);
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
			'show: completed\nsort: latest\nfrom: "journal/"\ngroup: #discuss\nlimit: 10'
		);
		expect(opts.show).toBe("completed");
		expect(opts.sort).toBe("latest");
		expect(opts.from).toEqual(["journal/"]);
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

	// --- ignore option ---

	it("defaults ignore to null", () => {
		const opts = parseTaskOptions("");
		expect(opts.ignore).toBeNull();
	});

	it("parses single ignore folder", () => {
		const opts = parseTaskOptions("ignore: templates/");
		expect(opts.ignore).toEqual(["templates/"]);
	});

	it("parses multiple comma-separated ignore folders", () => {
		const opts = parseTaskOptions("ignore: templates/, archive/");
		expect(opts.ignore).toEqual(["templates/", "archive/"]);
	});

	it("treats bare 'none' in ignore as null", () => {
		const opts = parseTaskOptions("ignore: none");
		expect(opts.ignore).toBeNull();
	});

	it("treats quoted 'none' in ignore as literal folder", () => {
		const opts = parseTaskOptions('ignore: "none"');
		expect(opts.ignore).toEqual(["none"]);
	});

	it("treats bare 'all' in from as null", () => {
		const opts = parseTaskOptions("from: all");
		expect(opts.from).toBeNull();
	});

	it("treats quoted 'all' in from as literal folder", () => {
		const opts = parseTaskOptions('from: "all"');
		expect(opts.from).toEqual(["all"]);
	});

	// --- settings defaults ---

	it("uses settings defaults as base", () => {
		const opts = parseTaskOptions("", { from: ["daily/"], ignore: ["templates/"], show: "completed" });
		expect(opts.from).toEqual(["daily/"]);
		expect(opts.ignore).toEqual(["templates/"]);
		expect(opts.show).toBe("completed");
	});

	it("code block values override settings defaults", () => {
		const opts = parseTaskOptions("show: all\nfrom: journal/", { show: "open", from: ["daily/"] });
		expect(opts.show).toBe("all");
		expect(opts.from).toEqual(["journal/"]);
	});

	it("from: all clears a settings default", () => {
		const opts = parseTaskOptions("from: all", { from: ["daily/"] });
		expect(opts.from).toBeNull();
	});

	it("ignore: none clears a settings default", () => {
		const opts = parseTaskOptions("ignore: none", { ignore: ["templates/"] });
		expect(opts.ignore).toBeNull();
	});
});

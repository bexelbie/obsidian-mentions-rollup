// ABOUTME: Tests for the task extraction logic.
// ABOUTME: Validates task line recognition, due date parsing, tag extraction, and link matching.

import { describe, it, expect } from "vitest";
import { extractTasks } from "./task-extractor";

describe("extractTasks", () => {
	describe("basic task recognition", () => {
		it("extracts an open task mentioning the page", () => {
			const text = "- [ ] Send contract to [[Jim Perrin]]";
			const tasks = extractTasks(text, "Jim Perrin");
			expect(tasks).toHaveLength(1);
			expect(tasks[0]!.completed).toBe(false);
			expect(tasks[0]!.text).toBe("- [ ] Send contract to [[Jim Perrin]]");
			expect(tasks[0]!.sourceLine).toBe(0);
		});

		it("extracts a completed task", () => {
			const text = "- [x] Sent contract to [[Jim Perrin]]";
			const tasks = extractTasks(text, "Jim Perrin");
			expect(tasks).toHaveLength(1);
			expect(tasks[0]!.completed).toBe(true);
		});

		it("recognizes uppercase X as completed", () => {
			const text = "- [X] Done with [[Jim Perrin]]";
			const tasks = extractTasks(text, "Jim Perrin");
			expect(tasks).toHaveLength(1);
			expect(tasks[0]!.completed).toBe(true);
		});

		it("treats custom checkbox statuses as open", () => {
			const text = "- [/] In progress with [[Jim Perrin]]";
			const tasks = extractTasks(text, "Jim Perrin");
			expect(tasks).toHaveLength(1);
			expect(tasks[0]!.completed).toBe(false);
		});

		it("treats cancelled checkbox as open", () => {
			const text = "- [-] Cancelled task with [[Jim Perrin]]";
			const tasks = extractTasks(text, "Jim Perrin");
			expect(tasks).toHaveLength(1);
			expect(tasks[0]!.completed).toBe(false);
		});

		it("ignores non-task lines mentioning the page", () => {
			const text = "Met with [[Jim Perrin]] today.";
			const tasks = extractTasks(text, "Jim Perrin");
			expect(tasks).toHaveLength(0);
		});

		it("ignores tasks not mentioning the page", () => {
			const text = "- [ ] Send contract to [[Bob Smith]]";
			const tasks = extractTasks(text, "Jim Perrin");
			expect(tasks).toHaveLength(0);
		});

		it("returns empty array for empty text", () => {
			expect(extractTasks("", "Jim Perrin")).toHaveLength(0);
		});

		it("extracts indented tasks", () => {
			const text = "  - [ ] Sub-task about [[Jim Perrin]]";
			const tasks = extractTasks(text, "Jim Perrin");
			expect(tasks).toHaveLength(1);
		});
	});

	describe("multiple tasks", () => {
		it("extracts multiple tasks from one file", () => {
			const text = [
				"## Meeting notes",
				"",
				"- [ ] Review proposal with [[Jim Perrin]]",
				"- [x] Sent agenda to [[Jim Perrin]]",
				"- [ ] Follow up on budget",
				"- [ ] Schedule call with [[Jim Perrin]]",
			].join("\n");

			const tasks = extractTasks(text, "Jim Perrin");
			expect(tasks).toHaveLength(3);
			expect(tasks[0]!.text).toContain("Review proposal");
			expect(tasks[1]!.text).toContain("Sent agenda");
			expect(tasks[2]!.text).toContain("Schedule call");
		});
	});

	describe("due date parsing", () => {
		it("parses emoji due date format", () => {
			const text = "- [ ] Send report [[Jim Perrin]] 📅 2024-03-15";
			const tasks = extractTasks(text, "Jim Perrin");
			expect(tasks).toHaveLength(1);
			expect(tasks[0]!.dueDate).toBe("2024-03-15");
		});

		it("parses dataview due date format", () => {
			const text = "- [ ] Send report [[Jim Perrin]] [due:: 2024-03-15]";
			const tasks = extractTasks(text, "Jim Perrin");
			expect(tasks).toHaveLength(1);
			expect(tasks[0]!.dueDate).toBe("2024-03-15");
		});

		it("returns null dueDate when no date present", () => {
			const text = "- [ ] Send report to [[Jim Perrin]]";
			const tasks = extractTasks(text, "Jim Perrin");
			expect(tasks[0]!.dueDate).toBeNull();
		});

		it("uses emoji format when both formats present", () => {
			const text = "- [ ] Task [[Jim Perrin]] 📅 2024-01-01 [due:: 2024-02-02]";
			const tasks = extractTasks(text, "Jim Perrin");
			expect(tasks[0]!.dueDate).toBe("2024-01-01");
		});
	});

	describe("tag extraction", () => {
		it("extracts a single tag", () => {
			const text = "- [ ] Discuss roadmap with [[Jim Perrin]] #discuss";
			const tasks = extractTasks(text, "Jim Perrin");
			expect(tasks[0]!.tags).toEqual(["#discuss"]);
		});

		it("extracts multiple tags", () => {
			const text = "- [ ] Review with [[Jim Perrin]] #discuss #urgent";
			const tasks = extractTasks(text, "Jim Perrin");
			expect(tasks[0]!.tags).toEqual(["#discuss", "#urgent"]);
		});

		it("returns empty tags array when no tags present", () => {
			const text = "- [ ] Send report to [[Jim Perrin]]";
			const tasks = extractTasks(text, "Jim Perrin");
			expect(tasks[0]!.tags).toEqual([]);
		});

		it("does not extract tags from within wikilinks", () => {
			const text = "- [ ] Check [[Jim Perrin#section]] status";
			const tasks = extractTasks(text, "Jim Perrin");
			expect(tasks[0]!.tags).toEqual([]);
		});
	});

	describe("link format handling", () => {
		it("matches aliased links", () => {
			const text = "- [ ] Talk to [[Jim Perrin|Jim]]";
			const tasks = extractTasks(text, "Jim Perrin");
			expect(tasks).toHaveLength(1);
		});

		it("matches section links", () => {
			const text = "- [ ] See [[Jim Perrin#projects]] for details";
			const tasks = extractTasks(text, "Jim Perrin");
			expect(tasks).toHaveLength(1);
		});

		it("matches case-insensitively", () => {
			const text = "- [ ] Meet [[jim perrin]] today";
			const tasks = extractTasks(text, "Jim Perrin");
			expect(tasks).toHaveLength(1);
		});

		it("does not match partial page names", () => {
			const text = "- [ ] Talk to [[Jim Perrington]]";
			const tasks = extractTasks(text, "Jim Perrin");
			expect(tasks).toHaveLength(0);
		});
	});

	describe("line number tracking", () => {
		it("tracks correct line number without frontmatter", () => {
			const text = [
				"## Meeting notes",
				"",
				"- [ ] Task for [[Jim Perrin]]",
			].join("\n");
			const tasks = extractTasks(text, "Jim Perrin");
			expect(tasks[0]!.sourceLine).toBe(2);
		});

		it("tracks correct line number with frontmatter", () => {
			const text = [
				"---",
				"title: Meeting",
				"date: 2024-01-15",
				"---",
				"",
				"- [ ] Task for [[Jim Perrin]]",
			].join("\n");
			const tasks = extractTasks(text, "Jim Perrin");
			expect(tasks[0]!.sourceLine).toBe(5);
		});

		it("tracks multiple task line numbers", () => {
			const text = [
				"## Tasks",
				"",
				"- [ ] First for [[Jim Perrin]]",
				"- [ ] Not relevant",
				"- [ ] Second for [[Jim Perrin]]",
			].join("\n");
			const tasks = extractTasks(text, "Jim Perrin");
			expect(tasks).toHaveLength(2);
			expect(tasks[0]!.sourceLine).toBe(2);
			expect(tasks[1]!.sourceLine).toBe(4);
		});
	});

	describe("frontmatter handling", () => {
		it("skips YAML frontmatter", () => {
			const text = [
				"---",
				"title: Meeting",
				"---",
				"",
				"- [ ] Task for [[Jim Perrin]]",
			].join("\n");

			const tasks = extractTasks(text, "Jim Perrin");
			expect(tasks).toHaveLength(1);
		});
	});

	describe("folder-qualified and multi-name links", () => {
		it("matches folder-qualified link in task", () => {
			const text = "- [ ] Review [[profiles/Jim Perrin]] feedback";
			const tasks = extractTasks(text, "Jim Perrin");
			expect(tasks).toHaveLength(1);
		});

		it("matches any of multiple link names", () => {
			const text = "- [ ] Update [[HA]] config";
			const tasks = extractTasks(text, ["Home Assistant", "HA"]);
			expect(tasks).toHaveLength(1);
		});

		it("matches folder-qualified link with array of names", () => {
			const text = "- [ ] Check [[devices/HA]] status";
			const tasks = extractTasks(text, ["Home Assistant", "HA"]);
			expect(tasks).toHaveLength(1);
		});
	});
});

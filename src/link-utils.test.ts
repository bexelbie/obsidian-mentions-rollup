// ABOUTME: Tests for link utility functions.
// ABOUTME: Validates code fence stripping and link name building.

import { describe, it, expect } from "vitest";
import { stripCodeFences } from "./extractor";

describe("stripCodeFences", () => {
	it("strips a simple code fence", () => {
		const input = [
			"Before text.",
			"```mentions",
			"from: journal",
			"```",
			"After text.",
		].join("\n");
		const result = stripCodeFences(input);
		expect(result).toContain("Before text.");
		expect(result).toContain("After text.");
		expect(result).not.toContain("```mentions");
		expect(result).toContain("*\\[code block omitted\\]*");
	});

	it("strips multiple code fences", () => {
		const input = [
			"```mention-tasks",
			"show: open",
			"```",
			"",
			"Some text.",
			"",
			"```mentions",
			"from: journal",
			"```",
		].join("\n");
		const result = stripCodeFences(input);
		expect(result).not.toContain("```mention-tasks");
		expect(result).not.toContain("```mentions");
		expect(result).toContain("Some text.");
	});

	it("preserves content without code fences", () => {
		const input = "Just some **markdown** text with [[links]].";
		expect(stripCodeFences(input)).toBe(input);
	});

	it("preserves inline backticks", () => {
		const input = "Use `console.log()` for debugging.";
		expect(stripCodeFences(input)).toBe(input);
	});
});

// ABOUTME: Tests for the two-tier content extraction logic.
// ABOUTME: Validates heading-section and inline-paragraph extraction from file content.

import { describe, it, expect } from "vitest";
import { buildLinkPattern, extractMentions } from "./extractor";

describe("extractMentions", () => {
	describe("heading mentions (tier 1)", () => {
		it("extracts full section under a heading containing the link", () => {
			const text = [
				"## [[Home Assistant]]",
				"",
				"Renewed the SSL cert.",
				"",
				"Also updated MQTT password.",
				"",
				"## Other stuff",
				"",
				"Unrelated content.",
			].join("\n");

			const blocks = extractMentions(text, "Home Assistant");
			expect(blocks).toHaveLength(1);
			expect(blocks[0]!.type).toBe("heading");
			expect(blocks[0]!.content).toContain("Renewed the SSL cert.");
			expect(blocks[0]!.content).toContain("Also updated MQTT password.");
			expect(blocks[0]!.content).not.toContain("Unrelated content.");
		});

		it("extracts section until next heading of same level", () => {
			const text = [
				"## [[Alpha]]",
				"",
				"Alpha content paragraph 1.",
				"",
				"Alpha content paragraph 2.",
				"",
				"## Beta",
				"",
				"Beta content.",
			].join("\n");

			const blocks = extractMentions(text, "Alpha");
			expect(blocks).toHaveLength(1);
			expect(blocks[0]!.content).toContain("paragraph 1");
			expect(blocks[0]!.content).toContain("paragraph 2");
			expect(blocks[0]!.content).not.toContain("Beta content");
		});

		it("extracts section until higher-level heading", () => {
			const text = [
				"### [[Alpha]]",
				"",
				"Alpha content.",
				"",
				"## Higher level",
				"",
				"Not alpha.",
			].join("\n");

			const blocks = extractMentions(text, "Alpha");
			expect(blocks).toHaveLength(1);
			expect(blocks[0]!.content).toContain("Alpha content.");
			expect(blocks[0]!.content).not.toContain("Not alpha.");
		});

		it("preserves sub-headings within the section", () => {
			const text = [
				"## [[Home Assistant]]",
				"",
				"Main content.",
				"",
				"### Zigbee",
				"",
				"Zigbee details.",
				"",
				"### MQTT",
				"",
				"MQTT details.",
				"",
				"## Next topic",
			].join("\n");

			const blocks = extractMentions(text, "Home Assistant");
			expect(blocks).toHaveLength(1);
			expect(blocks[0]!.content).toContain("### Zigbee");
			expect(blocks[0]!.content).toContain("Zigbee details.");
			expect(blocks[0]!.content).toContain("### MQTT");
			expect(blocks[0]!.content).toContain("MQTT details.");
		});

		it("extracts section to EOF when no following heading", () => {
			const text = [
				"## [[Alpha]]",
				"",
				"Some content.",
				"",
				"More content at the end.",
			].join("\n");

			const blocks = extractMentions(text, "Alpha");
			expect(blocks).toHaveLength(1);
			expect(blocks[0]!.content).toContain("More content at the end.");
		});

		it("extracts H1 heading mentions (daily note format)", () => {
			const text = [
				"Briefing at HQ. First day back.",
				"",
				"# [[Operation Tanglewood]]",
				"",
				"Satellite imagery shows construction accelerated.",
				"",
				"Moving deployment up by two weeks.",
				"",
				"# [[Zara Okafor]]",
				"",
				"Received new cover identity.",
			].join("\n");

			const blocks = extractMentions(text, "Operation Tanglewood");
			expect(blocks).toHaveLength(1);
			expect(blocks[0]!.type).toBe("heading");
			expect(blocks[0]!.content).toContain("Satellite imagery");
			expect(blocks[0]!.content).toContain("Moving deployment");
			expect(blocks[0]!.content).not.toContain("cover identity");
		});

		it("handles heading with description after the link", () => {
			const text = [
				"## [[Home Assistant]] - SSL renewal",
				"",
				"Renewed the cert.",
				"",
				"## Other",
			].join("\n");

			const blocks = extractMentions(text, "Home Assistant");
			expect(blocks).toHaveLength(1);
			expect(blocks[0]!.content).toContain("Renewed the cert.");
		});

		it("includes the heading line itself in the content", () => {
			const text = [
				"## [[Home Assistant]] - SSL renewal",
				"",
				"Details here.",
				"",
				"## Other",
			].join("\n");

			const blocks = extractMentions(text, "Home Assistant");
			expect(blocks[0]!.content).toContain("## [[Home Assistant]] - SSL renewal");
		});
	});

	describe("inline mentions (tier 2)", () => {
		it("expands to enclosing section when inline mention is under a heading", () => {
			const text = [
				"# [[Fen Haruki]]",
				"",
				"Singapore update: NovaChem audit came back. 15kg of Strontium-90 is",
				"unaccounted for in their inventory from the past quarter.",
				"",
				"[[Operation Tanglewood]] just got a lot more urgent.",
				"",
				"# [[Zara Okafor]]",
				"",
				"Cover identity stuff.",
			].join("\n");

			const blocks = extractMentions(text, "Operation Tanglewood");
			expect(blocks).toHaveLength(1);
			expect(blocks[0]!.type).toBe("heading");
			expect(blocks[0]!.content).toContain("# [[Fen Haruki]]");
			expect(blocks[0]!.content).toContain("NovaChem audit");
			expect(blocks[0]!.content).toContain("just got a lot more urgent");
			expect(blocks[0]!.content).not.toContain("Cover identity");
		});

		it("falls back to paragraph when no heading above", () => {
			const text = [
				"Noticed [[Tailscale]] was down on my phone.",
				"",
				"# Some heading",
				"",
				"Other content.",
			].join("\n");

			const blocks = extractMentions(text, "Tailscale");
			expect(blocks).toHaveLength(1);
			expect(blocks[0]!.type).toBe("inline");
			expect(blocks[0]!.content).toContain("Noticed [[Tailscale]] was down");
			expect(blocks[0]!.content).not.toContain("Other content");
		});

		it("falls back to paragraph when mention is in preamble text before any heading", () => {
			const text = [
				"Briefing at HQ. First day back.",
				"",
				"[[Operation Tanglewood]] is on my mind.",
				"",
				"# [[Fen Haruki]]",
				"",
				"Section content.",
			].join("\n");

			const blocks = extractMentions(text, "Operation Tanglewood");
			expect(blocks).toHaveLength(1);
			expect(blocks[0]!.type).toBe("inline");
			expect(blocks[0]!.content).toBe("[[Operation Tanglewood]] is on my mind.");
		});

		it("deduplicates when multiple inline mentions are in same section", () => {
			const text = [
				"# Field Report",
				"",
				"Spoke with [[Alpha]] in the morning.",
				"",
				"Later, [[Alpha]] confirmed the intel.",
				"",
				"# Other",
			].join("\n");

			const blocks = extractMentions(text, "Alpha");
			expect(blocks).toHaveLength(1);
			expect(blocks[0]!.content).toContain("Spoke with [[Alpha]]");
			expect(blocks[0]!.content).toContain("confirmed the intel");
		});

		it("extracts a multi-line paragraph (no heading above)", () => {
			const text = [
				"The [[Home Assistant]] update broke things.",
				"Had to roll back to the previous version.",
				"Took about an hour to fix.",
			].join("\n");

			const blocks = extractMentions(text, "Home Assistant");
			expect(blocks).toHaveLength(1);
			expect(blocks[0]!.content).toContain("update broke things");
			expect(blocks[0]!.content).toContain("Had to roll back");
			expect(blocks[0]!.content).toContain("Took about an hour");
		});

		it("extracts a bullet list under its enclosing heading section", () => {
			const text = [
				"## Tasks",
				"",
				"- Updated [[Home Assistant]]",
				"- Restarted Zigbee coordinator",
				"- Checked logs",
				"",
				"## Notes",
			].join("\n");

			const blocks = extractMentions(text, "Home Assistant");
			expect(blocks).toHaveLength(1);
			expect(blocks[0]!.type).toBe("heading");
			expect(blocks[0]!.content).toContain("## Tasks");
			expect(blocks[0]!.content).toContain("Updated [[Home Assistant]]");
			expect(blocks[0]!.content).toContain("Restarted Zigbee");
			expect(blocks[0]!.content).toContain("Checked logs");
		});
	});

	describe("precedence and deduplication", () => {
		it("does not double-extract inline mentions inside a heading section", () => {
			const text = [
				"## [[Home Assistant]]",
				"",
				"Renewed the cert on [[Home Assistant]].",
				"",
				"## Other",
			].join("\n");

			const blocks = extractMentions(text, "Home Assistant");
			expect(blocks).toHaveLength(1);
			expect(blocks[0]!.type).toBe("heading");
		});

		it("extracts both heading and separate section with inline mention", () => {
			const text = [
				"## [[Home Assistant]]",
				"",
				"HA section content.",
				"",
				"## Other stuff",
				"",
				"Also [[Home Assistant]] was mentioned here.",
			].join("\n");

			const blocks = extractMentions(text, "Home Assistant");
			expect(blocks).toHaveLength(2);
			expect(blocks[0]!.type).toBe("heading");
			expect(blocks[0]!.content).toContain("HA section content");
			expect(blocks[1]!.type).toBe("heading");
			expect(blocks[1]!.content).toContain("## Other stuff");
			expect(blocks[1]!.content).toContain("Also [[Home Assistant]]");
		});
	});

	describe("multiple mentions", () => {
		it("extracts multiple heading sections from one file", () => {
			const text = [
				"## [[Alpha]] - morning",
				"",
				"Morning work.",
				"",
				"## Unrelated",
				"",
				"Stuff.",
				"",
				"## [[Alpha]] - afternoon",
				"",
				"Afternoon work.",
			].join("\n");

			const blocks = extractMentions(text, "Alpha");
			expect(blocks).toHaveLength(2);
			expect(blocks[0]!.content).toContain("Morning work");
			expect(blocks[1]!.content).toContain("Afternoon work");
		});

		it("extracts inline mentions from different sections", () => {
			const text = [
				"# Morning",
				"",
				"First [[Alpha]] mention here.",
				"",
				"# Afternoon",
				"",
				"Second [[Alpha]] mention here.",
			].join("\n");

			const blocks = extractMentions(text, "Alpha");
			expect(blocks).toHaveLength(2);
			expect(blocks[0]!.content).toContain("# Morning");
			expect(blocks[0]!.content).toContain("First [[Alpha]]");
			expect(blocks[1]!.content).toContain("# Afternoon");
			expect(blocks[1]!.content).toContain("Second [[Alpha]]");
		});

		it("extracts multiple inline mentions as separate paragraphs when no headings", () => {
			const text = [
				"First [[Alpha]] mention here.",
				"",
				"Some unrelated text.",
				"",
				"Second [[Alpha]] mention here.",
			].join("\n");

			const blocks = extractMentions(text, "Alpha");
			expect(blocks).toHaveLength(2);
		});
	});

	describe("link format handling", () => {
		it("matches aliased links", () => {
			const text = "Updated [[Home Assistant|HA]] today.";
			const blocks = extractMentions(text, "Home Assistant");
			expect(blocks).toHaveLength(1);
		});

		it("matches section links", () => {
			const text = "See [[Home Assistant#MQTT]] for details.";
			const blocks = extractMentions(text, "Home Assistant");
			expect(blocks).toHaveLength(1);
		});

		it("matches case-insensitively", () => {
			const text = "Updated [[home assistant]] today.";
			const blocks = extractMentions(text, "Home Assistant");
			expect(blocks).toHaveLength(1);
		});

		it("matches folder-qualified links", () => {
			const text = "See [[profiles/Jim Perrin]] for details.";
			const blocks = extractMentions(text, "Jim Perrin");
			expect(blocks).toHaveLength(1);
		});

		it("matches deeply nested folder-qualified links", () => {
			const text = "Check [[a/b/c/Home Assistant]] config.";
			const blocks = extractMentions(text, "Home Assistant");
			expect(blocks).toHaveLength(1);
		});

		it("matches folder-qualified link with alias", () => {
			const text = "Talked to [[profiles/Jim Perrin|Jim]] about it.";
			const blocks = extractMentions(text, "Jim Perrin");
			expect(blocks).toHaveLength(1);
		});

		it("matches when multiple link names are provided", () => {
			const text = "Updated [[HA]] today.";
			const blocks = extractMentions(text, ["Home Assistant", "HA"]);
			expect(blocks).toHaveLength(1);
		});

		it("matches any of the provided link names", () => {
			const text = [
				"## Topic",
				"",
				"First mention of [[Home Assistant]].",
				"",
				"## Other",
				"",
				"Also known as [[HA]].",
			].join("\n");
			const blocks = extractMentions(text, ["Home Assistant", "HA"]);
			expect(blocks).toHaveLength(2);
		});
	});

	describe("frontmatter handling", () => {
		it("skips YAML frontmatter", () => {
			const text = [
				"---",
				"title: My Note",
				"tags: [daily]",
				"---",
				"",
				"Content mentioning [[Alpha]] here.",
			].join("\n");

			const blocks = extractMentions(text, "Alpha");
			expect(blocks).toHaveLength(1);
			expect(blocks[0]!.content).not.toContain("title:");
			expect(blocks[0]!.content).toContain("Content mentioning");
		});

		it("handles file with only frontmatter and no mention", () => {
			const text = [
				"---",
				"title: My Note",
				"---",
				"",
				"No mentions here.",
			].join("\n");

			const blocks = extractMentions(text, "Alpha");
			expect(blocks).toHaveLength(0);
		});
	});

	describe("edge cases", () => {
		it("returns empty array for empty text", () => {
			expect(extractMentions("", "Alpha")).toHaveLength(0);
		});

		it("returns empty array when page is not mentioned", () => {
			const text = "Some content about [[Beta]] only.";
			expect(extractMentions(text, "Alpha")).toHaveLength(0);
		});

		it("does not match partial page names", () => {
			const text = "Talking about [[Home Assistant Green]] here.";
			expect(extractMentions(text, "Home Assistant")).toHaveLength(0);
		});

		it("does not match page name in plain text without brackets", () => {
			const text = "Talking about Home Assistant here.";
			expect(extractMentions(text, "Home Assistant")).toHaveLength(0);
		});

		it("handles H1 heading with mention", () => {
			const text = [
				"# [[Alpha]]",
				"",
				"Content under H1.",
				"",
				"# Next",
			].join("\n");

			const blocks = extractMentions(text, "Alpha");
			expect(blocks).toHaveLength(1);
			expect(blocks[0]!.type).toBe("heading");
			expect(blocks[0]!.content).toContain("Content under H1");
		});
	});
});

describe("buildLinkPattern", () => {
	it("matches folder-qualified links", () => {
		const pattern = buildLinkPattern("Jim Perrin");
		expect(pattern.test("[[profiles/Jim Perrin]]")).toBe(true);
	});

	it("matches bare links", () => {
		const pattern = buildLinkPattern("Jim Perrin");
		expect(pattern.test("[[Jim Perrin]]")).toBe(true);
	});

	it("does not match partial names after folder prefix", () => {
		const pattern = buildLinkPattern("Home");
		expect(pattern.test("[[Home Assistant]]")).toBe(false);
	});

	it("accepts array of names and matches any", () => {
		const pattern = buildLinkPattern(["Home Assistant", "HA"]);
		expect(pattern.test("[[Home Assistant]]")).toBe(true);
		expect(pattern.test("[[HA]]")).toBe(true);
		expect(pattern.test("[[Other]]")).toBe(false);
	});

	it("matches folder-qualified link with array of names", () => {
		const pattern = buildLinkPattern(["Home Assistant", "HA"]);
		expect(pattern.test("[[profiles/HA]]")).toBe(true);
	});
});

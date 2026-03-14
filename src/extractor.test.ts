// ABOUTME: Tests for the two-tier content extraction logic.
// ABOUTME: Validates heading-section and inline-paragraph extraction from file content.

import { describe, it, expect } from "vitest";
import { extractMentions } from "./extractor";

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
		it("extracts the enclosing paragraph for an inline mention", () => {
			const text = [
				"## Morning errands",
				"",
				"Picked up groceries.",
				"",
				"Noticed [[Tailscale]] was down on my phone.",
				"",
				"Called mom.",
			].join("\n");

			const blocks = extractMentions(text, "Tailscale");
			expect(blocks).toHaveLength(1);
			expect(blocks[0]!.type).toBe("inline");
			expect(blocks[0]!.content).toContain("Noticed [[Tailscale]] was down");
			expect(blocks[0]!.content).not.toContain("Picked up groceries");
			expect(blocks[0]!.content).not.toContain("Called mom");
		});

		it("extracts a multi-line paragraph", () => {
			const text = [
				"First para.",
				"",
				"The [[Home Assistant]] update broke things.",
				"Had to roll back to the previous version.",
				"Took about an hour to fix.",
				"",
				"Last para.",
			].join("\n");

			const blocks = extractMentions(text, "Home Assistant");
			expect(blocks).toHaveLength(1);
			expect(blocks[0]!.content).toContain("update broke things");
			expect(blocks[0]!.content).toContain("Had to roll back");
			expect(blocks[0]!.content).toContain("Took about an hour");
		});

		it("extracts a bullet list group containing the mention", () => {
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

		it("extracts both heading and separate inline mention", () => {
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
			expect(blocks[1]!.type).toBe("inline");
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

		it("extracts multiple inline mentions from different paragraphs", () => {
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

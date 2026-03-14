// ABOUTME: Plugin entry point — registers the mentions code block processor.
// ABOUTME: Delegates all logic to the processor module.

import { Plugin } from "obsidian";
import { processMentionsBlock } from "./processor";

export default class MentionsRollupPlugin extends Plugin {
	async onload() {
		this.registerMarkdownCodeBlockProcessor(
			"mentions",
			(source, el, ctx) => processMentionsBlock(source, el, ctx, this.app, this),
		);
	}
}

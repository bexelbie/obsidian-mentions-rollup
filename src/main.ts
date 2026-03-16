// ABOUTME: Plugin entry point — registers code block processors for mentions and tasks.
// ABOUTME: Delegates all logic to the processor modules.

import { Plugin } from "obsidian";
import { processMentionsBlock } from "./processor";
import { processTasksBlock } from "./task-processor";

export default class MentionsRollupPlugin extends Plugin {
	async onload() {
		this.registerMarkdownCodeBlockProcessor(
			"mentions",
			(source, el, ctx) => processMentionsBlock(source, el, ctx, this.app, this),
		);

		this.registerMarkdownCodeBlockProcessor(
			"mention-tasks",
			(source, el, ctx) => processTasksBlock(source, el, ctx, this.app, this),
		);
	}
}

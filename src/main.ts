// ABOUTME: Plugin entry point — registers code block processors for mentions and tasks.
// ABOUTME: Loads settings, registers the settings tab, and delegates rendering to processors.

import { Plugin } from "obsidian";
import { processMentionsBlock } from "./processor";
import { processTasksBlock } from "./task-processor";
import { MentionsRollupSettingTab, DEFAULT_SETTINGS } from "./settings";
import { PluginSettings } from "./types";

export default class MentionsRollupPlugin extends Plugin {
	settings: PluginSettings = DEFAULT_SETTINGS;

	async onload() {
		await this.loadSettings();
		this.addSettingTab(new MentionsRollupSettingTab(this.app, this));

		this.registerMarkdownCodeBlockProcessor(
			"mentions",
			(source, el, ctx) =>
				processMentionsBlock(source, el, ctx, this.app, this, this.settings.mentions),
		);

		this.registerMarkdownCodeBlockProcessor(
			"mention-tasks",
			(source, el, ctx) =>
				processTasksBlock(source, el, ctx, this.app, this, this.settings.tasks),
		);
	}

	async loadSettings() {
		const data = (await this.loadData()) as Partial<PluginSettings> | null;
		this.settings = Object.assign({}, DEFAULT_SETTINGS, data);
		// Deep merge nested objects in case saved data has partial structures
		this.settings.mentions = Object.assign({}, DEFAULT_SETTINGS.mentions, data?.mentions);
		this.settings.tasks = Object.assign({}, DEFAULT_SETTINGS.tasks, data?.tasks);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

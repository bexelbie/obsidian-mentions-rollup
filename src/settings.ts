// ABOUTME: Plugin settings tab for vault-wide defaults.
// ABOUTME: Exposes all mentions and task options with per-section configuration.

import { App, PluginSettingTab, Setting } from "obsidian";
import type MentionsRollupPlugin from "./main";
import { PluginSettings, MentionsOptions, TaskOptions } from "./types";

export const DEFAULT_SETTINGS: PluginSettings = {
	mentions: {
		sort: "newest",
		limit: null,
		from: null,
		ignore: null,
	},
	tasks: {
		show: "open",
		sort: "earliest",
		from: null,
		ignore: null,
		group: null,
		limit: null,
	},
};

export class MentionsRollupSettingTab extends PluginSettingTab {
	plugin: MentionsRollupPlugin;

	constructor(app: App, plugin: MentionsRollupPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		// --- Mentions defaults ---

		new Setting(containerEl).setName("Mentions defaults").setHeading();
		containerEl.createEl("p", {
			text: "These defaults apply to all mentions code blocks. Override any option in individual blocks.",
			cls: "setting-item-description",
		});

		new Setting(containerEl)
			.setName("Sort order")
			.setDesc("Default sort order for mention entries.")
			.addDropdown((dropdown) =>
				dropdown
					.addOptions({ newest: "Newest first", oldest: "Oldest first" })
					.setValue(this.plugin.settings.mentions.sort)
					.onChange(async (value) => {
						this.plugin.settings.mentions.sort = value as MentionsOptions["sort"];
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName("Limit")
			.setDesc("Maximum number of source files to show. Leave empty for no limit.")
			.addText((text) =>
				text
					.setPlaceholder("No limit")
					.setValue(this.plugin.settings.mentions.limit?.toString() ?? "")
					.onChange(async (value) => {
						const num = parseInt(value, 10);
						this.plugin.settings.mentions.limit = !isNaN(num) && num > 0 ? num : null;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName("From folders")
			.setDesc("Comma-separated folder paths to include (e.g., daily/, projects/). Leave empty for entire vault.")
			.addText((text) =>
				text
					.setPlaceholder("Entire vault")
					.setValue(this.plugin.settings.mentions.from?.join(", ") ?? "")
					.onChange(async (value) => {
						const folders = value.split(",").map((s) => s.trim()).filter(Boolean);
						this.plugin.settings.mentions.from = folders.length > 0 ? folders : null;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName("Ignore folders")
			.setDesc("Comma-separated folder paths to exclude (e.g., templates/, archive/).")
			.addText((text) =>
				text
					.setPlaceholder("None")
					.setValue(this.plugin.settings.mentions.ignore?.join(", ") ?? "")
					.onChange(async (value) => {
						const folders = value.split(",").map((s) => s.trim()).filter(Boolean);
						this.plugin.settings.mentions.ignore = folders.length > 0 ? folders : null;
						await this.plugin.saveSettings();
					}),
			);

		// --- Task defaults ---

		new Setting(containerEl).setName("Task defaults").setHeading();
		containerEl.createEl("p", {
			text: "These defaults apply to all mention-tasks code blocks. Override any option in individual blocks.",
			cls: "setting-item-description",
		});

		new Setting(containerEl)
			.setName("Show")
			.setDesc("Which tasks to display by default.")
			.addDropdown((dropdown) =>
				dropdown
					.addOptions({ open: "Open", completed: "Completed", all: "All" })
					.setValue(this.plugin.settings.tasks.show)
					.onChange(async (value) => {
						this.plugin.settings.tasks.show = value as TaskOptions["show"];
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName("Sort order")
			.setDesc("Default sort order for tasks.")
			.addDropdown((dropdown) =>
				dropdown
					.addOptions({
						earliest: "Earliest due date first",
						latest: "Latest due date first",
						"a-z": "Filename A → Z",
						"z-a": "Filename Z → A",
					})
					.setValue(this.plugin.settings.tasks.sort)
					.onChange(async (value) => {
						this.plugin.settings.tasks.sort = value as TaskOptions["sort"];
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName("Limit")
			.setDesc("Maximum number of tasks to show. Leave empty for no limit.")
			.addText((text) =>
				text
					.setPlaceholder("No limit")
					.setValue(this.plugin.settings.tasks.limit?.toString() ?? "")
					.onChange(async (value) => {
						const num = parseInt(value, 10);
						this.plugin.settings.tasks.limit = !isNaN(num) && num > 0 ? num : null;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName("From folders")
			.setDesc("Comma-separated folder paths to include (e.g., daily/, projects/). Leave empty for entire vault.")
			.addText((text) =>
				text
					.setPlaceholder("Entire vault")
					.setValue(this.plugin.settings.tasks.from?.join(", ") ?? "")
					.onChange(async (value) => {
						const folders = value.split(",").map((s) => s.trim()).filter(Boolean);
						this.plugin.settings.tasks.from = folders.length > 0 ? folders : null;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName("Ignore folders")
			.setDesc("Comma-separated folder paths to exclude (e.g., templates/, archive/).")
			.addText((text) =>
				text
					.setPlaceholder("None")
					.setValue(this.plugin.settings.tasks.ignore?.join(", ") ?? "")
					.onChange(async (value) => {
						const folders = value.split(",").map((s) => s.trim()).filter(Boolean);
						this.plugin.settings.tasks.ignore = folders.length > 0 ? folders : null;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName("Group by tag")
			.setDesc("Tag to split tasks into groups (e.g., #discuss). Leave empty for no grouping.")
			.addText((text) =>
				text
					.setPlaceholder("No grouping")
					.setValue(this.plugin.settings.tasks.group ?? "")
					.onChange(async (value) => {
						const trimmed = value.trim();
						if (!trimmed) {
							this.plugin.settings.tasks.group = null;
						} else {
							this.plugin.settings.tasks.group = trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
						}
						await this.plugin.saveSettings();
					}),
			);
	}
}

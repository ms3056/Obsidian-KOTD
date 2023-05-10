// Plugin code

import {
  App,
  Editor,
  MarkdownView,
  Modal,
  Notice,
  Plugin,
  PluginSettingTab,
  Setting,
  WorkspaceLeaf,
  ItemView,
  ViewCreator,
} from 'obsidian';

interface KanjiData {
  kanji: string;
  furigana: string;
  meaning: string;
}

interface KanjiPluginSettings {
  kanjiList: KanjiData[];
  kanjiColor: string;
  furiganaColor: string;
  meaningColor: string;
}

const DEFAULT_SETTINGS: KanjiPluginSettings = {
  kanjiList: [],
  kanjiColor: '#222222',
  furiganaColor: '#0000FF',
  meaningColor: '#FF0000',
};

export default class KanjiPlugin extends Plugin {
  settings: KanjiPluginSettings;

  async onload() {
    await this.loadSettings();

    this.addCommand({
      id: 'open-kanji-tab',
      name: 'Open Kanji Tab',
      callback: () => {
        this.app.workspace.getRightLeaf(false).setViewState({
          type: 'kanji-view',
        });
      },
    });

    this.addCommand({
      id: 'load-another-kanji',
      name: 'Load Another Kanji',
      callback: () => {
        const kanjiView = this.app.workspace.getLeavesOfType('kanji-view');
        if (kanjiView.length > 0) {
          (kanjiView[0].view as KanjiView).loadKanji();
        }
      },
    });

    this.registerView('kanji-view', (leaf: WorkspaceLeaf) => {
      return new KanjiView(leaf, this.settings);
    });

    this.addSettingTab(new KanjiSettingTab(this.app, this));
  }

  onunload() {}

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}

class KanjiView extends ItemView {
  private container: HTMLElement;
  private kanjiList: KanjiData[];
  private settings: KanjiPluginSettings;

  constructor(leaf: WorkspaceLeaf, settings: KanjiPluginSettings) {
    super(leaf);

    this.kanjiList = settings.kanjiList;
    this.settings = settings;

    this.container = this.contentEl.createDiv('kanji-plugin-container');
    this.container.style.display = 'flex';
    this.container.style.flexDirection = 'column';
    this.container.style.alignItems = 'center';
    this.container.style.justifyContent = 'center';
    this.container.style.height = '100%';
    this.container.style.fontFamily = 'Meiryo';

    this.loadKanji();
  }

  async loadKanji() {
    if (this.kanjiList.length === 0) {
      this.container.empty();
      this.container.createDiv('empty-list-message').setText('No Kanji entries found. Please add entries in the plugin settings.');
      return;
    }

    const randomKanji = this.kanjiList[Math.floor(Math.random() * this.kanjiList.length)];

    this.container.empty();

    const kanjiEl = this.container.createDiv('kanji');
    kanjiEl.style.fontSize = '48px';
    kanjiEl.style.color = this.settings.kanjiColor;
    kanjiEl.innerText = randomKanji.kanji;

    const furiganaEl = this.container.createDiv('furigana');
    furiganaEl.style.fontSize = '24px';
    furiganaEl.style.color = this.settings.furiganaColor;
    furiganaEl.innerText = randomKanji.furigana;

    const meaningEl = this.container.createDiv('meaning');
    meaningEl.style.fontSize = '24px';
    meaningEl.style.color = this.settings.meaningColor;
    meaningEl.innerText = randomKanji.meaning;
  }

  getViewType() {
    return 'kanji-view';
  }

  getDisplayText() {
    return 'Kanji View';
  }

  getIcon() {
    return 'languages';
  }

  async onClose() {
    this.container.remove();
  }
}

// Settings tab
class KanjiSettingTab extends PluginSettingTab {
  plugin: KanjiPlugin;

  constructor(app: App, plugin: KanjiPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl('h2', { text: 'Kanji Plugin Settings' });

    this.addKanjiColorSetting();
    this.addFuriganaColorSetting();
    this.addMeaningColorSetting();

    const table = containerEl.createEl('table');
    const headerRow = table.createEl('tr');
    headerRow.createEl('th', { text: 'Kanji' });
    headerRow.createEl('th', { text: 'Furigana' });
    headerRow.createEl('th', { text: 'Meaning' });
    headerRow.createEl('th', { text: '' });

    this.plugin.settings.kanjiList.forEach((entry, index) => {
      const row = table.createEl('tr');

      const kanjiCell = row.createEl('td');
      const kanjiInput = kanjiCell.createEl('input', { type: 'text', value: entry.kanji });
      kanjiInput.addEventListener('input', async () => {
        this.plugin.settings.kanjiList[index].kanji = kanjiInput.value;
        await this.plugin.saveSettings();
      });

      const furiganaCell = row.createEl('td');
      const furiganaInput = furiganaCell.createEl('input', { type: 'text', value: entry.furigana });
      furiganaInput.addEventListener('input', async () => {
        this.plugin.settings.kanjiList[index].furigana = furiganaInput.value;
        await this.plugin.saveSettings();
      });

      const meaningCell = row.createEl('td');
      const meaningInput = meaningCell.createEl('input', { type: 'text', value: entry.meaning });
      meaningInput.addEventListener('input', async () => {
        this.plugin.settings.kanjiList[index].meaning = meaningInput.value;
        await this.plugin.saveSettings();
      });

      const buttonsCell = row.createEl('td');
      const deleteButton = buttonsCell.createEl('button', { text: '-' });
      deleteButton.addEventListener('click', async () => {
        this.plugin.settings.kanjiList.splice(index, 1);
        await this.plugin.saveSettings();
        this.display();
      });

      if (index === this.plugin.settings.kanjiList.length - 1) {
        const addButton = buttonsCell.createEl('button', { text: '+' });
        addButton.addEventListener('click', async () => {
          this.plugin.settings.kanjiList.push({ kanji: '', furigana: '', meaning: '' });
          await this.plugin.saveSettings();
          this.display();
        });
      }
    });
  }

  // Color settings


addKanjiColorSetting(): void {
    const setting = new Setting(this.containerEl)
      .setName('Kanji Color')
      .setDesc('Set the color for kanji')
      .addText((text) =>
        text
          .setPlaceholder('Enter color')
          .setValue(this.plugin.settings.kanjiColor)
          .onChange(async (value) => {
            this.plugin.settings.kanjiColor = value;
            await this.plugin.saveSettings();
          }),
      );

    const colorInput = setting.controlEl.querySelector('input');
    if (colorInput) {
      colorInput.setAttribute('type', 'color');
      colorInput.setAttribute('value', this.plugin.settings.kanjiColor);
    }
  }

  addFuriganaColorSetting(): void {
    const setting = new Setting(this.containerEl)
      .setName('Furigana Color')
      .setDesc('Set the color for furigana')
      .addText((text) =>
        text
          .setPlaceholder('Enter color')
          .setValue(this.plugin.settings.furiganaColor)
          .onChange(async (value) => {
            this.plugin.settings.furiganaColor = value;
            await this.plugin.saveSettings();
          }),
      );

    const colorInput = setting.controlEl.querySelector('input');
    if (colorInput) {
      colorInput.setAttribute('type', 'color');
      colorInput.setAttribute('value', this.plugin.settings.furiganaColor);
    }
  }

  addMeaningColorSetting(): void {
    const setting = new Setting(this.containerEl)
      .setName('Meaning Color')
      .setDesc('Set the color for meaning')
      .addText((text) =>
        text
          .setPlaceholder('Enter color')
          .setValue(this.plugin.settings.meaningColor)
          .onChange(async (value) => {
            this.plugin.settings.meaningColor = value;
            await this.plugin.saveSettings();
          }),
      );

    const colorInput = setting.controlEl.querySelector('input');
    if (colorInput) {
      colorInput.setAttribute('type', 'color');
      colorInput.setAttribute('value', this.plugin.settings.meaningColor);
    }
  }
}


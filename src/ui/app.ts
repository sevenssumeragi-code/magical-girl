/** 画面制御とゲームループ。 */

import { AudioPlayer } from '../engine/audio';
import { listByType, resolveAsset, spriteId } from '../engine/assets';
import { NAME_COLORS } from '../engine/characters';
import { ENDING_TITLES } from '../engine/ending';
import { ScenePlayer, type Frame } from '../engine/player';
import { allScenes, getScene, outgoingLinks } from '../engine/scenario';
import {
  DEFAULT_SETTINGS,
  PersistentStore,
  SAVE_SLOTS,
  clearSlot,
  loadSettings,
  loadSlot,
  saveSettings,
  saveSlot,
  type SlotId,
} from '../engine/save';
import { DEFAULT_PLAYER_NAME, createInitialState } from '../engine/state';
import { ENDING_IDS, type BacklogEntry, type EndingId, type Settings } from '../engine/types';
import { button, clear, el, formatDate } from './dom';

type Screen = 'title' | 'game';

const BACKLOG_LIMIT = 100;

export class App {
  private rootEl: HTMLElement;
  private audio = new AudioPlayer();
  private persistent = new PersistentStore();
  private settings: Settings = loadSettings();

  private player: ScenePlayer | null = null;
  private backlog: BacklogEntry[] = [];
  private frame: Frame | null = null;

  private screen: Screen = 'title';
  private typing: { full: string; timer: number | null } | null = null;
  private autoTimer: number | null = null;
  private skipping = false;
  private overlayOpen = false;
  private overlayClosable = true;

  // ステージ要素
  private bgEl!: HTMLImageElement;
  private cgEl!: HTMLImageElement;
  private spriteEl!: HTMLImageElement;
  private nameEl!: HTMLElement;
  private textEl!: HTMLElement;
  private choicesEl!: HTMLElement;
  private chapterEl!: HTMLElement;
  private overlayEl!: HTMLElement;
  private gameEl!: HTMLElement;
  private titleEl!: HTMLElement;

  constructor(root: HTMLElement) {
    this.rootEl = root;
    this.audio.setVolumes(this.settings.bgmVolume, this.settings.seVolume);
    this.buildLayout();
    this.bindKeys();
    this.showTitle();
  }

  // ------------------------------------------------------------ レイアウト

  private buildLayout(): void {
    this.bgEl = el('img', { class: 'stage-bg', alt: '' });
    this.cgEl = el('img', { class: 'stage-cg', alt: '' });
    this.spriteEl = el('img', { class: 'stage-sprite', alt: '' });
    this.chapterEl = el('div', { class: 'chapter-title' });
    this.nameEl = el('div', { class: 'speaker-name' });
    this.textEl = el('div', { class: 'text-body' });
    this.choicesEl = el('div', { class: 'choices' });
    this.overlayEl = el('div', { class: 'overlay hidden' });
    this.titleEl = el('div', { class: 'screen title-screen' });

    const textbox = el(
      'div',
      { class: 'textbox' },
      this.nameEl,
      this.textEl,
      el('div', { class: 'next-marker', textContent: '▼' }),
    );
    textbox.addEventListener('click', () => this.onAdvanceClick());

    this.gameEl = el(
      'div',
      { class: 'screen game-screen hidden' },
      el('div', { class: 'stage' }, this.bgEl, this.spriteEl, this.cgEl, this.chapterEl),
      this.choicesEl,
      textbox,
      this.buildMenuBar(),
    );

    this.rootEl.append(this.titleEl, this.gameEl, this.overlayEl);
  }

  private buildMenuBar(): HTMLElement {
    const bar = el('div', { class: 'menubar' });
    const auto = button('AUTO', () => this.toggleAuto(), 'menu-btn');
    const skip = button('SKIP', () => this.toggleSkip(), 'menu-btn');
    auto.dataset.role = 'auto';
    skip.dataset.role = 'skip';
    bar.append(
      auto,
      skip,
      button('LOG', () => this.openBacklog(), 'menu-btn'),
      button('SAVE', () => this.openSaveLoad('save'), 'menu-btn'),
      button('LOAD', () => this.openSaveLoad('load'), 'menu-btn'),
      button('CONFIG', () => this.openConfig(), 'menu-btn'),
      button('TITLE', () => this.confirmReturnTitle(), 'menu-btn'),
    );
    return bar;
  }

  private bindKeys(): void {
    window.addEventListener('keydown', (e) => {
      // オーバーレイはタイトル画面からも開くため、画面種別より先に処理する。
      if (this.overlayOpen) {
        if (e.key === 'Escape' && this.overlayClosable) this.closeOverlay();
        return;
      }
      if (this.screen !== 'game') return;
      switch (e.key) {
        case ' ':
        case 'Enter':
          e.preventDefault();
          this.onAdvanceClick();
          break;
        case 'Control':
          this.setSkip(true);
          break;
        case 'a':
        case 'A':
          this.toggleAuto();
          break;
        case 'l':
        case 'L':
          this.openBacklog();
          break;
        case 'Escape':
          this.openConfig();
          break;
        default:
          break;
      }
    });
    window.addEventListener('keyup', (e) => {
      if (e.key === 'Control') this.setSkip(false);
    });
  }

  // ---------------------------------------------------------------- タイトル

  private showTitle(): void {
    this.screen = 'title';
    this.audio.playBgm('bgm_title');
    this.gameEl.classList.add('hidden');
    this.titleEl.classList.remove('hidden');
    this.closeOverlay();

    const data = this.persistent.snapshot;
    clear(this.titleEl);

    const bgUrl = resolveAsset('bg_title');
    if (bgUrl) this.titleEl.style.backgroundImage = `url(${bgUrl})`;

    const menu = el('div', { class: 'title-menu' });
    menu.append(
      button('はじめから', () => this.promptNewGame(), 'title-btn'),
      button('つづきから', () => this.openSaveLoad('load'), 'title-btn'),
      button('回想', () => this.openGallery(), 'title-btn'),
      button('エンディング一覧', () => this.openEndingList(), 'title-btn'),
      button('ルート分岐図', () => this.openRouteMap(), 'title-btn'),
      button('設定', () => this.openConfig(), 'title-btn'),
    );

    // 初回起動時のみタイトル演出を出す。
    const intro = data.clearedOnce ? '' : ' intro';
    this.titleEl.append(
      el(
        'div',
        { class: `title-inner${intro}` },
        el('h1', { class: 'title-main', textContent: '魔法少女レニィ☆マギカ' }),
        el('p', { class: 'title-sub', textContent: 'Mahou Shoujo Renny☆Magica' }),
        menu,
        el('p', {
          class: 'title-progress',
          textContent: `到達エンディング ${data.unlockedEndings.length} / ${ENDING_IDS.length}`,
        }),
      ),
    );
  }

  private promptNewGame(): void {
    this.openOverlay('はじめから', (body) => {
      const input = el('input', {
        class: 'name-input',
        type: 'text',
        value: DEFAULT_PLAYER_NAME,
        maxLength: 8,
      });
      const start = () => {
        this.closeOverlay();
        this.startNewGame(input.value);
      };
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') start();
      });
      body.append(
        el('p', { textContent: '主人公の名前を決めてください（8文字まで）。' }),
        input,
        el('div', { class: 'overlay-actions' }, button('決定', start, 'primary'), button('やめる', () => this.closeOverlay())),
      );
      queueMicrotask(() => input.focus());
    });
  }

  // ------------------------------------------------------------ ゲーム開始

  private startNewGame(playerName: string): void {
    const state = createInitialState(playerName);
    this.backlog = [];
    this.beginPlay(state);
  }

  private beginPlay(state: ReturnType<typeof createInitialState>): void {
    this.player = new ScenePlayer(state, {
      onBackground: (id) => this.setBackground(id),
      onCg: (id, variant) => this.setCg(id, variant),
      onBgm: (id) => this.setBgm(id),
      onSe: (id) => this.audio.playSe(id),
      onSceneEnter: (scene) => {
        this.persistent.visitScene(scene.id);
        if (scene.chapterTitle) this.showChapterTitle(scene.chapterTitle);
        this.autoSave();
      },
    });

    this.screen = 'game';
    this.titleEl.classList.add('hidden');
    this.gameEl.classList.remove('hidden');

    const scene = this.player.currentScene;
    if (state.lineIndex === 0) {
      this.player.enterScene(scene);
    } else {
      this.player.restoreStage();
    }
    this.step();
  }

  // ---------------------------------------------------------------- ステージ

  private setBackground(id: string): void {
    const url = resolveAsset(id);
    this.bgEl.src = url ?? '';
    this.bgEl.dataset.assetId = id;
  }

  private setCg(id: string | null, variant?: string): void {
    if (!id) {
      this.cgEl.classList.add('hidden');
      this.cgEl.removeAttribute('src');
      return;
    }
    const url = resolveAsset(id, variant);
    if (!url) {
      this.cgEl.classList.add('hidden');
      return;
    }
    this.cgEl.src = url;
    this.cgEl.dataset.assetId = id;
    this.cgEl.classList.remove('hidden');
    this.persistent.unlockCg(id);
  }

  private setBgm(id: string | null): void {
    this.audio.playBgm(id);
    if (id) this.persistent.unlockBgm(id);
  }

  private setSprite(speaker: string | null, expression: string): void {
    if (!speaker || speaker === 'haru') {
      this.spriteEl.classList.add('hidden');
      return;
    }
    const url = resolveAsset(spriteId(speaker, expression));
    if (!url) {
      this.spriteEl.classList.add('hidden');
      return;
    }
    this.spriteEl.src = url;
    this.spriteEl.classList.remove('hidden');
  }

  private showChapterTitle(title: string): void {
    this.chapterEl.textContent = title;
    this.chapterEl.classList.remove('show');
    // リフローを挟んでアニメーションを再生し直す。
    void this.chapterEl.offsetWidth;
    this.chapterEl.classList.add('show');
  }

  // ------------------------------------------------------------ 進行

  private step(): void {
    if (!this.player) return;
    const frame = this.player.next();
    this.frame = frame;

    switch (frame.kind) {
      case 'text':
        this.renderText(frame);
        break;
      case 'choice':
        this.renderChoice(frame);
        break;
      case 'ending':
        this.renderEnding(frame.ending);
        break;
      case 'end':
        this.renderEndOfContent();
        break;
    }
    this.persistent.flush();
  }

  private renderText(frame: Extract<Frame, { kind: 'text' }>): void {
    clear(this.choicesEl);
    this.setSprite(frame.speaker, frame.expression);

    this.nameEl.textContent = frame.speakerName;
    this.nameEl.style.color = frame.speaker ? (NAME_COLORS[frame.speaker] ?? '#fff') : 'transparent';
    this.nameEl.classList.toggle('hidden', !frame.speakerName);

    this.backlog.push({ speaker: frame.speaker, speakerName: frame.speakerName, text: frame.text });
    if (this.backlog.length > BACKLOG_LIMIT) this.backlog.shift();

    const alreadyRead = this.persistent.isRead(frame.sceneId, frame.lineIndex);
    this.persistent.markRead(frame.sceneId, frame.lineIndex);

    // スキップ中は未読を読み飛ばすか設定に従う。
    if (this.skipping && (alreadyRead || this.settings.skipUnreadToo)) {
      this.textEl.textContent = frame.text;
      window.setTimeout(() => {
        if (this.skipping) this.step();
      }, 8);
      return;
    }
    if (this.skipping) this.setSkip(false);

    this.typeText(frame.text);
  }

  private typeText(text: string): void {
    this.cancelTyping();
    const speed = this.settings.textSpeed;
    if (speed <= 0) {
      this.textEl.textContent = text;
      this.onTypingDone();
      return;
    }

    let i = 0;
    this.textEl.textContent = '';
    const timer = window.setInterval(() => {
      i += 1;
      this.textEl.textContent = text.slice(0, i);
      if (i >= text.length) {
        this.cancelTyping();
        this.onTypingDone();
      }
    }, Math.max(1, 1000 / speed));
    this.typing = { full: text, timer };
  }

  private cancelTyping(): void {
    if (this.typing?.timer !== null && this.typing?.timer !== undefined) {
      window.clearInterval(this.typing.timer);
    }
    this.typing = null;
  }

  private onTypingDone(): void {
    if (this.autoTimer !== null) window.clearTimeout(this.autoTimer);
    if (this.isAuto) {
      this.autoTimer = window.setTimeout(() => this.step(), this.settings.autoSpeed);
    }
  }

  private onAdvanceClick(): void {
    if (this.overlayOpen) return;
    if (this.frame?.kind === 'choice') return;
    // 表示途中なら全文を即座に出す。
    if (this.typing) {
      const full = this.typing.full;
      this.cancelTyping();
      this.textEl.textContent = full;
      this.onTypingDone();
      return;
    }
    if (this.frame?.kind === 'text') this.step();
  }

  private renderChoice(frame: Extract<Frame, { kind: 'choice' }>): void {
    this.cancelTyping();
    this.setSkip(false);
    this.setAuto(false);
    this.textEl.textContent = frame.prompt;
    this.nameEl.classList.add('hidden');

    clear(this.choicesEl);
    for (const option of frame.options) {
      this.choicesEl.append(
        button(
          option.text,
          () => {
            this.player?.choose(option.index);
            clear(this.choicesEl);
            this.step();
          },
          'choice-btn',
        ),
      );
    }
  }

  private renderEnding(ending: EndingId): void {
    this.persistent.unlockEnding(ending);
    this.persistent.flush();
    this.setSkip(false);
    this.setAuto(false);

    this.openOverlay(ENDING_TITLES[ending], (body) => {
      const data = this.persistent.snapshot;
      body.append(
        el('p', { textContent: 'エンディングに到達しました。' }),
        el('p', {
          class: 'muted',
          textContent: `到達エンディング ${data.unlockedEndings.length} / ${ENDING_IDS.length}`,
        }),
        el(
          'div',
          { class: 'overlay-actions' },
          button(
            'タイトルへ',
            () => {
              this.closeOverlay();
              this.showTitle();
            },
            'primary',
          ),
        ),
      );
    }, false);
  }

  private renderEndOfContent(): void {
    this.textEl.textContent = '（このシーンの続きは未実装です）';
    this.nameEl.classList.add('hidden');
  }

  // ------------------------------------------------------------ AUTO / SKIP

  private get isAuto(): boolean {
    return this.autoTimer !== null || this.gameEl.dataset.auto === 'on';
  }

  private toggleAuto(): void {
    this.setAuto(this.gameEl.dataset.auto !== 'on');
  }

  private setAuto(on: boolean): void {
    this.gameEl.dataset.auto = on ? 'on' : 'off';
    this.gameEl.querySelector('[data-role="auto"]')?.classList.toggle('active', on);
    if (this.autoTimer !== null) {
      window.clearTimeout(this.autoTimer);
      this.autoTimer = null;
    }
    if (on && !this.typing && this.frame?.kind === 'text') {
      this.autoTimer = window.setTimeout(() => this.step(), this.settings.autoSpeed);
    }
  }

  private toggleSkip(): void {
    this.setSkip(!this.skipping);
  }

  private setSkip(on: boolean): void {
    if (this.skipping === on) return;
    this.skipping = on;
    this.gameEl.querySelector('[data-role="skip"]')?.classList.toggle('active', on);
    if (on) {
      this.setAuto(false);
      this.cancelTyping();
      if (this.frame?.kind === 'text') this.step();
    }
  }

  // ---------------------------------------------------------------- セーブ

  private autoSave(): void {
    if (!this.player) return;
    saveSlot('auto', this.player.state, this.backlog, this.slotLabel());
  }

  private slotLabel(): string {
    const scene = this.player ? getScene(this.player.state.sceneId) : null;
    return scene?.chapterTitle ?? scene?.id ?? '';
  }

  private openSaveLoad(mode: 'save' | 'load'): void {
    const canSave = mode === 'save' && this.player !== null;
    this.openOverlay(mode === 'save' ? 'セーブ' : 'ロード', (body) => {
      const list = el('div', { class: 'slot-list' });
      const slots: SlotId[] = [...SAVE_SLOTS, 'auto'];

      for (const slot of slots) {
        const data = loadSlot(slot);
        const name = slot === 'auto' ? 'オート' : `スロット ${slot}`;
        const detail = data
          ? `${data.label || data.state.sceneId} — ${formatDate(data.savedAt)}`
          : '（空き）';

        const row = el(
          'div',
          { class: 'slot-row' },
          el('div', { class: 'slot-info' }, el('strong', { textContent: name }), el('span', { textContent: detail })),
        );

        const actions = el('div', { class: 'slot-actions' });
        if (mode === 'save' && slot !== 'auto') {
          actions.append(
            button(
              '保存',
              () => {
                if (!this.player) return;
                saveSlot(slot, this.player.state, this.backlog, this.slotLabel());
                this.closeOverlay();
                this.openSaveLoad('save');
              },
              canSave ? 'primary' : 'disabled',
            ),
          );
        }
        if (data) {
          actions.append(
            button('読込', () => {
              this.backlog = data.backlog ?? [];
              this.closeOverlay();
              this.beginPlay(data.state);
            }),
            button('削除', () => {
              clearSlot(slot);
              this.closeOverlay();
              this.openSaveLoad(mode);
            }),
          );
        }
        row.append(actions);
        list.append(row);
      }

      body.append(list);
      if (mode === 'save' && !canSave) {
        body.append(el('p', { class: 'muted', textContent: 'ゲーム中のみ保存できます。' }));
      }
    });
  }

  // ---------------------------------------------------------------- バックログ

  private openBacklog(): void {
    this.openOverlay('バックログ', (body) => {
      const list = el('div', { class: 'backlog' });
      for (const entry of this.backlog) {
        const name = el('div', { class: 'backlog-name', textContent: entry.speakerName });
        name.style.color = entry.speaker ? (NAME_COLORS[entry.speaker] ?? '#fff') : '#888';
        list.append(
          el('div', { class: 'backlog-row' }, name, el('div', { class: 'backlog-text', textContent: entry.text })),
        );
      }
      if (this.backlog.length === 0) body.append(el('p', { class: 'muted', textContent: '履歴はありません。' }));
      body.append(list);
      queueMicrotask(() => list.scrollTo(0, list.scrollHeight));
    });
  }

  // ---------------------------------------------------------------- 設定

  private openConfig(): void {
    this.openOverlay('設定', (body) => {
      const slider = (
        label: string,
        min: number,
        max: number,
        step: number,
        value: number,
        onInput: (v: number) => void,
      ) => {
        const input = el('input', { type: 'range', min: String(min), max: String(max), step: String(step), value: String(value) });
        const out = el('span', { class: 'slider-value', textContent: String(value) });
        input.addEventListener('input', () => {
          const v = Number(input.value);
          out.textContent = String(v);
          onInput(v);
          saveSettings(this.settings);
        });
        return el('div', { class: 'config-row' }, el('label', { textContent: label }), input, out);
      };

      body.append(
        slider('文字表示速度', 0, 120, 5, this.settings.textSpeed, (v) => {
          this.settings.textSpeed = v;
        }),
        slider('オート待ち時間 (ms)', 400, 4000, 100, this.settings.autoSpeed, (v) => {
          this.settings.autoSpeed = v;
        }),
        slider('BGM音量 (%)', 0, 100, 5, Math.round(this.settings.bgmVolume * 100), (v) => {
          this.settings.bgmVolume = v / 100;
          this.audio.setVolumes(this.settings.bgmVolume, this.settings.seVolume);
        }),
        slider('SE音量 (%)', 0, 100, 5, Math.round(this.settings.seVolume * 100), (v) => {
          this.settings.seVolume = v / 100;
          this.audio.setVolumes(this.settings.bgmVolume, this.settings.seVolume);
        }),
      );

      const skipUnread = el('input', { type: 'checkbox', checked: this.settings.skipUnreadToo });
      skipUnread.addEventListener('change', () => {
        this.settings.skipUnreadToo = skipUnread.checked;
        saveSettings(this.settings);
      });
      body.append(
        el('div', { class: 'config-row' }, el('label', { textContent: '未読もスキップする' }), skipUnread),
        el(
          'div',
          { class: 'overlay-actions' },
          button('初期値に戻す', () => {
            this.settings = { ...DEFAULT_SETTINGS };
            saveSettings(this.settings);
            this.audio.setVolumes(this.settings.bgmVolume, this.settings.seVolume);
            this.closeOverlay();
            this.openConfig();
          }),
        ),
      );
    });
  }

  // ---------------------------------------------------------------- 回想

  private openGallery(): void {
    this.openOverlay('回想', (body) => {
      const data = this.persistent.snapshot;

      const cgGrid = el('div', { class: 'gallery-grid' });
      for (const asset of listByType('cg')) {
        const unlocked = data.unlockedCg.includes(asset.id);
        const url = unlocked ? resolveAsset(asset.id, asset.variants?.[0]) : null;
        const cell = el('div', { class: `gallery-cell${unlocked ? '' : ' locked'}` });
        if (url) {
          const img = el('img', { src: url, alt: asset.id });
          img.addEventListener('click', () => this.openImageViewer(asset.id, asset.variants?.[0]));
          cell.append(img);
        } else {
          cell.append(el('div', { class: 'locked-mark', textContent: '？' }));
        }
        cgGrid.append(cell);
      }

      const bgmList = el('div', { class: 'bgm-list' });
      for (const asset of listByType('bgm')) {
        const unlocked = data.unlockedBgm.includes(asset.id);
        bgmList.append(
          el(
            'div',
            { class: `bgm-row${unlocked ? '' : ' locked'}` },
            el('span', { textContent: unlocked ? asset.id : '— — —' }),
            unlocked ? button('再生', () => this.audio.playBgm(asset.id)) : el('span', { textContent: '' }),
          ),
        );
      }

      body.append(
        el('h3', { textContent: `CG (${data.unlockedCg.length}/${listByType('cg').length})` }),
        cgGrid,
        el('h3', { textContent: `BGM (${data.unlockedBgm.length}/${listByType('bgm').length})` }),
        bgmList,
        el('div', { class: 'overlay-actions' }, button('BGMを止める', () => this.audio.playBgm('bgm_title'))),
      );
    });
  }

  private openImageViewer(assetId: string, variant?: string): void {
    const url = resolveAsset(assetId, variant);
    if (!url) return;
    const viewer = el('div', { class: 'image-viewer' }, el('img', { src: url, alt: assetId }));
    viewer.addEventListener('click', () => viewer.remove());
    this.rootEl.append(viewer);
  }

  private openEndingList(): void {
    this.openOverlay('エンディング一覧', (body) => {
      const data = this.persistent.snapshot;
      const list = el('div', { class: 'ending-list' });
      for (const id of ENDING_IDS) {
        const unlocked = data.unlockedEndings.includes(id);
        list.append(
          el('div', {
            class: `ending-row${unlocked ? ' unlocked' : ''}`,
            textContent: unlocked ? ENDING_TITLES[id] : '— — — — —',
          }),
        );
      }
      body.append(
        el('p', { class: 'muted', textContent: `${data.unlockedEndings.length} / ${ENDING_IDS.length} 到達` }),
        list,
      );
    });
  }

  /** 到達済みシーンのみを表示する分岐図。 */
  private openRouteMap(): void {
    this.openOverlay('ルート分岐図', (body) => {
      const visited = new Set(this.persistent.snapshot.visitedScenes);
      const byChapter = new Map<number, string[]>();
      for (const scene of allScenes()) {
        const list = byChapter.get(scene.chapter) ?? [];
        list.push(scene.id);
        byChapter.set(scene.chapter, list);
      }

      const wrap = el('div', { class: 'routemap' });
      for (const [chapter, ids] of [...byChapter.entries()].sort((a, b) => a[0] - b[0])) {
        const row = el('div', { class: 'route-chapter' }, el('h4', { textContent: chapter === 0 ? 'プロローグ' : `第${chapter}章` }));
        const nodes = el('div', { class: 'route-nodes' });
        for (const id of ids) {
          const seen = visited.has(id);
          const scene = getScene(id);
          const branches = scene ? outgoingLinks(scene).length : 0;
          nodes.append(
            el('div', {
              class: `route-node${seen ? ' visited' : ''}${branches > 1 ? ' branch' : ''}`,
              textContent: seen ? id : '???',
              title: seen && branches > 1 ? `分岐 ${branches}` : '',
            }),
          );
        }
        row.append(nodes);
        wrap.append(row);
      }

      body.append(
        el('p', {
          class: 'muted',
          textContent: `到達 ${visited.size} / ${allScenes().length} シーン（未到達は伏せられます）`,
        }),
        wrap,
      );
    });
  }

  // ---------------------------------------------------------------- オーバーレイ

  private openOverlay(title: string, build: (body: HTMLElement) => void, closable = true): void {
    this.overlayOpen = true;
    this.overlayClosable = closable;
    this.setAuto(false);
    this.setSkip(false);
    clear(this.overlayEl);

    const body = el('div', { class: 'overlay-body' });
    build(body);

    const panel = el(
      'div',
      { class: 'overlay-panel' },
      el('div', { class: 'overlay-header' }, el('h2', { textContent: title })),
      body,
    );
    if (closable) {
      panel.querySelector('.overlay-header')?.append(button('×', () => this.closeOverlay(), 'close-btn'));
    }

    this.overlayEl.append(panel);
    this.overlayEl.classList.remove('hidden');
  }

  private closeOverlay(): void {
    this.overlayOpen = false;
    this.overlayClosable = true;
    this.overlayEl.classList.add('hidden');
    clear(this.overlayEl);
  }

  private confirmReturnTitle(): void {
    this.openOverlay('タイトルへ戻る', (body) => {
      body.append(
        el('p', { textContent: 'タイトルへ戻ります。保存していない進行は失われます。' }),
        el(
          'div',
          { class: 'overlay-actions' },
          button(
            '戻る',
            () => {
              this.closeOverlay();
              this.showTitle();
            },
            'primary',
          ),
          button('やめる', () => this.closeOverlay()),
        ),
      );
    });
  }
}

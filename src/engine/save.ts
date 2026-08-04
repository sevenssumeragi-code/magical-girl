/** localStorage によるセーブ／設定／周回データの永続化。 */

import type { BacklogEntry, EndingId, GameState, PersistentData, SaveSlot, Settings } from './types';

const PREFIX = 'yohaku:';
const SLOT_KEY = (slot: number | 'auto') => `${PREFIX}save:${slot}`;
const SETTINGS_KEY = `${PREFIX}settings`;
const PERSISTENT_KEY = `${PREFIX}persistent`;

export const SAVE_SLOTS = [1, 2, 3] as const;
export type SlotId = (typeof SAVE_SLOTS)[number] | 'auto';

export const DEFAULT_SETTINGS: Settings = {
  textSpeed: 30,
  autoSpeed: 1400,
  bgmVolume: 0.6,
  seVolume: 0.7,
  skipUnreadToo: false,
};

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn('[save] 保存に失敗しました', error);
  }
}

// ---------------------------------------------------------------- セーブ

export function saveSlot(slot: SlotId, state: GameState, backlog: BacklogEntry[], label: string): void {
  const payload: SaveSlot = { state, backlog: backlog.slice(-100), savedAt: Date.now(), label };
  write(SLOT_KEY(slot), payload);
}

export function loadSlot(slot: SlotId): SaveSlot | null {
  return read<SaveSlot>(SLOT_KEY(slot));
}

export function clearSlot(slot: SlotId): void {
  localStorage.removeItem(SLOT_KEY(slot));
}

export function listSlots(): Array<{ slot: SlotId; data: SaveSlot | null }> {
  return [...SAVE_SLOTS, 'auto' as const].map((slot) => ({ slot, data: loadSlot(slot) }));
}

// ---------------------------------------------------------------- 設定

export function loadSettings(): Settings {
  return { ...DEFAULT_SETTINGS, ...(read<Partial<Settings>>(SETTINGS_KEY) ?? {}) };
}

export function saveSettings(settings: Settings): void {
  write(SETTINGS_KEY, settings);
}

// ---------------------------------------------------------------- 周回データ

const EMPTY_PERSISTENT: PersistentData = {
  readLines: [],
  unlockedEndings: [],
  unlockedCg: [],
  unlockedBgm: [],
  visitedScenes: [],
  clearedOnce: false,
};

export function loadPersistent(): PersistentData {
  return { ...EMPTY_PERSISTENT, ...(read<Partial<PersistentData>>(PERSISTENT_KEY) ?? {}) };
}

export function savePersistent(data: PersistentData): void {
  write(PERSISTENT_KEY, data);
}

/** 周回データへの追記。既読・回想・分岐図の解放はここに集約する。 */
export class PersistentStore {
  private data: PersistentData;
  private read = new Set<string>();
  private dirty = false;

  constructor(data: PersistentData = loadPersistent()) {
    this.data = data;
    this.read = new Set(data.readLines);
  }

  get snapshot(): PersistentData {
    return this.data;
  }

  isRead(sceneId: string, lineIndex: number): boolean {
    return this.read.has(`${sceneId}:${lineIndex}`);
  }

  markRead(sceneId: string, lineIndex: number): void {
    const key = `${sceneId}:${lineIndex}`;
    if (this.read.has(key)) return;
    this.read.add(key);
    this.dirty = true;
  }

  private push(field: 'unlockedCg' | 'unlockedBgm' | 'visitedScenes', value: string): void {
    if (this.data[field].includes(value)) return;
    this.data[field] = [...this.data[field], value];
    this.dirty = true;
  }

  visitScene(sceneId: string): void {
    this.push('visitedScenes', sceneId);
  }

  unlockCg(id: string): void {
    this.push('unlockedCg', id);
  }

  unlockBgm(id: string): void {
    this.push('unlockedBgm', id);
  }

  unlockEnding(id: EndingId): void {
    if (!this.data.unlockedEndings.includes(id)) {
      this.data.unlockedEndings = [...this.data.unlockedEndings, id];
      this.dirty = true;
    }
    if (!this.data.clearedOnce) {
      this.data.clearedOnce = true;
      this.dirty = true;
    }
  }

  /** 変更があった場合のみ書き出す（毎行の localStorage 書き込みを避ける）。 */
  flush(): void {
    if (!this.dirty) return;
    this.data.readLines = [...this.read];
    savePersistent(this.data);
    this.dirty = false;
  }
}

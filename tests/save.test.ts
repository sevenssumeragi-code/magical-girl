import { beforeEach, describe, expect, it } from 'vitest';
import {
  DEFAULT_SETTINGS,
  PersistentStore,
  clearSlot,
  listSlots,
  loadSettings,
  loadSlot,
  loadPersistent,
  saveSettings,
  saveSlot,
} from '../src/engine/save';
import { applyBond, applyFlags, createInitialState } from '../src/engine/state';
import type { BacklogEntry } from '../src/engine/types';

/** node 環境には localStorage が無いため最小実装を用意する。 */
class MemoryStorage implements Storage {
  private map = new Map<string, string>();
  get length(): number {
    return this.map.size;
  }
  clear(): void {
    this.map.clear();
  }
  getItem(key: string): string | null {
    return this.map.get(key) ?? null;
  }
  key(index: number): string | null {
    return [...this.map.keys()][index] ?? null;
  }
  removeItem(key: string): void {
    this.map.delete(key);
  }
  setItem(key: string, value: string): void {
    this.map.set(key, value);
  }
}

beforeEach(() => {
  globalThis.localStorage = new MemoryStorage();
});

describe('セーブ／ロードの往復', () => {
  it('保存した状態がそのまま復元される', () => {
    let state = createInitialState('テスト');
    state = applyBond(state, { renny: 42, geru: -7 });
    state = applyFlags(state, { neo_deal: true });
    state = { ...state, sceneId: 'ch03_06', lineIndex: 5, taint: 33, betrayer: 'hyu', departed: 'muni' };

    const backlog: BacklogEntry[] = [{ speaker: 'renny', speakerName: 'レニィ', text: 'おはよう' }];
    saveSlot(1, state, backlog, '第三章 ─ 軋む');

    const loaded = loadSlot(1);
    expect(loaded).not.toBeNull();
    expect(loaded?.state).toEqual(state);
    expect(loaded?.backlog).toEqual(backlog);
    expect(loaded?.label).toBe('第三章 ─ 軋む');
    expect(typeof loaded?.savedAt).toBe('number');
  });

  it('バックログは100件までに切り詰められる', () => {
    const backlog: BacklogEntry[] = Array.from({ length: 150 }, (_, i) => ({
      speaker: null,
      speakerName: '',
      text: `line ${i}`,
    }));
    saveSlot(2, createInitialState(), backlog, '');
    const loaded = loadSlot(2);
    expect(loaded?.backlog).toHaveLength(100);
    expect(loaded?.backlog[99]?.text).toBe('line 149');
  });

  it('未使用スロットは null を返す', () => {
    expect(loadSlot(3)).toBeNull();
  });

  it('削除できる', () => {
    saveSlot(1, createInitialState(), [], '');
    expect(loadSlot(1)).not.toBeNull();
    clearSlot(1);
    expect(loadSlot(1)).toBeNull();
  });

  it('スロットは 1/2/3 とオートの4つ', () => {
    const slots = listSlots();
    expect(slots.map((s) => s.slot)).toEqual([1, 2, 3, 'auto']);
  });

  it('オートセーブは独立したスロットに書かれる', () => {
    saveSlot('auto', { ...createInitialState(), sceneId: 'ch02_01' }, [], '');
    saveSlot(1, { ...createInitialState(), sceneId: 'ch05_01' }, [], '');
    expect(loadSlot('auto')?.state.sceneId).toBe('ch02_01');
    expect(loadSlot(1)?.state.sceneId).toBe('ch05_01');
  });

  it('壊れたデータは null として扱い例外を投げない', () => {
    localStorage.setItem('yohaku:save:1', '{ 壊れた JSON');
    expect(() => loadSlot(1)).not.toThrow();
    expect(loadSlot(1)).toBeNull();
  });
});

describe('設定の永続化', () => {
  it('保存していなければ既定値を返す', () => {
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS);
  });

  it('保存した値が復元される', () => {
    saveSettings({ ...DEFAULT_SETTINGS, textSpeed: 90, bgmVolume: 0.1 });
    const loaded = loadSettings();
    expect(loaded.textSpeed).toBe(90);
    expect(loaded.bgmVolume).toBe(0.1);
    expect(loaded.seVolume).toBe(DEFAULT_SETTINGS.seVolume);
  });
});

describe('周回データ', () => {
  it('既読・回想・エンディングが記録され、再読込で復元される', () => {
    const store = new PersistentStore();
    expect(store.isRead('pr_01', 0)).toBe(false);
    store.markRead('pr_01', 0);
    store.unlockCg('cg_01_awakening');
    store.unlockBgm('bgm_prologue');
    store.visitScene('pr_01');
    store.unlockEnding('end_true');
    store.flush();

    const reloaded = new PersistentStore(loadPersistent());
    expect(reloaded.isRead('pr_01', 0)).toBe(true);
    expect(reloaded.snapshot.unlockedCg).toEqual(['cg_01_awakening']);
    expect(reloaded.snapshot.unlockedBgm).toEqual(['bgm_prologue']);
    expect(reloaded.snapshot.visitedScenes).toEqual(['pr_01']);
    expect(reloaded.snapshot.unlockedEndings).toEqual(['end_true']);
    expect(reloaded.snapshot.clearedOnce).toBe(true);
  });

  it('同じ項目を重複して記録しない', () => {
    const store = new PersistentStore();
    store.unlockEnding('end_true');
    store.unlockEnding('end_true');
    store.unlockCg('cg_01_awakening');
    store.unlockCg('cg_01_awakening');
    store.flush();
    expect(store.snapshot.unlockedEndings).toEqual(['end_true']);
    expect(store.snapshot.unlockedCg).toEqual(['cg_01_awakening']);
  });

  it('変更が無ければ書き込まない', () => {
    const store = new PersistentStore();
    store.flush();
    expect(localStorage.getItem('yohaku:persistent')).toBeNull();
  });
});

/**
 * シーン再生の中核。
 *
 * DOM に依存しない。演出（背景・BGM・SE・CG）は副作用ハンドラ経由で外に投げ、
 * 進行そのものは純粋に状態遷移として扱う。これによりテストで通し再生できる。
 */

import { resolveEnding } from './ending';
import { fateFlags, resolveBetrayer, resolveDeparted } from './fate';
import { getScene, requireScene } from './scenario';
import { applyBond, applyFlags, applyTaint, meetsCondition } from './state';
import { speakerName as displayName, expandText } from './characters';
import type { CharacterId, EndingId, GameState, Line, Scene } from './types';

export type Frame =
  | {
      kind: 'text';
      speaker: CharacterId | null;
      speakerName: string;
      expression: string;
      text: string;
      sceneId: string;
      lineIndex: number;
    }
  | {
      kind: 'choice';
      prompt: string;
      options: Array<{ index: number; text: string }>;
      sceneId: string;
      lineIndex: number;
    }
  | { kind: 'ending'; ending: EndingId; sceneId: string }
  | { kind: 'end' };

export interface StageHandlers {
  onBackground?(assetId: string): void;
  onCg?(assetId: string | null, variant?: string): void;
  onBgm?(assetId: string | null): void;
  onSe?(assetId: string): void;
  onSceneEnter?(scene: Scene): void;
}

export class ScenePlayer {
  state: GameState;
  private handlers: StageHandlers;
  private scene: Scene;
  /** 直前に choice を提示した行。choose() の解決に使う。 */
  private pendingChoiceLine: Extract<Line, { type: 'choice' }> | null = null;
  private pendingVisible: number[] = [];

  constructor(state: GameState, handlers: StageHandlers = {}) {
    this.state = state;
    this.handlers = handlers;
    this.scene = requireScene(state.sceneId);
  }

  get currentScene(): Scene {
    return this.scene;
  }

  /** セーブからの復帰時など、シーン先頭の演出を再適用する。 */
  enterScene(scene: Scene, resetIndex = true): void {
    this.scene = scene;
    this.state = { ...this.state, sceneId: scene.id };
    if (resetIndex) this.state = { ...this.state, lineIndex: 0 };
    this.state = { ...this.state, bg: scene.background, cg: null };
    this.handlers.onSceneEnter?.(scene);
    this.handlers.onBackground?.(scene.background);
    this.handlers.onCg?.(null);
    if (scene.bgm !== undefined) {
      this.state = { ...this.state, bgm: scene.bgm };
      this.handlers.onBgm?.(scene.bgm);
    }
  }

  /** 現在の背景・CG・BGMを再適用する（ロード直後の画面復元用）。 */
  restoreStage(): void {
    this.handlers.onBackground?.(this.state.bg);
    this.handlers.onCg?.(this.state.cg);
    this.handlers.onBgm?.(this.state.bgm);
  }

  /**
   * 次に表示すべきフレームまで進める。
   * 演出・フラグ・絆値などの非表示行はここで消化する。
   */
  next(): Frame {
    // 安全弁: 条件不成立の行を延々と読み飛ばす場合の暴走を防ぐ。
    for (let guard = 0; guard < 100_000; guard += 1) {
      if (this.state.lineIndex >= this.scene.lines.length) {
        const advanced = this.gotoNextScene();
        if (advanced) continue;
        return this.scene.ending
          ? { kind: 'ending', ending: this.scene.ending, sceneId: this.scene.id }
          : { kind: 'end' };
      }

      const line = this.scene.lines[this.state.lineIndex] as Line;
      const index = this.state.lineIndex;

      if (!meetsCondition(this.state, line.requires)) {
        this.state = { ...this.state, lineIndex: index + 1 };
        continue;
      }

      const frame = this.applyLine(line, index);
      if (frame) return frame;
    }
    throw new Error(`シーン ${this.scene.id} の再生が収束しませんでした`);
  }

  /**
   * 1行を処理する。表示を伴う行ならフレームを返し、
   * 演出・状態変化のみの行なら null を返して次の行へ進める。
   */
  private applyLine(line: Line, index: number): Frame | null {
    const advance = () => {
      this.state = { ...this.state, lineIndex: index + 1 };
    };

    switch (line.type) {
      case 'narration':
        advance();
        return {
          kind: 'text',
          speaker: null,
          speakerName: '',
          expression: 'normal',
          text: expandText(line.text, this.state.playerName),
          sceneId: this.scene.id,
          lineIndex: index,
        };

      case 'dialogue':
        advance();
        return {
          kind: 'text',
          speaker: line.speaker,
          speakerName: displayName(line.speaker, this.state.playerName),
          expression: line.expression ?? 'normal',
          text: expandText(line.text, this.state.playerName),
          sceneId: this.scene.id,
          lineIndex: index,
        };

      case 'choice': {
        const visible = line.options
          .map((option, i) => ({ option, i }))
          .filter(({ option }) => meetsCondition(this.state, option.requires));

        // 条件付き選択肢が全て消えた場合は選択自体を飛ばす（行き止まりを作らない）。
        if (visible.length === 0) {
          advance();
          return null;
        }

        this.pendingChoiceLine = line;
        this.pendingVisible = visible.map(({ i }) => i);
        return {
          kind: 'choice',
          prompt: expandText(line.prompt, this.state.playerName),
          options: visible.map(({ option, i }) => ({
            index: i,
            text: expandText(option.text, this.state.playerName),
          })),
          sceneId: this.scene.id,
          lineIndex: index,
        };
      }

      case 'bg':
        this.state = { ...this.state, bg: line.asset, cg: null };
        this.handlers.onBackground?.(line.asset);
        this.handlers.onCg?.(null);
        advance();
        return null;

      case 'cg':
        this.state = { ...this.state, cg: line.asset };
        this.handlers.onCg?.(line.asset, line.variant);
        advance();
        return null;

      case 'bgm':
        this.state = { ...this.state, bgm: line.asset };
        this.handlers.onBgm?.(line.asset);
        advance();
        return null;

      case 'sfx':
        this.handlers.onSe?.(line.asset);
        advance();
        return null;

      case 'flag':
        this.state = applyFlags(this.state, line.set);
        advance();
        return null;

      case 'bond':
        this.state = applyBond(this.state, line.delta);
        advance();
        return null;

      case 'taint':
        this.state = applyTaint(this.state, line.delta);
        advance();
        return null;

      case 'resolveFate': {
        if (line.what === 'betrayer') {
          const betrayer = resolveBetrayer(this.state);
          this.state = applyFlags({ ...this.state, betrayer }, { betrayal_completed: true });
        } else {
          const departed = resolveDeparted(this.state);
          this.state = applyFlags({ ...this.state, departed }, fateFlags(departed));
        }
        advance();
        return null;
      }

      case 'resolveEnding': {
        const ending = resolveEnding(this.state);
        this.jumpTo(ending);
        return null;
      }
    }
  }

  /** 選択肢を確定する。visible な選択肢のインデックスのみ受け付ける。 */
  choose(optionIndex: number): void {
    const line = this.pendingChoiceLine;
    if (!line) throw new Error('選択肢が提示されていません');
    if (!this.pendingVisible.includes(optionIndex)) {
      throw new Error(`選択できない選択肢です: ${optionIndex}`);
    }

    const option = line.options[optionIndex];
    if (!option) throw new Error(`存在しない選択肢です: ${optionIndex}`);

    if (option.bond) this.state = applyBond(this.state, option.bond);
    if (option.flags) this.state = applyFlags(this.state, option.flags);
    if (typeof option.taint === 'number') this.state = applyTaint(this.state, option.taint);
    if (option.record) this.state = { ...this.state, finalChoice: option.record };

    this.pendingChoiceLine = null;
    this.pendingVisible = [];

    if (option.next) {
      this.jumpTo(option.next);
    } else {
      this.state = { ...this.state, lineIndex: this.state.lineIndex + 1 };
    }
  }

  jumpTo(sceneId: string): void {
    const scene = getScene(sceneId);
    if (!scene) throw new Error(`遷移先シーンが存在しません: ${sceneId}`);
    this.enterScene(scene);
  }

  /** シーン末尾に達したときの遷移。次が無ければ false。 */
  private gotoNextScene(): boolean {
    if (!this.scene.next) return false;
    this.jumpTo(this.scene.next);
    return true;
  }
}

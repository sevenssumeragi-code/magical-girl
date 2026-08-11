import { describe, expect, it } from 'vitest';
import { ScenePlayer, type Frame } from '../src/engine/player';
import { createInitialState } from '../src/engine/state';
import { ENDING_IDS, type EndingId, type GameState } from '../src/engine/types';

interface Result {
  ending: EndingId | null;
  state: GameState;
  visited: string[];
  choices: number;
  textLines: number;
}

/**
 * 通しで再生する。choose は提示された選択肢から1つ選ぶ関数。
 * 無限ループを避けるため上限ステップを設ける。
 */
function playthrough(choose: (frame: Extract<Frame, { kind: 'choice' }>) => number, maxSteps = 20_000): Result {
  const visited: string[] = [];
  const player = new ScenePlayer(createInitialState('テスト'), {
    onSceneEnter: (scene) => visited.push(scene.id),
  });
  player.enterScene(player.currentScene);

  let choices = 0;
  let textLines = 0;

  for (let i = 0; i < maxSteps; i += 1) {
    const frame = player.next();
    if (frame.kind === 'text') {
      textLines += 1;
      continue;
    }
    if (frame.kind === 'choice') {
      choices += 1;
      player.choose(choose(frame));
      continue;
    }
    return {
      ending: frame.kind === 'ending' ? frame.ending : null,
      state: player.state,
      visited,
      choices,
      textLines,
    };
  }
  throw new Error('通し再生が終了しませんでした（無限ループの可能性）');
}

describe('通し再生', () => {
  it('常に最初の選択肢を選んでもエンディングに到達する', () => {
    const result = playthrough((frame) => frame.options[0]!.index);
    expect(result.ending).not.toBeNull();
    expect(ENDING_IDS).toContain(result.ending);
  });

  it('常に最後の選択肢を選んでもエンディングに到達する', () => {
    const result = playthrough((frame) => frame.options[frame.options.length - 1]!.index);
    expect(result.ending).not.toBeNull();
    expect(ENDING_IDS).toContain(result.ending);
  });

  it('一周で本編70シーンを通過する（最終選択で分岐する2シーンを除く）', () => {
    const result = playthrough((frame) => frame.options[0]!.index);
    // 本編は72シーン。うち ch05_11 / ch05_12 / ch05_13 は最終選択(C36)で
    // どれか1つだけを通るため、一周で到達するのは 72 - 2 = 70。
    const mainRoute = new Set(result.visited.filter((id) => !id.startsWith('end_')));
    expect(mainRoute.size).toBe(70);
    const convergence = ['ch05_11', 'ch05_12', 'ch05_13'].filter((id) => mainRoute.has(id));
    expect(convergence).toHaveLength(1);
  });

  it('最終選択の分岐先が、選び方を変えると入れ替わる', () => {
    const first = playthrough((frame) => frame.options[0]!.index);
    const last = playthrough((frame) => frame.options[frame.options.length - 1]!.index);
    const pick = (r: Result) =>
      ['ch05_11', 'ch05_12', 'ch05_13'].find((id) => r.visited.includes(id));
    expect(pick(first)).toBe('ch05_11');
    expect(pick(last)).not.toBe('ch05_11');
  });

  it('裏切り者と決別者が必ず1人ずつ確定する', () => {
    const result = playthrough((frame) => frame.options[0]!.index);
    expect(['hyu', 'jinpachi', 'neo']).toContain(result.state.betrayer);
    expect(['muni', 'renny', 'geru']).toContain(result.state.departed);
    expect(result.state.flags.betrayal_completed).toBe(true);
  });

  it('4種の真相フラグのうち、必ず取得されるものが立っている', () => {
    const result = playthrough((frame) => frame.options[0]!.index);
    // truth_wish / truth_material / truth_neo_origin は本編必須ルート上にある。
    expect(result.state.flags.truth_wish).toBe(true);
    expect(result.state.flags.truth_material).toBe(true);
    expect(result.state.flags.truth_neo_origin).toBe(true);
  });

  it('選択肢が想定数（36）提示される', () => {
    const result = playthrough((frame) => frame.options[0]!.index);
    expect(result.choices).toBe(36);
  });

  it('プレイヤー名が地の文・台詞に反映される', () => {
    const player = new ScenePlayer(createInitialState('ユキ'));
    expect(player.state.playerName).toBe('ユキ');
  });

  it('存在しないシーンへの遷移は例外になる', () => {
    const player = new ScenePlayer(createInitialState());
    expect(() => player.jumpTo('nonexistent_scene')).toThrow(/遷移先シーンが存在しません/);
  });

  it('提示されていない選択肢は選べない', () => {
    const player = new ScenePlayer(createInitialState());
    expect(() => player.choose(0)).toThrow(/選択肢が提示されていません/);
  });
});

import { describe, expect, it } from 'vitest';
import { ScenePlayer } from '../src/engine/player';
import { createInitialState } from '../src/engine/state';
import { BOND_IDS, ENDING_IDS, type EndingId, type GameState } from '../src/engine/types';

/**
 * 8エンディングの到達性を、実際の通し再生で保証する。
 *
 * 判定式の単体テスト（ending.test.ts）は「その状態ならこの結末になる」ことしか
 * 見ない。ここでは「本編の選択肢だけで、その状態に到達できるか」を検証する。
 * 選択肢の重みを変えたときに、どれかの結末が到達不能になる事故を防ぐための番人。
 *
 * 各シードは、乱択探索でそのエンディングに到達することが確認済みの再現値。
 */

const SEEDS: Record<EndingId, number> = {
  end_good_a: 0,
  end_normal: 1,
  end_good_b: 2,
  end_secret: 11,
  end_bad_a: 17,
  end_bad_c: 31,
  end_bad_b: 80,
  end_true: 224,
};

function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function play(seed: number): { ending: EndingId | null; state: GameState; choices: number } {
  const rng = mulberry32(seed);
  const player = new ScenePlayer(createInitialState('テスト'));
  player.enterScene(player.currentScene);
  let choices = 0;

  for (let step = 0; step < 20_000; step += 1) {
    const frame = player.next();
    if (frame.kind === 'text') continue;
    if (frame.kind === 'choice') {
      const option = frame.options[Math.floor(rng() * frame.options.length)]!;
      player.choose(option.index);
      choices += 1;
      continue;
    }
    return { ending: frame.kind === 'ending' ? frame.ending : null, state: player.state, choices };
  }
  throw new Error('通し再生が終了しませんでした');
}

describe('8エンディングの到達性', () => {
  for (const id of ENDING_IDS) {
    it(`${id} に到達できる`, () => {
      const { ending, state, choices } = play(SEEDS[id]);
      expect(ending).toBe(id);
      expect(choices).toBeGreaterThan(0);
      // 到達時の状態が判定条件と矛盾していないことも見ておく。
      expect(state.betrayer).not.toBeNull();
      expect(state.departed).not.toBeNull();
    });
  }

  it('8種すべてが別々の結末として到達する', () => {
    const results = ENDING_IDS.map((id) => play(SEEDS[id]).ending);
    expect(new Set(results).size).toBe(ENDING_IDS.length);
  });

  it('TRUE 到達時は真相4種すべてと信頼4人以上を満たす', () => {
    const { state } = play(SEEDS.end_true);
    for (const flag of ['truth_wish', 'truth_material', 'truth_haru_blank', 'truth_neo_origin']) {
      expect(state.flags[flag]).toBe(true);
    }
    expect(BOND_IDS.filter((b) => state.bond[b] >= 60).length).toBeGreaterThanOrEqual(4);
    expect(state.flags.muni_alive).toBe(true);
  });

  it('SECRET 到達時はネオとの絆90以上と外環ルートを満たす', () => {
    const { state } = play(SEEDS.end_secret);
    expect(state.bond.neo).toBeGreaterThanOrEqual(90);
    expect(state.flags.neo_route).toBe(true);
  });
});

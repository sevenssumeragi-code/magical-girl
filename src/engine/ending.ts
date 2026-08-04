/**
 * エンディング判定。docs/PLOT.md §6 の優先順表を実装する。
 *
 * 優先順は「BAD系を先に評価する」。絆値が高くても翳が満ちていれば破滅する、
 * という因果を成立させるため。どの条件にも該当しない場合は end_normal に
 * フォールバックし、到達不能状態を作らない。
 */

import { BOND_IDS, type EndingId, type GameState } from './types';

/** 真相フラグ。end_true は全取得が必須。 */
export const TRUTH_FLAGS = [
  'truth_wish',
  'truth_material',
  'truth_haru_blank',
  'truth_neo_origin',
] as const;

export function truthCount(state: GameState): number {
  return TRUTH_FLAGS.filter((f) => state.flags[f]).length;
}

/** 絆値が閾値（既定60=信頼）以上の人数。 */
export function trustedCount(state: GameState, threshold = 60): number {
  return BOND_IDS.filter((id) => state.bond[id] >= threshold).length;
}

export function bondTotal(state: GameState): number {
  return BOND_IDS.reduce((sum, id) => sum + state.bond[id], 0);
}

export function resolveEnding(state: GameState): EndingId {
  const truths = truthCount(state);
  const trusted = trustedCount(state);
  const total = bondTotal(state);

  // 1. SECRET: ネオと最も深く結び、その正体を知り、共に外環へ行く道を選んだ
  if (state.bond.neo >= 90 && state.flags.neo_identity_revealed && state.flags.neo_route) {
    return 'end_secret';
  }

  // 2. BAD C: 翳が満ちた（墜化）
  if (state.taint >= 100) return 'end_bad_c';

  // 3. BAD A: 誰かとの絆が決裂した状態で裏切りが実行された
  if (BOND_IDS.some((id) => state.bond[id] <= -1) && state.flags.betrayal_completed) {
    return 'end_bad_a';
  }

  // 4. BAD B: 誰一人として信頼に至らなかった
  if (trusted === 0) return 'end_bad_b';

  // 5. TRUE: 真相を全て掴み、4人以上と信頼を結び、ムニが健在
  if (truths === TRUTH_FLAGS.length && trusted >= 4 && state.flags.muni_alive) {
    return 'end_true';
  }

  // 6. GOOD A: 3人以上と信頼を結び、真相の過半を掴んだ
  if (trusted >= 3 && truths > TRUTH_FLAGS.length / 2) return 'end_good_a';

  // 7. GOOD B: 絆の総量は足りたが、真相には辿り着けなかった
  if (total >= 200 && truths < TRUTH_FLAGS.length) return 'end_good_b';

  // 8. NORMAL: 上記いずれも満たさない場合のフォールバック
  return 'end_normal';
}

/** エンディングの表示名。 */
export const ENDING_TITLES: Record<EndingId, string> = {
  end_true: 'TRUE END「余白に灯る」',
  end_good_a: 'GOOD END「明けの星」',
  end_good_b: 'GOOD END「受け継ぐ手」',
  end_normal: 'NORMAL END「続く朝」',
  end_bad_a: 'BAD END「刃の理由」',
  end_bad_b: 'BAD END「独りの灯守」',
  end_bad_c: 'BAD END「墜ちる」',
  end_secret: 'SECRET END「外環の剣」',
};

import { describe, expect, it } from 'vitest';
import { TRUTH_FLAGS, bondTotal, resolveEnding, trustedCount } from '../src/engine/ending';
import { createInitialState } from '../src/engine/state';
import { BOND_IDS, type BondId, type GameState } from '../src/engine/types';

/** 指定した人数の絆値を value にした状態を作る。 */
function withBonds(count: number, value: number, base = createInitialState()): GameState {
  const bond = { ...base.bond };
  BOND_IDS.slice(0, count).forEach((id) => {
    bond[id] = value;
  });
  return { ...base, bond };
}

function withTruths(state: GameState, howMany: number): GameState {
  const flags = { ...state.flags };
  TRUTH_FLAGS.slice(0, howMany).forEach((f) => {
    flags[f] = true;
  });
  return { ...state, flags };
}

describe('resolveEnding — 全8分岐', () => {
  it('SECRET: ネオとの絆90以上・正体開示・外環ルート', () => {
    let state = withBonds(6, 100);
    state = withTruths(state, 4);
    state.bond.neo = 90;
    state.flags.neo_identity_revealed = true;
    state.flags.neo_route = true;
    expect(resolveEnding(state)).toBe('end_secret');
  });

  it('BAD C: 翳が満ちた場合は絆値が満点でも優先される', () => {
    let state = withBonds(6, 100);
    state = withTruths(state, 4);
    state.taint = 100;
    expect(resolveEnding(state)).toBe('end_bad_c');
  });

  it('BAD A: 絆値が -1 以下かつ裏切りが成立', () => {
    let state = withBonds(6, 100);
    state = withTruths(state, 4);
    state.bond.hyu = -1;
    state.flags.betrayal_completed = true;
    expect(resolveEnding(state)).toBe('end_bad_a');
  });

  it('BAD A: 裏切りが成立していなければ BAD A にはならない', () => {
    let state = withBonds(6, 100);
    state = withTruths(state, 4);
    state.bond.hyu = -1;
    expect(resolveEnding(state)).not.toBe('end_bad_a');
  });

  it('BAD B: 信頼(60以上)が一人もいない', () => {
    const state = withBonds(6, 59);
    expect(trustedCount(state)).toBe(0);
    expect(resolveEnding(state)).toBe('end_bad_b');
  });

  it('TRUE: 真相全取得・信頼4人以上・ムニ健在', () => {
    let state = withBonds(4, 60);
    state = withTruths(state, 4);
    expect(state.flags.muni_alive).toBe(true);
    expect(resolveEnding(state)).toBe('end_true');
  });

  it('TRUE: ムニが健在でなければ TRUE にならない', () => {
    let state = withBonds(4, 60);
    state = withTruths(state, 4);
    state.flags.muni_alive = false;
    expect(resolveEnding(state)).toBe('end_good_a');
  });

  it('TRUE: 真相が欠けていれば TRUE にならない', () => {
    let state = withBonds(4, 60);
    state = withTruths(state, 3);
    expect(resolveEnding(state)).toBe('end_good_a');
  });

  it('GOOD A: 信頼3人以上・真相の過半(3以上)', () => {
    let state = withBonds(3, 60);
    state = withTruths(state, 3);
    expect(resolveEnding(state)).toBe('end_good_a');
  });

  it('GOOD B: 絆総量200以上だが真相未達', () => {
    // 信頼(60以上)は2人までに抑え、GOOD A の条件を外す。
    const state = createInitialState();
    state.bond.renny = 100;
    state.bond.hyu = 100;
    state.bond.jinpachi = 50;
    expect(trustedCount(state)).toBe(2);
    expect(bondTotal(state)).toBeGreaterThanOrEqual(200);
    expect(resolveEnding(state)).toBe('end_good_b');
  });

  it('NORMAL: どの条件にも当てはまらない場合のフォールバック', () => {
    const state = createInitialState();
    state.bond.renny = 60;
    expect(resolveEnding(state)).toBe('end_normal');
  });

  it('NORMAL: 絆総量が100未満でも到達不能にならない', () => {
    const state = createInitialState();
    state.bond.geru = 60;
    expect(bondTotal(state)).toBeLessThan(100);
    expect(resolveEnding(state)).toBe('end_normal');
  });
});

describe('補助関数', () => {
  it('trustedCount は閾値60を境界に数える', () => {
    const state = createInitialState();
    (['renny', 'hyu'] as BondId[]).forEach((id) => {
      state.bond[id] = 60;
    });
    state.bond.jinpachi = 59;
    expect(trustedCount(state)).toBe(2);
  });

  it('bondTotal は6人の合計', () => {
    const state = withBonds(6, 10);
    expect(bondTotal(state)).toBe(60);
  });
});

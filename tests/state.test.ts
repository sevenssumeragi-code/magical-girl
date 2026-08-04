import { describe, expect, it } from 'vitest';
import { applyBond, applyFlags, applyTaint, bondRanking, createInitialState, meetsCondition } from '../src/engine/state';
import { BOND_MAX, BOND_MIN, TAINT_MAX, TAINT_MIN, bondTier } from '../src/engine/types';

describe('絆値の境界', () => {
  it('初期値は全員0', () => {
    const state = createInitialState();
    expect(Object.values(state.bond)).toEqual([0, 0, 0, 0, 0, 0]);
  });

  it('上限 100 を超えない', () => {
    const state = applyBond(createInitialState(), { renny: 999 });
    expect(state.bond.renny).toBe(BOND_MAX);
  });

  it('下限 -20 を下回らない', () => {
    const state = applyBond(createInitialState(), { geru: -999 });
    expect(state.bond.geru).toBe(BOND_MIN);
  });

  it('複数キャラを同時に増減できる（トレードオフ）', () => {
    const state = applyBond(createInitialState(), { renny: 6, jinpachi: -3 });
    expect(state.bond.renny).toBe(6);
    expect(state.bond.jinpachi).toBe(-3);
  });

  it('元の状態を破壊しない', () => {
    const before = createInitialState();
    applyBond(before, { renny: 10 });
    expect(before.bond.renny).toBe(0);
  });

  it('段階の閾値: 60=信頼 / 30=良好 / 0=中立 / -1=不和', () => {
    expect(bondTier(60)).toBe('trust');
    expect(bondTier(59)).toBe('good');
    expect(bondTier(30)).toBe('good');
    expect(bondTier(29)).toBe('neutral');
    expect(bondTier(0)).toBe('neutral');
    expect(bondTier(-1)).toBe('discord');
  });
});

describe('翳の境界', () => {
  it('0 を下回らない', () => {
    expect(applyTaint(createInitialState(), -50).taint).toBe(TAINT_MIN);
  });

  it('100 を超えない', () => {
    expect(applyTaint(createInitialState(), 500).taint).toBe(TAINT_MAX);
  });
});

describe('meetsCondition', () => {
  it('条件未指定なら常に真', () => {
    expect(meetsCondition(createInitialState())).toBe(true);
  });

  it('フラグの一致を見る', () => {
    const state = applyFlags(createInitialState(), { neo_deal: true });
    expect(meetsCondition(state, { flags: { neo_deal: true } })).toBe(true);
    expect(meetsCondition(state, { flags: { neo_deal: false } })).toBe(false);
  });

  it('未設定のフラグは false として扱う', () => {
    expect(meetsCondition(createInitialState(), { flags: { neo_deal: false } })).toBe(true);
  });

  it('bondAtLeast / bondBelow', () => {
    const state = applyBond(createInitialState(), { geru: 60 });
    expect(meetsCondition(state, { bondAtLeast: { geru: 60 } })).toBe(true);
    expect(meetsCondition(state, { bondAtLeast: { geru: 61 } })).toBe(false);
    expect(meetsCondition(state, { bondBelow: { geru: 60 } })).toBe(false);
    expect(meetsCondition(state, { bondBelow: { geru: 61 } })).toBe(true);
  });

  it('複数条件は全て満たす必要がある', () => {
    const state = applyBond(applyFlags(createInitialState(), { neo_deal: true }), { neo: 90 });
    expect(meetsCondition(state, { flags: { neo_deal: true }, bondAtLeast: { neo: 90 } })).toBe(true);
    expect(meetsCondition(state, { flags: { neo_deal: true }, bondAtLeast: { neo: 91 } })).toBe(false);
  });

  it('taintAtLeast / betrayerIs / departedIs', () => {
    const state = { ...applyTaint(createInitialState(), 50), betrayer: 'hyu' as const, departed: 'muni' as const };
    expect(meetsCondition(state, { taintAtLeast: 50 })).toBe(true);
    expect(meetsCondition(state, { taintAtLeast: 51 })).toBe(false);
    expect(meetsCondition(state, { betrayerIs: 'hyu' })).toBe(true);
    expect(meetsCondition(state, { betrayerIs: 'neo' })).toBe(false);
    expect(meetsCondition(state, { departedIs: 'muni' })).toBe(true);
    expect(meetsCondition(state, { departedIs: 'geru' })).toBe(false);
  });
});

describe('bondRanking', () => {
  it('絆値の高い順に並ぶ', () => {
    const state = applyBond(createInitialState(), { geru: 50, neo: 30, muni: 70 });
    expect(bondRanking(state).slice(0, 3)).toEqual(['muni', 'geru', 'neo']);
  });
});

import { describe, expect, it } from 'vitest';
import { fateFlags, resolveBetrayer, resolveDeparted } from '../src/engine/fate';
import { createInitialState } from '../src/engine/state';

describe('resolveBetrayer — 裏切り者の決定', () => {
  it('燼核を独占しており絆値50未満ならヒュウで確定', () => {
    const state = createInitialState();
    state.flags.hyu_hoarded = true;
    state.bond.hyu = 49;
    state.bond.jinpachi = -20;
    state.bond.neo = -20;
    expect(resolveBetrayer(state)).toBe('hyu');
  });

  it('独占していても絆値50以上なら通常判定に戻る', () => {
    const state = createInitialState();
    state.flags.hyu_hoarded = true;
    state.bond.hyu = 50;
    state.bond.jinpachi = 10;
    state.bond.neo = -5;
    expect(resolveBetrayer(state)).toBe('neo');
  });

  it('絆値が最も低い者が裏切る（ジンパチ）', () => {
    const state = createInitialState();
    state.bond.hyu = 40;
    state.bond.jinpachi = -10;
    state.bond.neo = 20;
    expect(resolveBetrayer(state)).toBe('jinpachi');
  });

  it('絆値が最も低い者が裏切る（ネオ）', () => {
    const state = createInitialState();
    state.bond.hyu = 30;
    state.bond.jinpachi = 30;
    state.bond.neo = 0;
    expect(resolveBetrayer(state)).toBe('neo');
  });

  it('同値の場合は hyu > jinpachi > neo の優先順', () => {
    const state = createInitialState();
    expect(state.bond.hyu).toBe(state.bond.jinpachi);
    expect(resolveBetrayer(state)).toBe('hyu');
  });

  it('名を贈られたジンパチは選ばれにくくなる', () => {
    const state = createInitialState();
    state.bond.hyu = 20;
    state.bond.jinpachi = 10;
    state.bond.neo = 25;
    expect(resolveBetrayer(state)).toBe('jinpachi');

    state.flags.named_jinpachi = true; // +15
    expect(resolveBetrayer(state)).toBe('hyu');
  });

  it('本音に応えた場合も同様に補正される', () => {
    const state = createInitialState();
    state.bond.hyu = 30;
    state.bond.jinpachi = 20;
    state.bond.neo = 40;
    state.flags.jinpachi_bond_deep = true; // +15
    expect(resolveBetrayer(state)).toBe('hyu');
  });

  it('必ず3人のいずれかを返す', () => {
    const state = createInitialState();
    expect(['hyu', 'jinpachi', 'neo']).toContain(resolveBetrayer(state));
  });
});

describe('resolveDeparted — 決別者の決定', () => {
  it('ムニの絆値が50未満ならムニ', () => {
    const state = createInitialState();
    state.bond.muni = 49;
    state.bond.renny = 100;
    expect(resolveDeparted(state)).toBe('muni');
  });

  it('ムニが50以上でレニィが50未満ならレニィ', () => {
    const state = createInitialState();
    state.bond.muni = 50;
    state.bond.renny = 49;
    expect(resolveDeparted(state)).toBe('renny');
  });

  it('両者50以上ならゲルが引き受ける', () => {
    const state = createInitialState();
    state.bond.muni = 50;
    state.bond.renny = 50;
    expect(resolveDeparted(state)).toBe('geru');
  });

  it('必ず3人のいずれかを返す', () => {
    const state = createInitialState();
    expect(['muni', 'renny', 'geru']).toContain(resolveDeparted(state));
  });
});

describe('fateFlags — 決別に伴う生存フラグ', () => {
  it('ムニが決別した場合', () => {
    expect(fateFlags('muni')).toEqual({ muni_alive: false, renny_alive: true, geru_departed: false });
  });

  it('レニィが決別した場合', () => {
    expect(fateFlags('renny')).toEqual({ muni_alive: true, renny_alive: false, geru_departed: false });
  });

  it('ゲルが決別した場合、ムニもレニィも健在', () => {
    expect(fateFlags('geru')).toEqual({ muni_alive: true, renny_alive: true, geru_departed: true });
  });
});

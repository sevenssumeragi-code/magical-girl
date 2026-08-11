/** ゲーム状態の生成と更新。副作用を持たない純関数として実装する。 */

import {
  BOND_IDS,
  BOND_MAX,
  BOND_MIN,
  TAINT_MAX,
  TAINT_MIN,
  type BondDelta,
  type BondId,
  type Condition,
  type GameState,
} from './types';

export const DEFAULT_PLAYER_NAME = 'ハル';
export const START_SCENE = 'pr_01';

export function createInitialState(playerName = DEFAULT_PLAYER_NAME): GameState {
  return {
    playerName: playerName.trim() || DEFAULT_PLAYER_NAME,
    sceneId: START_SCENE,
    lineIndex: 0,
    bond: { renny: 0, hyu: 0, jinpachi: 0, muni: 0, geru: 0, neo: 0 },
    taint: 0,
    flags: {
      // 生存フラグは初期 true。決別が確定した時点で false になる。
      muni_alive: true,
      renny_alive: true,
    },
    betrayer: null,
    departed: null,
    finalChoice: null,
    cg: null,
    bg: 'bg_ruin_street_night',
    bgm: null,
  };
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

export function applyBond(state: GameState, delta: BondDelta): GameState {
  const bond = { ...state.bond };
  for (const id of BOND_IDS) {
    const d = delta[id];
    if (typeof d === 'number') bond[id] = clamp(bond[id] + d, BOND_MIN, BOND_MAX);
  }
  return { ...state, bond };
}

export function applyTaint(state: GameState, delta: number): GameState {
  return { ...state, taint: clamp(state.taint + delta, TAINT_MIN, TAINT_MAX) };
}

export function applyFlags(state: GameState, set: Record<string, boolean>): GameState {
  return { ...state, flags: { ...state.flags, ...set } };
}

/**
 * 表示条件の評価。指定された項目を全て満たす場合に真。
 * 未指定の項目は常に真として扱う。
 */
export function meetsCondition(state: GameState, cond?: Condition): boolean {
  if (!cond) return true;

  if (cond.flags) {
    for (const [key, expected] of Object.entries(cond.flags)) {
      if (Boolean(state.flags[key]) !== expected) return false;
    }
  }
  if (cond.bondAtLeast) {
    for (const id of BOND_IDS) {
      const t = cond.bondAtLeast[id];
      if (typeof t === 'number' && state.bond[id] < t) return false;
    }
  }
  if (cond.bondBelow) {
    for (const id of BOND_IDS) {
      const t = cond.bondBelow[id];
      if (typeof t === 'number' && state.bond[id] >= t) return false;
    }
  }
  if (typeof cond.taintAtLeast === 'number' && state.taint < cond.taintAtLeast) return false;
  if (cond.betrayerIs && state.betrayer !== cond.betrayerIs) return false;
  if (cond.departedIs && state.departed !== cond.departedIs) return false;

  return true;
}

/** 絆値の高い順に並べたキャラクターID。同値なら BOND_IDS の順。 */
export function bondRanking(state: GameState): BondId[] {
  return [...BOND_IDS].sort((a, b) => state.bond[b] - state.bond[a]);
}

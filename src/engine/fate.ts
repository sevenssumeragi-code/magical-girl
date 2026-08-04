/**
 * 裏切り者・決別者の決定ロジック。
 *
 * 仕様: 6人のうち「1人は必ず裏切り、1人は必ず離脱する」。
 * 誰が該当するかは固定せず、絆値とフラグから算出する（docs/PLOT.md §4）。
 * 純関数として実装し、全分岐に単体テストを課す。
 */

import type { BetrayerId, DepartedId, GameState } from './types';

/** 同値の場合の優先順。先頭ほど裏切りやすい。 */
const BETRAYER_PRIORITY: BetrayerId[] = ['hyu', 'jinpachi', 'neo'];

/**
 * 裏切り者を決定する（第4章 ch04_11）。
 *
 * - ヒュウが燼核を独占しており、かつ絆値が50未満なら必ずヒュウ。
 * - それ以外は hyu / jinpachi / neo のうち絆値が最も低い者。
 *   同値の場合は BETRAYER_PRIORITY の順。
 * - ジンパチは名を贈られている、または本音に応えられている場合、
 *   判定用の絆値に下駄を履かせて選ばれにくくする。
 */
export function resolveBetrayer(state: GameState): BetrayerId {
  const { bond, flags } = state;

  if (flags.hyu_hoarded && bond.hyu < 50) return 'hyu';

  const jinpachiBonus = (flags.named_jinpachi ? 15 : 0) + (flags.jinpachi_bond_deep ? 15 : 0);
  const effective: Record<BetrayerId, number> = {
    hyu: bond.hyu,
    jinpachi: bond.jinpachi + jinpachiBonus,
    neo: bond.neo,
  };

  let chosen = BETRAYER_PRIORITY[0] as BetrayerId;
  for (const id of BETRAYER_PRIORITY) {
    if (effective[id] < effective[chosen]) chosen = id;
  }
  return chosen;
}

/**
 * 決別者を決定する（第4章 ch04_12）。
 *
 * - ムニの絆値が50未満なら、存在を維持できずムニが消える。
 * - 次にレニィが50未満なら、レニィが自ら真実を選んで消える。
 * - どちらも満たされているなら、ゲルが単身で墜化を引き受けに行く。
 */
export function resolveDeparted(state: GameState): DepartedId {
  const { bond } = state;
  if (bond.muni < 50) return 'muni';
  if (bond.renny < 50) return 'renny';
  return 'geru';
}

/** 決別の確定に伴って更新される生存フラグ。 */
export function fateFlags(departed: DepartedId): Record<string, boolean> {
  return {
    muni_alive: departed !== 'muni',
    renny_alive: departed !== 'renny',
    geru_departed: departed === 'geru',
  };
}

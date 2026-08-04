/** シナリオデータとゲーム状態の型定義。 */

export const BOND_IDS = ['renny', 'hyu', 'jinpachi', 'muni', 'geru', 'neo'] as const;
export type BondId = (typeof BOND_IDS)[number];

export type CharacterId = BondId | 'haru' | 'shell';

export type BetrayerId = 'hyu' | 'jinpachi' | 'neo';
export type DepartedId = 'muni' | 'renny' | 'geru';

export const BOND_MIN = -20;
export const BOND_MAX = 100;
export const TAINT_MIN = 0;
export const TAINT_MAX = 100;

/** 絆値の段階。UIには数値を出さず、この段階を表情で示す。 */
export type BondTier = 'trust' | 'good' | 'neutral' | 'discord';

export function bondTier(value: number): BondTier {
  if (value >= 60) return 'trust';
  if (value >= 30) return 'good';
  if (value >= 0) return 'neutral';
  return 'discord';
}

// ---------------------------------------------------------------- シナリオ

export interface BondDelta {
  renny?: number;
  hyu?: number;
  jinpachi?: number;
  muni?: number;
  geru?: number;
  neo?: number;
}

export interface ChoiceOption {
  text: string;
  bond?: BondDelta;
  flags?: Record<string, boolean>;
  taint?: number;
  /** この選択肢が表示される条件。未指定なら常時表示。 */
  requires?: Condition;
  /** 分岐先シーン。未指定ならシーンの next へ合流する。 */
  next?: string;
  /** finalChoice に記録する値（C36 のみ使用）。 */
  record?: string;
}

/** 表示条件。指定されたものを全て満たす場合に真。 */
export interface Condition {
  flags?: Record<string, boolean>;
  bondAtLeast?: BondDelta;
  bondBelow?: BondDelta;
  taintAtLeast?: number;
  betrayerIs?: BetrayerId;
  departedIs?: DepartedId;
}

export type Line =
  | { type: 'narration'; text: string; requires?: Condition }
  | {
      type: 'dialogue';
      speaker: CharacterId;
      expression?: string;
      voice?: string | null;
      text: string;
      requires?: Condition;
    }
  | { type: 'bg'; asset: string; requires?: Condition }
  | { type: 'bgm'; asset: string | null; requires?: Condition }
  | { type: 'cg'; asset: string | null; variant?: string; requires?: Condition }
  | { type: 'sfx'; asset: string; requires?: Condition }
  | { type: 'flag'; set: Record<string, boolean>; requires?: Condition }
  | { type: 'bond'; delta: BondDelta; requires?: Condition }
  | { type: 'taint'; delta: number; requires?: Condition }
  /** 裏切り者・決別者を状態から確定させる（ch04_11 / ch04_12）。 */
  | { type: 'resolveFate'; what: 'betrayer' | 'departed'; requires?: Condition }
  /** エンディング判定を行い、対応する end_* シーンへ遷移する（ch05_14）。 */
  | { type: 'resolveEnding'; requires?: Condition }
  | { type: 'choice'; prompt: string; options: ChoiceOption[]; requires?: Condition };

export interface Scene {
  id: string;
  chapter: number;
  /** 章タイトル表示を出すシーンのみ指定。 */
  chapterTitle?: string;
  background: string;
  bgm: string | null;
  lines: Line[];
  /** 次のシーン。エンディングシーンでは null。 */
  next: string | null;
  /** エンディングシーンの場合、その識別子。 */
  ending?: EndingId;
}

export type EndingId =
  | 'end_true'
  | 'end_good_a'
  | 'end_good_b'
  | 'end_normal'
  | 'end_bad_a'
  | 'end_bad_b'
  | 'end_bad_c'
  | 'end_secret';

export const ENDING_IDS: EndingId[] = [
  'end_true',
  'end_good_a',
  'end_good_b',
  'end_normal',
  'end_bad_a',
  'end_bad_b',
  'end_bad_c',
  'end_secret',
];

// ---------------------------------------------------------------- 状態

export interface GameState {
  playerName: string;
  sceneId: string;
  lineIndex: number;
  bond: Record<BondId, number>;
  taint: number;
  flags: Record<string, boolean>;
  betrayer: BetrayerId | null;
  departed: DepartedId | null;
  finalChoice: string | null;
  /** 現在表示中のCG（null なら背景表示）。 */
  cg: string | null;
  /** 背景・BGMの現在値（シーン内で変化しうるため保持）。 */
  bg: string;
  bgm: string | null;
}

export interface BacklogEntry {
  speaker: CharacterId | null;
  speakerName: string;
  text: string;
}

/** 周回をまたいで保持される情報。 */
export interface PersistentData {
  /** 既読判定用。`${sceneId}:${lineIndex}` の集合。 */
  readLines: string[];
  /** 到達済みエンディング。 */
  unlockedEndings: EndingId[];
  /** 閲覧済みCG。 */
  unlockedCg: string[];
  /** 再生済みBGM。 */
  unlockedBgm: string[];
  /** 到達済みシーン（ルート分岐図の表示用）。 */
  visitedScenes: string[];
  clearedOnce: boolean;
}

export interface Settings {
  textSpeed: number;
  autoSpeed: number;
  bgmVolume: number;
  seVolume: number;
  skipUnreadToo: boolean;
}

export interface SaveSlot {
  state: GameState;
  backlog: BacklogEntry[];
  savedAt: number;
  label: string;
}

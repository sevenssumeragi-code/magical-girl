/** キャラクターバイブル（content/characters.json）の読み込みと参照。 */

import charactersJson from '../../content/characters.json';
import type { CharacterId } from './types';

export interface CharacterVoice {
  firstPerson: string;
  secondPerson?: string[];
  style: string;
  endings?: string[];
  rareEndings?: { patterns: string[]; frequency: string };
  vocabulary?: string[];
  forbiddenFirstPerson?: string[];
  forbiddenSecondPerson?: string[];
  hardRule?: string;
  differentiation?: string;
}

export interface CharacterDef {
  id: string;
  name: string;
  nameEditable?: boolean;
  maxNameLength?: number;
  role: string;
  hasBond: boolean;
  sex: string;
  age?: number | string;
  appearance: Record<string, string>;
  voice: CharacterVoice;
  calls?: Record<string, string>;
  callStyleRule?: string;
  expressions: string[];
  bondNote?: string;
  secret?: string;
}

export const characters = charactersJson.characters as CharacterDef[];

const byId = new Map<string, CharacterDef>(characters.map((c) => [c.id, c]));

export function getCharacter(id: string): CharacterDef | null {
  return byId.get(id) ?? null;
}

/**
 * 話者の表示名。主人公は名前変更可能なため、プレイヤー名で置き換える。
 * シェルの発話は音ではなく頭に直接届くため、表示名を《 》で囲う。
 */
export function speakerName(id: CharacterId, playerName: string): string {
  if (id === 'haru') return playerName;
  return byId.get(id)?.name ?? id;
}

/** 台詞本文中の {name} をプレイヤー名に展開する。 */
export function expandText(text: string, playerName: string): string {
  return text.replaceAll('{name}', playerName);
}

/** 名前表示に使う色。立ち絵が無い場面でも話者を識別できるようにする。 */
export const NAME_COLORS: Record<string, string> = {
  haru: '#c9ccd4',
  renny: '#6db4e8',
  hyu: '#5fbf8f',
  jinpachi: '#e08a4a',
  muni: '#8fd0f0',
  geru: '#a77fd0',
  neo: '#e0c46a',
  shell: '#e8e8e8',
};

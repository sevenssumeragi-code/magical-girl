/**
 * シナリオデータの読み込み。
 *
 * **エンジンは台詞を一切ハードコードしない。** 全ての本文は content/scenes/*.json
 * に存在し、ここで一括読み込みしてIDで引く。
 */

import type { Line, Scene } from './types';

const modules = import.meta.glob('../../content/scenes/*.json', {
  eager: true,
  import: 'default',
}) as Record<string, Scene>;

const scenes = new Map<string, Scene>();
for (const scene of Object.values(modules)) {
  scenes.set(scene.id, scene);
}

export function getScene(id: string): Scene | null {
  return scenes.get(id) ?? null;
}

export function requireScene(id: string): Scene {
  const scene = scenes.get(id);
  if (!scene) throw new Error(`シーンが存在しません: ${id}`);
  return scene;
}

export function allScenes(): Scene[] {
  return [...scenes.values()].sort((a, b) => a.id.localeCompare(b.id));
}

export function sceneCount(): number {
  return scenes.size;
}

/** そのシーンから直接遷移しうる全シーンID（本文検証・到達性検証で使う）。 */
export function outgoingLinks(scene: Scene): string[] {
  const out = new Set<string>();
  if (scene.next) out.add(scene.next);
  for (const line of scene.lines) {
    if (line.type === 'choice') {
      for (const option of line.options) {
        if (option.next) out.add(option.next);
      }
    }
  }
  return [...out];
}

/** 地の文・台詞の合計文字数（規模要件の検証に使う）。 */
export function sceneTextLength(scene: Scene): number {
  return scene.lines.reduce((sum, line) => sum + lineTextLength(line), 0);
}

function lineTextLength(line: Line): number {
  switch (line.type) {
    case 'narration':
    case 'dialogue':
      return line.text.length;
    case 'choice':
      return line.prompt.length + line.options.reduce((s, o) => s + o.text.length, 0);
    default:
      return 0;
  }
}

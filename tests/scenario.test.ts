import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { assetManifest } from '../src/engine/assets';
import { allScenes, getScene, outgoingLinks, sceneTextLength } from '../src/engine/scenario';
import { ENDING_IDS } from '../src/engine/types';

const scenes = allScenes();
const assetIds = new Set((assetManifest.assets as Array<{ id: string }>).map((a) => a.id));

describe('シーンデータの整合性', () => {
  it('docs/PLOT.md の規定どおり80シーン存在する', () => {
    expect(scenes.length).toBe(80);
  });

  it('シーンIDが一意でファイル名と一致する', () => {
    const dir = path.resolve('content/scenes');
    for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.json'))) {
      const scene = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
      expect(`${scene.id}.json`).toBe(file);
    }
    expect(new Set(scenes.map((s) => s.id)).size).toBe(scenes.length);
  });

  it('全ての遷移先が実在する（リンク切れ検出）', () => {
    const broken: string[] = [];
    for (const scene of scenes) {
      for (const target of outgoingLinks(scene)) {
        if (!getScene(target)) broken.push(`${scene.id} -> ${target}`);
      }
    }
    expect(broken).toEqual([]);
  });

  it('8種のエンディングシーンが全て存在する', () => {
    const endings = scenes.filter((s) => s.ending).map((s) => s.ending);
    expect(new Set(endings)).toEqual(new Set(ENDING_IDS));
  });

  it('エンディングシーンは next を持たない', () => {
    for (const scene of scenes.filter((s) => s.ending)) {
      expect(scene.next).toBeNull();
    }
  });

  it('エンディング以外で next も選択肢も持たない行き止まりが無い', () => {
    const deadEnds = scenes
      .filter((s) => !s.ending && outgoingLinks(s).length === 0)
      // ch05_14 は resolveEnding が遷移させるため next を持たない。
      .filter((s) => !s.lines.some((l) => l.type === 'resolveEnding'))
      .map((s) => s.id);
    expect(deadEnds).toEqual([]);
  });

  it('全シーンが開始地点 pr_01 から到達可能', () => {
    const seen = new Set<string>();
    const queue = ['pr_01'];
    while (queue.length) {
      const id = queue.shift() as string;
      if (seen.has(id)) continue;
      seen.add(id);
      const scene = getScene(id);
      if (scene) queue.push(...outgoingLinks(scene));
    }
    // resolveEnding による遷移は静的リンクに現れないため、別途加える。
    for (const id of ENDING_IDS) seen.add(id);
    const unreachable = scenes.map((s) => s.id).filter((id) => !seen.has(id));
    expect(unreachable).toEqual([]);
  });
});

describe('アセット参照の整合性', () => {
  it('シーンが参照する背景・BGM・CG・SEが全てマニフェストに存在する', () => {
    const missing: string[] = [];
    for (const scene of scenes) {
      const refs = [scene.background, scene.bgm].filter(Boolean) as string[];
      for (const line of scene.lines) {
        if ((line.type === 'bg' || line.type === 'sfx') && line.asset) refs.push(line.asset);
        if ((line.type === 'bgm' || line.type === 'cg') && line.asset) refs.push(line.asset);
      }
      for (const ref of refs) {
        if (!assetIds.has(ref)) missing.push(`${scene.id}: ${ref}`);
      }
    }
    expect(missing).toEqual([]);
  });
});

describe('フラグの整合性', () => {
  const declared = new Set(
    [...fs.readFileSync('content/flags.md', 'utf8').matchAll(/`([a-z][a-z0-9_]+)`/g)].map((m) => m[1] as string),
  );

  it('シナリオが設定・参照するフラグが content/flags.md に定義されている', () => {
    const undefinedFlags = new Set<string>();
    const collect = (record?: Record<string, boolean>) => {
      for (const key of Object.keys(record ?? {})) {
        if (!declared.has(key)) undefinedFlags.add(key);
      }
    };
    for (const scene of scenes) {
      for (const line of scene.lines) {
        if (line.type === 'flag') collect(line.set);
        if (line.requires?.flags) collect(line.requires.flags);
        if (line.type === 'choice') {
          for (const option of line.options) {
            collect(option.flags);
            collect(option.requires?.flags);
          }
        }
      }
    }
    expect([...undefinedFlags]).toEqual([]);
  });
});

describe('運命判定・エンディング判定の設置', () => {
  it('ch04_11 で裏切り者を、ch04_12 で決別者を確定させる', () => {
    expect(getScene('ch04_11')?.lines.some((l) => l.type === 'resolveFate' && l.what === 'betrayer')).toBe(true);
    expect(getScene('ch04_12')?.lines.some((l) => l.type === 'resolveFate' && l.what === 'departed')).toBe(true);
  });

  it('resolveEnding は最終シーンに一度だけ置かれている', () => {
    const withResolve = scenes.filter((s) => s.lines.some((l) => l.type === 'resolveEnding'));
    expect(withResolve.map((s) => s.id)).toEqual(['ch05_14']);
  });

  it('4種の真相フラグが本編中で設定される', () => {
    const set = new Set<string>();
    for (const scene of scenes) {
      for (const line of scene.lines) {
        if (line.type === 'flag') Object.keys(line.set).forEach((k) => set.add(k));
      }
    }
    for (const flag of ['truth_wish', 'truth_material', 'truth_haru_blank', 'truth_neo_origin']) {
      expect(set.has(flag)).toBe(true);
    }
  });
});

describe('規模の要件', () => {
  it('総文字数が 60,000〜80,000 字に収まる', () => {
    const total = scenes.reduce((sum, s) => sum + sceneTextLength(s), 0);
    console.log(`  総文字数: ${total.toLocaleString()} 字 / 目標 60,000〜80,000 字`);
    expect(total).toBeGreaterThanOrEqual(60_000);
    expect(total).toBeLessThanOrEqual(80_000);
  });

  it('未執筆のプレースホルダが残っていない', () => {
    const remaining: string[] = [];
    for (const scene of scenes) {
      for (const line of scene.lines) {
        const body =
          line.type === 'narration' || line.type === 'dialogue'
            ? line.text
            : line.type === 'choice'
              ? line.prompt
              : null;
        if (body?.startsWith('（未執筆')) remaining.push(scene.id);
      }
    }
    expect(remaining).toEqual([]);
  });

  it('選択肢が仕様どおり30〜40個ある', () => {
    const choices = scenes.reduce(
      (sum, s) => sum + s.lines.filter((l) => l.type === 'choice').length,
      0,
    );
    expect(choices).toBeGreaterThanOrEqual(30);
    expect(choices).toBeLessThanOrEqual(40);
  });
});

#!/usr/bin/env node
/**
 * docs/PLOT.md のシーン一覧表から content/scenes/*.json の骨格を生成する。
 *
 * 目的は「フェーズ2の時点で全80シーンが繋がり、通しで動作する」状態を作ること。
 * 本文はフェーズ3で各ファイルを直接執筆して置き換える。
 *
 * 既存ファイルは上書きしない（--force 指定時のみ上書き）。
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const force = process.argv.includes('--force');
const outDir = path.join(root, 'content', 'scenes');

const plot = fs.readFileSync(path.join(root, 'docs', 'PLOT.md'), 'utf8');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'assets', 'ASSET_MANIFEST.json'), 'utf8'));

const CHAPTER_TITLES = {
  0: 'プロローグ ─ 無色',
  1: '第一章 ─ 灯る',
  2: '第二章 ─ 翳る',
  3: '第三章 ─ 軋む',
  4: '第四章 ─ 暴く',
  5: '第五章 ─ 灯す',
};

/** シーン固有の必須処理行。docs/PLOT.md と content/flags.md に対応する。 */
const SPECIAL_LINES = {
  ch03_04: [{ type: 'flag', set: { hyu_hoarded: true } }],
  ch04_01: [{ type: 'flag', set: { truth_neo_origin: true, neo_identity_revealed: true } }],
  ch04_04: [{ type: 'flag', set: { truth_wish: true } }],
  ch04_06: [{ type: 'flag', set: { truth_material: true } }],
  ch04_07: [
    {
      type: 'flag',
      set: { truth_haru_blank: true },
      requires: { flags: { accepted_self: true } },
    },
  ],
  ch04_11: [{ type: 'resolveFate', what: 'betrayer' }],
  ch04_12: [{ type: 'resolveFate', what: 'departed' }],
  ch05_14: [{ type: 'resolveEnding' }],
};

// ------------------------------------------------------------ PLOT.md の解析

/** 本編シーン: | `id` | `bg` | `bgm` | 内容 | 選択肢 | */
const sceneRows = [
  ...plot.matchAll(
    /^\|\s*`((?:pr|ch0[1-5])_\d{2})`\s*\|\s*`(bg_[a-z0-9_]+)`\s*\|\s*`(bgm_[a-z0-9_]+)`\s*\|\s*([^|]*)\|\s*([^|]*)\|/gm,
  ),
].map((m) => ({
  id: m[1],
  bg: m[2],
  bgm: m[3],
  summary: m[4].trim(),
  choices: [...m[5].matchAll(/C(\d{2})/g)].map((c) => `C${c[1]}`),
}));

/** エンディング: | `id` | 種別 | **題** | `bg` | `bgm` | */
const endingRows = [
  ...plot.matchAll(
    /^\|\s*`(end_[a-z_]+)`\s*\|\s*([^|]*)\|\s*\*\*([^*]+)\*\*\s*\|\s*`(bg_[a-z0-9_]+)`\s*\|\s*`(bgm_[a-z0-9_]+)`\s*\|/gm,
  ),
].map((m) => ({
  id: m[1],
  kind: m[2].trim(),
  title: m[3].trim(),
  bg: m[4],
  bgm: m[5],
}));

if (sceneRows.length !== 72 || endingRows.length !== 8) {
  console.error(
    `PLOT.md の解析結果が想定と異なります (本編 ${sceneRows.length}/72, END ${endingRows.length}/8)`,
  );
  process.exit(1);
}

// ------------------------------------------------------- CG の自動割り当て

/** used_in にシーンIDを含むCGを、そのシーンの先頭で表示する。 */
const cgByScene = new Map();
for (const asset of manifest.assets) {
  if (asset.type !== 'cg') continue;
  for (const sceneId of asset.used_in ?? []) {
    if (!cgByScene.has(sceneId)) cgByScene.set(sceneId, asset);
  }
}

// ------------------------------------------------------------ シーンの生成

const chapterOf = (id) => (id.startsWith('pr_') ? 0 : Number(id.slice(2, 4)));

const scenes = sceneRows.map((row, i) => {
  const chapter = chapterOf(row.id);
  const nextRow = sceneRows[i + 1];
  const isFirstOfChapter = i === 0 || chapterOf(sceneRows[i - 1].id) !== chapter;
  const cg = cgByScene.get(row.id);

  const lines = [];
  if (cg) lines.push({ type: 'cg', asset: cg.id, ...(cg.variants ? { variant: cg.variants[0] } : {}) });

  lines.push({
    type: 'narration',
    text: `（未執筆: ${row.summary}）`,
  });

  for (const special of SPECIAL_LINES[row.id] ?? []) lines.push(special);

  for (const choiceId of row.choices) {
    lines.push({
      type: 'choice',
      prompt: `（未執筆: ${choiceId}）`,
      options: [
        { text: `（未執筆: ${choiceId} 選択肢A）` },
        { text: `（未執筆: ${choiceId} 選択肢B）` },
      ],
    });
  }

  // 最終シーンは resolveEnding が遷移させるため next を持たない。
  const next = row.id === 'ch05_14' ? null : (nextRow?.id ?? null);

  return {
    id: row.id,
    chapter,
    ...(isFirstOfChapter ? { chapterTitle: CHAPTER_TITLES[chapter] } : {}),
    background: row.bg,
    bgm: row.bgm,
    lines,
    next,
  };
});

for (const row of endingRows) {
  const cg = cgByScene.get(row.id);
  const lines = [];
  if (cg) lines.push({ type: 'cg', asset: cg.id });
  lines.push({ type: 'narration', text: `（未執筆: ${row.kind} ${row.title}）` });

  scenes.push({
    id: row.id,
    chapter: 5,
    chapterTitle: row.title,
    background: row.bg,
    bgm: row.bgm,
    lines,
    next: null,
    ending: row.id,
  });
}

// ------------------------------------------------------------------ 書き出し

fs.mkdirSync(outDir, { recursive: true });

let written = 0;
let skipped = 0;
for (const scene of scenes) {
  const file = path.join(outDir, `${scene.id}.json`);
  if (fs.existsSync(file) && !force) {
    skipped += 1;
    continue;
  }
  fs.writeFileSync(file, `${JSON.stringify(scene, null, 2)}\n`, 'utf8');
  written += 1;
}

console.log(`シーン骨格: ${written} 件生成, ${skipped} 件スキップ（既存）/ 全 ${scenes.length} 件`);

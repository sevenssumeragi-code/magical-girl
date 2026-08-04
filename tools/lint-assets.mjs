#!/usr/bin/env node
/**
 * アセット整合性チェック。
 *
 * - ASSET_MANIFEST.json の全パス（variants 含む）が実在すること
 * - アセットIDが重複していないこと
 * - シナリオが参照するアセットIDが全てマニフェストに存在すること
 * - マニフェストに載っていない野良ファイルが assets/ 配下に無いこと
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'assets', 'ASSET_MANIFEST.json'), 'utf8'));

const errors = [];
const warnings = [];

// -------------------------------------------------- ID重複とファイル実在

const seen = new Set();
const expectedFiles = new Set();

for (const asset of manifest.assets) {
  if (seen.has(asset.id)) errors.push(`アセットIDが重複しています: ${asset.id}`);
  seen.add(asset.id);

  const paths = asset.variants
    ? asset.variants.map((v) => asset.path.replace(/(\.[a-z0-9]+)$/i, `_${v}$1`))
    : [asset.path];

  for (const rel of paths) {
    expectedFiles.add(rel);
    if (!fs.existsSync(path.join(root, rel))) {
      errors.push(`ファイルが存在しません: ${rel} (id=${asset.id})`);
    }
  }
}

// -------------------------------------------------- シナリオからの参照

const sceneDir = path.join(root, 'content', 'scenes');
if (fs.existsSync(sceneDir)) {
  for (const file of fs.readdirSync(sceneDir).filter((f) => f.endsWith('.json'))) {
    const scene = JSON.parse(fs.readFileSync(path.join(sceneDir, file), 'utf8'));
    const refs = [];
    if (scene.background) refs.push(scene.background);
    if (scene.bgm) refs.push(scene.bgm);
    for (const line of scene.lines ?? []) {
      if (['bg', 'bgm', 'cg', 'sfx'].includes(line.type) && line.asset) refs.push(line.asset);
    }
    for (const ref of refs) {
      if (!seen.has(ref)) errors.push(`${file}: マニフェストに無いアセットを参照しています: ${ref}`);
    }
  }
}

// -------------------------------------------------- 野良ファイル

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else out.push(path.relative(root, full).split(path.sep).join('/'));
  }
  return out;
}

const IGNORE = /^assets\/(README\.md|ASSET_MANIFEST\.json)$/;
for (const file of walk(path.join(root, 'assets'))) {
  if (IGNORE.test(file)) continue;
  if (!expectedFiles.has(file)) {
    warnings.push(`マニフェストに載っていないファイル: ${file}`);
  }
}

// -------------------------------------------------------------------- 出力

for (const w of warnings) console.warn(`WARN  ${w}`);
for (const e of errors) console.error(`ERROR ${e}`);

const total = expectedFiles.size;
if (errors.length) {
  console.error(`\nlint:assets 失敗 — ${errors.length} 件のエラー (対象 ${total} ファイル)`);
  process.exit(1);
}
console.log(`lint:assets OK — ${total} ファイル / 警告 ${warnings.length} 件`);

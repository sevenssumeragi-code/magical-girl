#!/usr/bin/env node
/**
 * 口調 lint。
 *
 * 長編では口調が必ず崩れるため、content/characters.json の voice ルールを
 * content/scenes/*.json の全台詞に対して機械的に検証する。
 * **違反0件を完成条件とする。**
 *
 * 検出するもの:
 *   1. 禁止された一人称の使用（レニィの「俺」「私」、ゲルの「あたし」等）
 *   2. 禁止された二人称の使用（ゲルの「貴様」）
 *   3. ヒュウの非敬語の台詞
 *   4. ムニの漢字「僕」
 *   5. 未定義の話者ID・表情ID
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { characters } = JSON.parse(
  fs.readFileSync(path.join(root, 'content', 'characters.json'), 'utf8'),
);

const byId = new Map(characters.map((c) => [c.id, c]));

/**
 * 一人称・二人称の検出。単純な部分一致だと「私立」「俺様」等で誤爆するため、
 * 直後が助詞・句読点・終端であるものだけを人称の使用とみなす。
 */
const PARTICLE_AFTER = 'はがのをもにでとへやかなねよだ、。！？…」』\\s';
function pronounRegex(token) {
  return new RegExp(`${token}(?=[${PARTICLE_AFTER}]|$)`, 'g');
}

/** 敬体の目印。ヒュウの台詞は必ずいずれかを含む。 */
const POLITE = /(です|ます|ましょ|ませ|でしょ|ください|ございま)/;
/** 短い感嘆・相槌は敬体判定の対象外にする。 */
const POLITE_EXEMPT_LENGTH = 8;

const violations = [];
let dialogueCount = 0;
const rennyStats = { total: 0, stretched: 0 };

function check(file, sceneId, index, line) {
  if (line.type !== 'dialogue') return;
  dialogueCount += 1;

  const def = byId.get(line.speaker);
  if (!def) {
    violations.push({ file, sceneId, index, speaker: line.speaker, rule: '未定義の話者ID', text: line.text });
    return;
  }
  if (line.expression && !def.expressions.includes(line.expression)) {
    violations.push({
      file,
      sceneId,
      index,
      speaker: line.speaker,
      rule: `未定義の表情ID: ${line.expression}`,
      text: line.text,
    });
  }

  const text = line.text;
  const voice = def.voice ?? {};

  for (const token of voice.forbiddenFirstPerson ?? []) {
    if (pronounRegex(token).test(text)) {
      violations.push({
        file,
        sceneId,
        index,
        speaker: line.speaker,
        rule: `禁止された一人称「${token}」（正: 「${voice.firstPerson}」）`,
        text,
      });
    }
  }

  for (const token of voice.forbiddenSecondPerson ?? []) {
    if (text.includes(token)) {
      violations.push({
        file,
        sceneId,
        index,
        speaker: line.speaker,
        rule: `禁止された二人称「${token}」`,
        text,
      });
    }
  }

  if (line.speaker === 'hyu' && text.length >= POLITE_EXEMPT_LENGTH && !POLITE.test(text)) {
    violations.push({ file, sceneId, index, speaker: 'hyu', rule: '敬語でない台詞', text });
  }

  if (line.speaker === 'muni' && text.includes('僕')) {
    violations.push({ file, sceneId, index, speaker: 'muni', rule: '漢字「僕」の使用（正: 「ぼく」）', text });
  }

  if (line.speaker === 'renny') {
    rennyStats.total += 1;
    if (/(だよぉ|だねぇ|なのぉ|よぉ|ねぇ)/.test(text)) rennyStats.stretched += 1;
  }
}

const sceneDir = path.join(root, 'content', 'scenes');
const files = fs.existsSync(sceneDir)
  ? fs.readdirSync(sceneDir).filter((f) => f.endsWith('.json')).sort()
  : [];

for (const file of files) {
  const scene = JSON.parse(fs.readFileSync(path.join(sceneDir, file), 'utf8'));
  scene.lines?.forEach((line, i) => check(file, scene.id, i, line));
}

// -------------------------------------------------------------------- 出力

for (const v of violations) {
  console.error(`ERROR ${v.sceneId} [${v.index}] ${v.speaker}: ${v.rule}\n        「${v.text}」`);
}

if (rennyStats.total > 0) {
  const ratio = rennyStats.stretched / rennyStats.total;
  const pct = (ratio * 100).toFixed(1);
  // 「まれに語尾を伸ばす」= 10回に1回程度。目安から外れている場合のみ知らせる。
  if (ratio > 0.25) {
    console.warn(`WARN  レニィの語尾伸ばしが多すぎます: ${pct}% (目安 10% 前後)`);
  } else if (rennyStats.total >= 20 && ratio < 0.03) {
    console.warn(`WARN  レニィの語尾伸ばしが少なすぎます: ${pct}% (目安 10% 前後)`);
  }
}

if (violations.length) {
  console.error(`\nlint:voice 失敗 — ${violations.length} 件の違反 / 台詞 ${dialogueCount} 行`);
  process.exit(1);
}
console.log(`lint:voice OK — 違反 0 件 / 台詞 ${dialogueCount} 行 / シーン ${files.length} 件`);

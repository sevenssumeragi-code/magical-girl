#!/usr/bin/env node
/**
 * ASSET_MANIFEST.json に定義された全アセットのプレースホルダを生成する。
 *
 * グラフィック/BGM担当が本物を同じパスに置くだけで差し替わる。
 * 既存ファイルは上書きしない（--force 指定時のみ上書き）。
 *
 * 依存パッケージを増やさないため PNG は自前でエンコードする（単色/シルエット）。
 */

import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const force = process.argv.includes('--force');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'assets', 'ASSET_MANIFEST.json'), 'utf8'));

// ------------------------------------------------------------ PNG エンコーダ

const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (const byte of buf) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const head = Buffer.alloc(8);
  head.writeUInt32BE(data.length, 0);
  head.write(type, 4, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([head.subarray(4), data])), 0);
  return Buffer.concat([head, data, crc]);
}

/** RGBA のピクセル関数から PNG を作る。 */
function encodePng(width, height, pixel) {
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y += 1) {
    const rowStart = y * (stride + 1);
    raw[rowStart] = 0; // filter: none
    for (let x = 0; x < width; x += 1) {
      const [r, g, b, a] = pixel(x, y);
      const p = rowStart + 1 + x * 4;
      raw[p] = r;
      raw[p + 1] = g;
      raw[p + 2] = b;
      raw[p + 3] = a;
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type: RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/** アセットIDから安定した色を作る（種別ごとに見分けがつくように）。 */
function colorFor(id, saturation, lightness) {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return hslToRgb((hash % 360) / 360, saturation, lightness);
}

function hslToRgb(h, s, l) {
  const f = (n) => {
    const k = (n + h * 12) % 12;
    const a = s * Math.min(l, 1 - l);
    return Math.round(255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))));
  };
  return [f(0), f(8), f(4)];
}

// ------------------------------------------------------------ 各種生成

function backgroundPng(id) {
  const w = 640;
  const h = 360;
  const [r, g, b] = colorFor(id, 0.22, 0.28);
  return encodePng(w, h, (x, y) => {
    // 中央に向かって僅かに明るくし、格子を入れてプレースホルダと分かるようにする。
    const vignette = 1 - (Math.abs(x / w - 0.5) + Math.abs(y / h - 0.5)) * 0.5;
    const grid = x % 64 === 0 || y % 64 === 0 ? 1.5 : 1;
    const k = vignette * grid;
    return [Math.min(255, r * k), Math.min(255, g * k), Math.min(255, b * k), 255];
  });
}

function spritePng(id) {
  const w = 400;
  const h = 700;
  const [r, g, b] = colorFor(id, 0.4, 0.55);
  // 頭部の円と胴体の台形からなるシルエット。全表情で位置を揃える。
  const headCx = w / 2;
  const headCy = h * 0.2;
  const headR = w * 0.19;
  return encodePng(w, h, (x, y) => {
    const inHead = (x - headCx) ** 2 + (y - headCy) ** 2 <= headR ** 2;
    const t = (y - h * 0.34) / (h * 0.66);
    const halfWidth = w * (0.16 + 0.24 * Math.max(0, t));
    const inBody = y >= h * 0.34 && Math.abs(x - headCx) <= halfWidth;
    return inHead || inBody ? [r, g, b, 235] : [0, 0, 0, 0];
  });
}

function cgPng(id) {
  const w = 640;
  const h = 360;
  const [r, g, b] = colorFor(id, 0.3, 0.35);
  return encodePng(w, h, (x, y) => {
    // 対角ストライプで背景と区別する。
    const stripe = ((x + y) % 48 < 24 ? 1.15 : 0.9);
    return [Math.min(255, r * stripe), Math.min(255, g * stripe), Math.min(255, b * stripe), 255];
  });
}

/**
 * 音声プレースホルダは 0 バイトの空ファイル。
 * 再生失敗は AudioPlayer 側で握り潰しているため、未納品でもゲームは通しで動作する。
 */
const SILENT = Buffer.alloc(0);

// ------------------------------------------------------------------ 書き出し

function targetPaths(asset) {
  if (!asset.variants) return [asset.path];
  return asset.variants.map((v) => asset.path.replace(/(\.[a-z0-9]+)$/i, `_${v}$1`));
}

let written = 0;
let skipped = 0;

for (const asset of manifest.assets) {
  for (const relPath of targetPaths(asset)) {
    const file = path.join(root, relPath);
    if (fs.existsSync(file) && !force) {
      skipped += 1;
      continue;
    }
    fs.mkdirSync(path.dirname(file), { recursive: true });

    let data;
    switch (asset.type) {
      case 'bg':
        data = backgroundPng(asset.id);
        break;
      case 'sprite':
        data = spritePng(asset.id);
        break;
      case 'cg':
        data = cgPng(path.basename(relPath));
        break;
      default:
        data = SILENT;
    }
    fs.writeFileSync(file, data);
    written += 1;
  }
}

console.log(`プレースホルダ: ${written} 件生成, ${skipped} 件スキップ（既存）`);

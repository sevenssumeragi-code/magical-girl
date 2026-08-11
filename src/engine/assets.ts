/**
 * アセット解決。
 *
 * **パスの直書きは禁止。** 全てのアセットは assets/ASSET_MANIFEST.json を経由して
 * 解決する。グラフィック/BGM担当がマニフェストを編集するだけで差し替えが完結し、
 * コード側の変更を不要にするための境界である。
 */

import manifest from '../../assets/ASSET_MANIFEST.json';

export interface AssetEntry {
  id: string;
  type: 'bg' | 'sprite' | 'cg' | 'bgm' | 'se';
  path: string;
  description: string;
  variants?: string[];
  spec?: Record<string, unknown>;
  used_in?: string[];
}

const entries = manifest.assets as AssetEntry[];
const byId = new Map<string, AssetEntry>(entries.map((a) => [a.id, a]));

/** ビルド時に解決される実URL。キーは 'assets/...' 形式に正規化する。 */
const urlModules = import.meta.glob('../../assets/**/*.{png,svg,jpg,jpeg,ogg,mp3,wav}', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

const urlByPath = new Map<string, string>(
  Object.entries(urlModules).map(([key, url]) => [key.replace(/^\.\.\/\.\.\//, ''), url]),
);

const missing = new Set<string>();

function warnOnce(message: string): void {
  if (missing.has(message)) return;
  missing.add(message);
  console.warn(`[assets] ${message}`);
}

export function getEntry(id: string): AssetEntry | null {
  return byId.get(id) ?? null;
}

/** variant 付きアセットのパスを組み立てる（cg_12_betrayal + 'hyu' → ..._hyu.png）。 */
function variantPath(path: string, variant: string): string {
  return path.replace(/(\.[a-z0-9]+)$/i, `_${variant}$1`);
}

/**
 * アセットIDを実URLに解決する。
 * マニフェストに無いID、またはファイルが存在しない場合は null を返し、警告する
 * （アセット未納品でもゲームが停止しないようにするため）。
 */
export function resolveAsset(id: string | null | undefined, variant?: string): string | null {
  if (!id) return null;

  const entry = byId.get(id);
  if (!entry) {
    warnOnce(`マニフェストに存在しないID: ${id}`);
    return null;
  }

  const path = variant ? variantPath(entry.path, variant) : entry.path;
  const url = urlByPath.get(path);
  if (!url) {
    warnOnce(`ファイルが存在しません: ${path} (id=${id})`);
    return null;
  }
  return url;
}

/** 立ち絵IDを組み立てる。表情差分が無い場合は normal にフォールバックする。 */
export function spriteId(character: string, expression = 'normal'): string {
  const id = `sp_${character}_${expression}`;
  return byId.has(id) ? id : `sp_${character}_normal`;
}

export function listByType(type: AssetEntry['type']): AssetEntry[] {
  return entries.filter((a) => a.type === type);
}

export const assetManifest = manifest;

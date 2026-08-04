import { defineConfig } from 'vitest/config';

export default defineConfig({
  base: './',
  // アセットは assets/ASSET_MANIFEST.json 経由でのみ解決するため、
  // publicDir による素通しは使わない（パス直書きを構造的に防ぐ）。
  publicDir: false,
  build: {
    outDir: 'dist',
    assetsInlineLimit: 0,
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});

# 余白に灯る (Yohaku ni Tomoru)

魔法少女まどか☆マギカの**世界観のみを借用したオリジナル**の中編ノベルゲーム。
選択肢と6人の絆値によってシナリオが分岐し、8種のエンディングに至る。

- 全5章 + プロローグ / 全80シーン / 総文字数 60,000〜80,000字
- 1周 約3時間、全ルート回収 約10時間

## ドキュメント

| ファイル | 内容 |
|---|---|
| [`docs/SETTING.md`](docs/SETTING.md) | 世界観・独自用語・中心設定（真相） |
| [`docs/PLOT.md`](docs/PLOT.md) | 全80シーン一覧・選択肢36個・分岐図・エンディング判定 |
| [`content/characters.json`](content/characters.json) | キャラクターバイブル（口調ルールを含む） |
| [`content/flags.md`](content/flags.md) | フラグ一覧 |
| [`assets/README.md`](assets/README.md) | **グラフィック/BGM担当（Codex）向けガイド** |
| [`assets/ASSET_MANIFEST.json`](assets/ASSET_MANIFEST.json) | 必要アセット124点の完全リスト |
| [`DECISIONS.md`](DECISIONS.md) | 設計判断の記録 |

> **ネタバレ注意**: `docs/SETTING.md` §3 と `docs/PLOT.md` 第4章以降に本作の真相が記載されている。

## 技術スタック

HTML + CSS + TypeScript（Vite）。外部ゲームエンジン不使用、バックエンド不要。
シナリオはコードから完全分離し、`content/` 配下のJSONデータとして持つ。

## 進捗

- [x] **フェーズ1: 設計** — 世界観 / キャラクターバイブル / 全体プロット / アセット契約
- [x] **フェーズ2: エンジン実装** — シーン再生・選択肢・絆値・フラグ・セーブ・UI一式。
      全80シーンの骨格とプレースホルダアセットで**通しでプレイ可能**
- [ ] フェーズ3: 本文執筆（全80シーン / 60,000〜80,000字）
- [ ] フェーズ4: 統合（全ルート到達性検証・攻略手順）
- [ ] フェーズ5: 品質保証（口調lint・アセットlint・テスト）

## 開発

```bash
npm install
npm run dev              # 開発サーバ
npm run build            # 型チェック + ビルド
npm test                 # テスト (78件)
npm run lint             # アセット整合性 + 口調チェック
npm run check            # 上記すべて

npm run gen:placeholders # プレースホルダ生成（既存は上書きしない）
node tools/gen-scene-stubs.mjs   # PLOT.md からシーン骨格を生成（既存は上書きしない）
```

## 実装機能

セーブ/ロード（3スロット＋オート）、既読スキップ、オートモード、バックログ（100件）、
テキスト速度・音量設定、CG/BGM回想、エンディング一覧、ルート分岐図（到達済みのみ表示）、
初回起動時のみのタイトル演出、主人公の名前入力、キーボード操作。

### 設計上の約束

- **エンジンは台詞を一切ハードコードしない。** 本文は `content/scenes/*.json` にのみ存在する。
- **アセットパスを直書きしない。** 解決は `assets/ASSET_MANIFEST.json` 経由のみ
  （`publicDir` を無効化して構造的に強制）。
- 裏切り者・決別者・エンディングの判定は純関数（`src/engine/fate.ts` / `ending.ts`）で、
  全分岐に単体テストがある。

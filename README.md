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
- [ ] フェーズ2: エンジン実装（シーン再生・選択肢・絆値・セーブ・UI一式）
- [ ] フェーズ3: 本文執筆（全80シーン）
- [ ] フェーズ4: 統合（全ルート到達性検証・攻略手順）
- [ ] フェーズ5: 品質保証（口調lint・アセットlint・テスト）

## 開発

```bash
npm install
npm run dev     # 開発サーバ
npm run build   # ビルド
npm test        # テスト
```

※ フェーズ2以降で整備される。

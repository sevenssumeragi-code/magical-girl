# フラグ一覧

全て boolean。初期値は全て `false`。
シナリオJSONの `choice.options[].flags` および `line.setFlag` から設定する。
**この表に無いフラグをシナリオ中で使用してはならない**（`npm test` のフラグ整合性チェックで検出）。

## 1. 選択肢由来フラグ

| フラグ名 | 設定元 | 意味 | 参照先 |
|---|---|---|---|
| `asked_about_contract` | C01 (`pr_03`) | シェルに契約の仕組みを尋ねた | `ch04_02` の会話量が増える |
| `noticed_muni_slip` | C09 (`ch01_12`) | ムニの「にいちゃ……」を追及した | 伏線A回収時の演出強化 / `truth_material` 取得補助 |
| `noticed_hair_color` | C12 (`ch02_04`) | レニィとムニの髪色の一致に触れた | 同上 |
| `muni_benched` | C13 (`ch02_05`) | ムニを戦線から外した（善意→最悪①） | 存在希薄化が加速。`bond.muni` 上昇だが `ch03_08` が悪化 |
| `pressed_geru` | C17 (`ch02_12`) | ゲルを問い詰めた | `ch03_11` でゲルが出奔しにくくなる |
| `tailed_hyu` | C19 (`ch03_02`) | ヒュウを尾行した | `hyu_hoarded` の露見が1シーン早まる |
| `hyu_hoarded` | `ch03_04` 到達時に自動 | ヒュウの燼核独占が露見した（善意→最悪②） | 裏切り者判定 §4 |
| `neo_deal` | C22 (`ch03_06`) | ネオの取引に応じた | 裏切り者判定 / `neo_route` の前提 |
| `heard_renny_dream` | C23 (`ch03_07`) | レニィの「変な夢」を聞いた | `truth_material` 取得補助。決別分岐の演出変化 |
| `accepted_self` | C27 (`ch04_07`) | 自分が空白の器であることを受け入れた | `truth_haru_blank` の取得条件 |
| `hyu_watched` | C28 (`ch04_09`) | ヒュウを墜化から遠ざける選択をした | `ch05_08` の対峙内容が変化 |
| `named_jinpachi` | C29 (`ch04_10`) | ジンパチに名を贈った | 裏切り者判定で jinpachi が選ばれにくくなる |
| `jinpachi_bond_deep` | C25 (`ch03_10`) | ジンパチの本音に正面から応えた | 同上 |
| `chose_geru` | C35 (`ch05_06`) | ゲルを救う側を選んだ（善意→最悪③） | `ch05_10` の最終選択肢の並びが変化 |
| `neo_ally` | C33 (`ch05_02`) | ネオを説得して味方につけた | `ch05_03` が共闘になる |
| `neo_route` | C33 (`ch05_02`) | ネオと共に外環へ行く道を選んだ | `end_secret` の必須条件 |
| `final_choice` | C36 (`ch05_10`) | 最終選択を行った（値は別途 `finalChoice` に文字列で保持） | 分岐集約点A/B/C の振り分け |

## 2. 真相フラグ（4種／`end_true` は全取得が必須）

| フラグ名 | 取得シーン | 内容 |
|---|---|---|
| `truth_wish` | `ch04_04` | ゲルの願いが「もう二度と、独りで戦いたくない」だと知る |
| `truth_material` | `ch04_06` | 5人がゲルの記憶を素材に実体化した存在だと知る |
| `truth_haru_blank` | `ch04_07` + `accepted_self` | ハルが素材を持たない空白の器だと知り、受け入れる |
| `truth_neo_origin` | `ch04_01` または `ch03_06`（`neo_deal` 経由） | ネオが外環の執行者だと知る |

> `truth_wish` と `truth_material` は本編必須ルート上にあるため必ず取得される。
> **`end_true` の実質的なゲートは `truth_haru_blank`（＝`accepted_self`）と `truth_neo_origin`。**

## 3. 状態フラグ（システムが自動設定）

| フラグ名 | 設定タイミング | 意味 |
|---|---|---|
| `neo_identity_revealed` | `ch04_01` 通過時 | ネオの正体が全員に開示された |
| `betrayal_completed` | `ch04_11` 通過時 | 裏切りが実行された |
| `muni_alive` | 初期 `true` → 決別者が `muni` に確定した時点で `false` | ムニの存続。`end_true` の必須条件 |
| `renny_alive` | 同上（決別者が `renny` の場合 `false`） | レニィの存続 |
| `geru_departed` | 決別者が `geru` に確定した時点で `true` | ゲルが単身で墜化を引き受けに行った |

## 4. 派生値（フラグではないが同じストアで管理）

| 名称 | 型 | 説明 |
|---|---|---|
| `betrayer` | `'hyu' \| 'jinpachi' \| 'neo' \| null` | 裏切り者。`ch04_11` で確定 |
| `departed` | `'muni' \| 'renny' \| 'geru' \| null` | 決別者。`ch04_12` で確定 |
| `finalChoice` | `string \| null` | C36 の選択値 |
| `playerName` | `string` | 主人公名。既定 `ハル`、8文字まで |

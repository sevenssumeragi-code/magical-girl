# 全体プロット ─『余白に灯る』

- 構成: プロローグ + 全5章 + エンディング8種
- **総シーン数: 80**（プロローグ4 / 1章14 / 2章13 / 3章13 / 4章14 / 5章14 / END8）
- **総文字数目標: 60,000〜80,000字**（1シーン平均 850〜1,100字）
- **選択肢: 全36個**（絆値影響27 / フラグ立て12 ※重複あり）
- 想定プレイ時間: 1周 約3時間 / 全ルート回収 約10時間

---

## 1. 章別サマリ

| 章 | 題 | シーン | 主眼 | 章末クリフハンガー |
|---|---|---|---|---|
| PR | 無色 | 4 | ハルの覚醒。記憶がない。シェルとの邂逅 | 「あなたはもう、契約を終えています」 |
| 1 | 灯る | 14 | 6人の顔合わせ、初戦闘、日常。**伏線A/B/Cを全て設置** | ゲルの灯核だけが浄化しきれず、彼女がそれを隠す |
| 2 | 翳る | 13 | ムニの存在希薄化。レニィとの繋がりの示唆。ネオ登場 | ムニの手が、一瞬だけ景色を透かす |
| 3 | 軋む | 13 | ネオの目的が部分開示。燼核の枯渇と疑心。分裂 | 「貴様らは、人間ではない」 |
| 4 | 暴く | 14 | **真相開示**。ゲルの願い。裏切りと決別が確定 | ゲルの灯核が半ばまで黒く染まる |
| 5 | 灯す | 14 | 決着。8エンディングへ分岐 | ─ |

---

## 2. シーン一覧

`bg` / `bgm` は `assets/ASSET_MANIFEST.json` の id を指す。

### プロローグ「無色」

| ID | bg | bgm | 内容 | 選択肢 |
|---|---|---|---|---|
| `pr_01` | `bg_ruin_street_night` | `bgm_prologue` | 崩れた街路でハルが目覚める。記憶がない。自分の名前だけが分かる | ─ |
| `pr_02` | `bg_eikai_void` | `bgm_battle_01` | 翳界に迷い込む。墜者に襲われる。無我夢中で戦い、勝ってしまう | ─ |
| `pr_03` | `bg_ruin_street_night` | `bgm_shell` | シェル登場。灯守の説明。ハルの灯核が示される | C01 |
| `pr_04` | `bg_school_gate_night` | `bgm_tension` | 「僕はいつ契約したの」→《あなたはもう、契約を終えています》**章末** | ─ |

### 第1章「灯る」

| ID | bg | bgm | 内容 | 選択肢 |
|---|---|---|---|---|
| `ch01_01` | `bg_school_gate_night` | `bgm_daily_01` | 廃校の門でゲルに誰何される。剣呑な初対面 | C02 |
| `ch01_02` | `bg_school_classroom` | `bgm_daily_01` | 拠点の教室。ジンパチが噛みつき、ヒュウが取りなす | C03 |
| `ch01_03` | `bg_school_classroom` | `bgm_renny` | レニィが机で寝ている。起こす／起こさない | C04 |
| `ch01_04` | `bg_school_corridor` | `bgm_muni` | ムニが物陰から様子を窺っている。手を差し出すか | C05 |
| `ch01_05` | `bg_school_rooftop_night` | `bgm_quiet` | ゲルから灯守のルール説明。翳・燼核・墜化 | ─ |
| `ch01_06` | `bg_town_slope_day` | `bgm_daily_02` | 昼の街。日常パート。ハルの居場所（空き教室）が決まる | ─ |
| `ch01_07` | `bg_school_classroom` | `bgm_daily_02` | ジンパチと模擬戦。熱血漢の本質が見える | C06 |
| `ch01_08` | `bg_town_shopping` | `bgm_hyu` | ヒュウと二人で街へ。ナルシシズムの下の観察眼 | C07 |
| `ch01_09` | `bg_eikai_garden` | `bgm_battle_01` | 6人での初の共同戦闘。翳界「花壇」 | ─ |
| `ch01_10` | `bg_eikai_garden` | `bgm_battle_02` | 戦闘継続。ハルが庇う相手を選ぶ | **C08（大）** |
| `ch01_11` | `bg_school_classroom` | `bgm_quiet` | 戦闘後。**伏線B設置**：6人の灯核を並べ、ハルのだけ無色 | ─ |
| `ch01_12` | `bg_school_infirmary` | `bgm_muni` | **伏線A設置**：ムニが寝ぼけてレニィを「にいちゃ……」と呼び、言い直す | C09 |
| `ch01_13` | `bg_school_rooftop_night` | `bgm_geru` | ゲルと二人。彼女が3年前から戦っていると知る | ─ |
| `ch01_14` | `bg_school_corridor` | `bgm_tension` | **伏線C設置**：燼核使用後、ゲルの灯核だけ翳が残る。ハルが見てしまう。ゲルは「体質だ」と隠す **章末** | ─ |

### 第2章「翳る」

| ID | bg | bgm | 内容 | 選択肢 |
|---|---|---|---|---|
| `ch02_01` | `bg_school_classroom` | `bgm_daily_01` | 燼核の残量が乏しいと判明。狩り場の割り当て | C10 |
| `ch02_02` | `bg_eikai_clock` | `bgm_battle_01` | 翳界「時計」。ムニが戦闘中に硬直する | ─ |
| `ch02_03` | `bg_school_infirmary` | `bgm_sad` | ムニが眠り続ける。原因不明 | C11 |
| `ch02_04` | `bg_school_rooftop_day` | `bgm_renny` | レニィがムニに付き添う。二人が並ぶ絵の違和感 | C12 |
| `ch02_05` | `bg_town_park` | `bgm_daily_02` | **善意→最悪①**：ハルがムニを戦線から外す判断。ムニは喜ぶが… | **C13（大）** |
| `ch02_06` | `bg_eikai_clock` | `bgm_battle_02` | ムニ抜きの戦闘。負担がゲルに集中する | ─ |
| `ch02_07` | `bg_school_classroom` | `bgm_tension` | **ネオ初登場**。燼核を奪い、6人を一蹴して去る | ─ |
| `ch02_08` | `bg_town_slope_night` | `bgm_neo` | ネオを追う。「貴様らは、あってはならぬ」 | C14 |
| `ch02_09` | `bg_school_corridor` | `bgm_jinpachi` | ジンパチが激昂。単独でネオを狩ると言い出す | C15 |
| `ch02_10` | `bg_eikai_void` | `bgm_battle_02` | ジンパチ単独行動の顛末。追うか止めるか | C16 |
| `ch02_11` | `bg_school_infirmary` | `bgm_sad` | ムニが目覚める。だが「きのうのこと」を覚えていない | ─ |
| `ch02_12` | `bg_school_rooftop_night` | `bgm_geru` | ゲルがムニの異変に何かを察している素振り | C17 |
| `ch02_13` | `bg_school_infirmary` | `bgm_horror` | ムニの手が、一瞬だけ背後の景色を透かす **章末** | ─ |

### 第3章「軋む」

| ID | bg | bgm | 内容 | 選択肢 |
|---|---|---|---|---|
| `ch03_01` | `bg_school_classroom` | `bgm_tension` | 燼核の枯渇が決定的に。誰に配分するかの会議 | **C18（大）** |
| `ch03_02` | `bg_town_shopping` | `bgm_hyu` | ヒュウの様子がおかしい。単独行動が増える | C19 |
| `ch03_03` | `bg_eikai_theater` | `bgm_battle_01` | 翳界「劇場」。ヒュウの戦い方が自傷的 | ─ |
| `ch03_04` | `bg_school_storage` | `bgm_horror` | **善意→最悪②**：ヒュウが燼核を独占していたと露見。動機はゲルの負担軽減 | **C20（大）** |
| `ch03_05` | `bg_school_classroom` | `bgm_sad` | 疑心の連鎖。誰が誰を信じるか | C21 |
| `ch03_06` | `bg_town_slope_night` | `bgm_neo` | ネオと交渉。彼は「消すべきものが5つある」と言う | C22 |
| `ch03_07` | `bg_school_rooftop_night` | `bgm_quiet` | レニィが初めて真面目な顔をする。「僕、たまに変な夢を見るんだ」 | C23 |
| `ch03_08` | `bg_town_park` | `bgm_muni` | ムニとの時間。彼が急速に幼くなっていく | C24 |
| `ch03_09` | `bg_eikai_theater` | `bgm_battle_02` | 分裂状態での戦闘。連携が崩壊する | ─ |
| `ch03_10` | `bg_school_corridor` | `bgm_jinpachi` | ジンパチがハルに本音を吐く。「俺は何のために熱くなってんだ」 | C25 |
| `ch03_11` | `bg_school_gate_night` | `bgm_geru` | ゲルが単独で街を出ようとしている。引き止めるか | ─ |
| `ch03_12` | `bg_ruin_street_night` | `bgm_neo` | ネオがゲルの前に立つ。ハルが割って入る | ─ |
| `ch03_13` | `bg_ruin_street_night` | `bgm_shock` | ネオ「貴様らは、人間ではない」 **章末** | ─ |

### 第4章「暴く」

| ID | bg | bgm | 内容 | 選択肢 |
|---|---|---|---|---|
| `ch04_01` | `bg_ruin_street_night` | `bgm_shock` | ネオの断言の余波。全員が動揺 | C26 |
| `ch04_02` | `bg_school_classroom` | `bgm_shell` | シェルを呼び出し、問い質す。**「訊かれなかったから答えなかった」** | ─ |
| `ch04_03` | `bg_flashback_ruin` | `bgm_geru_theme` | 回想：3年前。家族を喪ったゲル。独りの戦い | ─ |
| `ch04_04` | `bg_flashback_ruin` | `bgm_geru_theme` | 回想：願い「もう二度と、独りで戦いたくない」 | ─ |
| `ch04_05` | `bg_eikai_void` | `bgm_shock` | 願いの成就の仕方。翳から5体が実体化した記録 | ─ |
| `ch04_06` | `bg_school_classroom` | `bgm_sad` | **伏線A回収**：ムニ＝喪われた弟、レニィ＝生きていたら在ったはずの弟 | ─ |
| `ch04_07` | `bg_school_corridor` | `bgm_sad` | **伏線B回収**：ハルの灯核が無色な理由。素材のない空白の器 | **C27（大）** |
| `ch04_08` | `bg_school_rooftop_night` | `bgm_geru_theme` | **伏線C回収**：ゲルの浄化が不完全な理由。5人分を支え続けている | ─ |
| `ch04_09` | `bg_school_classroom` | `bgm_tension` | ヒュウの素材＝墜化した先輩。彼が最も墜化に近い | C28 |
| `ch04_10` | `bg_town_slope_night` | `bgm_jinpachi` | ジンパチの素材＝名も知らぬ誰か。「名前がねえのかよ、俺には」 | C29 |
| `ch04_11` | `bg_school_storage` | `bgm_horror` | **裏切り確定シーン**（分岐：ヒュウ／ジンパチ／ネオ） | ─ |
| `ch04_12` | `bg_town_park` | `bgm_sad` | **決別確定シーン**（分岐：ムニ／レニィ／ゲル） | **C30（大）** |
| `ch04_13` | `bg_school_rooftop_night` | `bgm_quiet` | 残された者たちの夜。ハルが選択を迫られる | C31 |
| `ch04_14` | `bg_school_infirmary` | `bgm_shock` | ゲルの灯核が半ばまで黒く染まる **章末** | ─ |

### 第5章「灯す」

| ID | bg | bgm | 内容 | 選択肢 |
|---|---|---|---|---|
| `ch05_01` | `bg_school_classroom` | `bgm_tension` | 残された時間の計算。ゲルの墜化まであと僅か | C32 |
| `ch05_02` | `bg_town_slope_night` | `bgm_neo` | ネオとの決着（戦う／説得する） | **C33（大）** |
| `ch05_03` | `bg_eikai_void` | `bgm_battle_03` | ネオ戦 or ネオとの共闘（C33により分岐） | ─ |
| `ch05_04` | `bg_school_rooftop_night` | `bgm_quiet` | 仲間との最後の対話（絆値により登場者が変動） | C34 |
| `ch05_05` | `bg_flashback_ruin` | `bgm_geru_theme` | ゲルの願いの正体に、ハルだけが手を届かせられる理由 | ─ |
| `ch05_06` | `bg_school_gate_night` | `bgm_tension` | **善意→最悪③**：ゲルを救う行為が5人の消滅条件を満たすと判明 | **C35（大）** |
| `ch05_07` | `bg_eikai_final` | `bgm_battle_03` | 最終戦・前半。ゲルの灯核に潜る | ─ |
| `ch05_08` | `bg_eikai_final` | `bgm_battle_03` | 最終戦・中盤。裏切り者との対峙 | ─ |
| `ch05_09` | `bg_eikai_final` | `bgm_despair` | 最終戦・後半。墜化の兆候 | ─ |
| `ch05_10` | `bg_eikai_core` | `bgm_quiet` | 灯核の最深部。3年前のゲルが独りで座っている | **C36（最終選択）** |
| `ch05_11` | `bg_eikai_core` | `bgm_hope` | 選択の実行（分岐集約点A：希望系） | ─ |
| `ch05_12` | `bg_eikai_core` | `bgm_despair` | 選択の実行（分岐集約点B：絶望系） | ─ |
| `ch05_13` | `bg_eikai_core` | `bgm_neo_theme` | 選択の実行（分岐集約点C：外環系） | ─ |
| `ch05_14` | `bg_eikai_core` | `bgm_ending_bridge` | エンディング判定処理シーン | ─ |

### エンディング

| ID | 種別 | 題 | bg | bgm |
|---|---|---|---|---|
| `end_true` | TRUE | **余白に灯る** | `bg_epilogue_dawn` | `bgm_true` |
| `end_good_a` | GOOD A | **明けの星** | `bg_epilogue_dawn` | `bgm_hope` |
| `end_good_b` | GOOD B | **受け継ぐ手** | `bg_town_slope_day` | `bgm_hope` |
| `end_normal` | NORMAL | **続く朝** | `bg_school_classroom` | `bgm_daily_01` |
| `end_bad_a` | BAD A | **刃の理由** | `bg_eikai_core` | `bgm_despair` |
| `end_bad_b` | BAD B | **独りの灯守** | `bg_ruin_street_night` | `bgm_despair` |
| `end_bad_c` | BAD C | **墜ちる** | `bg_eikai_void` | `bgm_horror` |
| `end_secret` | SECRET | **外環の剣** | `bg_gaikan` | `bgm_neo_theme` |

---

## 3. 選択肢設計（全36個）

- 変動幅: **小 ±3 / 中 ±6 / 大 ±10**
- **原則: 1つの選択肢で最低2人の絆値を動かす。** 誰かを立てれば誰かが下がるトレードオフを積極的に用いる。
- 絆値はUIに数値表示しない。章間の「絆の章」画面で立ち絵の表情として示す。

| ID | シーン | 選択肢概要 | 主な変動 |
|---|---|---|---|
| C01 | `pr_03` | シェルに何を尋ねるか（3択） | ─（フラグ `asked_about_contract`） |
| C02 | `ch01_01` | ゲルへの初対応（警戒／素直／おどける） | geru ±3, jinpachi ∓3 |
| C03 | `ch01_02` | ジンパチの挑発への返し | jinpachi ±6, hyu ∓3 |
| C04 | `ch01_03` | 寝ているレニィを起こす／そっとしておく | renny ±6, jinpachi ∓3 |
| C05 | `ch01_04` | ムニに手を差し出す／待つ | muni ±6, geru ±3 |
| C06 | `ch01_07` | 模擬戦で手を抜く／全力 | jinpachi ±6, renny ∓3 |
| C07 | `ch01_08` | ヒュウの自慢に付き合う／流す | hyu ±6, geru ∓3 |
| C08 | `ch01_10` | **戦闘で誰を庇うか（4択）** | 対象+10 / 他2名-3 |
| C09 | `ch01_12` | ムニの言い間違いを追及する／流す | muni ∓6, renny ±6, フラグ `noticed_muni_slip` |
| C10 | `ch02_01` | 狩り場の割り当てを誰に譲るか | 対象+6 / 他-3 |
| C11 | `ch02_03` | 眠るムニに付き添う／戦線に戻る | muni ±6, geru ∓6 |
| C12 | `ch02_04` | レニィとムニの違和感に触れる／触れない | renny ∓6, フラグ `noticed_hair_color` |
| C13 | `ch02_05` | **ムニを戦線から外す／連れて行く（善意→最悪①）** | muni +10/-6, geru -6/+6, フラグ `muni_benched` |
| C14 | `ch02_08` | ネオに敵意を示す／対話を試みる | neo ±10, jinpachi ∓6 |
| C15 | `ch02_09` | ジンパチの単独行動を止める／認める | jinpachi ±6, geru ∓6 |
| C16 | `ch02_10` | 追いかける／仲間を守る | jinpachi ±6, hyu ±6（排他） |
| C17 | `ch02_12` | ゲルを問い詰める／待つ | geru ±6, フラグ `pressed_geru` |
| C18 | `ch03_01` | **燼核を誰に配分するか（5択）** | 対象+10 / 他各-3 |
| C19 | `ch03_02` | ヒュウを尾行する／信じる | hyu ∓6, フラグ `tailed_hyu` |
| C20 | `ch03_04` | **ヒュウの独占を糾弾／庇う（善意→最悪②）** | hyu -10/+10, jinpachi +6/-6, geru ±6 |
| C21 | `ch03_05` | 誰の側に立つか（3択） | 対象+6 / 他-6 |
| C22 | `ch03_06` | ネオの取引に応じる／拒む | neo ±10, geru ∓6, フラグ `neo_deal` |
| C23 | `ch03_07` | レニィの「変な夢」を聞く／聞かない | renny ±10, フラグ `heard_renny_dream` |
| C24 | `ch03_08` | 幼児化するムニへの接し方 | muni ±6, renny ±3 |
| C25 | `ch03_10` | ジンパチの本音への応答 | jinpachi ±10, フラグ `jinpachi_bond_deep` |
| C26 | `ch04_01` | ネオの断言を否定する／受け止める | neo ±6, geru ∓6 |
| C27 | `ch04_07` | **自分が空白だと知った時の反応（3択）** | 全員 ±3, フラグ `accepted_self` |
| C28 | `ch04_09` | ヒュウを墜化から遠ざける／任せる | hyu ±10, フラグ `hyu_watched` |
| C29 | `ch04_10` | ジンパチに名を贈る／贈らない | jinpachi ±10, フラグ `named_jinpachi` |
| C30 | `ch04_12` | **決別する相手を引き止める／送り出す** | 対象 ±10, 他全員 ∓3 |
| C31 | `ch04_13` | 何を優先すると宣言するか（3択） | 全員 ±6 |
| C32 | `ch05_01` | 残り時間の使い道 | 対象+6 |
| C33 | `ch05_02` | **ネオと戦う／説得する／共に行く** | neo -10/+10/+20, フラグ `neo_ally` `neo_route` |
| C34 | `ch05_04` | 最後に言葉を交わす相手（絆値上位から選択） | 対象+6 |
| C35 | `ch05_06` | **ゲルを救う／5人を守る（善意→最悪③）** | 大幅変動, フラグ `chose_geru` |
| C36 | `ch05_10` | **最終選択（4択）** | フラグ `final_choice` |

---

## 4. 裏切り者・決別者の決定ロジック

仕様上「1人は必ず裏切り、1人は必ず離脱する」。**誰がそうなるかは状態で変動する。**
判定は `src/engine/fate.ts` に純関数として実装し、単体テストで全分岐を網羅する。

### 裏切り者（第4章 `ch04_11` で確定）

```
if (flags.hyu_hoarded && bond.hyu < 50)      -> hyu
else                                          -> argmin(bond) among [hyu, jinpachi, neo]
   tie-break priority: hyu > jinpachi > neo
```

| 裏切り者 | 動機 | 帰結 |
|---|---|---|
| ヒュウ | 墜化への親和が最も高く、ゲルを「先に楽にする」ため灯核を砕こうとする | 最も痛切。憎めない |
| ジンパチ | 名も無き存在である自分を認められず、ネオの取引に乗る | 熱血の裏返し |
| ネオ | 交渉が成立していた場合、任務優先に立ち戻り約束を破る | 最も予測可能 |

### 決別者（第4章 `ch04_12` で確定）

```
if (bond.muni < 50)        -> muni    // 存在を維持できず消える
else if (bond.renny < 50)  -> renny   // 自ら真実を選び、消えることを望む
else                       -> geru    // 単身で墜化を引き受けに行く
```

---

## 5. パラメータ

| 名称 | 範囲 | 説明 |
|---|---|---|
| `bond.{renny,hyu,jinpachi,muni,geru,neo}` | -20 〜 100 | 絆値。初期0。**恋愛ではなく信頼度** |
| `taint` | 0 〜 100 | ハルの翳。戦闘・特定選択肢で上昇。燼核使用で減少 |
| `flags.*` | boolean | `content/flags.md` に全一覧 |

**閾値**: 60以上=信頼 / 30〜59=良好 / 0〜29=中立 / -1以下=不和

---

## 6. エンディング判定

**第5章末に以下の優先順で評価する。** 実装は `src/engine/ending.ts` の純関数、全8分岐に単体テスト必須。

| 優先 | ID | 条件 |
|---|---|---|
| 1 | `end_secret` | `bond.neo >= 90` かつ `flags.neo_identity_revealed` かつ `flags.neo_route` |
| 2 | `end_bad_c` | `taint >= 100` |
| 3 | `end_bad_a` | いずれかの `bond <= -1` かつ `flags.betrayal_completed` |
| 4 | `end_bad_b` | `bond >= 60` の人数が 0 |
| 5 | `end_true` | 真相フラグ全取得 かつ `bond >= 60` が4人以上 かつ `flags.muni_alive` |
| 6 | `end_good_a` | `bond >= 60` が3人以上 かつ 真相フラグの過半数取得 |
| 7 | `end_good_b` | `sum(bond) >= 200` かつ 真相フラグ未達 |
| 8 | `end_normal` | 上記いずれも満たさず `sum(bond) >= 100`。**さらに満たさない場合も `end_normal` にフォールバック**（到達不能状態を作らない） |

> 注: 優先順は「BAD系を先に評価する」。GOOD条件を満たしていても翳が満ちていれば `end_bad_c` が優先される。
> 真相フラグ = `truth_wish` / `truth_material` / `truth_haru_blank` / `truth_neo_origin` の4種。

---

## 7. ルート分岐図

```
                          [プロローグ]
                               |
                          [第1章 灯る]
                               |
                     (絆値の初期分布が決まる)
                               |
                          [第2章 翳る]
                          /          \
              muni_benched=true    muni_benched=false
                          \          /
                          [第3章 軋む]
                          /     |     \
                    hyu独占  neo取引  分裂回避
                          \     |     /
                          [第4章 暴く]
                     |            |            |
              裏切り=ヒュウ  裏切り=ジンパチ  裏切り=ネオ
                     |            |            |
              決別=ムニ / 決別=レニィ / 決別=ゲル
                          \     |     /
                          [第5章 灯す]
                     /            |            \
            C33=戦う       C33=説得        C33=共に行く
                     \            |            /
                        [ending 判定 §6]
                     /   |   |   |   |   |   |   \
                 TRUE GOODa GOODb NORM BADa BADb BADc SECRET
```

---

## 8. 全ルート到達性の保証（フェーズ4で検証）

- 全80シーンが最低1つの経路から到達可能であること。
- 全8エンディングが到達可能であること。到達手順は `docs/WALKTHROUGH.md` に記載。
- 全シーンの `next` および選択肢の `next` の参照先が実在すること（`npm test` のリンク切れ検出で担保）。

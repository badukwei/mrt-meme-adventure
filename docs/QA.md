# MVP 驗收紀錄

日期：2026-10-17。環境：Chrome 桌面、390×844 與 320×740 響應式視窗。響應式視窗不等同實體手機。

## 已驗證

- 四關固定順序完整走到結算，低分不淘汰。
- 實測四段分數 0、4、57、80，結算正確合計 141，稱號「通勤倖存者」。
- 老人每回合一次輸入；換位無過渡動畫，避免顯示與判定不同步。
- 消臭實際點擊一團取得 4 分；64px 點擊範圍，從腋下生成並漂移。
- 合腿實際連點累計；未完成有部分分數，另一輪完成 70 次後提前結算為 64 分。
- 下車左右換道有效；碰撞不終止，成功閃過才計分。
- 暫停視窗及恢復操作正常；計時與輸入凍結有核心測試覆蓋。
- 390px 挑戰畫面與 320px 結算文字沒有水平溢出。
- 下載 720×960 PNG，已開啟檢視；稱號、總分、四段成績與頁面一致。
- `npm test`：9 項測試通過，包含分數邊界、完整目標數、重複輸入、早完成、暫停、新局狀態。
- 語法檢查：`node --check src/app.js`；差異檢查：`git diff --check`。

- 結算「再搭一班」回到開場及老人對話，已完成關卡標記歸零。
- 瀏覽器錯誤紀錄只有既有錢包擴充套件的 ethereum 注入衝突，未看到遊戲腳本錯誤。

## 實體手機待驗收

- iOS Safari／Android Chrome 的實際觸控、長按、多指、防誤縮放與安全區。
- 切到其他 App 再返回：停在暫停視窗，剩餘時間不減少。
- 原生分享面板、取消分享與下載備援；尚未對外傳送成績卡。
- 以正常閱讀速度遊玩，確認約 3–5 分鐘及 70 次連點手感。挑戰總時長上限 105 秒，加四次倒數共 117 秒，其餘時間由閱讀速度決定。

## 本機除錯

`?stage=elder&seed=1` 可直接進單關教學；stage 支援 elder、odor、legs、crowd。
僅 localhost、127.0.0.1、[::1] 啟用。seed 固定亂數供重現，未指定時正常隨機。
單關除錯的前面關卡以 0 分補齊；正常首頁流程不補分。

## 第一關改版（2026-10-18）

舊版老人左右按鈕與 25 秒規則已被取代：現在直接點老人、15 秒、每 0.65 秒換位、每次換位一次踢擊、0.32 秒冷卻；4／8／12 次分別切換瘀青、腫臉、倒地，12 次提前完成。

瀏覽器驗證：直接點擊後累積 5 次命中、42 分並載入瘀青圖；背景容器沒有位移樣式，截圖確認只有角色換位。另觀察到 100 分倒地結算。新背景同步用於老人對話與回饋。10 項核心測試包含新玩法提前完成、點空消耗機會與跨換位冷卻。


## 2026-10-18 — 新第一關接尿

- 新增 12 秒／18 滴的三道接尿，總共五關、500 分；老人改為第二關，玩法與傷勢圖保留。
- `npm test`：12 項通過，涵蓋同道接取、異道漏接、單次計分、所有尿滴限時內判定、暫停及原四關回歸。
- 桌面瀏覽器：接尿開始、方向鍵／按鈕、暫停／繼續、12 秒結算、下一段接續老人對話通過。
- 390 × 844 手機尺寸：角色／桶子／尿滴載入成功，無水平溢出；尿流起點依圖片實際顯示尺寸對齊雙手。
- 素材：新車廂背景、黑人 Wojak 動作圖、Wojak 桶子與尿滴；每張 PNG 旁保存生成提示詞。
- 實體手機觸控、原生分享仍待人工驗收；瀏覽器尺寸模擬不等同實機。
- 最後一關除錯入口：結算顯示五段成績與 500 分上限，下載成績卡回報成功；前四段在此測試由除錯入口填入 0 分。

## 2026-10-19 — main 五關圖像整合

- 後三關新增 Wojak 吊嘎男、合腿三姿勢及通勤人群；原始圖與提示詞存於 `assets/characters/`。
- Chrome 自動化以實際按鈕／滑鼠／方向鍵操作，受控瀏覽器時鐘推進遊戲。從首頁依序完成接尿、老人、消臭、合腿、下車，分數 33／0／4／88／75，總分 200／500。
- 五關均驗證暫停期間計時不變、恢復後完成；合腿 36 次顯示半合，70 次提前完成並顯示合上姿勢。
- 結算包含五段成績；實際下載並檢視 720×960 PNG，總分和各段成績一致。重玩清除完成標記並回到接尿劇情。
- 390×844 全流程無水平溢出；320×740 檢查後三關，臭氣點擊範圍未超出螢幕。檢視消臭、合腿、下車及分享卡截圖。
- 無頁面 JavaScript 錯誤或素材 HTTP 錯誤，所有場景圖片完成載入。
- `npm test` 12 項通過；`node --check src/app.js`、`git diff --check` 通過。
- 本輪為桌面 Chrome 與響應式尺寸驗證，未取代實體手機、多指、切 App 或原生分享驗收。

## 2026-10-19 — 消臭關視角與難度升級

- 專用正面對坐背景、同角色坐姿、Wojak 除臭劑及臭氣團，四張生成素材及原始提示詞存入既有 assets 分類目錄；透明角色與道具已確認 alpha。
- 25 秒／54 團／18 波，波量依序 2、3、4；波距與存活時間遞減，移動速度隨有效遊戲時間增加。保留 68px 目標區，邊界反射避免目標飛出遊戲區。
- 15 項核心測試通過：各波數量、存活時間與最後一波截止、後段速度、三種尺寸運動邊界、單次計分、完美 100 分、全漏 0 分、暫停與原四關回歸。
- Chrome 觸控模擬，390×844、320×740、1000×900：開局同時 2 團，後段同時 8 團；實際 tap 噴除一團得到 2 分，瓶身動作、噴射線及定點噴霧可見。
- 三尺寸皆驗證暫停時剩餘時間與臭氣位置不變；圖片正常載入、無水平溢出、所有目標至少 64px 且位於場內；無頁面腳本或 HTTP 素材錯誤。
- 結束顯示 2／100，下一段正確進入合腿劇情。已檢視早期、後期及噴霧截圖。
- 自動化使用受控時鐘與實際觸控事件，不能代替實體手機手感驗收；難度最終仍可依玩家實測微調。

## 2026-10-20 — 合腿關鄰座演出

- 新增鄰座斜側背景、同角色三表情姿勢與前景推手，生成提示詞、原始整張姿勢圖及正規化裁切資訊一併保存在 assets。
- 三階段：張腿嘴硬、35 次後臉紅咬牙抵抗、70 次後氣昏。每次有效操作顯示手掌推膝蓋、角色位移反應與撞擊符號。
- 完成時鎖定輸入並展示 1.1 秒氣昏演出，再進入回饋；對話依進度加入結界、氣場與下次算帳等文案。
- Chrome 390×844、320×740、1000×900：實際 touch tap 與滑鼠連點推滿 70 次，三個姿勢與台詞切換正確，提前完成得 90 分，隨後正確銜接下車關。
- 暫停不扣時間；長按一秒只算一次；時間到未完成使用原有姿勢和低分台詞，不誤觸氣昏演出。
- 截圖檢視推手、憤怒、氣昏，圖片皆成功載入，無水平溢出或頁面／素材錯誤。手部動畫起始即顯示，避免快速連點時看不清手。
- 15 項核心測試通過；JS 語法與 git diff 檢查通過。實體手機手感仍待玩家試玩。

## 2026-10-21 — 高速下車人潮與上班族主角

- 主角正反圖：疲憊中年上班族、黑眼圈鬍渣、亂髮、皺淺藍襯衫、鬆領帶與棕色公事包。開場用正面、下車玩家用背面，與正面搶上車的路人方向相反。
- 新增開門朝月台背景、擁擠搶上車劇情圖、四種不同服裝輪廓的 Wojak 路人；全部生成原圖、提示詞及裁切方式保存在 assets。
- 下車關 24 秒／32 波／64 人，同波兩人擋兩道，剩一道空隙且不連續重複；行進時間 1.4 秒遞減至 0.65 秒，依成功閃過波數換算 100 分。
- 核心測試 15 項通過。新波次測試驗證完美 100 分、全撞 0 分、單次判定；30 個種子驗證空隙可通行、每波至少約 0.63 秒換道時間、所有判定在限時內完成。
- Chrome 390×844、320×740、1000×900：實際觸控換道、觀察四種人物、暫停時位置與時間凍結、三尺寸無水平溢出且圖片正常載入；無頁面或資源錯誤。
- 瀏覽器先操作再站定的測試取得 50／100；單關除錯其餘四關填 0，最後結算顯示五列、50／500，下載分享卡成功。重玩清空進度並顯示新主角開場。
- 已檢視劇情、早期及後期遊戲截圖，放大路人並加上遠端等待上車人潮；警示與玩家操作保持可讀。
- 未做實體手機手感或原生分享面板驗證。

## 2026-10-22 — Title screen and elder skin color

- Added a dedicated station-exterior title background with the tired office protagonist, title 台北捷運奇遇記 and a single 點擊開始 button. Header and route are hidden only on the home screen.
- Recolored all four elder states with warm skin tones; original sprites retained, new PNGs retain alpha. Generation prompts saved beside assets.
- Playwright checks passed at 320×740, 390×844 and 1000×900: home controls, start transition, no horizontal overflow, all four elder states, 12-hit completion and 100-point result, no page errors or failed resources.
- `npm test`: 15 passed. `node --check src/app.js` passed. Screenshots reviewed in `/tmp/mrt-title-qa/`. Physical devices not tested.

## 2026-10-22 — Organized assets and dedicated dialogue scenes

- Moved historical PLAN.md to docs/planning/history.md; current rules now live in docs/planning/current.md. README links to the canonical documents.
- Centralized generation prompts in docs/art/prompts. Retired character art moved to assets/archive, original atlases to assets/sources, preserving files. Added docs/art/ASSETS.md inventory.
- Generated five distinct full-scene Wojak illustrations in assets/backgrounds/dialogue with built-in imagegen. Dialogue and tutorial use these scenes; gameplay retains its separate backgrounds and sprites.
- Playwright traversed all five dialogue/tutorial/gameplay/feedback stages and the five-row ending at 320×740, 390×844 and 1000×900. Verified scene sources, image decoding, no horizontal overflow, no page errors or HTTP failures. Screenshots: /tmp/mrt-dialogue-qa.
- 15 core tests passed; app syntax and git diff whitespace checks passed. Physical devices not tested.

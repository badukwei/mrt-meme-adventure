# 台北捷運奇遇記

手機直式的 Wojak 捷運五關小遊戲，原生 JavaScript + DOM/CSS，無後端與建置需求。

## 開發

- `npm start`：http://127.0.0.1:5173
- `npm test`：核心玩法測試
- 本機跳關：`?stage=legs&seed=1`，可指定 urine、elder、odor、legs、crowd。

## 目錄

- `src/`：畫面、劇情、玩法與樣式。
- `tests/`：核心玩法測試。
- `assets/characters/`、`assets/props/`：遊戲角色與道具。
- `assets/backgrounds/`：遊戲與首頁背景；`dialogue/` 是每關完整對話情境圖。
- `assets/sources/`：原始生成圖集。
- `assets/archive/`：已替換舊素材。
- `docs/planning/`：現行規格與歷史規劃。
- `docs/art/`：美術索引與集中保存的提示詞。
- `docs/QA.md`：驗收紀錄。
- `output/promo/`：本機宣傳影片，Git 忽略。

[現行規格](docs/planning/current.md) · [歷史規劃](docs/planning/history.md) · [美術索引](docs/art/README.md) · [驗收](docs/QA.md)

main 為五關開發版，release/v1 為既有兩關 GitHub Pages 部署版。靜態部署需要 index.html、src/ 與執行時使用的 assets。

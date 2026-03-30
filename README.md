# 🏭 AI-Factory (AI 工廠母體平台)

歡迎來到 **AI-Factory**！這是一個專門為了編排、管理與部署多專案 AI 服務而打造的中央指揮平台。

## 🚀 快速啟動 (Quick Start)
我們將所有的營運邏輯整合進了互動式的 `./run.sh` 腳本中。

```bash
./run.sh
```

### 🎮 操作清單 (Action Menu)
執行腳本後，您可以選擇以下操作：
1. **🚀 Start Environment**：啟動完整的基礎設施與服務。
2. **🛑 Stop & Cleanup**：一鍵停止 Docker 容器並殺掉所有背景進程（Backend, Frontend, Tunnels）。
3. **📦 Deploy to Firebase**：Standalone 部署模式，直接將前端同步至固定網址。

---

## 🛠️ 部署模式 (Environment Modes)
在啟動環境時，您可以選擇三種不同的部署模式：

### 1. 🛠️ DEV (本地開發)
*   **網址**：`http://localhost:5173`
*   **用途**：純本機代碼修改，不開啟任何對外隧道。

### 2. 🧪 STAGING (ngrok 預備環境)
*   **網址**：由 ngrok 生成的隨機 URL。
*   **特性**：自動啟動 ngrok 隧道並將 URL 注入前端配置，適合快速分享給他人預覽。

### 3. 🌍 PRODUCTION (Cloudflare + Firebase 自動部署)
*   **網址**：[https://factory-game.web.app](https://factory-game.web.app)
*   **特性**：**最強自動化模式！** 啟動 Cloudflare 隧道後，腳本會自動將隨機網址同步至前端建置過程，並自動完成 `firebase deploy`。
*   **結果**：您的固定網址會與您本機正運行的後端實現「無痛對接」。

---

## 📂 目錄架構 (Architecture)
- `run.sh`：統一指揮中心腳本 (Command Center)。
- `backend/`：FastAPI 後端，負責 AI 原生能力的資源編排。
    - `backend.log`：後端即時日誌。
- `frontend/`：Vite + TailwindCSS 全螢幕管理面板。
    - `frontend.log`：前端開發伺服器日誌。
- `scripts/`：
    - `share_ngrok.py`：Staging 模式的自動化工具。
    - `catch_tunnel.sh`：Production 模式的網址捕捉器。
- `ai_notice/`：
    - `rescue_skills.md`：核心自救技能與快速指令。🆘✨
    - `pits_and_learnings.md`：技術精華與重大踩坑紀錄。🧠
    - `essentials.md`：系統設計與 API 規範。
- `.firebaserc`：Firebase 專案關聯配置 (`ai-factory-tarot`)。

---

## 🛡️ 維護與救援 (Support)
如果您遇到 API 連線問題或 CORS 報錯，請優先：
1. 使用 `./run.sh` -> 選項 `2` 進行完全清理。
2. 重新執行並選擇模式 `3` 進行自動化部署同步。
3. 詳細踩坑紀錄請參考：[ai_notice/pits_and_learnings.md](ai_notice/pits_and_learnings.md)

---
👉 **Production Portal**: [https://factory-game.web.app](https://factory-game.web.app)
*Powered by Antigravity AI Engine* 👏✨

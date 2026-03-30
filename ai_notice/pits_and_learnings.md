# 🧠 AI-Factory: 踩坑與學習紀錄 (Pits & Learnings)

本文件紀錄了在開發 **AI-Factory** 統一管理平台期間遇到的重大技術挑戰、解決方案以及核心經驗。

## 1. 身份驗證 (Authentication) 🕳️
*   **坑 (The Pit)**: Google OAuth 在 `iframes` 內使用 `signInWithRedirect` 會被攔截（403 錯誤），因為 Google 禁止在嵌入式環境中使用重定向登入。
*   **解決 (Solution)**: 全面切換為 `signInWithPopup`。這不僅解決了 `Kitty-Help` 在 `ProjectViewer` 內無法登入的問題，也提升了使用者體驗。
*   **學習 (Learning)**: 在開發「多層級」或「平台型」應用時，務必考慮第三方服務的安全限制。

## 2. 跨來源資源共享 (CORS) 🌐
*   **坑 (The Pit)**: 使用動態隧道（Cloudflare/ngrok）時，後端 URL 每次啟動都會變動，導致 Firebase 上的前端出現 CORS 阻擋。
*   **解決 (Solution)**: 在 FastAPI 的 `CORSMiddleware` 中引入 `allow_origin_regex`，動態識別所有的 `*.trycloudflare.com` 網域，並精確允許 Firebase 的生產網域。
*   **學習 (Learning)**: `allow_origins=["*"]` 在某些瀏覽器安全機制下（特別是涉及 Credentials 時）並不保險，使用正規表示式是平衡靈活性與安全性的最佳手段。

## 3. 系統生命週期管理 (Lifecycle) 🚀
*   **坑 (The Pit)**: 原本的啟動腳本過於分散（有 `run.sh` 有 `run_all.sh`），且無法處理背景進程殘留，導致埠號衝突。
*   **解決 (Solution)**: 
    *   開發了互動式的 **Unified Command Center (`run.sh`)**。
    *   使用 `pkill -P $$` (殺掉當前 Shell 的所有子進程) 與 `cleanup` 陷阱函數，確保 `Ctrl+C` 時所有後端、前端、隧道與 Docker 都能一併關閉。
*   **學習 (Learning)**: 指令流程的「一體化」與「自動化」能極大減少人工維護成本，特別是將「隧道分配」與「前端部署」自動串接。

## 4. 前端環境變數 (Environment Variables) ⚛️
*   **坑 (The Pit)**: Vite 在 `npm run build` 時會將環境變數固化。這意味著如果隧道網址變了，必須重新 Build 才能生效。
*   **解決 (Solution)**: 在 `run.sh` 中增加自動化邏輯，獲取隧道網址後立即生成 `frontend/.env.production`，接著跑 `npm run build` 並自動 `firebase deploy`。
*   **學習 (Learning)**: 透過腳本串接「獲取動態 URL」->「注入配置」->「發布」，實現了真正的「即時上線」。

---
*最後更新：2026-03-30* 👏✨

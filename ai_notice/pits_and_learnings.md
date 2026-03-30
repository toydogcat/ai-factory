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
## 5. 環境隔離與工具衝突 (Conda vs. uv) 🐍
*   **坑 (The Pit)**: 在遠端節點上使用 `uv run` 時，它會自動建立一個空的 `.venv`，內容會蓋掉原本 Conda 環境裝好的 `psutil`, `pydantic-settings` 等套件，導致運行時報錯。
*   **解決 (Solution)**: 在 `run.sh` 中強制略過 `uv run` 邏輯，改用 `python -m uvicorn` 並指定 `PYTHONPATH=.`，確保載入正確的環境。
*   **學習 (Learning)**: 在混合多個環境管理工具（Conda, uv, pip）的系統中，明確路徑與執行權限是穩定性的關鍵。

## 6. 非互動式 Shell 的路徑問題 (PATH Issues) 🐚
*   **坑 (The Pit)**: 透過 SSH 或自動化腳本執行時，Shell 往往不會載入 `.bashrc` 或 `.zshrc` 中的 `conda` 配置，導致報錯 `command not found`。
*   **解決 (Solution)**: 在腳本中使用絕對路徑（例如：`/home/toby/miniconda3/bin/conda`）來執行指令，徹底解決路徑消失的問題。
*   **學習 (Learning)**: 腳本化部署時，絕不依賴使用者的 `PATH`，務必使用「全路徑」或「主動偵測」。

## 7. 端口佔用與殭屍程序 (Port Management) 🧟
*   **坑 (The Pit)**: 舊的 `uvicorn` 程序如果沒被徹底殺掉，會死守 `7051` 埠，導致新啟動的後端無法啟動，前端則看到 502/CORS 錯誤。
*   **解決 (Solution)**: 在 `cleanup` 函數中加入 `fuser -k 7051/tcp` 與 `fuser -k 5173/tcp`，強力清除佔用埠號。
*   **學習 (Learning)**: 對於長期運行的遠端伺服器，`pkill` 往往不夠，必須針對「埠號」進行物理清理。

## 8. 動態路徑導向 (Self-Aware Paths) 📂
*   **坑 (The Pit)**: 後端尋找「老遊戲 (Studio Projects)」時使用了開發本機的絕對路徑，導致遠端機部署時報 404。
*   **解決 (Solution)**: 將 `STUDIO_PATH` 改為基於 `__file__` 的相對路徑追蹤，使其在任何節點上都能正確找到專案根目錄。
*   **學習 (Learning)**: 所有的檔案系統存取都應具備「環境感知」能力，避免使用寫死的絕對路徑。

---
*最後更新：2026-03-30* 👏✨

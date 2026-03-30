# 💎 AI-Factory 技術精華 (Architecture Essentials)

本文件紀錄了 AI-Factory 的核心設計想法，特別是那些解決「跨網域、子路徑佈署」痛點的關鍵技術。

## 1. 核心架構：通用孤島路由 (Universal Island Routing)
這是讓任何 AI 專案（如 `ai-tarot`）不需要修改程式碼就能從外部存取的關鍵。

- **問題**：許多 Vite 前端專案使用絕對路徑（如 `/ui-assets/...`）。當它們被放在 `trycloudflare.com/ai-factory-room/` 時，瀏覽器會去網站根目錄找資源，導致 404。
- **解決方案 (Referer-based Match)**：
    - 我們在 Traefik 中設定了一個優先權極高的路由規則。
    - **邏輯**：只要請求的 `Referer` 表頭包含房間名稱，且該請求不是發往主系統 API 的，Traefik 就會自動將其導向該房間的容器。
    - **效果**：實現了「外部子路徑託管，內部絕對路徑運作」的無縫接軌。

## 2. 自動語系補丁 (Automatic I18N Injection)
為了解決生產版本 (Production Build) 可能漏掉開發資源的問題。

- **機制**：在 `orchestrator.py` 中，我們加入了自動掛載功能。
- **作法**：當啟動新的 AI 實例時，系統會自動將宿主機上的 `frontend/src/i18n.json` 以唯讀方式掛載到容器的 `/app/frontend/dist/src/i18n.json`。
- **意義**：確保所有房間從第一秒開始就有完整的翻譯支援。

## 3. 雲端隧道整合 (Cloudflare Tunnel Integration)
實現「免對外 IP、免防火牆設定」的全球存取。

- **自動化流**：
    1. `scripts/catch_tunnel.sh` 啟動並監聽 `cloudflared` 日誌。
    2. 自動抓取隨機生成的 `.trycloudflare.com` 網域。
    3. 透過 API 將網域回傳給後端。
    4. 前端 Dashboard 自動更新連結，點擊即可分享。

## 4. 前後端連動 (Unified Synergy)
- **Vite Config**: 關閉了 `allowedHosts` 限制，支援動態隧道網域。
- **Trailing Slash**: 前端連結強制帶有 `/`，確保瀏覽器正確解析相對路徑。

---
*保持簡潔。這就是我們奮鬥後的技術結晶。*

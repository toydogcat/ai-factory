---
description: 救援技能 (Troubleshooting & Rescue Guide) - 當系統出錯時必讀
---
# ⚓ AI-Factory 終極救援指南 (The Ultimate Rescue Guide)

這份文件紀錄了 **AI-Factory** 平台的常見坑位與「簡易自救」步驟。如果您遇到服務無法連線、登入失敗或顯示異常，請按此指南操作。

## 1. 🌐 CORS 跨網域存取失敗 (最常見)
**症狀**：控制台 (F12) 出現 `Blocked by CORS policy` 紅字，或是登入時一直顯示 `Login Failed`。
**原因**：後端隧道 (Cloudflare) 每次重啟後網址都會變動，但前端還在連舊網址。
**自救法**：
1. 確保 `./run.sh` 正在運行 `1) Start` -> `3) PRODUCTION`。
2. 再次執行 `./run.sh` 並選 **`3) Deploy to Firebase`**。
3. 重新整理瀏覽器即可。👏

## 2. 🔑 登入 403 報錯 (iframes 限制)
**症狀**：在內嵌的小視窗 (ProjectViewer) 點 Google 登入後報錯 `403 disallowed_useragent`。
**原因**：Google 禁止在 iframe 內使用「重定向登入」。
**自救法**：
- 必須檢查程式碼，確保使用的是 **`signInWithPopup`** 而不是 `signInWithRedirect`。
- **管理員自救**：如果是管理員，請優先使用專屬的 「Security Key」 登入路徑，繞過 Google SSO。

## 3. 🚫 埠號 7051 衝突 (Port Conflict)
**症狀**：啟動腳本時報錯 `Address already in use` 或是後端一直啟動失敗。
**原因**：先前的服務沒有關乾淨。
**自救法**：
1. 先跑 `./run.sh` -> 選項 **`2) Stop & Cleanup`**。
2. 如果還是不行，強制執行：`fuser -k 7051/tcp`。
3. 再次嘗試啟動。

## 4. 📤 Firebase 部署失敗 (No Active Project)
**症狀**：執行部署時出現 `Error: No currently active project`。
**原因**：缺少 `.firebaserc` 配置或專案 ID 不正確。
**自救法**：
- 檢查根目錄是否有 `.firebaserc`。
- 內容應包含：`"default": "ai-factory-tarot"`。
- 手動修復：執行 `firebase use --add` 並輸入專案 ID。

## 5. 🐳 Docker 基礎設施問題
**症狀**：Traefik 或資料庫報 502/504 錯誤。
**自救法**：
- 檢查容器狀態：`docker compose -f docker/docker-compose.traefik.yml ps`
- 重啟基礎設施：`docker compose -f docker/docker-compose.traefik.yml restart`

---
*Powered by Antigravity AI Engine* 👏✨

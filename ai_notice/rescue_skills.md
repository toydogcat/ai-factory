# 🆘 AI-Factory 救援技能與自救手冊 (Rescue Skills)

本文件紀錄了平台最常遇到的幾個「大坑」以及對應的「自救技能」，幫助您在沒有外部支援時能快速恢復系統。

## 1. ⚔️ CORS 戰鬥技能 (CORS Combat)
**情境**：Firebase 網址點開後全白，或是點開發者工具看到一堆紅色的 CORS Error。
**坑位**：隧道網址變動，但前端配置失效。
**自救技能**：
- **快速同步法**：直接執行 `./run.sh` -> 選項 `3) Deploy to Firebase`。
- **核心原理**：這會重新抓取當前隧道並「注入」到前端建置檔中。

## 2. 🔌 埠號 7051 守護 (Port Guardian)
**情境**：啟動腳本時提示 `Address already in use`。
**坑位**：舊的後端進程 (uvicorn) 沒關乾淨。
**自救技能**：
- **全域清場**：`./run.sh` -> 選項 `2) Stop & Cleanup`。
- **暴力驅逐**：`sudo fuser -k 7051/tcp` (適用於 Linux)。

## 3. 🛡️ 內嵌登入守衛 (Iframe Login)
**情境**：在子專案視窗點 Google 登入報錯 403。
**坑位**：Google 禁止 iframe 內的 Redirect。
**自救技能**：
- **查代碼**：確認 `App.vue` 或 `main.js` 用的是 `signInWithPopup`。
- **管理員捷徑**：直接輸入 Security Key 繞過 OAuth。

## 4. 🗃️ Firebase 專案對接 (Project Mapping)
**情境**：部署時出現 `No active project`。
**坑位**：缺少 `.firebaserc`。
**自救技能**：
- **手動強關連**：在終端機輸入 `firebase use ai-factory-tarot --alias default`。
- **檢查配置**：確保 `.firebaserc` 的內容正確無誤。

## 🐳 5. Docker 脈動檢查 (Docker Pulse)
**情境**：502 Bad Gateway。
**自救技能**：
- **健康檢查**：`docker compose -f docker/docker-compose.traefik.yml ps`。
- **心臟起搏**：`docker compose -f docker/docker-compose.traefik.yml restart`。

---
*這份文件是您的保險。遇到狀況時，請優先參考這五大技能！* 👏✨

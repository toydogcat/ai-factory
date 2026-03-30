#!/bin/bash

# --- AI-Factory Unified Command Center ---
# Professional Startup & Management Script

# Colors & Icons
export GREEN='\033[0;32m'
export BLUE='\033[0;34m'
export YELLOW='\033[1;33m'
export RED='\033[0;31m'
export NC='\033[0m' # No Color
export BOLD='\033[1m'

# Clear screen for better experience
clear
echo -e "${BLUE}${BOLD}🏰 AI-Factory Command Center${NC}"
echo -e "-----------------------------------"

# --- SHARED FUNCTIONS ---

# Cleanup all background processes
cleanup() {
    echo -e "\n${RED}🛑 正在關閉所有服務... (Stopping all services)${NC}"
    pkill -P $$ || true
    # Kill common process patterns
    pkill -f "uvicorn app.main:app" || true
    pkill -f "npm run dev" || true
    pkill -f "share_ngrok.py" || true
    pkill -f "catch_tunnel.sh" || true
    
    # Aggressive port clearing (important for remote nodes)
    fuser -k 7051/tcp 2>/dev/null || true
    fuser -k 5173/tcp 2>/dev/null || true
    
    docker compose -f docker/docker-compose.traefik.yml down || true
    
    # Wipe stale logs to prevent re-using old tunnel URLs
    rm -f tunnel.log backend.log stg_url.txt
    
    echo -e "${GREEN}✅ 清理完成！ (Cleanup complete)${NC}"
}

# Standalone Deploy Function (Shared between Action 3 and Production Mode)
deploy_to_firebase() {
    local target_url=$1
    if [[ -z "$target_url" ]]; then
        echo -e "${RED}❌ 錯誤: 未提供後端網址，無法部署。${NC}"
        return 1
    fi

    echo -e "\n${BLUE}🚀 準備部署至 Firebase (${target_url})${NC}"
    echo "VITE_API_BASE_URL=${target_url}/api/v1" > frontend/.env.production
    
    echo -e "${BLUE}🏗️  正在建置前端版本 (Building Frontend)...${NC}"
    cd frontend && npm run build && cd ..
    
    echo -e "${BLUE}📤 正在上傳至 Firebase Hosting (Deploying)...${NC}"
    firebase deploy --only hosting:factory-game --project ai-factory-tarot
    
    echo -e "${GREEN}${BOLD}✨ 部署完成！${NC}"
    echo -e "👉 您的固定網址：https://factory-game.web.app"
}

# --- ACTION SELECTION ---
echo -e "${YELLOW}請選擇操作 (Select Action):${NC}"
echo "1) 🚀 啟動環境 (Start Environment)"
echo "2) 🛑 停止並清理 (Stop & Cleanup)"
echo "3) 📦 僅部署到 Firebase (Standalone Deploy)"
read -p "指令 [1-3]: " ACTION

if [[ "$ACTION" == "2" ]]; then
    cleanup
    exit 0
fi

# --- STANDALONE DEPLOY (ACTION 3) ---
if [[ "$ACTION" == "3" ]]; then
    # Try to find an existing tunnel
    PROD_URL=$(grep -o "https://[a-zA-Z0-9-]\+\.trycloudflare\.com" tunnel.log 2>/dev/null | head -1)
    if [[ -z "$PROD_URL" ]]; then
        read -p "⚠️  未偵測到運行中的隧道。請輸入後端 URL: " PROD_URL
    fi
    deploy_to_firebase "$PROD_URL"
    exit 0
fi

# --- MODE SELECTION (ACTION 1) ---
echo -e "\n${YELLOW}請選擇部署模式 (Select Mode):${NC}"
echo "1) 🛠️  DEV (Localhost Only)"
echo "2) 🧪  STAGING (ngrok Sharing)"
echo "3) 🌍  PRODUCTION (Cloudflare + Firebase Auto-Deploy)"
read -p "指令 [1-3]: " MODE

# --- START INFRASTRUCTURE ---
echo -e "\n${BLUE}📦 啟動基礎架構 (Starting Infrastructure)...${NC}"
docker compose -f docker/docker-compose.traefik.yml up -d --remove-orphans

PUBLIC_URL=""

# --- MODE LOGIC ---
if [[ "$MODE" == "1" ]]; then
    echo -e "${GREEN}✨ 模式: DEV [本地開發]${NC}"
elif [[ "$MODE" == "2" ]]; then
    echo -e "${GREEN}✨ 模式: STAGING [ngrok 分享]${NC}"
    chmod +x scripts/share_ngrok.py
    python3 scripts/share_ngrok.py > /dev/null 2>&1 &
    
    echo "🔍 等待 ngrok 網址分配 (Waiting for ngrok URL)..."
    for i in {1..12}; do
        sleep 1
        if [ -f "stg_url.txt" ]; then
            PUBLIC_URL=$(cat stg_url.txt)
            echo -e "${GREEN}🎉 成功獲取網址: ${PUBLIC_URL}${NC}"
            echo "VITE_API_BASE_URL=${PUBLIC_URL}/api/v1" > frontend/.env.production
            rm stg_url.txt
            break
        fi
    done
elif [[ "$MODE" == "3" ]]; then
    echo -e "${GREEN}✨ 模式: PRODUCTION [Cloudflare + Firebase 自動部署]${NC}"
    chmod +x scripts/catch_tunnel.sh
    ./scripts/catch_tunnel.sh > tunnel.log 2>&1 &
    
    echo "🔍 等待 Cloudflare 網址分配 (Waiting for Cloudflare URL)..."
    for i in {1..12}; do
        sleep 1
        if grep -q "https://" tunnel.log; then
            PUBLIC_URL=$(grep -o "https://[a-zA-Z0-9-]\+\.trycloudflare\.com" tunnel.log | head -1)
            echo -e "${GREEN}🎉 成功獲取網址: ${PUBLIC_URL}${NC}"
            
            # --- AUTO DEPLOY TRIGGER ---
            deploy_to_firebase "$PUBLIC_URL"
            break
        fi
    done
fi

# --- START BACKEND ---
echo -e "\n${BLUE}🐍 啟動後端服務 (Starting Backend)...${NC}"
cd backend
export PYTHONPATH=.
# Disable any accidental .venv detection by prepending conda python
# Use absolute path for conda to ensure non-interactive shell compatibility
CONDA_BIN="/home/toby/miniconda3/bin/conda"
if [ ! -f "$CONDA_BIN" ]; then CONDA_BIN="conda"; fi

$CONDA_BIN run -n toby python -m uvicorn app.main:app --host 0.0.0.0 --port 7051 --reload > ../backend.log 2>&1 &

# Verify backend startup
echo -n "⏳ 等待後端就緒 (Waiting for Backend)..."
BACKEND_READY=false
for i in {1..30}; do
    if netstat -ntlp 2>/dev/null | grep -q ":7051 "; then
        echo -e "${GREEN} 就緒！ (Ready)${NC}"
        BACKEND_READY=true
        break
    fi
    echo -n "."
    sleep 1
done

if [ "$BACKEND_READY" = false ]; then
    echo -e "${RED}❌ 錯誤: 後端啟動逾時。請檢查 backend.log。${NC}"
fi
cd ..

# --- START FRONTEND ---
echo -e "${BLUE}⚛️  啟動前端介面 (Starting Frontend)...${NC}"
cd frontend
npm run dev -- --host 0.0.0.0 --port 5173 > ../frontend.log 2>&1 &
cd ..

echo -e "-----------------------------------"
echo -e "${GREEN}${BOLD}✅ AI-Factory 已就緒！ (Ready)${NC}"

if [[ ! -z "$PUBLIC_URL" ]]; then
    echo -e "${YELLOW}${BOLD}🌍 公開網址 (Public URL): ${PUBLIC_URL}${NC}"
    echo -e "   (此為後端隧道網址 / Backend Tunnel URL)"
    echo -e "👉 固定網址 (Fixed URL): https://factory-game.web.app"
fi

echo -e "🏠 本地面板 (Local Dashboard): http://localhost:5173"
echo -e "🔌 API 端點 (Local API): http://localhost:7051"
echo -e "-----------------------------------"
echo -e "${YELLOW}按下 Ctrl+C 結束所有服務。 (Press Ctrl+C to stop)${NC}"

# Handle Termination
trap "cleanup; exit" INT TERM EXIT
wait

#!/bin/bash

# --- AI-Factory "Mother" Master Orchestration & Rescue Script ---
# This script manages the unified deployment and rescue of the parent and all child projects.

# Ensure we are in the ai-factory root
cd "$(dirname "$0")"

echo "🏰 [Mother] Starting Master Orchestration..."

# --- PHASE 1: WORKSPACE VERIFICATION ---
echo "🔍 1/3 [Phase 1: Verification]: Checking Sub-Project Links..."
WORKSPACE_DIR="workspace"
if [ ! -d "$WORKSPACE_DIR" ]; then
    echo "⚠️  Workspace directory not found! Creating it..."
    mkdir -p "$WORKSPACE_DIR"
fi

ls -ld $WORKSPACE_DIR/* 2>/dev/null || echo "ℹ️  No sub-projects linked in workspace yet."

# --- PHASE 2: PARENT AUTO-SYNC ---
echo "👸 2/3 [Phase 2: Parent]: Updating Mother System (AI-Factory)..."

# Build Frontend (Production)
echo "🏗️  Building Frontend for Production..."
cd frontend
npm run build
cd ..

# Deploy to Firebase
echo "🚀  Deploying to Firebase (factory-game)..."
firebase deploy --only hosting:factory-game

# Restart Local Services (Background)
echo "📦 Restarting Parent Services..."
pkill -f "uvicorn app.main:app" || true
pkill -f "npm run dev" || true

cd backend
export PYTHONPATH=$PYTHONPATH:.
# Use conda environment 'toby' and prioritize 'uv' if available
if command -v uv &> /dev/null; then
    echo "⚡ Using UV in Conda (toby)..."
    conda run -n toby uv run uvicorn app.main:app --host 0.0.0.0 --port 7050 --reload > ../backend.log 2>&1 &
else
    echo "📦 Using Uvicorn in Conda (toby)..."
    conda run -n toby uvicorn app.main:app --host 0.0.0.0 --port 7050 --reload > ../backend.log 2>&1 &
fi
echo "✅ Parent Backend Started (Port 7050)"

cd ../frontend
npm run dev -- --host 0.0.0.0 --port 5173 > ../frontend.log 2>&1 &
echo "✅ Parent Frontend Started (Port 5173)"
cd ..

# --- PHASE 3: CHILDREN RESCUE (PROD DEPLOY) ---
echo "🐥 3/3 [Phase 3: Children]: Executing Sub-Project Rescue & Deploy..."

# 1. AI-Tarot
if [ -L "$WORKSPACE_DIR/ai-tarot" ] || [ -d "$WORKSPACE_DIR/ai-tarot" ]; then
    echo "🔮 [Mother -> AI-Tarot] Initiating Rescue/Update..."
    cd $WORKSPACE_DIR/ai-tarot
    if [ -f "run.sh" ]; then
        bash run.sh
        echo "✅ AI-Tarot Rescued & Deployed."
    else
        echo "❌ AI-Tarot run.sh not found!"
    fi
    cd ../..
fi

# 2. Kitty-Help
if [ -L "$WORKSPACE_DIR/kitty-help" ] || [ -d "$WORKSPACE_DIR/kitty-help" ]; then
    echo "🐱 [Mother -> Kitty-Help] Initiating Rescue/Update..."
    cd $WORKSPACE_DIR/kitty-help
    if [ -f "run.sh" ]; then
        bash run.sh
        echo "✅ Kitty-Help Rescued & Deployed."
    else
        echo "❌ Kitty-Help run.sh not found!"
    fi
    cd ../..
fi

echo ""
echo "✨ [Mother] ALL SYSTEMS SYNCHRONIZED & OPERATIONAL ✨"
echo "----------------------------------------------------"
echo "🏰 AI-Factory Portal: http://localhost:5173"
echo "💠 AI-Tarot (Synced): https://ai-factory-tarot.web.app"
echo "🐾 Kitty-Help (Private): https://kitty-help.web.app"
echo "----------------------------------------------------"

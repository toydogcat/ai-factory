from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from app.api.routes import orchestrator, auth, system, studio, social
from app.core.config import settings
from app.core.db import init_db, SessionLocal
from app.models.factory import Mentor
from app.api.routes.auth import get_password_hash
from loguru import logger

def seed_db():
    db = SessionLocal()
    try:
        admin = db.query(Mentor).filter(Mentor.mentor_id == "admin").first()
        if not admin:
            logger.info("Creating default admin user...")
            new_admin = Mentor(
                mentor_id="admin",
                email="admin@ai-factory.local",
                password_hash=get_password_hash("admin123"),
                status="active"
            )
            db.add(new_admin)
            db.commit()
            logger.info("Admin user created: admin / admin123")
    finally:
        db.close()

app = FastAPI(
    title="AI-Factory Orchestrator",
    description="Central management for AI service instances",
    version="0.1.0"
)

# Robust CORS configuration for dynamic tunnels and production domains
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://factory-game.web.app",
        "https://ai-factory-tarot.web.app"
    ],
    allow_origin_regex=r"https://.*\.trycloudflare\.com", # Dynamically allow all CF tunnels
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from fastapi.staticfiles import StaticFiles
from app.api.routes.studio import STUDIO_PATH

# Include routers
app.include_router(orchestrator, prefix="/api/v1/orchestrator", tags=["Orchestrator"])
app.include_router(auth, prefix="/api/v1/auth", tags=["Auth"])
app.include_router(system, prefix="/api/v1/system", tags=["System"])
app.include_router(studio, prefix="/api/v1/studio", tags=["Studio"])
app.include_router(social, prefix="/api/v1/social", tags=["Social"])

# Serve AI-Studio Projects as static files
# This allows paths like /studio/ai-speech-text/ to resolve to their built assets
if os.path.exists(STUDIO_PATH):
    app.mount("/studio", StaticFiles(directory=STUDIO_PATH, html=True), name="studio")

# Global state for public tunnel
current_tunnel_url = None

@app.post("/api/v1/system/public-tunnel")
async def update_public_tunnel_url(payload: dict):
    global current_tunnel_url
    current_tunnel_url = payload.get("tunnel_url")
    return {"status": "ok", "url": current_tunnel_url}

@app.get("/api/v1/system/public-tunnel")
async def get_public_tunnel_url():
    return {"tunnel_url": current_tunnel_url}

@app.get("/")
async def root():
    return {"message": "AI-Factory Orchestrator API is running"}

@app.on_event("startup")
async def startup_event():
    logger.info("Initializing AI-Factory Orchestrator...")
    try:
        init_db()
        seed_db()
        
        # Start PubSub Listener
        from app.core.pubsub import pubsub_manager
        import asyncio
        pubsub_manager.start(asyncio.get_event_loop())
        
        logger.info("Database synchronized and seeded successfully.")
    except Exception as e:
        logger.error(f"Failed to synchronize database: {e}")

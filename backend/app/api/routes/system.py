from fastapi import APIRouter
import psutil
import platform
import datetime

router = APIRouter()

# Global state for tunnel (reset on restart)
current_tunnel_url = None

@router.get("/stats")
async def get_system_stats():
    cpu_percent = psutil.cpu_percent(interval=1)
    memory = psutil.virtual_memory()
    disk = psutil.disk_usage('/')
    
    return {
        "cpu_usage": cpu_percent,
        "memory_usage": memory.percent,
        "disk_usage": disk.percent,
        "uptime": str(datetime.datetime.now() - datetime.datetime.fromtimestamp(psutil.boot_time())),
        "platform": platform.system(),
    }

@router.post("/public-tunnel")
async def update_public_tunnel_url(payload: dict):
    global current_tunnel_url
    current_tunnel_url = payload.get("tunnel_url")
    return {"status": "ok", "url": current_tunnel_url}

@router.get("/public-tunnel")
async def get_public_tunnel_url():
    return {"tunnel_url": current_tunnel_url}

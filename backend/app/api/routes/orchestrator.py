from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from app.core.db import get_db
from app.core.orchestrator import docker_manager
from pydantic import BaseModel
from typing import List
from app.api.routes.auth import get_current_user
from app.models.factory import Mentor

router = APIRouter()

class InstanceCreate(BaseModel):
    mentor_id: str
    name: str
    image: str = "ai-tarot-backend:latest"
    env_vars: dict = {}

@router.post("/instances")
async def create_instance(instance: InstanceCreate, db: Session = Depends(get_db), current_user: Mentor = Depends(get_current_user)):
    try:
        new_instance = docker_manager.start_instance(
            db=db,
            mentor_id=instance.mentor_id,
            name=instance.name,
            image=instance.image,
            environment=instance.env_vars
        )
        return new_instance
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/instances")
async def list_instances():
    return docker_manager.list_instances()

@router.delete("/instances/{instance_id}")
async def stop_instance(instance_id: str, current_user: Mentor = Depends(get_current_user)):
    if docker_manager.stop_instance(instance_id):
        return {"message": "Instance stopped"}
    raise HTTPException(status_code=404, detail="Instance not found")

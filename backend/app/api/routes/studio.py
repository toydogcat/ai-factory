from fastapi import APIRouter, Depends, HTTPException
import os
from typing import List
from pydantic import BaseModel
from app.api.routes.auth import get_current_user
from app.models.factory import Mentor
from sqlalchemy.orm import Session
from app.core.db import get_db

router = APIRouter()

current_file_path = os.path.dirname(os.path.abspath(__file__))
# Correct relative path: backend/app/api/routes -> backend -> app -> app root -> frontend/public/studio
STUDIO_PATH = os.path.abspath(os.path.join(current_file_path, "../../../../frontend/public/studio"))

class StudioProject(BaseModel):
    name: str
    description: str
    url: str
    is_public: bool

@router.get("/projects", response_model=List[StudioProject])
async def list_studio_projects():
    projects = []
    if not os.path.exists(STUDIO_PATH):
        return projects
    
    # Recursive scan to find projects (folders with index.html or public.flag)
    for root_dir, dirs, files in os.walk(STUDIO_PATH):
        # Limit depth: STUDIO_PATH / section / project
        rel_path = os.path.relpath(root_dir, STUDIO_PATH)
        if rel_path == ".":
            depth = 0
        else:
            depth = rel_path.count(os.sep) + 1
            
        if depth > 2:
            continue
            
        # If this directory is a project
        if "index.html" in files or "public.flag" in files:
            is_public = "public.flag" in files
            projects.append(StudioProject(
                name=rel_path,
                description=f"Neural Product: {rel_path}",
                url=f"/studio/{rel_path}/",
                is_public=is_public
            ))
            # Don't recurse into found project
            dirs.clear()
            
    return projects

@router.post("/launch/{project_name}")
async def launch_project(project_name: str, db: Session = Depends(get_db), current_user: Mentor = Depends(get_current_user)):
    project_path = os.path.join(STUDIO_PATH, project_name)
    if not os.path.exists(project_path):
        raise HTTPException(status_code=404, detail="Project not found")

    # Point deduction logic
    COST = 10
    if current_user.points < COST:
        raise HTTPException(status_code=402, detail="Insufficient points")

    current_user.points -= COST
    current_user.total_used += COST
    db.commit()

    return {
        "status": "launched",
        "url": f"/studio/{project_name}/",
        "remaining_points": current_user.points
    }

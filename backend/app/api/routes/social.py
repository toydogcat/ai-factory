from fastapi import APIRouter, HTTPException, Depends, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, desc, func
from typing import List, Optional
from datetime import datetime
from loguru import logger

from app.core.db import get_factory_db
from app.models.factory import Mentor, Friend, Message
from app.api.routes.auth import get_current_user
from app.core.ws_manager import ws_manager
from app.core.pubsub import notify_social_update

router = APIRouter()

# --- WebSocket Endpoint ---

@router.websocket("/ws/{mentor_id}")
async def social_websocket_endpoint(websocket: WebSocket, mentor_id: str):
    """
    Unified WebSocket endpoint for real-time social updates.
    """
    await ws_manager.connect(mentor_id, websocket)
    try:
        while True:
            # Keep connection alive, though logic is mostly server-push
            data = await websocket.receive_text()
            logger.debug(f"Received from {mentor_id}: {data}")
    except WebSocketDisconnect:
        ws_manager.disconnect(mentor_id, websocket)
    except Exception as e:
        logger.error(f"WebSocket error for {mentor_id}: {e}")
        ws_manager.disconnect(mentor_id, websocket)

# --- Friend Management ---

@router.post("/friends/request/{target_id}")
async def send_friend_request(target_id: str, current_user: Mentor = Depends(get_current_user), db: Session = Depends(get_factory_db)):
    user_id = current_user.mentor_id
    if user_id == target_id:
        raise HTTPException(status_code=400, detail="Cannot add yourself as a friend.")

    target = db.query(Mentor).filter(Mentor.mentor_id == target_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="Target mentor not found.")

    existing = db.query(Friend).filter(
        or_(
            and_(Friend.requester_id == user_id, Friend.receiver_id == target_id),
            and_(Friend.requester_id == target_id, Friend.receiver_id == user_id)
        )
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail="Friend request already exists or already friends.")

    new_request = Friend(requester_id=user_id, receiver_id=target_id, status="pending")
    db.add(new_request)
    db.commit()

    # NOTIFY target
    notify_social_update(target_id, {
        "type": "friend_request",
        "sender_id": current_user,
        "timestamp": datetime.utcnow().isoformat()
    })

    return {"status": "success", "message": "Friend request sent."}

@router.post("/friends/respond/{requester_id}/{action}")
async def respond_to_friend_request(requester_id: str, action: str, current_user: Mentor = Depends(get_current_user), db: Session = Depends(get_factory_db)):
    user_id = current_user.mentor_id
    if action not in ["accept", "decline"]:
        raise HTTPException(status_code=400, detail="Invalid action.")

    request = db.query(Friend).filter(
        and_(Friend.requester_id == requester_id, Friend.receiver_id == user_id, Friend.status == "pending")
    ).first()

    if not request:
        raise HTTPException(status_code=404, detail="Friend request not found.")

    if action == "accept":
        request.status = "accepted"
        db.commit()
        # NOTIFY requester
        notify_social_update(requester_id, {
            "type": "friend_accepted",
            "sender_id": user_id,
            "timestamp": datetime.utcnow().isoformat()
        })
    else:
        db.delete(request)
        db.commit()

    return {"status": "success", "action": action}

@router.get("/friends/list")
async def list_friends(current_user: Mentor = Depends(get_current_user), db: Session = Depends(get_factory_db)):
    user_id = current_user.mentor_id
    links = db.query(Friend).filter(
        and_(
            or_(Friend.requester_id == user_id, Friend.receiver_id == user_id),
            Friend.status == "accepted"
        )
    ).all()

    friends = []
    for link in links:
        friend_id = link.receiver_id if link.requester_id == user_id else link.requester_id
        is_online = friend_id in ws_manager.active_connections
        friends.append({"mentor_id": friend_id, "is_online": is_online})
    
    return friends

# --- Chat Messages ---

@router.post("/chat/send")
async def send_message(receiver_id: str, message_text: str, current_user: Mentor = Depends(get_current_user), db: Session = Depends(get_factory_db)):
    user_id = current_user.mentor_id
    # Verify friendship
    friendship = db.query(Friend).filter(
        and_(
            or_(
                and_(Friend.requester_id == user_id, Friend.receiver_id == receiver_id),
                and_(Friend.requester_id == receiver_id, Friend.receiver_id == user_id)
            ),
            Friend.status == "accepted"
        )
    ).first()

    if not friendship:
        raise HTTPException(status_code=403, detail="Must be friends to send messages.")

    new_msg = Message(sender_id=user_id, receiver_id=receiver_id, message=message_text)
    db.add(new_msg)
    db.commit()

    # NOTIFY receiver
    notify_social_update(receiver_id, {
        "type": "chat_message",
        "sender_id": user_id,
        "message": message_text,
        "timestamp": datetime.utcnow().isoformat()
    })

    return {"status": "success", "message_id": new_msg.id}

@router.get("/chat/history/{target_id}")
async def get_chat_history(target_id: str, limit: int = 50, current_user: Mentor = Depends(get_current_user), db: Session = Depends(get_factory_db)):
    user_id = current_user.mentor_id
    messages = db.query(Message).filter(
        or_(
            and_(Message.sender_id == user_id, Message.receiver_id == target_id),
            and_(Message.sender_id == target_id, Message.receiver_id == user_id)
        )
    ).order_by(desc(Message.timestamp)).limit(limit).all()

    return sorted([
        {"id": m.id, "sender_id": m.sender_id, "receiver_id": m.receiver_id, "message": m.message, "timestamp": m.timestamp.isoformat(), "is_read": m.is_read}
        for m in messages
    ], key=lambda x: x["timestamp"])

@router.get("/notifications/summary")
async def get_notifications_summary(current_user: Mentor = Depends(get_current_user), db: Session = Depends(get_factory_db)):
    user_id = current_user.mentor_id
    pending_friends = db.query(func.count(Friend.id)).filter(
        and_(Friend.receiver_id == user_id, Friend.status == "pending")
    ).scalar() or 0

    unread_messages = db.query(func.count(Message.id)).filter(
        and_(Message.receiver_id == user_id, Message.is_read == False)
    ).scalar() or 0

    return {
        "pending_friends_count": pending_friends,
        "unread_messages_count": unread_messages
    }

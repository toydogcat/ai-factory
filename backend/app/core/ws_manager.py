from fastapi import WebSocket
from typing import Dict, List, Set
from loguru import logger
import json

class ConnectionManager:
    def __init__(self):
        # Maps mentor_id to a set of active WebSocket connections
        self.active_connections: Dict[str, Set[WebSocket]] = {}

    async def connect(self, mentor_id: str, websocket: WebSocket):
        await websocket.accept()
        if mentor_id not in self.active_connections:
            self.active_connections[mentor_id] = set()
        self.active_connections[mentor_id].add(websocket)
        logger.info(f"Mentor {mentor_id} connected. Active sessions: {len(self.active_connections[mentor_id])}")

    def disconnect(self, mentor_id: str, websocket: WebSocket):
        if mentor_id in self.active_connections:
            self.active_connections[mentor_id].discard(websocket)
            if not self.active_connections[mentor_id]:
                del self.active_connections[mentor_id]
        logger.info(f"Mentor {mentor_id} disconnected.")

    async def send_personal_message(self, message: dict, websocket: WebSocket):
        await websocket.send_json(message)

    async def broadcast_to_user(self, mentor_id: str, message: dict):
        """Send message to all active sessions of a specific mentor."""
        if mentor_id in self.active_connections:
            disconnected = []
            for connection in self.active_connections[mentor_id]:
                try:
                    await connection.send_json(message)
                except Exception as e:
                    logger.error(f"Error broadcasting to {mentor_id}: {e}")
                    disconnected.append(connection)
            
            for conn in disconnected:
                self.disconnect(mentor_id, conn)

# Global instance
ws_manager = ConnectionManager()

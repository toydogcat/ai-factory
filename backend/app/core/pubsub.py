import asyncio
import json
import psycopg2
import psycopg2.extensions
from loguru import logger
from threading import Thread
from app.core.config import settings
from app.core.ws_manager import ws_manager

class PubSubManager:
    def __init__(self):
        self.conn = None
        self.channel = "factory_social_updates"
        self.thread = None
        self.loop = None

    def start(self, loop):
        """Start the listener in a background thread."""
        self.loop = loop
        self.thread = Thread(target=self._listen, daemon=True)
        self.thread.start()
        logger.info(f"PubSub Listener started on channel: {self.channel}")

    def _listen(self):
        """Synchronous listening loop running in its own thread."""
        try:
            database_url = settings.get_factory_url
            self.conn = psycopg2.connect(database_url)
            self.conn.set_isolation_level(psycopg2.extensions.ISOLATION_LEVEL_AUTOCOMMIT)
            
            cursor = self.conn.cursor()
            cursor.execute(f"LISTEN {self.channel};")
            
            while True:
                import select
                if select.select([self.conn], [], [], 5) == ([], [], []):
                    # Timeout, keep loop alive
                    continue
                
                self.conn.poll()
                while self.conn.notifies:
                    notify = self.conn.notifies.pop(0)
                    logger.debug(f"Received PG notification: {notify.payload}")
                    self._handle_notification(notify.payload)
        except Exception as e:
            logger.error(f"PubSub Listener encountered error: {e}")
            # Optional: Implement reconnection logic here
        finally:
            if self.conn:
                self.conn.close()

    def _handle_notification(self, payload_str: str):
        """Parse payload and delegate to WebSocket manager."""
        try:
            payload = json.loads(payload_str)
            target_id = payload.get("target_id")
            if not target_id:
                return

            # Relay to WebSockets via the main event loop
            if self.loop:
                asyncio.run_coroutine_threadsafe(
                    ws_manager.broadcast_to_user(target_id, payload),
                    self.loop
                )
        except Exception as e:
            logger.error(f"Failed to parse or relay notification: {e}")

# Global instance
pubsub_manager = PubSubManager()

def notify_social_update(target_id: str, data: dict):
    """
    Utility to send a NOTIFY event from any API route.
    Usage: notify_social_update("toby", {"type": "chat_message", ...})
    """
    from app.core.db import SessionFactory
    db = SessionFactory()
    try:
        payload = json.dumps({**data, "target_id": target_id})
        # Use single quotes for the payload in SQL
        safe_payload = payload.replace("'", "''")
        db.execute(psycopg2.extensions.AsIs(f"NOTIFY factory_social_updates, '{safe_payload}';"))
        db.commit()
    except Exception as e:
        logger.error(f"Failed to send PG NOTIFY: {e}")
    finally:
        db.close()

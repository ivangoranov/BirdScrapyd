"""WebSocket manager for real-time updates"""
from fastapi import WebSocket, APIRouter
from typing import Dict, List

router = APIRouter()


class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, spider_id: str):
        await websocket.accept()
        if spider_id not in self.active_connections:
            self.active_connections[spider_id] = []
        self.active_connections[spider_id].append(websocket)

    def disconnect(self, websocket: WebSocket, spider_id: str):
        if spider_id in self.active_connections:
            self.active_connections[spider_id].remove(websocket)
            if not self.active_connections[spider_id]:
                del self.active_connections[spider_id]

    async def broadcast_to_spider(self, spider_id: str, message: dict):
        if spider_id in self.active_connections:
            for connection in self.active_connections[spider_id]:
                await connection.send_json(message)


manager = ConnectionManager()

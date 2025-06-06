from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict, List
import json

router = APIRouter()

# Store active connections
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
            if websocket in self.active_connections[spider_id]:
                self.active_connections[spider_id].remove(websocket)
            if not self.active_connections[spider_id]:
                del self.active_connections[spider_id]

    async def broadcast_to_spider(self, spider_id: str, message: dict):
        # Send to specific spider subscribers
        if spider_id in self.active_connections:
            for connection in self.active_connections[spider_id]:
                await connection.send_json(message)

        # Also broadcast to global listeners (those listening to all spiders)
        if "global" in self.active_connections:
            # Add spider_id to the message for global listeners to identify the source
            global_message = message.copy()
            if "spider_id" not in global_message:
                global_message["spider_id"] = spider_id

            for connection in self.active_connections["global"]:
                await connection.send_json(global_message)

    async def broadcast_to_all(self, message: dict):
        for spider_id in self.active_connections:
            for connection in self.active_connections[spider_id]:
                await connection.send_json(message)

manager = ConnectionManager()

@router.websocket("/spider/{spider_id}")
async def websocket_spider_endpoint(websocket: WebSocket, spider_id: str):
    """
    WebSocket connection for real-time spider execution updates
    """
    await manager.connect(websocket, spider_id)
    try:
        while True:
            # This keeps the connection open and waits for messages from the client
            # In our case, mainly for keeping the connection alive
            data = await websocket.receive_text()
            # We could process client messages here if needed
    except WebSocketDisconnect:
        manager.disconnect(websocket, spider_id)

@router.websocket("/all")
async def websocket_all_spiders_endpoint(websocket: WebSocket):
    """
    WebSocket connection for all spiders updates (global monitoring)
    """
    # Use a special ID for global connections
    all_spiders_id = "global"
    await manager.connect(websocket, all_spiders_id)
    try:
        while True:
            # Keep connection open
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, all_spiders_id)

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
        # Send initial connection message
        await websocket.send_json({
            "status": "connected",
            "message": f"Connected to spider {spider_id}"
        })

        while True:
            # Wait for any messages from the client
            data = await websocket.receive_text()
            try:
                message = json.loads(data)
                # Handle client commands if needed
                if "command" in message:
                    command = message["command"]
                    if command == "ping":
                        await websocket.send_json({"status": "pong"})
            except json.JSONDecodeError:
                await websocket.send_json({
                    "status": "error",
                    "message": "Invalid JSON message"
                })
    except WebSocketDisconnect:
        manager.disconnect(websocket, spider_id)

@router.websocket("/global")
async def websocket_global_endpoint(websocket: WebSocket):
    """
    WebSocket connection for all spider updates (global listener)
    """
    await manager.connect(websocket, "global")
    try:
        # Send initial connection message
        await websocket.send_json({
            "status": "connected",
            "message": "Connected to global spider updates"
        })

        while True:
            # Wait for any messages from the client
            data = await websocket.receive_text()
            try:
                message = json.loads(data)
                # Handle client commands if needed
                if "command" in message:
                    command = message["command"]
                    if command == "ping":
                        await websocket.send_json({"status": "pong"})
            except json.JSONDecodeError:
                await websocket.send_json({
                    "status": "error",
                    "message": "Invalid JSON message"
                })
    except WebSocketDisconnect:
        manager.disconnect(websocket, "global")

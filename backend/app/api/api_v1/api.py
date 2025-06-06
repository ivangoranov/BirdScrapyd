from fastapi import APIRouter

# Create main API router
api_router = APIRouter()

# Import and include specific routers
from app.api.api_v1.endpoints import spiders, websocket

api_router.include_router(spiders.router, prefix="/spiders", tags=["spiders"])
api_router.include_router(websocket.router, prefix="/ws", tags=["websocket"])

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db.init_db import init_db

# Initialize database on startup
init_db()

# Create FastAPI app instance
app = FastAPI(
    title="BirdScrapyd",
    description="A modern web-based tool for configuring, visually creating, and orchestrating Scrapy spiders",
    version="0.1.0",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Import and include API routers
from app.api.api_v1.api import api_router
app.include_router(api_router, prefix="/api/v1")

# Root endpoint
@app.get("/")
async def root():
    return {"message": "Welcome to BirdScrapyd API. Visit /docs for API documentation."}

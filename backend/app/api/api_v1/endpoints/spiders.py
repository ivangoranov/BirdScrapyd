from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from typing import List, Optional
from pydantic import BaseModel
from app.services.spider_service import SpiderService
from app.schemas.spider import SpiderConfig, SpiderCreate, SpiderRead, SpiderUpdate

router = APIRouter()
spider_service = SpiderService()

@router.post("/", response_model=SpiderRead)
async def create_spider(spider: SpiderCreate):
    """
    Create a new Scrapy spider from configuration
    """
    try:
        return await spider_service.create_spider(spider)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/", response_model=List[SpiderRead])
async def get_spiders():
    """
    Get all spider configurations
    """
    return await spider_service.get_all_spiders()

@router.get("/{spider_id}", response_model=SpiderRead)
async def get_spider(spider_id: str):
    """
    Get a specific spider configuration by ID
    """
    spider = await spider_service.get_spider(spider_id)
    if not spider:
        raise HTTPException(status_code=404, detail="Spider not found")
    return spider

@router.put("/{spider_id}", response_model=SpiderRead)
async def update_spider(spider_id: str, spider: SpiderUpdate):
    """
    Update a spider configuration
    """
    updated_spider = await spider_service.update_spider(spider_id, spider)
    if not updated_spider:
        raise HTTPException(status_code=404, detail="Spider not found")
    return updated_spider

@router.delete("/{spider_id}")
async def delete_spider(spider_id: str):
    """
    Delete a spider configuration
    """
    success = await spider_service.delete_spider(spider_id)
    if not success:
        raise HTTPException(status_code=404, detail="Spider not found")
    return {"message": "Spider deleted successfully"}

@router.post("/{spider_id}/run", response_model=dict)
async def run_spider(spider_id: str, background_tasks: BackgroundTasks):
    """
    Run a spider in the background
    """
    spider = await spider_service.get_spider(spider_id)
    if not spider:
        raise HTTPException(status_code=404, detail="Spider not found")

    # Add spider execution to background tasks
    background_tasks.add_task(spider_service.run_spider, spider_id)
    return {"message": f"Spider {spider_id} started", "status": "running"}

@router.post("/{spider_id}/stop")
async def stop_spider(spider_id: str):
    """
    Stop a running spider
    """
    success = await spider_service.stop_spider(spider_id)
    if not success:
        raise HTTPException(status_code=404, detail="Spider not found or not running")
    return {"message": f"Spider {spider_id} stopped", "status": "stopped"}

@router.post("/validate")
async def validate_spider_config(config: SpiderConfig):
    """
    Validate a spider configuration without creating it
    """
    is_valid, message = await spider_service.validate_spider_config(config)
    if not is_valid:
        raise HTTPException(status_code=400, detail=message)
    return {"valid": True, "message": "Configuration is valid"}

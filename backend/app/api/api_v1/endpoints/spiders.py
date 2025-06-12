from fastapi import APIRouter, HTTPException, BackgroundTasks
from typing import List

from app.services import SpiderService
from app.schemas import (
    SpiderConfig, SpiderCreate, SpiderRead, SpiderUpdate,
    UrlValidationRequest, UrlAnalysisResponse
)

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
    result = await spider_service.delete_spider(spider_id)
    if not result:
        raise HTTPException(status_code=404, detail="Spider not found")
    return {"success": True, "message": "Spider deleted successfully"}


@router.post("/{spider_id}/run", status_code=202)
async def run_spider(spider_id: str, background_tasks: BackgroundTasks):
    """
    Run a spider in the background
    """
    # First check if the spider exists
    spider = await spider_service.get_spider(spider_id)
    if not spider:
        raise HTTPException(status_code=404, detail="Spider not found")

    # Check if the spider is already running
    if spider.status == "running":
        raise HTTPException(status_code=400, detail="Spider is already running")

    # Run the spider in the background
    background_tasks.add_task(spider_service.run_spider, spider_id)

    return {"success": True, "message": f"Spider {spider.name} started"}


@router.post("/{spider_id}/stop")
async def stop_spider(spider_id: str):
    """
    Stop a running spider
    """
    # First check if the spider exists
    spider = await spider_service.get_spider(spider_id)
    if not spider:
        raise HTTPException(status_code=404, detail="Spider not found")

    # Check if the spider is running
    if spider.status != "running":
        raise HTTPException(status_code=400, detail="Spider is not running")

    # Stop the spider
    result = await spider_service.stop_spider(spider_id)
    if not result:
        raise HTTPException(status_code=400, detail="Failed to stop spider")

    return {"success": True, "message": f"Spider {spider.name} stopped"}


@router.get("/{spider_id}/executions", response_model=List[dict])
async def get_spider_executions(spider_id: str):
    """
    Get the execution history for a spider
    """
    # First check if the spider exists
    spider = await spider_service.get_spider(spider_id)
    if not spider:
        raise HTTPException(status_code=404, detail="Spider not found")

    # Get the execution history
    executions = await spider_service.get_spider_executions(spider_id)

    return executions


@router.post("/validate")
async def validate_spider_config(config: SpiderConfig):
    """
    Validate a spider configuration without creating it
    """
    is_valid, message = await spider_service.validate_spider_config(config)
    if not is_valid:
        raise HTTPException(status_code=400, detail=message)
    return {"valid": True, "message": "Configuration is valid"}


@router.post("/analyze-url", response_model=UrlAnalysisResponse)
async def analyze_url(request: UrlValidationRequest):
    """
    Analyze a URL and return available selectors with sample data
    """
    try:
        return await spider_service.analyze_url(request.url)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

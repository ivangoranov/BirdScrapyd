from pydantic import BaseModel, Field, ConfigDict
from typing import List, Dict, Optional, Any, Union
from datetime import datetime
import uuid

class BlockBase(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    type: str
    params: Dict[str, Any]

    model_config = ConfigDict(extra="allow")

class SpiderConfig(BaseModel):
    """Base schema for spider configuration"""
    name: str
    start_urls: List[str]
    blocks: List[BlockBase]
    settings: Optional[Dict[str, Any]] = {}

    model_config = ConfigDict(from_attributes=True)

class SpiderCreate(SpiderConfig):
    """Schema for creating a new spider"""
    pass

class SpiderUpdate(SpiderConfig):
    """Schema for updating an existing spider"""
    pass

class SpiderRead(SpiderConfig):
    """Schema for reading a spider configuration"""
    id: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    status: Optional[str] = "idle"
    # model_config already defined in SpiderConfig parent class with from_attributes=True

class SpiderStatus(BaseModel):
    """Schema for spider execution status updates"""
    spider_id: str
    status: str  # running, finished, error, idle
    stats: Optional[Dict[str, Any]] = None
    items_scraped: Optional[int] = 0
    error_message: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.now)

    model_config = ConfigDict(from_attributes=True)

class UrlValidationRequest(BaseModel):
    """Schema for URL validation request"""
    url: str

class SelectorInfo(BaseModel):
    """Schema for selector information"""
    selector: str
    type: str  # 'css' or 'xpath'
    count: int
    sample_values: List[str]
    element_type: str  # 'text', 'link', 'image', etc.

    model_config = ConfigDict(from_attributes=True)

class UrlAnalysisResponse(BaseModel):
    """Schema for URL analysis response"""
    url: str
    status: str
    available_selectors: List[SelectorInfo]
    page_title: Optional[str]
    timestamp: datetime = Field(default_factory=datetime.now)

    model_config = ConfigDict(from_attributes=True)

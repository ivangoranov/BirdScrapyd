"""Main application package initialization"""
from .models import Spider, SpiderExecution, User
from .services import get_all_spiders, get_spider_jobs, SpiderService
from .db.database import get_db, sql
from .api.api_v1.api import api_router
from .schemas.spider import (
    SpiderConfig, SpiderCreate, SpiderRead, SpiderUpdate,
    UrlValidationRequest, UrlAnalysisResponse
)

__all__ = [
    'Spider',
    'SpiderExecution',
    'User',
    'get_all_spiders',
    'get_spider_jobs',
    'SpiderService',
    'get_db',
    'sql',
    'api_router',
    'SpiderConfig',
    'SpiderCreate',
    'SpiderRead',
    'SpiderUpdate',
    'UrlValidationRequest',
    'UrlAnalysisResponse'
]

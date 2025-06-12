from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import Dict, Any, List

from app.db.database import get_db, sql
from app.models import Spider, SpiderExecution
from app.services.spider_service import get_all_spiders, get_spider_jobs

router = APIRouter()


@router.get("/stats")
def get_dashboard_stats(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    Get dashboard statistics including:
    - Total number of spiders
    - Number of running spiders
    - Number of completed jobs
    - Total items scraped
    """
    try:
        # Get all spiders
        spiders = get_all_spiders(db)
        total_spiders = len(spiders)

        # Count running spiders
        running_spiders = sum(1 for spider in spiders if spider.status == "running")

        # Get job statistics using SQLAlchemy expressions
        completed_jobs = (
            db.query(SpiderExecution)
            .filter(SpiderExecution.status == "finished")
            .count()
        )
        total_items = (
                db.query(sql.sum(SpiderExecution.items_scraped))
                .scalar() or 0
        )

        return {
            "total_spiders": total_spiders,
            "running_spiders": running_spiders,
            "completed_jobs": completed_jobs,
            "total_items_scraped": total_items
        }

    except Exception as e:
        raise Exception(f"Error getting dashboard stats: {str(e)}")


@router.get("/recent-jobs")
def get_recent_jobs(db: Session = Depends(get_db), limit: int = 5) -> List[Dict[str, Any]]:
    """Get the most recent spider jobs with their associated spider information"""
    try:
        # Get recent jobs
        recent_jobs = (
            db.query(SpiderExecution)
            .order_by(SpiderExecution.started_at.desc())
            .limit(limit)
            .all()
        )

        # Prepare response with spider information
        result = []
        for job in recent_jobs:
            # Get associated spider information using SQLAlchemy expression
            spider = (
                db.query(Spider)
                .filter(and_(Spider.id == job.spider_id))
                .first()
            )

            if spider:
                result.append({
                    "job_id": job.id,
                    "spider_id": job.spider_id,
                    "spider_name": spider.name,
                    "status": job.status,
                    "started_at": job.started_at,
                    "finished_at": job.finished_at,
                    "items_scraped": job.items_scraped,
                    "error_message": job.error_message
                })

        return result

    except Exception as e:
        raise Exception(f"Error getting recent jobs: {str(e)}")

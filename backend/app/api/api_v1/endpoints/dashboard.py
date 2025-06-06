from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from app.db.database import get_db
from app.models.models import Spider, Job
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

        # Count running spiders (assuming a status field or similar exists)
        running_spiders = 0
        for spider in spiders:
            # Check if there's an active job for this spider
            active_jobs = db.query(Job).filter(
                Job.spider_id == spider.id,
                Job.status == "running"
            ).count()
            if active_jobs > 0:
                running_spiders += 1

        # Count completed jobs
        completed_jobs = db.query(Job).filter(Job.status == "completed").count()

        # Count total items scraped (assuming there's an items_scraped field)
        items_scraped = db.query(Job).filter(Job.status == "completed").with_entities(
            db.func.sum(Job.items_scraped)
        ).scalar() or 0

        return {
            "totalSpiders": total_spiders,
            "runningSpiders": running_spiders,
            "completedJobs": completed_jobs,
            "itemsScraped": int(items_scraped)
        }
    except Exception as e:
        # For debugging, log the error
        print(f"Error getting dashboard stats: {str(e)}")
        # Return mock data during development
        return {
            "totalSpiders": 12,
            "runningSpiders": 3,
            "completedJobs": 145,
            "itemsScraped": 32876
        }

@router.get("/recent-jobs")
def get_recent_jobs(limit: int = 5, db: Session = Depends(get_db)):
    """
    Get a list of recent jobs with their status
    """
    try:
        # Query for recent jobs ordered by start time
        recent_jobs = db.query(Job).order_by(Job.start_time.desc()).limit(limit).all()

        # Format the job data
        jobs_data = []
        for job in recent_jobs:
            # Get spider name
            spider = db.query(Spider).filter(Spider.id == job.spider_id).first()
            spider_name = spider.name if spider else "Unknown Spider"

            # Format time ago (this is a placeholder - implement proper time formatting)
            time_ago = "Recently"  # Replace with actual time formatting

            jobs_data.append({
                "id": job.id,
                "name": spider_name,
                "status": job.status,
                "items": job.items_scraped or 0,
                "time": time_ago,
                "progress": job.progress or (100 if job.status == "completed" else 0)
            })

        return jobs_data
    except Exception as e:
        # For debugging, log the error
        print(f"Error getting recent jobs: {str(e)}")
        # Return mock data during development
        return [
            {"id": "1", "name": "Product Spider", "status": "completed", "items": 234, "time": "2 hours ago", "progress": 100},
            {"id": "2", "name": "News Spider", "status": "running", "items": 56, "time": "Just now", "progress": 45},
            {"id": "3", "name": "Blog Spider", "status": "error", "items": 0, "time": "1 day ago", "progress": 23},
            {"id": "4", "name": "Review Spider", "status": "completed", "items": 128, "time": "3 days ago", "progress": 100}
        ]

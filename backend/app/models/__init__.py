"""Models package initialization"""
from .models import Spider, SpiderExecution, User

Job = SpiderExecution  # Alias for backward compatibility

__all__ = ['Spider', 'SpiderExecution', 'Job', 'User']

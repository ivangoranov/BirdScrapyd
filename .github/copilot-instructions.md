# GitHub Copilot Instructions for Web Scraping Platform

## Project Overview
This is a full-stack web application for configuring and orchestrating Scrapy spiders with:
- Python/Flask backend
- React frontend
- Scrapyd for spider orchestration
- User authentication and permission system

## Tech Stack
### Backend
- Python 3.8+
- Flask framework
- SQLAlchemy ORM
- Scrapyd for spider deployment/execution
- Redis for task queuing

### Frontend
- React 18+
- Material-UI components
- Redux for state management
- Axios for API communication

## Code Conventions

### Python
- Follow PEP 8 style guidelines
- Use type hints throughout
- Document with docstrings (Google style)
- Implement proper exception handling
- Use async patterns for network operations

### JavaScript/React
- Use functional components with hooks
- Implement proper error boundaries
- Follow ESLint configuration
- Use React Query for data fetching
- Follow component/container pattern

## Domain-Specific Knowledge
- **Scrapy Architecture**: Understand spiders, items, pipelines, middlewares
- **DOM Selection**: Use CSS/XPath selectors for targeting page elements
- **Anti-Bot Bypassing**: Techniques for CAPTCHA handling, IP rotation
- **Proxy Management**: Implementation of proxy rotation middleware

## Common Tasks
- Creating user management endpoints
- Building spider configuration interfaces
- Implementing dynamic middleware injection
- Developing visual selector tools for DOM elements
- Building Scrapyd integration services

## Security Considerations
- Implement proper user isolation for spider execution
- Sanitize all user inputs for custom code execution
- Rate limit API endpoints
- Follow OWASP security practices
- Validate URL inputs before crawling

## Performance Patterns
- Use connection pooling for database access
- Implement caching for frequently accessed data
- Consider pagination for large data sets
- Use websockets for real-time updates on spider status
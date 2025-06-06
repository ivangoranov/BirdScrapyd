# BirdScrapyd

A modern web-based tool for configuring, visually creating, and orchestrating Scrapy spiders through a drag-and-drop UI.

## Features

- **Visual Spider Builder**: Drag-and-drop interface for building spider workflows
- **Real-time Monitoring**: Monitor spider execution in real-time
- **No-code Configuration**: Create and manage Scrapy spiders without programming experience
- **Persistence**: Save spider configurations in a database

## Tech Stack

### Frontend
- React
- React DnD (for drag-and-drop functionality)
- Material-UI (for UI components)
- React Flow (for visualizing spider workflows)
- React Hook Form (for form validations)
- Tailwind CSS (for styling)

### Backend
- FastAPI (REST + WebSocket)
- Scrapy (for spider creation and execution)
- SQLAlchemy (for storing configurations)
- WebSocket (for real-time updates)

## Getting Started

### Prerequisites
- Python 3.8+
- Node.js 14+
- PostgreSQL (or other database supported by SQLAlchemy)

### Installation

1. Clone the repository
2. Set up the backend:
   ```
   cd backend
   python -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```
3. Set up the frontend:
   ```
   cd frontend
   npm install
   ```

### Running the application

1. Start the backend:
   ```
   cd backend
   source venv/bin/activate
   uvicorn main:app --reload
   ```
2. Start the frontend:
   ```
   cd frontend
   npm start
   ```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

import pytest
from fastapi.testclient import TestClient
from app.db.database import SessionLocal, engine
from app.models.models import Base, Spider, SpiderExecution
import os
import json
from main import app
import time

# Set up test client
client = TestClient(app)

# Test data
test_spider = {
    "name": "test_spider",
    "start_urls": ["https://example.com"],
    "blocks": [
        {
            "id": "block1",
            "type": "Selector",
            "params": {
                "selector_type": "css",
                "selector": "h1",
                "next": "block2"
            }
        },
        {
            "id": "block2",
            "type": "Processor",
            "params": {
                "processor_type": "extract",
                "next": "block3"
            }
        },
        {
            "id": "block3",
            "type": "Output",
            "params": {
                "field_name": "title"
            }
        }
    ],
    "settings": {
        "USER_AGENT": "Mozilla/5.0"
    }
}

@pytest.fixture(scope="module")
def db_setup():
    # Create test database
    Base.metadata.create_all(bind=engine)
    # Provide db session
    db = SessionLocal()

    # Clean up existing test data
    db.query(SpiderExecution).delete()
    db.query(Spider).filter(Spider.name == "test_spider").delete()
    db.commit()

    yield db

    # Cleanup after tests
    db.query(SpiderExecution).delete()
    db.query(Spider).filter(Spider.name == "test_spider").delete()
    db.commit()
    db.close()

@pytest.fixture(scope="module")
def create_test_spider():
    """Create a test spider and return its ID"""
    response = client.post("/api/v1/spiders/", json=test_spider)
    assert response.status_code == 200, f"Failed to create test spider: {response.text}"
    data = response.json()
    spider_id = data["id"]

    yield spider_id

    # Cleanup after test
    client.delete(f"/api/v1/spiders/{spider_id}")

def test_read_main():
    """Test the root endpoint"""
    response = client.get("/")
    assert response.status_code == 200
    assert "Welcome to BirdScrapyd API" in response.json()["message"]

def test_create_spider():
    """Test creating a spider"""
    # Delete any existing test spider first to avoid conflicts
    existing_spiders = client.get("/api/v1/spiders/").json()
    for spider in existing_spiders:
        if spider["name"] == "test_spider":
            client.delete(f"/api/v1/spiders/{spider['id']}")

    response = client.post("/api/v1/spiders/", json=test_spider)
    assert response.status_code == 200, f"Failed to create spider: {response.text}"
    data = response.json()
    assert data["name"] == "test_spider"
    assert len(data["blocks"]) == 3
    assert "id" in data

    # Clean up
    client.delete(f"/api/v1/spiders/{data['id']}")

def test_get_spiders(create_test_spider):
    """Test getting all spiders"""
    spider_id = create_test_spider

    # Get all spiders
    response = client.get("/api/v1/spiders/")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)

    # Check if our test spider exists in the list
    found = False
    for spider in data:
        if spider["id"] == spider_id:
            found = True
            break
    assert found, f"Created spider {spider_id} not found in list of spiders"

def test_get_spider(create_test_spider):
    """Test getting a specific spider"""
    spider_id = create_test_spider

    # Get the spider
    response = client.get(f"/api/v1/spiders/{spider_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == spider_id
    assert data["name"] == "test_spider"

def test_update_spider(create_test_spider):
    """Test updating a spider"""
    spider_id = create_test_spider

    # Update the spider
    updated_spider = test_spider.copy()
    updated_spider["name"] = "updated_test_spider"

    response = client.put(f"/api/v1/spiders/{spider_id}", json=updated_spider)
    assert response.status_code == 200, f"Failed to update spider: {response.text}"
    data = response.json()
    assert data["id"] == spider_id
    assert data["name"] == "updated_test_spider"

    # Change the name back for other tests
    updated_spider["name"] = "test_spider"
    client.put(f"/api/v1/spiders/{spider_id}", json=updated_spider)

def test_delete_spider():
    """Test deleting a spider"""
    # Create a new spider specifically for deletion with a unique name
    delete_spider = test_spider.copy()
    delete_spider["name"] = f"delete_test_spider_{int(time.time())}"

    response = client.post("/api/v1/spiders/", json=delete_spider)
    assert response.status_code == 200, f"Failed to create spider for deletion: {response.text}"
    spider_id = response.json()["id"]

    # Delete the spider
    response = client.delete(f"/api/v1/spiders/{spider_id}")
    assert response.status_code == 200, f"Failed to delete spider: {response.text}"
    data = response.json()
    assert data["success"] is True

    # Verify it's deleted
    response = client.get(f"/api/v1/spiders/{spider_id}")
    assert response.status_code == 404

def test_validate_spider():
    """Test spider validation"""
    response = client.post("/api/v1/spiders/validate", json=test_spider)
    assert response.status_code == 200, f"Failed to validate valid spider: {response.text}"
    data = response.json()
    assert data["valid"] is True

    # Test with invalid spider (missing required field)
    invalid_spider = test_spider.copy()
    invalid_spider.pop("name")
    response = client.post("/api/v1/spiders/validate", json=invalid_spider)
    # It could be either 400 or 422 depending on whether FastAPI or our custom validation catches it
    assert response.status_code in [400, 422], f"Expected error status code, got {response.status_code}"

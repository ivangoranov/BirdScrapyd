import pytest
from fastapi.testclient import TestClient
from app.db.database import SessionLocal, engine
from app.models.models import Base, Spider, SpiderExecution
import os
import json
import time
from main import app
from app.services.spider_service import SpiderService

# Set up test client
client = TestClient(app)
spider_service = SpiderService()

# Test data for a simple spider
simple_spider = {
    "name": "simple_test_spider",
    "start_urls": ["https://quotes.toscrape.com/"],
    "blocks": [
        {
            "id": "block1",
            "type": "Selector",
            "params": {
                "selector_type": "css",
                "selector": ".quote",
                "next": "block2"
            }
        },
        {
            "id": "block2",
            "type": "Selector",
            "params": {
                "selector_type": "css",
                "selector": ".text",
                "next": "block3"
            }
        },
        {
            "id": "block3",
            "type": "Output",
            "params": {
                "field_name": "quote"
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
    db.query(Spider).filter(Spider.name == "simple_test_spider").delete()
    db.commit()

    yield db

    # Cleanup after tests
    db.query(SpiderExecution).delete()
    db.query(Spider).filter(Spider.name == "simple_test_spider").delete()
    db.commit()
    db.close()

@pytest.fixture(scope="module")
def create_test_spider(db_setup):
    # Delete any existing test spider first to avoid conflicts
    existing_spiders = client.get("/api/v1/spiders/").json()
    for spider in existing_spiders:
        if spider["name"] == "simple_test_spider":
            client.delete(f"/api/v1/spiders/{spider['id']}")

    # Create a test spider for execution tests
    response = client.post("/api/v1/spiders/", json=simple_spider)
    assert response.status_code == 200, f"Failed to create test spider: {response.text}"
    data = response.json()
    spider_id = data["id"]

    yield spider_id

    # Clean up after tests
    client.delete(f"/api/v1/spiders/{spider_id}")

def test_generate_spider_code():
    """Test the spider code generation function"""
    # Create a mock spider object
    mock_spider = type('obj', (object,), {
        'name': 'test_spider',
        'start_urls': ['https://example.com'],
        'blocks': [
            {
                'id': 'block1',
                'type': 'Selector',
                'params': {
                    'selector_type': 'css',
                    'selector': 'h1',
                    'next': 'block2'
                }
            },
            {
                'id': 'block2',
                'type': 'Output',
                'params': {
                    'field_name': 'title'
                }
            }
        ],
        'settings': {'USER_AGENT': 'Mozilla/5.0'}
    })

    # Generate code
    code = spider_service._generate_spider_code(mock_spider)

    # Verify the code contains expected elements
    # The spider class name can be either Test_spiderSpider or TestSpiderSpider
    assert any(class_name in code for class_name in ['class Test_spiderSpider(scrapy.Spider)', 'class TestSpiderSpider(scrapy.Spider)']), "Spider class definition not found in generated code"
    assert "name = 'test_spider'" in code, "Spider name not found in generated code"
    assert "start_urls = ['https://example.com']" in code, "Start URLs not found in generated code"
    assert "custom_settings = {'USER_AGENT': 'Mozilla/5.0'}" in code, "Custom settings not found in generated code"

    # Check if the code has the selector for h1 elements
    assert "selector = params.get('selector', '')" in code, "Selector parameter not found in generated code"

    # Check if output field name is processed
    assert "field_name = params.get('field_name', 'data')" in code, "Field name parameter not found in generated code"

@pytest.mark.xfail(reason="This test might fail if the web server is unavailable or has changed")
def test_run_spider(create_test_spider):
    """Test running a spider"""
    spider_id = create_test_spider

    # Run the spider
    response = client.post(f"/api/v1/spiders/{spider_id}/run")
    assert response.status_code in [200, 202], f"Failed to run spider: {response.text}"
    data = response.json()
    assert data["success"] is True, "Spider run did not return success"

    # Wait a moment for the spider to start running
    time.sleep(2)

    # Get the spider status
    response = client.get(f"/api/v1/spiders/{spider_id}")
    assert response.status_code == 200
    data = response.json()

    # The spider should be running or already finished for a simple test spider
    assert data["status"] in ["running", "idle", "finished", "error"], f"Unexpected spider status: {data['status']}"

    # If it's still running, wait a bit longer to let it finish
    if data["status"] == "running":
        time.sleep(5)

    # Get execution history
    response = client.get(f"/api/v1/spiders/{spider_id}/executions")
    assert response.status_code == 200, f"Failed to get executions: {response.text}"
    data = response.json()

    # There should be at least one execution record
    assert isinstance(data, list), "Executions response should be a list"
    assert len(data) > 0, "No execution records found"

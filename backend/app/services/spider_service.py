from typing import List, Dict, Any, Tuple, Optional
from app.models.models import Spider, SpiderExecution
from app.schemas.spider import SpiderCreate, SpiderUpdate, SpiderConfig, SpiderStatus
from app.db.database import SessionLocal
from app.api.api_v1.endpoints.websocket import manager
import asyncio
import json
import os
import subprocess
import tempfile
import datetime
import uuid
import logging

logger = logging.getLogger(__name__)

class SpiderService:
    """Service for managing Scrapy spiders"""

    def __init__(self):
        self.running_spiders = {}  # Store running spider processes

    async def get_all_spiders(self) -> List[Spider]:
        """Get all spider configurations from the database"""
        db = SessionLocal()
        try:
            return db.query(Spider).all()
        finally:
            db.close()

    async def get_spider(self, spider_id: str) -> Optional[Spider]:
        """Get a specific spider configuration by ID"""
        db = SessionLocal()
        try:
            return db.query(Spider).filter(Spider.id == spider_id).first()
        finally:
            db.close()

    async def create_spider(self, spider: SpiderCreate) -> Spider:
        """Create a new spider configuration"""
        db = SessionLocal()
        try:
            # First validate the configuration
            is_valid, message = await self.validate_spider_config(spider)
            if not is_valid:
                raise ValueError(f"Invalid spider configuration: {message}")

            # Create the database record
            db_spider = Spider(
                id=str(uuid.uuid4()),
                name=spider.name,
                start_urls=spider.start_urls,
                blocks=json.loads(json.dumps(spider.blocks, default=lambda o: o.dict())),
                settings=spider.settings or {},
                created_at=datetime.datetime.now(),
                status="idle"
            )

            db.add(db_spider)
            db.commit()
            db.refresh(db_spider)
            return db_spider
        except Exception as e:
            db.rollback()
            raise e
        finally:
            db.close()

    async def update_spider(self, spider_id: str, spider: SpiderUpdate) -> Optional[Spider]:
        """Update an existing spider configuration"""
        db = SessionLocal()
        try:
            # First validate the configuration
            is_valid, message = await self.validate_spider_config(spider)
            if not is_valid:
                raise ValueError(f"Invalid spider configuration: {message}")

            # Get the existing spider
            db_spider = db.query(Spider).filter(Spider.id == spider_id).first()
            if not db_spider:
                return None

            # Update the spider fields
            db_spider.name = spider.name
            db_spider.start_urls = spider.start_urls
            db_spider.blocks = json.loads(json.dumps(spider.blocks, default=lambda o: o.dict()))
            db_spider.settings = spider.settings or {}
            db_spider.updated_at = datetime.datetime.now()

            db.commit()
            db.refresh(db_spider)
            return db_spider
        except Exception as e:
            db.rollback()
            raise e
        finally:
            db.close()

    async def delete_spider(self, spider_id: str) -> bool:
        """Delete a spider configuration"""
        db = SessionLocal()
        try:
            # Get the existing spider
            db_spider = db.query(Spider).filter(Spider.id == spider_id).first()
            if not db_spider:
                return False

            # Stop the spider if it's running
            if spider_id in self.running_spiders:
                await self.stop_spider(spider_id)

            # Delete the spider
            db.delete(db_spider)
            db.commit()
            return True
        except Exception as e:
            db.rollback()
            raise e
        finally:
            db.close()

    async def validate_spider_config(self, config: SpiderConfig) -> Tuple[bool, str]:
        """Validate a spider configuration"""
        # Check if name is provided
        if not config.name:
            return False, "Spider name is required"

        # Check if start_urls is provided and valid
        if not config.start_urls:
            return False, "At least one start URL is required"

        # Check if blocks are provided
        if not config.blocks:
            return False, "At least one block is required"

        # Validate block connections
        block_ids = set(block.id for block in config.blocks)
        next_ids = set()

        for block in config.blocks:
            if block.type not in ["Selector", "Processor", "Output"]:
                return False, f"Invalid block type: {block.type}"

            # Check if next block IDs exist
            if "next" in block.params:
                next_block_ids = block.params["next"]
                if isinstance(next_block_ids, list):
                    for next_id in next_block_ids:
                        next_ids.add(next_id)
                        if next_id not in block_ids:
                            return False, f"Block {next_id} referenced in 'next' parameter does not exist"
                elif isinstance(next_block_ids, str):
                    next_ids.add(next_block_ids)
                    if next_block_ids not in block_ids:
                        return False, f"Block {next_block_ids} referenced in 'next' parameter does not exist"

        # Check for cycles
        # This is a simple check, a more robust cycle detection would use a graph algorithm
        if len(next_ids) >= len(block_ids):
            return False, "Cycle detected in block connections"

        return True, "Configuration is valid"

    async def run_spider(self, spider_id: str):
        """Run a spider and send real-time updates via WebSocket"""
        # Initialize execution_id to avoid undefined reference in case of exceptions
        execution_id = None
        try:
            # Get the spider configuration
            db_spider = await self.get_spider(spider_id)
            if not db_spider:
                await manager.broadcast_to_spider(spider_id, {
                    "status": "error",
                    "message": f"Spider {spider_id} not found"
                })
                return

            # Update spider status
            db = SessionLocal()
            db_spider.status = "running"
            db.commit()

            # Create execution record
            execution = SpiderExecution(
                spider_id=spider_id,
                started_at=datetime.datetime.now(),
                status="running"
            )
            db.add(execution)
            db.commit()
            execution_id = execution.id
            db.close()

            # Send initial status update
            await manager.broadcast_to_spider(spider_id, {
                "status": "running",
                "message": f"Spider {db_spider.name} started",
                "execution_id": execution_id,
                "timestamp": execution.started_at.isoformat()
            })

            # Generate Scrapy spider code from configuration
            spider_code = self._generate_spider_code(db_spider)

            # Create a temporary file for the spider code
            with tempfile.NamedTemporaryFile(suffix=".py", delete=False) as temp_file:
                temp_file.write(spider_code.encode())
                temp_file_path = temp_file.name

            # Run the spider using Scrapy
            # In a real implementation, you would use Scrapyd or similar
            # For this example, we'll use subprocess
            process = subprocess.Popen(
                ["scrapy", "runspider", temp_file_path, "-o", f"output_{spider_id}.json"],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )

            # Store the process for potential cancellation
            self.running_spiders[spider_id] = process

            # Send periodic updates
            items_scraped = 0
            output_buffer = ""
            error_buffer = ""

            while process.poll() is None:
                # Read output without blocking
                output = process.stdout.readline()
                error = process.stderr.readline()

                # Add to buffers
                if output:
                    output_buffer += output
                if error:
                    error_buffer += error

                # Parse output to get stats
                if "Scraped" in output:
                    items_scraped += 1

                    # Send update via WebSocket
                    await manager.broadcast_to_spider(spider_id, {
                        "status": "running",
                        "items_scraped": items_scraped,
                        "message": output.strip() if output else None,
                        "execution_id": execution_id
                    })

                # Handle errors immediately
                if error:
                    await manager.broadcast_to_spider(spider_id, {
                        "status": "running",
                        "error_message": error.strip(),
                        "execution_id": execution_id
                    })

                # Sleep to avoid high CPU usage
                await asyncio.sleep(0.1)

            # Process completed
            return_code = process.returncode

            # Get any remaining output
            stdout, stderr = process.communicate()
            if stdout:
                output_buffer += stdout
            if stderr:
                error_buffer += stderr

            # Update execution record
            db = SessionLocal()
            execution = db.query(SpiderExecution).filter(SpiderExecution.id == execution_id).first()
            execution.finished_at = datetime.datetime.now()
            execution.items_scraped = items_scraped

            # Update spider status
            db_spider = db.query(Spider).filter(Spider.id == spider_id).first()

            if return_code == 0:
                execution.status = "finished"
                db_spider.status = "idle"

                # Send final update
                await manager.broadcast_to_spider(spider_id, {
                    "status": "finished",
                    "items_scraped": items_scraped,
                    "message": f"Spider {db_spider.name} completed successfully",
                    "execution_id": execution_id,
                    "timestamp": execution.finished_at.isoformat()
                })
            else:
                execution.status = "error"
                execution.error_message = stderr
                db_spider.status = "error"

                # Send error update
                await manager.broadcast_to_spider(spider_id, {
                    "status": "error",
                    "error_message": stderr,
                    "execution_id": execution_id,
                    "timestamp": execution.finished_at.isoformat()
                })

            db.commit()
            db.close()

            # Clean up
            if spider_id in self.running_spiders:
                del self.running_spiders[spider_id]

            # Delete temporary file
            os.unlink(temp_file_path)

        except Exception as e:
            # Handle exceptions
            logger.exception(f"Error running spider {spider_id}: {str(e)}")

            # Update status
            db = None
            try:
                db = SessionLocal()
                db_spider = db.query(Spider).filter(Spider.id == spider_id).first()
                if db_spider:
                    db_spider.status = "error"

                # Update execution if it exists
                if execution_id:
                    execution = db.query(SpiderExecution).filter(SpiderExecution.id == execution_id).first()
                    if execution:
                        execution.status = "error"
                        execution.error_message = str(e)
                        execution.finished_at = datetime.datetime.now()

                db.commit()
            except Exception as db_error:
                logger.exception(f"Error updating database after spider error: {str(db_error)}")
                if db:
                    db.rollback()
            finally:
                if db:
                    db.close()

            # Send error via WebSocket
            try:
                await manager.broadcast_to_spider(spider_id, {
                    "status": "error",
                    "error_message": str(e),
                    "execution_id": execution_id if execution_id else None
                })
            except Exception as ws_error:
                logger.exception(f"Error sending WebSocket message: {str(ws_error)}")

    async def stop_spider(self, spider_id: str) -> bool:
        """Stop a running spider"""
        if spider_id in self.running_spiders:
            process = self.running_spiders[spider_id]
            process.terminate()

            # Wait for the process to terminate
            try:
                process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                # Force kill if it doesn't terminate gracefully
                process.kill()

            # Update status in database
            db = SessionLocal()
            db_spider = db.query(Spider).filter(Spider.id == spider_id).first()
            if db_spider:
                db_spider.status = "idle"

            # Update execution record
            execution = db.query(SpiderExecution).filter(
                SpiderExecution.spider_id == spider_id,
                SpiderExecution.status == "running"
            ).order_by(SpiderExecution.started_at.desc()).first()

            if execution:
                execution.status = "stopped"
                execution.finished_at = datetime.datetime.now()

            db.commit()
            db.close()

            # Send status update via WebSocket
            await manager.broadcast_to_spider(spider_id, {
                "status": "stopped",
                "message": f"Spider {spider_id} stopped",
                "execution_id": execution.id if execution else None,
                "timestamp": datetime.datetime.now().isoformat()
            })

            # Clean up
            del self.running_spiders[spider_id]
            return True

        return False

    def _generate_spider_code(self, spider: Spider) -> str:
        """Generate Scrapy spider code from configuration"""
        # This is a simplified version - in a real implementation, this would be more sophisticated
        start_urls = json.dumps(spider.start_urls)

        # Create the spider code template
        spider_code = f"""
import scrapy
import json

class DynamicSpider(scrapy.Spider):
    name = "{spider.name}"
    start_urls = {start_urls}
    
    def __init__(self, *args, **kwargs):
        super(DynamicSpider, self).__init__(*args, **kwargs)
        self.blocks = {json.dumps(spider.blocks)}
        self.settings = {json.dumps(spider.settings)}
        
    def parse(self, response):
        # Execute the blocks in the order defined by the configuration
        return self.execute_block(response, self.get_start_block())
        
    def get_start_block(self):
        # Find the first block (usually a selector connected to start_urls)
        for block in self.blocks:
            if not any(block['id'] in next_blocks for other_block in self.blocks 
                      for next_blocks in (other_block['params'].get('next', []) 
                                         if isinstance(other_block['params'].get('next', []), list) 
                                         else [other_block['params'].get('next')] 
                                         if other_block['params'].get('next') else [])):\n"""

        # Add double curly braces to escape them in the f-string
        spider_code += """                return block
        return self.blocks[0] if self.blocks else None
        
    def execute_block(self, response, block):
        if not block:
            return
            
        try:
            block_type = block['type']
            params = block['params']
            
            if block_type == 'Selector':
                # Execute selector block
                selector = params.get('xpath', '')
                if selector:
                    elements = response.xpath(selector)
                    for element in elements:
                        # Process the next blocks
                        next_blocks = params.get('next', [])
                        if isinstance(next_blocks, list):
                            for next_id in next_blocks:
                                next_block = next((b for b in self.blocks if b['id'] == next_id), None)
                                yield from self.execute_block(element, next_block)
                        elif isinstance(next_blocks, str):
                            next_block = next((b for b in self.blocks if b['id'] == next_blocks), None)
                            yield from self.execute_block(element, next_block)
                            
            elif block_type == 'Processor':
                # Execute processor block
                field_name = params.get('field_name', '')
                extractor = params.get('extractor', 'text')
                
                if extractor == 'text':
                    value = response.get() if hasattr(response, 'get') else response.extract()
                elif extractor == 'attr':
                    attr_name = params.get('attr_name', '')
                    value = response.attrib.get(attr_name, '') if hasattr(response, 'attrib') else ''
                else:
                    self.logger.warning(f"Unknown extractor type: {extractor}")
                    value = ''
                    
                # Process the next blocks
                next_blocks = params.get('next', [])
                if isinstance(next_blocks, list):
                    for next_id in next_blocks:
                        next_block = next((b for b in self.blocks if b['id'] == next_id), None)
                        if next_block:
                            # Pass the extracted value to the next block
                            context = {field_name: value}
                            response.meta.update(context)
                            yield from self.execute_block(response, next_block)
                elif isinstance(next_blocks, str):
                    next_block = next((b for b in self.blocks if b['id'] == next_blocks), None)
                    if next_block:
                        # Pass the extracted value to the next block
                        context = {field_name: value}
                        response.meta.update(context)
                        yield from self.execute_block(response, next_block)
                        
            elif block_type == 'Output':
                # Execute output block - yield an item
                fields = params.get('fields', {})
                item = {}
                
                for field_name, field_params in fields.items():
                    source = field_params.get('source', '')
                    if source == 'context':
                        # Get from context (previous processors)
                        context_key = field_params.get('context_key', '')
                        item[field_name] = response.meta.get(context_key, '')
                    elif source == 'xpath':
                        # Extract directly using xpath
                        xpath = field_params.get('xpath', '')
                        item[field_name] = response.xpath(xpath).get('')
                    elif source == 'const':
                        # Use a constant value
                        item[field_name] = field_params.get('value', '')
                    else:
                        self.logger.warning(f"Unknown source type: {source}")
                        item[field_name] = ''
                        
                yield item
            else:
                self.logger.warning(f"Unknown block type: {block_type}")
        except Exception as e:
            self.logger.error(f"Error executing block {block.get('id', 'unknown')}: {str(e)}")
"""
        return spider_code

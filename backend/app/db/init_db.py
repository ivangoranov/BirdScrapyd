from app.db.database import engine, SessionLocal
from app.models.models import Base, User
from app.core.auth import get_password_hash
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

def init_db():
    # Create all tables defined in models
    Base.metadata.create_all(bind=engine)

    # Create superuser if doesn't exist
    create_superuser()

def create_superuser():
    # Get superuser credentials from environment variables or use defaults
    superuser_username = os.getenv("SUPERUSER_USERNAME", "admin")
    superuser_email = os.getenv("SUPERUSER_EMAIL", "admin@birdscrapyd.com")
    superuser_password = os.getenv("SUPERUSER_PASSWORD", "changeme123")

    db = SessionLocal()
    try:
        # Check if superuser already exists
        existing_superuser = db.query(User).filter(User.is_superuser == True).first()
        if not existing_superuser:
            print(f"Creating superuser account with username: {superuser_username}")

            # Create superuser
            hashed_password = get_password_hash(superuser_password)
            db_user = User(
                username=superuser_username,
                email=superuser_email,
                hashed_password=hashed_password,
                is_superuser=True,
                is_active=True
            )

            db.add(db_user)
            db.commit()
            print("Superuser created successfully")
        else:
            print("Superuser already exists, skipping creation")
    except Exception as e:
        print(f"Error creating superuser: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    print("Creating database tables...")
    init_db()
    print("Database tables created successfully.")

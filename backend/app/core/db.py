from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

# In a real environment, this might connect to a Postgres container
# For now, I'll use a placeholder or local postgres if available.
# Since I don't have a Postgres container running yet, I'll define the engine.
SQLALCHEMY_DATABASE_URL = f"postgresql://{settings.POSTGRES_USER}:{settings.POSTGRES_PASSWORD}@{settings.POSTGRES_SERVER}/{settings.POSTGRES_DB}"

# Primary Application Database (Local Instances, Stats, etc.)
engine = create_engine(settings.get_database_url)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Global Factory Database (Global Mentors, Shared Identity)
factory_engine = create_engine(settings.get_factory_url)
SessionFactory = sessionmaker(autocommit=False, autoflush=False, bind=factory_engine)

def init_db():
    from app.models.factory import Base
    # Initialize both if necessary
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_factory_db():
    db = SessionFactory()
    try:
        yield db
    finally:
        db.close()

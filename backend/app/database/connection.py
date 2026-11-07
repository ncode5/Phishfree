import os
import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from sqlalchemy.pool import NullPool
from app.core.config import settings

# Normalize database URL for SQLAlchemy 2.0 (Supabase and Neon often use postgres://)
raw_db_url = settings.DATABASE_URL or "sqlite:///./trust_intel.db"
if raw_db_url.startswith("postgres://"):
    raw_db_url = raw_db_url.replace("postgres://", "postgresql://", 1)

# Detect serverless environment (Vercel, AWS Lambda, or hosted pooler)
is_serverless = bool(
    os.getenv("VERCEL") or 
    os.getenv("AWS_LAMBDA_FUNCTION_NAME") or 
    "neon.tech" in raw_db_url or 
    "supabase.co" in raw_db_url or 
    "pooler" in raw_db_url
)

# Engine configuration
engine_kwargs = {}

if raw_db_url.startswith("sqlite"):
    engine_kwargs["connect_args"] = {"check_same_thread": False}
else:
    # Hosted PostgreSQL (Neon / Supabase)
    # Serverless instances should use NullPool to avoid leaking idle connections across invocations
    if is_serverless:
        engine_kwargs["poolclass"] = NullPool
    else:
        engine_kwargs["pool_size"] = 5
        engine_kwargs["max_overflow"] = 5
        engine_kwargs["pool_recycle"] = 300
    
    engine_kwargs["pool_pre_ping"] = True
    engine_kwargs["connect_args"] = {"connect_timeout": 10}

engine = create_engine(raw_db_url, **engine_kwargs)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """Dependency that yields a database session and safely closes it."""
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Initializes database tables defined in models and applies non-destructive column migrations."""
    try:
        from app.database import models  # noqa: F401
        from sqlalchemy import text
        Base.metadata.create_all(bind=engine)

        with engine.connect() as conn:
            # SQLite migration check
            if engine.dialect.name == "sqlite":
                res = conn.execute(text("PRAGMA table_info(threat_indicators)")).fetchall()
                existing_cols = {row[1] for row in res}
                if existing_cols and "normalized_value" not in existing_cols:
                    conn.execute(text("ALTER TABLE threat_indicators ADD COLUMN normalized_value TEXT"))
                    conn.execute(text("ALTER TABLE threat_indicators ADD COLUMN raw_value TEXT"))
                    conn.execute(text("ALTER TABLE threat_indicators ADD COLUMN occurrence_count INTEGER DEFAULT 1"))
                    conn.execute(text("ALTER TABLE threat_indicators ADD COLUMN risk_score REAL DEFAULT 0.0"))
                    conn.execute(text("ALTER TABLE threat_indicators ADD COLUMN details JSON"))
                    conn.execute(text("ALTER TABLE threat_indicators ADD COLUMN created_at TIMESTAMP"))
                    conn.commit()
            elif engine.dialect.name == "postgresql":
                # Ensure columns exist on PostgreSQL
                conn.execute(text("ALTER TABLE threat_indicators ADD COLUMN IF NOT EXISTS normalized_value TEXT;"))
                conn.execute(text("ALTER TABLE threat_indicators ADD COLUMN IF NOT EXISTS raw_value TEXT;"))
                conn.execute(text("ALTER TABLE threat_indicators ADD COLUMN IF NOT EXISTS occurrence_count INTEGER DEFAULT 1;"))
                conn.execute(text("ALTER TABLE threat_indicators ADD COLUMN IF NOT EXISTS risk_score REAL DEFAULT 0.0;"))
                conn.execute(text("ALTER TABLE threat_indicators ADD COLUMN IF NOT EXISTS details JSONB;"))
                conn.execute(text("ALTER TABLE threat_indicators ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;"))
                conn.commit()

        print("Database schema successfully verified/initialized.")
    except Exception as e:
        print(f"Warning: Database initialization encountered an error: {str(e)}", file=sys.stderr)


if __name__ == "__main__":
    print(f"Connecting to database (Serverless mode: {is_serverless})...")
    init_db()
    print("Database migration check completed.")

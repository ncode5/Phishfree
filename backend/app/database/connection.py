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

# On Vercel serverless, the task working directory (/var/task) is read-only.
# Fall back to writable /tmp directory if external hosted PostgreSQL is not provided.
if os.getenv("VERCEL") and raw_db_url.startswith("sqlite"):
    raw_db_url = "sqlite:////tmp/trust_intel.db"

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

                # Non-destructive migrations for users table
                user_res = conn.execute(text("PRAGMA table_info(users)")).fetchall()
                existing_user_cols = {row[1] for row in user_res}
                if existing_user_cols:
                    if "is_active" not in existing_user_cols:
                        conn.execute(text("ALTER TABLE users ADD COLUMN is_active INTEGER DEFAULT 1"))
                    if "is_verified" not in existing_user_cols:
                        conn.execute(text("ALTER TABLE users ADD COLUMN is_verified INTEGER DEFAULT 1"))
                    if "account_status" not in existing_user_cols:
                        conn.execute(text("ALTER TABLE users ADD COLUMN account_status TEXT DEFAULT 'ACTIVE'"))
                    conn.commit()
            elif engine.dialect.name == "postgresql":
                # Ensure columns exist on PostgreSQL
                conn.execute(text("ALTER TABLE threat_indicators ADD COLUMN IF NOT EXISTS normalized_value TEXT;"))
                conn.execute(text("ALTER TABLE threat_indicators ADD COLUMN IF NOT EXISTS raw_value TEXT;"))
                conn.execute(text("ALTER TABLE threat_indicators ADD COLUMN IF NOT EXISTS occurrence_count INTEGER DEFAULT 1;"))
                conn.execute(text("ALTER TABLE threat_indicators ADD COLUMN IF NOT EXISTS risk_score REAL DEFAULT 0.0;"))
                conn.execute(text("ALTER TABLE threat_indicators ADD COLUMN IF NOT EXISTS details JSONB;"))
                conn.execute(text("ALTER TABLE threat_indicators ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;"))
                conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active INTEGER DEFAULT 1;"))
                conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified INTEGER DEFAULT 1;"))
                conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS account_status TEXT DEFAULT 'ACTIVE';"))
                conn.commit()

        print("Database schema successfully verified/initialized.")

        # Seed default demonstration security analyst and administrator if repository is empty
        try:
            with SessionLocal() as db:
                from app.services.auth_service import AuthService
                analyst = db.query(models.User).filter(models.User.email == "analyst@phishfree.io").first()
                if not analyst:
                    demo_user = models.User(
                        email="analyst@phishfree.io",
                        full_name="Ankur Giri",
                        hashed_password=AuthService.hash_password("Password123!"),
                        role="security_analyst",
                        is_active=1,
                        is_verified=1
                    )
                    db.add(demo_user)
                    db.commit()
                    print("Default demo analyst seeded: analyst@phishfree.io / Password123!")

                admin = db.query(models.User).filter(models.User.email == "admin@phishfree.io").first()
                if not admin:
                    demo_admin = models.User(
                        email="admin@phishfree.io",
                        full_name="SecOps Platform Administrator",
                        hashed_password=AuthService.hash_password("AdminPassword123!"),
                        role="admin",
                        is_active=1,
                        is_verified=1
                    )
                    db.add(demo_admin)
                    db.commit()
                    print("Default demo admin seeded: admin@phishfree.io / AdminPassword123!")
        except Exception as e:
            print(f"Notice: User seeding check bypassed: {e}")
    except Exception as e:
        print(f"Warning: Database initialization encountered an error: {str(e)}", file=sys.stderr)


if __name__ == "__main__":
    print(f"Connecting to database (Serverless mode: {is_serverless})...")
    init_db()
    print("Database migration check completed.")

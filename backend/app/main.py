from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.database.connection import init_db
from app.api.endpoints import router as api_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables on application cold-start if needed
    try:
        init_db()
    except Exception as e:
        print(f"Serverless startup notice: init_db bypassed or deferred: {e}")
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="AI-Powered Web Threat Detection & Digital Trust Intelligence - Module 1 (Vercel Serverless Edition)",
    version="1.0.0",
    lifespan=lifespan
)

# Vercel Serverless Path Normalization Middleware
# Restores the original requested URL from x-matched-path or x-forwarded-uri when Vercel internal rewrites route to /api/index.py
@app.middleware("http")
async def vercel_path_rewrite_middleware(request: Request, call_next):
    matched_path = request.headers.get("x-matched-path") or request.headers.get("x-forwarded-uri")
    if matched_path and request.scope.get("path") in ("/api/index.py", "/api/index", "/api"):
        request.scope["path"] = matched_path
    elif request.scope.get("path") in ("/api/index.py", "/api/index"):
        request.scope["path"] = "/"
    response = await call_next(request)
    return response

# Configure explicit, secure CORS origins preventing unrestricted origin matching
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_exact_origins,
    allow_origin_regex=settings.cors_origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API routes with multi-prefix support for Vercel serverless rewrites
# This ensures /api/v1, /v1, and / paths resolve seamlessly regardless of rewrite rules
app.include_router(api_router, prefix="/api/v1")
app.include_router(api_router, prefix="/v1")
app.include_router(api_router, prefix="")


@app.get("/", tags=["Root"])
def root():
    return {
        "project": settings.PROJECT_NAME,
        "active_module": "Module 1: Intelligent URL and Website Analysis",
        "deployment": "Vercel Serverless Architecture",
        "documentation": "/docs",
        "health": "/api/v1/health"
    }


@app.get("/api/index.py", include_in_schema=False)
def vercel_entry_fallback():
    return root()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)

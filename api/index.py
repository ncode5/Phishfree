import os
import sys

# Dynamic path resolution for Vercel Serverless
current_dir = os.path.dirname(__file__)
root_dir = os.path.abspath(os.path.join(current_dir, ".."))
backend_dir = os.path.abspath(os.path.join(current_dir, "..", "backend"))

# Add paths to sys.path
for path in [backend_dir, root_dir]:
    if os.path.exists(path) and path not in sys.path:
        sys.path.insert(0, path)

# Robust fallback import
try:
    from app.main import app
except ImportError:
    from backend.app.main import app

# Explicit ASGI app export for Vercel
app = app


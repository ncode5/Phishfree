import sys
import os

# Add backend directory to sys.path so app modules import cleanly
current_dir = os.path.dirname(__file__)
backend_dir = os.path.abspath(os.path.join(current_dir, "..", "backend"))

if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

try:
    from app.main import app
except ImportError:
    # Alternative path if root directory was changed
    from backend.app.main import app

# Vercel Serverless Function expects ASGI/WSGI app instance


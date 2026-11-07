import sys
import os

# When deploying with backend as root directory in Vercel
current_dir = os.path.dirname(__file__)
backend_dir = os.path.abspath(os.path.join(current_dir, ".."))

if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.main import app

# Vercel Serverless Function expects ASGI/WSGI app instance


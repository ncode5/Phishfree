import sys
import os
from urllib.parse import parse_qsl, urlencode

# When deploying with backend as root directory in Vercel
current_dir = os.path.dirname(__file__)
backend_dir = os.path.abspath(os.path.join(current_dir, ".."))

if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.main import app as fastapi_app


class VercelPathRewriteASGIMiddleware:
    """
    ASGI middleware ensuring that Vercel serverless rewrites (which route all traffic
    to /api/index.py?__path__=$1) are translated back into their genuine HTTP paths
    before FastAPI routing inspects the ASGI scope.
    """
    def __init__(self, inner_app):
        self.inner_app = inner_app

    async def __call__(self, scope, receive, send):
        if scope.get("type") == "http":
            current_path = scope.get("path", "")
            if current_path in ("/api/index.py", "/api/index", "/api", ""):
                query_string = scope.get("query_string", b"").decode("latin-1")
                params = parse_qsl(query_string, keep_blank_values=True)
                path_param = None
                new_params = []
                for k, v in params:
                    if k == "__path__":
                        path_param = v
                    else:
                        new_params.append((k, v))

                resolved = None
                if path_param is not None:
                    clean_path = path_param.strip()
                    resolved = ("/" + clean_path.lstrip("/")) if clean_path else "/"
                    scope["query_string"] = urlencode(new_params).encode("latin-1")
                else:
                    # Check headers fallback
                    headers = dict(scope.get("headers", []))
                    for h_name in (b"x-vercel-matched-path", b"x-matched-path", b"x-forwarded-uri", b"x-original-uri"):
                        val = headers.get(h_name)
                        if val:
                            decoded = val.decode("latin-1").split("?")[0]
                            if decoded not in ("/api/index.py", "/api/index", "/api"):
                                resolved = ("/" + decoded.lstrip("/")) if decoded else "/"
                                break

                if resolved:
                    scope["path"] = resolved
                else:
                    scope["path"] = "/"
                scope["raw_path"] = scope["path"].encode("latin-1")

        await self.inner_app(scope, receive, send)


# Expose ASGI application for Vercel Python runtime
app = VercelPathRewriteASGIMiddleware(fastapi_app)

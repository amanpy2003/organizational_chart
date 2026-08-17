"""Vercel serverless entrypoint.

Vercel builds any Python file under /api into its own serverless function
and, per vercel.json's rewrite, forwards every /api/* request to this one —
so it just needs to expose the real FastAPI app as `app`. The actual
application code lives in backend/app/ (a normal package, unaware of
Vercel), which keeps the app runnable exactly as before with a plain
`uvicorn app.main:app` for local development.
"""
import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent / "backend"
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.main import app  # noqa: E402  (import must follow the sys.path patch above)

__all__ = ["app"]

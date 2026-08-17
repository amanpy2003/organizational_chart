from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api import export, health, template, upload
from app.config.settings import get_settings

settings = get_settings()

app = FastAPI(
    title="Organizational Chart Generator API",
    description="Parses org-hierarchy Excel files, validates them, builds the "
    "hierarchy tree, and renders paginated PDF exports.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_origin_regex=settings.cors_origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    return JSONResponse(
        status_code=500,
        content={"detail": "An unexpected error occurred while processing your request."},
    )


app.include_router(health.router, prefix="/api", tags=["health"])
app.include_router(template.router, prefix="/api", tags=["template"])
app.include_router(upload.router, prefix="/api", tags=["upload"])
app.include_router(export.router, prefix="/api", tags=["export"])

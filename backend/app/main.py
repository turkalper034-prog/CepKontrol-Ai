import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from .database import init_database
from .api.categories.router import router as categories_router
from .api.transactions.router import router as transactions_router
from .api.budgets.router import router as budgets_router
from .api.goals.router import router as goals_router
from .api.dashboard.router import router as dashboard_router
from .api.reports.router import router as reports_router
from .api.ai.router import router as ai_router

@asynccontextmanager
async def lifespan(_app: FastAPI):
    init_database()
    yield


app = FastAPI(
    title="CepKontrol AI API",
    description="Kişisel finans yönetimi ve yapay zekâ destekli tasarruf uygulaması",
    version="1.0.0",
    lifespan=lifespan,
)

configured_origins = [
    origin.strip()
    for origin in os.getenv("CORS_ORIGINS", "").split(",")
    if origin.strip()
]
local_origins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    "http://cepkontrol.local:5173",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=local_origins + configured_origins,
    allow_origin_regex=os.getenv(
        "CORS_ORIGIN_REGEX",
        r"https?://(localhost|127\.0\.0\.1|cepkontrol\.local):\d+",
    ),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def protect_public_demo(request: Request, call_next):
    if (
        os.getenv("DEMO_MODE", "").lower() == "true"
        and request.url.path.startswith("/api/")
        and request.method in {"POST", "PUT", "PATCH", "DELETE"}
    ):
        return JSONResponse(
            status_code=403,
            content={"detail": "Portföy demosu salt okunurdur; kayıt değişikliği kapalıdır."},
        )
    return await call_next(request)


# Router'ları kaydet
app.include_router(categories_router)
app.include_router(transactions_router)
app.include_router(budgets_router)
app.include_router(goals_router)
app.include_router(dashboard_router)
app.include_router(reports_router)
app.include_router(ai_router)


@app.get("/api/health")
async def health_check():
    """
    API sağlık kontrolü endpoint'i.
    Uygulamanın çalıştığını doğrular.
    """
    return {
        "durum": "sağlıklı",
        "mesaj": "CepKontrol AI backend çalışıyor",
        "surum": "1.0.0",
        "demo_mode": os.getenv("DEMO_MODE", "").lower() == "true",
    }


@app.get("/")
async def root():
    """
    Ana endpoint.
    """
    return {
        "mesaj": "CepKontrol AI API'sine hoş geldiniz",
        "dokumantasyon": "/docs",
        "surum": "1.0.0"
    }

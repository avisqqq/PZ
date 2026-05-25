from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.currency_routes import router as currency_router
from app.database import Base, engine, get_db
from app.models import ExchangeRate
from app.schemas import HealthResponse

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Currency Exchange Rates API",
    description="Backend API for fetching and storing NBP exchange rates.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:4200",
        "http://127.0.0.1:4200",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(currency_router)


@app.get("/health", response_model=HealthResponse, tags=["system"])
def health_check(db: Session = Depends(get_db)) -> HealthResponse:
    db.execute(text("SELECT 1"))
    return HealthResponse(status="ok", database="connected")

from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class ExchangeRateRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    table_type: str
    table_number: str
    effective_date: date
    currency_code: str
    currency_name: str
    rate: Decimal
    created_at: datetime


class FetchResult(BaseModel):
    requested_dates: list[date]
    saved_records: int
    skipped_duplicates: int


class HealthResponse(BaseModel):
    status: str = Field(examples=["ok"])
    database: str = Field(examples=["connected"])

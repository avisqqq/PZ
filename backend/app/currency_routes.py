from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import ExchangeRate
from app.nbp_service import (
    NbpApiError,
    ensure_rates_for_date,
    ensure_rates_for_range,
    fetch_table_from_nbp,
    save_nbp_tables,
)
from app.schemas import ExchangeRateRead, FetchResult

router = APIRouter(prefix="/currencies", tags=["currencies"])


@router.get("", response_model=list[ExchangeRateRead])
def get_currencies(
    date_value: date | None = Query(default=None, alias="date"),
    currency_code: str | None = Query(default=None, min_length=3, max_length=3),
    auto_fetch: bool = Query(default=True),
    db: Session = Depends(get_db),
) -> list[ExchangeRate]:
    if date_value and auto_fetch:
        try:
            ensure_rates_for_date(db, date_value)
        except NbpApiError as exc:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc

    statement = select(ExchangeRate).order_by(
        ExchangeRate.effective_date.desc(),
        ExchangeRate.currency_code.asc(),
    )

    if date_value:
        statement = statement.where(ExchangeRate.effective_date == date_value)

    if currency_code:
        statement = statement.where(ExchangeRate.currency_code == currency_code.upper())

    return list(db.scalars(statement).all())


@router.get("/range", response_model=list[ExchangeRateRead])
def get_currencies_by_range(
    start_date: date,
    end_date: date,
    currency_code: str | None = Query(default=None, min_length=3, max_length=3),
    auto_fetch: bool = Query(default=True),
    db: Session = Depends(get_db),
) -> list[ExchangeRate]:
    if start_date > end_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="start_date must be earlier than or equal to end_date",
        )

    if auto_fetch:
        try:
            ensure_rates_for_range(db, start_date, end_date)
        except NbpApiError as exc:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc

    statement = (
        select(ExchangeRate)
        .where(ExchangeRate.effective_date >= start_date)
        .where(ExchangeRate.effective_date <= end_date)
        .order_by(ExchangeRate.effective_date.desc(), ExchangeRate.currency_code.asc())
    )

    if currency_code:
        statement = statement.where(ExchangeRate.currency_code == currency_code.upper())

    return list(db.scalars(statement).all())


@router.post("/fetch", response_model=FetchResult)
def fetch_currencies_for_date(
    date_value: date | None = Query(default=None, alias="date"),
    db: Session = Depends(get_db),
) -> FetchResult:
    try:
        tables = fetch_table_from_nbp(selected_date=date_value)
        saved, skipped, requested_dates = save_nbp_tables(db, tables)
    except NbpApiError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc

    return FetchResult(
        requested_dates=requested_dates,
        saved_records=saved,
        skipped_duplicates=skipped,
    )


@router.post("/fetch/range", response_model=FetchResult)
def fetch_currencies_for_range(
    start_date: date,
    end_date: date,
    db: Session = Depends(get_db),
) -> FetchResult:
    if start_date > end_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="start_date must be earlier than or equal to end_date",
        )

    try:
        tables = fetch_table_from_nbp(start_date=start_date, end_date=end_date)
        saved, skipped, requested_dates = save_nbp_tables(db, tables)
    except NbpApiError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc

    return FetchResult(
        requested_dates=requested_dates,
        saved_records=saved,
        skipped_duplicates=skipped,
    )


@router.get("/{date_value}", response_model=list[ExchangeRateRead])
def get_currencies_by_date(
    date_value: date,
    currency_code: str | None = Query(default=None, min_length=3, max_length=3),
    db: Session = Depends(get_db),
) -> list[ExchangeRate]:
    return get_currencies(
        date_value=date_value,
        currency_code=currency_code,
        auto_fetch=True,
        db=db,
    )

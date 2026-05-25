import os
from datetime import date
from decimal import Decimal
from typing import Any

import requests
from dotenv import load_dotenv
from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session

from app.models import ExchangeRate

load_dotenv()

NBP_API_URL = os.getenv(
    "NBP_API_URL",
    "https://api.nbp.pl/api/exchangerates/tables/a",
).rstrip("/")


class NbpApiError(Exception):
    pass


def fetch_table_from_nbp(
    selected_date: date | None = None,
    start_date: date | None = None,
    end_date: date | None = None,
) -> list[dict[str, Any]]:
    if start_date and end_date:
        url = f"{NBP_API_URL}/{start_date.isoformat()}/{end_date.isoformat()}/"
    elif selected_date:
        url = f"{NBP_API_URL}/{selected_date.isoformat()}/"
    else:
        url = f"{NBP_API_URL}/today/"

    response = requests.get(url, params={"format": "json"}, timeout=10)

    if response.status_code == 404:
        raise NbpApiError("NBP API does not contain exchange rates for this date.")

    try:
        response.raise_for_status()
    except requests.HTTPError as exc:
        raise NbpApiError("NBP API request failed.") from exc

    payload = response.json()
    if not isinstance(payload, list):
        raise NbpApiError("Unexpected NBP API response format.")

    return payload


def save_nbp_tables(db: Session, tables: list[dict[str, Any]]) -> tuple[int, int, list[date]]:
    rows: list[dict[str, Any]] = []
    requested_dates: list[date] = []

    for table in tables:
        effective_date = date.fromisoformat(table["effectiveDate"])
        requested_dates.append(effective_date)

        for rate in table["rates"]:
            rows.append(
                {
                    "table_type": table["table"],
                    "table_number": table["no"],
                    "effective_date": effective_date,
                    "currency_code": rate["code"],
                    "currency_name": rate["currency"],
                    "rate": Decimal(str(rate["mid"])),
                }
            )

    if not rows:
        return 0, 0, requested_dates

    statement = insert(ExchangeRate).values(rows)
    statement = statement.on_conflict_do_nothing(
        index_elements=["table_type", "effective_date", "currency_code"]
    ).returning(ExchangeRate.id)
    saved_ids = db.scalars(statement).all()
    db.commit()

    saved = len(saved_ids)
    skipped = len(rows) - saved
    return saved, skipped, requested_dates


def ensure_rates_for_date(db: Session, selected_date: date) -> None:
    existing_rate = db.scalar(
        select(ExchangeRate.id).where(ExchangeRate.effective_date == selected_date).limit(1)
    )
    if existing_rate:
        return

    tables = fetch_table_from_nbp(selected_date=selected_date)
    save_nbp_tables(db, tables)


def ensure_rates_for_range(db: Session, start_date: date, end_date: date) -> None:
    existing_rate = db.scalar(
        select(ExchangeRate.id)
        .where(ExchangeRate.effective_date >= start_date)
        .where(ExchangeRate.effective_date <= end_date)
        .limit(1)
    )
    if existing_rate:
        return

    tables = fetch_table_from_nbp(start_date=start_date, end_date=end_date)
    save_nbp_tables(db, tables)

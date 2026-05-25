from datetime import date
from decimal import Decimal

from app.models import ExchangeRate


def add_rate(
    db_session,
    currency_code: str = "USD",
    effective_date: date = date(2026, 5, 25),
    rate: Decimal = Decimal("3.6374"),
) -> ExchangeRate:
    exchange_rate = ExchangeRate(
        table_type="A",
        table_number="099/A/NBP/2026",
        effective_date=effective_date,
        currency_code=currency_code,
        currency_name="dolar amerykanski" if currency_code == "USD" else "euro",
        rate=rate,
    )
    db_session.add(exchange_rate)
    db_session.commit()
    db_session.refresh(exchange_rate)
    return exchange_rate


def test_endpoint_zdrowia_zwraca_status_bazy_danych(client):
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok", "database": "connected"}


def test_pobieranie_kursow_filtruje_po_dacie_i_walucie(client, db_session):
    add_rate(db_session, "USD", date(2026, 5, 25), Decimal("3.6374"))
    add_rate(db_session, "EUR", date(2026, 5, 25), Decimal("4.2500"))
    add_rate(db_session, "USD", date(2026, 5, 24), Decimal("3.6000"))

    response = client.get(
        "/currencies",
        params={
            "date": "2026-05-25",
            "currency_code": "USD",
            "auto_fetch": "false",
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert len(body) == 1
    assert body[0]["currency_code"] == "USD"
    assert body[0]["effective_date"] == "2026-05-25"
    assert body[0]["rate"] == "3.6374"


def test_pobieranie_zakresu_kursow_filtruje_rekordy(client, db_session):
    add_rate(db_session, "USD", date(2026, 5, 1), Decimal("3.6000"))
    add_rate(db_session, "USD", date(2026, 5, 25), Decimal("3.6374"))
    add_rate(db_session, "USD", date(2026, 4, 30), Decimal("3.5000"))

    response = client.get(
        "/currencies/range",
        params={
            "start_date": "2026-05-01",
            "end_date": "2026-05-25",
            "currency_code": "USD",
            "auto_fetch": "false",
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert len(body) == 2
    assert {item["effective_date"] for item in body} == {"2026-05-01", "2026-05-25"}


def test_pobieranie_kursow_uzywa_zamockowanego_serwisu_nbp(client, monkeypatch):
    def fake_fetch_table_from_nbp(selected_date=None, start_date=None, end_date=None):
        assert selected_date == date(2026, 5, 25)
        return [
            {
                "table": "A",
                "no": "099/A/NBP/2026",
                "effectiveDate": "2026-05-25",
                "rates": [
                    {
                        "currency": "dolar amerykanski",
                        "code": "USD",
                        "mid": 3.6374,
                    }
                ],
            }
        ]

    def fake_save_nbp_tables(db, tables):
        assert tables[0]["rates"][0]["code"] == "USD"
        return 1, 0, [date(2026, 5, 25)]

    monkeypatch.setattr(
        "app.currency_routes.fetch_table_from_nbp",
        fake_fetch_table_from_nbp,
    )
    monkeypatch.setattr("app.currency_routes.save_nbp_tables", fake_save_nbp_tables)

    response = client.post("/currencies/fetch", params={"date": "2026-05-25"})

    assert response.status_code == 200
    assert response.json() == {
        "requested_dates": ["2026-05-25"],
        "saved_records": 1,
        "skipped_duplicates": 0,
    }


def test_pobieranie_zakresu_kursow_uzywa_zamockowanego_serwisu_nbp(client, monkeypatch):
    def fake_fetch_table_from_nbp(selected_date=None, start_date=None, end_date=None):
        assert selected_date is None
        assert start_date == date(2026, 5, 1)
        assert end_date == date(2026, 5, 25)
        return [
            {
                "table": "A",
                "no": "080/A/NBP/2026",
                "effectiveDate": "2026-05-01",
                "rates": [
                    {
                        "currency": "dolar amerykanski",
                        "code": "USD",
                        "mid": 3.6000,
                    }
                ],
            },
            {
                "table": "A",
                "no": "099/A/NBP/2026",
                "effectiveDate": "2026-05-25",
                "rates": [
                    {
                        "currency": "dolar amerykanski",
                        "code": "USD",
                        "mid": 3.6374,
                    }
                ],
            },
        ]

    def fake_save_nbp_tables(db, tables):
        assert len(tables) == 2
        return 2, 0, [date(2026, 5, 1), date(2026, 5, 25)]

    monkeypatch.setattr(
        "app.currency_routes.fetch_table_from_nbp",
        fake_fetch_table_from_nbp,
    )
    monkeypatch.setattr("app.currency_routes.save_nbp_tables", fake_save_nbp_tables)

    response = client.post(
        "/currencies/fetch/range",
        params={
            "start_date": "2026-05-01",
            "end_date": "2026-05-25",
        },
    )

    assert response.status_code == 200
    assert response.json() == {
        "requested_dates": ["2026-05-01", "2026-05-25"],
        "saved_records": 2,
        "skipped_duplicates": 0,
    }


def test_sciezka_z_data_zwraca_kursy_walut(client, db_session):
    add_rate(db_session, "USD", date(2026, 5, 25), Decimal("3.6374"))
    add_rate(db_session, "EUR", date(2026, 5, 25), Decimal("4.2500"))

    response = client.get(
        "/currencies/2026-05-25",
        params={"currency_code": "USD"},
    )

    assert response.status_code == 200
    body = response.json()
    assert len(body) == 1
    assert body[0]["currency_code"] == "USD"
    assert body[0]["effective_date"] == "2026-05-25"


def test_zakres_zwraca_blad_dla_nieprawidlowej_kolejnosci_dat(client):
    response = client.get(
        "/currencies/range",
        params={
            "start_date": "2026-05-25",
            "end_date": "2026-05-01",
        },
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "start_date must be earlier than or equal to end_date"

# Currency Exchange Rates

Projekt jest aplikacja internetowa do pobierania i wyswietlania kursow walut z API NBP. Dane sa zapisywane w bazie PostgreSQL i prezentowane w Angularze z podsumowaniem wedlug lat, kwartalow, miesiecy i dni.

## Struktura projektu

```text
backend/      FastAPI, endpointy REST, integracja z API NBP i baza danych
frontend/     Angular + Angular Material, tabela, filtry, wykres i testy Jasmine/Karma
database/     Skrypt inicjalizacyjny PostgreSQL
bdd-tests/    Testy BDD w Gherkin uruchamiane przez Cucumber JVM
```

## Technologie

- Frontend: Angular, Angular Material, Jasmine/Karma
- Backend: FastAPI, SQLAlchemy, Pytest
- Baza danych: PostgreSQL
- Konteneryzacja: Docker, Docker Compose
- API zewnetrzne: NBP API
- BDD: Gherkin, Cucumber JVM, Selenium, Rest Assured

## Uruchomienie aplikacji

Wymagany jest Docker Desktop.

```bash
docker compose up -d --build
```

Adresy:

```text
Frontend: http://127.0.0.1:4200
Backend Swagger: http://127.0.0.1:8000/docs
PostgreSQL: localhost:5432
```

Zatrzymanie:

```bash
docker compose down
```

## Testy

Backend unit tests:

```bash
cd backend
python -m pytest
```

Zakres testow backendu:

- `test_health_check_returns_database_status` - sprawdza endpoint `/health` i polaczenie z baza.
- `test_get_currencies_filters_by_date_and_currency` - sprawdza filtrowanie kursow po dacie i walucie.
- `test_get_currencies_range_filters_records` - sprawdza pobieranie danych z zakresu dat.
- `test_fetch_currencies_uses_nbp_service_mock` - sprawdza pobieranie danych z NBP dla jednej daty z mockiem.
- `test_fetch_currencies_range_uses_nbp_service_mock` - sprawdza pobieranie danych z NBP dla zakresu dat z mockiem.
- `test_get_currencies_by_date_path_returns_rates` - sprawdza endpoint z data w sciezce URL.
- `test_range_returns_bad_request_for_invalid_dates` - sprawdza blad dla niepoprawnego zakresu dat.

Frontend unit tests Jasmine/Karma:

```bash
cd frontend
npm test -- --watch=false
```

Zakres testow frontendu:

- `should create the app` - sprawdza, czy glowny komponent Angular tworzy sie poprawnie.
- `should render page title` - sprawdza wyswietlenie tytulu aplikacji.
- `should load rates after clicking display button` - sprawdza logike przycisku wyswietlania danych.
- `should not call backend for range longer than 93 days` - sprawdza walidacje limitu API NBP.
- `should not call backend for PLN because it is the base currency` - sprawdza blokade waluty PLN.
- `should clear table when backend returns an error` - sprawdza czyszczenie tabeli po bledzie backendu.
- `should request rates from range endpoint with filters` - sprawdza zapytanie GET do backendu z filtrami.
- `should call fetch range endpoint` - sprawdza zapytanie POST pobierajace dane z NBP.

BDD tests Gherkin/Cucumber:

```bash
cd bdd-tests
mvn test
```

Scenariusze BDD:

- `Backend health endpoint confirms database connection` - potwierdza, ze backend dziala i ma polaczenie z baza.
- `User fetches and reads USD exchange rate for a selected day` - sprawdza zachowanie pobrania i odczytu kursu USD dla daty.
- `User cannot request range with invalid date order` - sprawdza walidacje blednego zakresu dat w API.
- `User cannot display PLN because it is the base currency` - sprawdza komunikat frontendu dla waluty PLN.
- `User cannot request range longer than NBP API limit` - sprawdza komunikat frontendu dla zakresu ponad 93 dni.

Testy BDD wymagaja dzialajacej aplikacji, dlatego przed nimi nalezy uruchomic:

```bash
docker compose up -d --build
```

Raport HTML Cucumbera generuje sie w:

```text
bdd-tests/reports/cucumber-report.html
```

## Uwagi

API NBP pozwala pobierac zakres maksymalnie 93 dni w jednym zapytaniu. Waluta PLN nie wystepuje w tabeli kursow NBP, poniewaz jest waluta bazowa.

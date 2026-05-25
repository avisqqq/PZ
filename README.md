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
./venv/bin/python -m pytest
```

Zakres testow backendu:

- `test_endpoint_zdrowia_zwraca_status_bazy_danych` - sprawdza endpoint `/health` i polaczenie z baza.
- `test_pobieranie_kursow_filtruje_po_dacie_i_walucie` - sprawdza filtrowanie kursow po dacie i walucie.
- `test_pobieranie_zakresu_kursow_filtruje_rekordy` - sprawdza pobieranie danych z zakresu dat.
- `test_pobieranie_kursow_uzywa_zamockowanego_serwisu_nbp` - sprawdza pobieranie danych z NBP dla jednej daty z mockiem.
- `test_pobieranie_zakresu_kursow_uzywa_zamockowanego_serwisu_nbp` - sprawdza pobieranie danych z NBP dla zakresu dat z mockiem.
- `test_sciezka_z_data_zwraca_kursy_walut` - sprawdza endpoint z data w sciezce URL.
- `test_zakres_zwraca_blad_dla_nieprawidlowej_kolejnosci_dat` - sprawdza blad dla niepoprawnego zakresu dat.

Frontend unit tests Jasmine/Karma:

```bash
cd frontend
npm test -- --watch=false
```

Zakres testow frontendu:

- `powinna utworzyc aplikacje` - sprawdza, czy glowny komponent Angular tworzy sie poprawnie.
- `powinna wyswietlic tytul strony` - sprawdza wyswietlenie tytulu aplikacji.
- `powinna zaladowac kursy po kliknieciu przycisku wyswietlania` - sprawdza logike przycisku wyswietlania danych.
- `nie powinna wywolywac backendu dla zakresu dluzszego niz 93 dni` - sprawdza walidacje limitu API NBP.
- `nie powinna wywolywac backendu dla PLN, bo jest waluta bazowa` - sprawdza blokade waluty PLN.
- `powinna wyczyscic tabele, gdy backend zwroci blad` - sprawdza czyszczenie tabeli po bledzie backendu.
- `powinien pobrac kursy z endpointu zakresu z filtrami` - sprawdza zapytanie GET do backendu z filtrami.
- `powinien wywolac endpoint pobierania zakresu` - sprawdza zapytanie POST pobierajace dane z NBP.

BDD tests Gherkin/Cucumber:

```bash
cd bdd-tests
mvn test
```

Scenariusze BDD:

- `Endpoint zdrowia backendu potwierdza polaczenie z baza danych` - potwierdza, ze backend dziala i ma polaczenie z baza.
- `Uzytkownik pobiera i odczytuje kurs USD dla wybranego dnia` - sprawdza zachowanie pobrania i odczytu kursu USD dla daty.
- `Uzytkownik nie moze pobrac zakresu z nieprawidlowa kolejnoscia dat` - sprawdza walidacje blednego zakresu dat w API.
- `Uzytkownik nie moze wyswietlic PLN, bo jest waluta bazowa` - sprawdza komunikat frontendu dla waluty PLN.
- `Uzytkownik nie moze pobrac zakresu dluzszego niz limit API NBP` - sprawdza komunikat frontendu dla zakresu ponad 93 dni.

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

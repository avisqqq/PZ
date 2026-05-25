Feature: API kursow walut
  Aplikacja powinna udostepniac kursy walut z lokalnej bazy danych i API NBP.

  Scenario: Endpoint zdrowia backendu potwierdza polaczenie z baza danych
    Given API backendu jest dostepne
    When sprawdzam stan backendu
    Then backend powinien zglosic status bazy danych "connected"

  Scenario: Uzytkownik pobiera i odczytuje kurs USD dla wybranego dnia
    Given API backendu jest dostepne
    When pobieram kursy walut dla daty "2026-05-25"
    And prosze o kursy walut dla daty "2026-05-25" i waluty "USD"
    Then odpowiedz powinna zawierac walute "USD"
    And kazdy zwrocony kurs powinien miec date "2026-05-25"

  Scenario: Uzytkownik nie moze pobrac zakresu z nieprawidlowa kolejnoscia dat
    Given API backendu jest dostepne
    When prosze o kursy walut od "2026-05-25" do "2026-05-01"
    Then status odpowiedzi powinien byc 400

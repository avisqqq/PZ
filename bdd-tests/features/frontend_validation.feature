Feature: Walidacja frontendu
  Frontend powinien blokowac nieprawidlowe zadania uzytkownika przed wywolaniem backendu.

  Scenario: Uzytkownik nie moze wyswietlic PLN, bo jest waluta bazowa
    Given aplikacja kursow walut jest otwarta
    When wpisuje zakres dat od "2026-05-25" do "2026-05-25"
    And wpisuje kod waluty "PLN"
    And klikam przycisk wyswietlania
    Then strona powinna pokazac komunikat "PLN jest waluta bazowa NBP"

  Scenario: Uzytkownik nie moze pobrac zakresu dluzszego niz limit API NBP
    Given aplikacja kursow walut jest otwarta
    When wpisuje zakres dat od "2026-01-01" do "2026-05-01"
    And wpisuje kod waluty "USD"
    And klikam przycisk wyswietlania
    Then strona powinna pokazac komunikat "API NBP pozwala pobrac maksymalnie 93 dni"

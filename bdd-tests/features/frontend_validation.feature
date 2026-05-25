Feature: Frontend validation
  The frontend should prevent invalid user requests before calling the backend.

  Scenario: User cannot display PLN because it is the base currency
    Given the currency application is open
    When I enter date range from "2026-05-25" to "2026-05-25"
    And I enter currency code "PLN"
    And I click the display button
    Then the page should show message "PLN jest waluta bazowa NBP"

  Scenario: User cannot request range longer than NBP API limit
    Given the currency application is open
    When I enter date range from "2026-01-01" to "2026-05-01"
    And I enter currency code "USD"
    And I click the display button
    Then the page should show message "API NBP pozwala pobrac maksymalnie 93 dni"


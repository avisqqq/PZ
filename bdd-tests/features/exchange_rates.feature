Feature: Exchange rates API
  The application should provide exchange rates from the local database and NBP API.

  Scenario: Backend health endpoint confirms database connection
    Given the backend API is available
    When I check the backend health
    Then the backend should report database status "connected"

  Scenario: User fetches and reads USD exchange rate for a selected day
    Given the backend API is available
    When I fetch exchange rates for date "2026-05-25"
    And I request exchange rates for date "2026-05-25" and currency "USD"
    Then the response should contain currency "USD"
    And every returned rate should have date "2026-05-25"

  Scenario: User cannot request range with invalid date order
    Given the backend API is available
    When I request exchange rates from "2026-05-25" to "2026-05-01"
    Then the response status should be 400


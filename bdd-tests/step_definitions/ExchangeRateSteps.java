package step_definitions;

import io.cucumber.java.en.Given;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;
import support.TestContext;

import java.util.List;

import static io.restassured.RestAssured.given;
import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.everyItem;
import static org.hamcrest.Matchers.greaterThan;
import static org.hamcrest.Matchers.hasItem;

public class ExchangeRateSteps {
    @Given("the backend API is available")
    public void backendApiIsAvailable() {
        given()
            .when()
            .get("/health")
            .then()
            .statusCode(200);
    }

    @When("I check the backend health")
    public void checkBackendHealth() {
        TestContext.setResponse(
            given()
                .when()
                .get("/health")
        );
    }

    @When("I fetch exchange rates for date {string}")
    public void fetchExchangeRatesForDate(String date) {
        TestContext.setResponse(
            given()
                .queryParam("date", date)
                .when()
                .post("/currencies/fetch")
        );
    }

    @When("I request exchange rates for date {string} and currency {string}")
    public void requestExchangeRatesForDateAndCurrency(String date, String currency) {
        TestContext.setResponse(
            given()
                .queryParam("date", date)
                .queryParam("currency_code", currency)
                .when()
                .get("/currencies")
        );
    }

    @When("I request exchange rates from {string} to {string}")
    public void requestExchangeRatesFromTo(String startDate, String endDate) {
        TestContext.setResponse(
            given()
                .queryParam("start_date", startDate)
                .queryParam("end_date", endDate)
                .when()
                .get("/currencies/range")
        );
    }

    @Then("the backend should report database status {string}")
    public void backendShouldReportDatabaseStatus(String databaseStatus) {
        TestContext.getResponse()
            .then()
            .statusCode(200)
            .body("database", equalTo(databaseStatus));
    }

    @Then("the response should contain currency {string}")
    public void responseShouldContainCurrency(String currency) {
        List<String> currencies = TestContext.getResponse().jsonPath().getList("currency_code");

        TestContext.getResponse().then().statusCode(200);
        assertThat(currencies.size(), greaterThan(0));
        assertThat(currencies, hasItem(currency));
    }

    @Then("every returned rate should have date {string}")
    public void everyReturnedRateShouldHaveDate(String date) {
        List<String> dates = TestContext.getResponse().jsonPath().getList("effective_date");

        assertThat(dates.size(), greaterThan(0));
        assertThat(dates, everyItem(equalTo(date)));
    }

    @Then("the response status should be {int}")
    public void responseStatusShouldBe(int statusCode) {
        TestContext.getResponse().then().statusCode(statusCode);
    }
}

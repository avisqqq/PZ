package step_definitions;

import io.cucumber.java.After;
import io.cucumber.java.en.Given;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;
import org.openqa.selenium.By;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.time.Duration;
import java.util.List;

public class FrontendSteps {
    private WebDriver driver;

    @Given("the currency application is open")
    public void currencyApplicationIsOpen() {
        ChromeOptions options = new ChromeOptions();
        options.addArguments("--headless=new");
        options.addArguments("--no-sandbox");
        options.addArguments("--disable-dev-shm-usage");
        options.addArguments("--window-size=1440,1000");

        driver = new ChromeDriver(options);
        driver.get(System.getProperty("frontend.url", "http://127.0.0.1:4200"));
    }

    @When("I enter date range from {string} to {string}")
    public void enterDateRange(String startDate, String endDate) {
        List<WebElement> dateInputs = driver.findElements(By.cssSelector("input[type='date']"));
        setInputValue(dateInputs.get(0), startDate);
        setInputValue(dateInputs.get(1), endDate);
    }

    @When("I enter currency code {string}")
    public void enterCurrencyCode(String currencyCode) {
        WebElement currencyInput = driver.findElement(By.cssSelector("input[maxlength='3']"));
        currencyInput.clear();
        currencyInput.sendKeys(currencyCode);
    }

    @When("I click the display button")
    public void clickDisplayButton() {
        driver.findElement(By.xpath("//button[contains(., 'Wyswietl')]")).click();
    }

    @Then("the page should show message {string}")
    public void pageShouldShowMessage(String message) {
        WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(5));
        wait.until(ExpectedConditions.textToBePresentInElementLocated(By.tagName("body"), message));
    }

    @After
    public void closeBrowser() {
        if (driver != null) {
            driver.quit();
        }
    }

    private void setInputValue(WebElement input, String value) {
        ((JavascriptExecutor) driver).executeScript(
            "arguments[0].value = arguments[1];" +
                "arguments[0].dispatchEvent(new Event('input', { bubbles: true }));" +
                "arguments[0].dispatchEvent(new Event('change', { bubbles: true }));",
            input,
            value
        );
    }
}


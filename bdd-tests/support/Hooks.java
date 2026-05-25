package support;

import io.cucumber.java.Before;
import io.restassured.RestAssured;

public class Hooks {
    @Before
    public void configureApiClient() {
        RestAssured.baseURI = System.getProperty("backend.url", "http://127.0.0.1:8000");
    }
}


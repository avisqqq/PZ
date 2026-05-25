package support;

import io.restassured.response.Response;

public class TestContext {
    private static Response response;

    public static Response getResponse() {
        return response;
    }

    public static void setResponse(Response response) {
        TestContext.response = response;
    }
}

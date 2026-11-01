package steps;

import io.cucumber.java.en.And;
import io.cucumber.java.en.Given;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;
import io.restassured.response.Response;

import static io.restassured.RestAssured.given;
import static org.junit.jupiter.api.Assertions.assertEquals;

public class ApiHealthSteps {
    private final String baseUrl = System.getProperty(
            "cepkontrol.api.base-url",
            "http://127.0.0.1:8000"
    );
    private Response response;

    @Given("CepKontrol AI API adresi hazır")
    public void apiAdresiHazir() {
        // The API base URL is provided by the test property or its local default.
    }

    @When("Kullanıcı API saglik kontrolü endpoint'ine GET isteği gönderir")
    public void saglikEndpointineGetIstegiGonderir() {
        response = given()
                .baseUri(baseUrl)
                .when()
                .get("/api/health");
    }

    @Then("API saglik kontrolü başarılı olmalı ve HTTP 200 döndürmeli")
    public void apiSaglikKontroluBasariliOlmaliVeHttp200Dondurmeli() {
        assertEquals(200, response.getStatusCode());
    }

    @And("API saglik durumu {string} olmalidir")
    public void apiSaglikDurumuOlmalidir(String expectedStatus) {
        String actualStatus = response.jsonPath().getString("durum");
        assertEquals(expectedStatus, actualStatus);
    }
}

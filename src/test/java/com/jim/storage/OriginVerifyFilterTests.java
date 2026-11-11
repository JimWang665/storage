package com.jim.storage;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest(properties = "app.origin-verify=test-secret")
@AutoConfigureMockMvc
class OriginVerifyFilterTests {

    @Autowired MockMvc mvc;

    @Test
    void apiRequestWithoutHeaderIsRejected() throws Exception {
        mvc.perform(get("/api/getAllItems")).andExpect(status().isForbidden());
    }

    @Test
    void apiRequestWithWrongHeaderIsRejected() throws Exception {
        mvc.perform(get("/api/getAllItems").header("X-Origin-Verify", "nope")).andExpect(status().isForbidden());
    }

    @Test
    void apiRequestWithCorrectHeaderIsAllowed() throws Exception {
        mvc.perform(get("/api/getAllItems").header("X-Origin-Verify", "test-secret")).andExpect(status().isOk());
    }

    @Test
    void healthCheckNeedsNoHeader() throws Exception {
        mvc.perform(get("/actuator/health")).andExpect(status().isOk());
    }
}

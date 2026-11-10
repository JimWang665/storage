package com.jim.storage;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

/** The public demo deployment sets DELETE_ALL_ENABLED=false so visitors cannot wipe the database. */
@SpringBootTest(properties = "app.delete-all-enabled=false")
@AutoConfigureMockMvc
class DeleteAllDisabledTests {

    @Autowired MockMvc mvc;

    @Test
    void deleteAllIsForbiddenWhenDisabled() throws Exception {
        mvc.perform(delete("/api/deleteAll")).andExpect(status().isForbidden());
    }
}

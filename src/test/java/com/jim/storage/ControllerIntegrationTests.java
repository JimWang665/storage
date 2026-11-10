package com.jim.storage;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
class ControllerIntegrationTests {

    @Autowired MockMvc mvc;
    @Autowired ItemRepository repo;

    @BeforeEach
    void clean() { repo.deleteAll(); }

    private void add(String customer, String origin, String destination) throws Exception {
        mvc.perform(post("/api/addItem")
                .param("customerName", customer).param("origin", origin).param("destination", destination))
            .andExpect(status().isOk());
    }

    @Test
    void addThenGetAllReturnsItem() throws Exception {
        mvc.perform(post("/api/addItem")
                .param("customerName", "Acme").param("origin", "NYC").param("destination", "LAX"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.customerName").value("Acme"))
            .andExpect(jsonPath("$.status").value("NEW"))
            .andExpect(jsonPath("$.abnormality").value(false));

        mvc.perform(get("/api/getAllItems"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.length()").value(1));
    }

    @Test
    void addWithBlankFieldIsRejected() throws Exception {
        mvc.perform(post("/api/addItem")
                .param("customerName", "   ").param("origin", "NYC").param("destination", "LAX"))
            .andExpect(status().isBadRequest());
        mvc.perform(get("/api/getAllItems")).andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void addWithTooLongFieldIsRejected() throws Exception {
        mvc.perform(post("/api/addItem")
                .param("customerName", "x".repeat(256)).param("origin", "NYC").param("destination", "LAX"))
            .andExpect(status().isBadRequest());
    }

    @Test
    void searchReturnsMatchesCaseInsensitively() throws Exception {
        add("Acme Corp", "NYC", "LAX");
        add("Globex", "Boston", "Miami");

        mvc.perform(get("/api/searchItem").param("customerName", "acme"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.length()").value(1))
            .andExpect(jsonPath("$[0].customerName").value("Acme Corp"));

        // "Acme Corp" must NOT be found by a longer query (no reverse containment).
        add("Acme", "NYC", "LAX");
        mvc.perform(get("/api/searchItem").param("customerName", "Acme Corp Inc"))
            .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void searchWithNoFiltersReturnsEverythingAndWithBlankParamsToo() throws Exception {
        add("A", "x", "y");
        add("B", "x", "y");
        mvc.perform(get("/api/searchItem")).andExpect(jsonPath("$.length()").value(2));
        mvc.perform(get("/api/searchItem").param("id", "").param("status", "").param("abnormality", ""))
            .andExpect(jsonPath("$.length()").value(2));
    }

    @Test
    void searchByStatusAndAbnormality() throws Exception {
        add("A", "x", "y");
        mvc.perform(get("/api/searchItem").param("status", "NEW").param("abnormality", "false"))
            .andExpect(jsonPath("$.length()").value(1));
        mvc.perform(get("/api/searchItem").param("status", "CATEGORIZED"))
            .andExpect(jsonPath("$.length()").value(0));
        mvc.perform(get("/api/searchItem").param("abnormality", "true"))
            .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void searchWithBadInputReturns400NotServerError() throws Exception {
        mvc.perform(get("/api/searchItem").param("id", "abc")).andExpect(status().isBadRequest());
        mvc.perform(get("/api/searchItem").param("status", "bogus")).andExpect(status().isBadRequest());
        mvc.perform(get("/api/searchItem").param("abnormality", "maybe")).andExpect(status().isBadRequest());
    }

    @Test
    void editChangesFieldsAndRejectsBlank() throws Exception {
        add("Acme", "NYC", "LAX");
        Long id = repo.findAll().get(0).getId();

        mvc.perform(patch("/api/setItem").param("id", id.toString()).param("status", "CATEGORIZED")
                .param("abnormality", "true").param("customerName", "Acme2")
                .param("origin", "SFO").param("destination", "SEA"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("CATEGORIZED"))
            .andExpect(jsonPath("$.abnormality").value(true))
            .andExpect(jsonPath("$.customerName").value("Acme2"));

        mvc.perform(patch("/api/setItem").param("id", id.toString()).param("status", "NEW")
                .param("abnormality", "false").param("customerName", "")
                .param("origin", "SFO").param("destination", "SEA"))
            .andExpect(status().isBadRequest());
    }

    @Test
    void deleteByIdRemovesItemAndMissingIs404() throws Exception {
        add("Acme", "NYC", "LAX");
        Long id = repo.findAll().get(0).getId();

        mvc.perform(delete("/api/deleteItemById").param("id", id.toString())).andExpect(status().isOk());
        mvc.perform(get("/api/getAllItems")).andExpect(jsonPath("$.length()").value(0));
        mvc.perform(delete("/api/deleteItemById").param("id", "999999")).andExpect(status().isNotFound());
    }

    @Test
    void deleteAllEmptiesTable() throws Exception {
        add("A", "x", "y");
        add("B", "x", "y");
        mvc.perform(delete("/api/deleteAll")).andExpect(status().isOk());
        mvc.perform(get("/api/getAllItems")).andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void removedBrokenEndpointIsGone() throws Exception {
        mvc.perform(delete("/api/deleteItem").param("item", "1")).andExpect(status().is4xxClientError());
    }

    @Test
    void healthEndpointIsUp() throws Exception {
        mvc.perform(get("/actuator/health"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("UP"));
    }
}

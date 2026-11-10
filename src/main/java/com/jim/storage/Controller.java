package com.jim.storage;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api")
public class Controller {
    private static final int MAX_LENGTH = 255;

    private final ItemRepository itemRepository;
    private final boolean deleteAllEnabled;

    public Controller(ItemRepository itemRepository,
                      @Value("${app.delete-all-enabled:true}") boolean deleteAllEnabled) {
        this.itemRepository = itemRepository;
        this.deleteAllEnabled = deleteAllEnabled;
    }

    @GetMapping("/getItemById")
    public Item getItemById(@RequestParam Long id){
        return findOrThrow(id);
    }

    @GetMapping("/getAllItems")
    public List<Item> getAllItems(){
        return itemRepository.findAll().stream()
                .sorted(Comparator.comparing(Item::getId))
                .toList();
    }

    @PatchMapping("/setItem")
    public Item setItem(@RequestParam String status, @RequestParam Boolean abnormality,
            @RequestParam String customerName, @RequestParam String origin,
            @RequestParam String destination, @RequestParam Long id){
        Item item = findOrThrow(id);
        item.setStatus(Status.toStatus(status));
        item.setAbnormality(abnormality);
        item.setCustomerName(requireText(customerName, "Customer name"));
        item.setOrigin(requireText(origin, "Origin"));
        item.setDestination(requireText(destination, "Destination"));
        return itemRepository.save(item);
    }

    /**
     * Returns the items that MATCH every non-blank filter. Text filters are case-insensitive "contains".
     * All parameters are optional; a blank parameter means "don't filter on this field".
     */
    @GetMapping("/searchItem")
    public List<Item> searchItem(
            @RequestParam(defaultValue = "") String id,
            @RequestParam(defaultValue = "") String status,
            @RequestParam(defaultValue = "") String abnormality,
            @RequestParam(defaultValue = "") String customerName,
            @RequestParam(defaultValue = "") String origin,
            @RequestParam(defaultValue = "") String destination){
        Long idFilter = id.isBlank() ? null : parseId(id);
        Status statusFilter = status.isBlank() ? null : Status.toStatus(status);
        Boolean abnormalityFilter = abnormality.isBlank() ? null : parseBoolean(abnormality);

        return itemRepository.findAll().stream()
                .filter(item -> idFilter == null || idFilter.equals(item.getId()))
                .filter(item -> statusFilter == null || statusFilter == item.getStatus())
                .filter(item -> abnormalityFilter == null || abnormalityFilter.equals(item.getAbnormality()))
                .filter(item -> containsIgnoreCase(item.getCustomerName(), customerName))
                .filter(item -> containsIgnoreCase(item.getOrigin(), origin))
                .filter(item -> containsIgnoreCase(item.getDestination(), destination))
                .sorted(Comparator.comparing(Item::getId))
                .toList();
    }

    @PostMapping("/addItem")
    public Item addItem(@RequestParam String customerName, @RequestParam String origin, @RequestParam String destination){
        Item item = new Item(
                requireText(customerName, "Customer name"),
                requireText(origin, "Origin"),
                requireText(destination, "Destination"));
        return itemRepository.save(item);
    }

    @DeleteMapping("/deleteItemById")
    public Item deleteItemById(@RequestParam Long id){
        Item item = findOrThrow(id);
        itemRepository.delete(item);
        return item;
    }

    @DeleteMapping("/deleteAll")
    public void deleteAll(){
        if (!deleteAllEnabled) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Delete All is disabled on this deployment");
        }
        itemRepository.deleteAll();
    }

    /** Bad input (unknown status, non-numeric id, ...) becomes HTTP 400 instead of a 500 error. */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleBadInput(IllegalArgumentException e){
        String message = e.getMessage() == null ? "Bad request" : e.getMessage();
        return ResponseEntity.badRequest().body(Map.of("error", message));
    }

    private Item findOrThrow(Long id){
        return itemRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Item Not Found!"));
    }

    private static String requireText(String value, String field){
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(field + " cannot be empty");
        }
        String trimmed = value.trim();
        if (trimmed.length() > MAX_LENGTH) {
            throw new IllegalArgumentException(field + " must be at most " + MAX_LENGTH + " characters");
        }
        return trimmed;
    }

    private static Long parseId(String id){
        try {
            return Long.parseLong(id.trim());
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("ID must be a number");
        }
    }

    private static Boolean parseBoolean(String value){
        String v = value.trim().toLowerCase();
        if (v.equals("true")) { return Boolean.TRUE; }
        if (v.equals("false")) { return Boolean.FALSE; }
        throw new IllegalArgumentException("Abnormality must be true or false");
    }

    private static boolean containsIgnoreCase(String field, String query){
        if (query.isBlank()) { return true; }
        return field != null && field.toLowerCase().contains(query.trim().toLowerCase());
    }

}

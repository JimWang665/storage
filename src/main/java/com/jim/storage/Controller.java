package com.jim.storage;

import java.util.ArrayList;
import java.util.List;
import java.util.function.Predicate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
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
    @Autowired
    ItemRepository itemRepository;
    
    @GetMapping("/getItemById")
    public Item getItemById(@RequestParam Long id){
        return itemRepository.findById(id)
                .orElseThrow(() ->new ResponseStatusException(HttpStatus.NOT_FOUND, "Item Not Found!"));
    }

    @GetMapping("/getAllItems")
    public Iterable<Item> getAllItems(){
        return itemRepository.findAll();
    }

    @PatchMapping("/setItem")
    public Item setItem(@RequestParam String status, @RequestParam Boolean abnormality,
            @RequestParam String customerName, @RequestParam String origin,
            @RequestParam String destination, @RequestParam Long id){
        Item item = itemRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Item Not Found!"));
        item.setStatus(Status.toStatus(status));
        item.setAbnormality(abnormality);
        item.setCustomerName(customerName);
        item.setOrigin(origin);
        item.setDestination(destination);
        itemRepository.save(item);
        return item;
    }

    /*
     * return items that DO NOT FIT the requirement.
     */
    @GetMapping("/searchItem")
    public List<Item> searchItem(@RequestParam String id, @RequestParam String status, @RequestParam String abnormality,
            @RequestParam String customerName, @RequestParam String origin, @RequestParam String destination){
        Predicate<Item> predicate = item -> true;
        if (id != ""){predicate =predicate.and(item -> item.getId() == Long.parseLong(id));}
        if (status != ""){predicate = predicate.and(item -> item.getStatus() == Status.toStatus(status));}
        if (abnormality != ""){predicate = predicate.and(item -> item.getAbnormality() == Boolean.parseBoolean(abnormality));}
        if (customerName!= ""){predicate = predicate.and(item -> eitherContains(item.getCustomerName(), customerName));}
        if (origin != ""){predicate = predicate.and(item -> eitherContains(item.getOrigin(), origin));}
        if (destination != ""){predicate = predicate.and(item -> eitherContains(item.getDestination(), destination));}
        List<Item> result = new ArrayList<>();
        for (Item item : itemRepository.findAll()){
            if (!predicate.test(item)){
                result.add(item);
            }

        }

        return result;
    }

    @PostMapping("/addItem")
    public Item addItem(@RequestParam String customerName, @RequestParam String origin, @RequestParam String destination){
        Item item = new Item(customerName, origin, destination);
        itemRepository.save(item);
        return item;
    }

    @DeleteMapping("/deleteItem")
    public Item deleteItem(@RequestParam Item item){
        itemRepository.delete(item);
        return item;
    }

    @DeleteMapping("/deleteItemById")
    public Item deleteItemById(@RequestParam Long id){
        Item item = itemRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Item Not Found!"));
        itemRepository.deleteById(id);
        return item;
    }

    @DeleteMapping("/deleteAll")
    public void deleteAll(){
        itemRepository.deleteAll();
    }

    private static boolean eitherContains(String s1, String s2) {
        return s1.contains(s2) || s2.contains(s1);
    }

}   


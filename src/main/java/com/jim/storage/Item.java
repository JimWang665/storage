package com.jim.storage;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Table(name = "item")
@Entity
public class Item {
    @Id
    @Getter
    @GeneratedValue(strategy = GenerationType.IDENTITY) // MySQL AUTO_INCREMENT: no gaps, no sequence table
    private Long id;

    // Stored as text ("NEW", "CATEGORIZED", ...) so reordering the enum never corrupts old rows.
    @Getter
    @Setter
    @Enumerated(EnumType.STRING)
    private Status status;

    @Getter
    @Setter
    private Boolean abnormality;

    @Getter
    @Setter
    private String customerName;

    @Getter
    @Setter
    private String origin;

    @Getter
    @Setter
    private String destination;

    public Item() {
    }

    public Item(String customerName, String origin, String destination){
        this.status = Status.NEW;
        this.abnormality = Boolean.FALSE;
        this.customerName = customerName;
        this.origin = origin;
        this.destination = destination;
    }
}

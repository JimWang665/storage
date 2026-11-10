package com.jim.storage;

public enum Status {
    NEW, CATEGORIZED, IMPORT_DECLARED, EXPORT_DECLARED;

    /** Parses a status name (case-insensitive). Throws IllegalArgumentException, which the API maps to HTTP 400. */
    public static Status toStatus(String string) {
        if (string == null) {
            throw new IllegalArgumentException("Status is required");
        }
        switch (string.trim().toLowerCase()) {
            case "new":
                return Status.NEW;
            case "categorized":
                return Status.CATEGORIZED;
            case "import_declared":
                return Status.IMPORT_DECLARED;
            case "export_declared":
                return Status.EXPORT_DECLARED;
            default:
                throw new IllegalArgumentException("Unknown status: " + string);
        }
    }

}

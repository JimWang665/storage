package com.jim.storage;

public enum Status {
    NEW, CATEGORIZED, IMPORT_DECLARED, EXPORT_DECLARED;

    public static Status toStatus(String string) {
        switch (string.toLowerCase()) {
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

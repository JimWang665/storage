document.addEventListener("DOMContentLoaded", function () {
    // ---------------------------------------------------------------------------------
    // Element references: looked up once, here, so every helper below can see them.
    // ---------------------------------------------------------------------------------
    const $ = (id) => document.getElementById(id);

    // search bar & add bar inputs
    const idInput = $("idInput");
    const statusInput = $("statusInput");
    const abnormalityInput = $("abnormalityInput");
    const customerNameInput = $("customerNameInput");
    const originInput = $("originInput");
    const destinationInput = $("destinationInput");

    // global action buttons
    const searchButton = $("searchButton");
    const clearButton = $("clearButton");
    const addButton = $("addButton");
    const deleteButton = $("deleteButton");
    const deleteAlertCheckbox = $("deleteAlertCheckbox");
    const deleteAlertButton = $("deleteAlertButton");
    const editAlertCheckbox = $("editAlertCheckbox");
    const editAlertButton = $("editAlertButton");

    // table body (data rows only: the header row lives in <thead> and is never touched)
    const itemBody = $("itemBody");

    // edit modal
    const statusEditInput = $("statusEditInput");
    const abnormalityEditInput = $("abnormalityEditInput");
    const customerNameEditInput = $("customerNameEditInput");
    const originEditInput = $("originEditInput");
    const destinationEditInput = $("destinationEditInput");
    const saveEditButton = $("saveEditButton");
    const editModalCloseButton = $("editModalCloseButton");

    const errorBanner = $("errorBanner");

    const state = {
        itemInEdit: null
    };
    let errorTimer = null;

    // ---------------------------------------------------------------------------------
    // Networking helpers
    // ---------------------------------------------------------------------------------

    function showError(message) {
        errorBanner.textContent = message;
        errorBanner.classList.remove("d-none");
        clearTimeout(errorTimer);
        errorTimer = setTimeout(() => errorBanner.classList.add("d-none"), 8000);
    }

    /**
     * fetch() wrapper: returns the parsed JSON body (or null for an empty body) and THROWS an Error
     * with a readable message when the server answers with a non-2xx status. Callers use try/catch,
     * so a failed request can never leave the screen out of sync with the database.
     */
    async function api(url, options) {
        const response = await fetch(url, options);
        const text = await response.text();
        let body = null;
        if (text) {
            try { body = JSON.parse(text); } catch (e) { body = null; }
        }
        if (!response.ok) {
            const message = (body && (body.error || body.message)) || `Request failed with status ${response.status}`;
            throw new Error(message);
        }
        return body;
    }

    // ---------------------------------------------------------------------------------
    // Search / clear
    // ---------------------------------------------------------------------------------

    searchButton.addEventListener("click", async () => {
        try {
            const params = new URLSearchParams({
                id: idInput.value,
                status: statusInput.value,
                abnormality: abnormalityInput.value,
                customerName: customerNameInput.value,
                origin: originInput.value,
                destination: destinationInput.value
            });
            // The server returns the items that MATCH; every other row gets hidden.
            const matches = await api(`/api/searchItem?${params}`);
            const matchIds = new Set(matches.map((item) => item.id));
            for (const row of itemBody.rows) {
                row.classList.toggle("minimized", !matchIds.has(Number(row.dataset.id)));
            }
        } catch (e) {
            showError(`Search failed: ${e.message}`);
        }
    });

    clearButton.addEventListener("click", () => {
        clearAllInputs();
        unminimizeAll();
    });

    // ---------------------------------------------------------------------------------
    // Add
    // ---------------------------------------------------------------------------------

    addButton.addEventListener("click", async () => {
        // input filters
        if (idInput.value !== "") {
            alert("Do not enter an ID for creating new item: ID is self generated!");
            return;
        }
        if (statusInput.value !== "") {
            alert("Do not enter a status for creating new item: status is NEW by default!");
            return;
        }
        if (abnormalityInput.value !== "") {
            alert("Do not enter an abnormality for creating new item: abnormality is false by default!");
            return;
        }
        if (customerNameInput.value.trim() === "" || originInput.value.trim() === "" || destinationInput.value.trim() === "") {
            alert("Customer name, origin, and destination cannot be empty when creating new item!");
            return;
        }
        try {
            const params = new URLSearchParams({
                customerName: customerNameInput.value,
                origin: originInput.value,
                destination: destinationInput.value
            });
            const itemAdded = await api(`/api/addItem?${params}`, { method: "POST" });
            appendRow(itemAdded);
            clearAllInputs();
        } catch (e) {
            showError(`Could not add the item: ${e.message}`);
        }
    });

    // ---------------------------------------------------------------------------------
    // Edit (save button inside the modal)
    // ---------------------------------------------------------------------------------

    saveEditButton.addEventListener("click", async () => {
        if (!state.itemInEdit) {
            showError("No item is being edited. Close this window and click Edit again.");
            return;
        }
        if (customerNameEditInput.value.trim() === "" || originEditInput.value.trim() === "" || destinationEditInput.value.trim() === "") {
            alert("Customer name, origin, and destination cannot be empty!");
            return;
        }
        if (!editAlertCheckbox.checked) {
            const confirmation = confirm("Are you sure you want to save the edit? Past data would be" +
                " replaced and would be lost forever.");
            if (!confirmation) { return; }
        }
        try {
            const params = new URLSearchParams({
                status: statusEditInput.value,
                abnormality: (abnormalityEditInput.value === "true"),
                customerName: customerNameEditInput.value,
                origin: originEditInput.value,
                destination: destinationEditInput.value,
                id: state.itemInEdit.id
            });
            const updated = await api(`/api/setItem?${params}`, { method: "PATCH" });
            const row = itemBody.querySelector(`tr[data-id="${updated.id}"]`);
            if (row) { fillRow(row, updated); }
            state.itemInEdit = null;
            clearAllEditInputs();
            editModalCloseButton.click();
        } catch (e) {
            showError(`Could not save the edit: ${e.message}`);
        }
    });

    // ---------------------------------------------------------------------------------
    // Delete all
    // ---------------------------------------------------------------------------------

    deleteButton.addEventListener("click", async () => {
        const confirmation = confirm("Are you sure you want to delete all "
            + "items from the storage? This action is extremely dangerous and "
            + "could not be withdrawn!");
        if (!confirmation) { return; }
        const confirmTwice = confirm("Are you sure you want to delete everything?");
        if (!confirmTwice) { return; }
        try {
            await api("/api/deleteAll", { method: "DELETE" });
            itemBody.replaceChildren(); // removes data rows only; the header stays
        } catch (e) {
            showError(`Could not delete everything: ${e.message}`);
        }
    });

    // ---------------------------------------------------------------------------------
    // The "without alert" toggle buttons
    // ---------------------------------------------------------------------------------

    deleteAlertButton.addEventListener("click", () => {
        deleteAlertCheckbox.checked = !deleteAlertCheckbox.checked;
    });
    deleteAlertCheckbox.addEventListener("click", (event) => event.stopPropagation());

    editAlertButton.addEventListener("click", () => {
        editAlertCheckbox.checked = !editAlertCheckbox.checked;
    });
    editAlertCheckbox.addEventListener("click", (event) => event.stopPropagation());

    // ---------------------------------------------------------------------------------
    // Table rows
    // ---------------------------------------------------------------------------------

    function statusNormalize(string) {
        return string
            .toLowerCase()
            .replace(/_/g, " ")
            .split(" ")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");
    }

    /** Writes an item's values into the first six cells of its row (textContent only: no HTML injection). */
    function fillRow(row, item) {
        row.cells[0].textContent = String(item.id);
        row.cells[1].textContent = statusNormalize(item.status);
        row.cells[2].textContent = String(item.abnormality);
        row.cells[3].textContent = item.customerName;
        row.cells[4].textContent = item.origin;
        row.cells[5].textContent = item.destination;
    }

    function makeButton(label, className) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = className;
        button.textContent = label;
        return button;
    }

    function appendRow(item) {
        const row = document.createElement("tr");
        row.id = `row${item.id}`;
        row.dataset.id = String(item.id);
        for (let i = 0; i < 6; i++) { row.insertCell(); }
        fillRow(row, item);

        const actionCell = row.insertCell();
        const editButton = makeButton("Edit", "editButtonRow");
        // Bootstrap opens the modal through these attributes.
        editButton.setAttribute("data-bs-toggle", "modal");
        editButton.setAttribute("data-bs-target", "#editModal");
        const removeButton = makeButton("Delete", "deleteButtonRow");
        actionCell.append(editButton, " ", removeButton);

        editButton.addEventListener("click", () => openEditor(item.id));
        removeButton.addEventListener("click", () => deleteRow(row, item.id));

        itemBody.appendChild(row);
    }

    async function openEditor(id) {
        try {
            // Fetch the item again so the modal shows what is stored now, not a stale copy.
            const data = await api(`/api/getItemById?id=${id}`);
            state.itemInEdit = data;
            statusEditInput.value = data.status;
            abnormalityEditInput.value = String(data.abnormality);
            customerNameEditInput.value = data.customerName;
            originEditInput.value = data.origin;
            destinationEditInput.value = data.destination;
        } catch (e) {
            state.itemInEdit = null;
            showError(`Could not load the item: ${e.message}`);
        }
    }

    async function deleteRow(row, id) {
        if (!deleteAlertCheckbox.checked) {
            const confirmation = confirm("Are you sure you want to delete this item? This action cannot be recalled.");
            if (!confirmation) { return; }
        }
        try {
            await api(`/api/deleteItemById?${new URLSearchParams({ id })}`, { method: "DELETE" });
            row.remove(); // only after the server confirmed the delete
        } catch (e) {
            showError(`Could not delete the item: ${e.message}`);
        }
    }

    // ---------------------------------------------------------------------------------
    // Small helpers
    // ---------------------------------------------------------------------------------

    function clearAllInputs() {
        idInput.value = "";
        statusInput.value = "";
        abnormalityInput.value = "";
        customerNameInput.value = "";
        originInput.value = "";
        destinationInput.value = "";
    }

    function clearAllEditInputs() {
        statusEditInput.value = "NEW";
        abnormalityEditInput.value = "false";
        customerNameEditInput.value = "";
        originEditInput.value = "";
        destinationEditInput.value = "";
    }

    function unminimizeAll() {
        for (const row of itemBody.rows) {
            row.classList.remove("minimized");
        }
    }

    // ---------------------------------------------------------------------------------
    // Initial load
    // ---------------------------------------------------------------------------------

    async function loadItems() {
        try {
            const items = await api("/api/getAllItems");
            for (const item of items) { appendRow(item); }
        } catch (e) {
            showError(`Could not load items: ${e.message}`);
        }
    }

    loadItems();
});

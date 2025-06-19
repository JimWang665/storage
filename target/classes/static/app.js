document.addEventListener("DOMContentLoaded", async function(){
    const state = {
        itemInEdit: null
    }
    window.onload = async function(){

        loadItems();

        // search bar&add bar inputs
        const idInput = document.getElementById("idInput");
        const statusInput = document.getElementById("statusInput");
        const abnormalityInput = document.getElementById("abnormalityInput");
        const customerNameInput = document.getElementById("customerNameInput");
        const originInput = document.getElementById("originInput");
        const destinationInput = document.getElementById("destinationInput");

        // global action buttons
        const searchButton = document.getElementById("searchButton");
        const clearButton = document.getElementById("clearButton");
        const addButton = document.getElementById("addButton");
        const deleteButton = document.getElementById("deleteButton");
        const deleteAlertCheckbox = document.getElementById("deleteAlertCheckbox");
        const deleteAlertButton = document.getElementById("deleteAlertButton");
        const editAlertCheckbox = document.getElementById("editAlertCheckbox");
        const editAlertButton = document.getElementById("editAlertButton");

        // table
        const itemTable = document.getElementById("itemTable");

        // modals
        const editModal = document.getElementById("editModal");

        const statusEditInput = document.getElementById("statusEditInput");
        const abnormalityEditInput = document.getElementById("abnormalityEditInput");
        const customerNameEditInput = document.getElementById("customerNameEditInput");
        const originEditInput = document.getElementById("originEditInput");
        const destinationEditInput = document.getElementById("destinationEditInput");

        const saveEditButton = document.getElementById("saveEditButton");

        // search button
        searchButton.addEventListener("click", async () => {
            unminimizeAll();
            const params = new URLSearchParams({
                id: idInput.value,
                status: statusInput.value,
                abnormality: abnormalityInput.value,
                customerName: customerNameInput.value,
                origin: originInput.value,
                destination: destinationInput.value
            });
            const response = await fetch(`/api/searchItem?${params}`);
            
            if (!response.ok){console.error(`Request failed with status: ${response.status}`);}


            const items = await response.json();

            for (const item of items){
                const row = document.getElementById(`row${item.id}`).classList.add("minimized");
                console.log("Searching item: " + item);
            }
            console.log("Count of items filtered out: " + items.length);
            console.log("Finished searching!");
        });

        // clear button
        clearButton.addEventListener("click", async function(){
            clearAllInputs();
            unminimizeAll();
            console.log("Cleared!")
        });

        // add button
        addButton.addEventListener("click", async function(){
            // input filters
            if (idInput.value != ""){
                alert("Do not enter an ID for creating new item: ID is self generated!");
                return;
            }
            if (statusInput.value != ""){
                alert("Do not enter a status for creating new item: status is NEW by default!");
                return;
            }
            if (abnormalityInput.value != ""){
                alert("Do not enter an abnormality for creating new item: abnormality is false by default!");
            }
            if (customerNameInput.value.trim() === "" || originInput.value.trim() === "" || destinationInput.value.trim() === ""){
                alert("Customer name, origin, and destination cannot be empty when creating new item!");
                return;
            }
            // creating row
            let itemAdded = null;
            const row = document.createElement("tr");
            const params = new URLSearchParams({
                customerName: customerNameInput.value,
                origin: originInput.value,
                destination: destinationInput.value
            });
            const response = await fetch(`/api/addItem?${params}`, {
                method: "POST"
            });
            if (!response.ok){console.error(`Request failed with status: ${response.status}`);}

            // this item is the item object added
            itemAdded = await response.json();
            // now front end: add the tr element
            rowCreationHelper(itemAdded);

            // clear in the end
            clearAllInputs();
            console.log("Item with id: " + itemAdded.id + " has been added!");
        });

        // save button in edit modal
        saveEditButton.addEventListener("click", async function(){
            if (!editAlertCheckbox.checked){
                const confirmation = confirm("Are you sure you want to save the edit? Past data would be" + 
                    " replaced and would be lost forever.")
                if (!confirmation){return;}
            }

            if (!state.itemInEdit){console.error("item in edit is NULL!")}

            const params = new URLSearchParams({
                status: statusEditInput.value, 
                abnormality: (abnormalityEditInput.value === 'true'), 
                customerName: customerNameEditInput.value,
                origin: originEditInput.value,
                destination: destinationEditInput.value,
                id: state.itemInEdit.id
            });


            const response = await fetch(`/api/setItem?${params}`, {
                method: "PATCH"
            });
            if (!response.ok){console.error(`Request failed with status: ${response.status}`);}
            const data = await response.json();
            state.itemInEdit = data;
            const i = state.itemInEdit;
            // change in table
            const row = document.getElementById(`row${data.id}`);
            const cells = row.cells;

            cells[1].textContent = statusNormalize(i.status); 
            cells[2].textContent = i.abnormality.toString();
            cells[3].textContent = i.customerName;
            cells[4].textContent = i.origin;
            cells[5].textContent = i.destination;


            // finally clear
            clearAllEditInputs();
            // close the editing modal
            document.getElementById("modalCloseButton").click();
        });

        deleteButton.addEventListener("click", async function(){
            // confirm
            const confirmation = confirm("Are you sure you want to delete all "
                + "items from the storage? This action is extremely dangerous and "
                + "could not be withdrawn!");
            if (!confirmation){return;}
            const confirmTwice = confirm("Are you sure you want to delete everything?");
            if (!confirmTwice){return;}
            const response = await fetch("/api/deleteAll",{
                method: "DELETE"
            });
            if (!response.ok){console.error(`Request failed with status: ${response.status}`);}
            
            for (const row of document.querySelectorAll("tr")){
                row.remove();
            }
            console.log("Everything is deleted!")
        })

        /// the final four buttons
        deleteAlertButton.addEventListener("click", function () {
            deleteAlertCheckbox.checked = !deleteAlertCheckbox.checked;
        });

        deleteAlertCheckbox.addEventListener("click", function(event){
            event.stopPropagation();
        });

        editAlertButton.addEventListener("click", function(){
            editAlertCheckbox.checked = !editAlertCheckbox.checked;
        });
        
        editAlertCheckbox.addEventListener("click", function(event){
            event.stopPropagation();
        });
        /// the final four buttons

        // this helper reloads all items at login. it's within the windows.onload cuz it 
        // has to access all variables.

        async function loadItems(){
            const response = await fetch("/api/getAllItems");
            if (!response.ok){console.error(`Request failed with status: ${response.status}`);}
            const data = await response.json();
            for (const item of data){
                rowCreationHelper(item);
                console.log("Reloaded row with ID " + item.id);
            }
            console.log("Reload finished!");
            // last catchups: just load the information guide.
            document.getElementById("guideText").innerHTML = `
                <h5>Adding Items</h5>
                <p>
                    To add an item, fill in the following input boxes: <strong>Customer Name</strong>, 
                    <strong>Origin</strong>, and <strong>Destination</strong>. Do not enter or select 
                    anything in the other three input boxes, as they are auto-generated. Then click the 
                    <strong>'Add Item'</strong> button.
                </p>

                <h5>Searching</h5>
                <p>
                    To search for items, enter your criteria into any or all input boxes and click 
                    the <strong>'Search'</strong> button. Leaving a field empty means the system won't filter 
                    based on that attribute.
                </p>

                <h5>Clearing Inputs</h5>
                <p>
                    Click the <strong>'Clear All'</strong> button to reset all inputs and remove search filters.
                </p>

                <h5>Managing Items</h5>
                <p>
                    Each item in the table comes with three actions:
                </p>
                <ul>
                    <li><strong>Edit</strong>: Click to open a pop-up window. Make changes and click <strong>'Save'</strong>.</li>
                    <li><strong>Delete</strong>: Click to permanently remove the item.</li>
                </ul>
            `;

            console.log("Guide text prepared!");
        }
    }

    /******************************************************************************************/
    // helpers
    function clearAllInputs(){
        idInput.value = "";
        statusInput.value = "";
        abnormalityInput.value = "";
        customerNameInput.value = "";
        originInput.value = "";
        destinationInput.value = "";
    }

    function clearAllEditInputs(){
        statusEditInput.value = "NEW";
        abnormalityEditInput.value = "false";
        customerNameEditInput.value = "";
        originEditInput.value = "";
        destinationEditInput.value = "";
    }
    
    function unminimizeAll(){
        const rows = document.querySelectorAll("tr");
        console.log(`Resetting ${rows.length} rows...`)
        for (const row of rows){
            row.classList.remove("minimized");
        }
    }

    function statusNormalize(string) {
        return string
            .toLowerCase() // Make the whole string lowercase
            .replace(/_/g, ' ') // Replace all underscores with spaces
            .split(' ') // Split into words
            .map(word => word.charAt(0).toUpperCase() + word.slice(1)) // Capitalize first letter of each word
            .join(' '); // Rejoin into a single string
    }


    async function rowCreationHelper(itemAdded){
        const row = document.createElement("tr");
        row.id = `row${itemAdded.id}`;
        // row.item = itemAdded;

        const cellId = row.insertCell();
        cellId.textContent = itemAdded.id.toString();

        const cellStatus = row.insertCell();
        cellStatus.textContent = statusNormalize(itemAdded.status);
        
        const cellAbnormality = row.insertCell();
        cellAbnormality.textContent = itemAdded.abnormality.toString();

        const cellCustomerName = row.insertCell();
        cellCustomerName.textContent = itemAdded.customerName;

        const cellOrigin = row.insertCell();
        cellOrigin.textContent = itemAdded.origin;

        const cellDestination = row.insertCell();
        cellDestination.textContent = itemAdded.destination;

        const cellAction = row.insertCell();
        // user a helper here so that I can wait for the initialization to finish
        await cellActionHelper(cellAction, itemAdded);

        // append
        itemTable.appendChild(row);
        // this helper adds action listeners to the action buttons
        actionButtonListenerHelper(
            document.getElementById(`editButton${itemAdded.id}`),
            document.getElementById(`deleteButton${itemAdded.id}`),
            document.getElementById(`infoButton${itemAdded.id}`),
            itemAdded
        );
    }
    /*
    this one is just setting up html of cellaction.
    */
    function cellActionHelper(cellAction, itemAdded){
        cellAction.innerHTML = `
        <button type="button" class="editButtonRow" id="editButton${itemAdded.id}" data-bs-toggle="modal" data-bs-target="#editModal">Edit</button>
        <button type="button" class="deleteButtonRow" id="deleteButton${itemAdded.id}">Delete</button>
        <button type="button" class="infoButtonRow" id="infoButton${itemAdded.id}">More</button>
        `;
    }

    /*
    This helper adds action listeners.
    */
    function actionButtonListenerHelper(editB,deleteB,infoB,item){
        //edit button
        editB.addEventListener("click", async function(){
            // open modal already done above
            /*
            have to get the item again cuz all attributes are renewed while item is not 
            synchronized to the update. but fortunately the id will not be updated so I 
            can get the item from the id again... this is extremely tricky.
            */
            const response = await fetch(`/api/getItemById?id=${item.id}`);
            if (!response.ok){console.error(`Request failed with status: ${response.status}`);}
            const data = await response.json();
            // item currently editing
            state.itemInEdit = data;
            // add to modal event input box...
            console.log(data.status);
            statusEditInput.value = data.status;
            console.log(data.abnormality);
            abnormalityEditInput.value = data.abnormality.toString().toLowerCase();
            customerNameEditInput.value = data.customerName;
            originEditInput.value = data.origin;
            destinationEditInput.value = data.destination;
        });
        // delete button
        deleteB.addEventListener("click", async function(){
            const deleteAlertCheckbox = document.getElementById("deleteAlertCheckbox");
            // console.log(deleteAlertCheckbox);
            if (!deleteAlertCheckbox.checked){
                const confirmation = confirm("Are you sure you want to delete this item? This action cannot be recalled.");
                if (!confirmation){return;}
            }

            const row = this.closest("tr");
            if (row){row.remove();}
            const param = new URLSearchParams({
                id: item.id
            });
            const response = await fetch(`/api/deleteItemById?${param}`, {
                method: "DELETE"
            });
            if (!response.ok){console.error(`Request failed with status: ${response.status}`);}

        });
        // more button
        infoB.addEventListener("click", async function(){
            alert("Still developing...")
        });
    }
});


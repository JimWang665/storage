# 📦 Storage Management System

A simple web-based **Storage Management System** built with Spring Boot (Java backend), Bootstrap 5, and vanilla JavaScript.

## 🧩 Features

- ✅ Add new storage items
- 🔍 Search items by ID, status, customer name, origin, and destination
- 🗑️ Delete individual or all items with confirmation
- ✏️ Edit item details in a modal
- 🔔 Option to delete items without alert (toggleable)
- 🎨 Responsive UI using Bootstrap

## 📁 Project Structure
```
storage/
├── src/
│ ├── main/
│ │ ├── java/ # Java source code (Spring Boot)
│ │ └── resources/
│ │ ├── static/ # Frontend assets (HTML, CSS, JS, Bootstrap)
│ │ └── application.properties # Configuration file
│ └── test/ # Unit tests
├── HELP.md # Help documentation
├── README.md # This file
├── mvnw # Maven wrapper
└── pom.xml # Maven project configuration
```
## 🚀 How to Run

### Prerequisites:
- Java 17+
- Maven
- Git (optional)

### Steps:

1. Clone the repository:
```
bash git clone https://github.com/JimWang665/storage.git cd storage
```

2. Build the project:
```
bash ./mvnw clean package
```
3. Run the application:
```
bash java -jar target/storage-0.0.1-SNAPSHOT.jar
```
4. Open your browser and go to:
```
http://localhost:8080
```
## 💻 API Endpoints

| Method | Endpoint              | Description                          |
|--------|-----------------------|--------------------------------------|
| GET    | `/api/getAllItems`    | Get all storage items                |
| POST   | `/api/addItem`        | Add a new item                       |
| PATCH  | `/api/setItem`        | Update an existing item              |
| DELETE | `/api/deleteItemById` | Delete an item by ID                 |
| DELETE | `/api/deleteAll`      | Delete all items                     |
| GET    | `/api/getItemById`    | Get item details by ID               |
| GET    | `/api/searchItem`     | Search items based on filters        |

## 🛡️ License

This project is licensed under the MIT License – see the [LICENSE](LICENSE) file for details.


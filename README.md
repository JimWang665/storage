# 📦 Storage Management System

A simple web-based **Storage Management System** built with Spring Boot (Java backend), Bootstrap 5, and vanilla JavaScript, backed by MySQL.

## 🧩 Features

- Add new storage items
- Search items by ID, status, abnormality, customer name, origin, and destination (text search is case-insensitive "contains")
- Delete individual items or all items, with confirmation
- Edit item details in a modal
- Option to delete / edit items without a confirmation alert (toggleable)
- Responsive UI using Bootstrap; server errors are shown in a banner instead of failing silently

## 📁 Project Structure

```
storage/
├── src/
│   ├── main/
│   │   ├── java/                      # Spring Boot backend
│   │   └── resources/
│   │       ├── static/                # Front end (HTML, CSS, JS, Bootstrap)
│   │       └── application.properties # Configuration (reads environment variables)
│   └── test/                          # Tests (run on an in-memory H2 database)
├── Dockerfile                         # Container image for the backend
├── pom.xml                            # Maven project configuration
└── mvnw / mvnw.cmd / .mvn/            # Maven wrapper
```

## 🚀 How to Run Locally

### Prerequisites
- Java **21**
- A MySQL 8 server (for example in Docker)
- Git (optional)

### Steps

1. Clone the repository:

   ```bash
   git clone https://github.com/JimWang665/storage.git
   cd storage
   ```

2. Start MySQL, for example with Docker:

   ```bash
   docker run -d --name storage-mysql -p 3306:3306 \
     -e MYSQL_ROOT_PASSWORD=changeme -e MYSQL_DATABASE=mydatabase mysql:8
   ```

3. Run the app. Configuration comes from environment variables (defaults are for local development):

   | Variable | Default | Meaning |
   |---|---|---|
   | `DB_URL` | `jdbc:mysql://localhost:3306/mydatabase?allowPublicKeyRetrieval=true` | JDBC URL |
   | `DB_USERNAME` | `root` | Database user |
   | `DB_PASSWORD` | *(empty)* | Database password |
   | `DDL_AUTO` | `update` | Hibernate schema mode |
   | `DELETE_ALL_ENABLED` | `true` | Set `false` to disable `/api/deleteAll` (used on public deployments) |
   | `PORT` | `8080` | HTTP port |

   ```bash
   DB_PASSWORD=changeme ./mvnw spring-boot:run
   ```

   On Windows PowerShell:

   ```powershell
   $env:DB_PASSWORD="changeme"; .\mvnw.cmd spring-boot:run
   ```

4. Open <http://localhost:8080>. Health check: <http://localhost:8080/actuator/health>.

> **Upgrading an existing local database:** item status is now stored as text (`NEW`, `CATEGORIZED`, ...) instead of a number.
> If you already have an `item` table from an older version, drop it once (`DROP TABLE item;`) and let the app recreate it.

### Run the tests

```bash
./mvnw verify
```

Tests use an in-memory H2 database, so no MySQL or Docker is needed.

## 💻 API Endpoints

| Method | Endpoint              | Description                                                   |
|--------|-----------------------|---------------------------------------------------------------|
| GET    | `/api/getAllItems`    | Get all storage items (sorted by ID)                          |
| POST   | `/api/addItem`        | Add a new item (`customerName`, `origin`, `destination`)      |
| PATCH  | `/api/setItem`        | Update an existing item                                       |
| DELETE | `/api/deleteItemById` | Delete an item by ID                                          |
| DELETE | `/api/deleteAll`      | Delete all items (403 if `DELETE_ALL_ENABLED=false`)          |
| GET    | `/api/getItemById`    | Get item details by ID                                        |
| GET    | `/api/searchItem`     | Return the items that **match** all non-blank filters         |

Invalid input (blank or over-long text, unknown status, non-numeric ID) returns HTTP 400 with `{"error": "..."}`.

## 🛡️ License

This project is licensed under the MIT License – see the [LICENSE](LICENSE) file for details.

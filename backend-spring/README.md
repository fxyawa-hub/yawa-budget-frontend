# Yawa Budget — Backend Architecture & Defense Guide

## 1. Executive Summary & Tech Stack
- **Framework**: Spring Boot 3.2.5 (Java 17+)
- **Data Persistence**: Spring Data MongoDB (`spring-boot-starter-data-mongodb`)
- **Database Engine**: MongoDB 6.0+ (Document-oriented NoSQL)
- **Security & Auth**: Spring Security 6.x + JJWT (Stateless Bearer JWT, BCrypt Password Hashing)
- **Validation**: Jakarta Bean Validation (`@Valid`, `@NotBlank`, `@DecimalMin`, `@Email`)
- **Monitoring**: Spring Boot Actuator (`/actuator/health` probe for Kubernetes/Docker)
- **Build Tool**: Apache Maven (`pom.xml`)

---

## 2. Core Document Model Architecture & Defense Questions

### A. Why MongoDB Instead of a Relational Database (RDBMS)?
*Defense Question: "Why did you choose a document database like MongoDB for financial transactions, and where does it fit or fall short compared to Postgres/MySQL?"*

#### Where MongoDB Fits Well:
1. **Schema Agility & Polymorphic Data**:
   Personal finance applications ingest transactions from varied sources (cash entries, Open Banking aggregators like Mono, POS terminals, bank transfers). A document model effortlessly accommodates optional metadata (e.g., merchant metadata, geolocation, payment channels) without schema migrations (`ALTER TABLE`) locking production tables.
2. **Read Performance & Document Locality**:
   Financial ledger queries in mobile and web apps are read-heavy: users want their entire transaction history, with category details and timestamps, in a single query. Document locality ensures a transaction document is read in one disk seek, avoiding costly multi-table joins.
3. **Horizontal Sharding by Tenant (`userId`)**:
   MongoDB's natural sharding key is `userId`. Since user financial data is completely isolated (User A never needs joins with User B), sharding collections by `userId` provides virtually infinite linear horizontal scale.

#### Where MongoDB Requires Careful Engineering (Trade-offs / Imperfections):
1. **Multi-Document ACID Transactions vs Single-Document Atomicity**:
   Relational databases provide native multi-table ACID guarantees out of the box. While MongoDB supports multi-document transactions (via replica sets), they introduce distributed locking overhead. For Yawa Budget Core, we structure documents so financial writes (e.g., adding a transaction) are **atomic at the single-document level**.
2. **Referential Integrity Enforced at Application Layer**:
   MongoDB lacks native foreign key constraints with `ON DELETE CASCADE`. As a result, cascading deletes (e.g., purging transactions and budgets when an account is deleted) must be explicitly managed in the service layer (`AuthService.deleteAccount`) to prevent orphaned documents.

---

### B. Category Modeling: Embedded Sub-Document vs. Reference
*Defense Question: "In your Transaction document, did you choose to embed Category or reference it by ID? Why?"*

**Decision**: We chose **Embedded / Denormalized Category Snapshot** (`category: String`).

**Architectural Rationale**:
1. **Historical Immutability & Point-in-Time Accuracy**:
   If a user renames or modifies a category in the future (e.g., "Food" to "Groceries & Dining"), historical transactions must reflect the categorization at the moment the money was spent. Referencing an external category ID risks inadvertently rewriting the historical ledger when category metadata changes.
2. **Zero Join Overhead ($lookup elimination)**:
   Embedding eliminates the need for expensive MongoDB aggregation `$lookup` pipelines on every transaction list fetch. A single `findByUserIdOrderByDateDesc` returns everything the frontend UI needs to render.
3. **Write Simplicity**:
   Creating a transaction is a single BSON document insertion.

---

## 3. Core Endpoints Specification

| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| `POST` | `/auth/register` | No | Creates user with BCrypt hashed password, returns JWT & user DTO. |
| `POST` | `/auth/login` | No | Validates credentials (with login rate limiting), returns JWT. |
| `DELETE` | `/auth/account` | **Yes (JWT)** | Cascades deletion of user, transactions, and budgets (zero orphans). |
| `POST` | `/transactions` | **Yes (JWT)** | Creates transaction. Category is optional: auto-classified via AI if omitted. |
| `GET` | `/transactions` | **Yes (JWT)** | Lists current user's transactions (supports `startDate` & `endDate` query params). |
| `POST` | `/budgets` | **Yes (JWT)** | Upserts monthly spending limit for a category. |
| `GET` | `/budgets/summary` | **Yes (JWT)** | Spending vs limit per category, including `isOver80Percent` warning flag. |
| `POST` | `/ai/categorize` | **Yes (JWT)** | Transaction description in $\rightarrow$ category prediction out (Gemini / Heuristics). |
| `POST` | `/ai/ask` | **Yes (JWT)** | Natural language question $\rightarrow$ context synthesized from user ledger $\rightarrow$ LLM answer. |
| `GET` | `/actuator/health` | No | Health check probe for container orchestrator liveness/readiness. |

---

## 4. Security Principles Enforced
1. **Server-Side Identity Derivation**:
   Neither `userId` nor user roles are accepted from the request body or parameters. Identity is strictly extracted from the verified JWT payload (`@AuthenticationPrincipal UserPrincipal`).
2. **Stateless JWT Validation**:
   `JwtAuthenticationFilter` intercepts requests, parses the Bearer token, validates HMAC-SHA256 signature and expiration, and establishes the Spring Security `SecurityContext`.
3. **BCrypt Password Hashing**:
   Passwords are never stored in plaintext. Hashing is performed using `BCryptPasswordEncoder` with standard salt rounds.
4. **Login Brute-Force Rate Limiting**:
   `LoginRateLimiter` enforces a 5-failed-attempt sliding window per account identifier before temporarily locking attempts for 60 seconds.
5. **No Raw Query Injection**:
   All database access is executed via typed Spring Data MongoDB query methods (`MongoRepository`), which serialize parameters safely into BSON queries without risk of NoSQL operator injection.
6. **Strict CORS Policy**:
   `SecurityConfig` configures `CorsConfigurationSource` to only allow explicitly declared origins (`app.cors.allowed-origins`).
7. **Clean JSON Error Responses**:
   `GlobalExceptionHandler` (`@RestControllerAdvice`) traps validation errors, duplicates, and bad credentials, formatting them into structured `ErrorResponse` objects without ever dumping server stack traces.

---

## 5. Seed Defaults & Data Lifecycle
- Default categories seeded on initial startup:
  - `Food`
  - `Transport`
  - `Bills`
  - `Shopping`
  - `Entertainment`
  - `Other`
- Seeding is idempotent: checks `existsByNameIgnoreCase()` before inserting.

---

## 6. How to Run Locally

### Prerequisites
- JDK 17+ installed (`javac -version`)
- Maven 3.8+ installed (`mvn -version`)
- MongoDB running locally on `localhost:27017` or MongoDB Atlas URI

### Commands
```bash
# Navigate to backend directory
cd backend-spring

# Run tests
mvn test

# Package JAR
mvn clean package -DskipTests

# Run Spring Boot application
java -jar target/yawa-budget-backend-1.0.0.jar
```

package com.yawabudget.model;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

/**
 * Transaction Document in MongoDB
 * Collection: transactions
 *
 * ARCHITECTURAL DECISION DEFENSE (Embedded Sub-Document vs Reference for Category):
 * ---------------------------------------------------------------------------------
 * We choose to EMBED the Category snapshot (`categoryName`) directly inside each Transaction document.
 * Why?
 * 1. Read Performance & Query Locality: Personal finance feeds display lists of dozens or hundreds of
 *    transactions. In MongoDB, an embedded category snapshot allows reading the entire transaction
 *    list in a SINGLE query without requiring an expensive multi-collection $lookup (join) or secondary queries.
 * 2. Point-in-Time Historical Immutability: If a master category is renamed or reorganized in the future,
 *    historical financial ledgers MUST preserve the classification under which the money was spent at the time.
 * 3. Atomic Writes: Adding a transaction with its category requires only one atomic BSON document insert.
 *
 * We also maintain compound index on (userId, date) to optimize user transaction range queries.
 */
@Document(collection = "transactions")
@CompoundIndexes({
    @CompoundIndex(name = "user_date_idx", def = "{'userId': 1, 'date': -1}"),
    @CompoundIndex(name = "user_category_idx", def = "{'userId': 1, 'category': 1}")
})
public class Transaction {

    @Id
    private String id;

    @Indexed
    private String userId;

    private BigDecimal amount;

    private String description;

    /**
     * Category name embedded directly as a sub-document / string value for fast reads and historical integrity.
     */
    private String category;

    private LocalDate date;

    private TransactionType type = TransactionType.EXPENSE;

    @CreatedDate
    private Instant createdAt = Instant.now();

    public Transaction() {
    }

    public Transaction(String id, String userId, BigDecimal amount, String description, String category, LocalDate date, TransactionType type) {
        this.id = id;
        this.userId = userId;
        this.amount = amount;
        this.description = description;
        this.category = category;
        this.date = date;
        this.type = type != null ? type : TransactionType.EXPENSE;
        this.createdAt = Instant.now();
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public LocalDate getDate() {
        return date;
    }

    public void setDate(LocalDate date) {
        this.date = date;
    }

    public TransactionType getType() {
        return type;
    }

    public void setType(TransactionType type) {
        this.type = type;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}

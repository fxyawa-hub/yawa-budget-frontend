package com.yawabudget.model;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Budget Document in MongoDB
 * Collection: budgets
 *
 * Stores the user's monthly spending limit per category.
 * Has unique compound index on (userId, category) so a user has exactly one limit per category.
 */
@Document(collection = "budgets")
@CompoundIndexes({
    @CompoundIndex(name = "user_category_unique_idx", def = "{'userId': 1, 'category': 1}", unique = true)
})
public class Budget {

    @Id
    private String id;

    @Indexed
    private String userId;

    private String category;

    private BigDecimal monthlyLimit;

    @CreatedDate
    private Instant createdAt = Instant.now();

    public Budget() {
    }

    public Budget(String id, String userId, String category, BigDecimal monthlyLimit) {
        this.id = id;
        this.userId = userId;
        this.category = category;
        this.monthlyLimit = monthlyLimit;
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

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public BigDecimal getMonthlyLimit() {
        return monthlyLimit;
    }

    public void setMonthlyLimit(BigDecimal monthlyLimit) {
        this.monthlyLimit = monthlyLimit;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}

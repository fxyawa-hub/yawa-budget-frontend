package com.yawabudget.dto;

import com.yawabudget.model.TransactionType;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

public record TransactionResponse(
    String id,
    String userId,
    BigDecimal amount,
    String description,
    String category,
    LocalDate date,
    TransactionType type,
    Instant createdAt
) {}

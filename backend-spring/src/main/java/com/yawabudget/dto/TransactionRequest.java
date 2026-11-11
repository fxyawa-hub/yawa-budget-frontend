package com.yawabudget.dto;

import com.yawabudget.model.TransactionType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;

public record TransactionRequest(
    @NotNull(message = "Amount is required")
    @DecimalMin(value = "0.01", message = "Amount must be greater than zero")
    BigDecimal amount,

    @NotBlank(message = "Description is required")
    String description,

    /**
     * Optional category. If left null/blank, the backend triggers the AI categorization step.
     */
    String category,

    /**
     * Date of transaction (defaults to current date if null).
     */
    LocalDate date,

    /**
     * Income or Expense (defaults to EXPENSE if null).
     */
    TransactionType type
) {}

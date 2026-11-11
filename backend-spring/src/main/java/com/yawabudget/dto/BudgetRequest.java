package com.yawabudget.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record BudgetRequest(
    @NotBlank(message = "Category is required")
    String category,

    @NotNull(message = "Monthly limit amount is required")
    @DecimalMin(value = "0.01", message = "Monthly limit must be greater than zero")
    BigDecimal monthlyLimit
) {}

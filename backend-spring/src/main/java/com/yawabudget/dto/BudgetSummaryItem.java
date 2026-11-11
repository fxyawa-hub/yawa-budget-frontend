package com.yawabudget.dto;

import java.math.BigDecimal;

public record BudgetSummaryItem(
    String category,
    BigDecimal monthlyLimit,
    BigDecimal spent,
    BigDecimal remaining,
    double percentageUsed,
    boolean isOver80Percent,
    boolean isExceeded
) {}

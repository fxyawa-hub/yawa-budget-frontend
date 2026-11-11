package com.yawabudget.dto;

import java.math.BigDecimal;
import java.util.List;

public record BudgetSummaryResponse(
    BigDecimal totalBudgetLimit,
    BigDecimal totalSpent,
    BigDecimal totalRemaining,
    List<BudgetSummaryItem> categorySummaries
) {}

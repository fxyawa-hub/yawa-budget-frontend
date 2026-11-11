package com.yawabudget.service;

import com.yawabudget.dto.BudgetRequest;
import com.yawabudget.dto.BudgetSummaryItem;
import com.yawabudget.dto.BudgetSummaryResponse;
import com.yawabudget.model.Budget;
import com.yawabudget.model.Transaction;
import com.yawabudget.model.TransactionType;
import com.yawabudget.repository.BudgetRepository;
import com.yawabudget.repository.TransactionRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.*;

@Service
public class BudgetService {

    private final BudgetRepository budgetRepository;
    private final TransactionRepository transactionRepository;

    public BudgetService(BudgetRepository budgetRepository, TransactionRepository transactionRepository) {
        this.budgetRepository = budgetRepository;
        this.transactionRepository = transactionRepository;
    }

    /**
     * Upsert monthly limit for category for the given user.
     */
    public Budget setBudget(String userId, BudgetRequest request) {
        String normalizedCategory = request.category().trim();

        Optional<Budget> existing = budgetRepository.findByUserIdAndCategoryIgnoreCase(userId, normalizedCategory);
        Budget budget;
        if (existing.isPresent()) {
            budget = existing.get();
            budget.setMonthlyLimit(request.monthlyLimit());
        } else {
            budget = new Budget(null, userId, normalizedCategory, request.monthlyLimit());
        }

        return budgetRepository.save(budget);
    }

    /**
     * Spending vs limit per category for the current month, with an 80%-limit flag.
     */
    public BudgetSummaryResponse getBudgetSummary(String userId) {
        List<Budget> budgets = budgetRepository.findByUserId(userId);

        LocalDate now = LocalDate.now();
        LocalDate startOfMonth = now.withDayOfMonth(1);
        LocalDate endOfMonth = now.withDayOfMonth(now.lengthOfMonth());

        List<Transaction> monthlyTransactions = transactionRepository.findByUserIdAndDateBetweenOrderByDateDesc(
            userId,
            startOfMonth,
            endOfMonth
        );

        // Sum expense amounts per category
        Map<String, BigDecimal> spendingByCategory = new HashMap<>();
        for (Transaction t : monthlyTransactions) {
            if (t.getType() == TransactionType.EXPENSE) {
                String cat = t.getCategory() != null ? t.getCategory().toLowerCase() : "other";
                BigDecimal current = spendingByCategory.getOrDefault(cat, BigDecimal.ZERO);
                spendingByCategory.put(cat, current.add(t.getAmount()));
            }
        }

        List<BudgetSummaryItem> categorySummaries = new ArrayList<>();
        BigDecimal totalLimit = BigDecimal.ZERO;
        BigDecimal totalSpent = BigDecimal.ZERO;

        for (Budget b : budgets) {
            String catName = b.getCategory();
            BigDecimal limit = b.getMonthlyLimit();
            BigDecimal spent = spendingByCategory.getOrDefault(catName.toLowerCase(), BigDecimal.ZERO);
            BigDecimal remaining = limit.subtract(spent);

            totalLimit = totalLimit.add(limit);
            totalSpent = totalSpent.add(spent);

            double percentageUsed = 0.0;
            if (limit.compareTo(BigDecimal.ZERO) > 0) {
                percentageUsed = spent.divide(limit, 4, RoundingMode.HALF_UP).doubleValue() * 100.0;
            }

            boolean isOver80Percent = percentageUsed >= 80.0;
            boolean isExceeded = spent.compareTo(limit) > 0;

            categorySummaries.add(new BudgetSummaryItem(
                catName,
                limit,
                spent,
                remaining,
                Math.round(percentageUsed * 100.0) / 100.0,
                isOver80Percent,
                isExceeded
            ));
        }

        BigDecimal totalRemaining = totalLimit.subtract(totalSpent);

        return new BudgetSummaryResponse(
            totalLimit,
            totalSpent,
            totalRemaining,
            categorySummaries
        );
    }
}

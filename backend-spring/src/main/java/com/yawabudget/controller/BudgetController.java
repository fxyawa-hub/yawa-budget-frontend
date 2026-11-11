package com.yawabudget.controller;

import com.yawabudget.dto.BudgetRequest;
import com.yawabudget.dto.BudgetSummaryResponse;
import com.yawabudget.model.Budget;
import com.yawabudget.security.UserPrincipal;
import com.yawabudget.service.BudgetService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/budgets")
public class BudgetController {

    private final BudgetService budgetService;

    public BudgetService getBudgetService() {
        return budgetService;
    }

    public BudgetController(BudgetService budgetService) {
        this.budgetService = budgetService;
    }

    /**
     * POST /budgets
     * Set monthly limit per category.
     */
    @PostMapping
    public ResponseEntity<Budget> setBudget(
        @AuthenticationPrincipal UserPrincipal principal,
        @Valid @RequestBody BudgetRequest request
    ) {
        Budget budget = budgetService.setBudget(principal.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(budget);
    }

    /**
     * GET /budgets/summary
     * Spending vs limit per category, including the 80% threshold flag.
     */
    @GetMapping("/summary")
    public ResponseEntity<BudgetSummaryResponse> getBudgetSummary(
        @AuthenticationPrincipal UserPrincipal principal
    ) {
        BudgetSummaryResponse summary = budgetService.getBudgetSummary(principal.getId());
        return ResponseEntity.ok(summary);
    }
}

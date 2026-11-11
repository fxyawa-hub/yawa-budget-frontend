package com.yawabudget.controller;

import com.yawabudget.dto.TransactionRequest;
import com.yawabudget.dto.TransactionResponse;
import com.yawabudget.security.UserPrincipal;
import com.yawabudget.service.TransactionService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/transactions")
public class TransactionController {

    private final TransactionService transactionService;

    public TransactionController(TransactionService transactionService) {
        this.transactionService = transactionService;
    }

    /**
     * POST /transactions
     * Category is optional; automatically classified by AI service if omitted or blank.
     */
    @PostMapping
    public ResponseEntity<TransactionResponse> createTransaction(
        @AuthenticationPrincipal UserPrincipal principal,
        @Valid @RequestBody TransactionRequest request
    ) {
        TransactionResponse response = transactionService.createTransaction(principal.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * GET /transactions
     * Lists current user's transactions, optionally filtered by startDate and endDate.
     */
    @GetMapping
    public ResponseEntity<List<TransactionResponse>> getTransactions(
        @AuthenticationPrincipal UserPrincipal principal,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        List<TransactionResponse> transactions = transactionService.getTransactions(principal.getId(), startDate, endDate);
        return ResponseEntity.ok(transactions);
    }
}

package com.yawabudget.controller;

import com.yawabudget.dto.AiAskRequest;
import com.yawabudget.dto.AiAskResponse;
import com.yawabudget.dto.AiCategorizeRequest;
import com.yawabudget.dto.AiCategorizeResponse;
import com.yawabudget.model.Transaction;
import com.yawabudget.security.UserPrincipal;
import com.yawabudget.service.AiService;
import com.yawabudget.service.TransactionService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/ai")
public class AiController {

    private final AiService aiService;
    private final TransactionService transactionService;

    public AiController(AiService aiService, TransactionService transactionService) {
        this.aiService = aiService;
        this.transactionService = transactionService;
    }

    /**
     * POST /ai/categorize
     * Transaction description in -> Category recommendation out.
     */
    @PostMapping("/categorize")
    public ResponseEntity<AiCategorizeResponse> categorize(@Valid @RequestBody AiCategorizeRequest request) {
        AiCategorizeResponse response = aiService.categorize(request.description());
        return ResponseEntity.ok(response);
    }

    /**
     * POST /ai/ask
     * Natural-language question in -> fetch relevant transactions for current user -> LLM answers.
     */
    @PostMapping("/ask")
    public ResponseEntity<AiAskResponse> ask(
        @AuthenticationPrincipal UserPrincipal principal,
        @Valid @RequestBody AiAskRequest request
    ) {
        List<Transaction> userTransactions = transactionService.getRawTransactionsForUser(principal.getId());

        String context = userTransactions.isEmpty()
            ? "No transactions have been recorded yet for this user."
            : userTransactions.stream()
                .map(t -> String.format("- %s: ₦%s on '%s' (%s, %s)",
                    t.getDate(),
                    t.getAmount(),
                    t.getDescription(),
                    t.getCategory(),
                    t.getType()))
                .collect(Collectors.joining("\n"));

        String answer = aiService.answerFinancialQuestion(request.question(), context);

        return ResponseEntity.ok(new AiAskResponse(request.question(), answer, userTransactions.size()));
    }
}

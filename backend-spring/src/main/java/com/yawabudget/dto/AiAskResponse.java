package com.yawabudget.dto;

import java.time.Instant;
import java.util.List;

public record AiAskResponse(
    String question,
    String answer,
    int referencedTransactionsCount,
    Instant timestamp
) {
    public AiAskResponse(String question, String answer, int referencedTransactionsCount) {
        this(question, answer, referencedTransactionsCount, Instant.now());
    }
}

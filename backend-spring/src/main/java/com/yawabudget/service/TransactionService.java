package com.yawabudget.service;

import com.yawabudget.dto.AiCategorizeResponse;
import com.yawabudget.dto.TransactionRequest;
import com.yawabudget.dto.TransactionResponse;
import com.yawabudget.model.Transaction;
import com.yawabudget.model.TransactionType;
import com.yawabudget.repository.TransactionRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class TransactionService {

    private final TransactionRepository transactionRepository;
    private final AiService aiService;

    public TransactionService(TransactionRepository transactionRepository, AiService aiService) {
        this.transactionRepository = transactionRepository;
        this.aiService = aiService;
    }

    /**
     * Create a new transaction for the authenticated user.
     * If category is null or blank, the AI categorization step is triggered automatically.
     */
    public TransactionResponse createTransaction(String userId, TransactionRequest request) {
        String finalCategory = request.category();

        if (finalCategory == null || finalCategory.trim().isBlank()) {
            AiCategorizeResponse aiResult = aiService.categorize(request.description());
            finalCategory = aiResult.category();
        } else {
            finalCategory = finalCategory.trim();
        }

        LocalDate transactionDate = request.date() != null ? request.date() : LocalDate.now();
        TransactionType transactionType = request.type() != null ? request.type() : TransactionType.EXPENSE;

        Transaction transaction = new Transaction(
            null,
            userId,
            request.amount(),
            request.description().trim(),
            finalCategory,
            transactionDate,
            transactionType
        );

        Transaction saved = transactionRepository.save(transaction);
        return toResponse(saved);
    }

    /**
     * List current user's transactions with optional date range filtering.
     * Enforced strictly by userId derived from JWT.
     */
    public List<TransactionResponse> getTransactions(String userId, LocalDate startDate, LocalDate endDate) {
        List<Transaction> transactions;

        if (startDate != null && endDate != null) {
            transactions = transactionRepository.findByUserIdAndDateBetweenOrderByDateDesc(userId, startDate, endDate);
        } else if (startDate != null) {
            transactions = transactionRepository.findByUserIdAndDateGreaterThanEqualOrderByDateDesc(userId, startDate);
        } else if (endDate != null) {
            transactions = transactionRepository.findByUserIdAndDateLessThanEqualOrderByDateDesc(userId, endDate);
        } else {
            transactions = transactionRepository.findByUserIdOrderByDateDesc(userId);
        }

        return transactions.stream()
            .map(this::toResponse)
            .collect(Collectors.toList());
    }

    public List<Transaction> getRawTransactionsForUser(String userId) {
        return transactionRepository.findByUserIdOrderByDateDesc(userId);
    }

    private TransactionResponse toResponse(Transaction t) {
        return new TransactionResponse(
            t.getId(),
            t.getUserId(),
            t.getAmount(),
            t.getDescription(),
            t.getCategory(),
            t.getDate(),
            t.getType(),
            t.getCreatedAt()
        );
    }
}

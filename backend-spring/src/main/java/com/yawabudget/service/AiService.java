package com.yawabudget.service;

import com.yawabudget.dto.AiCategorizeResponse;
import com.yawabudget.model.Category;
import com.yawabudget.repository.CategoryRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;
import java.util.regex.Pattern;

@Service
public class AiService {

    private static final Logger log = LoggerFactory.getLogger(AiService.class);

    private final CategoryRepository categoryRepository;
    private final RestTemplate restTemplate;
    private final String geminiApiKey;

    public AiService(
        CategoryRepository categoryRepository,
        @Value("${app.ai.gemini-api-key:}") String geminiApiKey
    ) {
        this.categoryRepository = categoryRepository;
        this.restTemplate = new RestTemplate();
        this.geminiApiKey = geminiApiKey;
    }

    /**
     * Categorize transaction description.
     * Uses Gemini LLM API if key is available, with resilient contextual heuristics fallback.
     */
    public AiCategorizeResponse categorize(String description) {
        if (description == null || description.isBlank()) {
            return new AiCategorizeResponse(description, "Other", 0.5, "Empty description defaulted to Other");
        }

        List<String> knownCategories = categoryRepository.findAll().stream()
            .map(Category::getName)
            .toList();

        if (knownCategories.isEmpty()) {
            knownCategories = List.of("Food", "Transport", "Bills", "Shopping", "Entertainment", "Other");
        }

        if (geminiApiKey != null && !geminiApiKey.isBlank()) {
            try {
                return callGeminiForCategorization(description, knownCategories);
            } catch (Exception e) {
                log.warn("Gemini API call failed for categorization, falling back to heuristic engine: {}", e.getMessage());
            }
        }

        return fallbackCategorize(description, knownCategories);
    }

    /**
     * Answer natural language questions about user spending and transactions.
     */
    public String answerFinancialQuestion(String question, String transactionsSummaryContext) {
        if (geminiApiKey != null && !geminiApiKey.isBlank()) {
            try {
                return callGeminiForQuestion(question, transactionsSummaryContext);
            } catch (Exception e) {
                log.warn("Gemini API call failed for Q&A, falling back to rule engine: {}", e.getMessage());
            }
        }

        return fallbackAnswerQuestion(question, transactionsSummaryContext);
    }

    private AiCategorizeResponse callGeminiForCategorization(String description, List<String> categories) {
        String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + geminiApiKey;

        String prompt = "You are a financial classification AI for Yawa Budget. Given the transaction description, classify it into EXACTLY ONE of the following valid categories: "
            + String.join(", ", categories) + ".\n"
            + "Description: \"" + description + "\"\n"
            + "Respond in strict JSON with fields: category (string, must be one of the listed categories), confidence (number between 0 and 1), and reasoning (short sentence).";

        Map<String, Object> body = Map.of(
            "contents", List.of(
                Map.of("parts", List.of(Map.of("text", prompt)))
            ),
            "generationConfig", Map.of(
                "responseMimeType", "application/json"
            )
        );

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

        ResponseEntity<Map> response = restTemplate.postForEntity(url, request, Map.class);
        if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
            Map respMap = response.getBody();
            List candidates = (List) respMap.get("candidates");
            if (candidates != null && !candidates.isEmpty()) {
                Map first = (Map) candidates.get(0);
                Map content = (Map) first.get("content");
                List parts = (List) content.get("parts");
                Map part = (Map) parts.get(0);
                String text = (String) part.get("text");

                // Parse category from model JSON or simple text
                for (String cat : categories) {
                    if (text.toLowerCase().contains(cat.toLowerCase())) {
                        return new AiCategorizeResponse(description, cat, 0.95, "Classified by Gemini AI");
                    }
                }
            }
        }

        return fallbackCategorize(description, categories);
    }

    private String callGeminiForQuestion(String question, String context) {
        String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + geminiApiKey;

        String prompt = "You are Yawa Budget's personal finance assistant. Answer the user's question accurately using ONLY their transactions context provided below.\n\n"
            + "Transactions Context:\n" + context + "\n\n"
            + "User Question: " + question + "\n\n"
            + "Provide a concise, direct, helpful answer in 2-3 sentences. Mention specific amounts or categories if relevant.";

        Map<String, Object> body = Map.of(
            "contents", List.of(
                Map.of("parts", List.of(Map.of("text", prompt)))
            )
        );

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

        ResponseEntity<Map> response = restTemplate.postForEntity(url, request, Map.class);
        if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
            Map respMap = response.getBody();
            List candidates = (List) respMap.get("candidates");
            if (candidates != null && !candidates.isEmpty()) {
                Map first = (Map) candidates.get(0);
                Map content = (Map) first.get("content");
                List parts = (List) content.get("parts");
                Map part = (Map) parts.get(0);
                return (String) part.get("text");
            }
        }

        return fallbackAnswerQuestion(question, context);
    }

    private AiCategorizeResponse fallbackCategorize(String description, List<String> categories) {
        String lower = description.toLowerCase();

        if (matchesAny(lower, "uber", "bolt", "fuel", "petrol", "danfo", "bus", "train", "flight", "taxi", "brt", "ride")) {
            return new AiCategorizeResponse(description, "Transport", 0.90, "Matched transport keywords");
        }
        if (matchesAny(lower, "kfc", "dominos", "chicken", "restaurant", "shawarma", "suya", "groceries", "supermarket", "lunch", "dinner", "breakfast", "cafe", "food", "market", "shoprite")) {
            return new AiCategorizeResponse(description, "Food", 0.92, "Matched food and dining keywords");
        }
        if (matchesAny(lower, "nepa", "ekedc", "ikedc", "electricity", "water", "dstv", "gotv", "netflix", "internet", "mtn", "airtel", "glo", "spectranet", "rent", "bill")) {
            return new AiCategorizeResponse(description, "Bills", 0.91, "Matched recurring bills & utilities");
        }
        if (matchesAny(lower, "jumia", "amazon", "zara", "asos", "shoes", "clothes", "gadget", "mall", "purchase", "shopping", "pos purchase")) {
            return new AiCategorizeResponse(description, "Shopping", 0.88, "Matched retail shopping keywords");
        }
        if (matchesAny(lower, "cinema", "movie", "spotify", "game", "club", "drinks", "party", "concert", "entertainment")) {
            return new AiCategorizeResponse(description, "Entertainment", 0.89, "Matched entertainment keywords");
        }

        return new AiCategorizeResponse(description, "Other", 0.65, "Default classification for general expenses");
    }

    private String fallbackAnswerQuestion(String question, String context) {
        String lower = question.toLowerCase();
        if (lower.contains("how much") || lower.contains("spent") || lower.contains("spending") || lower.contains("food") || lower.contains("total")) {
            return "Based on your recorded transactions in Yawa Budget, here is the breakdown:\n" + context;
        }
        return "Here is your spending analysis based on your current transactions:\n" + context;
    }

    private boolean matchesAny(String text, String... keywords) {
        for (String kw : keywords) {
            if (Pattern.compile("\\b" + Pattern.quote(kw) + "\\b", Pattern.CASE_INSENSITIVE).matcher(text).find()
                || text.contains(kw)) {
                return true;
            }
        }
        return false;
    }
}

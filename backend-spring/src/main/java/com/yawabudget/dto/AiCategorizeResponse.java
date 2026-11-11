package com.yawabudget.dto;

public record AiCategorizeResponse(
    String description,
    String category,
    double confidence,
    String reasoning
) {}

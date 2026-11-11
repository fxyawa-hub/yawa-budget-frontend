package com.yawabudget.dto;

import jakarta.validation.constraints.NotBlank;

public record AiAskRequest(
    @NotBlank(message = "Question cannot be blank")
    String question
) {}

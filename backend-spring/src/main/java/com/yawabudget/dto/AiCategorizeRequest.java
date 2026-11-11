package com.yawabudget.dto;

import jakarta.validation.constraints.NotBlank;

public record AiCategorizeRequest(
    @NotBlank(message = "Description cannot be blank")
    String description
) {}

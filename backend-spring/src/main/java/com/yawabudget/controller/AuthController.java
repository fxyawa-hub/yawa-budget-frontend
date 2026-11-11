package com.yawabudget.controller;

import com.yawabudget.dto.AuthResponse;
import com.yawabudget.dto.LoginRequest;
import com.yawabudget.dto.RegisterRequest;
import com.yawabudget.security.UserPrincipal;
import com.yawabudget.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    /**
     * Account Deletion Endpoint:
     * DELETE /auth/account
     * Deletes user document along with all transactions and budgets in a clean cascade.
     * Identity is derived strictly from JWT AuthenticationPrincipal.
     */
    @DeleteMapping("/account")
    public ResponseEntity<Map<String, Object>> deleteAccount(@AuthenticationPrincipal UserPrincipal principal) {
        authService.deleteAccount(principal.getId());
        return ResponseEntity.ok(Map.of(
            "success", true,
            "message", "Account and associated transactions/budgets have been permanently deleted"
        ));
    }
}

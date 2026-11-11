package com.yawabudget.service;

import com.yawabudget.dto.AuthResponse;
import com.yawabudget.dto.LoginRequest;
import com.yawabudget.dto.RegisterRequest;
import com.yawabudget.dto.UserDto;
import com.yawabudget.exception.BadRequestException;
import com.yawabudget.exception.EmailAlreadyExistsException;
import com.yawabudget.model.User;
import com.yawabudget.repository.BudgetRepository;
import com.yawabudget.repository.TransactionRepository;
import com.yawabudget.repository.UserRepository;
import com.yawabudget.security.JwtService;
import com.yawabudget.security.LoginRateLimiter;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final TransactionRepository transactionRepository;
    private final BudgetRepository budgetRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final LoginRateLimiter loginRateLimiter;

    public AuthService(
        UserRepository userRepository,
        TransactionRepository transactionRepository,
        BudgetRepository budgetRepository,
        PasswordEncoder passwordEncoder,
        JwtService jwtService,
        LoginRateLimiter loginRateLimiter
    ) {
        this.userRepository = userRepository;
        this.transactionRepository = transactionRepository;
        this.budgetRepository = budgetRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.loginRateLimiter = loginRateLimiter;
    }

    public AuthResponse register(RegisterRequest request) {
        String normalizedEmail = request.email().trim().toLowerCase();

        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new EmailAlreadyExistsException(normalizedEmail);
        }

        String hashedPassword = passwordEncoder.encode(request.password());
        User user = new User(null, request.name().trim(), normalizedEmail, hashedPassword);
        User savedUser = userRepository.save(user);

        String token = jwtService.generateToken(savedUser.getId(), savedUser.getEmail());
        UserDto userDto = new UserDto(savedUser.getId(), savedUser.getName(), savedUser.getEmail(), savedUser.getCreatedAt());

        return new AuthResponse(token, userDto);
    }

    public AuthResponse login(LoginRequest request) {
        String normalizedEmail = request.email().trim().toLowerCase();

        // Enforce rate limiting
        if (loginRateLimiter.isBlocked(normalizedEmail)) {
            throw new BadRequestException("Too many failed login attempts. Please wait 1 minute before trying again.");
        }

        User user = userRepository.findByEmail(normalizedEmail)
            .orElseThrow(() -> {
                loginRateLimiter.recordFailedAttempt(normalizedEmail);
                return new BadCredentialsException("Invalid email or password");
            });

        if (!passwordEncoder.matches(request.password(), user.getPassword())) {
            loginRateLimiter.recordFailedAttempt(normalizedEmail);
            throw new BadCredentialsException("Invalid email or password");
        }

        // Reset rate limiter on successful authentication
        loginRateLimiter.reset(normalizedEmail);

        String token = jwtService.generateToken(user.getId(), user.getEmail());
        UserDto userDto = new UserDto(user.getId(), user.getName(), user.getEmail(), user.getCreatedAt());

        return new AuthResponse(token, userDto);
    }

    /**
     * Account Deletion & Data Cascade:
     * Properly deletes the user's transactions and budgets first so no orphaned documents remain in MongoDB.
     */
    public void deleteAccount(String userId) {
        // 1. Delete all transactions belonging to this user
        transactionRepository.deleteByUserId(userId);

        // 2. Delete all budgets belonging to this user
        budgetRepository.deleteByUserId(userId);

        // 3. Delete user document
        userRepository.deleteById(userId);
    }
}

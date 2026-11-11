package com.yawabudget;

import com.yawabudget.dto.RegisterRequest;
import com.yawabudget.model.Category;
import com.yawabudget.model.Transaction;
import com.yawabudget.model.TransactionType;
import com.yawabudget.repository.CategoryRepository;
import com.yawabudget.repository.TransactionRepository;
import com.yawabudget.repository.UserRepository;
import com.yawabudget.service.AuthService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class YawaBudgetApplicationTests {

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private AuthService authService;

    @BeforeEach
    void setUp() {
        transactionRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    void contextLoads() {
        assertNotNull(categoryRepository);
    }

    @Test
    void testUserCascadeDeleteLeavesNoOrphanedTransactions() {
        var registerRes = authService.register(new RegisterRequest("Test User", "test@example.com", "password123"));
        String userId = registerRes.user().id();

        Transaction tx = new Transaction(null, userId, new BigDecimal("4500"), "Groceries", "Food", LocalDate.now(), TransactionType.EXPENSE);
        transactionRepository.save(tx);

        assertEquals(1, transactionRepository.countByUserId(userId));

        // Perform clean cascade delete
        authService.deleteAccount(userId);

        assertEquals(0, transactionRepository.countByUserId(userId));
        assertTrue(userRepository.findById(userId).isEmpty());
    }
}

package com.yawabudget.repository;

import com.yawabudget.model.Transaction;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface TransactionRepository extends MongoRepository<Transaction, String> {

    List<Transaction> findByUserIdOrderByDateDesc(String userId);

    List<Transaction> findByUserIdAndDateBetweenOrderByDateDesc(String userId, LocalDate startDate, LocalDate endDate);

    List<Transaction> findByUserIdAndDateGreaterThanEqualOrderByDateDesc(String userId, LocalDate startDate);

    List<Transaction> findByUserIdAndDateLessThanEqualOrderByDateDesc(String userId, LocalDate endDate);

    List<Transaction> findByUserIdAndCategoryIgnoreCase(String userId, String category);

    void deleteByUserId(String userId);

    long countByUserId(String userId);
}

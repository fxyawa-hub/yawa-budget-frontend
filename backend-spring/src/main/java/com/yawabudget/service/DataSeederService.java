package com.yawabudget.service;

import com.yawabudget.model.Category;
import com.yawabudget.repository.CategoryRepository;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class DataSeederService {

    private static final Logger log = LoggerFactory.getLogger(DataSeederService.class);

    private final CategoryRepository categoryRepository;
    private final boolean seedEnabled;

    public DataSeederService(
        CategoryRepository categoryRepository,
        @Value("${app.seed.enabled:true}") boolean seedEnabled
    ) {
        this.categoryRepository = categoryRepository;
        this.seedEnabled = seedEnabled;
    }

    @PostConstruct
    public void seedInitialCategories() {
        if (!seedEnabled) {
            return;
        }

        List<String> defaultCategories = List.of(
            "Food",
            "Transport",
            "Bills",
            "Shopping",
            "Entertainment",
            "Other"
        );

        for (String catName : defaultCategories) {
            if (!categoryRepository.existsByNameIgnoreCase(catName)) {
                categoryRepository.save(new Category(catName));
                log.info("Seeded default category: {}", catName);
            }
        }
    }
}

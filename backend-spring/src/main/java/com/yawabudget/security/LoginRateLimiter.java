package com.yawabudget.security;

import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Basic in-memory rate limiter for login attempts to mitigate brute-force attacks.
 * Limit: 5 failed attempts per IP / email per minute.
 */
@Component
public class LoginRateLimiter {

    private static final int MAX_ATTEMPTS = 5;
    private static final long WINDOW_SECONDS = 60;

    private static class AttemptRecord {
        int count;
        Instant windowStart;

        AttemptRecord(int count, Instant windowStart) {
            this.count = count;
            this.windowStart = windowStart;
        }
    }

    private final ConcurrentHashMap<String, AttemptRecord> attemptsMap = new ConcurrentHashMap<>();

    public boolean isBlocked(String key) {
        Instant now = Instant.now();
        AttemptRecord record = attemptsMap.get(key);
        if (record == null) {
            return false;
        }

        if (now.getEpochSecond() - record.windowStart.getEpochSecond() > WINDOW_SECONDS) {
            attemptsMap.remove(key);
            return false;
        }

        return record.count >= MAX_ATTEMPTS;
    }

    public void recordFailedAttempt(String key) {
        Instant now = Instant.now();
        attemptsMap.compute(key, (k, existing) -> {
            if (existing == null || (now.getEpochSecond() - existing.windowStart.getEpochSecond() > WINDOW_SECONDS)) {
                return new AttemptRecord(1, now);
            }
            existing.count++;
            return existing;
        });
    }

    public void reset(String key) {
        attemptsMap.remove(key);
    }
}

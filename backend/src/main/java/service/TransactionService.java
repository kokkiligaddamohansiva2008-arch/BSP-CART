package com.bspcart.service;

import com.bspcart.entity.Transaction;
import com.bspcart.entity.User;
import com.bspcart.repository.TransactionRepository;
import com.bspcart.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class TransactionService {

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private UserRepository userRepository;

    // Create Transaction
    public Transaction createTransaction(Long userId, Double amount) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Transaction transaction = new Transaction();

        transaction.setUser(user);
        transaction.setAmount(BigDecimal.valueOf(amount));
        transaction.setStatus("PENDING");
        transaction.setTransactionDate(LocalDateTime.now());

        return transactionRepository.save(transaction);
    }

    // Process Payment
    public Transaction processPayment(Long transactionId) {

        Transaction transaction = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new RuntimeException("Transaction not found"));

        transaction.setStatus("SUCCESS");

        return transactionRepository.save(transaction);
    }

    // Refund Payment
    public Transaction refundPayment(Long transactionId) {

        Transaction transaction = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new RuntimeException("Transaction not found"));

        transaction.setStatus("REFUNDED");

        return transactionRepository.save(transaction);
    }

    // Transaction History
    public List<Transaction> getTransactionHistory(Long userId) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return transactionRepository.findByUser(user);
    }
}

package com.prakash.jobtracker.service;

import com.prakash.jobtracker.model.PasswordResetToken;
import com.prakash.jobtracker.model.User;
import com.prakash.jobtracker.repository.PasswordResetTokenRepository;
import com.prakash.jobtracker.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;

@Service
public class PasswordResetService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordResetTokenRepository passwordResetTokenRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private EmailService emailService;


    @Transactional
    public String createResetToken(String email) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new RuntimeException(
                                "No account found with this email"
                        ));


        // Remove previous reset tokens
        passwordResetTokenRepository.deleteByUserId(
                user.getId()
        );


        // Generate secure random token
        SecureRandom secureRandom =
                new SecureRandom();

        byte[] randomBytes = new byte[32];

        secureRandom.nextBytes(randomBytes);

        String token =
                Base64.getUrlEncoder()
                        .withoutPadding()
                        .encodeToString(randomBytes);


        PasswordResetToken resetToken =
                new PasswordResetToken();

        resetToken.setToken(token);

        resetToken.setUser(user);

        resetToken.setExpiresAt(
                LocalDateTime.now().plusMinutes(30)
        );

        resetToken.setUsed(false);


        passwordResetTokenRepository.save(
                resetToken
        );


        // Frontend reset-password page
        String resetLink =
                "http://127.0.0.1:5500/reset-password.html"
                        + "?token="
                        + token;


        // Send email
        emailService.sendPasswordResetEmail(
                user.getEmail(),
                resetLink
        );


        // Temporary return value.
        // We'll remove this after testing.
        return token;
    }

    @Transactional
    public void resetPassword(String token, String newPassword) {

        PasswordResetToken resetToken =
                passwordResetTokenRepository.findByToken(token)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Invalid or expired reset token"
                                ));

        if (resetToken.isUsed()) {
            throw new RuntimeException(
                    "This password reset link has already been used"
            );
        }

        if (resetToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new RuntimeException(
                    "This password reset link has expired"
            );
        }

        if (newPassword == null || newPassword.length() < 8) {
            throw new RuntimeException(
                    "Password must contain at least 8 characters"
            );
        }

        User user = resetToken.getUser();

        user.setPassword(
                passwordEncoder.encode(newPassword)
        );

        userRepository.save(user);

        resetToken.setUsed(true);

        passwordResetTokenRepository.save(resetToken);
    }
}
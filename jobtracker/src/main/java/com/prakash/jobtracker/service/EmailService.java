package com.prakash.jobtracker.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;


    public void sendPasswordResetEmail(
            String recipientEmail,
            String resetLink) {

        SimpleMailMessage message =
                new SimpleMailMessage();

        message.setTo(recipientEmail);

        message.setSubject(
                "JobTracker - Reset Your Password"
        );

        message.setText(
                "Hello,\n\n"
                        + "We received a request to reset your JobTracker password.\n\n"
                        + "Click the link below to create a new password:\n\n"
                        + resetLink
                        + "\n\n"
                        + "This link will expire in 30 minutes.\n\n"
                        + "If you did not request a password reset, "
                        + "you can safely ignore this email.\n\n"
                        + "Regards,\n"
                        + "JobTracker"
        );

        mailSender.send(message);
    }
}
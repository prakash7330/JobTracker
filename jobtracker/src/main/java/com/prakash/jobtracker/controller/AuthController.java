package com.prakash.jobtracker.controller;

//chatgpt
import org.springframework.security.core.Authentication;
import com.prakash.jobtracker.model.User;
import com.prakash.jobtracker.repository.UserRepository;
import com.prakash.jobtracker.security.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import com.prakash.jobtracker.service.PasswordResetService;
import com.prakash.jobtracker.dto.PasswordResetRequest;
import com.prakash.jobtracker.dto.AuthRequest;
import com.prakash.jobtracker.dto.ResetPasswordRequest;


import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private PasswordResetService passwordResetService;

    @PostMapping("/register")
    public Map<String, String> register(@RequestBody AuthRequest request) {
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new RuntimeException("An account with this email already exists");
        }

        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        userRepository.save(user);

        Map<String, String> response = new HashMap<>();
        response.put("message", "User registered successfully");
        return response;
    }

    @PostMapping("/login")
    public Map<String, String> login(@RequestBody AuthRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Invalid email or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid email or password");
        }

        String token = jwtUtil.generateToken(user.getEmail());

        Map<String, String> response = new HashMap<>();
        response.put("token", token);
        return response;
    }

    @PostMapping("/forgot-password")
    public Map<String, String> forgotPassword(
            @RequestBody PasswordResetRequest request) {

        passwordResetService.createResetToken(
                request.getEmail()
        );

        Map<String, String> response = new HashMap<>();

        response.put(
                "message",
                "If an account exists with this email, a password reset link has been sent."
        );

        return response;
    }

    @PostMapping("/reset-password")
    public Map<String, String> resetPassword(
            @RequestBody ResetPasswordRequest request) {

        passwordResetService.resetPassword(
                request.getToken(),
                request.getNewPassword()
        );

        Map<String, String> response = new HashMap<>();

        response.put(
                "message",
                "Password reset successfully"
        );

        return response;
    }

    //from chatgpt added
    @GetMapping("/me")
    public Map<String, Object> me(Authentication authentication) {

        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        Map<String, Object> response = new HashMap<>();
        response.put("id", user.getId());
        response.put("name", user.getName());
        response.put("email", user.getEmail());

        return response;
    }
}
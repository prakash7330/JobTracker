package com.prakash.jobtracker.controller;

import com.prakash.jobtracker.model.Application;
import com.prakash.jobtracker.model.ApplicationStatus;
import com.prakash.jobtracker.model.StatusHistory;
import com.prakash.jobtracker.repository.StatusHistoryRepository;
import com.prakash.jobtracker.service.ApplicationService;
import com.prakash.jobtracker.service.FollowUpScheduler;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/applications")
@CrossOrigin
public class ApplicationController {

    @Autowired
    private ApplicationService applicationService;

    @Autowired
    private FollowUpScheduler followUpScheduler;

    @Autowired
    private StatusHistoryRepository statusHistoryRepository;


    // ============================================================
    // CREATE APPLICATION
    // ============================================================

    @PostMapping
    public ResponseEntity<?> createApplication(
            @RequestBody Application application,
            Authentication authentication
    ) {

        try {

            if (authentication == null) {
                return ResponseEntity
                        .status(HttpStatus.UNAUTHORIZED)
                        .body("Authentication required");
            }

            String userEmail = authentication.getName();

            if (application == null) {
                return ResponseEntity
                        .badRequest()
                        .body("Application data is required");
            }

            if (application.getCompanyName() == null
                    || application.getCompanyName().trim().isEmpty()) {

                return ResponseEntity
                        .badRequest()
                        .body("Company name is required");
            }

            if (application.getRoleTitle() == null
                    || application.getRoleTitle().trim().isEmpty()) {

                return ResponseEntity
                        .badRequest()
                        .body("Role title is required");
            }

            if (application.getAppliedDate() == null) {
                return ResponseEntity
                        .badRequest()
                        .body("Applied date is required");
            }

            Application createdApplication =
                    applicationService.createApplication(
                            application,
                            userEmail
                    );

            return ResponseEntity
                    .status(HttpStatus.CREATED)
                    .body(createdApplication);

        } catch (RuntimeException exception) {

            return ResponseEntity
                    .badRequest()
                    .body(exception.getMessage());
        }
    }


    // ============================================================
    // RUN FOLLOW-UP CHECK
    // ============================================================

    @PostMapping("/run-followup-check")
    public ResponseEntity<String> runFollowUpCheck() {

        try {

            followUpScheduler.flagStaleApplications();

            return ResponseEntity.ok(
                    "Follow-up check completed"
            );

        } catch (Exception exception) {

            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(
                            "Unable to run follow-up check: "
                                    + exception.getMessage()
                    );
        }
    }


    // ============================================================
    // GET STALE APPLICATIONS
    // ============================================================

    @GetMapping("/stale")
    public ResponseEntity<?> getStaleApplications(
            Authentication authentication
    ) {

        try {

            if (authentication == null) {
                return ResponseEntity
                        .status(HttpStatus.UNAUTHORIZED)
                        .body("Authentication required");
            }

            String userEmail =
                    authentication.getName();

            List<Application> applications =
                    applicationService
                            .getApplicationsByUser(userEmail)
                            .stream()
                            .filter(Application::isNeedsFollowUp)
                            .toList();

            return ResponseEntity.ok(applications);

        } catch (RuntimeException exception) {

            return ResponseEntity
                    .badRequest()
                    .body(exception.getMessage());
        }
    }


    // ============================================================
    // GET CURRENT USER APPLICATIONS
    // ============================================================

    @GetMapping
    public ResponseEntity<?> getApplications(
            Authentication authentication
    ) {

        try {

            if (authentication == null) {
                return ResponseEntity
                        .status(HttpStatus.UNAUTHORIZED)
                        .body("Authentication required");
            }

            String userEmail =
                    authentication.getName();

            List<Application> applications =
                    applicationService
                            .getApplicationsByUser(userEmail);

            return ResponseEntity.ok(applications);

        } catch (RuntimeException exception) {

            return ResponseEntity
                    .badRequest()
                    .body(exception.getMessage());
        }
    }


    // ============================================================
    // GET SINGLE APPLICATION
    // ============================================================

    @GetMapping("/{id}")
    public ResponseEntity<?> getApplication(
            @PathVariable Long id,
            Authentication authentication
    ) {

        try {

            if (authentication == null) {
                return ResponseEntity
                        .status(HttpStatus.UNAUTHORIZED)
                        .body("Authentication required");
            }

            String userEmail =
                    authentication.getName();

            Application application =
                    applicationService.getApplicationById(
                            id,
                            userEmail
                    );

            return ResponseEntity.ok(application);

        } catch (RuntimeException exception) {

            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(exception.getMessage());
        }
    }


    // ============================================================
    // GET STATUS HISTORY
    // ============================================================

    @GetMapping("/{id}/history")
    public ResponseEntity<?> getStatusHistory(
            @PathVariable Long id,
            Authentication authentication
    ) {

        try {

            if (authentication == null) {
                return ResponseEntity
                        .status(HttpStatus.UNAUTHORIZED)
                        .body("Authentication required");
            }

            String userEmail =
                    authentication.getName();

            // This also verifies that the application
            // belongs to the logged-in user.
            applicationService.getApplicationById(
                    id,
                    userEmail
            );

            List<StatusHistory> history =
                    statusHistoryRepository
                            .findByApplicationId(id);

            return ResponseEntity.ok(history);

        } catch (RuntimeException exception) {

            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(exception.getMessage());
        }
    }


    // ============================================================
    // UPDATE STATUS
    // ============================================================

    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(
            @PathVariable Long id,
            @RequestParam ApplicationStatus status,
            Authentication authentication
    ) {

        try {

            if (authentication == null) {
                return ResponseEntity
                        .status(HttpStatus.UNAUTHORIZED)
                        .body("Authentication required");
            }

            if (status == null) {
                return ResponseEntity
                        .badRequest()
                        .body("Application status is required");
            }

            Application updatedApplication =
                    applicationService.updateStatus(
                            id,
                            status,
                            authentication.getName()
                    );

            return ResponseEntity.ok(
                    updatedApplication
            );

        } catch (RuntimeException exception) {

            return ResponseEntity
                    .badRequest()
                    .body(exception.getMessage());
        }
    }


    // ============================================================
    // EDIT APPLICATION
    // ============================================================

    @PutMapping("/{id}")
    public ResponseEntity<?> updateApplication(
            @PathVariable Long id,
            @RequestBody Application application,
            Authentication authentication
    ) {

        try {

            if (authentication == null) {
                return ResponseEntity
                        .status(HttpStatus.UNAUTHORIZED)
                        .body("Authentication required");
            }

            if (application == null) {
                return ResponseEntity
                        .badRequest()
                        .body("Application data is required");
            }

            if (application.getCompanyName() == null
                    || application.getCompanyName().trim().isEmpty()) {

                return ResponseEntity
                        .badRequest()
                        .body("Company name is required");
            }

            if (application.getRoleTitle() == null
                    || application.getRoleTitle().trim().isEmpty()) {

                return ResponseEntity
                        .badRequest()
                        .body("Role title is required");
            }

            if (application.getAppliedDate() == null) {

                return ResponseEntity
                        .badRequest()
                        .body("Applied date is required");
            }

            Application updatedApplication =
                    applicationService.updateApplication(
                            id,
                            application,
                            authentication.getName()
                    );

            return ResponseEntity.ok(
                    updatedApplication
            );

        } catch (RuntimeException exception) {

            return ResponseEntity
                    .badRequest()
                    .body(exception.getMessage());
        }
    }


    // ============================================================
    // DELETE APPLICATION
    // ============================================================

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteApplication(
            @PathVariable Long id,
            Authentication authentication
    ) {

        try {

            if (authentication == null) {
                return ResponseEntity
                        .status(HttpStatus.UNAUTHORIZED)
                        .body("Authentication required");
            }

            applicationService.deleteApplication(
                    id,
                    authentication.getName()
            );

            return ResponseEntity.ok(
                    "Application deleted successfully"
            );

        } catch (RuntimeException exception) {

            return ResponseEntity
                    .badRequest()
                    .body(exception.getMessage());
        }
    }
}
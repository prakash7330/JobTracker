package com.prakash.jobtracker.controller;

import com.prakash.jobtracker.model.Interview;
import com.prakash.jobtracker.service.InterviewService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/interviews")
@CrossOrigin
public class InterviewController {

    @Autowired
    private InterviewService interviewService;


    // ============================================================
    // CREATE INTERVIEW
    // ============================================================

    @PostMapping
    public ResponseEntity<?> createInterview(
            @RequestParam Long applicationId,
            @RequestBody Interview interview,
            Authentication authentication
    ) {

        try {

            if (authentication == null) {
                return ResponseEntity
                        .status(HttpStatus.UNAUTHORIZED)
                        .body("Authentication required");
            }

            if (applicationId == null) {
                return ResponseEntity
                        .badRequest()
                        .body("Application ID is required");
            }

            if (interview == null) {
                return ResponseEntity
                        .badRequest()
                        .body("Interview data is required");
            }

            if (interview.getInterviewDate() == null) {
                return ResponseEntity
                        .badRequest()
                        .body("Interview date is required");
            }

            Interview createdInterview =
                    interviewService.createInterview(
                            interview,
                            applicationId,
                            authentication.getName()
                    );

            return ResponseEntity
                    .status(HttpStatus.CREATED)
                    .body(createdInterview);

        } catch (RuntimeException exception) {

            return ResponseEntity
                    .badRequest()
                    .body(exception.getMessage());
        }
    }


    // ============================================================
    // GET ALL INTERVIEWS FOR CURRENT USER
    // ============================================================

    @GetMapping
    public ResponseEntity<?> getInterviews(
            Authentication authentication
    ) {

        try {

            if (authentication == null) {
                return ResponseEntity
                        .status(HttpStatus.UNAUTHORIZED)
                        .body("Authentication required");
            }

            List<Interview> interviews =
                    interviewService.getInterviewsByUser(
                            authentication.getName()
                    );

            return ResponseEntity.ok(interviews);

        } catch (RuntimeException exception) {

            return ResponseEntity
                    .badRequest()
                    .body(exception.getMessage());
        }
    }


    // ============================================================
    // GET UPCOMING INTERVIEWS
    // ============================================================

    @GetMapping("/upcoming")
    public ResponseEntity<?> getUpcomingInterviews(
            Authentication authentication
    ) {

        try {

            if (authentication == null) {
                return ResponseEntity
                        .status(HttpStatus.UNAUTHORIZED)
                        .body("Authentication required");
            }

            List<Interview> interviews =
                    interviewService.getUpcomingInterviews(
                            authentication.getName()
                    );

            return ResponseEntity.ok(interviews);

        } catch (RuntimeException exception) {

            return ResponseEntity
                    .badRequest()
                    .body(exception.getMessage());
        }
    }


    // ============================================================
    // GET PENDING FOLLOW-UPS
    // ============================================================

    @GetMapping("/pending-followups")
    public ResponseEntity<?> getPendingFollowUps(
            Authentication authentication
    ) {

        try {

            if (authentication == null) {
                return ResponseEntity
                        .status(HttpStatus.UNAUTHORIZED)
                        .body("Authentication required");
            }

            List<Interview> interviews =
                    interviewService.getPendingFollowUps(
                            authentication.getName()
                    );

            return ResponseEntity.ok(interviews);

        } catch (RuntimeException exception) {

            return ResponseEntity
                    .badRequest()
                    .body(exception.getMessage());
        }
    }


    // ============================================================
    // GET INTERVIEWS FOR ONE APPLICATION
    // ============================================================

    @GetMapping("/application/{applicationId}")
    public ResponseEntity<?> getInterviewsByApplication(
            @PathVariable Long applicationId,
            Authentication authentication
    ) {

        try {

            if (authentication == null) {
                return ResponseEntity
                        .status(HttpStatus.UNAUTHORIZED)
                        .body("Authentication required");
            }

            if (applicationId == null) {
                return ResponseEntity
                        .badRequest()
                        .body("Application ID is required");
            }

            List<Interview> interviews =
                    interviewService.getInterviewsByApplication(
                            applicationId,
                            authentication.getName()
                    );

            return ResponseEntity.ok(interviews);

        } catch (RuntimeException exception) {

            return ResponseEntity
                    .badRequest()
                    .body(exception.getMessage());
        }
    }


    // ============================================================
    // GET SINGLE INTERVIEW
    // ============================================================

    @GetMapping("/{id}")
    public ResponseEntity<?> getInterview(
            @PathVariable Long id,
            Authentication authentication
    ) {

        try {

            if (authentication == null) {
                return ResponseEntity
                        .status(HttpStatus.UNAUTHORIZED)
                        .body("Authentication required");
            }

            Interview interview =
                    interviewService.getInterviewById(
                            id,
                            authentication.getName()
                    );

            return ResponseEntity.ok(interview);

        } catch (RuntimeException exception) {

            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(exception.getMessage());
        }
    }


    // ============================================================
    // UPDATE INTERVIEW
    // ============================================================

    @PutMapping("/{id}")
    public ResponseEntity<?> updateInterview(
            @PathVariable Long id,
            @RequestBody Interview interview,
            Authentication authentication
    ) {

        try {

            if (authentication == null) {
                return ResponseEntity
                        .status(HttpStatus.UNAUTHORIZED)
                        .body("Authentication required");
            }

            if (interview == null) {
                return ResponseEntity
                        .badRequest()
                        .body("Interview data is required");
            }

            if (interview.getInterviewDate() == null) {
                return ResponseEntity
                        .badRequest()
                        .body("Interview date is required");
            }

            Interview updatedInterview =
                    interviewService.updateInterview(
                            id,
                            interview,
                            authentication.getName()
                    );

            return ResponseEntity.ok(
                    updatedInterview
            );

        } catch (RuntimeException exception) {

            return ResponseEntity
                    .badRequest()
                    .body(exception.getMessage());
        }
    }


    // ============================================================
    // COMPLETE FOLLOW-UP
    // ============================================================

    @PutMapping("/{id}/complete-followup")
    public ResponseEntity<?> completeFollowUp(
            @PathVariable Long id,
            Authentication authentication
    ) {

        try {

            if (authentication == null) {
                return ResponseEntity
                        .status(HttpStatus.UNAUTHORIZED)
                        .body("Authentication required");
            }

            Interview updatedInterview =
                    interviewService.completeFollowUp(
                            id,
                            authentication.getName()
                    );

            return ResponseEntity.ok(
                    updatedInterview
            );

        } catch (RuntimeException exception) {

            return ResponseEntity
                    .badRequest()
                    .body(exception.getMessage());
        }
    }


    // ============================================================
    // DELETE INTERVIEW
    // ============================================================

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteInterview(
            @PathVariable Long id,
            Authentication authentication
    ) {

        try {

            if (authentication == null) {
                return ResponseEntity
                        .status(HttpStatus.UNAUTHORIZED)
                        .body("Authentication required");
            }

            interviewService.deleteInterview(
                    id,
                    authentication.getName()
            );

            return ResponseEntity.ok(
                    "Interview deleted successfully"
            );

        } catch (RuntimeException exception) {

            return ResponseEntity
                    .badRequest()
                    .body(exception.getMessage());
        }
    }
}
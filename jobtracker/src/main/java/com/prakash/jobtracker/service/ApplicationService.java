package com.prakash.jobtracker.service;

import com.prakash.jobtracker.model.Application;
import com.prakash.jobtracker.model.ApplicationStatus;
import com.prakash.jobtracker.model.StatusHistory;
import com.prakash.jobtracker.model.User;
import com.prakash.jobtracker.repository.ApplicationRepository;
import com.prakash.jobtracker.repository.StatusHistoryRepository;
import com.prakash.jobtracker.repository.UserRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
public class ApplicationService {

    @Autowired
    private ApplicationRepository applicationRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private StatusHistoryRepository statusHistoryRepository;


    // ============================================================
    // CREATE APPLICATION
    // ============================================================

    public Application createApplication(
            Application application,
            String userEmail
    ) {

        User user =
                getUserByEmail(userEmail);


        // --------------------------------------------------------
        // Basic validation
        // --------------------------------------------------------

        if (
                application.getCompanyName() == null
                        || application.getCompanyName()
                        .trim()
                        .isEmpty()
        ) {

            throw new RuntimeException(
                    "Company name is required"
            );
        }


        if (
                application.getRoleTitle() == null
                        || application.getRoleTitle()
                        .trim()
                        .isEmpty()
        ) {

            throw new RuntimeException(
                    "Role title is required"
            );
        }


        if (application.getAppliedDate() == null) {

            throw new RuntimeException(
                    "Applied date is required"
            );
        }


        // --------------------------------------------------------
        // Clean input
        // --------------------------------------------------------

        application.setCompanyName(
                application.getCompanyName().trim()
        );

        application.setRoleTitle(
                application.getRoleTitle().trim()
        );


        if (
                application.getResumeVersion() != null
        ) {

            application.setResumeVersion(
                    application.getResumeVersion().trim()
            );

        }


        if (
                application.getNotes() != null
        ) {

            application.setNotes(
                    application.getNotes().trim()
            );

        }


        // --------------------------------------------------------
        // Duplicate application check
        // --------------------------------------------------------

        boolean duplicate =
                applicationRepository
                        .existsByUserIdAndCompanyNameIgnoreCaseAndRoleTitleIgnoreCase(
                                user.getId(),
                                application.getCompanyName(),
                                application.getRoleTitle()
                        );


        if (duplicate) {

            throw new RuntimeException(
                    "An application for this company and role already exists."
            );
        }


        // --------------------------------------------------------
        // Set user
        // --------------------------------------------------------

        application.setUser(user);


        // --------------------------------------------------------
        // Default status
        // --------------------------------------------------------

        if (
                application.getCurrentStatus() == null
        ) {

            application.setCurrentStatus(
                    ApplicationStatus.APPLIED
            );

        }


        // --------------------------------------------------------
        // Timestamps
        // --------------------------------------------------------

        LocalDateTime now =
                LocalDateTime.now();


        application.setCreatedAt(
                now
        );

        application.setLastUpdated(
                now
        );


        // --------------------------------------------------------
        // New application should not require follow-up
        // --------------------------------------------------------

        application.setNeedsFollowUp(
                false
        );


        // --------------------------------------------------------
        // Save application
        // --------------------------------------------------------

        Application savedApplication =
                applicationRepository.save(
                        application
                );


        // --------------------------------------------------------
        // Create initial status history
        // --------------------------------------------------------

        createStatusHistory(
                savedApplication,
                savedApplication.getCurrentStatus()
        );


        return savedApplication;
    }


    // ============================================================
    // GET APPLICATIONS BY USER
    // ============================================================

    @Transactional(readOnly = true)
    public List<Application> getApplicationsByUser(
            String userEmail
    ) {

        User user =
                getUserByEmail(userEmail);


        return applicationRepository
                .findByUserId(
                        user.getId()
                );
    }


    // ============================================================
    // GET SINGLE APPLICATION
    // ============================================================

    @Transactional(readOnly = true)
    public Application getApplicationById(
            Long id,
            String userEmail
    ) {

        User user =
                getUserByEmail(userEmail);


        Application application =
                applicationRepository
                        .findById(id)
                        .orElseThrow(
                                () ->
                                        new RuntimeException(
                                                "Application not found"
                                        )
                        );


        // --------------------------------------------------------
        // Security / ownership check
        // --------------------------------------------------------

        if (
                application.getUser() == null
                        || application.getUser().getId() == null
                        || !application.getUser()
                        .getId()
                        .equals(user.getId())
        ) {

            throw new RuntimeException(
                    "You are not authorized to access this application"
            );
        }


        return application;
    }


    // ============================================================
    // UPDATE APPLICATION STATUS
    // ============================================================

    public Application updateStatus(
            Long id,
            ApplicationStatus newStatus,
            String userEmail
    ) {

        if (newStatus == null) {

            throw new RuntimeException(
                    "Application status is required"
            );
        }


        Application application =
                getApplicationById(
                        id,
                        userEmail
                );


        ApplicationStatus oldStatus =
                application.getCurrentStatus();


        // --------------------------------------------------------
        // No actual change
        // --------------------------------------------------------

        if (
                oldStatus == newStatus
        ) {

            application.setLastUpdated(
                    LocalDateTime.now()
            );

            application.setNeedsFollowUp(
                    false
            );


            return applicationRepository.save(
                    application
            );
        }


        // --------------------------------------------------------
        // Update status
        // --------------------------------------------------------

        application.setCurrentStatus(
                newStatus
        );


        application.setLastUpdated(
                LocalDateTime.now()
        );


        // --------------------------------------------------------
        // Final statuses don't require follow-up
        // --------------------------------------------------------

        if (
                newStatus ==
                        ApplicationStatus.OFFER
                        ||
                        newStatus ==
                                ApplicationStatus.REJECTED
        ) {

            application.setNeedsFollowUp(
                    false
            );

        } else {

            application.setNeedsFollowUp(
                    false
            );

        }


        Application savedApplication =
                applicationRepository.save(
                        application
                );


        // --------------------------------------------------------
        // Save status history
        // --------------------------------------------------------

        createStatusHistory(
                savedApplication,
                newStatus
        );


        return savedApplication;
    }


    // ============================================================
    // UPDATE APPLICATION
    // ============================================================

    public Application updateApplication(
            Long id,
            Application updatedApplication,
            String userEmail
    ) {

        Application existingApplication =
                getApplicationById(
                        id,
                        userEmail
                );


        // --------------------------------------------------------
        // Validation
        // --------------------------------------------------------

        if (
                updatedApplication.getCompanyName() == null
                        || updatedApplication.getCompanyName()
                        .trim()
                        .isEmpty()
        ) {

            throw new RuntimeException(
                    "Company name is required"
            );
        }


        if (
                updatedApplication.getRoleTitle() == null
                        || updatedApplication.getRoleTitle()
                        .trim()
                        .isEmpty()
        ) {

            throw new RuntimeException(
                    "Role title is required"
            );
        }


        if (
                updatedApplication.getAppliedDate() == null
        ) {

            throw new RuntimeException(
                    "Applied date is required"
            );
        }


        String companyName =
                updatedApplication
                        .getCompanyName()
                        .trim();


        String roleTitle =
                updatedApplication
                        .getRoleTitle()
                        .trim();


        // --------------------------------------------------------
        // Duplicate check excluding current application
        // --------------------------------------------------------

        boolean duplicate =
                applicationRepository
                        .existsByUserIdAndCompanyNameIgnoreCaseAndRoleTitleIgnoreCaseAndIdNot(
                                existingApplication
                                        .getUser()
                                        .getId(),

                                companyName,

                                roleTitle,

                                id
                        );


        if (duplicate) {

            throw new RuntimeException(
                    "Another application for this company and role already exists."
            );
        }


        // --------------------------------------------------------
        // Preserve current status
        // --------------------------------------------------------

        ApplicationStatus currentStatus =
                existingApplication
                        .getCurrentStatus();


        // --------------------------------------------------------
        // Update editable fields
        // --------------------------------------------------------

        existingApplication.setCompanyName(
                companyName
        );


        existingApplication.setRoleTitle(
                roleTitle
        );


        existingApplication.setSource(
                updatedApplication.getSource()
        );


        existingApplication.setResumeVersion(
                cleanString(
                        updatedApplication
                                .getResumeVersion()
                )
        );


        existingApplication.setAppliedDate(
                updatedApplication.getAppliedDate()
        );


        existingApplication.setNotes(
                cleanString(
                        updatedApplication.getNotes()
                )
        );


        // --------------------------------------------------------
        // Preserve status unless explicitly supplied
        // --------------------------------------------------------

        if (
                updatedApplication.getCurrentStatus()
                        != null
        ) {

            existingApplication.setCurrentStatus(
                    updatedApplication.getCurrentStatus()
            );

        } else {

            existingApplication.setCurrentStatus(
                    currentStatus
            );

        }


        // --------------------------------------------------------
        // Update timestamp
        // --------------------------------------------------------

        existingApplication.setLastUpdated(
                LocalDateTime.now()
        );


        // --------------------------------------------------------
        // Do not automatically flag follow-up
        // --------------------------------------------------------

        existingApplication.setNeedsFollowUp(
                false
        );


        return applicationRepository.save(
                existingApplication
        );
    }


    // ============================================================
    // DELETE APPLICATION
    // ============================================================

    public void deleteApplication(
            Long id,
            String userEmail
    ) {

        Application application =
                getApplicationById(
                        id,
                        userEmail
                );


        // --------------------------------------------------------
        // Delete status history first
        // --------------------------------------------------------

        List<StatusHistory> history =
                statusHistoryRepository
                        .findByApplicationId(id);


        if (
                history != null
                        && !history.isEmpty()
        ) {

            statusHistoryRepository.deleteAll(
                    history
            );

        }


        // --------------------------------------------------------
        // Delete application
        // --------------------------------------------------------

        applicationRepository.delete(
                application
        );
    }


    // ============================================================
    // CREATE STATUS HISTORY
    // ============================================================

    private void createStatusHistory(
            Application application,
            ApplicationStatus status
    ) {

        if (
                application == null
                        || status == null
        ) {

            return;
        }


        StatusHistory history =
                new StatusHistory();


        history.setApplication(
                application
        );


        history.setStatus(
                status
        );


        history.setChangedAt(
                LocalDateTime.now()
        );


        statusHistoryRepository.save(
                history
        );
    }


    // ============================================================
    // GET USER
    // ============================================================

    private User getUserByEmail(
            String email
    ) {

        if (
                email == null
                        || email.trim().isEmpty()
        ) {

            throw new RuntimeException(
                    "Authenticated user email is missing"
            );
        }


        return userRepository
                .findByEmail(
                        email
                )
                .orElseThrow(
                        () ->
                                new RuntimeException(
                                        "User not found: "
                                                + email
                                )
                );
    }


    // ============================================================
    // CLEAN STRING
    // ============================================================

    private String cleanString(
            String value
    ) {

        if (value == null) {
            return null;
        }


        String cleaned =
                value.trim();


        return cleaned.isEmpty()
                ? null
                : cleaned;
    }
}
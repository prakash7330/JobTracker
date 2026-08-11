package com.prakash.jobtracker.service;

import com.prakash.jobtracker.model.Application;
import com.prakash.jobtracker.model.Interview;
import com.prakash.jobtracker.model.User;
import com.prakash.jobtracker.repository.ApplicationRepository;
import com.prakash.jobtracker.repository.InterviewRepository;
import com.prakash.jobtracker.repository.UserRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class InterviewService {

    @Autowired
    private InterviewRepository interviewRepository;

    @Autowired
    private ApplicationRepository applicationRepository;

    @Autowired
    private UserRepository userRepository;


    // ============================================================
    // CREATE INTERVIEW
    // ============================================================

    public Interview createInterview(
            Interview interview,
            Long applicationId,
            String userEmail
    ) {

        User user = getUser(userEmail);

        Application application =
                getApplication(applicationId);

        // ========================================================
        // SECURITY CHECK
        // ========================================================

        checkApplicationOwnership(
                application,
                user
        );

        // ========================================================
        // VALIDATION
        // ========================================================

        if (interview.getInterviewDate() == null) {

            throw new RuntimeException(
                    "Interview date is required"
            );
        }

        // ========================================================
        // CONNECT INTERVIEW TO APPLICATION
        // ========================================================

        interview.setApplication(
                application
        );

        // ========================================================
        // TIMESTAMP
        // ========================================================

        interview.setCreatedAt(
                LocalDateTime.now()
        );

        interview.setUpdatedAt(
                LocalDateTime.now()
        );

        // ========================================================
        // SAVE
        // ========================================================

        Interview savedInterview =
                interviewRepository.save(
                        interview
                );

        /*
         * Force the application relationship to be loaded.
         * This makes companyName and roleTitle available when
         * the Interview object is returned to the frontend.
         */

        if (savedInterview.getApplication() != null) {

            savedInterview
                    .getApplication()
                    .getCompanyName();

            savedInterview
                    .getApplication()
                    .getRoleTitle();
        }

        return savedInterview;
    }


    // ============================================================
    // GET ALL INTERVIEWS FOR CURRENT USER
    // ============================================================

    @Transactional(readOnly = true)
    public List<Interview> getInterviewsByUser(
            String userEmail
    ) {

        User user =
                getUser(userEmail);

        List<Interview> interviews =
                interviewRepository
                        .findByApplicationUserIdOrderByInterviewDateAsc(
                                user.getId()
                        );

        initializeApplications(
                interviews
        );

        return interviews;
    }


    // ============================================================
    // GET UPCOMING INTERVIEWS
    // ============================================================

    @Transactional(readOnly = true)
    public List<Interview> getUpcomingInterviews(
            String userEmail
    ) {

        User user =
                getUser(userEmail);

        LocalDate today =
                LocalDate.now();

        List<Interview> interviews =
                interviewRepository
                        .findByApplicationUserIdAndInterviewDateGreaterThanEqualOrderByInterviewDateAsc(
                                user.getId(),
                                today
                        );

        initializeApplications(
                interviews
        );

        return interviews;
    }


    // ============================================================
    // GET INTERVIEWS FOR ONE APPLICATION
    // ============================================================

    @Transactional(readOnly = true)
    public List<Interview> getInterviewsByApplication(
            Long applicationId,
            String userEmail
    ) {

        User user =
                getUser(userEmail);

        Application application =
                getApplication(applicationId);

        checkApplicationOwnership(
                application,
                user
        );

        List<Interview> interviews =
                interviewRepository
                        .findByApplicationId(
                                applicationId
                        );

        initializeApplications(
                interviews
        );

        return interviews;
    }


    // ============================================================
    // GET INTERVIEW BY ID
    // ============================================================

    @Transactional(readOnly = true)
    public Interview getInterviewById(
            Long interviewId,
            String userEmail
    ) {

        User user =
                getUser(userEmail);

        Interview interview =
                interviewRepository
                        .findById(interviewId)
                        .orElseThrow(
                                () ->
                                        new RuntimeException(
                                                "Interview not found"
                                        )
                        );

        // ========================================================
        // SECURITY CHECK
        // ========================================================

        checkInterviewOwnership(
                interview,
                user
        );

        // ========================================================
        // FORCE APPLICATION INITIALIZATION
        // ========================================================

        initializeApplication(
                interview
        );

        return interview;
    }


    // ============================================================
    // UPDATE INTERVIEW
    // ============================================================

    public Interview updateInterview(
            Long interviewId,
            Interview updatedInterview,
            String userEmail
    ) {

        User user =
                getUser(userEmail);

        Interview existingInterview =
                interviewRepository
                        .findById(interviewId)
                        .orElseThrow(
                                () ->
                                        new RuntimeException(
                                                "Interview not found"
                                        )
                        );

        // ========================================================
        // SECURITY CHECK
        // ========================================================

        checkInterviewOwnership(
                existingInterview,
                user
        );

        // ========================================================
        // VALIDATION
        // ========================================================

        if (
                updatedInterview
                        .getInterviewDate()
                        == null
        ) {

            throw new RuntimeException(
                    "Interview date is required"
            );
        }

        // ========================================================
        // UPDATE INTERVIEW DETAILS
        // ========================================================

        existingInterview.setInterviewDate(
                updatedInterview
                        .getInterviewDate()
        );

        existingInterview.setInterviewTime(
                updatedInterview
                        .getInterviewTime()
        );

        existingInterview.setInterviewRound(
                updatedInterview
                        .getInterviewRound()
        );

        existingInterview.setInterviewType(
                updatedInterview
                        .getInterviewType()
        );

        /*
         * Meeting link is OPTIONAL.
         * Empty/null value is allowed.
         */

        existingInterview.setMeetingLink(
                updatedInterview
                        .getMeetingLink()
        );

        // ========================================================
        // UPDATE CONTACT DETAILS
        // ========================================================

        existingInterview.setContactName(
                updatedInterview
                        .getContactName()
        );

        existingInterview.setContactEmail(
                updatedInterview
                        .getContactEmail()
        );

        // ========================================================
        // UPDATE FOLLOW-UP
        // ========================================================

        existingInterview.setFollowUpDate(
                updatedInterview
                        .getFollowUpDate()
        );

        existingInterview.setFollowUpCompleted(
                updatedInterview
                        .isFollowUpCompleted()
        );

        existingInterview.setFollowUpNotes(
                updatedInterview
                        .getFollowUpNotes()
        );

        // ========================================================
        // UPDATE NOTES
        // ========================================================

        existingInterview.setNotes(
                updatedInterview
                        .getNotes()
        );

        // ========================================================
        // TIMESTAMP
        // ========================================================

        existingInterview.setUpdatedAt(
                LocalDateTime.now()
        );

        // ========================================================
        // SAVE
        // ========================================================

        Interview savedInterview =
                interviewRepository.save(
                        existingInterview
                );

        initializeApplication(
                savedInterview
        );

        return savedInterview;
    }


    // ============================================================
    // DELETE INTERVIEW
    // ============================================================

    public void deleteInterview(
            Long interviewId,
            String userEmail
    ) {

        User user =
                getUser(userEmail);

        Interview interview =
                interviewRepository
                        .findById(interviewId)
                        .orElseThrow(
                                () ->
                                        new RuntimeException(
                                                "Interview not found"
                                        )
                        );

        // ========================================================
        // SECURITY CHECK
        // ========================================================

        checkInterviewOwnership(
                interview,
                user
        );

        // ========================================================
        // DELETE
        // ========================================================

        interviewRepository.delete(
                interview
        );
    }


    // ============================================================
    // MARK FOLLOW-UP AS COMPLETED
    // ============================================================

    public Interview completeFollowUp(
            Long interviewId,
            String userEmail
    ) {

        User user =
                getUser(userEmail);

        Interview interview =
                interviewRepository
                        .findById(interviewId)
                        .orElseThrow(
                                () ->
                                        new RuntimeException(
                                                "Interview not found"
                                        )
                        );

        // ========================================================
        // SECURITY CHECK
        // ========================================================

        checkInterviewOwnership(
                interview,
                user
        );

        // ========================================================
        // COMPLETE FOLLOW-UP
        // ========================================================

        interview.setFollowUpCompleted(
                true
        );

        interview.setUpdatedAt(
                LocalDateTime.now()
        );

        Interview savedInterview =
                interviewRepository.save(
                        interview
                );

        initializeApplication(
                savedInterview
        );

        return savedInterview;
    }


    // ============================================================
    // GET PENDING FOLLOW-UPS
    // ============================================================

    @Transactional(readOnly = true)
    public List<Interview> getPendingFollowUps(
            String userEmail
    ) {

        User user =
                getUser(userEmail);

        LocalDate today =
                LocalDate.now();

        List<Interview> interviews =
                interviewRepository
                        .findByApplicationUserIdAndFollowUpDateLessThanEqualAndFollowUpCompletedFalse(
                                user.getId(),
                                today
                        );

        initializeApplications(
                interviews
        );

        return interviews;
    }


    // ============================================================
    // INITIALIZE APPLICATION FOR ONE INTERVIEW
    // ============================================================

    private void initializeApplication(
            Interview interview
    ) {

        if (
                interview == null ||
                        interview.getApplication() == null
        ) {
            return;
        }

        Application application =
                interview.getApplication();

        /*
         * Force Hibernate/JPA to load these values while
         * the transaction/session is still active.
         */

        application.getId();

        application.getCompanyName();

        application.getRoleTitle();

        application.getSource();

        application.getAppliedDate();

        application.getResumeVersion();

        application.getNotes();
    }


    // ============================================================
    // INITIALIZE APPLICATIONS
    // ============================================================

    private void initializeApplications(
            List<Interview> interviews
    ) {

        if (interviews == null) {
            return;
        }

        for (
                Interview interview :
                interviews
        ) {

            initializeApplication(
                    interview
            );
        }
    }


    // ============================================================
    // PRIVATE: GET USER
    // ============================================================

    private User getUser(
            String userEmail
    ) {

        return userRepository
                .findByEmail(userEmail)
                .orElseThrow(
                        () ->
                                new RuntimeException(
                                        "User not found"
                                )
                );
    }


    // ============================================================
    // PRIVATE: GET APPLICATION
    // ============================================================

    private Application getApplication(
            Long applicationId
    ) {

        return applicationRepository
                .findById(applicationId)
                .orElseThrow(
                        () ->
                                new RuntimeException(
                                        "Application not found"
                                )
                );
    }


    // ============================================================
    // PRIVATE: APPLICATION OWNERSHIP CHECK
    // ============================================================

    private void checkApplicationOwnership(
            Application application,
            User user
    ) {

        if (
                application == null ||
                        application.getUser() == null ||
                        !application
                                .getUser()
                                .getId()
                                .equals(
                                        user.getId()
                                )
        ) {

            throw new RuntimeException(
                    "You are not allowed to access this application"
            );
        }
    }


    // ============================================================
    // PRIVATE: INTERVIEW OWNERSHIP CHECK
    // ============================================================

    private void checkInterviewOwnership(
            Interview interview,
            User user
    ) {

        if (
                interview == null ||
                        interview.getApplication() == null ||
                        interview
                                .getApplication()
                                .getUser() == null ||
                        !interview
                                .getApplication()
                                .getUser()
                                .getId()
                                .equals(
                                        user.getId()
                                )
        ) {

            throw new RuntimeException(
                    "You are not allowed to access this interview"
            );
        }
    }
}
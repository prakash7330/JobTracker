package com.prakash.jobtracker.repository;

import com.prakash.jobtracker.model.Interview;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface InterviewRepository extends JpaRepository<Interview, Long> {

    // ============================================================
    // GET INTERVIEWS FOR AN APPLICATION
    // ============================================================

    List<Interview> findByApplicationId(Long applicationId);

    // ============================================================
    // GET UPCOMING INTERVIEWS
    // ============================================================

    List<Interview> findByApplicationUserIdAndInterviewDateGreaterThanEqualOrderByInterviewDateAsc(
            Long userId,
            LocalDate date
    );

    // ============================================================
    // GET ALL INTERVIEWS FOR A USER
    // ============================================================

    List<Interview> findByApplicationUserIdOrderByInterviewDateAsc(
            Long userId
    );

    // ============================================================
    // GET INTERVIEWS BY DATE
    // ============================================================

    List<Interview> findByApplicationUserIdAndInterviewDate(
            Long userId,
            LocalDate date
    );

    // ============================================================
    // GET PENDING FOLLOW-UPS
    // ============================================================

    List<Interview> findByApplicationUserIdAndFollowUpDateLessThanEqualAndFollowUpCompletedFalse(
            Long userId,
            LocalDate date
    );
}
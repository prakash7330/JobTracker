package com.prakash.jobtracker.repository;

import com.prakash.jobtracker.model.StatusHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface StatusHistoryRepository extends JpaRepository<StatusHistory, Long> {
    List<StatusHistory> findByApplicationId(Long applicationId);
}
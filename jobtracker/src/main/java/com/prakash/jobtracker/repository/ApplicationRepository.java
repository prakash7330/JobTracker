package com.prakash.jobtracker.repository;

import com.prakash.jobtracker.model.Application;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ApplicationRepository
        extends JpaRepository<Application, Long> {

    List<Application> findByUserId(Long userId);

    // Duplicate check when creating
    boolean existsByUserIdAndCompanyNameIgnoreCaseAndRoleTitleIgnoreCase(
            Long userId,
            String companyName,
            String roleTitle
    );

    // Duplicate check when editing
    // Excludes the application currently being edited
    boolean existsByUserIdAndCompanyNameIgnoreCaseAndRoleTitleIgnoreCaseAndIdNot(
            Long userId,
            String companyName,
            String roleTitle,
            Long id
    );
}
package com.prakash.jobtracker.service;

import com.prakash.jobtracker.model.Application;
import com.prakash.jobtracker.model.ApplicationStatus;
import com.prakash.jobtracker.repository.ApplicationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Component
public class FollowUpScheduler {

    @Autowired
    private ApplicationRepository applicationRepository;


    // Runs every day at 9 AM
    @Scheduled(cron = "0 0 9 * * *")
    public void flagStaleApplications() {

        List<Application> allApplications =
                applicationRepository.findAll();

        LocalDateTime cutoff =
                LocalDateTime.now().minusDays(14);


        for (Application app : allApplications) {

            // Safety check
            if (app.getCurrentStatus() == null) {
                continue;
            }


            // OFFER and REJECTED applications
            // do not need follow-up
            boolean isFinal =
                    app.getCurrentStatus() == ApplicationStatus.OFFER
                            || app.getCurrentStatus() == ApplicationStatus.REJECTED;


            if (isFinal) {

                app.setNeedsFollowUp(false);
                applicationRepository.save(app);

                continue;
            }


            // Check whether there has been
            // no update for 14 days
            boolean isStale =
                    app.getLastUpdated() != null
                            && app.getLastUpdated().isBefore(cutoff);


            if (isStale) {

                app.setNeedsFollowUp(true);

            } else {

                app.setNeedsFollowUp(false);

            }


            applicationRepository.save(app);
        }
    }
}
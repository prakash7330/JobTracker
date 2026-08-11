package com.prakash.jobtracker.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@Table(name = "interviews")
public class Interview {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ============================================================
    // APPLICATION
    // ============================================================

    @ManyToOne
    @JoinColumn(
            name = "application_id",
            nullable = false
    )
    @JsonIgnore
    private Application application;

    // ============================================================
    // INTERVIEW DETAILS
    // ============================================================

    @Column(
            name = "interview_date",
            nullable = false
    )
    private LocalDate interviewDate;

    @Column(name = "interview_time")
    private LocalTime interviewTime;

    @Column(name = "interview_round")
    private String interviewRound;

    @Column(name = "interview_type")
    private String interviewType;

    @Column(
            name = "meeting_link",
            length = 1000
    )
    private String meetingLink;

    // ============================================================
    // RECRUITER / CONTACT
    // ============================================================

    @Column(name = "contact_name")
    private String contactName;

    @Column(name = "contact_email")
    private String contactEmail;

    // ============================================================
    // FOLLOW-UP
    // ============================================================

    @Column(name = "follow_up_date")
    private LocalDate followUpDate;

    @Column(name = "follow_up_completed")
    private boolean followUpCompleted = false;

    @Column(
            name = "follow_up_notes",
            columnDefinition = "TEXT"
    )
    private String followUpNotes;

    // ============================================================
    // INTERVIEW NOTES
    // ============================================================

    @Column(
            name = "notes",
            columnDefinition = "TEXT"
    )
    private String notes;

    // ============================================================
    // TIMESTAMPS
    // ============================================================

    @Column(name = "created_at")
    private LocalDateTime createdAt =
            LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt =
            LocalDateTime.now();

    // ============================================================
    // GETTERS AND SETTERS
    // ============================================================

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    // ============================================================
    // APPLICATION
    // ============================================================

    @JsonIgnore
    public Application getApplication() {
        return application;
    }

    public void setApplication(
            Application application
    ) {
        this.application = application;
    }

    // ============================================================
    // COMPANY NAME
    // ============================================================

    /*
     * Sends the company name to the frontend
     * without exposing the complete Application object.
     */
    @JsonProperty("companyName")
    public String getCompanyName() {

        if (application == null) {
            return null;
        }

        return application.getCompanyName();
    }

    // ============================================================
    // ROLE TITLE
    // ============================================================

    /*
     * Sends the role title to the frontend
     * without exposing the complete Application object.
     */
    @JsonProperty("roleTitle")
    public String getRoleTitle() {

        if (application == null) {
            return null;
        }

        return application.getRoleTitle();
    }

    // ============================================================
    // INTERVIEW DATE
    // ============================================================

    public LocalDate getInterviewDate() {
        return interviewDate;
    }

    public void setInterviewDate(
            LocalDate interviewDate
    ) {
        this.interviewDate = interviewDate;
    }

    // ============================================================
    // INTERVIEW TIME
    // ============================================================

    public LocalTime getInterviewTime() {
        return interviewTime;
    }

    public void setInterviewTime(
            LocalTime interviewTime
    ) {
        this.interviewTime = interviewTime;
    }

    // ============================================================
    // INTERVIEW ROUND
    // ============================================================

    public String getInterviewRound() {
        return interviewRound;
    }

    public void setInterviewRound(
            String interviewRound
    ) {
        this.interviewRound = interviewRound;
    }

    // ============================================================
    // INTERVIEW TYPE
    // ============================================================

    public String getInterviewType() {
        return interviewType;
    }

    public void setInterviewType(
            String interviewType
    ) {
        this.interviewType = interviewType;
    }

    // ============================================================
    // MEETING LINK
    // ============================================================

    public String getMeetingLink() {
        return meetingLink;
    }

    public void setMeetingLink(
            String meetingLink
    ) {
        this.meetingLink = meetingLink;
    }

    // ============================================================
    // CONTACT NAME
    // ============================================================

    public String getContactName() {
        return contactName;
    }

    public void setContactName(
            String contactName
    ) {
        this.contactName = contactName;
    }

    // ============================================================
    // CONTACT EMAIL
    // ============================================================

    public String getContactEmail() {
        return contactEmail;
    }

    public void setContactEmail(
            String contactEmail
    ) {
        this.contactEmail = contactEmail;
    }

    // ============================================================
    // FOLLOW-UP DATE
    // ============================================================

    public LocalDate getFollowUpDate() {
        return followUpDate;
    }

    public void setFollowUpDate(
            LocalDate followUpDate
    ) {
        this.followUpDate = followUpDate;
    }

    // ============================================================
    // FOLLOW-UP COMPLETED
    // ============================================================

    public boolean isFollowUpCompleted() {
        return followUpCompleted;
    }

    public void setFollowUpCompleted(
            boolean followUpCompleted
    ) {
        this.followUpCompleted =
                followUpCompleted;
    }

    // ============================================================
    // FOLLOW-UP NOTES
    // ============================================================

    public String getFollowUpNotes() {
        return followUpNotes;
    }

    public void setFollowUpNotes(
            String followUpNotes
    ) {
        this.followUpNotes =
                followUpNotes;
    }

    // ============================================================
    // NOTES
    // ============================================================

    public String getNotes() {
        return notes;
    }

    public void setNotes(
            String notes
    ) {
        this.notes = notes;
    }

    // ============================================================
    // CREATED AT
    // ============================================================

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(
            LocalDateTime createdAt
    ) {
        this.createdAt = createdAt;
    }

    // ============================================================
    // UPDATED AT
    // ============================================================

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(
            LocalDateTime updatedAt
    ) {
        this.updatedAt = updatedAt;
    }
}
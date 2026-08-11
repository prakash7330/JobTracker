package com.prakash.jobtracker.model;

import jakarta.persistence.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "applications")
public class Application {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;


    // ============================================================
    // USER
    // ============================================================

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;


    // ============================================================
    // APPLICATION DETAILS
    // ============================================================

    @Column(name = "company_name", nullable = false)
    private String companyName;


    @Column(name = "role_title", nullable = false)
    private String roleTitle;


    @Enumerated(EnumType.STRING)
    private Source source;


    @Column(name = "resume_version")
    private String resumeVersion;


    @Enumerated(EnumType.STRING)
    @Column(name = "current_status")
    private ApplicationStatus currentStatus;


    @Column(name = "applied_date")
    private LocalDate appliedDate;


    @Column(name = "last_updated")
    private LocalDateTime lastUpdated = LocalDateTime.now();


    @Column(columnDefinition = "TEXT")
    private String notes;


    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();


    @Column(name = "needs_follow_up")
    private boolean needsFollowUp = false;


    // ============================================================
    // INTERVIEWS
    // ============================================================

    @OneToMany(
            mappedBy = "application",
            cascade = CascadeType.ALL,
            orphanRemoval = true
    )
    private List<Interview> interviews = new ArrayList<>();


    // ============================================================
    // GETTERS AND SETTERS
    // ============================================================

    public Long getId() {
        return id;
    }


    public void setId(Long id) {
        this.id = id;
    }


    public User getUser() {
        return user;
    }


    public void setUser(User user) {
        this.user = user;
    }


    public String getCompanyName() {
        return companyName;
    }


    public void setCompanyName(String companyName) {
        this.companyName = companyName;
    }


    public String getRoleTitle() {
        return roleTitle;
    }


    public void setRoleTitle(String roleTitle) {
        this.roleTitle = roleTitle;
    }


    public Source getSource() {
        return source;
    }


    public void setSource(Source source) {
        this.source = source;
    }


    public String getResumeVersion() {
        return resumeVersion;
    }


    public void setResumeVersion(String resumeVersion) {
        this.resumeVersion = resumeVersion;
    }


    public ApplicationStatus getCurrentStatus() {
        return currentStatus;
    }


    public void setCurrentStatus(ApplicationStatus currentStatus) {
        this.currentStatus = currentStatus;
    }


    public LocalDate getAppliedDate() {
        return appliedDate;
    }


    public void setAppliedDate(LocalDate appliedDate) {
        this.appliedDate = appliedDate;
    }


    public LocalDateTime getLastUpdated() {
        return lastUpdated;
    }


    public void setLastUpdated(LocalDateTime lastUpdated) {
        this.lastUpdated = lastUpdated;
    }


    public String getNotes() {
        return notes;
    }


    public void setNotes(String notes) {
        this.notes = notes;
    }


    public LocalDateTime getCreatedAt() {
        return createdAt;
    }


    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }


    public boolean isNeedsFollowUp() {
        return needsFollowUp;
    }


    public void setNeedsFollowUp(boolean needsFollowUp) {
        this.needsFollowUp = needsFollowUp;
    }


    // ============================================================
    // INTERVIEW GETTER / SETTER
    // ============================================================

    public List<Interview> getInterviews() {
        return interviews;
    }


    public void setInterviews(
            List<Interview> interviews
    ) {
        this.interviews = interviews;
    }


    // ============================================================
    // ADD INTERVIEW
    // ============================================================

    public void addInterview(
            Interview interview
    ) {

        interviews.add(interview);

        interview.setApplication(this);
    }


    // ============================================================
    // REMOVE INTERVIEW
    // ============================================================

    public void removeInterview(
            Interview interview
    ) {

        interviews.remove(interview);

        interview.setApplication(null);
    }
}
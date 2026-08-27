# JobTracker

A full-stack job application tracking system that helps users organize job applications, track application status, manage interviews, and follow up on applications that have been inactive for a defined period.

## 🌐 Live Application

**Frontend:**  
https://jobtracker-frontend-g2tv.onrender.com

**Backend API:**  
https://jobtracker-backend-47ef.onrender.com

**GitHub Repository:**  
https://github.com/prakash7330/JobTracker

---

## 📌 Overview

JobTracker is a full-stack web application designed to make the job search process easier to manage.

Instead of maintaining job applications in spreadsheets or notes, users can store their applications in one place and track their progress from application to interview and offer.

The application supports authentication, application management, interview tracking, follow-up reminders, and password recovery.

---

## ✨ Features

### 🔐 User Authentication

- User registration
- User login
- JWT-based authentication
- Secure password hashing using BCrypt
- Logout functionality
- Protected API endpoints
- Forgot password functionality
- Reset password functionality

### 💼 Job Application Management

Users can create and manage job applications with information such as:

- Company name
- Job role
- Application source
- Resume version
- Application status
- Applied date
- Notes
- Last updated date

Supported application sources include:

- LinkedIn
- Referral
- Direct application
- Other sources

### 📊 Application Status Tracking

Applications can be tracked through different stages of the hiring process.

Examples include:

- Applied
- Screening
- Interview
- Offer
- Rejected

This allows users to understand the current stage of every application.

### 🎯 Interview Tracking

Users can add interview information for an application, including:

- Company
- Role
- Interview date
- Interview time
- Interview round
- Interview type
- Meeting link
- Contact name
- Contact email
- Interview notes
- Follow-up date
- Follow-up status

### 🔔 Follow-Up Tracking

The application includes automatic follow-up detection.

Applications that have not been updated for a defined period can be marked as needing follow-up.

The backend uses Spring Scheduling to periodically check applications.

Final application statuses such as:

- Offer
- Rejected

are excluded from automatic follow-up detection.

### 📧 Password Recovery

Users can request a password reset through email.

The application uses Gmail SMTP for sending password recovery emails.

### 🗄️ Database Persistence

Application data is stored in a relational database.

For production, the backend uses:

- PostgreSQL
- Supabase

For local development, the application can use:

- MySQL

---

# 🛠️ Tech Stack

## Frontend

- HTML
- CSS
- JavaScript
- Chart.js
- Google Fonts

## Backend

- Java 17
- Spring Boot
- Spring MVC
- Spring Data JPA
- Spring Security
- Hibernate
- JWT
- Maven

## Database

### Production

- PostgreSQL
- Supabase

### Local Development

- MySQL

## Email

- Gmail SMTP

## Deployment

- GitHub
- Render
- Docker

---

# 🏗️ Application Architecture

```text
                         ┌──────────────────────┐
                         │      User / Browser  │
                         └──────────┬───────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │       Frontend       │
                         │   HTML/CSS/JS        │
                         └──────────┬───────────┘
                                    │
                              REST API / JWT
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │      Spring Boot     │
                         │       Backend        │
                         ├──────────────────────┤
                         │ Spring Security      │
                         │ JWT Authentication   │
                         │ Spring Data JPA      │
                         │ Hibernate             │
                         │ Follow-up Scheduler  │
                         └───────┬───────┬──────┘
                                 │       │
                     ┌───────────┘       └─────────────┐
                     ▼                                 ▼
          ┌──────────────────┐               ┌──────────────────┐
          │    PostgreSQL    │               │   Gmail SMTP     │
          │     Supabase     │               │ Password Reset   │
          └──────────────────┘               └──────────────────┘

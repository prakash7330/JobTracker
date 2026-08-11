/* ============================================================
   JOBTRACKER — COMPLETE DASHBOARD JAVASCRIPT
   FULL REPLACEMENT
   ============================================================ */

"use strict";

/* ============================================================
   CONFIGURATION
   ============================================================ */

const API_BASE = "https://jobtracker-backend-47ef.onrender.com/api";
const LOGIN_PAGE = "index.html";

const token = localStorage.getItem("jwt_token");
const storedEmail = localStorage.getItem("user_email");
const storedUserName = localStorage.getItem("user_name");

if (!token) {
    window.location.replace(LOGIN_PAGE);
}


/* ============================================================
   GLOBAL STATE
   ============================================================ */

let allApplications = [];
let allInterviews = [];

let applicationsMap = {};
let interviewsMap = {};

let showingStaleOnly = false;
let editingApplicationId = null;
let editingInterviewId = null;

let currentView = "dashboardView";

let statusChart = null;
let applicationsTrendChart = null;
let sourceChart = null;


/* ============================================================
   CONSTANTS
   ============================================================ */

const STATUS_LIST = [
    "APPLIED",
    "SCREENING",
    "INTERVIEW_1",
    "INTERVIEW_2",
    "OFFER",
    "REJECTED"
];

const STATUS_LABELS = {
    APPLIED: "Applied",
    SCREENING: "Screening",
    INTERVIEW_1: "Interview 1",
    INTERVIEW_2: "Interview 2",
    OFFER: "Offer",
    REJECTED: "Rejected"
};

const SOURCE_LABELS = {
    LINKEDIN: "LinkedIn",
    NAUKRI: "Naukri",
    REFERRAL: "Referral",
    DIRECT: "Direct",
    OTHER: "Other"
};


/* ============================================================
   DOM READY
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {

    initializeUser();

    initializeNavigation();

    initializeApplicationButtons();

    initializeApplicationForm();

    initializeEditApplicationForm();

    initializeApplicationFilters();

    initializeModalHandlers();

    initializeInterviewSystem();

    initializeFollowUpControls();

    initializeDashboardActions();

    initializeLogout();

    initializeFollowupRefresh();

    setDefaultApplicationDate();

    initializeViewState();

    loadAllData();

});


/* ============================================================
   USER INFORMATION
   ============================================================ */

function initializeUser() {

    // ========================================================
    // HEADER USER
    // ========================================================

    const userName =
        document.getElementById("userName");

    const userEmail =
        document.getElementById("userEmail");

    const userAvatar =
        document.getElementById("userAvatar");


    // ========================================================
    // WELCOME MESSAGE
    // ========================================================

    const welcomeName =
        document.getElementById("welcomeName");


    // ========================================================
    // SIDEBAR USER
    // ========================================================

    const sidebarUserName =
        document.getElementById(
            "sidebarUserName"
        );

    const sidebarUserEmail =
        document.getElementById(
            "sidebarUserEmail"
        );

    const sidebarUserAvatar =
        document.getElementById(
            "sidebarUserAvatar"
        );


    // ========================================================
    // GET USER INFORMATION
    // ========================================================

    const displayName =
        storedUserName ||
        (
            storedEmail
                ? storedEmail.split("@")[0]
                : "User"
        );


    const displayEmail =
        storedEmail ||
        "user@example.com";


    // ========================================================
    // HEADER
    // ========================================================

    if (userName) {

        userName.textContent =
            displayName;
    }


    if (userEmail) {

        userEmail.textContent =
            displayEmail;
    }


    if (userAvatar) {

        userAvatar.textContent =
            displayName
                .trim()
                .charAt(0)
                .toUpperCase() ||
            "U";
    }


    // ========================================================
    // WELCOME
    // ========================================================

    if (welcomeName) {

        welcomeName.textContent =
            displayName;
    }


    // ========================================================
    // SIDEBAR
    // ========================================================

    if (sidebarUserName) {

        sidebarUserName.textContent =
            displayName;
    }


    if (sidebarUserEmail) {

        sidebarUserEmail.textContent =
            displayEmail;
    }


    if (sidebarUserAvatar) {

        sidebarUserAvatar.textContent =
            displayName
                .trim()
                .charAt(0)
                .toUpperCase() ||
            "U";
    }
}


/* ============================================================
   API HELPER
   ============================================================ */

async function apiCall(path, options = {}) {

    const headers = {
        "Authorization": "Bearer " + (
            localStorage.getItem("jwt_token") || ""
        ),
        ...(options.headers || {})
    };

    if (
        options.body &&
        !headers["Content-Type"]
    ) {
        headers["Content-Type"] = "application/json";
    }

    let response;

    try {

        response = await fetch(
            API_BASE + path,
            {
                ...options,
                headers
            }
        );

    } catch (error) {

        throw new Error(
            "Unable to connect to Spring Boot. " +
            "Make sure the backend is running on port 8080."
        );
    }

    if (
        response.status === 401 ||
        response.status === 403
    ) {

        localStorage.removeItem("jwt_token");
        localStorage.removeItem("user_id");
        localStorage.removeItem("user_email");
        localStorage.removeItem("user_name");

        window.location.replace(LOGIN_PAGE);

        return null;
    }

    const rawText = await response.text();

    let data = null;

    if (rawText) {

        try {
            data = JSON.parse(rawText);
        } catch {
            data = rawText;
        }
    }

    if (!response.ok) {

        let message =
            "Request failed (" +
            response.status +
            ")";

        if (
            typeof data === "string" &&
            data.trim()
        ) {
            message = data;
        }

        if (
            data &&
            typeof data === "object"
        ) {

            message =
                data.message ||
                data.error ||
                data.detail ||
                message;
        }

        throw new Error(message);
    }

    return data;
}


/* ============================================================
   LOAD EVERYTHING
   ============================================================ */

async function loadAllData() {

    await Promise.allSettled([
        loadApplications(),
        loadInterviews()
    ]);

    updateDashboardStats();

    renderDashboard();

    applyFiltersAndRender();

    renderInterviewsView();

    renderFollowupsView();

    renderAnalytics();

}


/* ============================================================
   APPLICATIONS — LOAD
   ============================================================ */

async function loadApplications() {

    try {

        const endpoint =
            showingStaleOnly
                ? "/applications/stale"
                : "/applications";


        const data =
            await apiCall(endpoint);


        allApplications =
            Array.isArray(data)
                ? data
                : [];


        /*
         * IMPORTANT:
         * Build the application map BEFORE rendering
         * interviews because interviews use applicationId.
         */

        rebuildApplicationMap();


        updateDashboardStats();

        applyFiltersAndRender();

        renderDashboard();

        renderFollowupsView();

        renderAnalytics();


        /*
         * IMPORTANT FIX:
         * Applications may finish loading after interviews.
         * Re-render interviews now that application data
         * is available.
         */

        renderInterviewsView();


    } catch (error) {

        console.error(
            "Failed to load applications:",
            error
        );


        allApplications = [];

        applicationsMap = {};


        updateDashboardStats();

        applyFiltersAndRender();

        renderDashboard();

        renderInterviewsView();

        renderAnalytics();


        showGlobalError(
            "Applications could not be loaded: " +
            error.message
        );

    }

}


function rebuildApplicationMap() {

    applicationsMap = {};

    allApplications.forEach(application => {

        if (
            application &&
            application.id != null
        ) {

            applicationsMap[
                application.id
            ] = application;
        }
    });
}


/* ============================================================
   INTERVIEW → APPLICATION RESOLVER
   FIX: COMPANY NAME + ROLE SHOWING UNKNOWN
   ============================================================ */

function getInterviewApplication(interview) {

    if (!interview) {
        return {};
    }

    /*
     * 1. Direct nested application object
     */
    const directApplication =
        interview.application ||
        interview.jobApplication ||
        interview.applicationData ||
        null;

    if (
        directApplication &&
        typeof directApplication === "object"
    ) {

        const directId =
            directApplication.id ??
            directApplication.applicationId;

        if (directId != null) {

            const mappedApplication =
                applicationsMap[directId] ||
                applicationsMap[String(directId)];

            if (mappedApplication) {
                return mappedApplication;
            }
        }

        if (
            directApplication.companyName ||
            directApplication.roleTitle ||
            directApplication.company ||
            directApplication.role
        ) {
            return directApplication;
        }
    }


    /*
     * 2. Try every possible application ID field
     * returned by the backend.
     */
    const possibleApplicationIds = [

        interview.applicationId,

        interview.applicationID,

        interview.application_id,

        interview.jobApplicationId,

        interview.jobApplicationID,

        interview.job_application_id,

        interview.application?.id,

        interview.application?.applicationId,

        interview.application?.applicationID,

        interview.jobApplication?.id,

        interview.jobApplication?.applicationId
    ];


    for (
        const applicationId
        of possibleApplicationIds
    ) {

        if (
            applicationId === null ||
            applicationId === undefined ||
            applicationId === ""
        ) {
            continue;
        }


        const application =
            applicationsMap[applicationId] ||
            applicationsMap[String(applicationId)];


        if (application) {
            return application;
        }


        const matched =
            allApplications.find(
                item =>
                    String(
                        item.id
                    ) === String(
                        applicationId
                    ) ||
                    String(
                        item.applicationId
                    ) === String(
                        applicationId
                    )
            );


        if (matched) {
            return matched;
        }
    }


    /*
     * 3. If backend sends company/role directly,
     * use them to find the application.
     */
    const interviewCompany =
        String(
            interview.companyName ??
            interview.company ??
            interview.company_name ??
            ""
        )
            .trim()
            .toLowerCase();


    const interviewRole =
        String(
            interview.roleTitle ??
            interview.role ??
            interview.jobTitle ??
            interview.position ??
            interview.role_title ??
            ""
        )
            .trim()
            .toLowerCase();


    if (
        interviewCompany ||
        interviewRole
    ) {

        const matched =
            allApplications.find(
                application => {

                    const company =
                        String(
                            application.companyName ??
                            application.company ??
                            ""
                        )
                            .trim()
                            .toLowerCase();


                    const role =
                        String(
                            application.roleTitle ??
                            application.role ??
                            application.jobTitle ??
                            ""
                        )
                            .trim()
                            .toLowerCase();


                    if (
                        interviewCompany &&
                        interviewRole
                    ) {

                        return (
                            company ===
                                interviewCompany &&
                            role ===
                                interviewRole
                        );
                    }


                    if (interviewCompany) {
                        return (
                            company ===
                            interviewCompany
                        );
                    }


                    if (interviewRole) {
                        return (
                            role ===
                            interviewRole
                        );
                    }


                    return false;
                }
            );


        if (matched) {
            return matched;
        }
    }


    return {};
}



/* ============================================================
   INTERVIEWS — LOAD
   FIXED VERSION
   ============================================================ */

async function loadInterviews() {

    try {

        const data =
            await apiCall("/interviews");


        allInterviews =
            Array.isArray(data)
                ? data
                : [];


        /*
         * Rebuild application map first.
         */
        rebuildApplicationMap();


        /*
         * Attach the correct application information
         * to every interview.
         */
        allInterviews =
            allInterviews.map(
                interview => {

                    const application =
                        getInterviewApplication(
                            interview
                        );


                    if (
                        application &&
                        Object.keys(
                            application
                        ).length > 0
                    ) {

                        return {

                            ...interview,

                            applicationId:
                                interview.applicationId ??
                                interview.applicationID ??
                                interview.application_id ??
                                interview.jobApplicationId ??
                                application.id,

                            application:

                                interview.application ||
                                application,

                            companyName:
                                interview.companyName ||
                                interview.company ||
                                application.companyName ||
                                application.company ||
                                "",

                            roleTitle:
                                interview.roleTitle ||
                                interview.role ||
                                interview.jobTitle ||
                                application.roleTitle ||
                                application.role ||
                                ""
                        };
                    }


                    return interview;
                }
            );


        rebuildInterviewMap();


        updateDashboardStats();

        renderDashboard();

        renderInterviewsView();

        renderFollowupsView();


    } catch (error) {

        console.error(
            "Failed to load interviews:",
            error
        );


        allInterviews = [];

        interviewsMap = {};


        updateDashboardStats();

        renderDashboard();

        renderInterviewsView();

        renderFollowupsView();


        showGlobalError(
            "Interviews could not be loaded: " +
            error.message
        );
    }
}


function rebuildInterviewMap() {

    interviewsMap = {};

    allInterviews.forEach(interview => {

        if (
            interview &&
            interview.id != null
        ) {

            interviewsMap[
                interview.id
            ] = interview;
        }
    });
}


/* ============================================================
   APPLICATION BUTTONS
   ============================================================ */

function initializeApplicationButtons() {

    const ids = [
        "headerNewApplicationBtn",
        "dashboardNewApplicationBtn",
        "applicationsNewBtn",
        "emptyNewApplicationBtn",
        "mobileEmptyNewApplicationBtn",
        "mobileFloatingAction",
        "mobileAddApplicationBtn",
        "mobileNewApplicationBtn"
    ];

    ids.forEach(id => {

        const button =
            document.getElementById(id);

        if (!button) {
            return;
        }

        if (
            button.dataset.applicationButtonInitialized ===
            "true"
        ) {
            return;
        }

        button.dataset.applicationButtonInitialized =
            "true";

        button.addEventListener(
            "click",
            event => {

                event.preventDefault();
                event.stopPropagation();

                openApplicationModal();

            }
        );

    });


    /*
     * Extra protection for the mobile floating +
     * button even if its HTML does not have an ID.
     */

    document
        .querySelectorAll(
            ".mobile-floating-action, .mobile-add-button, .mobile-plus-button"
        )
        .forEach(button => {

            if (
                button.dataset.applicationButtonInitialized ===
                "true"
            ) {
                return;
            }

            button.dataset.applicationButtonInitialized =
                "true";

            button.addEventListener(
                "click",
                event => {

                    event.preventDefault();
                    event.stopPropagation();

                    openApplicationModal();

                }
            );

        });

}


/* ============================================================
   ADD APPLICATION MODAL
   ============================================================ */

function openApplicationModal(
    application = null
) {

    const overlay =
        document.getElementById(
            "modalOverlay"
        );

    const form =
        document.getElementById(
            "addForm"
        );

    const title =
        document.getElementById(
            "modalTitle"
        );

    const error =
        document.getElementById(
            "modalError"
        );

    if (!overlay || !form) {
        return;
    }

    editingApplicationId =
        application
            ? application.id
            : null;

    form.reset();

    if (error) {
        error.textContent = "";
    }

    if (application) {

        if (title) {
            title.textContent =
                "Edit Application";
        }

        setInputValue(
            "companyInput",
            application.companyName
        );

        setInputValue(
            "roleInput",
            application.roleTitle
        );

        setInputValue(
            "sourceInput",
            application.source || "OTHER"
        );

        setInputValue(
            "resumeInput",
            application.resumeVersion
        );

        setInputValue(
            "dateInput",
            application.appliedDate
        );

        setInputValue(
            "notesInput",
            application.notes
        );

    } else {

        if (title) {
            title.textContent =
                "Add Application";
        }

        setDefaultApplicationDate();
    }

    overlay.style.display = "flex";

    document.body.classList.add(
        "modal-open"
    );

    setTimeout(() => {

        const companyInput =
            document.getElementById(
                "companyInput"
            );

        if (companyInput) {
            companyInput.focus();
        }

    }, 50);
}


function closeApplicationModal() {

    const overlay =
        document.getElementById(
            "modalOverlay"
        );

    const form =
        document.getElementById(
            "addForm"
        );

    const title =
        document.getElementById(
            "modalTitle"
        );

    const error =
        document.getElementById(
            "modalError"
        );

    if (overlay) {
        overlay.style.display = "none";
    }

    if (form) {
        form.reset();
    }

    if (title) {
        title.textContent =
            "Add Application";
    }

    if (error) {
        error.textContent = "";
    }

    editingApplicationId = null;

    document.body.classList.remove(
        "modal-open"
    );

    setDefaultApplicationDate();
}


/* ============================================================
   ADD APPLICATION FORM
   ============================================================ */

function initializeApplicationForm() {

    const form =
        document.getElementById(
            "addForm"
        );

    if (!form) {
        return;
    }

    form.addEventListener(
        "submit",
        async event => {

            event.preventDefault();

            await saveApplication();

        }
    );
}


async function saveApplication() {

    const companyName =
        getInputValue("companyInput");

    const roleTitle =
        getInputValue("roleInput");

    const source =
        getInputValue("sourceInput");

    const resumeVersion =
        getInputValue("resumeInput");

    const appliedDate =
        getInputValue("dateInput");

    const notes =
        getInputValue("notesInput");

    const errorElement =
        document.getElementById(
            "modalError"
        );

    if (!companyName) {

        showModalError(
            errorElement,
            "Company name is required."
        );

        return;
    }

    if (!roleTitle) {

        showModalError(
            errorElement,
            "Role title is required."
        );

        return;
    }

    if (!appliedDate) {

        showModalError(
            errorElement,
            "Applied date is required."
        );

        return;
    }

    const submitButton =
        document.querySelector(
            "#addForm button[type='submit']"
        );

    const isEditing =
        editingApplicationId != null;

    setButtonLoading(
        submitButton,
        true,
        isEditing
            ? "Saving..."
            : "Adding..."
    );

    try {

        const payload = {
            companyName,
            roleTitle,
            source: source || "OTHER",
            resumeVersion:
                resumeVersion || null,
            appliedDate,
            notes: notes || null
        };

        if (isEditing) {

            const existing =
                applicationsMap[
                    editingApplicationId
                ];

            payload.currentStatus =
                existing &&
                existing.currentStatus
                    ? existing.currentStatus
                    : "APPLIED";

            await apiCall(
                "/applications/" +
                editingApplicationId,
                {
                    method: "PUT",
                    body:
                        JSON.stringify(payload)
                }
            );

            showToast(
                "Application updated successfully.",
                "success"
            );

        } else {

            await apiCall(
                "/applications",
                {
                    method: "POST",
                    body:
                        JSON.stringify(payload)
                }
            );

            showToast(
                "Application added successfully.",
                "success"
            );
        }

        closeApplicationModal();

        showingStaleOnly = false;

        await loadApplications();

        await loadInterviews();

    } catch (error) {

        console.error(
            "Save application failed:",
            error
        );

        showModalError(
            errorElement,
            error.message
        );

    } finally {

        setButtonLoading(
            submitButton,
            false,
            isEditing
                ? "Save Changes"
                : "Save Application"
        );
    }
}


/* ============================================================
   APPLICATION FILTERS
   ============================================================ */

function initializeApplicationFilters() {

    const ids = [
        "searchInput",
        "statusFilter",
        "sourceFilter",
        "sortFilter"
    ];

    ids.forEach(id => {

        const element =
            document.getElementById(id);

        if (!element) {
            return;
        }

        element.addEventListener(
            "input",
            applyFiltersAndRender
        );

        element.addEventListener(
            "change",
            applyFiltersAndRender
        );
    });

    const clearButton =
        document.getElementById(
            "clearFiltersBtn"
        );

    if (clearButton) {

        clearButton.addEventListener(
            "click",
            clearFilters
        );
    }

    const staleButton =
        document.getElementById(
            "staleBtn"
        );

    if (staleButton) {

        staleButton.addEventListener(
            "click",
            toggleStaleApplications
        );
    }

    const checkButton =
        document.getElementById(
            "checkBtn"
        );

    if (checkButton) {

        checkButton.addEventListener(
            "click",
            runFollowupCheck
        );
    }
}


function clearFilters() {

    const search =
        document.getElementById(
            "searchInput"
        );

    const status =
        document.getElementById(
            "statusFilter"
        );

    const source =
        document.getElementById(
            "sourceFilter"
        );

    const sort =
        document.getElementById(
            "sortFilter"
        );

    if (search) {
        search.value = "";
    }

    if (status) {
        status.value = "ALL";
    }

    if (source) {
        source.value = "ALL";
    }

    if (sort) {
        sort.value = "DATE_DESC";
    }

    showingStaleOnly = false;

    updateStaleButton();

    applyFiltersAndRender();
}


async function toggleStaleApplications() {

    showingStaleOnly =
        !showingStaleOnly;

    updateStaleButton();

    await loadApplications();
}


function updateStaleButton() {

    const button =
        document.getElementById(
            "staleBtn"
        );

    if (!button) {
        return;
    }

    button.textContent =
        showingStaleOnly
            ? "Show all"
            : "Follow-ups only";
}


async function runFollowupCheck() {

    const button =
        document.getElementById(
            "checkBtn"
        );

    setButtonLoading(
        button,
        true,
        "Checking..."
    );

    try {

        await apiCall(
            "/applications/run-followup-check",
            {
                method: "POST"
            }
        );

        showToast(
            "Follow-up check completed.",
            "success"
        );

        await loadApplications();

    } catch (error) {

        showToast(
            error.message,
            "error"
        );

    } finally {

        setButtonLoading(
            button,
            false,
            "↻ Check follow-ups"
        );
    }
}


/* ============================================================
   FILTER + RENDER
   ============================================================ */

function applyFiltersAndRender() {

    const searchInput =
        document.getElementById(
            "searchInput"
        );

    const statusFilter =
        document.getElementById(
            "statusFilter"
        );

    const sourceFilter =
        document.getElementById(
            "sourceFilter"
        );

    const sortFilter =
        document.getElementById(
            "sortFilter"
        );

    const search =
        searchInput
            ? searchInput.value
                .trim()
                .toLowerCase()
            : "";

    const selectedStatus =
        statusFilter
            ? statusFilter.value
            : "ALL";

    const selectedSource =
        sourceFilter
            ? sourceFilter.value
            : "ALL";

    const selectedSort =
        sortFilter
            ? sortFilter.value
            : "DATE_DESC";

    let filtered =
        [...allApplications];

    if (search) {

        filtered =
            filtered.filter(
                application => {

                    const company =
                        String(
                            application.companyName || ""
                        ).toLowerCase();

                    const role =
                        String(
                            application.roleTitle || ""
                        ).toLowerCase();

                    const notes =
                        String(
                            application.notes || ""
                        ).toLowerCase();

                    return (
                        company.includes(search) ||
                        role.includes(search) ||
                        notes.includes(search)
                    );
                }
            );
    }

    if (
        selectedStatus &&
        selectedStatus !== "ALL"
    ) {

        filtered =
            filtered.filter(
                application =>
                    (
                        application.currentStatus ||
                        "APPLIED"
                    ) === selectedStatus
            );
    }

    if (
        selectedSource &&
        selectedSource !== "ALL"
    ) {

        filtered =
            filtered.filter(
                application =>
                    (
                        application.source ||
                        "OTHER"
                    ) === selectedSource
            );
    }

    filtered.sort((a, b) => {

        switch (selectedSort) {

            case "DATE_ASC":
                return compareDates(
                    a.appliedDate,
                    b.appliedDate
                );

            case "COMPANY_ASC":
                return String(
                    a.companyName || ""
                ).localeCompare(
                    String(
                        b.companyName || ""
                    )
                );

            case "COMPANY_DESC":
                return String(
                    b.companyName || ""
                ).localeCompare(
                    String(
                        a.companyName || ""
                    )
                );

            case "DATE_DESC":
            default:
                return compareDates(
                    b.appliedDate,
                    a.appliedDate
                );
        }
    });

    renderApplicationsTable(filtered);

    updateResultsCount(
        filtered.length
    );
}


/* ============================================================
   APPLICATION TABLE
   ============================================================ */

function renderApplicationsTable(
    applications
) {

    const tableBody =
        document.getElementById(
            "tableBody"
        );

    const emptyState =
        document.getElementById(
            "emptyState"
        );

    const mobileApplications =
        document.getElementById(
            "mobileApplications"
        );

    const mobileEmptyState =
        document.getElementById(
            "mobileEmptyState"
        );

    if (!tableBody) {
        return;
    }

    tableBody.innerHTML = "";

    if (mobileApplications) {
        mobileApplications.innerHTML = "";
    }

    applicationsMap = {};

    applications.forEach(
        application => {

            if (
                application &&
                application.id != null
            ) {

                applicationsMap[
                    application.id
                ] = application;
            }
        }
    );

    if (
        !applications ||
        applications.length === 0
    ) {

        if (emptyState) {
            emptyState.style.display = "block";
        }

        if (mobileEmptyState) {
            mobileEmptyState.style.display = "block";
        }

        return;
    }

    if (emptyState) {
        emptyState.style.display = "none";
    }

    if (mobileEmptyState) {
        mobileEmptyState.style.display = "none";
    }

    applications.forEach(
        application => {

            tableBody.appendChild(
                createApplicationRow(
                    application
                )
            );

            if (mobileApplications) {

                mobileApplications.appendChild(
                    createApplicationCard(
                        application
                    )
                );
            }
        }
    );
}


/* ============================================================
   APPLICATION TABLE ROW
   ============================================================ */

function createApplicationRow(
    application
) {

    const row =
        document.createElement("tr");

    const status =
        application.currentStatus ||
        "APPLIED";

    const source =
        application.source ||
        "OTHER";

    const statusOptions =
        STATUS_LIST
            .map(value => `
                <option
                    value="${escapeAttribute(value)}"
                    ${
                        value === status
                            ? "selected"
                            : ""
                    }
                >
                    ${escapeHTML(
                        STATUS_LABELS[value]
                    )}
                </option>
            `)
            .join("");

    const notes =
        application.notes &&
        String(
            application.notes
        ).trim()
            ? `
                <button
                    type="button"
                    class="notes-text"
                    data-action="notes"
                    data-id="${application.id}"
                >
                    View
                </button>
              `
            : "-";

    const followUp =
        application.needsFollowUp
            ? `
                <span class="followup-flag">
                    ● Follow up
                </span>
              `
            : "-";

    row.innerHTML = `

        <td>
            <div class="company-cell">
                ${escapeHTML(
                    application.companyName ||
                    "Unknown"
                )}
            </div>
        </td>

        <td>
            ${escapeHTML(
                application.roleTitle ||
                "-"
            )}
        </td>

        <td>
            <span class="source-badge">
                ${escapeHTML(
                    SOURCE_LABELS[source] ||
                    source
                )}
            </span>
        </td>

        <td>
            ${formatDate(
                application.appliedDate
            )}
        </td>

        <td>
            ${escapeHTML(
                application.resumeVersion ||
                "-"
            )}
        </td>

        <td>
            <select
                class="status-select"
                data-action="status"
                data-id="${application.id}"
            >
                ${statusOptions}
            </select>
        </td>

        <td>
            ${notes}
        </td>

        <td>
            ${followUp}
        </td>

        <td>
            <button
                type="button"
                class="table-action"
                data-action="history"
                data-id="${application.id}"
            >
                History
            </button>
        </td>

        <td>
            <button
                type="button"
                class="table-action"
                data-action="edit"
                data-id="${application.id}"
            >
                Edit
            </button>
        </td>

        <td>
            <button
                type="button"
                class="table-action danger"
                data-action="delete"
                data-id="${application.id}"
            >
                Delete
            </button>
        </td>

    `;

    attachApplicationRowEvents(row);

    return row;
}


/* ============================================================
   MOBILE APPLICATION CARD
   ============================================================ */

function createApplicationCard(
    application
) {

    const card =
        document.createElement("article");

    card.className =
        "application-card";

    const status =
        application.currentStatus ||
        "APPLIED";

    const source =
        application.source ||
        "OTHER";


    const statusOptions =
        STATUS_LIST
            .map(value => `

                <option
                    value="${escapeAttribute(value)}"
                    ${
                        value === status
                            ? "selected"
                            : ""
                    }
                >
                    ${escapeHTML(
                        STATUS_LABELS[value]
                    )}
                </option>

            `)
            .join("");


    card.innerHTML = `

        <div class="application-card-header">

            <div>

                <strong>
                    ${escapeHTML(
                        application.companyName ||
                        "Unknown"
                    )}
                </strong>

                <span>
                    ${escapeHTML(
                        application.roleTitle ||
                        "-"
                    )}
                </span>

            </div>


            <div
                class="mobile-status-control"
            >

                <!-- CHANGEABLE STATUS -->

                <select
                    class="status-select mobile-status-select"
                    data-action="status"
                    data-id="${application.id}"
                    aria-label="Change application status"
                >

                    ${statusOptions}

                </select>


                <!-- CURRENT STATUS -->

                <span
                    class="
                        status-badge
                        mobile-status-badge
                        status-${escapeAttribute(status)}
                    "
                    id="mobile-badge-${application.id}"
                >

                    ${escapeHTML(
                        STATUS_LABELS[status] ||
                        status
                    )}

                </span>

            </div>

        </div>


        <div class="application-card-grid">

            <div>

                <small>
                    Source
                </small>

                <strong>
                    ${escapeHTML(
                        SOURCE_LABELS[source] ||
                        source
                    )}
                </strong>

            </div>


            <div>

                <small>
                    Applied
                </small>

                <strong>
                    ${formatDate(
                        application.appliedDate
                    )}
                </strong>

            </div>


            <div>

                <small>
                    Resume
                </small>

                <strong>
                    ${escapeHTML(
                        application.resumeVersion ||
                        "-"
                    )}
                </strong>

            </div>


            <div>

                <small>
                    Follow-up
                </small>

                <strong>
                    ${
                        application.needsFollowUp
                            ? "Required"
                            : "No"
                    }
                </strong>

            </div>

        </div>


        <div class="application-card-actions">

            <button
                type="button"
                class="button button-secondary"
                data-action="edit"
                data-id="${application.id}"
            >
                Edit
            </button>


            <button
                type="button"
                class="button button-secondary"
                data-action="history"
                data-id="${application.id}"
            >
                History
            </button>


            <button
                type="button"
                class="button button-danger"
                data-action="delete"
                data-id="${application.id}"
            >
                Delete
            </button>

        </div>

    `;


    attachApplicationRowEvents(card);


    return card;
}


/* ============================================================
   APPLICATION EVENTS
   ============================================================ */

function attachApplicationRowEvents(
    container
) {

    container
        .querySelectorAll(
            "[data-action]"
        )
        .forEach(element => {

            if (
                element.dataset.action ===
                "status"
            ) {
                return;
            }

            element.addEventListener(
                "click",
                async event => {

                    event.preventDefault();

                    const action =
                        element.dataset.action;

                    const id =
                        Number(
                            element.dataset.id
                        );

                    await handleApplicationAction(
                        action,
                        id
                    );
                }
            );
        });

    container
        .querySelectorAll(
            "[data-action='status']"
        )
        .forEach(select => {

            select.addEventListener(
                "change",
                async () => {

                    const id =
                        Number(
                            select.dataset.id
                        );

                    await updateApplicationStatus(
                        id,
                        select.value
                    );
                }
            );
        });
}


async function handleApplicationAction(
    action,
    id
) {

    const application =
        applicationsMap[id];

    if (!application) {
        return;
    }

    switch (action) {

        case "edit":
            openEditApplicationModal(
                application
            );
            break;

        case "delete":
            await deleteApplication(
                application
            );
            break;

        case "notes":
            openNotesModal(
                application
            );
            break;

        case "history":
            await openHistoryModal(
                application
            );
            break;
    }
}


/* ============================================================
   EDIT APPLICATION
   ============================================================ */

function openEditApplicationModal(
    application
) {

    const overlay =
        document.getElementById(
            "editModalOverlay"
        );

    if (!overlay) {
        return;
    }

    editingApplicationId =
        application.id;

    setInputValue(
        "editCompanyInput",
        application.companyName
    );

    setInputValue(
        "editRoleInput",
        application.roleTitle
    );

    setInputValue(
        "editSourceInput",
        application.source || "OTHER"
    );

    setInputValue(
        "editResumeInput",
        application.resumeVersion
    );

    setInputValue(
        "editDateInput",
        application.appliedDate
    );

    setInputValue(
        "editNotesInput",
        application.notes
    );

    const error =
        document.getElementById(
            "editModalError"
        );

    if (error) {
        error.textContent = "";
    }

    overlay.style.display = "flex";

    document.body.classList.add(
        "modal-open"
    );
}


function initializeEditApplicationForm() {

    const form =
        document.getElementById(
            "editForm"
        );

    if (!form) {
        return;
    }

    form.addEventListener(
        "submit",
        async event => {

            event.preventDefault();

            await saveEditedApplication();

        }
    );
}


async function saveEditedApplication() {

    if (!editingApplicationId) {
        return;
    }

    const companyName =
        getInputValue(
            "editCompanyInput"
        );

    const roleTitle =
        getInputValue(
            "editRoleInput"
        );

    const source =
        getInputValue(
            "editSourceInput"
        );

    const resumeVersion =
        getInputValue(
            "editResumeInput"
        );

    const appliedDate =
        getInputValue(
            "editDateInput"
        );

    const notes =
        getInputValue(
            "editNotesInput"
        );

    const errorElement =
        document.getElementById(
            "editModalError"
        );

    if (!companyName) {

        showModalError(
            errorElement,
            "Company name is required."
        );

        return;
    }

    if (!roleTitle) {

        showModalError(
            errorElement,
            "Role title is required."
        );

        return;
    }

    if (!appliedDate) {

        showModalError(
            errorElement,
            "Applied date is required."
        );

        return;
    }

    const existing =
        applicationsMap[
            editingApplicationId
        ];

    const payload = {

        companyName,

        roleTitle,

        source:
            source || "OTHER",

        resumeVersion:
            resumeVersion || null,

        appliedDate,

        currentStatus:
            existing &&
            existing.currentStatus
                ? existing.currentStatus
                : "APPLIED",

        notes:
            notes || null
    };

    const submitButton =
        document.querySelector(
            "#editForm button[type='submit']"
        );

    setButtonLoading(
        submitButton,
        true,
        "Saving..."
    );

    try {

        await apiCall(
            "/applications/" +
            editingApplicationId,
            {
                method: "PUT",
                body:
                    JSON.stringify(payload)
            }
        );

        closeEditApplicationModal();

        showToast(
            "Application updated successfully.",
            "success"
        );

        await loadApplications();

    } catch (error) {

        console.error(
            "Edit application failed:",
            error
        );

        showModalError(
            errorElement,
            error.message
        );

    } finally {

        setButtonLoading(
            submitButton,
            false,
            "Save Changes"
        );
    }
}


function closeEditApplicationModal() {

    const overlay =
        document.getElementById(
            "editModalOverlay"
        );

    if (overlay) {
        overlay.style.display = "none";
    }

    editingApplicationId = null;

    document.body.classList.remove(
        "modal-open"
    );
}


/* ============================================================
   UPDATE APPLICATION STATUS
   ============================================================ */

async function updateApplicationStatus(
    id,
    status
) {

    if (!id || !status) {
        return;
    }

    try {

        await apiCall(
            "/applications/" +
            id +
            "/status?status=" +
            encodeURIComponent(status),
            {
                method: "PUT"
            }
        );

        showToast(
            "Application status updated.",
            "success"
        );

        await loadApplications();

    } catch (error) {

        console.error(
            "Status update failed:",
            error
        );

        showToast(
            error.message,
            "error"
        );

        await loadApplications();
    }
}


/* ============================================================
   DELETE APPLICATION
   ============================================================ */

async function deleteApplication(
    application
) {

    const company =
        application.companyName ||
        "this application";


    const confirmed =
        await showDeleteConfirmation(
            "Delete Application",
            "Delete the application for " +
            company +
            "?",
            "This action cannot be undone."
        );


    if (!confirmed) {
        return;
    }


    try {

        await apiCall(
            "/applications/" +
            application.id,
            {
                method: "DELETE"
            }
        );


        showToast(
            "Application deleted successfully.",
            "success"
        );


        await loadApplications();


    } catch (error) {

        showToast(
            error.message,
            "error"
        );
    }
}


/* ============================================================
   NOTES MODAL
   ============================================================ */

function openNotesModal(
    application
) {

    const overlay =
        document.getElementById(
            "notesModalOverlay"
        );

    if (!overlay) {
        return;
    }

    setText(
        "notesModalTitle",
        application.companyName ||
        "Application"
    );

    setText(
        "notesModalRole",
        application.roleTitle ||
        ""
    );

    const text =
        document.getElementById(
            "notesModalText"
        );

    if (text) {

        text.textContent =
            application.notes &&
            String(
                application.notes
            ).trim()
                ? application.notes
                : "No notes added.";
    }

    overlay.style.display = "flex";

    document.body.classList.add(
        "modal-open"
    );
}


function closeNotesModal() {

    const overlay =
        document.getElementById(
            "notesModalOverlay"
        );

    if (overlay) {
        overlay.style.display = "none";
    }

    document.body.classList.remove(
        "modal-open"
    );
}


/* ============================================================
   HISTORY MODAL
   ============================================================ */

async function openHistoryModal(
    application
) {

    const overlay =
        document.getElementById(
            "historyModalOverlay"
        );

    const content =
        document.getElementById(
            "historyContent"
        );

    if (!overlay || !content) {
        return;
    }

    setText(
        "historyTitle",
        (
            application.companyName ||
            "Application"
        ) +
        " — Status History"
    );

    content.innerHTML = `
        <div class="empty-inline">
            Loading history...
        </div>
    `;

    overlay.style.display = "flex";

    document.body.classList.add(
        "modal-open"
    );

    try {

        const history =
            await apiCall(
                "/applications/" +
                application.id +
                "/history"
            );

        if (
            !Array.isArray(history) ||
            history.length === 0
        ) {

            content.innerHTML = `
                <div class="empty-inline">
                    No status history available.
                </div>
            `;

            return;
        }

        const sorted =
            [...history].sort(
                (a, b) =>
                    compareDateTimes(
                        b.changedAt,
                        a.changedAt
                    )
            );

        content.innerHTML =
            sorted
                .map(item => `

                    <div class="history-item">

                        <div class="history-body">

                            <strong>
                                ${escapeHTML(
                                    STATUS_LABELS[
                                        item.status
                                    ] ||
                                    item.status ||
                                    "Unknown"
                                )}
                            </strong>

                            <span>
                                ${formatDateTime(
                                    item.changedAt
                                )}
                            </span>

                        </div>

                    </div>

                `)
                .join("");

    } catch (error) {

        content.innerHTML = `
            <div class="error-msg">
                ${escapeHTML(
                    error.message
                )}
            </div>
        `;
    }
}


function closeHistoryModal() {

    const overlay =
        document.getElementById(
            "historyModalOverlay"
        );

    if (overlay) {
        overlay.style.display = "none";
    }

    document.body.classList.remove(
        "modal-open"
    );
}


/* ============================================================
   MODAL HANDLERS
   ============================================================ */

function initializeModalHandlers() {

    const closeButton =
        document.getElementById(
            "modalCloseBtn"
        );

    const cancelButton =
        document.getElementById(
            "cancelBtn"
        );

    if (closeButton) {
        closeButton.addEventListener(
            "click",
            closeApplicationModal
        );
    }

    if (cancelButton) {
        cancelButton.addEventListener(
            "click",
            closeApplicationModal
        );
    }

    const editClose =
        document.getElementById(
            "editModalCloseBtn"
        );

    const editCancel =
        document.getElementById(
            "editCancelBtn"
        );

    if (editClose) {
        editClose.addEventListener(
            "click",
            closeEditApplicationModal
        );
    }

    if (editCancel) {
        editCancel.addEventListener(
            "click",
            closeEditApplicationModal
        );
    }

    const notesClose =
        document.getElementById(
            "closeNotesBtn"
        );

    const notesDone =
        document.getElementById(
            "notesDoneBtn"
        );

    if (notesClose) {
        notesClose.addEventListener(
            "click",
            closeNotesModal
        );
    }

    if (notesDone) {
        notesDone.addEventListener(
            "click",
            closeNotesModal
        );
    }

    const historyClose =
        document.getElementById(
            "closeHistoryBtn"
        );

    const historyDone =
        document.getElementById(
            "historyDoneBtn"
        );

    if (historyClose) {
        historyClose.addEventListener(
            "click",
            closeHistoryModal
        );
    }

    if (historyDone) {
        historyDone.addEventListener(
            "click",
            closeHistoryModal
        );
    }

    [
        "modalOverlay",
        "editModalOverlay",
        "notesModalOverlay",
        "historyModalOverlay"
    ].forEach(id => {

        const overlay =
            document.getElementById(id);

        if (!overlay) {
            return;
        }

        overlay.addEventListener(
            "click",
            event => {

                if (
                    event.target !==
                    overlay
                ) {
                    return;
                }

                if (
                    id ===
                    "modalOverlay"
                ) {
                    closeApplicationModal();
                }

                if (
                    id ===
                    "editModalOverlay"
                ) {
                    closeEditApplicationModal();
                }

                if (
                    id ===
                    "notesModalOverlay"
                ) {
                    closeNotesModal();
                }

                if (
                    id ===
                    "historyModalOverlay"
                ) {
                    closeHistoryModal();
                }
            }
        );
    });

    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key !== "Escape"
            ) {
                return;
            }

            closeApplicationModal();
            closeEditApplicationModal();
            closeNotesModal();
            closeHistoryModal();
            closeInterviewModal();
        }
    );
}


/* ============================================================
   INTERVIEW SYSTEM
   ============================================================ */

function initializeInterviewSystem() {

    const button =
        document.getElementById(
            "newInterviewBtn"
        );

    if (button) {

        button.addEventListener(
            "click",
            () => {
                openInterviewModal();
            }
        );
    }
}


function createInterviewModal() {

    if (
        document.getElementById(
            "interviewModalOverlay"
        )
    ) {
        return;
    }

    const overlay =
        document.createElement("div");

    overlay.id =
        "interviewModalOverlay";

    overlay.className =
        "modal-overlay";

    overlay.style.display = "none";

    overlay.innerHTML = `

        <div
            class="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="interviewModalTitle"
        >

            <div class="modal-header">

                <div>

                    <p class="eyebrow">
                        INTERVIEW MANAGEMENT
                    </p>

                    <h2 id="interviewModalTitle">
                        Add Interview
                    </h2>

                </div>

                <button
                    type="button"
                    class="icon-button"
                    id="interviewModalCloseBtn"
                >
                    ×
                </button>

            </div>

            <form id="interviewForm">

                <div class="form-grid">

                    <div class="field full">

                        <label
                            for="interviewApplicationInput"
                        >
                            Application *
                        </label>

                        <select
                            id="interviewApplicationInput"
                            required
                        >
                            <option value="">
                                Select application
                            </option>
                        </select>

                    </div>

                    <div class="field">

                        <label
                            for="interviewDateInput"
                        >
                            Interview Date *
                        </label>

                        <input
                            type="date"
                            id="interviewDateInput"
                            required
                        >

                    </div>

                    <div class="field">

                        <label
                            for="interviewTimeInput"
                        >
                            Interview Time
                        </label>

                        <input
                            type="time"
                            id="interviewTimeInput"
                        >

                    </div>

                    <div class="field">

                        <label
                            for="interviewRoundInput"
                        >
                            Interview Round
                        </label>

                        <input
                            type="text"
                            id="interviewRoundInput"
                            placeholder="e.g. Technical Round 1"
                        >

                    </div>

                    <div class="field">

                        <label
                            for="interviewTypeInput"
                        >
                            Interview Type
                        </label>

                        <select
                            id="interviewTypeInput"
                        >
                            <option value="">
                                Select type
                            </option>

                            <option value="ONLINE">
                                Online
                            </option>

                            <option value="PHONE">
                                Phone
                            </option>

                            <option value="IN_PERSON">
                                In person
                            </option>

                            <option value="OTHER">
                                Other
                            </option>

                        </select>

                    </div>

                    <div class="field full">

                        <label
                            for="meetingLinkInput"
                        >
                            Meeting Link
                        </label>

                        <input
                            type="url"
                            id="meetingLinkInput"
                            placeholder="https://..."
                        >

                    </div>

                    <div class="field">

                        <label
                            for="contactNameInput"
                        >
                            Recruiter / Contact
                        </label>

                        <input
                            type="text"
                            id="contactNameInput"
                            placeholder="Name"
                        >

                    </div>

                    <div class="field">

                        <label
                            for="contactEmailInput"
                        >
                            Contact Email
                        </label>

                        <input
                            type="email"
                            id="contactEmailInput"
                            placeholder="email@example.com"
                        >

                    </div>

                    <div class="field">

                        <label
                            for="followUpDateInput"
                        >
                            Follow-up Date
                        </label>

                        <input
                            type="date"
                            id="followUpDateInput"
                        >

                    </div>

                    <div class="field full">

                        <label
                            for="interviewNotesInput"
                        >
                            Interview Notes
                        </label>

                        <textarea
                            id="interviewNotesInput"
                            rows="4"
                            placeholder="Topics, questions, feedback..."
                        ></textarea>

                    </div>

                    <div class="field full">

                        <label
                            for="followUpNotesInput"
                        >
                            Follow-up Notes
                        </label>

                        <textarea
                            id="followUpNotesInput"
                            rows="3"
                            placeholder="What should you follow up on?"
                        ></textarea>

                    </div>

                </div>

                <p
                    id="interviewModalError"
                    class="error-msg"
                ></p>

                <div class="modal-actions">

                    <button
                        type="button"
                        class="button button-secondary"
                        id="interviewCancelBtn"
                    >
                        Cancel
                    </button>

                    <button
                        type="submit"
                        class="button button-primary"
                    >
                        Save Interview
                    </button>

                </div>

            </form>

        </div>
    `;

    document.body.appendChild(overlay);

    const closeButton =
        document.getElementById(
            "interviewModalCloseBtn"
        );

    const cancelButton =
        document.getElementById(
            "interviewCancelBtn"
        );

    if (closeButton) {

        closeButton.addEventListener(
            "click",
            closeInterviewModal
        );
    }

    if (cancelButton) {

        cancelButton.addEventListener(
            "click",
            closeInterviewModal
        );
    }

    overlay.addEventListener(
        "click",
        event => {

            if (
                event.target === overlay
            ) {
                closeInterviewModal();
            }
        }
    );

    const form =
        document.getElementById(
            "interviewForm"
        );

    if (form) {

        form.addEventListener(
            "submit",
            async event => {

                event.preventDefault();

                await saveInterview();
            }
        );
    }
}


function openInterviewModal(
    interview = null
) {

    createInterviewModal();

    const overlay =
        document.getElementById(
            "interviewModalOverlay"
        );

    if (!overlay) {
        return;
    }

    editingInterviewId =
        interview
            ? interview.id
            : null;

    populateInterviewApplications();

    clearInterviewForm();

    const title =
        document.getElementById(
            "interviewModalTitle"
        );

    if (interview) {

        if (title) {
            title.textContent =
                "Edit Interview";
        }

        populateInterviewForm(
            interview
        );

    } else {

        if (title) {
            title.textContent =
                "Add Interview";
        }

        setInputValue(
            "interviewDateInput",
            getTodayISO()
        );
    }

    overlay.style.display = "flex";

    document.body.classList.add(
        "modal-open"
    );
}


function populateInterviewApplications() {

    const select =
        document.getElementById(
            "interviewApplicationInput"
        );

    if (!select) {
        return;
    }

    select.innerHTML = `
        <option value="">
            Select application
        </option>
    `;

    allApplications.forEach(
        application => {

            const option =
                document.createElement(
                    "option"
                );

            option.value =
                application.id;

            option.textContent =
                (
                    application.companyName ||
                    "Unknown"
                ) +
                " — " +
                (
                    application.roleTitle ||
                    "Role"
                );

            select.appendChild(
                option
            );
        }
    );
}


function clearInterviewForm() {

    const form =
        document.getElementById(
            "interviewForm"
        );

    if (form) {
        form.reset();
    }

    const error =
        document.getElementById(
            "interviewModalError"
        );

    if (error) {
        error.textContent = "";
    }
}


function populateInterviewForm(
    interview
) {

    const applicationId =
        interview.application &&
        interview.application.id
            ? interview.application.id
            : interview.applicationId || "";

    setInputValue(
        "interviewApplicationInput",
        applicationId
    );

    setInputValue(
        "interviewDateInput",
        interview.interviewDate
    );

    setInputValue(
        "interviewTimeInput",
        interview.interviewTime
    );

    setInputValue(
        "interviewRoundInput",
        interview.interviewRound
    );

    setInputValue(
        "interviewTypeInput",
        interview.interviewType
    );

    setInputValue(
        "meetingLinkInput",
        interview.meetingLink
    );

    setInputValue(
        "contactNameInput",
        interview.contactName
    );

    setInputValue(
        "contactEmailInput",
        interview.contactEmail
    );

    setInputValue(
        "followUpDateInput",
        interview.followUpDate
    );

    setInputValue(
        "interviewNotesInput",
        interview.notes
    );

    setInputValue(
        "followUpNotesInput",
        interview.followUpNotes
    );
}


/* ============================================================
   SAVE INTERVIEW
   ============================================================ */

/* ============================================================
   SAVE INTERVIEW
   FIXED VERSION
   ============================================================ */

async function saveInterview() {

    const applicationId =
        getInputValue(
            "interviewApplicationInput"
        );


    const interviewDate =
        getInputValue(
            "interviewDateInput"
        );


    const interviewTime =
        getInputValue(
            "interviewTimeInput"
        );


    const interviewRound =
        getInputValue(
            "interviewRoundInput"
        );


    const interviewType =
        getInputValue(
            "interviewTypeInput"
        );


    const meetingLink =
        getInputValue(
            "meetingLinkInput"
        );


    const contactName =
        getInputValue(
            "contactNameInput"
        );


    const contactEmail =
        getInputValue(
            "contactEmailInput"
        );


    const followUpDate =
        getInputValue(
            "followUpDateInput"
        );


    const notes =
        getInputValue(
            "interviewNotesInput"
        );


    const followUpNotes =
        getInputValue(
            "followUpNotesInput"
        );


    const errorElement =
        document.getElementById(
            "interviewModalError"
        );


    if (!applicationId) {

        showModalError(
            errorElement,
            "Please select an application."
        );

        return;
    }


    if (!interviewDate) {

        showModalError(
            errorElement,
            "Interview date is required."
        );

        return;
    }


    /*
     * Get the selected application.
     */
    const selectedApplication =
        allApplications.find(
            application =>
                String(
                    application.id
                ) ===
                String(
                    applicationId
                )
        );


    if (!selectedApplication) {

        showModalError(
            errorElement,
            "Selected application could not be found."
        );

        return;
    }


    const submitButton =
        document.querySelector(
            "#interviewForm button[type='submit']"
        );


    const isEditing =
        editingInterviewId != null;


    setButtonLoading(
        submitButton,
        true,
        isEditing
            ? "Saving..."
            : "Adding..."
    );


    try {

        /*
         * IMPORTANT:
         * Send the application ID as well as
         * company + role information.
         */
        const payload = {

            applicationId:
                selectedApplication.id,

            companyName:
                selectedApplication.companyName,

            roleTitle:
                selectedApplication.roleTitle,

            interviewDate,

            interviewTime:
                interviewTime || null,

            interviewRound:
                interviewRound || null,

            interviewType:
                interviewType || null,

            /*
             * OPTIONAL
             */
            meetingLink:
                meetingLink || null,

            contactName:
                contactName || null,

            contactEmail:
                contactEmail || null,

            followUpDate:
                followUpDate || null,

            followUpNotes:
                followUpNotes || null,

            notes:
                notes || null
        };


        if (isEditing) {

            await apiCall(
                "/interviews/" +
                editingInterviewId,
                {
                    method: "PUT",

                    body:
                        JSON.stringify(
                            payload
                        )
                }
            );


            showToast(
                "Interview updated successfully.",
                "success"
            );

        } else {

            await apiCall(
                "/interviews?applicationId=" +
                encodeURIComponent(
                    applicationId
                ),
                {
                    method: "POST",

                    body:
                        JSON.stringify(
                            payload
                        )
                }
            );


            showToast(
                "Interview added successfully.",
                "success"
            );
        }


        closeInterviewModal();


        /*
         * Reload applications first so the
         * application map definitely exists.
         */
        await loadApplications();


        /*
         * Then reload interviews and resolve
         * company + role from application.
         */
        await loadInterviews();


    } catch (error) {

        console.error(
            "Save interview failed:",
            error
        );


        showModalError(
            errorElement,
            error.message
        );


    } finally {

        setButtonLoading(
            submitButton,
            false,
            isEditing
                ? "Save Changes"
                : "Save Interview"
        );
    }
}


function closeInterviewModal() {

    const overlay =
        document.getElementById(
            "interviewModalOverlay"
        );

    if (overlay) {
        overlay.style.display = "none";
    }

    editingInterviewId = null;

    document.body.classList.remove(
        "modal-open"
    );
}


/* ============================================================
   INTERVIEW VIEW
   ============================================================ */

function renderInterviewsView() {

    renderUpcomingInterviews();

    renderPendingInterviewFollowups();
}


function renderUpcomingInterviews() {

    const container =
        document.getElementById(
            "upcomingInterviews"
        );

    const count =
        document.getElementById(
            "upcomingInterviewCount"
        );

    if (!container) {
        return;
    }

    const upcoming =
        getUpcomingInterviews();

    if (count) {

        count.textContent =
            upcoming.length +
            (
                upcoming.length === 1
                    ? " upcoming"
                    : " upcoming"
            );
    }

    if (!upcoming.length) {

        container.innerHTML = `
            <div class="empty-inline">
                No upcoming interviews.
            </div>
        `;

        return;
    }

    container.innerHTML =
        upcoming
            .map(
                interview =>
                    createInterviewHTML(
                        interview,
                        true
                    )
            )
            .join("");

    rebuildInterviewMap();

    attachInterviewEvents(
        container
    );
}


function renderPendingInterviewFollowups() {

    const container =
        document.getElementById(
            "pendingInterviewFollowups"
        );

    const count =
        document.getElementById(
            "pendingFollowupCount"
        );

    if (!container) {
        return;
    }

    const today =
        getTodayISO();

    const pending =
        allInterviews
            .filter(
                interview =>
                    interview.followUpDate &&
                    interview.followUpDate <=
                    today &&
                    interview.followUpCompleted !==
                    true
            )
            .sort(
                (a, b) =>
                    compareDates(
                        a.followUpDate,
                        b.followUpDate
                    )
            );

    if (count) {
        count.textContent =
            pending.length +
            " pending";
    }

    if (!pending.length) {

        container.innerHTML = `
            <div class="empty-inline">
                No pending interview follow-ups.
            </div>
        `;

        return;
    }

    container.innerHTML =
        pending
            .map(
                interview =>
                    createInterviewHTML(
                        interview,
                        false
                    )
            )
            .join("");

    rebuildInterviewMap();

    attachInterviewEvents(
        container
    );
}


/* ============================================================
   INTERVIEW HTML
   ============================================================ */

/* ============================================================
   INTERVIEW HTML
   FIXED COMPANY + ROLE
   ============================================================ */

function createInterviewHTML(
    interview,
    showEdit = true
) {

    /*
     * Resolve application correctly.
     */
    const application =
        getInterviewApplication(
            interview
        );


    /*
     * Company name
     */
    const company =
        interview.companyName ||
        interview.company ||
        interview.company_name ||
        application.companyName ||
        application.company ||
        "Unknown company";


    /*
     * Role
     */
    const role =
        interview.roleTitle ||
        interview.role ||
        interview.jobTitle ||
        interview.position ||
        interview.role_title ||
        application.roleTitle ||
        application.role ||
        application.jobTitle ||
        "Unknown role";


    /*
     * Date
     */
    const date =
        formatDate(
            interview.interviewDate
        );


    /*
     * Time
     */
    const time =
        interview.interviewTime
            ? formatTime(
                interview.interviewTime
            )
            : "";


    /*
     * Interview round
     */
    const round =
        interview.interviewRound ||
        "Interview";


    /*
     * Interview type
     */
    const interviewType =
        interview.interviewType ||
        "Not specified";


    /*
     * Meeting link is OPTIONAL.
     */
    const meetingLink =
        interview.meetingLink;


    const linkHTML =
        meetingLink
            ? `

                <a
                    href="${escapeAttribute(
                        meetingLink
                    )}"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="button button-secondary"
                >
                    Join meeting
                </a>

              `
            : "";


    /*
     * Follow-up
     */
    const followupHTML =
        interview.followUpDate

            ? `

                <span
                    class="interview-meta"
                >
                    Follow-up:
                    ${formatDate(
                        interview.followUpDate
                    )}
                </span>

              `

            : "";


    /*
     * Contact
     */
    const contactHTML =
        interview.contactName

            ? `

                <span
                    class="interview-meta"
                >
                    ${escapeHTML(
                        interview.contactName
                    )}
                </span>

              `

            : "";


    return `

        <article
            class="interview-card"
            data-interview-id="${interview.id}"
        >

            <div
                class="interview-card-main"
            >

                <div
                    class="interview-date-block"
                >

                    <strong>
                        ${formatDayNumber(
                            interview.interviewDate
                        )}
                    </strong>

                    <span>
                        ${formatMonthShort(
                            interview.interviewDate
                        )}
                    </span>

                </div>


                <div
                    class="interview-info"
                >

                    <!-- COMPANY -->

                    <h4>
                        ${escapeHTML(
                            company
                        )}
                    </h4>


                    <!-- ROLE -->

                    <p>
                        ${escapeHTML(
                            role
                        )}
                    </p>


                    <!-- ROUND / TYPE / TIME -->

                    <div
                        class="interview-meta-row"
                    >

                        <span
                            class="interview-meta"
                        >
                            ${escapeHTML(
                                round
                            )}
                        </span>


                        <span
                            class="interview-meta"
                        >
                            ${escapeHTML(
                                interviewType
                            )}
                        </span>


                        ${
                            time
                                ? `

                                    <span
                                        class="interview-meta"
                                    >
                                        ${escapeHTML(
                                            time
                                        )}
                                    </span>

                                  `
                                : ""
                        }


                        ${followupHTML}

                        ${contactHTML}

                    </div>


                    <!-- FULL DATE -->

                    <p
                        class="interview-full-date"
                    >
                        ${escapeHTML(
                            date
                        )}
                    </p>

                </div>

            </div>


            <div
                class="interview-card-actions"
            >

                ${linkHTML}


                ${
                    showEdit
                        ? `

                            <button
                                type="button"
                                class="button button-secondary"
                                data-interview-action="edit"
                                data-id="${interview.id}"
                            >
                                Edit
                            </button>


                            <button
                                type="button"
                                class="button button-danger"
                                data-interview-action="delete"
                                data-id="${interview.id}"
                            >
                                Delete
                            </button>

                          `
                        : ""
                }

            </div>

        </article>

    `;
}


/* ============================================================
   INTERVIEW EVENTS
   ============================================================ */

function attachInterviewEvents(
    container
) {

    container
        .querySelectorAll(
            "[data-interview-action]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                async event => {

                    event.preventDefault();

                    const action =
                        button.dataset
                            .interviewAction;

                    const id =
                        Number(
                            button.dataset.id
                        );

                    await handleInterviewAction(
                        action,
                        id
                    );
                }
            );
        });
}


async function handleInterviewAction(
    action,
    id
) {

    const interview =
        interviewsMap[id];

    if (!interview) {
        return;
    }

    switch (action) {

        case "edit":

            openInterviewModal(
                interview
            );

            break;

        case "delete":

            await deleteInterview(
                interview
            );

            break;

        case "complete-followup":

            await completeInterviewFollowup(
                interview
            );

            break;
    }
}


async function deleteInterview(
    interview
) {

    const application =
        interview.application ||
        {};


    const company =
        application.companyName ||
        interview.companyName ||
        "this application";


    const confirmed =
        await showDeleteConfirmation(
            "Delete Interview",
            "Delete the interview for " +
            company +
            "?",
            "This action cannot be undone."
        );


    if (!confirmed) {
        return;
    }


    try {

        await apiCall(
            "/interviews/" +
            interview.id,
            {
                method: "DELETE"
            }
        );


        showToast(
            "Interview deleted successfully.",
            "success"
        );


        await loadInterviews();


    } catch (error) {

        showToast(
            error.message,
            "error"
        );
    }
}

async function completeInterviewFollowup(
    interview
) {

    try {

        await apiCall(
            "/interviews/" +
            interview.id +
            "/complete-followup",
            {
                method: "PUT"
            }
        );

        showToast(
            "Interview follow-up completed.",
            "success"
        );

        await loadInterviews();

    } catch (error) {

        showToast(
            error.message,
            "error"
        );
    }
}


/* ============================================================
   FOLLOW-UP VIEW
   ============================================================ */

function renderFollowupsView() {

    renderApplicationFollowups();

    renderFollowupInterviewList();

    updateFollowupCounts();

}


function renderApplicationFollowups() {

    const container =
        document.getElementById(
            "applicationFollowups"
        );

    if (!container) {
        return;
    }


    const followups =
        allApplications
            .filter(
                application =>
                    application.needsFollowUp ===
                    true
            )
            .sort(
                (a, b) =>
                    compareDates(
                        a.appliedDate,
                        b.appliedDate
                    )
            );


    if (!followups.length) {

        container.innerHTML = `
            <div class="empty-inline">
                No application follow-ups.
            </div>
        `;

        return;
    }


    container.innerHTML =
        followups
            .map(
                application => `

                    <article class="followup-card">

                        <div class="followup-card-main">

                            <strong>
                                ${escapeHTML(
                                    application.companyName ||
                                    "Unknown"
                                )}
                            </strong>

                            <span>
                                ${escapeHTML(
                                    application.roleTitle ||
                                    "-"
                                )}
                            </span>

                            <small>
                                Applied:
                                ${formatDate(
                                    application.appliedDate
                                )}
                            </small>

                        </div>

                        <button
                            type="button"
                            class="button button-secondary"
                            data-followup-action="application"
                            data-id="${application.id}"
                        >
                            View
                        </button>

                    </article>
                `
            )
            .join("");


    container
        .querySelectorAll(
            "[data-followup-action='application']"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const id =
                        Number(
                            button.dataset.id
                        );


                    const application =
                        applicationsMap[id];


                    if (!application) {
                        return;
                    }


                    showView(
                        "applicationsView"
                    );


                    const search =
                        document.getElementById(
                            "searchInput"
                        );


                    if (search) {

                        search.value =
                            application.companyName ||
                            "";
                    }


                    applyFiltersAndRender();

                }
            );

        });

}


function renderFollowupInterviewList() {

    const container =
        document.getElementById(
            "followupInterviewList"
        );


    if (!container) {
        return;
    }


    const pending =
        allInterviews
            .filter(
                interview =>
                    interview.followUpDate &&
                    interview.followUpDate <=
                    getTodayISO() &&
                    interview.followUpCompleted !==
                    true
            )
            .sort(
                (a, b) =>
                    compareDates(
                        a.followUpDate,
                        b.followUpDate
                    )
            );


    if (!pending.length) {

        container.innerHTML = `
            <div class="empty-inline">
                No interview follow-ups.
            </div>
        `;

        return;
    }


    container.innerHTML =
        pending
            .map(interview => {

                /*
                 * Get the correct application
                 * for this interview.
                 */
                const application =
                    getInterviewApplication(
                        interview
                    );


                /*
                 * Company
                 */
                const company =
                    interview.companyName ||
                    interview.company ||
                    application.companyName ||
                    application.company ||
                    "Unknown";


                /*
                 * Role
                 */
                const role =
                    interview.roleTitle ||
                    interview.role ||
                    interview.jobTitle ||
                    application.roleTitle ||
                    application.role ||
                    "Interview";


                return `

                    <article class="followup-card">

                        <div class="followup-card-main">

                            <strong>
                                ${escapeHTML(
                                    company
                                )}
                            </strong>

                            <span>
                                ${escapeHTML(
                                    role
                                )}
                            </span>

                            <small>
                                Interview:
                                ${formatDate(
                                    interview.interviewDate
                                )}
                            </small>

                            <small>
                                Follow-up:
                                ${formatDate(
                                    interview.followUpDate
                                )}
                            </small>

                        </div>

                        <button
                            type="button"
                            class="button button-primary"
                            data-followup-interview-id="${interview.id}"
                        >
                            Complete
                        </button>

                    </article>

                `;

            })
            .join("");


    container
        .querySelectorAll(
            "[data-followup-interview-id]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                async () => {

                    const id =
                        Number(
                            button.dataset
                                .followupInterviewId
                        );


                    const interview =
                        interviewsMap[id];


                    if (interview) {

                        await completeInterviewFollowup(
                            interview
                        );

                    }

                }
            );

        });

}


function updateFollowupCounts() {

    const applicationCount =
        allApplications.filter(
            application =>
                application.needsFollowUp ===
                true
        ).length;

    const interviewCount =
        allInterviews.filter(
            interview =>
                interview.followUpDate &&
                interview.followUpDate <=
                getTodayISO() &&
                interview.followUpCompleted !==
                true
        ).length;

    const total =
        applicationCount +
        interviewCount;

    setText(
        "applicationFollowupCount",
        applicationCount
    );

    setText(
        "interviewFollowupCount",
        interviewCount
    );

    setText(
        "navFollowupCount",
        total
    );

    setText(
        "dashboardFollowupCount",
        total
    );
}


/* ============================================================
   FOLLOW-UP CONTROLS
   ============================================================ */

function initializeFollowUpControls() {

    const refreshButton =
        document.getElementById(
            "followupRefreshBtn"
        );

    if (!refreshButton) {
        return;
    }

    refreshButton.addEventListener(
        "click",
        async () => {

            setButtonLoading(
                refreshButton,
                true,
                "Refreshing..."
            );

            try {

                await loadAllData();

                showToast(
                    "Follow-ups refreshed.",
                    "success"
                );

            } finally {

                setButtonLoading(
                    refreshButton,
                    false,
                    "↻ Refresh"
                );
            }
        }
    );
}


function initializeFollowupRefresh() {

    const button =
        document.getElementById(
            "followupRefreshBtn"
        );

    if (!button) {
        return;
    }

    if (
        button.dataset.initialized ===
        "true"
    ) {
        return;
    }

    button.dataset.initialized = "true";
}


/* ============================================================
   DASHBOARD
   ============================================================ */

function renderDashboard() {

    updateDashboardStats();

    renderDashboardUpcomingInterviews();

    renderDashboardFollowups();

    renderDashboardRecentApplications();
}


function updateDashboardStats() {

    const total =
        allApplications.length;

    const interviews =
        allInterviews.length;

    const offers =
        allApplications.filter(
            application =>
                application.currentStatus ===
                "OFFER"
        ).length;

    const applicationFollowups =
        allApplications.filter(
            application =>
                application.needsFollowUp ===
                true
        ).length;

    const interviewFollowups =
        allInterviews.filter(
            interview =>
                interview.followUpDate &&
                interview.followUpDate <=
                getTodayISO() &&
                interview.followUpCompleted !==
                true
        ).length;

    const followups =
        applicationFollowups +
        interviewFollowups;

    setText(
        "dashboardTotalApplications",
        total
    );

    setText(
        "dashboardInterviewCount",
        interviews
    );

    setText(
        "dashboardOfferCount",
        offers
    );

    setText(
        "dashboardFollowupCount",
        followups
    );

    setText(
        "navFollowupCount",
        followups
    );
}


function renderDashboardUpcomingInterviews() {

    const container =
        document.getElementById(
            "dashboardUpcomingInterviews"
        );

    if (!container) {
        return;
    }

    const upcoming =
        getUpcomingInterviews()
            .slice(0, 4);

    if (!upcoming.length) {

        container.innerHTML = `
            <div class="empty-inline">
                No upcoming interviews.
            </div>
        `;

        return;
    }

    container.innerHTML =
        upcoming
            .map(
                interview =>
                    createDashboardInterviewItem(
                        interview
                    )
            )
            .join("");
}


function createDashboardInterviewItem(
    interview
) {

    const application =
        getInterviewApplication(
            interview
        );


    const company =
        interview.companyName ||
        interview.company ||
        application.companyName ||
        application.company ||
        "Unknown";


    const role =
        interview.roleTitle ||
        interview.role ||
        interview.jobTitle ||
        application.roleTitle ||
        application.role ||
        "Interview";


    return `

        <div class="dashboard-list-item">

            <div class="followup-icon">
                ◷
            </div>


            <div class="dashboard-list-info">

                <strong>
                    ${escapeHTML(
                        company
                    )}
                </strong>


                <span>
                    ${escapeHTML(
                        role
                    )}
                </span>


                <small>

                    ${formatDate(
                        interview.interviewDate
                    )}

                    ${
                        interview.interviewTime
                            ? " · " +
                              escapeHTML(
                                  formatTime(
                                      interview.interviewTime
                                  )
                              )
                            : ""
                    }

                </small>

            </div>

        </div>

    `;
}


function renderDashboardFollowups() {

    const container =
        document.getElementById(
            "dashboardFollowups"
        );

    if (!container) {
        return;
    }

    const applicationFollowups =
        allApplications
            .filter(
                application =>
                    application.needsFollowUp ===
                    true
            )
            .slice(0, 3);

    const interviewFollowups =
        allInterviews
            .filter(
                interview =>
                    interview.followUpDate &&
                    interview.followUpDate <=
                    getTodayISO() &&
                    interview.followUpCompleted !==
                    true
            )
            .slice(0, 3);

    const items = [
        ...applicationFollowups,
        ...interviewFollowups
    ].slice(0, 5);

    if (!items.length) {

        container.innerHTML = `
            <div class="empty-inline">
                No pending follow-ups.
            </div>
        `;

        return;
    }

    container.innerHTML =
        items
            .map(item => {

                if (
                    item.companyName
                ) {

                    return `

                        <div class="dashboard-list-item">

                            <div class="followup-icon">
                                !
                            </div>

                            <div class="dashboard-list-info">

                                <strong>
                                    ${escapeHTML(
                                        item.companyName
                                    )}
                                </strong>

                                <span>
                                    ${escapeHTML(
                                        item.roleTitle ||
                                        "-"
                                    )}
                                </span>

                                <small>
                                    Application follow-up required
                                </small>

                            </div>

                        </div>
                    `;
                }

                const application =
                    item.application ||
                    {};

                return `

                    <div class="dashboard-list-item">

                        <div class="followup-icon">
                            !
                        </div>

                        <div class="dashboard-list-info">

                            <strong>
                                ${escapeHTML(
                                    application.companyName ||
                                    "Unknown"
                                )}
                            </strong>

                            <span>
                                Interview follow-up
                            </span>

                            <small>
                                Due:
                                ${formatDate(
                                    item.followUpDate
                                )}
                            </small>

                        </div>

                    </div>
                `;
            })
            .join("");
}


function renderDashboardRecentApplications() {

    const container =
        document.getElementById(
            "dashboardRecentApplications"
        );

    if (!container) {
        return;
    }

    const recent =
        [...allApplications]
            .sort(
                (a, b) =>
                    compareDates(
                        b.appliedDate,
                        a.appliedDate
                    )
            )
            .slice(0, 6);

    if (!recent.length) {

        container.innerHTML = `
            <div class="empty-inline">
                No applications yet.
            </div>
        `;

        return;
    }

    container.innerHTML =
        recent
            .map(application => {

                const status =
                    application.currentStatus ||
                    "APPLIED";

                return `

                    <div class="recent-application-row">

                        <div class="recent-company">

                            <strong>
                                ${escapeHTML(
                                    application.companyName ||
                                    "Unknown"
                                )}
                            </strong>

                            <span>
                                ${escapeHTML(
                                    application.roleTitle ||
                                    "-"
                                )}
                            </span>

                        </div>

                        <div>

                            <span class="status-badge status-${escapeAttribute(status)}">
                                ${escapeHTML(
                                    STATUS_LABELS[
                                        status
                                    ] ||
                                    status
                                )}
                            </span>

                        </div>

                        <div class="recent-date">

                            ${formatDate(
                                application.appliedDate
                            )}

                        </div>

                    </div>
                `;
            })
            .join("");
}


function getUpcomingInterviews() {

    const today =
        getTodayISO();

    return allInterviews
        .filter(
            interview =>
                interview.interviewDate &&
                interview.interviewDate >=
                today
        )
        .sort(
            (a, b) =>
                buildDateTime(
                    a.interviewDate,
                    a.interviewTime
                ) -
                buildDateTime(
                    b.interviewDate,
                    b.interviewTime
                )
        );
}


/* ============================================================
   ANALYTICS
   ============================================================ */

function renderAnalytics() {

    calculateAnalyticsMetrics();

    renderStatusChart();

    renderApplicationsTrendChart();

    renderSourceChart();
}


function calculateAnalyticsMetrics() {

    const total =
        allApplications.length;

    const applicationsWithInterview =
        allApplications.filter(
            application =>
                application.currentStatus ===
                    "INTERVIEW_1" ||
                application.currentStatus ===
                    "INTERVIEW_2" ||
                application.currentStatus ===
                    "OFFER"
        ).length;

    const offers =
        allApplications.filter(
            application =>
                application.currentStatus ===
                "OFFER"
        ).length;

    const responded =
        allApplications.filter(
            application => {

                const status =
                    application.currentStatus ||
                    "APPLIED";

                return status !== "APPLIED";
            }
        ).length;

    const successRate =
        total
            ? offers / total * 100
            : 0;

    const interviewConversion =
        total
            ? applicationsWithInterview /
              total *
              100
            : 0;

    const offerConversion =
        total
            ? offers /
              total *
              100
            : 0;

    const responseRate =
        total
            ? responded /
              total *
              100
            : 0;

    setText(
        "metricSuccessRate",
        formatPercent(successRate)
    );

    setText(
        "metricInterviewConversion",
        formatPercent(
            interviewConversion
        )
    );

    setText(
        "metricOfferConversion",
        formatPercent(
            offerConversion
        )
    );

    setText(
        "metricResponseRate",
        formatPercent(
            responseRate
        )
    );

    setText(
        "metricSuccessDetail",
        offers +
        " of " +
        total +
        " applications"
    );

    setText(
        "metricInterviewDetail",
        applicationsWithInterview +
        " of " +
        total +
        " applications"
    );

    setText(
        "metricOfferDetail",
        offers +
        " of " +
        total +
        " applications"
    );

    setText(
        "metricResponseDetail",
        responded +
        " of " +
        total +
        " responded"
    );
}


/* ============================================================
   CHART DEFAULTS
   ============================================================ */

function configureChartDefaults() {

    if (
        typeof Chart ===
        "undefined"
    ) {
        return;
    }

    Chart.defaults.color =
        "#a8b2bf";

    Chart.defaults.borderColor =
        "#26313d";

    Chart.defaults.font.family =
        "Inter, system-ui, sans-serif";
}


/* ============================================================
   STATUS CHART
   ============================================================ */

function renderStatusChart() {

    const canvas =
        document.getElementById(
            "statusChart"
        );

    if (
        !canvas ||
        typeof Chart ===
        "undefined"
    ) {
        return;
    }

    configureChartDefaults();

    const counts =
        STATUS_LIST.map(
            status =>
                allApplications.filter(
                    application =>
                        (
                            application.currentStatus ||
                            "APPLIED"
                        ) === status
                ).length
        );

    if (statusChart) {

        statusChart.destroy();

        statusChart = null;
    }

    statusChart =
        new Chart(
            canvas.getContext("2d"),
            {
                type: "doughnut",

                data: {

                    labels:
                        STATUS_LIST.map(
                            status =>
                                STATUS_LABELS[
                                    status
                                ]
                        ),

                    datasets: [
                        {
                            data: counts,

                            borderWidth: 2,

                            borderColor:
                                "#151d27",

                            backgroundColor: [
                                "#66717f",
                                "#e8b84b",
                                "#49c4bb",
                                "#5b9df9",
                                "#55c878",
                                "#ef7067"
                            ]
                        }
                    ]
                },

                options: {

                    responsive: true,

                    maintainAspectRatio: false,

                    cutout: "66%",

                    plugins: {

                        legend: {

                            position:
                                "bottom",

                            labels: {

                                padding: 15,

                                usePointStyle:
                                    true,

                                boxWidth: 8
                            }
                        }
                    }
                }
            }
        );
}


// ============================================================
// APPLICATIONS OVER TIME — DAILY TREND CHART
// ============================================================


// ============================================================
// APPLICATIONS OVER TIME — DAILY / MONTHLY / LAST 6 MONTHS / 1 YEAR
// ============================================================


function renderApplicationsTrendChart() {

    initializeApplicationsTrendRange();


    const canvas =
        document.getElementById(
            "applicationsTrendChart"
        );

    const rangeSelect =
        document.getElementById(
            "applicationsTrendRange"
        );

    if (
        !canvas ||
        typeof Chart ===
        "undefined"
    ) {
        return;
    }

    configureChartDefaults();

    const selectedRange =
        rangeSelect
            ? rangeSelect.value
            : "daily";


    // ========================================================
    // GET APPLICATION DATES
    // ========================================================

    const applicationDates =
        allApplications
            .filter(
                application =>
                    application.appliedDate
            )
            .map(
                application =>
                    String(
                        application.appliedDate
                    ).substring(
                        0,
                        10
                    )
            )
            .sort();


    // ========================================================
    // NO APPLICATION DATA
    // ========================================================

    if (
        !applicationDates.length
    ) {

        if (
            applicationsTrendChart
        ) {

            applicationsTrendChart.destroy();

            applicationsTrendChart =
                null;
        }

        return;
    }


    // ========================================================
    // DAILY
    // ========================================================

    if (
        selectedRange ===
        "daily"
    ) {

        renderApplicationsDailyChart(
            canvas,
            applicationDates
        );

        return;
    }


    // ========================================================
    // MONTHLY
    // ========================================================

    if (
        selectedRange ===
        "monthly"
    ) {

        renderApplicationsMonthlyChart(
            canvas,
            applicationDates
        );

        return;
    }


    // ========================================================
    // LAST 6 MONTHS
    // ========================================================

    if (
        selectedRange ===
        "6months"
    ) {

        renderApplicationsPeriodChart(
            canvas,
            applicationDates,
            6
        );

        return;
    }


    // ========================================================
    // LAST 1 YEAR
    // ========================================================

    if (
        selectedRange ===
        "1year"
    ) {

        renderApplicationsPeriodChart(
            canvas,
            applicationDates,
            12
        );

        return;
    }
}


// ============================================================
// DAILY APPLICATIONS CHART
// ============================================================

function renderApplicationsDailyChart(
    canvas,
    applicationDates
) {

    const grouped =
        {};


    applicationDates.forEach(
        date => {

            grouped[date] =
                (
                    grouped[date] ||
                    0
                ) + 1;
        }
    );


    const dates =
        Object.keys(
            grouped
        ).sort();


    if (
        !dates.length
    ) {
        return;
    }


    // ========================================================
    // CREATE COMPLETE DATE RANGE
    // ========================================================

    const startDate =
        new Date(
            dates[0] +
            "T00:00:00"
        );


    const endDate =
        new Date(
            dates[
                dates.length - 1
            ] +
            "T00:00:00"
        );


    const chartDates =
        [];


    const currentDate =
        new Date(
            startDate
        );


    while (
        currentDate <=
        endDate
    ) {

        const year =
            currentDate.getFullYear();


        const month =
            String(
                currentDate.getMonth() + 1
            ).padStart(
                2,
                "0"
            );


        const day =
            String(
                currentDate.getDate()
            ).padStart(
                2,
                "0"
            );


        const dateKey =
            year +
            "-" +
            month +
            "-" +
            day;


        chartDates.push(
            dateKey
        );


        currentDate.setDate(
            currentDate.getDate() + 1
        );
    }


    // ========================================================
    // LABELS
    // ========================================================

    const labels =
        chartDates.map(
            date => {

                const dateObject =
                    new Date(
                        date +
                        "T00:00:00"
                    );


                return dateObject.toLocaleDateString(
                    "en-US",
                    {
                        month: "short",
                        day: "numeric"
                    }
                );
            }
        );


    // ========================================================
    // VALUES
    // ========================================================

    const values =
        chartDates.map(
            date =>
                grouped[date] ||
                0
        );


    createApplicationsTrendChart(
        canvas,
        labels,
        values
    );
}


// ============================================================
// MONTHLY APPLICATIONS CHART
// ============================================================

function renderApplicationsMonthlyChart(
    canvas,
    applicationDates
) {

    const grouped =
        {};


    applicationDates.forEach(
        date => {

            const month =
                date.substring(
                    0,
                    7
                );


            grouped[month] =
                (
                    grouped[month] ||
                    0
                ) + 1;
        }
    );


    const months =
        Object.keys(
            grouped
        ).sort();


    const labels =
        months.map(
            month => {

                const date =
                    new Date(
                        month +
                        "-01T00:00:00"
                    );


                return date.toLocaleDateString(
                    "en-US",
                    {
                        month: "short",
                        year: "numeric"
                    }
                );
            }
        );


    const values =
        months.map(
            month =>
                grouped[month]
        );


    createApplicationsTrendChart(
        canvas,
        labels,
        values
    );
}


// ============================================================
// LAST 6 MONTHS / LAST 1 YEAR
// ============================================================

function renderApplicationsPeriodChart(
    canvas,
    applicationDates,
    numberOfMonths
) {

    const now =
        new Date();


    const months =
        [];


    // ========================================================
    // CREATE MONTH RANGE
    // ========================================================

    for (
        let i =
            numberOfMonths - 1;
        i >= 0;
        i--
    ) {

        const date =
            new Date(
                now.getFullYear(),
                now.getMonth() - i,
                1
            );


        const year =
            date.getFullYear();


        const month =
            String(
                date.getMonth() + 1
            ).padStart(
                2,
                "0"
            );


        months.push(
            year +
            "-" +
            month
        );
    }


    // ========================================================
    // GROUP APPLICATIONS
    // ========================================================

    const grouped =
        {};


    months.forEach(
        month => {

            grouped[month] =
                0;
        }
    );


    applicationDates.forEach(
        date => {

            const month =
                date.substring(
                    0,
                    7
                );


            if (
                Object.prototype.hasOwnProperty.call(
                    grouped,
                    month
                )
            ) {

                grouped[month]++;
            }
        }
    );


    // ========================================================
    // LABELS
    // ========================================================

    const labels =
        months.map(
            month => {

                const date =
                    new Date(
                        month +
                        "-01T00:00:00"
                    );


                return date.toLocaleDateString(
                    "en-US",
                    {
                        month: "short",
                        year: "numeric"
                    }
                );
            }
        );


    // ========================================================
    // VALUES
    // ========================================================

    const values =
        months.map(
            month =>
                grouped[month]
        );


    createApplicationsTrendChart(
        canvas,
        labels,
        values
    );
}


// ============================================================
// CREATE APPLICATION TREND CHART
// ============================================================

function createApplicationsTrendChart(
    canvas,
    labels,
    values
) {

    // ========================================================
    // DESTROY PREVIOUS CHART
    // ========================================================

    if (
        applicationsTrendChart
    ) {

        applicationsTrendChart.destroy();

        applicationsTrendChart =
            null;
    }


    // ========================================================
    // CREATE NEW CHART
    // ========================================================

    applicationsTrendChart =
        new Chart(
            canvas.getContext(
                "2d"
            ),
            {

                type:
                    "line",


                data: {

                    labels:
                        labels,


                    datasets: [

                        {

                            label:
                                "Applications",


                            data:
                                values,


                            tension:
                                0.35,


                            borderWidth:
                                2,


                            pointRadius:
                                4,


                            pointHoverRadius:
                                6,


                            fill:
                                false,


                            borderColor:
                                "#f2a93b",


                            pointBackgroundColor:
                                "#f2a93b"
                        }

                    ]
                },


                options: {

                    responsive:
                        true,


                    maintainAspectRatio:
                        false,


                    interaction: {

                        intersect:
                            false,


                        mode:
                            "index"
                    },


                    scales: {

                        x: {

                            ticks: {

                                autoSkip:
                                    true,


                                maxTicksLimit:
                                    8
                            }
                        },


                        y: {

                            beginAtZero:
                                true,


                            ticks: {

                                precision:
                                    0,


                                stepSize:
                                    1
                            },


                            suggestedMax:
                                Math.max(
                                    3,
                                    Math.max(
                                        ...values
                                    ) + 1
                                )
                        }
                    },


                    plugins: {

                        legend: {

                            display:
                                false
                        },


                        tooltip: {

                            callbacks: {

                                label:
                                    function(
                                        context
                                    ) {

                                        const count =
                                            context
                                                .parsed
                                                .y;


                                        return (
                                            count +
                                            (
                                                count ===
                                                1
                                                    ? " application"
                                                    : " applications"
                                            )
                                        );
                                    }
                            }
                        }
                    }
                }
            }
        );
}



// ============================================================
// APPLICATION TREND RANGE SELECTOR
// CUSTOM DARK DROPDOWN
// ============================================================

function initializeApplicationsTrendRange() {

    const rangeSelect =
        document.getElementById(
            "applicationsTrendRange"
        );

    if (!rangeSelect) {
        return;
    }

    // Prevent duplicate initialization
    if (
        rangeSelect.dataset.customDropdownInitialized ===
        "true"
    ) {
        return;
    }

    rangeSelect.dataset.customDropdownInitialized =
        "true";


    // ========================================================
    // ADD DROPDOWN CSS ONLY ONCE
    // ========================================================

    if (
        !document.getElementById(
            "applicationsTrendDropdownStyles"
        )
    ) {

        const style =
            document.createElement("style");

        style.id =
            "applicationsTrendDropdownStyles";

        style.textContent = `

            .trend-range-dropdown {
                position: relative;
                width: 150px;
                font-family: inherit;
                z-index: 50;
            }

            .trend-range-select-native {
                display: none !important;
            }

            .trend-range-button {
                width: 100%;
                min-height: 34px;
                padding: 7px 34px 7px 12px;

                border: 1px solid #394756;
                border-radius: 8px;

                background: #0f151d;
                color: #edf2f7;

                font-size: 13px;
                font-weight: 500;

                text-align: left;

                cursor: pointer;

                position: relative;

                transition:
                    border-color 0.2s ease,
                    background 0.2s ease;
            }

            .trend-range-button:hover {
                background: #151d27;
                border-color: #f2a93b;
            }

            .trend-range-button:focus {
                outline: none;
                border-color: #f2a93b;
            }

            .trend-range-arrow {
                position: absolute;
                right: 12px;
                top: 50%;

                width: 7px;
                height: 7px;

                border-right: 2px solid #a8b2bf;
                border-bottom: 2px solid #a8b2bf;

                transform:
                    translateY(-65%)
                    rotate(45deg);

                transition:
                    transform 0.2s ease;
            }

            .trend-range-dropdown.open
            .trend-range-arrow {
                transform:
                    translateY(-25%)
                    rotate(225deg);
            }

            .trend-range-menu {
                position: absolute;

                top: calc(100% + 6px);
                left: 0;

                width: 100%;

                padding: 5px;

                background: #0f151d;

                border: 1px solid #394756;
                border-radius: 8px;

                box-shadow:
                    0 12px 30px rgba(0, 0, 0, 0.45);

                display: none;

                overflow: hidden;
            }

            .trend-range-dropdown.open
            .trend-range-menu {
                display: block;
            }

            .trend-range-option {
                width: 100%;

                padding: 9px 10px;

                border: none;
                border-radius: 6px;

                background: transparent;
                color: #a8b2bf;

                font-family: inherit;
                font-size: 13px;
                font-weight: 500;

                text-align: left;

                cursor: pointer;

                transition:
                    background 0.15s ease,
                    color 0.15s ease;
            }

            .trend-range-option:hover {
                background: #18212c;
                color: #ffffff;
            }

            .trend-range-option.active {
                background: #2a2418;
                color: #f2a93b;
            }

        `;

        document.head.appendChild(style);
    }


    // ========================================================
    // CREATE CUSTOM DROPDOWN
    // ========================================================

    const wrapper =
        document.createElement("div");

    wrapper.className =
        "trend-range-dropdown";


    // ========================================================
    // BUTTON
    // ========================================================

    const button =
        document.createElement("button");

    button.type =
        "button";

    button.className =
        "trend-range-button";

    button.setAttribute(
        "aria-haspopup",
        "listbox"
    );

    button.setAttribute(
        "aria-expanded",
        "false"
    );


    const arrow =
        document.createElement("span");

    arrow.className =
        "trend-range-arrow";


    // ========================================================
    // MENU
    // ========================================================

    const menu =
        document.createElement("div");

    menu.className =
        "trend-range-menu";

    menu.setAttribute(
        "role",
        "listbox"
    );


    // ========================================================
    // BUILD OPTIONS FROM EXISTING SELECT
    // ========================================================

    Array.from(
        rangeSelect.options
    ).forEach(option => {

        const customOption =
            document.createElement("button");

        customOption.type =
            "button";

        customOption.className =
            "trend-range-option";

        customOption.textContent =
            option.textContent;

        customOption.dataset.value =
            option.value;

        customOption.setAttribute(
            "role",
            "option"
        );


        if (
            option.value ===
            rangeSelect.value
        ) {

            customOption.classList.add(
                "active"
            );
        }


        customOption.addEventListener(
            "click",
            event => {

                event.preventDefault();
                event.stopPropagation();


                // Update native select value
                rangeSelect.value =
                    customOption.dataset.value;


                // Update button text
                button.firstChild.textContent =
                    customOption.textContent +
                    " ";


                // Update active option
                menu
                    .querySelectorAll(
                        ".trend-range-option"
                    )
                    .forEach(item => {

                        item.classList.remove(
                            "active"
                        );

                    });


                customOption.classList.add(
                    "active"
                );


                // Close dropdown
                wrapper.classList.remove(
                    "open"
                );

                button.setAttribute(
                    "aria-expanded",
                    "false"
                );


                // Trigger existing chart logic
                rangeSelect.dispatchEvent(
                    new Event(
                        "change",
                        {
                            bubbles: true
                        }
                    )
                );

            }
        );


        menu.appendChild(
            customOption
        );

    });


    // ========================================================
    // SET INITIAL BUTTON TEXT
    // ========================================================

    const selectedOption =
        rangeSelect.options[
            rangeSelect.selectedIndex
        ];

    button.textContent =
        selectedOption
            ? selectedOption.textContent + " "
            : "Daily ";


    button.appendChild(
        arrow
    );


    // ========================================================
    // OPEN / CLOSE
    // ========================================================

    button.addEventListener(
        "click",
        event => {

            event.preventDefault();
            event.stopPropagation();


            const isOpen =
                wrapper.classList.contains(
                    "open"
                );


            // Close other dropdowns
            document
                .querySelectorAll(
                    ".trend-range-dropdown.open"
                )
                .forEach(dropdown => {

                    if (
                        dropdown !== wrapper
                    ) {

                        dropdown.classList.remove(
                            "open"
                        );

                        const otherButton =
                            dropdown.querySelector(
                                ".trend-range-button"
                            );

                        if (otherButton) {

                            otherButton.setAttribute(
                                "aria-expanded",
                                "false"
                            );

                        }

                    }

                });


            if (isOpen) {

                wrapper.classList.remove(
                    "open"
                );

                button.setAttribute(
                    "aria-expanded",
                    "false"
                );

            } else {

                wrapper.classList.add(
                    "open"
                );

                button.setAttribute(
                    "aria-expanded",
                    "true"
                );

            }

        }
    );


    // ========================================================
    // CLOSE WHEN CLICKING OUTSIDE
    // ========================================================

    document.addEventListener(
        "click",
        event => {

            if (
                !wrapper.contains(
                    event.target
                )
            ) {

                wrapper.classList.remove(
                    "open"
                );

                button.setAttribute(
                    "aria-expanded",
                    "false"
                );

            }

        }
    );


    // ========================================================
    // ADD CUSTOM DROPDOWN
    // ========================================================

    wrapper.appendChild(
        button
    );

    wrapper.appendChild(
        menu
    );


    rangeSelect
        .classList.add(
            "trend-range-select-native"
        );


    rangeSelect.parentNode.insertBefore(
        wrapper,
        rangeSelect
    );


    // ========================================================
    // KEEP EXISTING CHANGE LISTENER
    // ========================================================

    rangeSelect.addEventListener(
        "change",
        () => {

            renderApplicationsTrendChart();

        }
    );

}

/* ============================================================
   SOURCE CHART
   ============================================================ */

function renderSourceChart() {

    const canvas =
        document.getElementById(
            "sourceChart"
        );

    const list =
        document.getElementById(
            "sourceAnalyticsList"
        );

    if (
        !canvas ||
        typeof Chart ===
        "undefined"
    ) {
        return;
    }

    configureChartDefaults();

    const sourceCounts = {};

    allApplications.forEach(
        application => {

            const source =
                application.source ||
                "OTHER";

            sourceCounts[source] =
                (
                    sourceCounts[source] ||
                    0
                ) + 1;
        }
    );

    const sources =
        Object.keys(
            sourceCounts
        ).sort(
            (a, b) =>
                sourceCounts[b] -
                sourceCounts[a]
        );

    const values =
        sources.map(
            source =>
                sourceCounts[source]
        );

    if (sourceChart) {

        sourceChart.destroy();

        sourceChart = null;
    }

    sourceChart =
        new Chart(
            canvas.getContext("2d"),
            {
                type: "bar",

                data: {

                    labels:
                        sources.map(
                            source =>
                                SOURCE_LABELS[
                                    source
                                ] ||
                                source
                        ),

                    datasets: [
                        {
                            label:
                                "Applications",

                            data:
                                values,

                            borderRadius:
                                6,

                            backgroundColor:
                                "#5b9df9"
                        }
                    ]
                },

                options: {

                    responsive: true,

                    maintainAspectRatio: false,

                    plugins: {

                        legend: {
                            display: false
                        }
                    },

                    scales: {

                        y: {

                            beginAtZero:
                                true,

                            ticks: {
                                precision: 0
                            }
                        }
                    }
                }
            }
        );

    if (sources.length) {

        const top =
            sources[0];

        setText(
            "topSourceName",
            SOURCE_LABELS[top] ||
            top
        );

        setText(
            "topSourceCount",
            sourceCounts[top] +
            " applications"
        );

    } else {

        setText(
            "topSourceName",
            "No data"
        );

        setText(
            "topSourceCount",
            "0 applications"
        );
    }

    if (list) {

        if (!sources.length) {

            list.innerHTML = `
                <div class="empty-inline">
                    No source data yet.
                </div>
            `;

        } else {

            list.innerHTML =
                sources
                    .map(source => {

                        const count =
                            sourceCounts[
                                source
                            ];

                        const percentage =
                            allApplications.length
                                ? count /
                                  allApplications.length *
                                  100
                                : 0;

                        return `

                            <div class="source-row">

                                <div>

                                    <strong>
                                        ${escapeHTML(
                                            SOURCE_LABELS[
                                                source
                                            ] ||
                                            source
                                        )}
                                    </strong>

                                    <span>
                                        ${count}
                                        applications
                                    </span>

                                </div>

                                <strong>
                                    ${formatPercent(
                                        percentage
                                    )}
                                </strong>

                            </div>
                        `;
                    })
                    .join("");
        }
    }
}


/* ============================================================
   NAVIGATION
   ============================================================ */

function initializeNavigation() {

    document
        .querySelectorAll(
            ".nav-item[data-view]"
        )
        .forEach(item => {

            item.addEventListener(
                "click",
                () => {

                    const view =
                        item.dataset.view;

                    if (view) {
                        showView(view);
                    }
                }
            );
        });

    document
        .querySelectorAll(
            "[data-view-jump]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const view =
                        button.dataset.viewJump;

                    if (view) {
                        showView(view);
                    }
                }
            );
        });
}


function showView(
    viewId
) {

    const views =
        document.querySelectorAll(
            ".page-view"
        );

    views.forEach(view => {

        view.classList.remove(
            "active-view"
        );

        view.style.display = "none";
    });

    const target =
        document.getElementById(
            viewId
        );

    if (!target) {

        console.error(
            "View not found:",
            viewId
        );

        return;
    }

    target.classList.add(
        "active-view"
    );

    target.style.display =
        "block";

    currentView =
        viewId;

    document
        .querySelectorAll(
            ".nav-item[data-view]"
        )
        .forEach(item => {

            item.classList.toggle(
                "active",
                item.dataset.view ===
                viewId
            );
        });

    updatePageTitle(
        viewId
    );

    if (
        viewId ===
        "dashboardView"
    ) {

        renderDashboard();

    } else if (
        viewId ===
        "applicationsView"
    ) {

        applyFiltersAndRender();

    } else if (
        viewId ===
        "interviewsView"
    ) {

        renderInterviewsView();

    } else if (
        viewId ===
        "followupsView"
    ) {

        renderFollowupsView();

    } else if (
        viewId ===
        "analyticsView"
    ) {

        renderAnalytics();
    }

    closeMobileSidebar();
}


function updatePageTitle(
    viewId
) {

    const title =
        document.getElementById(
            "pageTitle"
        );

    if (!title) {
        return;
    }

    const titles = {

        dashboardView:
            "Dashboard",

        applicationsView:
            "Applications",

        interviewsView:
            "Interviews",

        followupsView:
            "Follow-ups",

        analyticsView:
            "Analytics"
    };

    title.textContent =
        titles[viewId] ||
        "Dashboard";
}


/* ============================================================
   MOBILE MENU
   ============================================================ */

function initializeDashboardActions() {

    const menuButton =
        document.getElementById(
            "mobileMenuBtn"
        );

    if (!menuButton) {
        return;
    }

    menuButton.addEventListener(
        "click",
        () => {

            document.body.classList.toggle(
                "sidebar-open"
            );

        }
    );
}


function closeMobileSidebar() {

    document.body.classList.remove(
        "sidebar-open"
    );
}


/* ============================================================
   LOGOUT
   ============================================================ */

function initializeLogout() {

    const logoutButton =
        document.getElementById(
            "logoutBtn"
        );

    if (!logoutButton) {
        return;
    }

    logoutButton.addEventListener(
        "click",
        event => {

            event.preventDefault();

            localStorage.removeItem(
                "jwt_token"
            );

            localStorage.removeItem(
                "user_id"
            );

            localStorage.removeItem(
                "user_email"
            );

            localStorage.removeItem(
                "user_name"
            );

            window.location.replace(
                LOGIN_PAGE
            );
        }
    );
}


/* ============================================================
   VIEW INITIALIZATION
   ============================================================ */

function initializeViewState() {

    document
        .querySelectorAll(
            ".page-view"
        )
        .forEach(view => {

            if (
                view.id ===
                "dashboardView"
            ) {

                view.style.display =
                    "block";

                view.classList.add(
                    "active-view"
                );

            } else {

                view.style.display =
                    "none";

                view.classList.remove(
                    "active-view"
                );
            }
        });
}


/* ============================================================
   DEFAULT DATE
   ============================================================ */

function setDefaultApplicationDate() {

    const input =
        document.getElementById(
            "dateInput"
        );

    if (
        input &&
        !input.value
    ) {

        input.value =
            getTodayISO();
    }
}


/* ============================================================
   RESULTS COUNT
   ============================================================ */

function updateResultsCount(
    count
) {

    const element =
        document.getElementById(
            "resultsCount"
        );

    if (!element) {
        return;
    }

    element.textContent =
        count +
        (
            count === 1
                ? " application"
                : " applications"
        );
}


/* ============================================================
   GLOBAL ERROR
   ============================================================ */

function showGlobalError(
    message
) {

    console.error(
        message
    );

    showToast(
        message,
        "error"
    );
}


/* ============================================================
   TOAST
   ============================================================ */

function showToast(
    message,
    type = "info"
) {

    let container =
        document.getElementById(
            "toastContainer"
        );

    if (!container) {

        container =
            document.createElement(
                "div"
            );

        container.id =
            "toastContainer";

        container.className =
            "toast-container";

        document.body.appendChild(
            container
        );
    }

    const toast =
        document.createElement(
            "div"
        );

    toast.className =
        "toast " +
        (
            type === "error"
                ? "error"
                : type === "success"
                    ? "success"
                    : ""
        );

    toast.textContent =
        String(message);

    container.appendChild(
        toast
    );

    requestAnimationFrame(() => {

        toast.style.opacity =
            "1";

    });

    setTimeout(() => {

        toast.style.opacity =
            "0";

        toast.style.transform =
            "translateY(8px)";

        toast.style.transition =
            "opacity .2s ease, transform .2s ease";

        setTimeout(
            () => toast.remove(),
            250
        );

    }, 3500);
}


/* ============================================================
   MODAL ERROR
   ============================================================ */

function showModalError(
    element,
    message
) {

    if (!element) {
        return;
    }

    element.textContent =
        String(message || "");
}


function showDeleteConfirmation(
    title,
    message,
    warning
) {

    return new Promise(resolve => {

        const existing =
            document.getElementById(
                "deleteConfirmationModal"
            );


        if (existing) {
            existing.remove();
        }


        const modal =
            document.createElement("div");


        modal.id =
            "deleteConfirmationModal";


        modal.className =
            "modal-overlay";


        modal.innerHTML = `

            <div
                class="modal delete-confirmation-modal"
            >

                <div class="modal-header">

                    <h3>
                        ${escapeHTML(title)}
                    </h3>

                    <button
                        type="button"
                        class="modal-close"
                        id="deleteCancelTop"
                    >
                        ×
                    </button>

                </div>


                <div class="modal-body">

                    <p>
                        ${escapeHTML(message)}
                    </p>

                    <p class="delete-warning">
                        ${escapeHTML(warning)}
                    </p>

                </div>


                <div class="modal-actions">

                    <button
                        type="button"
                        class="button button-secondary"
                        id="deleteCancelButton"
                    >
                        Cancel
                    </button>


                    <button
                        type="button"
                        class="button button-danger"
                        id="deleteConfirmButton"
                    >
                        Delete
                    </button>

                </div>

            </div>

        `;


        document.body.appendChild(
            modal
        );


        modal.style.display =
            "flex";


        const closeModal =
            result => {

                modal.remove();

                resolve(result);
            };


        document
            .getElementById(
                "deleteCancelTop"
            )
            .addEventListener(
                "click",
                () => {
                    closeModal(false);
                }
            );


        document
            .getElementById(
                "deleteCancelButton"
            )
            .addEventListener(
                "click",
                () => {
                    closeModal(false);
                }
            );


        document
            .getElementById(
                "deleteConfirmButton"
            )
            .addEventListener(
                "click",
                () => {
                    closeModal(true);
                }
            );


        modal.addEventListener(
            "click",
            event => {

                if (
                    event.target ===
                    modal
                ) {
                    closeModal(false);
                }
            }
        );

    });
}


/* ============================================================
   BUTTON LOADING
   ============================================================ */

function setButtonLoading(
    button,
    loading,
    loadingText
) {

    if (!button) {
        return;
    }

    if (loading) {

        if (
            !button.dataset.originalText
        ) {

            button.dataset.originalText =
                button.innerHTML;
        }

        button.disabled = true;

        button.innerHTML = `
            <span class="spinner"></span>
            ${escapeHTML(
                loadingText ||
                "Loading..."
            )}
        `;

    } else {

        button.disabled = false;

        if (
            button.dataset.originalText
        ) {

            button.innerHTML =
                button.dataset.originalText;

            delete button.dataset.originalText;
        }
    }
}


/* ============================================================
   TEXT
   ============================================================ */

function setText(
    id,
    value
) {

    const element =
        document.getElementById(
            id
        );

    if (element) {
        element.textContent =
            value == null
                ? ""
                : String(value);
    }
}


/* ============================================================
   INPUT
   ============================================================ */

function getInputValue(
    id
) {

    const element =
        document.getElementById(
            id
        );

    if (!element) {
        return "";
    }

    return String(
        element.value || ""
    ).trim();
}


function setInputValue(
    id,
    value
) {

    const element =
        document.getElementById(
            id
        );

    if (!element) {
        return;
    }

    element.value =
        value == null
            ? ""
            : value;
}


/* ============================================================
   DATE — TODAY
   ============================================================ */

function getTodayISO() {

    const now =
        new Date();

    const year =
        now.getFullYear();

    const month =
        String(
            now.getMonth() + 1
        ).padStart(
            2,
            "0"
        );

    const day =
        String(
            now.getDate()
        ).padStart(
            2,
            "0"
        );

    return (
        year +
        "-" +
        month +
        "-" +
        day
    );
}


/* ============================================================
   DATE — PARSE LOCAL
   ============================================================ */

function parseLocalDate(
    value
) {

    if (!value) {
        return null;
    }

    const text =
        String(value);

    const match =
        text.match(
            /^(\d{4})-(\d{2})-(\d{2})/
        );

    if (match) {

        return new Date(
            Number(match[1]),
            Number(match[2]) - 1,
            Number(match[3])
        );
    }

    const date =
        new Date(value);

    return Number.isNaN(
        date.getTime()
    )
        ? null
        : date;
}


/* ============================================================
   FORMAT DATE
   ============================================================ */

function formatDate(
    value
) {

    if (!value) {
        return "-";
    }

    const date =
        parseLocalDate(value);

    if (!date) {
        return String(value);
    }

    return date.toLocaleDateString(
        undefined,
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );
}


/* ============================================================
   FORMAT DATE TIME
   ============================================================ */

function formatDateTime(
    value
) {

    if (!value) {
        return "-";
    }

    const date =
        new Date(value);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return String(value);
    }

    return date.toLocaleString(
        undefined,
        {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit"
        }
    );
}


/* ============================================================
   FORMAT TIME
   ============================================================ */

function formatTime(
    value
) {

    if (!value) {
        return "";
    }

    const parts =
        String(value).split(":");

    if (parts.length < 2) {
        return String(value);
    }

    const hour =
        Number(parts[0]);

    const minute =
        parts[1];

    if (
        Number.isNaN(hour)
    ) {
        return String(value);
    }

    const suffix =
        hour >= 12
            ? "PM"
            : "AM";

    const displayHour =
        hour % 12 || 12;

    return (
        displayHour +
        ":" +
        minute +
        " " +
        suffix
    );
}


/* ============================================================
   DAY NUMBER
   ============================================================ */

function formatDayNumber(
    value
) {

    const date =
        parseLocalDate(value);

    if (!date) {
        return "-";
    }

    return String(
        date.getDate()
    ).padStart(
        2,
        "0"
    );
}


/* ============================================================
   MONTH SHORT
   ============================================================ */

function formatMonthShort(
    value
) {

    const date =
        parseLocalDate(value);

    if (!date) {
        return "";
    }

    return date.toLocaleDateString(
        undefined,
        {
            month: "short"
        }
    );
}


/* ============================================================
   MONTH LABEL
   ============================================================ */

function formatMonthLabel(
    value
) {

    const parts =
        String(value).split("-");

    if (
        parts.length !== 2
    ) {
        return value;
    }

    const year =
        Number(parts[0]);

    const month =
        Number(parts[1]);

    if (
        !year ||
        !month
    ) {
        return value;
    }

    const date =
        new Date(
            year,
            month - 1,
            1
        );

    return date.toLocaleDateString(
        undefined,
        {
            month: "short",
            year: "numeric"
        }
    );
}


/* ============================================================
   BUILD DATE TIME
   ============================================================ */

function buildDateTime(
    dateValue,
    timeValue
) {

    const date =
        parseLocalDate(
            dateValue
        );

    if (!date) {
        return Number.MAX_SAFE_INTEGER;
    }

    if (timeValue) {

        const parts =
            String(
                timeValue
            ).split(":");

        if (parts.length >= 2) {

            date.setHours(
                Number(parts[0]) || 0,
                Number(parts[1]) || 0,
                Number(parts[2]) || 0,
                0
            );
        }
    }

    return date.getTime();
}


/* ============================================================
   COMPARE DATES
   ============================================================ */

function compareDates(
    first,
    second
) {

    const firstDate =
        parseLocalDate(first);

    const secondDate =
        parseLocalDate(second);

    if (
        !firstDate &&
        !secondDate
    ) {
        return 0;
    }

    if (!firstDate) {
        return 1;
    }

    if (!secondDate) {
        return -1;
    }

    return (
        firstDate.getTime() -
        secondDate.getTime()
    );
}


/* ============================================================
   COMPARE DATE TIMES
   ============================================================ */

function compareDateTimes(
    first,
    second
) {

    const firstDate =
        new Date(first);

    const secondDate =
        new Date(second);

    if (
        Number.isNaN(
            firstDate.getTime()
        )
    ) {
        return 1;
    }

    if (
        Number.isNaN(
            secondDate.getTime()
        )
    ) {
        return -1;
    }

    return (
        firstDate.getTime() -
        secondDate.getTime()
    );
}


/* ============================================================
   PERCENTAGE
   ============================================================ */

function formatPercent(
    value
) {

    const number =
        Number(value);

    if (
        Number.isNaN(number)
    ) {
        return "0.0%";
    }

    return (
        number.toFixed(1) +
        "%"
    );
}


/* ============================================================
   HTML ESCAPE
   ============================================================ */

function escapeHTML(
    value
) {

    return String(
        value == null
            ? ""
            : value
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );
}


function escapeAttribute(
    value
) {
    return escapeHTML(value);
}


/* ============================================================
   RESIZE
   ============================================================ */

window.addEventListener(
    "resize",
    () => {

        if (
            window.innerWidth >
            760
        ) {

            closeMobileSidebar();
        }
    }
);


/* ============================================================
   CLICK OUTSIDE MOBILE SIDEBAR
   ============================================================ */

document.addEventListener(
    "click",
    event => {

        if (
            window.innerWidth >
            760
        ) {
            return;
        }

        if (
            !document.body.classList.contains(
                "sidebar-open"
            )
        ) {
            return;
        }

        const sidebar =
            document.getElementById(
                "sidebar"
            );

        const menuButton =
            document.getElementById(
                "mobileMenuBtn"
            );

        if (
            sidebar &&
            !sidebar.contains(event.target) &&
            menuButton &&
            !menuButton.contains(event.target)
        ) {

            closeMobileSidebar();
        }
    }

    
);

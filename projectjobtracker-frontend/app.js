// ============================================================
// JOB TRACKER — AUTHENTICATION
// ============================================================

const API_BASE =
    "https://jobtracker-backend-47ef.onrender.com/api";


// ============================================================
// AUTH MODE
// ============================================================

let isRegisterMode = false;


// ============================================================
// DOM ELEMENTS
// ============================================================

const formTitle =
    document.getElementById("formTitle");

const formSub =
    document.getElementById("formSub");

const nameField =
    document.getElementById("nameField");

const switchText =
    document.getElementById("switchText");

const switchLink =
    document.getElementById("switchLink");

const submitBtn =
    document.getElementById("submitBtn");

const errorMsg =
    document.getElementById("errorMsg");

const stubStatus =
    document.getElementById("stubStatus");

const authForm =
    document.getElementById("authForm");


// ============================================================
// SWITCH LOGIN / REGISTER
// ============================================================

switchLink.addEventListener(
    "click",
    (event) => {

        event.preventDefault();

        isRegisterMode =
            !isRegisterMode;


        if (isRegisterMode) {

            formTitle.textContent =
                "Create account";


            formSub.textContent =
                "Register to start tracking your applications.";


            nameField.style.display =
                "block";


            switchText.textContent =
                "Already boarding?";


            switchLink.textContent =
                "Sign in instead";


            submitBtn.textContent =
                "Register";


        } else {

            formTitle.textContent =
                "Sign in";


            formSub.textContent =
                "Enter your credentials to check in.";


            nameField.style.display =
                "none";


            switchText.textContent =
                "New here?";


            switchLink.textContent =
                "Create an account";


            submitBtn.textContent =
                "Check in";

        }


        errorMsg.textContent =
            "";

    }
);



// ============================================================
// AUTH FORM SUBMIT
// ============================================================

authForm.addEventListener(

    "submit",

    async (event) => {

        event.preventDefault();


        // ----------------------------------------------------
        // RESET MESSAGES
        // ----------------------------------------------------

        errorMsg.textContent =
            "";

        stubStatus.textContent =
            "WAIT";


        // ----------------------------------------------------
        // GET FORM VALUES
        // ----------------------------------------------------

        const email =
            document
                .getElementById("emailInput")
                .value
                .trim();


        const password =
            document
                .getElementById("passwordInput")
                .value;


        const name =
            document
                .getElementById("nameInput")
                .value
                .trim();


        // ----------------------------------------------------
        // ENDPOINT
        // ----------------------------------------------------

        const endpoint =
            isRegisterMode
                ? "/auth/register"
                : "/auth/login";


        // ----------------------------------------------------
        // REQUEST BODY
        // ----------------------------------------------------

        const body =
            isRegisterMode

                ? {
                    name:
                        name,

                    email:
                        email,

                    password:
                        password
                }

                : {
                    email:
                        email,

                    password:
                        password
                };


        try {

            // =================================================
            // LOGIN / REGISTER REQUEST
            // =================================================

            const res =
                await fetch(

                    API_BASE + endpoint,

                    {

                        method:
                            "POST",


                        headers: {

                            "Content-Type":
                                "application/json"

                        },


                        body:
                            JSON.stringify(
                                body
                            )

                    }

                );


            // -------------------------------------------------
            // READ RESPONSE
            // -------------------------------------------------

            const data =
                await res
                    .json()
                    .catch(
                        () => ({})
                    );


            // -------------------------------------------------
            // ERROR
            // -------------------------------------------------

            if (!res.ok) {

                throw new Error(

                    data.error ||
                    data.message ||
                    "Something went wrong"

                );

            }



            // =================================================
            // REGISTRATION SUCCESS
            // =================================================

            if (isRegisterMode) {

                stubStatus.textContent =
                    "READY";


                /*
                 * Registration is successful.
                 *
                 * We intentionally do NOT store
                 * user information here because the
                 * user still needs to sign in.
                 */


                isRegisterMode =
                    false;


                formTitle.textContent =
                    "Sign in";


                formSub.textContent =
                    "Account created. Please sign in.";


                nameField.style.display =
                    "none";


                switchText.textContent =
                    "New here?";


                switchLink.textContent =
                    "Create an account";


                submitBtn.textContent =
                    "Check in";


                /*
                 * Keep the email field so the user
                 * can immediately log in.
                 */

                document
                    .getElementById(
                        "passwordInput"
                    )
                    .value =
                    "";


                return;

            }



            // =================================================
            // LOGIN SUCCESS
            // =================================================

            /*
             * Save JWT first.
             */

            localStorage.setItem(
                "jwt_token",
                data.token
            );


            /*
             * Save email from login form.
             */

            localStorage.setItem(
                "user_email",
                email
            );



            // =================================================
            // GET CURRENT USER PROFILE
            // =================================================

            const meRes =
                await fetch(

                    API_BASE +
                    "/auth/me",

                    {

                        method:
                            "GET",


                        headers: {

                            "Authorization":
                                "Bearer " +
                                data.token

                        }

                    }

                );


            // -------------------------------------------------
            // PROFILE ERROR
            // -------------------------------------------------

            if (!meRes.ok) {

                const errText =
                    await meRes.text();


                console.error(
                    "me endpoint failed:",
                    meRes.status,
                    errText
                );


                throw new Error(

                    "Login succeeded but fetching profile failed " +
                    "(status " +
                    meRes.status +
                    ")"

                );

            }



            // =================================================
            // PROFILE DATA
            // =================================================

            const meData =
                await meRes.json();


            console.log(
                "Logged-in user profile:",
                meData
            );



            // =================================================
            // SAVE USER ID
            // =================================================

            if (
                meData.id !==
                undefined &&
                meData.id !==
                null
            ) {

                localStorage.setItem(
                    "user_id",
                    String(
                        meData.id
                    )
                );

            }



            // =================================================
            // SAVE USER NAME
            // =================================================

            /*
             * This is the important part.
             *
             * Your /auth/me endpoint should return
             * something similar to:
             *
             * {
             *     id: 1,
             *     name: "Prakash Reddy",
             *     email: "test1@gmail.com"
             * }
             */

            if (
                meData.name !==
                undefined &&
                meData.name !==
                null &&
                String(
                    meData.name
                ).trim() !== ""
            ) {

                localStorage.setItem(
                    "user_name",
                    String(
                        meData.name
                    ).trim()
                );

            }



            // =================================================
            // SAVE EMAIL FROM PROFILE
            // =================================================

            localStorage.setItem(

                "user_email",

                meData.email ||
                email

            );



            // =================================================
            // LOGIN COMPLETE
            // =================================================

            stubStatus.textContent =
                "BOARDED";


            window.location.href =
                "dashboard.html";

        }


        // =====================================================
        // ERROR HANDLING
        // =====================================================

        catch (error) {

            console.error(
                "Authentication error:",
                error
            );


            stubStatus.textContent =
                "DENIED";


            errorMsg.textContent =
                error.message ||
                "Something went wrong.";

        }

    }

);

const API_BASE = "http://localhost:8080/api";

const form = document.getElementById("forgotForm");
const emailInput = document.getElementById("emailInput");
const message = document.getElementById("message");
const submitBtn = document.getElementById("submitBtn");
const stubStatus = document.getElementById("stubStatus");

form.addEventListener("submit", async (e) => {

    e.preventDefault();

    message.textContent = "";
    stubStatus.textContent = "WAIT";
    submitBtn.disabled = true;

    const email = emailInput.value.trim();

    try {

        const res = await fetch(
            API_BASE + "/auth/forgot-password",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    email: email
                })
            }
        );

        const data = await res.json();

        if (!res.ok) {
            throw new Error(
                data.error || "Unable to send reset link"
            );
        }

        stubStatus.textContent = "SENT";

        message.textContent =
            "Reset link sent. Check your email.";

        message.style.color = "#4FB3AD";

        emailInput.value = "";

    } catch (error) {

        stubStatus.textContent = "DENIED";

        message.textContent = error.message;

        message.style.color = "#B5544B";

    } finally {

        submitBtn.disabled = false;

    }

});
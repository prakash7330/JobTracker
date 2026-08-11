const API_BASE = "https://jobtracker-backend-47ef.onrender.com/api";

const form = document.getElementById("resetForm");
const passwordInput = document.getElementById("passwordInput");
const confirmPasswordInput = document.getElementById("confirmPasswordInput");
const message = document.getElementById("message");
const submitBtn = document.getElementById("submitBtn");
const stubStatus = document.getElementById("stubStatus");

// Get token from email link
const params = new URLSearchParams(window.location.search);
const token = params.get("token");

if (!token) {
    message.textContent = "Invalid password reset link.";
    message.style.color = "#B5544B";
    submitBtn.disabled = true;
}

form.addEventListener("submit", async (e) => {

    e.preventDefault();

    message.textContent = "";
    stubStatus.textContent = "WAIT";

    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    // Check passwords
    if (password !== confirmPassword) {
        message.textContent = "Passwords do not match.";
        message.style.color = "#B5544B";
        stubStatus.textContent = "DENIED";
        return;
    }

    if (password.length < 6) {
        message.textContent =
            "Password must be at least 6 characters.";

        message.style.color = "#B5544B";
        stubStatus.textContent = "DENIED";
        return;
    }

    submitBtn.disabled = true;

    try {

        const res = await fetch(
            API_BASE + "/auth/reset-password",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    token: token,
                    newPassword: password
                })
            }
        );

        const data = await res.json();

        if (!res.ok) {
            throw new Error(
                data.error || "Password reset failed."
            );
        }

        stubStatus.textContent = "DONE";

        message.textContent =
            "Password reset successfully. Redirecting to login...";

        message.style.color = "#4FB3AD";

        passwordInput.value = "";
        confirmPasswordInput.value = "";

        setTimeout(() => {
            window.location.href = "index.html";
        }, 2000);

    } catch (error) {

        stubStatus.textContent = "DENIED";

        message.textContent = error.message;

        message.style.color = "#B5544B";

        submitBtn.disabled = false;
    }

});

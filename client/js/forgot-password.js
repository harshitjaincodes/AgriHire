const resetForm = document.getElementById("resetPasswordForm");
const resetMessage = document.getElementById("resetMessage");
resetForm.addEventListener("submit", async function (event) {
    event.preventDefault();
    const email = document.getElementById("email").value
        .trim()
        .toLowerCase();
    const mobile = document.getElementById("mobile").value.trim();
    const newPassword = document.getElementById("newPassword").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    if (!/^[0-9]{10}$/.test(mobile)) {
        showMessage("Enter a valid 10-digit mobile number.", false);
        return;
    }
    if (newPassword.length < 8) {
        showMessage("Password must contain at least 8 characters.", false);
        return;
    }
    if (newPassword !== confirmPassword) {
        showMessage("The passwords do not match.", false);
        return;
    }
    try {
        const response = await fetch("/api/forgot-password", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email,
                mobile,
                newPassword
            })
        });
        const result = await response.json();
        if (!response.ok) {
            showMessage(result.message || "Password reset failed.", false);
            return;
        }
        showMessage("Password reset successfully! Redirecting to login...", true);
        resetForm.reset();
        setTimeout(() => {
            window.location.href = "login.html";
        }, 1500);
    } catch (error) {
        console.error("Password reset error:", error);
        showMessage("Cannot connect to the server. Check that it is running.", false);
    }
});
function showMessage(message, success) {
    resetMessage.textContent = message;
    resetMessage.style.color = success ? "green" : "red";
}

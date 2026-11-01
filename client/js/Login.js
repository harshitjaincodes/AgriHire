const loginForm = document.getElementById("loginForm");
const loginMessage = document.getElementById("loginMessage");

loginForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const identifier = document
        .getElementById("loginIdentifier")
        .value.trim();

    const password = document.getElementById("password").value;
    const rememberMe = document.getElementById("rememberMe").checked;

    if (!identifier || !password) {
        showMessage("Enter your email/mobile and password.", false);
        return;
    }

    if (/^\d+$/.test(identifier) && !/^\d{10}$/.test(identifier)) {
        showMessage("Mobile number must contain 10 digits.", false);
        return;
    }

    try {
        const response = await fetch("/api/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                identifier,
                password
            })
        });

        const result = await response.json();

        if (!response.ok) {
            showMessage(result.message || "Login failed.", false);
            return;
        }

        // Store basic user information for this demo.
        const user = result.user;
        const roles = user.roles || [];

        sessionStorage.setItem("userName", user.firstName);
        sessionStorage.setItem("userEmail", user.email);
        sessionStorage.setItem("userRoles", JSON.stringify(roles));

        // Remember the email when requested.
        if (rememberMe) {
            localStorage.setItem("rememberedEmail", user.email);
        } else {
            localStorage.removeItem("rememberedEmail");
        }

        showMessage("Login successful! Redirecting...", true);

        // Redirect according to the user's selected role(s).
        if (roles.includes("farmer") && roles.includes("owner")) {
            window.location.href = "choose-dashboard.html";
        } else if (roles.includes("farmer")) {
            window.location.href = "farmer-dashboard.html";
        } else if (roles.includes("owner")) {
            window.location.href = "owner-dashboard.html";
        } else {
            showMessage("No valid dashboard role found.", false);
        }

    } catch (error) {
        console.error("Login error:", error);
        showMessage("Unable to connect to the server. Please try again.", false);
    }
});

function showMessage(message, success) {
    loginMessage.textContent = message;
    loginMessage.style.color = success ? "green" : "red";
}

// Restore the remembered email, if available.
const rememberedEmail = localStorage.getItem("rememberedEmail");

if (rememberedEmail) {
    document.getElementById("loginIdentifier").value = rememberedEmail;
    document.getElementById("rememberMe").checked = true;
}

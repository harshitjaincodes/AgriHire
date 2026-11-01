const signupForm = document.getElementById("signupForm");
const signupMessage = document.getElementById("signupMessage");

signupForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const firstName = document.getElementById("firstName").value.trim();
    const lastName = document.getElementById("lastName").value.trim();
    const mobile = document.getElementById("mobile").value.trim();
    const email = document.getElementById("email").value.trim().toLowerCase();
    const location = document.getElementById("location").value.trim();
    const language = document.getElementById("language").value;
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;
    const termsAccepted = document.getElementById("terms").checked;

    const selectedRoles = Array.from(
        document.querySelectorAll('input[name="roles"]:checked')
    ).map((checkbox) => checkbox.value);

    if (!firstName || !mobile || !location || !language) {
    showMessage("Please fill in all required fields.", false);
    return;
}
    // Validate mobile number
    if (!/^[0-9]{10}$/.test(mobile)) {
        showMessage("Enter a valid 10-digit mobile number.", false);
        return;
    }

    // Validate email
   if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showMessage("Enter a valid email address.", false);
    return;
}

    // Require at least one role
    if (selectedRoles.length === 0) {
        showMessage("Select Farmer or Equipment Owner.", false);
        return;
    }

    // Validate password
    if (password.length < 8) {
        showMessage("Password must contain at least 8 characters.", false);
        return;
    }

    if (password !== confirmPassword) {
        showMessage("Passwords do not match.", false);
        return;
    }

    if (!termsAccepted) {
        showMessage("Please accept the Terms & Conditions.", false);
        return;
    }

    const userData = {
        firstName,
        lastName,
        mobile,
        email,
        location,
        roles: selectedRoles,
        language,
        password
    };

    try {
        const response = await fetch("/api/signup", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(userData)
        });

        const result = await response.json();

        if (!response.ok) {
            showMessage(result.message || "Signup failed.", false);
            return;
        }

        showMessage("Account created successfully!", true);
        signupForm.reset();

         setTimeout(() => {
    window.location.href = "login.html";
}, 1500);


    } catch (error) {
        showMessage(
            "Cannot connect to the server. Make sure your backend is running.",
            false
        );
        console.error(error);
    }
});

function showMessage(message, success) {
    signupMessage.textContent = message;
    signupMessage.style.color = success ? "green" : "red";
}

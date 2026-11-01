const requirementForm = document.getElementById("requirementForm");
const requirementMessage = document.getElementById("requirementMessage");
const requirementSubmit = document.getElementById("requirementSubmit");

const requiredFrom = document.getElementById("requiredFrom");
const requiredUntil = document.getElementById("requiredUntil");

// Prevent selecting past dates and keep the end date valid.
const today = new Date();
const localToday = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0")
].join("-");

requiredFrom.min = localToday;
requiredUntil.min = localToday;

requiredFrom.addEventListener("change", function () {
    requiredUntil.min = requiredFrom.value || localToday;

    if (requiredUntil.value && requiredUntil.value < requiredFrom.value) {
        requiredUntil.value = "";
    }
});

function showRequirementMessage(message, success) {
    requirementMessage.textContent = message;
    requirementMessage.style.color = success ? "green" : "red";
}

requirementForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const requirement = {
        activity: document.getElementById("activity").value,
        equipmentRequired: document.getElementById("equipmentRequired").value,
        farmArea: Number(document.getElementById("farmArea").value),
        location: document.getElementById("requirementLocation").value.trim(),
        requiredFrom: requiredFrom.value,
        requiredUntil: requiredUntil.value,
        additionalRequirements: document
            .getElementById("additionalRequirements").value.trim()
    };

    if (
        !requirement.activity ||
        !requirement.equipmentRequired ||
        !Number.isFinite(requirement.farmArea) ||
        requirement.farmArea <= 0 ||
        !requirement.location ||
        !requirement.requiredFrom ||
        !requirement.requiredUntil
    ) {
        showRequirementMessage("Please complete all required fields correctly.", false);
        return;
    }

    if (requirement.requiredFrom < localToday) {
        showRequirementMessage("The start date cannot be in the past.", false);
        return;
    }

    if (requirement.requiredUntil < requirement.requiredFrom) {
        showRequirementMessage("The end date must be on or after the start date.", false);
        return;
    }

    requirementSubmit.disabled = true;
    requirementSubmit.textContent = "Submitting...";

    try {
        const response = await fetch("/api/requirements", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(requirement)
        });

        const result = await response.json();

        if (!response.ok) {
            showRequirementMessage(
                result.message || "Unable to post your requirement.",
                false
            );
            return;
        }

        showRequirementMessage("Requirement posted successfully!", true);
        requirementForm.reset();

        requiredFrom.min = localToday;
        requiredUntil.min = localToday;

    } catch (error) {
        console.error("Requirement submission error:", error);
        showRequirementMessage(
            "Unable to connect to the server. Please try again.",
            false
        );
    } finally {
        requirementSubmit.disabled = false;
        requirementSubmit.textContent = "Post Requirement";
    }
});
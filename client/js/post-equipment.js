
const equipmentForm = document.getElementById("equipmentForm");
const equipmentMessage = document.getElementById("equipmentMessage");
const publishButton = document.getElementById("publishButton");

equipmentForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const imageInput = document.getElementById("equipmentImage");
    const imageFile = imageInput.files[0];

    if (imageFile && imageFile.size > 5 * 1024 * 1024) {
        showMessage("Image size must be 5 MB or less.", false);
        return;
    }

    const formData = new FormData(equipmentForm);

    publishButton.disabled = true;
    showMessage("Publishing equipment...", true);

    try {
        const response = await fetch("/api/equipment", {
            method: "POST",
            body: formData
        });

        const result = await response.json();

        if (!response.ok) {
            showMessage(
                result.message || "Unable to publish equipment.",
                false
            );
            return;
        }

        showMessage("Equipment published successfully!", true);
        equipmentForm.reset();

    } catch (error) {
        console.error("Equipment submission error:", error);
        showMessage(
            "Cannot connect to the server. Make sure it is running.",
            false
        );
    } finally {
        publishButton.disabled = false;
    }
});

function showMessage(message, success) {
    equipmentMessage.textContent = message;
    equipmentMessage.style.color = success ? "green" : "red";
}

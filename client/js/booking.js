
document.addEventListener("DOMContentLoaded", () => {
    const params = new URLSearchParams(window.location.search);
    const equipmentId = params.get("id");

    const button = document.getElementById("requestBookingBtn");
    const message = document.getElementById("bookingMessage");
    const startInput = document.getElementById("startDate");
    const endInput = document.getElementById("endDate");

    const rentalPrice = document.getElementById("rentalPrice");
    const depositElement = document.getElementById("securityDeposit");
    const totalPrice = document.getElementById("totalPrice");

    const deposit = 1000;
    let equipment = null;

    const formatPrice = amount =>
        "₹" + amount.toLocaleString("en-IN", {
            maximumFractionDigits: 2
        });

    function updatePriceSummary() {
        if (!equipment) return;

        const selectedPlan = document.querySelector(
            'input[name="plan"]:checked'
        )?.value;

        const start = new Date(startInput.value);
        const end = new Date(endInput.value);

        const rates = {
            hourly: Number(equipment.hourlyPrice) || 0,
            daily: Number(equipment.dailyPrice) || 0,
            weekly: Number(equipment.weeklyPrice) || 0,
            "ten-day": Number(equipment.tenDayPrice) || 0
        };

        let rental = 0;

        if (
            selectedPlan &&
            startInput.value &&
            endInput.value &&
            !Number.isNaN(start.getTime()) &&
            !Number.isNaN(end.getTime()) &&
            end > start
        ) {
            const hours = (end - start) / (1000 * 60 * 60);
            const days = hours / 24;

            if (selectedPlan === "hourly") {
                rental = Math.ceil(hours) * rates.hourly;
            } else if (selectedPlan === "daily") {
                rental = Math.ceil(days) * rates.daily;
            } else if (selectedPlan === "weekly") {
                rental = Math.ceil(days / 7) * rates.weekly;
            } else if (selectedPlan === "ten-day") {
                rental = Math.ceil(days / 10) * rates["ten-day"];
            }
        }

        rentalPrice.textContent = formatPrice(rental);
        depositElement.textContent = formatPrice(deposit);
        totalPrice.textContent = formatPrice(rental + deposit);
    }

    async function loadEquipment() {
        if (!equipmentId) {
            message.textContent = "Equipment ID is missing.";
            button.disabled = true;
            return;
        }

        try {
            const response = await fetch(
                `/api/equipment/${encodeURIComponent(equipmentId)}`
            );

            if (!response.ok) {
                throw new Error("Unable to load equipment details.");
            }

            equipment = await response.json();

            document.querySelector(".booking-equipment h2").textContent =
                equipment.equipmentName || "Selected Equipment";

            const details = document.querySelectorAll(
                ".booking-equipment p"
            );

            if (details[0]) {
                details[0].textContent =
                    "🚜 " + (equipment.category || "Equipment");
            }

            if (details[1]) {
                details[1].textContent =
                    "📍 " + (equipment.location || "Location not specified");
            }

            document.getElementById("hourlyRate").textContent =
                (Number(equipment.hourlyPrice) || 0).toLocaleString("en-IN");

            document.getElementById("dailyRate").textContent =
                (Number(equipment.dailyPrice) || 0).toLocaleString("en-IN");

            document.getElementById("weeklyRate").textContent =
                (Number(equipment.weeklyPrice) || 0).toLocaleString("en-IN");

            document.getElementById("tenDayRate").textContent =
                (Number(equipment.tenDayPrice) || 0).toLocaleString("en-IN");

            updatePriceSummary();
        } catch (error) {
            message.textContent = error.message;
            button.disabled = true;
        }
    }

    document.querySelectorAll('input[name="plan"]').forEach(input => {
        input.addEventListener("change", updatePriceSummary);
    });

    startInput.addEventListener("change", updatePriceSummary);
    endInput.addEventListener("change", updatePriceSummary);

    button.addEventListener("click", async () => {
        message.textContent = "";

        if (!equipment) {
            message.textContent = "Equipment details have not loaded.";
            return;
        }

        const selectedPlan = document.querySelector(
            'input[name="plan"]:checked'
        );

        if (!selectedPlan || !startInput.value || !endInput.value) {
            message.textContent =
                "Select a rental plan and both dates.";
            return;
        }

        const start = new Date(startInput.value);
        const end = new Date(endInput.value);

        if (
            Number.isNaN(start.getTime()) ||
            Number.isNaN(end.getTime()) ||
            start <= new Date() ||
            end <= start
        ) {
            message.textContent =
                "Choose a future start time and an end time after the start.";
            return;
        }

        const durationType = {
            hourly: "hourly",
            daily: "daily",
            weekly: "weekly",
            "ten-day": "tenDay"
        }[selectedPlan.value];

        button.disabled = true;
        button.textContent = "Submitting...";

        try {
            const response = await fetch("/api/bookings", {
                method: "POST",
                credentials: "same-origin",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    equipmentId,
                    start: start.toISOString(),
                    end: end.toISOString(),
                    durationType
                })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(
                    result.message || "Booking request failed."
                );
            }

            message.textContent =
                "Booking request submitted! Waiting for owner approval.";

            button.textContent = "Request Submitted";
        } catch (error) {
            message.textContent = error.message;
            button.disabled = false;
            button.textContent = "Request Booking";
        }
    });

    loadEquipment();
});

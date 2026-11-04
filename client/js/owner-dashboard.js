document.addEventListener("DOMContentLoaded", loadOwnerEquipment);
async function loadOwnerEquipment() {
    const grid = document.getElementById("ownerEquipmentGrid");
    const count = document.getElementById("totalEquipmentCount");

    try {
        const response = await fetch("/api/equipment");

        if (!response.ok) {
            throw new Error("Could not fetch equipment");
        }

        const equipment = await response.json();

        count.textContent = equipment.length;
        grid.innerHTML = "";

        if (equipment.length === 0) {
            grid.innerHTML = "<p>No equipment listed yet. Click Add Equipment to publish your first listing.</p>";
            return;
        }

        equipment.forEach(item => {
            const card = document.createElement("article");
            card.className = "equipment-card owner-equipment-card";

            card.innerHTML = `
                <div class="owner-equipment-image">
                    <div style="font-size: 52px; text-align: center; padding: 25px;">
                        🚜
                    </div>
                </div>

                <div class="owner-equipment-content">
                    <span class="equipment-category">
                        ${escapeHTML(item.category || "EQUIPMENT")}
                    </span>

                    <h3>${escapeHTML(item.equipmentName || "Unnamed Equipment")}</h3>

                    ${item.model
                        ? `<p>${escapeHTML(item.model)}</p>`
                        : ""}

                    <p class="owner-equipment-price">
                        ₹${Number(item.hourlyPrice || 0).toLocaleString("en-IN")}
                        <span>/ hour</span>
                    </p>

                    <p>📍 ${escapeHTML(item.location || "Location not provided")}</p>

                    <span class="status available">Listed</span>

                    <a href="equipment-details.html?id=${encodeURIComponent(item.id)}"
                       class="btn full-width">
                        View Details
                    </a>
                </div>
            `;

            // Appends each card in the order returned by the API.
            grid.appendChild(card);
        });

    } catch (error) {
        console.error("Error loading owner equipment:", error);
        grid.innerHTML = "<p>Unable to load equipment. Please check that the server is running.</p>";
    }
}

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[character]);
}

async function loadOwnerBookings() {
    const tbody = document.getElementById("ownerBookingsTable");

    if (!tbody) return;

    tbody.replaceChildren();

    const loadingRow = document.createElement("tr");
    const loadingCell = document.createElement("td");
    loadingCell.colSpan = 6;
    loadingCell.textContent = "Loading booking requests...";
    loadingRow.appendChild(loadingCell);
    tbody.appendChild(loadingRow);

    try {
        const response = await fetch("/api/bookings/owner", {
            credentials: "same-origin"
        });

        if (!response.ok) {
            throw new Error(
                response.status === 401
                    ? "Please log in as an equipment owner."
                    : "Could not load booking requests."
            );
        }

        const bookings = await response.json();
        tbody.replaceChildren();

        if (!Array.isArray(bookings) || bookings.length === 0) {
            const row = document.createElement("tr");
            const cell = document.createElement("td");
            cell.colSpan = 6;
            cell.textContent = "No booking requests yet.";
            row.appendChild(cell);
            tbody.appendChild(row);
            return;
        }

        bookings.forEach(booking => {
            const row = document.createElement("tr");

            const farmerCell = document.createElement("td");
            farmerCell.textContent =
                booking.farmerName || booking.farmerEmail || "Farmer";

            const equipmentCell = document.createElement("td");
            equipmentCell.textContent = booking.equipmentName || "Equipment";

            const durationCell = document.createElement("td");
            const durationLabels = {
                hourly: "Hourly",
                daily: "Daily",
                weekly: "Weekly",
                tenDay: "10 Days"
            };
            durationCell.textContent =
                durationLabels[booking.durationType] ||
                booking.durationType ||
                "—";

            const amountCell = document.createElement("td");
            amountCell.textContent =
                "₹" + Number(booking.totalPrice || 0).toLocaleString("en-IN");

            const statusCell = document.createElement("td");
            const statusBadge = document.createElement("span");
            statusBadge.className =
                "status " + String(booking.status || "pending").toLowerCase();
            statusBadge.textContent = booking.status || "pending";
            statusCell.appendChild(statusBadge);

            const actionCell = document.createElement("td");

            if (booking.status === "pending") {
                const actions = document.createElement("div");
                actions.className = "booking-actions";

                for (const choice of [
                    { label: "Accept", status: "approved", className: "accept-btn" },
                    { label: "Reject", status: "rejected", className: "reject-btn" }
                ]) {
                    const button = document.createElement("button");
                    button.type = "button";
                    button.textContent = choice.label;
                    button.className = choice.className;

                    button.addEventListener("click", async () => {
                        button.disabled = true;

                        try {
                            const updateResponse = await fetch(
                                `/api/bookings/${encodeURIComponent(booking.id)}/status`,
                                {
                                    method: "PATCH",
                                    credentials: "same-origin",
                                    headers: {
                                        "Content-Type": "application/json"
                                    },
                                    body: JSON.stringify({
                                        status: choice.status
                                    })
                                }
                            );

                            const result = await updateResponse.json();

                            if (!updateResponse.ok) {
                                throw new Error(
                                    result.message || "Could not update booking."
                                );
                            }

                            await loadOwnerBookings();
                        } catch (error) {
                            alert(error.message);
                            button.disabled = false;
                        }
                    });

                    actions.appendChild(button);
                }

                actionCell.appendChild(actions);
            } else {
                actionCell.textContent = "No action available";
            }

            row.append(
                farmerCell,
                equipmentCell,
                durationCell,
                amountCell,
                statusCell,
                actionCell
            );

            tbody.appendChild(row);
        });
    } catch (error) {
        tbody.replaceChildren();

        const row = document.createElement("tr");
        const cell = document.createElement("td");
        cell.colSpan = 6;
        cell.textContent = error.message;
        row.appendChild(cell);
        tbody.appendChild(row);
    }
}

loadOwnerBookings();

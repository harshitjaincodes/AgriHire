document.addEventListener("DOMContentLoaded", loadEquipmentDetails);

async function loadEquipmentDetails() {
    const info = document.getElementById("equipmentInfo");
    const rentals = document.getElementById("rentalOptions");
    const image = document.getElementById("equipmentImage");
    const thumbnail = document.getElementById("equipmentThumbnail");

    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");

    if (!id) {
        showError(info, rentals,
            "No equipment was selected. Please open this page using View Details.");
        return;
    }

    try {
        const response = await fetch(
            `/api/equipment/${encodeURIComponent(id)}`
        );

        if (!response.ok) {
            throw new Error(
                response.status === 404
                    ? "Equipment listing not found."
                    : "Unable to load equipment details."
            );
        }

        const item = await response.json();

        document.title =
            `${item.equipmentName || "Equipment"} | AgriHire`;

        // Update the existing image area.
        // The current backend does not save an image URL, so keep the fallback.
       const imagePath = item.image
    ? (item.image.startsWith("/")
        ? item.image
        : `../${item.image}`)
    : "../images/john-deere.jpeg";

        image.src = imagePath;
        image.alt = item.equipmentName || "Agricultural equipment";
        thumbnail.src = imagePath;
        thumbnail.alt = item.equipmentName || "Equipment thumbnail";

        // Equipment information
        info.replaceChildren();

        addElement(info, "span", "equipment-tag",
            item.category || "Agricultural Equipment");

        addElement(info, "h1", "",
            item.equipmentName || "Equipment");

        if (item.model) {
            addElement(info, "p", "", `Model: ${item.model}`);
        }

        addElement(info, "hr", "", "");

        addElement(info, "h2", "", "Equipment Details");

        const specifications = document.createElement("ul");
        specifications.className = "specifications";

        addSpecification(specifications, "Category", item.category);
        addSpecification(specifications, "Model", item.model);
        addSpecification(specifications, "Location", item.location);

        if (item.description) {
    const descriptionItem = document.createElement("li");
    descriptionItem.className = "equipment-description";

    const descriptionTitle = document.createElement("h3");
    descriptionTitle.textContent = "Description";

    const descriptionText = document.createElement("p");
    descriptionText.textContent = item.description;

    descriptionItem.append(descriptionTitle, descriptionText);
    specifications.appendChild(descriptionItem);
}

        info.appendChild(specifications);

        // Rental options from the saved backend listing
        rentals.replaceChildren();
        addElement(rentals, "h2", "", "Rental Options");

        addRental(rentals, "Hourly", item.hourlyPrice, "hour");
        addRental(rentals, "Daily", item.dailyPrice, "day");
        addRental(rentals, "Weekly", item.weeklyPrice, "week");
        addRental(rentals, "10-Day Package", item.tenDayPrice, "10 days");

        if (item.specialOffer) {
            addElement(rentals, "p", "", `Offer: ${item.specialOffer}`);
        }

        const bookingLink = document.createElement("a");
        bookingLink.href =
            `booking.html?id=${encodeURIComponent(item.id)}`;
        bookingLink.className = "btn full-width";
        bookingLink.textContent = "Check Availability";
        rentals.appendChild(bookingLink);

    } catch (error) {
        console.error("Equipment details error:", error);
        showError(info, rentals, error.message);
    }
}

function addElement(parent, tag, className, text) {
    const element = document.createElement(tag);

    if (className) {
        element.className = className;
    }

    if (text) {
        element.textContent = text;
    }

    parent.appendChild(element);
    return element;
}

function addSpecification(list, label, value) {
    if (value === null || value === undefined || value === "") {
        return;
    }

    const item = document.createElement("li");
    const labelElement = document.createElement("strong");

    labelElement.textContent = `${label}: `;
    item.append(labelElement, document.createTextNode(String(value)));
    list.appendChild(item);
}

function addRental(parent, title, price, duration) {
    const card = document.createElement("div");
    card.className = "rental-option";

    addElement(card, "h3", "", title);

    const amount = document.createElement("strong");

    if (price === null || price === undefined || price === "") {
        amount.textContent = "Price not provided";
    } else {
        const numericPrice = Number(price);

        amount.textContent = Number.isFinite(numericPrice)
            ? `₹${numericPrice.toLocaleString("en-IN")} / ${duration}`
            : "Price not provided";
    }

    card.appendChild(amount);
    parent.appendChild(card);
}

function showError(info, rentals, message) {
    info.replaceChildren();
    rentals.replaceChildren();

    addElement(info, "h2", "", "Equipment Details");
    addElement(info, "p", "", message);

    const back = document.createElement("a");
    back.href = "equipment.html";
    back.className = "btn";
    back.textContent = "Back to Equipment";
    info.appendChild(back);
}

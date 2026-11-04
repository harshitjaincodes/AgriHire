
document.addEventListener("DOMContentLoaded", () => {
    const grid = document.getElementById("equipmentResultsGrid");

    if (!grid) {
        console.error("Equipment grid not found.");
        return;
    }

   
    // Keep the existing sample cards for now.
    const sampleCards = Array.from(
        grid.querySelectorAll(".equipment-card")
    );

    // Mark static cards as demo listings.
    sampleCards.forEach(card => {
        card.dataset.demoListing = "true";

        const detailsLink = Array.from(
            card.querySelectorAll("a")
        ).find(link =>
            link.textContent.trim().toLowerCase() === "view details"
        );

        if (detailsLink && !detailsLink.href.includes("?id=")) {
            detailsLink.addEventListener("click", event => {
                event.preventDefault();
                alert(
                    "This is a sample listing. Please view a real owner listing for full equipment details and booking."
                );
            });
        }
    });

    setupFilters();
    loadOwnerEquipment();

});

async function loadOwnerEquipment() {
    const grid = document.getElementById("equipmentResultsGrid");

    try {
        const response = await fetch("/api/equipment");
        if (!response.ok) throw new Error("Could not fetch equipment");

        const equipment = await response.json();
        if (!Array.isArray(equipment)) throw new Error("Invalid equipment data");

        // Remove only cards created by this script, not the sample cards.
        grid.querySelectorAll("[data-owner-listing='true']")
            .forEach(card => card.remove());

        equipment.forEach(item => {
            const card = document.createElement("article");
            card.className = "equipment-card";
            card.dataset.ownerListing = "true";
            card.dataset.category = item.category || "";
            card.dataset.hourlyPrice = getPrice(item.hourlyPrice);
            card.dataset.dailyPrice = getPrice(item.dailyPrice);

            const image = document.createElement("div");
image.className = "equipment-card-image";

if (item.image) {
    const photo = document.createElement("img");
    photo.src = item.image.startsWith("/")
    ? item.image
    : `../${item.image}`;
    photo.alt = item.equipmentName || "Agricultural equipment";
    photo.style.width = "100%";
    photo.style.height = "200px";
    photo.style.objectFit = "cover";

    photo.onerror = () => {
        photo.replaceWith(document.createTextNode("🚜"));
    };

    image.appendChild(photo);
} else {
    const emoji = document.createElement("div");
    emoji.textContent = "🚜";
    emoji.style.cssText =
        "font-size:52px;text-align:center;padding:25px;";
    image.appendChild(emoji);
}

            const badge = document.createElement("span");
            badge.className = "available-badge";
            badge.textContent = "Listed";
            image.appendChild(badge);

            const content = document.createElement("div");
            content.className = "equipment-card-content";

            const category = document.createElement("span");
            category.className = "equipment-category";
            category.textContent = item.category || "EQUIPMENT";
            content.appendChild(category);

            const title = document.createElement("h3");
            title.textContent = item.equipmentName || "Unnamed Equipment";
            content.appendChild(title);

            if (item.model) {
                const model = document.createElement("p");
                model.textContent = item.model;
                content.appendChild(model);
            }

            const hourly = getPrice(item.hourlyPrice);
            const daily = getPrice(item.dailyPrice);

            if (hourly !== null) {
                const price = document.createElement("div");
                price.className = "price";

                const amount = document.createElement("strong");
                amount.textContent = `₹${hourly.toLocaleString("en-IN")}`;

                const unit = document.createElement("span");
                unit.textContent = " / hour";

                price.append(amount, unit);
                content.appendChild(price);
            } else if (daily !== null) {
                const price = document.createElement("div");
                price.className = "price";

                const amount = document.createElement("strong");
                amount.textContent = `₹${daily.toLocaleString("en-IN")}`;

                const unit = document.createElement("span");
                unit.textContent = " / day";

                price.append(amount, unit);
                content.appendChild(price);
            } else {
                const price = document.createElement("p");
                price.textContent = "Contact owner for pricing";
                content.appendChild(price);
            }

            const location = document.createElement("p");
            location.className = "location";
            location.textContent =
                `📍 ${item.location || "Location not provided"}`;
            content.appendChild(location);

            if (item.description) {
                const description = document.createElement("p");
                description.textContent = item.description;
                content.appendChild(description);
            }

            const details = document.createElement("a");
            details.className = "btn full-width";
            details.textContent = "View Details";
            details.href =
                `equipment-details.html?id=${encodeURIComponent(item.id || "")}`;
            content.appendChild(details);

            card.append(image, content);
            grid.appendChild(card);
        });

        applyFilters();

    } catch (error) {
    console.error("Error loading owner equipment:", error);
    showStatus("Could not load owner equipment: " + error.message);
}
    
}

function getPrice(value) {
    if (value === null || value === undefined || value === "") return null;

    const price = Number(value);
    return Number.isFinite(price) && price >= 0 ? price : null;
}

function setupFilters() {
    const form = document.getElementById("equipmentSearchForm");
    const search = document.getElementById("equipmentSearch");
    const location = document.getElementById("locationSearch");
    const categoryBoxes = getCategoryCheckboxes();
    const priceRadios = document.querySelectorAll('input[name="price"]');
    const sort = document.querySelector(".sort-select");
    const clear = document.getElementById("clearFilters");

    if (form) {
        form.addEventListener("submit", event => {
            event.preventDefault();
            applyFilters();
        });
    }

    [search, location].filter(Boolean).forEach(input => {
        input.addEventListener("input", applyFilters);
    });

    categoryBoxes.forEach(box => {
        box.addEventListener("change", applyFilters);
    });

    
document.querySelectorAll(".filter-group input[type='checkbox']")
    .forEach(box => {
        box.addEventListener("change", applyFilters);
    });

    priceRadios.forEach(radio => {
        radio.addEventListener("change", applyFilters);
    });

    if (sort) sort.addEventListener("change", applyFilters);

    if (clear) {
        clear.addEventListener("click", () => {
            if (search) search.value = "";

            const locationInput = document.getElementById("locationSearch");
            if (locationInput) locationInput.value = "";

            const dateInput = document.getElementById("requiredDate");
            if (dateInput) dateInput.value = "";

            document.querySelectorAll(
                '.filter-group input[type="checkbox"], .filter-group input[type="radio"]'
            ).forEach(input => {
                input.checked = false;
            });

            applyFilters();
        });
    }
}

function getCategoryCheckboxes() {
    const group = Array.from(document.querySelectorAll(".filter-group"))
        .find(item => item.querySelector("h3")?.textContent.trim().toLowerCase()
            === "equipment type");

    return group
        ? Array.from(group.querySelectorAll('input[type="checkbox"]'))
        : [];
}



function applyFilters() {
    const grid = document.getElementById("equipmentResultsGrid");
    if (!grid) return;

    const searchText = (
        document.getElementById("equipmentSearch")?.value || ""
    ).trim().toLowerCase();

    const locationText = (
        document.getElementById("locationSearch")?.value || ""
    ).trim().toLowerCase();

    const selectedCategories = getCategoryCheckboxes()
        .filter(box => box.checked)
        .map(box => box.parentElement.textContent.trim().toLowerCase());

    const selectedPrice = document.querySelector('input[name="price"]:checked');
    const priceLabel = selectedPrice
        ? selectedPrice.parentElement.textContent.replace(/\s+/g, " ").trim()
        : "";

    function getFilterBoxes(heading) {
        const group = Array.from(document.querySelectorAll(".filter-group"))
            .find(item =>
                item.querySelector("h3")?.textContent.trim().toLowerCase() === heading
            );

        return group
            ? Array.from(group.querySelectorAll('input[type="checkbox"]'))
            : [];
    }

    const selectedRatings = getFilterBoxes("rating")
        .filter(box => box.checked)
        .map(box => {
            const match = box.parentElement.textContent.match(/\d+(?:\.\d+)?/);
            return match ? Number(match[0]) : NaN;
        })
        .filter(Number.isFinite);

    const selectedOperators = getFilterBoxes("operator")
        .filter(box => box.checked)
        .map(box => box.parentElement.textContent.trim().toLowerCase());

    const cards = Array.from(grid.querySelectorAll(".equipment-card"));

    cards.forEach(card => {
        const text = card.textContent.toLowerCase();

        const category = (
            card.dataset.category ||
            card.querySelector(".equipment-category")?.textContent ||
            ""
        ).trim().toLowerCase();

        const matchesSearch = !searchText || text.includes(searchText);

        const cardLocation = (
            card.querySelector(".location")?.textContent || text
        ).toLowerCase();

        const matchesLocation =
            !locationText || cardLocation.includes(locationText);

        const matchesCategory =
            selectedCategories.length === 0 ||
            selectedCategories.some(selected =>
                category.includes(selected) || text.includes(selected)
            );

        const price =
            getPrice(card.dataset.hourlyPrice) ??
            getPrice(card.dataset.dailyPrice) ??
            getPriceFromCard(card);

        let matchesPrice = true;

        if (priceLabel) {
            if (price === null) {
                matchesPrice = false;
            } else if (priceLabel.includes("Under ₹500")) {
                matchesPrice = price < 500;
            } else if (
                priceLabel.includes("₹500") &&
                priceLabel.includes("₹1,000")
            ) {
                matchesPrice = price >= 500 && price <= 1000;
            } else if (
                priceLabel.includes("₹1,000") &&
                priceLabel.includes("₹2,000")
            ) {
                matchesPrice = price > 1000 && price <= 2000;
            } else if (priceLabel.includes("₹2,000+")) {
                matchesPrice = price > 2000;
            }
        }

        const ratingText = card.querySelector(".rating")?.textContent || "";
        const ratingMatch = ratingText.match(/\d+(?:\.\d+)?/);
        const rating = ratingMatch ? Number(ratingMatch[0]) : null;

        const matchesRating =
            selectedRatings.length === 0 ||
            (
                rating !== null &&
                selectedRatings.some(minimum => rating >= minimum)
            );

        const operatorText = (
            card.querySelector(".operator")?.textContent || ""
        ).toLowerCase();

        const matchesOperator =
            selectedOperators.length === 0 ||
            selectedOperators.some(option => {
                if (option.includes("equipment + operator")) {
                    return operatorText.includes("equipment + operator");
                }

                if (option.includes("equipment only")) {
                    return operatorText.includes("equipment only");
                }

                return operatorText.includes(option);
            });

        card.hidden = !(
            matchesSearch &&
            matchesLocation &&
            matchesCategory &&
            matchesPrice &&
            matchesRating &&
            matchesOperator
        );
    });

    const visibleCards = cards.filter(card => !card.hidden);
    const sort = document.querySelector(".sort-select");

    if (sort && sort.selectedIndex > 0) {
        const mode = sort.value || sort.options[sort.selectedIndex].text;

        visibleCards.sort((a, b) => {
            const priceA =
                getPrice(a.dataset.hourlyPrice) ??
                getPrice(a.dataset.dailyPrice) ??
                getPriceFromCard(a) ??
                Infinity;

            const priceB =
                getPrice(b.dataset.hourlyPrice) ??
                getPrice(b.dataset.dailyPrice) ??
                getPriceFromCard(b) ??
                Infinity;

            if (mode.includes("Low to High")) return priceA - priceB;
            if (mode.includes("High to Low")) return priceB - priceA;

            return 0;
        });

        visibleCards.forEach(card => grid.appendChild(card));
    }

    const results = document.querySelector(".results-top p");
    if (results) {
        results.textContent = `${visibleCards.length} equipment listings found`;
    }
}


function getPriceFromCard(card) {
    const amount = card.querySelector(".price strong")?.textContent || "";
    const price = Number(amount.replace(/[^\d.]/g, ""));
    return Number.isFinite(price) && amount.trim() ? price : null;
}

function showStatus(message) {
    const grid = document.getElementById("equipmentResultsGrid");
    if (!grid) return;

    let status = grid.querySelector(".equipment-load-status");

    if (!status) {
        status = document.createElement("p");
        status.className = "equipment-load-status";
        grid.prepend(status);
    }

    status.textContent = message;
}

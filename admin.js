const enquiryList = document.getElementById("enquiryList");
const adminStats = document.getElementById("adminStats");
const searchInput = document.getElementById("searchInput");
const refreshButton = document.getElementById("refreshButton");

let allEnquiries = [];

function formatDate(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return new Intl.DateTimeFormat("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    }).format(date);
}

function renderStats(items) {
    const totalGuests = items.reduce((sum, item) => sum + Number(item.guestCount || 0), 0);
    const weddings = items.filter((item) => item.eventType === "Wedding").length;

    adminStats.innerHTML = [
        { label: "Total enquiries", value: items.length },
        { label: "Wedding leads", value: weddings },
        { label: "Estimated guests", value: totalGuests }
    ].map((stat) => `
        <article class="admin-stat">
            <span class="stat-label">${stat.label}</span>
            <strong class="stat-value">${stat.value}</strong>
        </article>
    `).join("");
}

function renderEnquiries(items) {
    if (!items.length) {
        enquiryList.innerHTML = '<div class="admin-empty">No enquiries match this search yet.</div>';
        return;
    }

    enquiryList.innerHTML = items.map((item) => `
        <article class="enquiry-card">
            <div class="enquiry-card-header">
                <div>
                    <p class="eyebrow">New lead</p>
                    <h3>${item.name}</h3>
                </div>
                <span class="status-pill">${item.status || "New"}</span>
            </div>
            <div class="enquiry-meta">
                <div><span>Event Type</span><strong>${item.eventType}</strong></div>
                <div><span>Event Date</span><strong>${formatDate(item.eventDate)}</strong></div>
                <div><span>City</span><strong>${item.city}</strong></div>
                <div><span>Guests</span><strong>${item.guestCount}</strong></div>
                <div><span>Budget</span><strong>${item.budget}</strong></div>
                <div><span>Received</span><strong>${formatDate(item.createdAt)}</strong></div>
                <div><span>Email</span><strong>${item.email}</strong></div>
                <div><span>Phone</span><strong>${item.phone}</strong></div>
            </div>
            <div class="enquiry-message">${item.message}</div>
        </article>
    `).join("");
}

function applyFilter() {
    const term = searchInput.value.trim().toLowerCase();
    const filtered = allEnquiries.filter((item) =>
        [item.name, item.city, item.eventType, item.budget, item.email, item.phone]
            .filter(Boolean)
            .some((value) => value.toLowerCase().includes(term))
    );

    renderStats(filtered);
    renderEnquiries(filtered);
}

async function loadEnquiries() {
    refreshButton.disabled = true;
    refreshButton.textContent = "Refreshing...";

    try {
        const response = await fetch("/api/enquiries");
        if (!response.ok) {
            throw new Error("Unable to load enquiries.");
        }

        allEnquiries = await response.json();
        applyFilter();
    } catch (error) {
        adminStats.innerHTML = "";
        enquiryList.innerHTML = `<div class="admin-empty">${error.message}</div>`;
    } finally {
        refreshButton.disabled = false;
        refreshButton.textContent = "Refresh Enquiries";
    }
}

searchInput.addEventListener("input", applyFilter);
refreshButton.addEventListener("click", loadEnquiries);

loadEnquiries();

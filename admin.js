const enquiryList = document.getElementById("enquiryList");
const adminStats = document.getElementById("adminStats");
const searchInput = document.getElementById("searchInput");
const refreshButton = document.getElementById("refreshButton");
const adminAccessMessage = document.getElementById("adminAccessMessage");

let allBookings = [];
let allUsers = [];

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

function renderStats(stats) {
    adminStats.innerHTML = `
        <article class="admin-stat">
            <span class="stat-label">Total bookings</span>
            <strong class="stat-value">${stats.totalBookings}</strong>
        </article>
        <article class="admin-stat">
            <span class="stat-label">New bookings</span>
            <strong class="stat-value">${stats.newBookings}</strong>
        </article>
        <article class="admin-stat">
            <span class="stat-label">Registered users</span>
            <strong class="stat-value">${stats.totalUsers}</strong>
        </article>
        <article class="admin-stat">
            <span class="stat-label">Event categories</span>
            <strong class="stat-value">${stats.totalEvents}</strong>
        </article>
    `;
}

function renderBookings(items) {
    if (!items.length) {
        enquiryList.innerHTML = '<div class="admin-empty">No booking records match this search.</div>';
        return;
    }

    enquiryList.innerHTML = items.map((item) => `
        <article class="enquiry-card">
            <div class="enquiry-card-header">
                <div>
                    <p class="eyebrow">Booking Request</p>
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
                <div><span>Email</span><strong>${item.email}</strong></div>
                <div><span>Phone</span><strong>${item.phone}</strong></div>
                <div><span>Received</span><strong>${formatDate(item.createdAt)}</strong></div>
            </div>
            <div class="enquiry-message">${item.message}</div>
        </article>
    `).join("");
}

function applyFilter() {
    const term = searchInput.value.trim().toLowerCase();

    const filtered = allBookings.filter((item) =>
        [item.name, item.city, item.email, item.eventType, item.budget, item.phone]
            .filter(Boolean)
            .some((value) => value.toLowerCase().includes(term))
    );

    renderBookings(filtered);
}

async function loadAdminData() {
    refreshButton.disabled = true;
    refreshButton.textContent = "Refreshing...";

    try {
        const [statsResponse, bookingsResponse, usersResponse] = await Promise.all([
            fetch("/api/dashboard"),
            fetch("/api/bookings"),
            fetch("/api/users")
        ]);

        if (!statsResponse.ok || !bookingsResponse.ok || !usersResponse.ok) {
            throw new Error("Unable to load admin data.");
        }

        const stats = await statsResponse.json();
        allBookings = await bookingsResponse.json();
        allUsers = await usersResponse.json();
        stats.totalUsers = allUsers.length;

        renderStats(stats);
        applyFilter();
    } catch (error) {
        adminStats.innerHTML = "";
        enquiryList.innerHTML = `<div class="admin-empty">${error.message}</div>`;
    } finally {
        refreshButton.disabled = false;
        refreshButton.textContent = "Refresh Data";
    }
}

function initAdminPage() {
    const currentUser = getCurrentUser();

    if (!currentUser || currentUser.role !== "admin") {
        adminAccessMessage.textContent = "Admin access required. Please log in with the admin account to use this page.";
        adminStats.innerHTML = "";
        enquiryList.innerHTML = '<div class="admin-empty">Access denied. Use admin@oakandaster.com / Admin@123 to log in.</div>';
        refreshButton.disabled = true;
        searchInput.disabled = true;
        return;
    }

    adminAccessMessage.textContent = `Welcome, ${currentUser.name}. You are viewing the admin panel.`;
    loadAdminData();
}

searchInput?.addEventListener("input", applyFilter);
refreshButton?.addEventListener("click", loadAdminData);

initAdminPage();

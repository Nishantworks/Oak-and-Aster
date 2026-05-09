const eventsGrid = document.getElementById("eventsGrid");

async function loadEvents() {
    if (!eventsGrid) {
        return;
    }

    eventsGrid.innerHTML = '<div class="admin-empty">Loading event catalog...</div>';

    try {
        const response = await fetch("/api/events");
        if (!response.ok) {
            throw new Error("Unable to load events right now.");
        }

        const events = await response.json();
        eventsGrid.innerHTML = events.map((event) => `
            <article class="event-card">
                <p class="eyebrow">${event.category}</p>
                <h3>${event.title}</h3>
                <p>${event.description}</p>
                <div class="event-meta">
                    <span>${event.location}</span>
                    <strong>${event.price}</strong>
                </div>
                <a href="/booking.html" class="primary-btn card-btn">Book This Event</a>
            </article>
        `).join("");
    } catch (error) {
        eventsGrid.innerHTML = `<div class="admin-empty">${error.message}</div>`;
    }
}

loadEvents();

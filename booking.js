const bookingFormPage = document.getElementById("bookingFormPage");

async function populateEventOptions() {
    const eventTypeSelect = document.getElementById("bookingEventType");
    if (!eventTypeSelect) {
        return;
    }

    try {
        const response = await fetch("/api/events");
        const events = await response.json();

        for (const event of events) {
            const option = document.createElement("option");
            option.value = event.category;
            option.textContent = `${event.title} (${event.category})`;
            eventTypeSelect.appendChild(option);
        }
    } catch (error) {
        // Keep default option if loading fails
    }
}

function prefillUser() {
    const currentUser = getCurrentUser();
    if (!currentUser) {
        return;
    }

    const nameInput = document.getElementById("bookingName");
    const emailInput = document.getElementById("bookingEmail");

    if (nameInput) {
        nameInput.value = currentUser.name || "";
    }

    if (emailInput) {
        emailInput.value = currentUser.email || "";
    }
}

if (bookingFormPage) {
    const bookingDate = document.getElementById("bookingDate");
    const bookingResponse = document.getElementById("bookingResponse");
    const bookingSubmitButton = document.getElementById("bookingSubmitButton");

    bookingDate.min = new Date().toISOString().split("T")[0];
    prefillUser();
    populateEventOptions();

    bookingFormPage.addEventListener("submit", async (event) => {
        event.preventDefault();

        const payload = {
            name: document.getElementById("bookingName").value.trim(),
            email: document.getElementById("bookingEmail").value.trim(),
            phone: document.getElementById("bookingPhone").value.trim(),
            eventType: document.getElementById("bookingEventType").value,
            eventDate: document.getElementById("bookingDate").value,
            city: document.getElementById("bookingCity").value.trim(),
            guestCount: document.getElementById("bookingGuests").value.trim(),
            budget: document.getElementById("bookingBudget").value,
            message: document.getElementById("bookingMessage").value.trim()
        };

        if (!/^[+\d][\d\s-]{7,}$/.test(payload.phone)) {
            bookingResponse.textContent = "Please enter a valid phone number.";
            bookingResponse.style.color = "#b94a6d";
            return;
        }

        bookingResponse.textContent = "Submitting your booking...";
        bookingResponse.style.color = "#735f6d";
        bookingSubmitButton.disabled = true;
        bookingSubmitButton.textContent = "Submitting...";

        try {
            const response = await fetch("/api/book", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.message || "Booking failed.");
            }

            bookingResponse.textContent = result.message;
            bookingResponse.style.color = "#249567";
            bookingFormPage.reset();
            prefillUser();
            bookingDate.min = new Date().toISOString().split("T")[0];
        } catch (error) {
            bookingResponse.textContent = error.message;
            bookingResponse.style.color = "#b94a6d";
        } finally {
            bookingSubmitButton.disabled = false;
            bookingSubmitButton.textContent = "Submit Booking";
        }
    });
}

function scrollToContact() {
    document.getElementById("contact").scrollIntoView({ behavior: "smooth", block: "start" });
}

const bookingForm = document.getElementById("bookingForm");
const responseMsg = document.getElementById("formResponse");
const dateInput = document.getElementById("eventDate");
const submitButton = document.getElementById("submitButton");

dateInput.min = new Date().toISOString().split("T")[0];

bookingForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = {
        name: document.getElementById("name").value.trim(),
        email: document.getElementById("email").value.trim(),
        phone: document.getElementById("phone").value.trim(),
        eventType: document.getElementById("eventType").value,
        eventDate: document.getElementById("eventDate").value,
        city: document.getElementById("city").value.trim(),
        guestCount: document.getElementById("guestCount").value.trim(),
        budget: document.getElementById("budget").value,
        message: document.getElementById("message").value.trim()
    };

    if (!/^[+\d][\d\s-]{7,}$/.test(formData.phone)) {
        responseMsg.style.color = "#b76556";
        responseMsg.textContent = "Please enter a valid phone number.";
        return;
    }

    responseMsg.style.color = "#64574c";
    responseMsg.textContent = "Sending your enquiry...";
    submitButton.disabled = true;
    submitButton.textContent = "Sending...";

    try {
        const response = await fetch("/api/book", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData)
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Something went wrong.");
        }

        responseMsg.style.color = "#2f7d78";
        responseMsg.textContent = result.message;
        bookingForm.reset();
        dateInput.min = new Date().toISOString().split("T")[0];
    } catch (error) {
        responseMsg.style.color = "#b76556";
        responseMsg.textContent = error.message || "We could not send your enquiry right now.";
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = "Send Enquiry";
    }
});

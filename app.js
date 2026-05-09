function getCurrentUser() {
    try {
        return JSON.parse(localStorage.getItem("oakCurrentUser") || "null");
    } catch (error) {
        return null;
    }
}

function setCurrentUser(user) {
    localStorage.setItem("oakCurrentUser", JSON.stringify(user));
}

function clearCurrentUser() {
    localStorage.removeItem("oakCurrentUser");
}

function enhanceNavigation() {
    const nav = document.querySelector(".site-nav");
    if (!nav) {
        return;
    }

    const currentUser = getCurrentUser();
    const existingSession = nav.querySelector(".session-slot");
    if (existingSession) {
        existingSession.remove();
    }

    const wrapper = document.createElement("div");
    wrapper.className = "session-slot";

    if (currentUser) {
        wrapper.innerHTML = `
            <span class="nav-user">${currentUser.name}</span>
            <button type="button" class="nav-logout">Logout</button>
        `;
        nav.appendChild(wrapper);

        wrapper.querySelector(".nav-logout").addEventListener("click", () => {
            clearCurrentUser();
            window.location.href = "/login.html";
        });
    }
}

document.addEventListener("DOMContentLoaded", enhanceNavigation);

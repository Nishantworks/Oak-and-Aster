const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");

if (loginForm) {
    const loginResponse = document.getElementById("loginResponse");

    loginForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const email = document.getElementById("loginEmail").value.trim();
        const password = document.getElementById("loginPassword").value;

        loginResponse.textContent = "Logging in...";
        loginResponse.style.color = "#735f6d";

        try {
            const response = await fetch("/api/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
            });

            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.message || "Login failed.");
            }

            setCurrentUser(result.user);
            loginResponse.textContent = result.message;
            loginResponse.style.color = "#249567";

            setTimeout(() => {
                window.location.href = result.user.role === "admin" ? "/admin.html" : "/booking.html";
            }, 800);
        } catch (error) {
            loginResponse.textContent = error.message;
            loginResponse.style.color = "#b94a6d";
        }
    });
}

if (registerForm) {
    const registerResponse = document.getElementById("registerResponse");

    registerForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const name = document.getElementById("registerName").value.trim();
        const email = document.getElementById("registerEmail").value.trim();
        const password = document.getElementById("registerPassword").value;

        registerResponse.textContent = "Creating your account...";
        registerResponse.style.color = "#735f6d";

        try {
            const response = await fetch("/api/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, password })
            });

            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.message || "Registration failed.");
            }

            setCurrentUser(result.user);
            registerResponse.textContent = result.message;
            registerResponse.style.color = "#249567";

            setTimeout(() => {
                window.location.href = "/booking.html";
            }, 800);
        } catch (error) {
            registerResponse.textContent = error.message;
            registerResponse.style.color = "#b94a6d";
        }
    });
}

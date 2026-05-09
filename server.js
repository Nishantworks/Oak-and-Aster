const fs = require("fs");
const http = require("http");
const path = require("path");
const { URL } = require("url");

const PORT = process.env.PORT || 3000;
const dataDir = __dirname;
const bookingsPath = path.join(dataDir, "bookings.json");
const usersPath = path.join(dataDir, "users.json");
const eventsPath = path.join(dataDir, "events.json");

const mimeTypes = {
    ".css": "text/css; charset=utf-8",
    ".html": "text/html; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".svg": "image/svg+xml"
};

const defaultUsers = [
    {
        id: "admin-1",
        name: "Admin User",
        email: "admin@oakandaster.com",
        password: "Admin@123",
        role: "admin",
        createdAt: new Date().toISOString()
    }
];

const defaultEvents = [
    {
        id: "wedding-luxe",
        title: "Luxury Wedding Weekend",
        category: "Wedding",
        price: "Starting from 3,50,000 INR",
        location: "Delhi, Jaipur, Udaipur",
        description: "A premium multi-day wedding experience with decor, hospitality, artist coordination, and guest flow design."
    },
    {
        id: "corporate-launch",
        title: "Corporate Launch Experience",
        category: "Corporate",
        price: "Starting from 1,80,000 INR",
        location: "Noida, Gurugram, Bengaluru",
        description: "Built for product launches, award nights, conferences, and curated brand activations with polished execution."
    },
    {
        id: "private-soiree",
        title: "Private Celebration Soiree",
        category: "Private Event",
        price: "Starting from 95,000 INR",
        location: "Mumbai, Pune, Kolkata",
        description: "A design-led social event experience for birthdays, anniversaries, engagements, and bespoke milestone moments."
    },
    {
        id: "destination-retreat",
        title: "Destination Retreat Event",
        category: "Destination",
        price: "Starting from 4,20,000 INR",
        location: "Goa, Mussoorie, Kerala",
        description: "A complete travel-meets-event package for destination stays, curated guest experiences, and full production handling."
    }
];

function ensureFile(filePath, defaultValue) {
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, JSON.stringify(defaultValue, null, 2), "utf8");
    }
}

function readJson(filePath, fallback) {
    ensureFile(filePath, fallback);
    const raw = fs.readFileSync(filePath, "utf8");
    return JSON.parse(raw);
}

function writeJson(filePath, value) {
    fs.writeFileSync(filePath, JSON.stringify(value, null, 2), "utf8");
}

function readBookings() {
    return readJson(bookingsPath, []);
}

function writeBookings(bookings) {
    writeJson(bookingsPath, bookings);
}

function readUsers() {
    const users = readJson(usersPath, defaultUsers);
    const hasAdmin = users.some((user) => user.role === "admin");

    if (!hasAdmin) {
        users.unshift(defaultUsers[0]);
        writeJson(usersPath, users);
    }

    return users;
}

function writeUsers(users) {
    writeJson(usersPath, users);
}

function readEvents() {
    return readJson(eventsPath, defaultEvents);
}

function sendJson(res, statusCode, payload) {
    res.writeHead(statusCode, {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Content-Type": "application/json; charset=utf-8"
    });
    res.end(JSON.stringify(payload));
}

function sendFile(res, filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[ext] || "application/octet-stream";

    fs.readFile(filePath, (error, data) => {
        if (error) {
            sendJson(res, 404, { message: "File not found." });
            return;
        }

        res.writeHead(200, { "Content-Type": contentType });
        res.end(data);
    });
}

function collectJsonBody(req) {
    return new Promise((resolve, reject) => {
        let body = "";

        req.on("data", (chunk) => {
            body += chunk.toString();
        });

        req.on("end", () => {
            try {
                resolve(body ? JSON.parse(body) : {});
            } catch (error) {
                reject(error);
            }
        });

        req.on("error", reject);
    });
}

function resolveStaticPath(urlPath) {
    const safePath = path.normalize(urlPath).replace(/^(\.\.[\/\\])+/, "");
    const target = safePath === "/" ? "index.html" : safePath.replace(/^\//, "");
    return path.join(__dirname, target);
}

function sanitizeUser(user) {
    return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
    };
}

function getDashboardStats() {
    const bookings = readBookings();
    const users = readUsers();
    const events = readEvents();

    return {
        totalBookings: bookings.length,
        newBookings: bookings.filter((booking) => booking.status === "New").length,
        totalUsers: users.length,
        totalEvents: events.length
    };
}

const server = http.createServer(async (req, res) => {
    const requestUrl = new URL(req.url, `http://${req.headers.host}`);

    if (req.method === "OPTIONS") {
        res.writeHead(204, {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type"
        });
        res.end();
        return;
    }

    if (req.method === "POST" && requestUrl.pathname === "/api/register") {
        let payload;

        try {
            payload = await collectJsonBody(req);
        } catch (error) {
            sendJson(res, 400, { message: "Invalid JSON payload." });
            return;
        }

        const { name, email, password } = payload;

        if (!name || !email || !password) {
            sendJson(res, 400, { message: "Please complete all registration fields." });
            return;
        }

        const users = readUsers();
        const existing = users.find((user) => user.email.toLowerCase() === String(email).toLowerCase());

        if (existing) {
            sendJson(res, 409, { message: "An account already exists with this email." });
            return;
        }

        const newUser = {
            id: `user-${Date.now()}`,
            name: String(name).trim(),
            email: String(email).trim(),
            password: String(password),
            role: "user",
            createdAt: new Date().toISOString()
        };

        users.unshift(newUser);
        writeUsers(users);
        sendJson(res, 201, {
            message: "Registration successful.",
            user: sanitizeUser(newUser)
        });
        return;
    }

    if (req.method === "POST" && requestUrl.pathname === "/api/login") {
        let payload;

        try {
            payload = await collectJsonBody(req);
        } catch (error) {
            sendJson(res, 400, { message: "Invalid JSON payload." });
            return;
        }

        const { email, password } = payload;

        if (!email || !password) {
            sendJson(res, 400, { message: "Please enter email and password." });
            return;
        }

        const users = readUsers();
        const user = users.find(
            (entry) =>
                entry.email.toLowerCase() === String(email).toLowerCase() &&
                entry.password === String(password)
        );

        if (!user) {
            sendJson(res, 401, { message: "Invalid email or password." });
            return;
        }

        sendJson(res, 200, {
            message: "Login successful.",
            user: sanitizeUser(user)
        });
        return;
    }

    if (req.method === "POST" && requestUrl.pathname === "/api/book") {
        let payload;

        try {
            payload = await collectJsonBody(req);
        } catch (error) {
            sendJson(res, 400, { message: "Invalid JSON payload." });
            return;
        }

        const {
            name,
            email,
            phone,
            eventType,
            eventDate,
            city,
            guestCount,
            budget,
            message
        } = payload;

        if (!name || !email || !phone || !eventType || !eventDate || !city || !guestCount || !budget || !message) {
            sendJson(res, 400, { message: "Please complete all required booking fields." });
            return;
        }

        const parsedGuests = Number.parseInt(guestCount, 10);

        if (Number.isNaN(parsedGuests) || parsedGuests < 1) {
            sendJson(res, 400, { message: "Guest count must be at least 1." });
            return;
        }

        const bookings = readBookings();
        const newBooking = {
            id: `booking-${Date.now()}`,
            status: "New",
            name: String(name).trim(),
            email: String(email).trim(),
            phone: String(phone).trim(),
            eventType: String(eventType).trim(),
            eventDate: String(eventDate).trim(),
            city: String(city).trim(),
            guestCount: parsedGuests,
            budget: String(budget).trim(),
            message: String(message).trim(),
            createdAt: new Date().toISOString()
        };

        bookings.unshift(newBooking);
        writeBookings(bookings);
        sendJson(res, 201, {
            message: "Your booking enquiry has been submitted successfully.",
            booking: newBooking
        });
        return;
    }

    if (req.method === "GET" && requestUrl.pathname === "/api/events") {
        sendJson(res, 200, readEvents());
        return;
    }

    if (req.method === "GET" && (requestUrl.pathname === "/api/bookings" || requestUrl.pathname === "/api/enquiries")) {
        sendJson(res, 200, readBookings());
        return;
    }

    if (req.method === "GET" && requestUrl.pathname === "/api/dashboard") {
        sendJson(res, 200, getDashboardStats());
        return;
    }

    if (req.method === "GET" && requestUrl.pathname === "/api/users") {
        const users = readUsers().map(sanitizeUser);
        sendJson(res, 200, users);
        return;
    }

    if (req.method === "GET") {
        const filePath = resolveStaticPath(requestUrl.pathname);
        if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
            sendFile(res, filePath);
            return;
        }
        sendFile(res, path.join(__dirname, "index.html"));
        return;
    }

    sendJson(res, 405, { message: "Method not allowed." });
});

ensureFile(bookingsPath, []);
ensureFile(usersPath, defaultUsers);
ensureFile(eventsPath, defaultEvents);

server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

const fs = require("fs");
const http = require("http");
const path = require("path");
const { URL } = require("url");
const PORT = process.env.PORT || 3000;
const storagePath = path.join(__dirname, "bookings.json");

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

function readBookingsFile() {
    if (!fs.existsSync(storagePath)) {
        fs.writeFileSync(storagePath, "[]", "utf8");
    }

    const raw = fs.readFileSync(storagePath, "utf8");
    return JSON.parse(raw);
}

function writeBookingsFile(bookings) {
    fs.writeFileSync(storagePath, JSON.stringify(bookings, null, 2), "utf8");
}

async function saveBooking(payload) {
    const bookings = readBookingsFile();
    const newBooking = {
        id: Date.now().toString(),
        status: "New",
        ...payload,
        createdAt: new Date().toISOString()
    };
    bookings.unshift(newBooking);
    writeBookingsFile(bookings);
    return newBooking;
}

async function getBookings() {
    return readBookingsFile();
}

function sendJson(res, statusCode, payload) {
    res.writeHead(statusCode, {
        "Access-Control-Allow-Origin": "*",
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
            sendJson(res, 400, { message: "Please complete all required fields." });
            return;
        }

        const parsedGuests = Number.parseInt(guestCount, 10);

        if (Number.isNaN(parsedGuests) || parsedGuests < 1) {
            sendJson(res, 400, { message: "Guest count must be at least 1." });
            return;
        }

        try {
            await saveBooking({
                name,
                email,
                phone,
                eventType,
                eventDate,
                city,
                guestCount: parsedGuests,
                budget,
                message
            });

            sendJson(res, 201, {
                message: "Thanks. Your event enquiry was received and is ready for follow-up."
            });
        } catch (error) {
            console.error("Booking save failed:", error);
            sendJson(res, 500, { message: "Unable to save the enquiry right now." });
        }
        return;
    }

    if (req.method === "GET" && (requestUrl.pathname === "/api/bookings" || requestUrl.pathname === "/api/enquiries")) {
        try {
            const bookings = await getBookings();
            sendJson(res, 200, bookings);
        } catch (error) {
            console.error("Booking fetch failed:", error);
            sendJson(res, 500, { message: "Unable to fetch enquiries right now." });
        }
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

if (!fs.existsSync(storagePath)) {
    fs.writeFileSync(storagePath, "[]", "utf8");
}

server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

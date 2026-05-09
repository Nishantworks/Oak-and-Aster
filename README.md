# Event Management Website

An aesthetic event management website built for a final year project. The site includes a public-facing landing page, a detailed event enquiry form, and an admin page to review submitted enquiries.

## Features

- Premium event-branding homepage
- Responsive design for desktop and mobile
- Event enquiry form with validation
- Local JSON-based enquiry storage
- Admin dashboard for viewing enquiries

## Tech Stack

- HTML
- CSS
- JavaScript
- Node.js

## Run Locally

1. Open the project folder.
2. Run:

```bash
node server.js
```

3. Visit:

- `http://localhost:3000`
- `http://localhost:3000/admin.html`

## Deployment Note

This project currently stores enquiry data in `bookings.json`.

On Railway, local file storage is suitable for demo use, but it is not reliable for permanent production data because container file systems can be ephemeral. For long-term use, the next step should be moving enquiries to a database such as MongoDB or PostgreSQL.

# MediSync — Healthcare Resource Scheduling Platform

MediSync is a full-stack web application for scheduling and managing medical appointments. It prevents double-booking through real-time conflict detection before any appointment is saved.

---

## Tech Stack

| Layer    | Technology                              |
|----------|-----------------------------------------|
| Frontend | React 19 + Vite, Tailwind CSS, TanStack Query |
| Backend  | Node.js, Express 5, TypeScript          |
| Database | PostgreSQL (Drizzle ORM)                |
| Contract | OpenAPI 3.1 → Orval codegen (typed hooks + Zod schemas) |

---

## Running the Project

### Prerequisites

- Node.js 20+
- pnpm 9+
- A PostgreSQL database (set the `DATABASE_URL` environment variable)

### Install Dependencies

```bash
pnpm install
```

### Push the Database Schema

```bash
pnpm --filter @workspace/db run push
```

### Start the API Server

```bash
pnpm --filter @workspace/api-server run dev
```

The API server starts on the port defined by the `PORT` environment variable (default: managed by Replit workflows).

### Start the Frontend

```bash
pnpm --filter @workspace/medisync run dev
```

The frontend starts on its own port and connects to the API through the shared reverse proxy at `/api`.

---

## API Endpoints

| Method | Path                        | Description                                  |
|--------|-----------------------------|----------------------------------------------|
| GET    | `/api/healthz`              | Health check                                 |
| GET    | `/api/doctors`              | List all doctors                             |
| POST   | `/api/doctors`              | Add a new doctor                             |
| GET    | `/api/appointments`         | List all appointments (with doctor details)  |
| POST   | `/api/appointments`         | Book an appointment (**with conflict check**)|
| DELETE | `/api/appointments/:id`     | Cancel an appointment                        |
| GET    | `/api/appointments/summary` | Stats: total, upcoming, past, by doctor      |

---

## Scheduling Conflict Check Logic

When a client POSTs to `/api/appointments`, the server:

1. **Validates** the request body against the Zod schema (patient name, doctor ID, start time are all required).
2. **Checks for an existing appointment** by querying the `appointments` table for any row where:
   - `doctor_id` equals the requested doctor, **AND**
   - `start_time` equals the requested start time (exact timestamp match).
3. **If a conflict is found**, the server returns:
   ```json
   HTTP 409 Conflict
   { "error": "Conflict: Doctor is already booked at that time." }
   ```
4. **If no conflict**, the appointment is inserted and returned with `HTTP 201 Created`, including the doctor's full details.

This prevents a doctor from being double-booked at the same time slot. The check happens atomically at the database level before any insert, so it is safe under concurrent requests.

---

## Project Structure

```
artifacts/
  api-server/       — Express 5 API server
    src/routes/
      doctors.ts       — GET /doctors, POST /doctors
      appointments.ts  — GET/POST /appointments, DELETE /appointments/:id, GET /appointments/summary
  medisync/         — React + Vite frontend

lib/
  api-spec/
    openapi.yaml     — Single source of truth for all API contracts
  api-client-react/  — Generated TanStack Query hooks (from codegen)
  api-zod/           — Generated Zod validation schemas (from codegen)
  db/
    src/schema/
      doctors.ts       — Drizzle ORM table: doctors
      appointments.ts  — Drizzle ORM table: appointments
```

---

## Regenerating the API Client

If you change `lib/api-spec/openapi.yaml`, regenerate the typed hooks and schemas:

```bash
pnpm --filter @workspace/api-spec run codegen
```

# Task Manager API

A RESTful Task Manager API built with **Node.js**, **Express 5**, and **PostgreSQL**. It exposes CRUD endpoints for managing tasks, with request validation, a simple token-based auth check, and centralized error handling.

## Features

- Create, read, update, and delete tasks
- Filter tasks by completion status
- Request body validation for POST/PATCH requests
- Task ID validation on route params
- Centralized error handling via a custom `AppError` class
- PostgreSQL persistence via the `pg` driver

## Tech Stack

- **Runtime:** Node.js (ES Modules)
- **Framework:** Express 5
- **Database:** PostgreSQL (via `pg`)
- **Config:** `dotenv`

## Project Structure

```
task-manager-api/
├── express-server.js   # App entry point — starts the Express server
├── taskRoutes.js        # Route definitions for /tasks
├── task-controller.js   # Request handlers (controllers)
├── taskServices.js      # Database queries (service layer)
├── middleWare.js        # Auth + request validation middleware
├── error.js             # AppError class + global error handler
├── db.js                # PostgreSQL connection pool
├── app.js                # Standalone CLI tool for tasks (separate from the API server)
└── package.json
```

> **Note:** `package.json`'s `start`/`dev` scripts currently point to `app.js`, which is a CLI script (`add`/`list`/`complete`/`delete` via `process.argv`), not the API server. To run the actual HTTP API, start `express-server.js` directly (see below).

## Prerequisites

- Node.js (v18+ recommended, since the project uses ES Modules)
- A running PostgreSQL instance

## Installation

```bash
git clone https://github.com/YashShekhawat-me/task-manager-api.git
cd task-manager-api
npm install
```

## Environment Variables

Create a `.env` file in the project root (it's already git-ignored):

```env
DB_USER=your_pg_username
DB_HOST=localhost
DB_NAME=your_database_name
DB_PASSWORD=your_pg_password
DB_PORT=5432
```

## Database Setup

The API expects a `tasks` table. Create it manually before running the server:

```sql
CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    completed BOOLEAN NOT NULL DEFAULT false
);
```

## Running the Server

```bash
node express-server.js
```

The server starts on **port 3000**. You should see:

```
express server running on port 3000
```

## Authentication

All `/tasks` routes require an `Authorization` header matching a hardcoded token:

```
Authorization: secret123
```

Requests without this exact header value get a `401 Unauthorized` response.

## API Reference

Base URL: `http://localhost:3000`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Welcome message |
| GET | `/tasks` | Get all tasks |
| GET | `/tasks/filter?completed=true\|false` | Get tasks filtered by completion |
| GET | `/tasks/:id` | Get a single task by ID |
| POST | `/tasks` | Create a new task |
| PATCH | `/tasks/:id` | Update a task's `title` and/or `completed` status |
| DELETE | `/tasks/:id` | Delete a task by ID |

All routes below require the `Authorization: secret123` header.

### Create a task

```bash
curl -X POST http://localhost:3000/tasks \
  -H "Authorization: secret123" \
  -H "Content-Type: application/json" \
  -d '{"title": "Write the README"}'
```

### Get all tasks

```bash
curl http://localhost:3000/tasks \
  -H "Authorization: secret123"
```

### Filter tasks by completion

```bash
curl "http://localhost:3000/tasks/filter?completed=true" \
  -H "Authorization: secret123"
```

### Update a task

```bash
curl -X PATCH http://localhost:3000/tasks/1 \
  -H "Authorization: secret123" \
  -H "Content-Type: application/json" \
  -d '{"completed": true}'
```

### Delete a task

```bash
curl -X DELETE http://localhost:3000/tasks/1 \
  -H "Authorization: secret123"
```

## Validation Rules

- `title` must be a non-empty string, 1–100 characters
- `completed` must be a boolean
- `PATCH` requests must include only `title` and/or `completed` — no other fields
- Route `:id` params must be a positive integer

## Error Handling

Errors are returned as JSON in a consistent shape:

```json
{
  "message": "Task not found",
  "successfull": false
}
```

Known errors (e.g. invalid input, missing task) return the appropriate status code (`400`, `401`, `404`). Unhandled errors return `500 internal server error`.

## Known Limitations

- The auth token is hardcoded in `middleWare.js` rather than loaded from environment variables — replace this before deploying anywhere public.
- No automated tests are configured yet (`npm test` is a placeholder).
- `package.json` scripts need to be updated to point at `express-server.js` instead of `app.js`.

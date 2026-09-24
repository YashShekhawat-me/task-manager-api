# Task Manager API

A RESTful Task Manager API built with **Node.js**, **Express 5**, and **PostgreSQL**. It exposes CRUD endpoints for managing tasks, with request validation, filtering/sorting/pagination/search on listing, request timing, and centralized error handling.

## Features

- Create, read, update, and delete tasks
- List tasks with filtering (by completion), search, sorting, and pagination
- Filter tasks by completion status via a dedicated endpoint
- Request body and query-param validation
- Task ID validation on route params
- Response-time logging on every request
- Centralized error handling via a custom `AppError` class
- PostgreSQL persistence via the `pg` driver, with queries isolated in a repository layer

## Tech Stack

- **Runtime:** Node.js (ES Modules)
- **Framework:** Express 5
- **Database:** PostgreSQL (via `pg`)
- **Config:** `dotenv`
- **Logging:** `response-time`

## Project Structure

```
task-manager-api/
├── express-server.js    # App entry point — starts the Express server
├── taskRoutes.js         # Route definitions for /tasks
├── task-controller.js    # Request handlers (controllers)
├── taskServices.js       # Business/service layer
├── repository.js         # Raw SQL queries (data-access layer)
├── middleWare.js         # Auth + request/query validation middleware
├── server-services.js    # Misc route handlers (time, logging, error test)
├── error.js              # AppError class + global error handler
├── db.js                 # PostgreSQL connection pool
├── app.js                 # Standalone CLI tool for tasks (separate from the API server)
└── package.json
```

> **Notes on the current state of the repo:**
> - `package.json`'s `start`/`dev` scripts point to `app.js`, which is a CLI script (`add`/`list`/`complete`/`delete` via `process.argv`), not the API server. To run the actual HTTP API, start `express-server.js` directly (see below).
> - `app.js` imports a `completeTask` function from `taskServices.js`, but that function is no longer exported there (only `addTask`, `listTasks`, `getTask`, `deleteTask`, `GetTaskByCompletion`, `UpdateTask` are). The CLI tool's `complete` command is currently broken.
> - The `auth` middleware still exists in `middleWare.js`, but `router.use(auth)` is **commented out** in `taskRoutes.js`. All `/tasks` routes are currently open with no auth check.

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

Every request is logged to the console with its method, URL, and response time.

## Authentication

An `auth` middleware (checking for an `Authorization: secret123` header) exists in `middleWare.js`, but it is **not currently wired into any route** — `/tasks` endpoints are open. If you re-enable `router.use(auth)` in `taskRoutes.js`, all `/tasks` requests will need that header.

## API Reference

Base URL: `http://localhost:3000`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Welcome message |
| GET | `/tasks` | List tasks — supports filtering, search, sort, and pagination |
| GET | `/tasks/filter?completed=true\|false` | Get tasks filtered by completion (required param) |
| GET | `/tasks/:id` | Get a single task by ID |
| POST | `/tasks` | Create a new task |
| PATCH | `/tasks/:id` | Update a task's `title` and/or `completed` status |
| DELETE | `/tasks/:id` | Delete a task by ID |
| GET | `/testTime` | Debug endpoint — returns the time the request was received |
| GET | `/error-test` | Debug endpoint — throws a test error to exercise the error handler |

### List tasks — query parameters

`GET /tasks` accepts all of the following, combinable:

| Param | Type | Default | Notes |
|-------|------|---------|-------|
| `completed` | `true` \| `false` | *(no filter)* | Optional here (required on `/tasks/filter`) |
| `search` | string | *(none)* | Case-insensitive partial match on `title` |
| `sort` | `id` \| `title` | *(unsorted)* | |
| `order` | `asc` \| `desc` | `asc` | Only valid together with `sort` |
| `limit` | integer, 1–100 | `20` | |
| `offset` | integer, ≥ 0 | `0` | |

```bash
curl "http://localhost:3000/tasks?search=readme&sort=title&order=desc&limit=10"
```

### Create a task

```bash
curl -X POST http://localhost:3000/tasks \
  -H "Content-Type: application/json" \
  -d '{"title": "Write the README"}'
```

### Get all tasks

```bash
curl http://localhost:3000/tasks
```

### Filter tasks by completion

```bash
curl "http://localhost:3000/tasks/filter?completed=true"
```

### Update a task

```bash
curl -X PATCH http://localhost:3000/tasks/1 \
  -H "Content-Type: application/json" \
  -d '{"completed": true}'
```

### Delete a task

```bash
curl -X DELETE http://localhost:3000/tasks/1
```

## Validation Rules

- `title` must be a non-empty string, 1–100 characters
- `completed` must be a boolean
- `PATCH` requests must include only `title` and/or `completed` — no other fields
- Route `:id` params must be a positive integer
- `/tasks/filter` requires `completed=true` or `completed=false`
- `/tasks` list: `sort` must be `id` or `title`; `order` (if present) must be `asc` or `desc` and requires `sort`; `limit` must be an integer between 1 and 100; `offset` must be a non-negative integer; `search` (if present) can't be empty

## Error Handling

Errors are returned as JSON in a consistent shape:

```json
{
  "message": "Task not found",
  "successfull": false
}
```

Known errors (e.g. invalid input, missing task) return the appropriate status code (`400`, `404`). Unhandled errors return `500 internal server error`.

## Known Limitations

- `/tasks` routes currently have no auth check — `router.use(auth)` is commented out in `taskRoutes.js`.
- `app.js`'s CLI `complete` command is broken — it imports `completeTask` from `taskServices.js`, which no longer exports that function.
- `package.json` scripts (`start`/`dev`) still point at `app.js` instead of `express-server.js`.
- No automated tests are configured yet (`npm test` is a placeholder).


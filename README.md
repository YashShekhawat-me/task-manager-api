# Task Manager API

A lightweight REST API for managing tasks with Node.js, Express, and PostgreSQL.

## Overview

This project exposes CRUD endpoints for a task list and keeps the database access separated from the HTTP layer. The app validates request bodies and query parameters, logs response times, and returns consistent JSON errors.

## Features

- Create, read, update, and delete tasks
- List tasks with filtering, search, sorting, pagination, and count metadata
- Validate IDs, request bodies, and query parameters
- Centralized error handling with custom application errors
- PostgreSQL persistence through the `pg` library
- Response-time logging for each request

## Tech Stack

- Node.js
- Express 5
- PostgreSQL
- `pg` client for PostgreSQL
- `dotenv` for environment configuration
- `response-time` for request logging

## Project Structure

```text
.
├── db.js               # PostgreSQL connection pool
├── error.js            # AppError and global error handler
├── express-server.js    # Entry point for the Express app
├── middleWare.js       # Request validation and auth middleware
├── package.json        # Scripts and dependencies
├── repository.js       # Raw SQL queries for task data
├── task-controller.js  # HTTP controllers
├── taskRoutes.js       # Route definitions for /tasks
├── taskServices.js     # Business logic for task operations
├── .env                # Local environment variables (not committed)
├── .gitignore          # Ignored files
├── README.md           # Project documentation
└── test/               # Integration test folder (currently empty)
```

## Prerequisites

- Node.js 18+
- PostgreSQL database instance
- Access to a database user with privileges to create and query a `tasks` table

## Installation

```bash
npm install
```

## Environment Configuration

Create a `.env` file in the project root:

```env
DB_USER=postgres
DB_HOST=localhost
DB_NAME=task_manager
DB_PASSWORD=your_password
DB_PORT=5432
```

## Database Setup

Create the `tasks` table in PostgreSQL:

```sql
CREATE TABLE tasks (
  id SERIAL PRIMARY KEY,
  title VARCHAR(100) NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false
);
```

## Running the App

Start the server with either of the following:

```bash
npm start
```

or:

```bash
npm run dev
```

The app listens on port `3000`.

## API Endpoints

Base URL: `http://localhost:3000`

### GET /

Returns a welcome message.

```bash
curl http://localhost:3000/
```

### GET /tasks

Lists tasks with optional filtering and metadata.

Query parameters:

- `completed=true|false` — filter by completion status
- `search=some text` — search in task title (case-insensitive partial match)
- `sort=id|title` — sort field
- `order=asc|desc` — sort direction
- `limit=1..100` — max rows per page
- `offset=0..n` — pagination offset

Example:

```bash
curl "http://localhost:3000/tasks?completed=false&search=read&sort=title&order=desc&limit=10&offset=0"
```

### GET /tasks/:id

Fetch a single task by ID.

```bash
curl http://localhost:3000/tasks/1
```

### POST /tasks

Create a new task. Request body must contain a `title` string.

```bash
curl -X POST http://localhost:3000/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"Write the README"}'
```

### PATCH /tasks/:id

Update a task's `title` and/or `completed` value.

```bash
curl -X PATCH http://localhost:3000/tasks/1 \
  -H "Content-Type: application/json" \
  -d '{"title":"Updated task title","completed":true}'
```

### DELETE /tasks/:id

Deletes a task by ID.

```bash
curl -X DELETE http://localhost:3000/tasks/1
```

## Validation Behavior

The middleware validates:

- `id` must be a positive integer
- `title` must be a string with length 1-100 characters
- `completed` must be a boolean when provided
- query param `completed` must be `true` or `false`
- `sort` must be `id` or `title`
- `order` must be `asc` or `desc`
- `limit` must be an integer between 1 and 100
- `offset` must be an integer greater than or equal to 0
- `search` cannot be blank
- PATCH bodies can only include `title` and/or `completed`

## Authentication

The project includes an `auth` middleware in `middleWare.js` that checks for:

```http
Authorization: secret123
```

However, it is currently not mounted in `taskRoutes.js`, so all `/tasks` routes are currently public. To enforce it, uncomment the routing line in `taskRoutes.js`.

## Error Handling

The app uses a custom `AppError` class and a global error handler in `error.js`.

Known errors return JSON in this format:

```json
{
  "message": "Task not found",
  "successfull": false
}
```

Unhandled exceptions return a `500` response with a generic internal server error message.

## Notes

- The `test/` folder is present but currently empty.
- The server logs each request with method, path, and elapsed time.
- The codebase currently follows a simple layered design:
  - `taskRoutes.js` for routing
  - `task-controller.js` for request handling
  - `taskServices.js` for business logic
  - `repository.js` for database queries
  - `middleWare.js` for validation/auth

## Example Workflow

```bash
curl -X POST http://localhost:3000/tasks -H "Content-Type: application/json" -d '{"title":"Pay rent"}'
curl http://localhost:3000/tasks
curl -X PATCH http://localhost:3000/tasks/1 -H "Content-Type: application/json" -d '{"completed":true}'
curl -X DELETE http://localhost:3000/tasks/1
```


# Task Manager API

A REST API for user accounts and personal task management, built with Node.js, Express, and PostgreSQL. Users can register and log in, then manage their own tasks through authenticated endpoints. Login uses a JWT stored in an HTTP-only cookie.

## Features

- User registration and login with password hashing via `bcrypt`
- JWT authentication stored in an HTTP-only `access_token` cookie
- Logout by clearing the authentication cookie
- Task CRUD operations scoped to the authenticated user
- Task filtering, title search, sorting, and pagination
- Request validation and centralized JSON error handling
- PostgreSQL access organized into repositories, services, controllers, and routes
- Response-time logging outside the test environment
- Jest and Supertest integration tests covering authentication, task endpoints, validation, and per-user data isolation

## Tech Stack

- Node.js with ES modules
- Express 5
- PostgreSQL and `pg`
- `bcrypt` and `jsonwebtoken`
- `dotenv`, `cookie-parser`, `cors`, and `response-time`
- Jest and Supertest

## Project Structure

```text
.
├── app.js                    # Express app and middleware setup
├── server.js                 # HTTP server entry point
├── db.js                     # PostgreSQL connection pool
├── controllers/
│   ├── authController.js     # Registration, login, and logout handlers
│   └── taskController.js     # Task request handlers
├── middleWares/
│   ├── authMiddlewares.js    # Credential validation and cookie authentication
│   ├── error.js              # Application errors and error handler
│   └── middleWare.js         # Task request validation
├── repository/
│   ├── taskRepository.js     # Task SQL queries
│   └── userRepository.js     # User SQL queries
├── routes/
│   ├── authRoutes.js         # /auth endpoints
│   └── taskRoutes.js         # /tasks endpoints
├── services/
│   ├── authServices.js       # Authentication business logic
│   └── taskServices.js       # Task business logic
├── test/
│   ├── helper.js             # Test database reset and seed helpers
│   └── tasks.test.js         # Integration tests for auth, tasks, and ownership
├── .env                      # Local environment configuration (create locally)
├── .env.test                 # Test database configuration (create locally)
├── package.json
└── README.md
```

## Requirements

- Node.js 18 or newer
- npm
- PostgreSQL

## Installation

Install the project dependencies:

```bash
npm install
```

Create a PostgreSQL database for the application and configure the environment variables below.

## Environment Variables

Create a `.env` file in the project root:

```env
DB_USER=postgres
DB_HOST=localhost
DB_NAME=taskmanager
DB_PASSWORD=your_password
DB_PORT=5432
JWT_SECRET=replace_with_a_long_random_secret
PORT=3000
```

Jest uses `.env.test` for its test database. Create that file with separate test database credentials:

```env
DB_USER=postgres
DB_HOST=localhost
DB_NAME=task_manager_test
DB_PASSWORD=your_test_database_password
DB_PORT=5432
JWT_SECRET=another_long_random_secret
```

The test helpers refuse to truncate a database unless its name ends in `_test`. Keep test credentials and data separate from development or production.

## Database Schema

Create the tables before starting the API:

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tasks (
  id SERIAL PRIMARY KEY,
  title VARCHAR(100) NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE
);
```

## Run the API

Start the server:

```bash
npm start
```

Start in Node's watch mode during development:

```bash
npm run dev
```

The server listens on port `3000` by default, or the port configured by `PORT`.

## Authentication and Cookies

Register an account, then log in. A successful login sets an HTTP-only cookie named `access_token`; the token is not returned in the JSON body. Send this cookie with protected requests. Browsers handle same-origin cookies automatically; the `curl` examples below use a cookie jar.

The current login cookie is configured with `HttpOnly`, `SameSite=Lax`, `Path=/`, and a 10-minute max age. The JWT itself expires after four hours. The current cookie configuration sets `Secure` to `false`; use HTTPS and review cookie/CORS settings before deploying to production.

### `POST /auth/register`

Create an account:

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"MyPassword123"}'
```

Registration validates email format and requires a password of at least 8 characters and no more than 72 UTF-8 bytes. Registering an existing email returns `409 Conflict`.

### `POST /auth/login`

Log in and save the returned cookie to `cookies.txt`:

```bash
curl -i -c cookies.txt -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"MyPassword123"}'
```

The response body contains the authenticated user's details; the `Set-Cookie` response header contains the HTTP-only token cookie.

### `GET /auth/me`

Check the current authenticated user:

```bash
curl -b cookies.txt http://localhost:3000/auth/me
```

### `POST /auth/logout`

Clear the authentication cookie:

```bash
curl -i -b cookies.txt -c cookies.txt -X POST http://localhost:3000/auth/logout
```

## Task Endpoints

Every `/tasks` endpoint requires the `access_token` cookie created by login. A missing, invalid, or expired cookie returns `401 Unauthorized`. Task records are scoped to the authenticated user.

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/tasks` | List the current user's tasks |
| `GET` | `/tasks/:id` | Get a task by ID |
| `POST` | `/tasks` | Create a task |
| `PATCH` | `/tasks/:id` | Update a task title and/or completion status |
| `DELETE` | `/tasks/:id` | Delete a task |

### List tasks

Supported query parameters:

| Parameter | Values | Default | Description |
| --- | --- | --- | --- |
| `completed` | `true`, `false` | — | Filter by completion status |
| `search` | Non-empty text | — | Case-insensitive partial match on task title |
| `sort` | `id`, `title` | `id` | Sort field |
| `order` | `asc`, `desc` | `asc` | Sort direction; only allowed when `sort` is provided |
| `limit` | Integer from 1 to 100 | `20` | Maximum number of tasks |
| `offset` | Integer greater than or equal to 0 | `0` | Number of tasks to skip |

Example:

```bash
curl -b cookies.txt \
  "http://localhost:3000/tasks?completed=false&search=read&sort=title&order=asc&limit=10&offset=0"
```

The response includes the task data and pagination metadata:

```json
{
  "user_id": 1,
  "data": [
    {
      "id": 3,
      "title": "Read the project brief",
      "completed": false,
      "user_id": 1
    }
  ],
  "pagination": {
    "limit": 10,
    "offset": 0,
    "total": 1
  }
}
```

### Get a task

```bash
curl -b cookies.txt http://localhost:3000/tasks/1
```

### Create a task

The title must be a non-empty string of at most 100 characters.

```bash
curl -b cookies.txt -X POST http://localhost:3000/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"Review the project"}'
```

### Update a task

Provide `title`, `completed`, or both:

```bash
curl -b cookies.txt -X PATCH http://localhost:3000/tasks/1 \
  -H "Content-Type: application/json" \
  -d '{"title":"Review the updated project","completed":true}'
```

### Delete a task

```bash
curl -b cookies.txt -X DELETE http://localhost:3000/tasks/1
```

## Other Routes

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/` | Welcome message |
| `GET` | `/auth` | Authentication route information |
| `GET` | `/.well-known/appspecific/com.chrome.devtools.json` | Empty JSON response for Chrome DevTools discovery |

## Validation and Errors

Task IDs must be positive integers. Task titles must contain between 1 and 100 characters after trimming. Updates may only contain `title` and/or `completed`; `completed` must be a boolean. Query parameters are checked against the supported values and ranges listed above.

Errors are returned as JSON, typically in this shape:

```json
{
  "message": "Task not found",
  "successfull": false
}
```

Common status codes include:

- `400 Bad Request` — malformed JSON or invalid request data
- `401 Unauthorized` — missing or invalid authentication cookie, or invalid login credentials
- `404 Not Found` — task or route not found
- `409 Conflict` — email is already registered
- `500 Internal Server Error` — unexpected server error

## Tests

The suite uses Jest and Supertest and runs against a real PostgreSQL database, not mocks.

### Set up the test database

1. Create a separate database whose name ends in `_test` (for example `task_manager_test`) and create the `users` and `tasks` tables from the schema above.
2. Point `.env.test` at it (see Environment Variables). The test helpers refuse to run if the database name does not end in `_test`.
3. `.env.test` should also contain a `JWT_SECRET`. If it is missing, the tests fall back to a built-in test-only secret.

### Run the tests

```bash
npm test
```

Before every test, the database is emptied and re-seeded with one user and three tasks, and the test logs in so its requests carry the `access_token` cookie, just like a real client.

### What is covered

- **Authentication:** registration (including email normalization, duplicate emails, and invalid input), login, the `/auth/me` route, and logout
- **Protected routes:** every `/tasks` endpoint returns `401` without a valid cookie
- **Task endpoints:** listing with filtering, search, sorting, and pagination; get by ID; create; update with `title`, `completed`, or both; and delete
- **Validation:** invalid IDs, bodies, titles, and query parameters return the documented `400` errors
- **Data isolation:** a second user cannot read, update, or delete the first user's tasks

## CORS

The app currently allows the origin `http://localhost:3000`. If a browser-based client runs on a different origin, configure CORS to allow that origin and credentials, and configure the cookie's `SameSite`/`Secure` options appropriately.

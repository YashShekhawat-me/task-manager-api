import pool from "../db.js";
import bcrypt from "bcrypt";

export async function resetDB() {
    if (!process.env.DB_NAME?.endsWith("_test")) {
        throw new Error(
            "refusing to run tests on a non-test database"
        );
    }

    await pool.query(
        "TRUNCATE tasks, users RESTART IDENTITY CASCADE"
    );
}

export async function seedDb() {
    const email = "task-tests@example.com";
    const password = "TestPassword123";

    const passwordHash = await bcrypt.hash(password, 4);

    const userResult = await pool.query(
        `INSERT INTO users (email, password_hash)
         VALUES ($1, $2)
         RETURNING id`,
        [email, passwordHash]
    );

    const userId = userResult.rows[0].id;

    await pool.query(
        `INSERT INTO tasks (title, completed, user_id)
         VALUES
            ($1, $2, $3),
            ($4, $5, $6),
            ($7, $8, $9)`,
        [
            "buy milk", false, userId,
            "test node", false, userId,
            "learn jest", true, userId
        ]
    );

    return { userId, email, password };
}
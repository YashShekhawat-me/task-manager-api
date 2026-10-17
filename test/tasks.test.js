import supertest from "supertest";
const request = supertest;
import {test , expect , afterAll , beforeEach} from "@jest/globals";
import pool from "../db.js";
import app from "../app.js";
import {seedDb , resetDB } from "./helper.js";

beforeEach(async () => {
    await seedDb();
    await resetDB();
});

//get all tasks
test("gets all tasks" , async () => {
    const response = await request(app).get("/tasks");
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body).toHaveProperty("pagination");

    expect(typeof response.body.pagination.offset).toBe("number");
    expect(typeof response.body.pagination.limit).toBe("number");
    expect(typeof response.body.pagination.total).toBe("number");
});

//creates then fetches task then deletes tasks
test("creates then fetches tasks" , async () => {
    const created = await request(app).post("/tasks").send({title : "writes tests"});
    expect(created.status).toBe(201);

    const res = await request(app).get(`/tasks/${created.body.task.id}`);
    expect(res.status).toBe(200);
    expect(res.body.title).toBe("writes tests");

    const delres = await request(app).delete(`/tasks/${created.body.task.id}`);
    expect(delres.status).toBe(200);
    const res1 = await request(app).get(`/tasks/${created.body.task.id}`);
    expect(res1.status).toBe(404);
});


afterAll(async () => {
    await pool.end();
});


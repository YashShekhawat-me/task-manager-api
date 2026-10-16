import supertest from "supertest";
const request = supertest;
import {test , expect} from "@jest/globals";
import app from "../app.js";

test("gets all tasks" , async () => {
    const response = await request(app).get("/tasks");
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body).toHaveProperty("pagination");

    expect(typeof response.body.pagination.offset).toBe("number");
    expect(typeof response.body.pagination.limit).toBe("number");
    expect(typeof response.body.pagination.total).toBe("number");
});
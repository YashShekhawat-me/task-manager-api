import supertest from "supertest";
const request = supertest;
import {test , expect , afterAll , beforeEach , describe} from "@jest/globals";
import pool from "../db.js";
import app from "../app.js";
import {seedDb , resetDB } from "./helper.js";

beforeEach(async () => {
    await resetDB();
    await seedDb();
});


describe("get /tasks" , () => {
    
    test("gets all tasks" , async () => {
        const response = await request(app).get("/tasks");
        expect(response.status).toBe(200);
        expect(Array.isArray(response.body.data)).toBe(true);
        expect(response.body).toHaveProperty("pagination");
        expect(typeof response.body.pagination.offset).toBe("number");
        expect(response.body.pagination.offset).toBe(0);
        expect(typeof response.body.pagination.limit).toBe("number");
        expect(response.body.pagination.limit).toBe(20);
        expect(typeof response.body.pagination.total).toBe("number");
        expect(response.body.pagination.total).toBe(3);

        
    });
    test("gets tasks with limit and offset" , async () => {
        const response = await request(app).get("/tasks?limit=2&offset=1");
        expect(response.status).toBe(200);
        expect(response.body.data.length).toBe(2);
        expect(response.body.data[0].title).toBe("test node");
        expect(response.body.data[1].title).toBe("learn jest");
        expect(response.body.pagination.limit).toBe(2);
        expect(response.body.pagination.offset).toBe(1);
        expect(response.body.pagination.total).toBe(3);
    });

    test("gets tasks with invalid limit" , async () => {
        const res1 = await request(app).get("/tasks?limit=banana");
        expect(res1.status).toBe(400);
        expect(res1.body.message).toBe("limit should be number");

        const res2 = await request(app).get("/tasks?limit=1.5");
        expect(res2.status).toBe(400);
        expect(res2.body.message).toBe("limit must be an integer");

        const res3 = await request(app).get("/tasks?limit=0");
        expect(res3.status).toBe(400);
        expect(res3.body.message).toBe("limit must be positive");

        const res4 = await request(app).get("/tasks?limit=101");
        expect(res4.status).toBe(400);
        expect(res4.body.message).toBe("limit should be less then 100");
    });

    test("gets tasks with invalid offset" , async () => {
        const res1 = await request(app).get("/tasks?offset=banana");
        expect(res1.status).toBe(400);
        expect(res1.body.message).toBe("offset should be an integer");

        const res2 = await request(app).get("/tasks?offset=1.5");
        expect(res2.status).toBe(400);
        expect(res2.body.message).toBe("offset must be an integer");

        const res3 = await request(app).get("/tasks?offset=-1");
        expect(res3.status).toBe(400);
        expect(res3.body.message).toBe("offset should be greater then or equal to 0");
    });

    test("gets tasks with invalid search" , async () => {
        const res1 = await request(app).get("/tasks?search=");
        expect(res1.status).toBe(400);
        expect(res1.body.message).toBe("search can not be empty");

        const res2 = await request(app).get("/tasks?search=%20%20");
        expect(res2.status).toBe(400);
        expect(res2.body.message).toBe("search can not be empty");

        const res3 = await request(app).get("/tasks?search=milk&search=jest");
        expect(res3.status).toBe(400);
        expect(res3.body.message).toBe("search must be a string");
    });

    test("gets tasks matching search" , async () => {
        const response = await request(app).get("/tasks?search=milk");
        expect(response.status).toBe(200);
        expect(response.body.data.length).toBe(1);
        expect(response.body.data[0].title).toBe("buy milk");
        expect(response.body.pagination.total).toBe(1);
    });

    describe("get task by sort and order" , () => {
        test("sort all happy paths returns 200" , async() => {
            const res1 = await request(app).get("/tasks?sort=title&order=asc");
            expect(res1.status).toBe(200);
            expect(res1.body.data[0].title).toBe("buy milk");
            expect(res1.body.data[1].title).toBe("learn jest");
            expect(res1.body.data[2].title).toBe("test node");

            const res2 = await request(app).get("/tasks?sort=id&order=asc");
            expect(res2.status).toBe(200);
            expect(res2.body.data[0].title).toBe("buy milk");
            expect(res2.body.data[1].title).toBe("test node");
            expect(res2.body.data[2].title).toBe("learn jest");
            
            const res3 = await request(app).get("/tasks?sort=title&order=desc");
            expect(res3.status).toBe(200);
            expect(res3.body.data[0].title).toBe("test node");
            expect(res3.body.data[1].title).toBe("learn jest");
            expect(res3.body.data[2].title).toBe("buy milk");
            
            const res4 = await request(app).get("/tasks?sort=id&order=desc");
            expect(res4.status).toBe(200);
            expect(res4.body.data[0].title).toBe("learn jest");
            expect(res4.body.data[1].title).toBe("test node");
            expect(res4.body.data[2].title).toBe("buy milk");

            const res5 = await request(app).get("/tasks");
            expect(res5.status).toBe(200);
            expect(res5.body.data[0].title).toBe("buy milk");
            expect(res5.body.data[1].title).toBe("test node");
            expect(res5.body.data[2].title).toBe("learn jest");
        });

        test("sort undefined but order not , return 400" , async() => {
            const res = await request(app).get("/tasks?order=desc");
            expect(res.status).toBe(400);
            expect(res.body.message).toBe("order only allowed with sort");
        });

        // test("", async() => {

        // });
        test("invalid sort argument returns 400", async() => {
            const res = await request(app).get("/tasks?sort=banana");
            expect(res.status).toBe(400);
            expect(res.body.message).toBe("invalid sort argument");
        });

         test("invalid order argument", async() => {
            const res = await request(app).get("/tasks?sort=id&order=banana");
            expect(res.status).toBe(400);
            expect(res.body.message).toBe("invalid order argument");
        });
    });

    describe("get tasks with completed" , () => {
        test("get task with completed true or false (happy path)", async () => {
            const res = await request(app).get("/tasks?completed=true");
            expect(res.status).toBe(200);
            expect(res.body.data.length).toBe(1);
            expect(res.body.data[0].title).toBe("learn jest");

            const res1 = await request(app).get("/tasks?completed=false");
            expect(res1.status).toBe(200);
            expect(res1.body.data.length).toBe(2);
        });

        test("get tasks with  invalid completed query" , async () => {
            const res = await request(app).get("/tasks?completed=banana");
            expect(res.status).toBe(400);
            expect(res.body.message).toBe("Invalid Query parameters");
        });
    });

});

describe("get task by id",() => {
    test("get task by id returns 200" , async() => {
        const res5 = await request(app).get("/tasks/1");
        expect(res5.status).toBe(200);
        expect(res5.body.title).toBe("buy milk");   
    });

    test("get task invalid id" , async() => {
        const res5 = await request(app).get("/tasks/abc");
        expect(res5.status).toBe(400);
        expect(res5.body.message).toBe("Task id can only contain digits");

        const res6 = await request(app).get("/tasks/-4");
        expect(res6.status).toBe(400);
        expect(res6.body.message).toBe("Task id can only contain digits");
    });
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
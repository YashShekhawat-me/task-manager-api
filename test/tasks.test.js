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

test("get the home directory" , async () => {
    const res = await request(app).get("/");
    expect(res.status).toBe(200);
    expect(res.body.message).toBe("welcome to the taskManager API");
});

test("getting a undefined path" , async () => {
    const res = await request(app).get("/banana");
    expect(res.status).toBe(404);
    expect(res.body.message).toBe("/banana path is not defined");
})

test("test invalid json payload" , async () => {
    const res = await request(app).post("/tasks").set("Content-Type" , "application/json").send('{"title" : ');
    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Malformed JSON payload. Please verify your syntax");
})


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

    test("gets tasks with search, sorting, and pagination" , async () => {
        const response = await request(app).get("/tasks?search=t&sort=title&order=asc&limit=1&offset=0");
        expect(response.status).toBe(200);
        expect(response.body.data.length).toBe(1);
        expect(response.body.data[0].title).toBe("learn jest");
        expect(response.body.pagination.limit).toBe(1);
        expect(response.body.pagination.offset).toBe(0);
        expect(response.body.pagination.total).toBe(2);
    });

    test("gets incomplete tasks with sorting and pagination" , async () => {
        const response = await request(app).get("/tasks?completed=false&sort=title&order=desc&limit=1&offset=1");
        expect(response.status).toBe(200);
        expect(response.body.data.length).toBe(1);
        expect(response.body.data[0].title).toBe("buy milk");
        expect(response.body.pagination.limit).toBe(1);
        expect(response.body.pagination.offset).toBe(1);
        expect(response.body.pagination.total).toBe(2);
    });

    test("gets no tasks when search has no matches" , async () => {
        const response = await request(app).get("/tasks?search=python");
        expect(response.status).toBe(200);
        expect(response.body.data.length).toBe(0);
        expect(response.body.pagination.total).toBe(0);
    });

    test("get task with order undefined" , async () => {
        const res = await request(app).get("/tasks?sort=id");
        expect(res.status).toBe(200);
        expect(res.body.data[0].title).toBe("buy milk");
        expect(res.body.data[1].title).toBe("test node");
        expect(res.body.data[2].title).toBe("learn jest");
    })

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

    test("get task that does not exist" , async() => {
        const response = await request(app).get("/tasks/999");
        expect(response.status).toBe(404);
        expect(response.body.message).toBe("Task not found");
    });

    test("get task with greater then the limit" , async() => {
        const response = await request(app).get("/tasks/2147483648");
        expect(response.status).toBe(400);
        expect(response.body.message).toBe("task id should be between 1 & 2147483647");
    });

});

describe("post on /tasks" , () =>{
    test("creates task with valid input" , async() => {
        const res = await request(app).post("/tasks").send({title: "learn supertest"});

        expect(res.status).toBe(201);
        expect(res.body.message).toBe("task created!!");
        expect(res.body.task.title).toEqual("learn supertest");
        expect(res.body.task.id).toBeDefined();
    });

    test("creates task with invalid body type" , async () => {
        const res = await request(app).post("/tasks").send("learn supertest");
        expect(res.status).toBe(400);
        expect(res.body.message).toBe("request body must be an object");
    });

    test("creates task with null body" , async () => {
        const res = await request(app).post("/tasks").send(null);
        expect(res.status).toBe(400);
        expect(res.body.message).toBe("request body must be an object");
    });

    test("creates task without a title" , async () => {
        const res = await request(app).post("/tasks").send({});
        expect(res.status).toBe(400);
        expect(res.body.message).toBe("title must be between 1 to 100 character");
    });

    test("creates task with invalid body type" , async () => {
        const res = await request(app).post("/tasks").send("learn supertest");
        expect(res.status).toBe(400);
        expect(res.body.message).toBe("request body must be an object");
    });

    test("create a task with wrong title type" , async () => {
        const res = await request(app).post("/tasks").send({title: true});
        expect(res.status).toBe(400);
        expect(res.body.message).toBe("title must be between 1 to 100 character");
    });

    test("create a task with an empty title" , async () => {
        const res = await request(app).post("/tasks").send({title:""});
        expect(res.status).toBe(400);
        expect(res.body.message).toBe("title must be between 1 to 100 character");
    });

    test("create a task with only spaces" , async () => {
        const res = await request(app).post("/tasks").send({title:"            "});
        expect(res.status).toBe(400);
        expect(res.body.message).toBe("title must be between 1 to 100 character");
    });

    test("create a task with length greater then 100" , async () => {
        const res = await request(app).post("/tasks").send({title: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"});
        expect(res.status).toBe(400);
        expect(res.body.message).toBe("title must be between 1 to 100 character");
    });

    test("creates task with title at maximum length" , async () => {
        const title = "a".repeat(100);
        const res = await request(app).post("/tasks").send({title});
        expect(res.status).toBe(201);
        expect(res.body.task.title).toBe(title);
        expect(res.body.task.title.length).toBe(100);
    });

    test("creates task with trimmed title" , async () => {
        const res = await request(app).post("/tasks").send({title:"  learn supertest  "});
        expect(res.status).toBe(201);
        expect(res.body.task.title).toBe("learn supertest");
    });

    test("create a task with body as array" , async () => {
        const res = await request(app).post("/tasks").send([1,2,3,4]);
        expect(res.status).toBe(400);
        expect(res.body.message).toBe("request body must be an object");
    });
    
});

describe("patch on /tasks" , ()=>{
    test("updates the title of existing task" , async () => {
        const res = await request(app).patch("/tasks/1").send({title : "patch works"});
        expect(res.status).toBe(200);
        expect(res.body.title).toBe("patch works");
    });

    test("updates the title of existing task" , async () => {
        const res = await request(app).patch("/tasks/1").send({title : "patch works fine" , completed: true});
        expect(res.status).toBe(200);
        expect(res.body.title).toBe("patch works fine");
        expect(res.body.completed).toBe(true);
    });

    test("update task with non existent id" , async () => {
        const res = await request(app).patch("/tasks/999").send({title : "blehhh"});
        expect(res.status).toBe(404);
        expect(res.body.message).toBe("Error 404 Task Not Found");
    })

    test("update with invalid body type" , async () => {
        const res = await request(app).patch("/tasks/1").send("patch works");
        expect(res.status).toBe(400);
        expect(res.body.message).toBe("request body must be an object");
    });

    test("update with body = null" , async () => {
        const res = await request(app).patch("/tasks/1").send(null);
        expect(res.status).toBe(400);
        expect(res.body.message).toBe("request body must be an object");
    });

    test("update with body as an array" , async () => {
        const res = await request(app).patch("/tasks/1").send([1,2,3]);
        expect(res.status).toBe(400);
        expect(res.body.message).toBe("request body must be an object");
    });

    test("update with invalid property" , async () => {
        const res = await request(app).patch("/tasks/1").send({title: "error" , banana: "hello"});
        expect(res.status).toBe(400);
        expect(res.body.message).toBe("Invalid body properties provided");
    });

    test("update with no properties provided" , async () => {
        const res = await request(app).patch("/tasks/1").send({});
        expect(res.status).toBe(400);
        expect(res.body.message).toBe("no task property provided");
    });

    test("update with title not as a string" , async () => {
        const res = await request(app).patch("/tasks/1").send({title: false});
        expect(res.status).toBe(400);
        expect(res.body.message).toBe("title must be between 1 to 100 character");
    });

    test("update with title as a string with 0 length and whitespaces" , async () => {
        const res = await request(app).patch("/tasks/1").send({title: "   "});
        expect(res.status).toBe(400);
        expect(res.body.message).toBe("title must be between 1 to 100 character");
    });

    test("update with title as a string with more then 100 length" , async () => {
        const res = await request(app).patch("/tasks/1").send({title: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"});
        expect(res.status).toBe(400);
        expect(res.body.message).toBe("title must be between 1 to 100 character");
    });

    test("update with completed not as boolean" , async () => {
        const res = await request(app).patch("/tasks/1").send({completed : "false"});
        expect(res.status).toBe(400);
        expect(res.body.message).toBe("completed should have been a boolean value");
    })

});

describe("delete on /tasks" , () => {
    beforeEach(async () => {
        await resetDB();
        await seedDb();
    })
    test("delete an existing task" , async () => {
        const res = await request(app).delete("/tasks/1");
        expect(res.status).toBe(200);
        expect(res.body.message).toBe("task deleted successfully");
        const res1 = await request(app).get("/tasks");
        expect(res1.body.pagination.total).toBe(2);
    });
    
    test("delete an non existent task" , async () => {
        const res = await request(app).delete("/tasks/999");
        expect(res.status).toBe(404);
        expect(res.body.message).toBe("Task not found");
        const res1 = await request(app).get("/tasks");
        expect(res1.body.pagination.total).toBe(3);
    })
})

afterAll(async () => {
    await pool.end();
});
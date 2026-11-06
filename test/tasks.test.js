import supertest from "supertest";
const request = supertest;
import {test , expect , afterAll , beforeEach , describe} from "@jest/globals";
import pool from "../db.js";
import app from "../app.js";
import {seedDb , resetDB } from "./helper.js";

// the login code signs a JWT, so tests need a secret even if .env.test does not have one
process.env.JWT_SECRET ??= "test_only_secret";

// agent remembers cookies, so after logging in once every request it makes is authenticated
let agent;
let seeded;

beforeEach(async () => {
    await resetDB();
    seeded = await seedDb();
    agent = request.agent(app);
    const login = await agent.post("/auth/login").send({email : seeded.email , password : seeded.password});
    expect(login.status).toBe(200);
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
        const response = await agent.get("/tasks");
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
        const response = await agent.get("/tasks?limit=2&offset=1");
        expect(response.status).toBe(200);
        expect(response.body.data.length).toBe(2);
        expect(response.body.data[0].title).toBe("test node");
        expect(response.body.data[1].title).toBe("learn jest");
        expect(response.body.pagination.limit).toBe(2);
        expect(response.body.pagination.offset).toBe(1);
        expect(response.body.pagination.total).toBe(3);
    });

    test("gets tasks with invalid limit" , async () => {
        const res1 = await agent.get("/tasks?limit=banana");
        expect(res1.status).toBe(400);
        expect(res1.body.message).toBe("limit should be number");

        const res2 = await agent.get("/tasks?limit=1.5");
        expect(res2.status).toBe(400);
        expect(res2.body.message).toBe("limit must be an integer");

        const res3 = await agent.get("/tasks?limit=0");
        expect(res3.status).toBe(400);
        expect(res3.body.message).toBe("limit must be positive");

        const res4 = await agent.get("/tasks?limit=101");
        expect(res4.status).toBe(400);
        expect(res4.body.message).toBe("limit should be less then 100");
    });

    test("gets tasks with invalid offset" , async () => {
        const res1 = await agent.get("/tasks?offset=banana");
        expect(res1.status).toBe(400);
        expect(res1.body.message).toBe("offset should be an integer");

        const res2 = await agent.get("/tasks?offset=1.5");
        expect(res2.status).toBe(400);
        expect(res2.body.message).toBe("offset must be an integer");

        const res3 = await agent.get("/tasks?offset=-1");
        expect(res3.status).toBe(400);
        expect(res3.body.message).toBe("offset should be greater then or equal to 0");
    });

    test("gets tasks with invalid search" , async () => {
        const res1 = await agent.get("/tasks?search=");
        expect(res1.status).toBe(400);
        expect(res1.body.message).toBe("search can not be empty");

        const res2 = await agent.get("/tasks?search=%20%20");
        expect(res2.status).toBe(400);
        expect(res2.body.message).toBe("search can not be empty");

        const res3 = await agent.get("/tasks?search=milk&search=jest");
        expect(res3.status).toBe(400);
        expect(res3.body.message).toBe("search must be a string");
    });

    test("gets tasks matching search" , async () => {
        const response = await agent.get("/tasks?search=milk");
        expect(response.status).toBe(200);
        expect(response.body.data.length).toBe(1);
        expect(response.body.data[0].title).toBe("buy milk");
        expect(response.body.pagination.total).toBe(1);
    });

    test("gets tasks with search, sorting, and pagination" , async () => {
        const response = await agent.get("/tasks?search=t&sort=title&order=asc&limit=1&offset=0");
        expect(response.status).toBe(200);
        expect(response.body.data.length).toBe(1);
        expect(response.body.data[0].title).toBe("learn jest");
        expect(response.body.pagination.limit).toBe(1);
        expect(response.body.pagination.offset).toBe(0);
        expect(response.body.pagination.total).toBe(2);
    });

    test("gets incomplete tasks with sorting and pagination" , async () => {
        const response = await agent.get("/tasks?completed=false&sort=title&order=desc&limit=1&offset=1");
        expect(response.status).toBe(200);
        expect(response.body.data.length).toBe(1);
        expect(response.body.data[0].title).toBe("buy milk");
        expect(response.body.pagination.limit).toBe(1);
        expect(response.body.pagination.offset).toBe(1);
        expect(response.body.pagination.total).toBe(2);
    });

    test("gets no tasks when search has no matches" , async () => {
        const response = await agent.get("/tasks?search=python");
        expect(response.status).toBe(200);
        expect(response.body.data.length).toBe(0);
        expect(response.body.pagination.total).toBe(0);
    });

    test("get task with order undefined" , async () => {
        const res = await agent.get("/tasks?sort=id");
        expect(res.status).toBe(200);
        expect(res.body.data[0].title).toBe("buy milk");
        expect(res.body.data[1].title).toBe("test node");
        expect(res.body.data[2].title).toBe("learn jest");
    })

    describe("get task by sort and order" , () => {
        test("sort all happy paths returns 200" , async() => {
            const res1 = await agent.get("/tasks?sort=title&order=asc");
            expect(res1.status).toBe(200);
            expect(res1.body.data[0].title).toBe("buy milk");
            expect(res1.body.data[1].title).toBe("learn jest");
            expect(res1.body.data[2].title).toBe("test node");

            const res2 = await agent.get("/tasks?sort=id&order=asc");
            expect(res2.status).toBe(200);
            expect(res2.body.data[0].title).toBe("buy milk");
            expect(res2.body.data[1].title).toBe("test node");
            expect(res2.body.data[2].title).toBe("learn jest");
            
            const res3 = await agent.get("/tasks?sort=title&order=desc");
            expect(res3.status).toBe(200);
            expect(res3.body.data[0].title).toBe("test node");
            expect(res3.body.data[1].title).toBe("learn jest");
            expect(res3.body.data[2].title).toBe("buy milk");
            
            const res4 = await agent.get("/tasks?sort=id&order=desc");
            expect(res4.status).toBe(200);
            expect(res4.body.data[0].title).toBe("learn jest");
            expect(res4.body.data[1].title).toBe("test node");
            expect(res4.body.data[2].title).toBe("buy milk");

            const res5 = await agent.get("/tasks");
            expect(res5.status).toBe(200);
            expect(res5.body.data[0].title).toBe("buy milk");
            expect(res5.body.data[1].title).toBe("test node");
            expect(res5.body.data[2].title).toBe("learn jest");
        });

        test("sort undefined but order not , return 400" , async() => {
            const res = await agent.get("/tasks?order=desc");
            expect(res.status).toBe(400);
            expect(res.body.message).toBe("order only allowed with sort");
        });

        // test("", async() => {

        // });
        test("invalid sort argument returns 400", async() => {
            const res = await agent.get("/tasks?sort=banana");
            expect(res.status).toBe(400);
            expect(res.body.message).toBe("invalid sort argument");
        });

         test("invalid order argument", async() => {
            const res = await agent.get("/tasks?sort=id&order=banana");
            expect(res.status).toBe(400);
            expect(res.body.message).toBe("invalid order argument");
        });
    });

    describe("get tasks with completed" , () => {
        test("get task with completed true or false (happy path)", async () => {
            const res = await agent.get("/tasks?completed=true");
            expect(res.status).toBe(200);
            expect(res.body.data.length).toBe(1);
            expect(res.body.data[0].title).toBe("learn jest");

            const res1 = await agent.get("/tasks?completed=false");
            expect(res1.status).toBe(200);
            expect(res1.body.data.length).toBe(2);
        });

        test("get tasks with  invalid completed query" , async () => {
            const res = await agent.get("/tasks?completed=banana");
            expect(res.status).toBe(400);
            expect(res.body.message).toBe("Invalid Query parameters");
        });
    });

});

describe("get task by id",() => {
    test("get task by id returns 200" , async() => {
        const res5 = await agent.get("/tasks/1");
        expect(res5.status).toBe(200);
        expect(res5.body.title).toBe("buy milk");   
    });

    test("get task invalid id" , async() => {
        const res5 = await agent.get("/tasks/abc");
        expect(res5.status).toBe(400);
        expect(res5.body.message).toBe("Task id can only contain digits");

        const res6 = await agent.get("/tasks/-4");
        expect(res6.status).toBe(400);
        expect(res6.body.message).toBe("Task id can only contain digits");
    });

    test("get task that does not exist" , async() => {
        const response = await agent.get("/tasks/999");
        expect(response.status).toBe(404);
        expect(response.body.message).toBe("Task not found");
    });

    test("get task with greater then the limit" , async() => {
        const response = await agent.get("/tasks/2147483648");
        expect(response.status).toBe(400);
        expect(response.body.message).toBe("task id should be between 1 & 2147483647");
    });

});

describe("post on /tasks" , () =>{
    test("creates task with valid input" , async() => {
        const res = await agent.post("/tasks").send({title: "learn supertest"});

        expect(res.status).toBe(201);
        expect(res.body.message).toBe("task created!!");
        expect(res.body.task.title).toEqual("learn supertest");
        expect(res.body.task.id).toBeDefined();
    });

    test("creates task with invalid body type" , async () => {
        const res = await agent.post("/tasks").send("learn supertest");
        expect(res.status).toBe(400);
        expect(res.body.message).toBe("request body must be an object");
    });

    test("creates task with null body" , async () => {
        const res = await agent.post("/tasks").send(null);
        expect(res.status).toBe(400);
        expect(res.body.message).toBe("request body must be an object");
    });

    test("creates task without a title" , async () => {
        const res = await agent.post("/tasks").send({});
        expect(res.status).toBe(400);
        expect(res.body.message).toBe("title must be between 1 to 100 character");
    });

    test("creates task with invalid body type" , async () => {
        const res = await agent.post("/tasks").send("learn supertest");
        expect(res.status).toBe(400);
        expect(res.body.message).toBe("request body must be an object");
    });

    test("create a task with wrong title type" , async () => {
        const res = await agent.post("/tasks").send({title: true});
        expect(res.status).toBe(400);
        expect(res.body.message).toBe("title must be between 1 to 100 character");
    });

    test("create a task with an empty title" , async () => {
        const res = await agent.post("/tasks").send({title:""});
        expect(res.status).toBe(400);
        expect(res.body.message).toBe("title must be between 1 to 100 character");
    });

    test("create a task with only spaces" , async () => {
        const res = await agent.post("/tasks").send({title:"            "});
        expect(res.status).toBe(400);
        expect(res.body.message).toBe("title must be between 1 to 100 character");
    });

    test("create a task with length greater then 100" , async () => {
        const res = await agent.post("/tasks").send({title: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"});
        expect(res.status).toBe(400);
        expect(res.body.message).toBe("title must be between 1 to 100 character");
    });

    test("creates task with title at maximum length" , async () => {
        const title = "a".repeat(100);
        const res = await agent.post("/tasks").send({title});
        expect(res.status).toBe(201);
        expect(res.body.task.title).toBe(title);
        expect(res.body.task.title.length).toBe(100);
    });

    test("creates task with trimmed title" , async () => {
        const res = await agent.post("/tasks").send({title:"  learn supertest  "});
        expect(res.status).toBe(201);
        expect(res.body.task.title).toBe("learn supertest");
    });

    test("create a task with body as array" , async () => {
        const res = await agent.post("/tasks").send([1,2,3,4]);
        expect(res.status).toBe(400);
        expect(res.body.message).toBe("request body must be an object");
    });
    
});

describe("patch on /tasks" , ()=>{
    test("updates the title of existing task" , async () => {
        const res = await agent.patch("/tasks/1").send({title : "patch works"});
        expect(res.status).toBe(200);
        expect(res.body.title).toBe("patch works");
    });

    test("updates the title of existing task" , async () => {
        const res = await agent.patch("/tasks/1").send({title : "patch works fine" , completed: true});
        expect(res.status).toBe(200);
        expect(res.body.title).toBe("patch works fine");
        expect(res.body.completed).toBe(true);
    });

    test("updates only completed without sending a title" , async () => {
        const res = await agent.patch("/tasks/1").send({completed : true});
        expect(res.status).toBe(200);
        expect(res.body.completed).toBe(true);
        expect(res.body.title).toBe("buy milk");
    });

    test("update task with non existent id" , async () => {
        const res = await agent.patch("/tasks/999").send({title : "blehhh"});
        expect(res.status).toBe(404);
        expect(res.body.message).toBe("Error 404 Task Not Found");
    })

    test("update with invalid body type" , async () => {
        const res = await agent.patch("/tasks/1").send("patch works");
        expect(res.status).toBe(400);
        expect(res.body.message).toBe("request body must be an object");
    });

    test("update with body = null" , async () => {
        const res = await agent.patch("/tasks/1").send(null);
        expect(res.status).toBe(400);
        expect(res.body.message).toBe("request body must be an object");
    });

    test("update with body as an array" , async () => {
        const res = await agent.patch("/tasks/1").send([1,2,3]);
        expect(res.status).toBe(400);
        expect(res.body.message).toBe("request body must be an object");
    });

    test("update with invalid property" , async () => {
        const res = await agent.patch("/tasks/1").send({title: "error" , banana: "hello"});
        expect(res.status).toBe(400);
        expect(res.body.message).toBe("Invalid body properties provided");
    });

    test("update with no properties provided" , async () => {
        const res = await agent.patch("/tasks/1").send({});
        expect(res.status).toBe(400);
        expect(res.body.message).toBe("no task property provided");
    });

    test("update with title not as a string" , async () => {
        const res = await agent.patch("/tasks/1").send({title: false});
        expect(res.status).toBe(400);
        expect(res.body.message).toBe("title must be between 1 to 100 character");
    });

    test("update with title as a string with 0 length and whitespaces" , async () => {
        const res = await agent.patch("/tasks/1").send({title: "   "});
        expect(res.status).toBe(400);
        expect(res.body.message).toBe("title must be between 1 to 100 character");
    });

    test("update with title as a string with more then 100 length" , async () => {
        const res = await agent.patch("/tasks/1").send({title: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"});
        expect(res.status).toBe(400);
        expect(res.body.message).toBe("title must be between 1 to 100 character");
    });

    test("update with completed not as boolean" , async () => {
        const res = await agent.patch("/tasks/1").send({completed : "false"});
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
        const res = await agent.delete("/tasks/1");
        expect(res.status).toBe(200);
        expect(res.body.message).toBe("task deleted successfully");
        const res1 = await agent.get("/tasks");
        expect(res1.body.pagination.total).toBe(2);
    });
    
    test("delete an non existent task" , async () => {
        const res = await agent.delete("/tasks/999");
        expect(res.status).toBe(404);
        expect(res.body.message).toBe("Task not found");
        const res1 = await agent.get("/tasks");
        expect(res1.body.pagination.total).toBe(3);
    })
})

afterAll(async () => {
    await pool.end();
});

describe("auth routes" , () => {
    test("register creates a user and never returns the password hash" , async () => {
        const res = await request(app).post("/auth/register").send({email : "new.user@example.com" , password : "NewPassword123"});
        expect(res.status).toBe(201);
        expect(res.body.successful).toBe(true);
        expect(res.body.user.email).toBe("new.user@example.com");
        expect(res.body.user.id).toBeDefined();
        expect(res.body.user.password_hash).toBeUndefined();
    });

    test("register trims and lowercases the email" , async () => {
        const res = await request(app).post("/auth/register").send({email : "  New.User@Example.COM  " , password : "NewPassword123"});
        expect(res.status).toBe(201);
        expect(res.body.user.email).toBe("new.user@example.com");
    });

    test("register with an email that already exists returns 409" , async () => {
        const res = await request(app).post("/auth/register").send({email : seeded.email , password : "AnotherPass123"});
        expect(res.status).toBe(409);
        expect(res.body.message).toBe("email already exists");
    });

    test("register with invalid input returns 400" , async () => {
        const res1 = await request(app).post("/auth/register").send({password : "NewPassword123"});
        expect(res1.status).toBe(400);
        expect(res1.body.message).toBe("email and password are required");

        const res2 = await request(app).post("/auth/register").send({email : "not-an-email" , password : "NewPassword123"});
        expect(res2.status).toBe(400);
        expect(res2.body.message).toBe("invalid email address");

        const res3 = await request(app).post("/auth/register").send({email : "short@example.com" , password : "short"});
        expect(res3.status).toBe(400);
        expect(res3.body.message).toBe("password must be at least 8 characters");

        const res4 = await request(app).post("/auth/register").send({email : "long@example.com" , password : "a".repeat(73)});
        expect(res4.status).toBe(400);
        expect(res4.body.message).toBe("password must not exceed 72 UTF-8 bytes");
    });

    test("login sets an http only cookie and does not return the token or hash" , async () => {
        const res = await request(app).post("/auth/login").send({email : seeded.email , password : seeded.password});
        expect(res.status).toBe(200);
        expect(res.body.user.email).toBe(seeded.email);
        expect(res.body.token).toBeUndefined();
        expect(res.body.user.password_hash).toBeUndefined();
        const cookie = res.headers["set-cookie"].join(";");
        expect(cookie).toContain("access_token=");
        expect(cookie).toContain("HttpOnly");
    });

    test("login with a wrong password or unknown email returns 401" , async () => {
        const res1 = await request(app).post("/auth/login").send({email : seeded.email , password : "WrongPassword123"});
        expect(res1.status).toBe(401);
        expect(res1.body.message).toBe("invalid credentials");

        const res2 = await request(app).post("/auth/login").send({email : "nobody@example.com" , password : "WrongPassword123"});
        expect(res2.status).toBe(401);
        expect(res2.body.message).toBe("invalid credentials");
    });

    test("me returns the logged in user" , async () => {
        const res = await agent.get("/auth/me");
        expect(res.status).toBe(200);
        expect(res.body.user).toBe(seeded.userId);
    });

    test("me without a cookie returns 401" , async () => {
        const res = await request(app).get("/auth/me");
        expect(res.status).toBe(401);
        expect(res.body.message).toBe("Invalid or missing token");
    });

    test("logout clears the cookie so protected routes return 401 again" , async () => {
        const before = await agent.get("/tasks");
        expect(before.status).toBe(200);

        const out = await agent.post("/auth/logout");
        expect(out.status).toBe(200);

        const after = await agent.get("/tasks");
        expect(after.status).toBe(401);
    });
});

describe("protected task routes" , () => {
    test("every task route returns 401 without a cookie" , async () => {
        const responses = [
            await request(app).get("/tasks"),
            await request(app).get("/tasks/1"),
            await request(app).post("/tasks").send({title : "sneaky"}),
            await request(app).patch("/tasks/1").send({title : "sneaky"}),
            await request(app).delete("/tasks/1")
        ];
        for(const res of responses){
            expect(res.status).toBe(401);
            expect(res.body.message).toBe("Invalid or missing token");
        }
    });

    test("a garbage token returns 401" , async () => {
        const res = await request(app).get("/tasks").set("Cookie" , "access_token=not-a-real-token");
        expect(res.status).toBe(401);
        expect(res.body.message).toBe("Invalid or expired token");
    });
});

describe("tasks belong to their owner" , () => {
    test("another user cannot see, change or delete the first user's tasks" , async () => {
        await request(app).post("/auth/register").send({email : "second@example.com" , password : "SecondPass123"});
        const other = request.agent(app);
        const login = await other.post("/auth/login").send({email : "second@example.com" , password : "SecondPass123"});
        expect(login.status).toBe(200);

        const list = await other.get("/tasks");
        expect(list.status).toBe(200);
        expect(list.body.data.length).toBe(0);
        expect(list.body.pagination.total).toBe(0);

        expect((await other.get("/tasks/1")).status).toBe(404);
        expect((await other.patch("/tasks/1").send({completed : true})).status).toBe(404);
        expect((await other.delete("/tasks/1")).status).toBe(404);

        const stillThere = await agent.get("/tasks/1");
        expect(stillThere.status).toBe(200);
        expect(stillThere.body.title).toBe("buy milk");
        expect(stillThere.body.completed).toBe(false);
    });
});

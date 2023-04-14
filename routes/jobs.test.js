"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");

const {
    commonBeforeAll,
    commonBeforeEach,
    commonAfterEach,
    commonAfterAll,
    u1Token,
    adminToken,
    JOB_IDS
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /companies */

describe("POST /jobs", function () {
    const newJob = {
        title: "New",
        salary: 100,
        equity: .2,
        companyHandle: "c1"
    };

    test("ok for user admin", async function () {
        const resp = await request(app)
            .post("/jobs")
            .send(newJob)
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.statusCode).toEqual(201);
        expect(resp.body).toEqual({
            job: {
                id: expect.any(Number),
                ...newJob,
                equity: "0.2"
            }
        });
    });

    test("ok for no salary/equity", async function () {
        const resp = await request(app)
            .post("/jobs")
            .send({
                title: "New",
                companyHandle: "c1"
            })
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.statusCode).toEqual(201);
        expect(resp.body).toEqual({
            job: {
                id: expect.any(Number),
                ...newJob,
                salary: null,
                equity: null
            }
        });
    });


    test("unauth for user not admin", async function () {
        const resp = await request(app)
            .post("/jobs")
            .send(newJob)
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(401);
    });

    test("unauth for user not logged in", async function () {
        const resp = await request(app)
            .post("/jobs")
            .send(newJob);
        expect(resp.statusCode).toEqual(401);
    });

    test("bad request with missing data", async function () {
        const resp = await request(app)
            .post("/jobs")
            .send({
                salary: 200000,
            })
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.statusCode).toEqual(400);
    });

    test("bad request with invalid data", async function () {
        const resp = await request(app)
            .post("/companies")
            .send({
                companyHandle: "c1",
                title: "new",
                equity: "ten",
                salary: -100
            })
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.statusCode).toEqual(400);
    });

    test("not found, job not found", async function () {
        const resp = await request(app)
            .post("/jobs")
            .send({
                ...newJob,
                companyHandle: "nope"
            })
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.statusCode).toEqual(404);
    });
});

/************************************** GET /jobs */

describe("GET /jobs", function () {
    test("ok for anon", async function () {
        const resp = await request(app).get("/jobs");
        expect(resp.body).toEqual({
            jobs:
                [
                    {
                        id: expect.any(Number),
                        title: "j1",
                        salary: 50000,
                        equity: "0.005",
                        companyHandle: "c1"
                    },
                    {
                        id: expect.any(Number),
                        title: "j2",
                        salary: 100000,
                        equity: "0.01",
                        companyHandle: "c2"
                    },
                    {
                        id: expect.any(Number),
                        title: "j3",
                        salary: 150000,
                        equity: null,
                        companyHandle: "c3"
                    },
                ]
        });

    });
    test("works: with filters", async function () {
        const resp = await request(app).get("/jobs").query(
            {
                title: "2",
                minSalary: "100000",
                hasEquity: "true"
            });

        expect(resp.body).toEqual({
            jobs: [
                {
                    id: expect.any(Number),
                    title: "j2",
                    salary: 100000,
                    equity: "0.01",
                    companyHandle: "c2"
                }]
        });
    });

    test("fails: bad filter data", async function () {
        const resp = await request(app).get("/jobs").query(
            {
                minSalary: "hundred",
                hasEquity: "0.5"
            });

        expect(resp.statusCode).toEqual(400);
    });

    test("bad request: unexpected fields", async function () {
        const resp = await request(app).get("/jobs").query(
            {
                blargh: "haha"
            });

        expect(resp.statusCode).toEqual(400);
    });

    test("fails: test next() handler", async function () {
        // there's no normal failure event which will cause this route to fail ---
        // thus making it hard to test that the error-handler works with it. This
        // should cause an error, all right :)
        await db.query("DROP TABLE jobs CASCADE");
        const resp = await request(app)
            .get("/jobs")
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(500);
    });
});

/************************************** GET /companies/:handle */

// describe("GET /companies/:handle", function () {
//   test("works for anon", async function () {
//     const resp = await request(app).get(`/companies/c1`);
//     expect(resp.body).toEqual({
//       company: {
//         handle: "c1",
//         name: "C1",
//         description: "Desc1",
//         numEmployees: 1,
//         logoUrl: "http://c1.img",
//       },
//     });
//   });

//   test("works for anon: company w/o jobs", async function () {
//     const resp = await request(app).get(`/companies/c2`);
//     expect(resp.body).toEqual({
//       company: {
//         handle: "c2",
//         name: "C2",
//         description: "Desc2",
//         numEmployees: 2,
//         logoUrl: "http://c2.img",
//       },
//     });
//   });

//   test("not found for no such company", async function () {
//     const resp = await request(app).get(`/companies/nope`);
//     expect(resp.statusCode).toEqual(404);
//   });
// });

/************************************** PATCH /companies/:handle */

// describe("PATCH /companies/:handle", function () {
//   test("works for user admin", async function () {
//     const resp = await request(app)
//       .patch(`/companies/c1`)
//       .send({
//         name: "C1-new",
//       })
//       .set("authorization", `Bearer ${adminToken}`);
//     expect(resp.body).toEqual({
//       company: {
//         handle: "c1",
//         name: "C1-new",
//         description: "Desc1",
//         numEmployees: 1,
//         logoUrl: "http://c1.img",
//       },
//     });
//   });

//   test("unauth for anon", async function () {
//     const resp = await request(app)
//       .patch(`/companies/c1`)
//       .send({
//         name: "C1-new",
//       });
//     expect(resp.statusCode).toEqual(401);
//   });

//   test("unauth for user not admin", async function () {
//     const resp = await request(app)
//       .patch(`/companies/c1`)
//       .send({
//         name: "C1-new",
//       })
//       .set("authorization", `Bearer ${u1Token}`);;
//     expect(resp.statusCode).toEqual(401);
//   });

//   test("not found on no such company", async function () {
//     const resp = await request(app)
//       .patch(`/companies/nope`)
//       .send({
//         name: "new nope",
//       })
//       .set("authorization", `Bearer ${adminToken}`);
//     expect(resp.statusCode).toEqual(404);
//   });

//   test("bad request on handle change attempt", async function () {
//     const resp = await request(app)
//       .patch(`/companies/c1`)
//       .send({
//         handle: "c1-new",
//       })
//       .set("authorization", `Bearer ${adminToken}`);
//     expect(resp.statusCode).toEqual(400);
//   });

//   test("bad request on invalid data", async function () {
//     const resp = await request(app)
//       .patch(`/companies/c1`)
//       .send({
//         logoUrl: "not-a-url",
//       })
//       .set("authorization", `Bearer ${adminToken}`);
//     expect(resp.statusCode).toEqual(400);
//   });
// });

/************************************** DELETE /companies/:handle */

// describe("DELETE /companies/:handle", function () {
//   test("works for user admin", async function () {
//     const resp = await request(app)
//       .delete(`/companies/c1`)
//       .set("authorization", `Bearer ${adminToken}`);
//     expect(resp.body).toEqual({ deleted: "c1" });
//   });

//   test("unauth for anon", async function () {
//     const resp = await request(app)
//       .delete(`/companies/c1`);
//     expect(resp.statusCode).toEqual(401);
//   });

//   test("unauth for user not admin", async function () {
//     const resp = await request(app)
//       .delete(`/companies/c1`)
//       .set("authorization", `Bearer ${u1Token}`);
//     expect(resp.statusCode).toEqual(401);
//   });

//   test("not found for no such company", async function () {
//     const resp = await request(app)
//       .delete(`/companies/nope`)
//       .set("authorization", `Bearer ${adminToken}`);
//     expect(resp.statusCode).toEqual(404);
//   });
// });
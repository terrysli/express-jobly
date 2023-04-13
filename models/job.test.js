"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Job = require("./job.js");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  JOB_IDS
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

describe("create", function () {
  const newJob = {
    title: "New",
    salary: 50000,
    equity: 0.005,
    companyHandle: "c1"
  };

  test("works", async function () {
    let job = await Job.create(newJob);
    expect(job).toEqual({
      id: expect.any(Number),
      title: "New",
      salary: 50000,
      equity: "0.005",
      companyHandle: "c1"
    });

    const result = await db.query(
      `SELECT title, salary, equity, company_handle
           FROM jobs
           WHERE title = 'New'`);
    expect(result.rows).toEqual([
      {
        title: "New",
        salary: 50000,
        equity: "0.005",
        company_handle: "c1"
      },
    ]);
  });

  test("bad request if equity > 1", async function () {
    try {
      newJob.equity = 1.1;
      await Job.create(newJob);
      throw new Error("fail test, you shouldn't get here");
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });

  test("bad request if salary < 0", async function () {
    try {
      newJob.salary = -10000;
      await Job.create(newJob);
      throw new Error("fail test, you shouldn't get here");
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });

  test("not found if company_handle not in db", async function () {
    try {
      newJob.companyHandle = "none";
      await Job.create(newJob);
      throw new Error("fail test, you shouldn't get here");
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  })
});

/************************************** find with filters */

describe("find", function () {

  test("works: no filters", async function () {
    const jobs = await Job.find({});
    expect(jobs).toEqual([
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
        equity: "0.010",
        companyHandle: "c2"
      },
      {
        id: expect.any(Number),
        title: "j3",
        salary: 150000,
        equity: null,
        companyHandle: "c3"
      }
    ]);
  });

  test("works: hasEquity = true", async function () {
    const jobs = await Job.find({ hasEquity: true });
    expect(jobs).toEqual([
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
        equity: "0.010",
        companyHandle: "c2"
      }
    ]);
  });

  test("works: hasEquity = false", async function () {
    const jobs = await Job.find({ hasEquity: false });
    expect(jobs).toEqual([
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
        equity: "0.010",
        companyHandle: "c2"
      },
      {
        id: expect.any(Number),
        title: "j3",
        salary: 150000,
        equity: null,
        companyHandle: "c3"
      }
    ]);
  });

  test("works: title", async function () {
    const jobs = await Job.find({ title: "2" });
    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: "j2",
        salary: 100000,
        equity: "0.010",
        companyHandle: "c2"
      }
    ]);
  });

});

/************************************** get */

describe("get", function () {
  // test("works", async function () {
  //   const newJob = {
  //     title: "New",
  //     salary: 50000,
  //     equity: 0.005,
  //     companyHandle: "c1"
  //   };
  //   const job = await Job.create(newJob);
  //   const jobId = job.id;
  //   let jobToGet = await Job.get(jobId);
  //   expect(jobToGet).toEqual(job);
  // });

  test("works", async function () {

    let job = await Job.get(JOB_IDS[0]);
    expect(job).toEqual({
      id: expect.any(Number),
      title: "j1",
      salary: 50000,
      equity: "0.005",
      companyHandle: "c1"
    });
  });

  test("not found if no such job", async function () {
    try {
      await Job.get(-1);
      throw new Error("fail test, you shouldn't get here");
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

/************************************** update */

// describe("update", function () {
//   const updateData = {
//     name: "New",
//     description: "New Description",
//     numEmployees: 10,
//     logoUrl: "http://new.img",
//   };

//   test("works", async function () {
//     let company = await Job.update("c1", updateData);
//     expect(company).toEqual({
//       handle: "c1",
//       ...updateData,
//     });

//     const result = await db.query(
//       `SELECT handle, name, description, num_employees, logo_url
//            FROM companies
//            WHERE handle = 'c1'`);
//     expect(result.rows).toEqual([{
//       handle: "c1",
//       name: "New",
//       description: "New Description",
//       num_employees: 10,
//       logo_url: "http://new.img",
//     }]);
//   });

//   test("works: null fields", async function () {
//     const updateDataSetNulls = {
//       name: "New",
//       description: "New Description",
//       numEmployees: null,
//       logoUrl: null,
//     };

//     let company = await Job.update("c1", updateDataSetNulls);
//     expect(company).toEqual({
//       handle: "c1",
//       ...updateDataSetNulls,
//     });

//     const result = await db.query(
//       `SELECT handle, name, description, num_employees, logo_url
//            FROM companies
//            WHERE handle = 'c1'`);
//     expect(result.rows).toEqual([{
//       handle: "c1",
//       name: "New",
//       description: "New Description",
//       num_employees: null,
//       logo_url: null,
//     }]);
//   });

//   test("not found if no such company", async function () {
//     try {
//       await Job.update("nope", updateData);
//       throw new Error("fail test, you shouldn't get here");
//     } catch (err) {
//       expect(err instanceof NotFoundError).toBeTruthy();
//     }
//   });

//   test("bad request with no data", async function () {
//     try {
//       await Job.update("c1", {});
//       throw new Error("fail test, you shouldn't get here");
//     } catch (err) {
//       expect(err instanceof BadRequestError).toBeTruthy();
//     }
//   });
// });

/************************************** remove */

// describe("remove", function () {
//   test("works", async function () {
//     await Job.remove("c1");
//     const res = await db.query(
//       "SELECT handle FROM companies WHERE handle='c1'");
//     expect(res.rows.length).toEqual(0);
//   });

//   test("not found if no such company", async function () {
//     try {
//       await Job.remove("nope");
//       throw new Error("fail test, you shouldn't get here");
//     } catch (err) {
//       expect(err instanceof NotFoundError).toBeTruthy();
//     }
//   });
// });

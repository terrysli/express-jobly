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
    equity: "0.005",
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

  test("works, no salary or equity", async function () {
    let job = await Job.create({
      title: "New",
      companyHandle: "c1"
    });
    expect(job).toEqual({
      id: expect.any(Number),
      title: "New",
      salary: null, 
      equity: null,
      companyHandle: "c1"
    });

    const result = await db.query(
      `SELECT title, salary, equity, company_handle
           FROM jobs
           WHERE title = 'New'`);
    expect(result.rows).toEqual([
      {
        title: "New",
        salary: null,
        equity: null,
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
  });
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

describe("update", function () {
  const updateData = {
    title: "New",
    salary: 60000,
    equity: 0.021,
  };

  test("works", async function () {
    let job = await Job.update(JOB_IDS[0], updateData);
    expect(job).toEqual({
      id: JOB_IDS[0],
      title: "New",
      salary: 60000,
      equity: "0.021",
      companyHandle: 'c1'
    });

    const result = await db.query(
      `SELECT id, title, salary, equity, company_handle
           FROM jobs
           WHERE id = ${JOB_IDS[0]}`);
    expect(result.rows).toEqual([{
      id: JOB_IDS[0],
      title: "New",
      salary: 60000,
      equity: "0.021",
      company_handle: 'c1'
    }]);
  });

  test("works: null fields", async function () {
    const updateDataSetNulls = {
      title: "New",
      salary: null
    };

    let job = await Job.update(JOB_IDS[0], updateDataSetNulls);
    expect(job).toEqual({
      id: JOB_IDS[0],
      title: "New",
      salary: null,
      equity: "0.005",
      companyHandle: 'c1'
    });

    const result = await db.query(
      `SELECT id, title, salary, equity, company_handle
           FROM jobs
           WHERE id = ${JOB_IDS[0]}`);
    expect(result.rows).toEqual([{
      id: JOB_IDS[0],
      title: "New",
      salary: null,
      equity: "0.005",
      company_handle: 'c1'
    }]);
  });

  test("not found if no such company", async function () {
    try {
      await Job.update(-1, updateData);
      throw new Error("fail test, you shouldn't get here");
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("bad request with no data", async function () {
    try {
      await Job.update(JOB_IDS[0], {});
      throw new Error("fail test, you shouldn't get here");
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** remove */

describe("remove", function () {
  test("works", async function () {
    await Job.remove(JOB_IDS[0]);
    const res = await db.query(
      `SELECT id FROM jobs WHERE id=${JOB_IDS[0]}`);
    expect(res.rows.length).toEqual(0);
  });

  test("not found if no such job", async function () {
    try {
      await Job.remove(-1);
      throw new Error("fail test, you shouldn't get here");
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

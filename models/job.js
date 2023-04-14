"use strict";

const db = require("../db");
const Company = require("./company");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate, sqlForFiltering } = require("../helpers/sql");

const JS_TO_SQL = {
  companyHandle: "company_handle",
};

class Job {
  /** Create a jobs (from data), update db, return new job data.
   *
   * data should be { title, salary, equity, companyHandle }
   *
   * Returns { id, title, salary, equity, companyHandle }
   * */

  static async create({ title, salary, equity, companyHandle }) {

    try {
      await Company.get(companyHandle);
    }
    catch (err) {
      throw new NotFoundError(`No company: ${companyHandle}`);
    }

    if (salary < 0) { throw new BadRequestError("Salary must be non-negative"); };
    if (equity < 0 || equity > 1) {
      throw new BadRequestError("Equity must be between 0 and 1, inclusive");
    }

    const result = await db.query(
      `INSERT INTO jobs (
        title,
        salary,
        equity,
        company_handle)
         VALUES
           ($1, $2, $3, $4)
         RETURNING id,
         title,
         salary,
         equity,
         company_handle AS "companyHandle"`,
      [
        title,
        salary,
        equity,
        companyHandle,
      ],
    );

    const job = result.rows[0];

    return job;
  }


  /** Find all jobs that meet filter criteria (if any):
   *  title: filter by job title, selecting jobs that include
   *    this string, case insensitive.
   *  minSalary: jobs with at least this salary.
   *  hasEquity: if true, filter to jobs with a non-zero amount of equity;
   *    if false or not included, ignore equity.
   *
   * All criteria are optional. If some are provided, only
   * filters by those criteria
   *
   * Data can include: {title, minSalary, hasEquity}
   * Returns [{ id, title, salary, equity, company_handle }, ...]
   */

  static async find(filters) {

    const dataToFilterBy = [];
    if ("title" in filters) {
      dataToFilterBy.push(
        { filter: "title", method: "ILIKE", value: filters.title });
    }
    if ("minSalary" in filters) {
      dataToFilterBy.push(
        { filter: "salary", method: ">=", value: filters.minSalary });
    }
    if ("hasEquity" in filters) {
      if (filters.hasEquity) {
        dataToFilterBy.push(
          { filter: "equity", method: ">", value: 0 });
      }
    }

    let { conditions, values } = sqlForFiltering(dataToFilterBy);
    conditions = (conditions ? `WHERE ${conditions}` : "");

    const jobsRes = await db.query(
      `SELECT id,
              title,
              salary,
              equity,
              company_handle AS "companyHandle"
        FROM jobs
        ${conditions}
        ORDER BY id`, values);
    return jobsRes.rows;
  }


  /** Given a job id, return data about job.
   *
   * Returns { id, title, salary, equity, company_handle }
   *
   * Throws NotFoundError if not found.
   **/

  static async get(id) {
    const jobRes = await db.query(
      `SELECT id,
              title,
              salary,
              equity,
              company_handle AS "companyHandle"
        FROM jobs
        WHERE id = $1`, [id]);

    const job = jobRes.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);

    return job;
  }

  /** Update job data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {title, salary, equity}
   *
   * Returns {id, title, salary, equity, company_handle}
   *
   * Throws NotFoundError if not found.
   */

  static async update(id, data) {
    const { setCols, values } = sqlForPartialUpdate(
      data,
      JS_TO_SQL);
    const idVarIdx = "$" + (values.length + 1);

    const querySql = `
      UPDATE jobs
      SET ${setCols}
        WHERE id = ${idVarIdx}
        RETURNING id, title, salary, equity, company_handle AS "companyHandle"`;
    const result = await db.query(querySql, [...values, id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);

    return job;
  }

  /** Delete given job from database; returns undefined.
   *
   * Throws NotFoundError if job not found.
   **/

  static async remove(handle) {
    //   const result = await db.query(
    //     `DELETE
    //          FROM companies
    //          WHERE handle = $1
    //          RETURNING handle`,
    //     [handle]);
    //   const company = result.rows[0];

    //   if (!company) throw new NotFoundError(`No company: ${handle}`);
  }
}


module.exports = Job;
"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");

class Job {
  /** Create a jobs (from data), update db, return new job data.
   *
   * data should be { title, salary, equity, company_handle }
   *
   * Returns { id, title, salary, equity, company_handle }
   * */

  static async create({ title, salary, equity, company_handle }) {
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

    if ("minEmployees" in filters
      && "maxEmployees" in filters
      && filters.maxEmployees < filters.minEmployees) {
        throw new BadRequestError("minEmployees cannot be greater than maxEmployees.");
      }

    const dataToFilterBy = [];
    if ("minEmployees" in filters) {
      dataToFilterBy.push(
        {filter: "num_employees", method: ">=", value: filters.minEmployees});
      }
    if ("maxEmployees" in filters) {
      dataToFilterBy.push(
        {filter: "num_employees", method: "<=", value: filters.maxEmployees});
    }
    if ("nameLike" in filters) {
      dataToFilterBy.push(
        {filter: "name", method: "ILIKE", value: filters.nameLike});
    }

    let { conditions, values } = sqlForFiltering(dataToFilterBy);
    conditions = (conditions ? `WHERE ${conditions}` : "");

    const companiesRes = await db.query(
      `SELECT handle,
              name,
              description,
              num_employees AS "numEmployees",
              logo_url AS "logoUrl"
        FROM companies
        ${conditions}
        ORDER BY NAME`, values);
    return companiesRes.rows;
  }


  /** Given a job id, return data about job.
   *
   * Returns { id, title, salary, equity, company_handle }
   *
   * Throws NotFoundError if not found.
   **/

  static async get(handle) {
    const companyRes = await db.query(
        `SELECT handle,
                name,
                description,
                num_employees AS "numEmployees",
                logo_url AS "logoUrl"
           FROM companies
           WHERE handle = $1`,
        [handle]);

    const company = companyRes.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    return company;
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

  static async update(handle, data) {
    const { setCols, values } = sqlForPartialUpdate(
        data,
        JS_TO_SQL);
    const handleVarIdx = "$" + (values.length + 1);

    const querySql = `
      UPDATE companies
      SET ${setCols}
        WHERE handle = ${handleVarIdx}
        RETURNING handle, name, description, num_employees AS "numEmployees", logo_url AS "logoUrl"`;
    const result = await db.query(querySql, [...values, handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    return company;
  }

  /** Delete given job from database; returns undefined.
   *
   * Throws NotFoundError if job not found.
   **/

  static async remove(handle) {
    const result = await db.query(
        `DELETE
           FROM companies
           WHERE handle = $1
           RETURNING handle`,
        [handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);
  }
}


module.exports = Company;
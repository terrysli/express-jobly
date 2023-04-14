"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate, sqlForFiltering } = require("../helpers/sql");

const JS_TO_SQL = {
  numEmployees: "num_employees",
  logoUrl: "logo_url"
};

/** Related functions for companies. */

class Company {
  /** Create a company (from data), update db, return new company data.
   *
   * data should be { handle, name, description, numEmployees, logoUrl }
   *
   * Returns { handle, name, description, numEmployees, logoUrl }
   *
   * Throws BadRequestError if company already in database.
   * */

  static async create({ handle, name, description, numEmployees, logoUrl }) {
    const duplicateCheck = await db.query(
      `SELECT handle
           FROM companies
           WHERE handle = $1`,
      [handle]);

    if (duplicateCheck.rows[0])
      throw new BadRequestError(`Duplicate company: ${handle}`);

    const result = await db.query(
      `INSERT INTO companies(
          handle,
          name,
          description,
          num_employees,
          logo_url)
           VALUES
             ($1, $2, $3, $4, $5)
           RETURNING handle, name, description, num_employees AS "numEmployees", logo_url AS "logoUrl"`,
      [
        handle,
        name,
        description,
        numEmployees,
        logoUrl,
      ],
    );
    const company = result.rows[0];

    return company;
  }


  /** Find all companies that meet filter criteria (if any):
   *  nameLike: filter by company name, selecting companies that include
   *    this string, case insensitive.
   *  minEmployees: companies with at least this many employees.
   *  maxEmployees: companies with no more than this many employees.
   *
   * All criteria are optional. If some are provided, only
   * filters by those criteria
   *
   * Data can include: {nameLike, minEmployees, maxEmployees}
   * Returns [{ handle, name, description, numEmployees, logoUrl }, ...]
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
        { filter: "num_employees", method: ">=", value: filters.minEmployees });
    }
    if ("maxEmployees" in filters) {
      dataToFilterBy.push(
        { filter: "num_employees", method: "<=", value: filters.maxEmployees });
    }
    if ("nameLike" in filters) {
      dataToFilterBy.push(
        { filter: "name", method: "ILIKE", value: filters.nameLike });
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


  /** Given a company handle, return data about company.
   *
   * Returns { handle, name, description, numEmployees, logoUrl, jobs }
   *   where jobs is [{ id, title, salary, equity, companyHandle }, ...]
   *
   * Throws NotFoundError if not found.
   **/

  static async get(handle) {
    const companyRes = await db.query(
      `SELECT c.handle,
                c.name,
                c.description,
                c.num_employees AS "numEmployees",
                j.id,
                j.title,
                j.salary,
                j.equity,
                c.logo_url AS "logoUrl"
           FROM companies AS c
           LEFT OUTER JOIN jobs AS j ON c.handle = j.company_handle
           WHERE handle = $1
           ORDER BY salary DESC`,
      [handle]);
    if (!companyRes.rows[0]) throw new NotFoundError(`No company: ${handle}`);

    const jobs = [];

    for (const { id, title, salary, equity} of companyRes.rows) {
      /**since we are left joining, we always get back at least one row, but
       * if that company has no jobs, the job-related fields are null. 
       * In this case, don't add a job to this array of jobs.
      */
      if (id !== null) {
        jobs.push({ id, title, salary, equity });
      }
    }

    const { name, description, numEmployees, logoUrl } = companyRes.rows[0];
    const company = { handle, name, description, numEmployees, logoUrl, jobs };

    return company;
  }

  /** Update company data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {name, description, numEmployees, logoUrl}
   *
   * Returns {handle, name, description, numEmployees, logoUrl}
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

  /** Delete given company from database; returns undefined.
   *
   * Throws NotFoundError if company not found.
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

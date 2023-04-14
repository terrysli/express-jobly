"use strict";

/** Routes for companies. */

const jsonschema = require("jsonschema");
const express = require("express");

const { BadRequestError } = require("../expressError");
const { ensureLoggedIn, ensureAdmin } = require("../middleware/auth");
const Job = require("../models/job");

const jobNewSchema = require("../schemas/jobNew.json");
const jobGetSchema = require("../schemas/jobGet.json");
// const companyUpdateSchema = require("../schemas/companyUpdate.json");

const router = new express.Router();


/** POST / { job } =>  { job }
 *
 * job should be { title, salary, equity, companyHandle }
 * salary and equity are optional
 *
 * Returns {job: { id, title, salary, equity, companyHandle }}
 *
 * Authorization required: login and admin.
 */

router.post(
  "/",
  ensureAdmin,
  async function (req, res, next) {
    const validator = jsonschema.validate(
      req.body,
      jobNewSchema,
      { required: true }
    );
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const job = await Job.create(req.body);
    return res.status(201).json({ job });
  });

/** GET /  =>
 *   { jobs: [ { id, title, salary, equity, companyHandle }, ...] }
 *
 * Can filter on provided search filters:
 * - title (will find case-insensitive, partial matches)
 * - minSalary
 * - hasEquity: if true, filter to jobs with non-zero equity, if false or
 *    missing, ignore equity in filtering
 *
 * Filters provided by query string.
 *
 * Authorization required: none
 */

router.get("/", async function (req, res, next) {

  //Query string can only give us back strings. We make these numbers/bool so
  // we can validate properly with our schema.
  const q = { ...req.query };

  if ("minSalary" in q) {
    q.minSalary = Number(q.minSalary);
  }

  if ("hasEquity" in q) {
    if (q.hasEquity === "true") { q.hasEquity = true; }
    else if (q.hasEquity === "false") { q.hasEquity = false; }
  }

  console.log("@@@ q before validators:", q, "typeOf minSalary", typeof q.minSalary, "typeof hasEquity", typeof q.hasEquity);

  const validator = jsonschema.validate(
    q,
    jobGetSchema,
    { required: true }
  );
  if (!validator.valid) {
    const errs = validator.errors.map(e => e.stack);
    throw new BadRequestError(errs);
  }
  console.log("@@@ get filters:", q);
  const jobs = await Job.find(q);
  return res.json({ jobs });

});

/** GET /[id]  =>  { job }
 *
 *  Job is { id, title, salary, equity }
 *
 * Authorization required: none
 */

router.get("/:id", async function (req, res, next) {
  const job = await Job.get(req.params.id);
  return res.json({ job });
});

/** PATCH /[handle] { fld1, fld2, ... } => { company }
 *
 * Patches company data.
 *
 * fields can be: { name, description, numEmployees, logo_url }
 *
 * Returns { handle, name, description, numEmployees, logo_url }
 *
 * Authorization required: login and admin
 */

router.patch(
  "/:handle",
  ensureAdmin,
  async function (req, res, next) {
    // const validator = jsonschema.validate(
    //   req.body,
    //   companyUpdateSchema,
    //   { required: true }
    // );
    // if (!validator.valid) {
    //   const errs = validator.errors.map(e => e.stack);
    //   throw new BadRequestError(errs);
    // }

    // const company = await Company.update(req.params.handle, req.body);
    // return res.json({ company });
  });

/** DELETE /[handle]  =>  { deleted: handle }
 *
 * Authorization: login and admin
 */

router.delete(
  "/:handle",
  ensureAdmin,
  async function (req, res, next) {
    // await Company.remove(req.params.handle);
    // return res.json({ deleted: req.params.handle });
  });


module.exports = router;
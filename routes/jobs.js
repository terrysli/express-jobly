"use strict";

/** Routes for companies. */

const jsonschema = require("jsonschema");
const express = require("express");

const { BadRequestError } = require("../expressError");
const { ensureLoggedIn, ensureAdmin } = require("../middleware/auth");
const Job = require("../models/job");

const jobNewSchema = require("../schemas/jobNew.json");
const jobGetSchema = require("../schemas/jobGet.json");
const jobUpdateSchema = require("../schemas/jobUpdate.json");

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

/** PATCH /[id] { fld1, fld2, ... } => { job }
 *
 * Patches job data.
 *
 * fields can be: { title, salary, equity }
 *
 * Returns { id, title, salary, equity, companyHandle }
 *
 * Authorization required: login and admin
 */

router.patch(
  "/:id",
  ensureAdmin,
  async function (req, res, next) {
    const validator = jsonschema.validate(
      req.body,
      jobUpdateSchema,
      { required: true }
    );
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const job = await Job.update(req.params.id, req.body);
    return res.json({ job });
  });

/** DELETE /[id]  =>  { deleted: id }
 *
 * Authorization: login and admin
 */

router.delete(
  "/:id",
  ensureAdmin,
  async function (req, res, next) {
    const id = Number(req.params.id)
    if (isNaN(id)) {
        throw new BadRequestError("id must be a number");
    }
    await Job.remove(id);
    return res.json({ deleted: id });
  });


module.exports = router;
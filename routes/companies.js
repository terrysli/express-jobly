"use strict";

/** Routes for companies. */

const jsonschema = require("jsonschema");
const express = require("express");

const { BadRequestError } = require("../expressError");
const { ensureLoggedIn, ensureAdmin } = require("../middleware/auth");
const Company = require("../models/company");

const companyNewSchema = require("../schemas/companyNew.json");
const companyGetSchema = require("../schemas/companyGet.json");
const companyUpdateSchema = require("../schemas/companyUpdate.json");

const router = new express.Router();


/** POST / { company } =>  { company }
 *
 * company should be { handle, name, description, numEmployees, logoUrl }
 *
 * Returns {company: { handle, name, description, numEmployees, logoUrl }}
 *
 * Authorization required: login and admin.
 */

router.post(
  "/",
  ensureAdmin,
  async function (req, res, next) {
    const validator = jsonschema.validate(
      req.body,
      companyNewSchema,
      { required: true }
    );
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const company = await Company.create(req.body);
    return res.status(201).json({ company });
  });

/** GET /  =>
 *   { companies: [ { handle, name, description, numEmployees, logoUrl }, ...] }
 *
 * Can filter on provided search filters:
 * - minEmployees
 * - maxEmployees
 * - nameLike (will find case-insensitive, partial matches)
 *
 * Filters provided by query string.
 *
 * Authorization required: none
 */

router.get("/", async function (req, res, next) {

  //Query string can only give us back strings. We make these numbers so
  // we can validate properly with our schema.
  const q = { ...req.query };

  if ("minEmployees" in q) {
    q.minEmployees = Number(q.minEmployees);
  }

  if ("maxEmployees" in q) {
    q.maxEmployees = Number(q.maxEmployees);
  }

  const validator = jsonschema.validate(
    q,
    companyGetSchema,
    { required: true }
  );
  if (!validator.valid) {
    const errs = validator.errors.map(e => e.stack);
    throw new BadRequestError(errs);
  }
  // if (q.minEmployees > q.maxEmployees) {
  //   throw new BadRequestError(
  //     "minEmployees cannot be greater than maxEmployees.");
  // }

  const companies = await Company.find(q);
  return res.json({ companies });

});

/** GET /[handle]  =>  { company }
 *
 *  Company is { handle, name, description, numEmployees, logoUrl, jobs }
 *   where jobs is [{ id, title, salary, equity }, ...]
 *
 * Authorization required: none
 */

router.get("/:handle", async function (req, res, next) {
  const company = await Company.get(req.params.handle);
  return res.json({ company });
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
    const validator = jsonschema.validate(
      req.body,
      companyUpdateSchema,
      { required: true }
    );
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const company = await Company.update(req.params.handle, req.body);
    return res.json({ company });
  });

/** DELETE /[handle]  =>  { deleted: handle }
 *
 * Authorization: login and admin
 */

router.delete(
  "/:handle",
  ensureAdmin,
  async function (req, res, next) {
    await Company.remove(req.params.handle);
    return res.json({ deleted: req.params.handle });
  });


module.exports = router;

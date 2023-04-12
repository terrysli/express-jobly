const { BadRequestError } = require("../expressError");
const User = require("../models/user");
const { sqlForPartialUpdate } = require("./sql");

const USER_JS_TO_SQL = {
  firstName: 'first_name',
  lastName: 'last_name',
  isAdmin: 'is_admin'
};

describe("generate sql", function () {
  test("works: valid data", function () {
    const dataToUpdate = {
      firstName: 'Aliya',
      age: 32
    }
    const sql = sqlForPartialUpdate(dataToUpdate, USER_JS_TO_SQL);
    expect(sql).toEqual({
      setCols: '"first_name"=$1, "age"=$2',
      values: ['Aliya', 32]
    });
  });

  test("fails: no data", function () {
    try {
      const sql = sqlForPartialUpdate({}, USER_JS_TO_SQL);
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

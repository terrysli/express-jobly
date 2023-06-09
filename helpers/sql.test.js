const { BadRequestError } = require("../expressError");
const User = require("../models/user");
const { sqlForPartialUpdate, sqlForFiltering } = require("./sql");

const USER_JS_TO_SQL = {
  firstName: 'first_name',
  lastName: 'last_name',
  isAdmin: 'is_admin'
};

describe("generate sql for partial update", function () {
  test("works: valid data", function () {
    const dataToUpdate = {
      firstName: 'Aliya',
      age: 32
    };
    const sql = sqlForPartialUpdate(dataToUpdate, USER_JS_TO_SQL);
    expect(sql).toEqual({
      setCols: '"first_name"=$1, "age"=$2',
      values: ['Aliya', 32]
    });
  });

  test("fails: no data", function () {
    try {
      const sql = sqlForPartialUpdate({}, USER_JS_TO_SQL);
      throw new Error("fail test, you shouldn't get here");
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});


describe("generate SQL for filtering", function () {
  test("works: min/max employees and name", function () {
    const dataToFilterBy = [
      { filter: "num_employees", method: ">=", value: 1 },
      { filter: "num_employees", method: "<=", value: 10 },
      { filter: "name", method: "ILIKE", value: 'Sons' }
    ];
    const sql = sqlForFiltering(dataToFilterBy);
    expect(sql).toEqual({
      conditions: "num_employees >= $1 AND num_employees <= $2 AND name ILIKE $3",
      values: [1, 10, "%Sons%"]
    });
  });

  test("works: no filters", function () {
    const sql = sqlForFiltering([]);
    expect(sql).toEqual({
      conditions: "",
      values: []
    });
  });

  test("works: 1 filter", function () {
    const sql = sqlForFiltering(
      [{ filter: "num_employees", method: ">=", value: 1 }]);
    expect(sql).toEqual({
      conditions: "num_employees >= $1",
      values: [1]
    });
  });
});

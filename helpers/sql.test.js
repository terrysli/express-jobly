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
      setCols: '"first_name=$1, age=$2"',
      values: ['Aliya', 32]
    });
  });

  // test("something", function () {
  //   const token = createToken({ username: "test", isAdmin: true });
  //   const payload = jwt.verify(token, SECRET_KEY);
  //   expect(payload).toEqual({
  //     iat: expect.any(Number),
  //     username: "test",
  //     isAdmin: true,
  //   });
  // });

  // test("fails: no body", function () {
  //   // given the security risk if this didn't work, checking this specifically
  //   const token = createToken({ username: "test" });
  //   const payload = jwt.verify(token, SECRET_KEY);
  //   expect(payload).toEqual({
  //     iat: expect.any(Number),
  //     username: "test",
  //     isAdmin: false,
  //   });
  // });
});

const { BadRequestError } = require("../expressError");

/**
 * Take object with data to update and generate parameterized SQL
 * statements to set columns equal to given data values
 * {firstName: 'Aliya', age: 32},
 * {firstName: 'first_name', lastName:} =>
 *  {
    *  selCols: "first_name=$1, age=$2",
    *  values: ['Aliya', 32]
    }
 */

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) =>
      `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

module.exports = { sqlForPartialUpdate };

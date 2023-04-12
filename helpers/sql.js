const { BadRequestError } = require("../expressError");

/**
 * Take object with data to update and JS to SQL conversion object and generate
 * parameterized SQL statements to set columns equal to given data values
 * {firstName: 'Aliya', age: 32},
 * {firstName: 'first_name', lastName: 'last_name', isAdmin: 'is_admin'} =>
 *  {
    *  setCols: '"first_name"=$1, "age"=$2',
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


/**
 * Take object with filters and generate SQL statements to be inserted into
 * WHERE operator for db query
 * {minEmployees: 1, maxEmployees: 10, nameLike: "Sons"} =>
 * {
 *    setCols: '"WHERE numEmployees" >= $1, "numEmployees" <= $2, ILIKE($3)',
 *    values: [1, 10, '%Sons%']
 * }
 */
function sqlForFiltering(dataToFilterBy, jsToSql) {
  const keys = Object.keys(filters);

}

module.exports = { sqlForPartialUpdate };

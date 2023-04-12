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
 * dataToFilterBy: [{filter: "num_employees", method: ">=", value: 1},
 *    {filter: "num_employees", method: "<=", value: 10},
 *    {filter: "name", method: "ILIKE", value: 'Sons'}] =>
 * {
 *    conditions: 'num_employees >= $1 AND num_employees <= $2 AND name ILIKE $3',
 *    values: [1, 10, '%Sons%']
 * }
 */
function sqlForFiltering(dataToFilterBy) {
  let conditions = "";
  const values = [];
  let counter = 1;

  for (let datum of dataToFilterBy) {
    if (counter > 1) {
      conditions += ` AND `;
    }
    conditions += `${datum.filter} ${datum.method} $${counter}`
    if (datum.method==="ILIKE") {
      values.push(`%${datum.value}%`)
    }
    else {
      values.push(datum.value);
    }
    counter++;
  }
  return { conditions, values };
}

module.exports = { sqlForPartialUpdate, sqlForFiltering };

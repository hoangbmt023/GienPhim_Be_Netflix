const { uuidv7 } = require("uuidv7");

/**
 * Generate a UUID v7 string.
 * v7 is time-ordered (monotonically increasing) which reduces B-Tree
 * fragmentation on MySQL InnoDB and PostgreSQL compared to random v4.
 */
const generateId = () => uuidv7();

module.exports = { generateId };

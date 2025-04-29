/**
 * ConsoleIQ - Enhanced console logging with remote capabilities
 * @module consoleIQ
 */

const ConsoleIQ = require('./src/ConsoleIQ');

/**
 * Create and initialize a new ConsoleIQ instance
 * @param {Object} config - Configuration options
 * @returns {ConsoleIQ} - Initialized ConsoleIQ instance
 */
function createConsoleIQ(config = {}) {
  return new ConsoleIQ(config).init();
}

module.exports = {
  ConsoleIQ,
  createConsoleIQ
};
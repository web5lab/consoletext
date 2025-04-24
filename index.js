/**
 * ConsoleText - Enhanced console logging with remote capabilities
 * @module consoleText
 */

const ConsoleText = require('./src/ConsoleText');

/**
 * Create and initialize a new ConsoleText instance
 * @param {Object} config - Configuration options
 * @returns {ConsoleText} - Initialized ConsoleText instance
 */
function createConsoleText(config = {}) {
  return new ConsoleText(config).init();
}

module.exports = {
  ConsoleText,
  createConsoleText
};
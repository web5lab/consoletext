/**
 * Utilities for colorizing console output
 * @module colorizer
 */

const chalk = require('chalk');

/**
 * Color mapping for different log levels
 */
const colorMap = {
  log: text => text,
  info: chalk.blue,
  warn: chalk.yellow,
  error: chalk.red,
  debug: chalk.green,
  text: chalk.cyan
};

/**
 * Apply appropriate color to console output based on log level
 * @param {string} level - Log level
 * @param {Array} args - Arguments to colorize
 * @returns {Array} - Colorized arguments
 */
function applyColor(level, args) {
  const colorFn = colorMap[level] || (text => text);
  
  return args.map(arg => {
    if (typeof arg === 'string') {
      return colorFn(arg);
    }
    return arg;
  });
}

module.exports = {
  applyColor,
  colorMap
};
/**
 * ConsoleText - Enhanced console logging with remote capabilities
 * @module ConsoleText
 */

const axios = require('axios');
const { applyColor } = require('./utils/colorizer');

/**
 * ConsoleText class for enhancing and extending console functionality
 */
class ConsoleText {
  /**
   * Create a new ConsoleText instance
   * @param {Object} config - Configuration options
   * @param {string} [config.endpoint] - URL endpoint for remote logging
   * @param {string} [config.apiKey] - API key for authentication with remote endpoint
   * @param {boolean} [config.colorize=true] - Whether to colorize console output
   * @param {boolean} [config.silent=false] - Whether to suppress console output
   * @param {string} [config.name] - Name for logger instance
   * @param {Array} [config.allowedLevels] - Array of allowed levels for remote logging
   */
  constructor(config = {}) {
    this.config = {
      endpoint: config.endpoint || "https://api.consoletext.xyz/logs",
      apiKey: config.apiKey || null,
      colorize: config.colorize !== false,
      silent: config.silent || false,
      name: config.name || 'ConsoleText',
      allowedLevels: config.allowedLevels || ['text']
    };

    // Store original console methods
    this.originalConsole = {
      log: console.log,
      info: console.info,
      warn: console.warn,
      error: console.error,
      debug: console.debug,
      dir: console.dir,
      table: console.table,
      time: console.time,
      timeEnd: console.timeEnd,
      trace: console.trace,
      text: console.log // Add text method mapping to log
    };
  }

  /**
   * Initialize by overriding console methods
   * @returns {ConsoleText} - The current instance for chaining
   */
  init() {
    // Override standard console methods
    const standardMethods = ['log', 'info', 'warn', 'error', 'debug'];
    standardMethods.forEach(method => {
      console[method] = (...args) => this._handleLog(method, args);
    });

    // Add support for other console methods without server logging
    const otherMethods = ['dir', 'table', 'time', 'timeEnd', 'trace'];
    otherMethods.forEach(method => {
      console[method] = (...args) => {
        if (!this.config.silent) {
          this.originalConsole[method](...args);
        }
      };
    });

    // Add custom text method (send to server if configured)
    console.text = (...args) => {
      if (
        this.config.endpoint &&
        this.config.allowedLevels.includes('text')
      ) {
        this._sendToServer('text', args);
      }
      if (!this.config.silent) {
        this._applyColorAndLog('text', ...args);
      }
    };

    return this;
  }

  /**
   * Handle log output (send to server if configured & allowed)
   * @private
   * @param {string} level - Log level
   * @param {Array} args - Arguments to log
   */
  _handleLog(level, args) {
    // Send to server if endpoint & allowed
    if (
      this.config.endpoint &&
      this.config.allowedLevels.includes(level)
    ) {
      this._sendToServer(level, args);
    }
    // Output to console only
    if (!this.config.silent) {
      this._applyColorAndLog(level, ...args);
    }
  }

  /**
   * Apply colors to console output
   * @private
   * @param {string} level - Log level
   * @param {...any} args - Arguments to log
   */
  _applyColorAndLog(level, ...args) {
    if (!this.config.colorize) {
      this.originalConsole[level === 'text' ? 'log' : level](...args);
      return;
    }
    const colorized = applyColor(level, args);
    this.originalConsole[level === 'text' ? 'log' : level](...colorized);
  }

  /**
   * Send logs to server (only if configured & allowed)
   * @private
   * @param {string} level - Log level
   * @param {Array} args - Arguments to log
   * @returns {Promise<void>}
   */
  async _sendToServer(level, args) {
    if (!this.config.endpoint) return;

    const logData = {
      level,
      message: args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : arg).join(' '),
      timestamp: new Date().toISOString(),
      name: this.config.name
    };

    try {
      const headers = {
        'Content-Type': 'application/json'
      };

      if (this.config.apiKey) {
        headers['Authorization'] = `Bearer ${this.config.apiKey}`;
      }

      await axios.post(this.config.endpoint, logData, { headers });
    } catch (error) {
      // Silently fail or log error to original console
      this.originalConsole.error(`ConsoleText: Failed to send log: ${error.message}`);
    }
  }

  /**
   * Reset console to original behavior
   * @returns {ConsoleText} - The current instance for chaining
   */
  restore() {
    // Restore all original methods
    Object.keys(this.originalConsole).forEach(method => {
      console[method] = this.originalConsole[method];
    });

    // Remove custom methods
    delete console.text;

    return this;
  }
}

module.exports = ConsoleText;

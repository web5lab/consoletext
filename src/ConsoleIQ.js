/**
 * ConsoleIQ - Enhanced console logging with remote capabilities
 * @module ConsoleIQ
 */

const axios = require('axios');
const { applyColor } = require('./utils/colorizer');

/**
 * ConsoleIQ class for enhancing and extending console functionality
 */
class ConsoleIQ {
  /**
   * Create a new ConsoleIQ instance
   * @param {Object} config - Configuration options
   * @param {string} [config.endpoint] - URL endpoint for remote logging
   * @param {string} [config.apiKey] - API key for authentication with remote endpoint
   * @param {boolean} [config.colorize=true] - Whether to colorize console output
   * @param {boolean} [config.silent=false] - Whether to suppress console output
   * @param {string} [config.name] - Name for logger instance
   * @param {Array} [config.allowedLevels] - Array of allowed levels for remote logging
   * @param {boolean} [config.captureGlobalErrors=true] - Whether to capture global errors
   * @param {boolean} [config.captureUnhandledRejections=true] - Whether to capture unhandled promise rejections
   * @param {boolean} [config.captureConsoleErrors=true] - Whether to capture console errors
   * @param {boolean} [config.autoTraceErrors=true] - Whether to automatically add stack traces to errors
   * @param {boolean} [config.enhanceErrors=true] - Whether to enhance error objects with additional context
   */
  constructor(config = {}) {
    this.config = {
      endpoint: config.endpoint || "https://api.consoleiq.io/logs",
      apiKey: config.apiKey || null,
      colorize: config.colorize !== false,
      silent: config.silent || false,
      name: config.name || 'ConsoleIQ',
      allowedLevels: config.allowedLevels || ['error', 'text'],
      captureGlobalErrors: config.captureGlobalErrors !== false,
      captureUnhandledRejections: config.captureUnhandledRejections !== false,
      captureConsoleErrors: config.captureConsoleErrors !== false,
      autoTraceErrors: config.autoTraceErrors !== false,
      enhanceErrors: config.enhanceErrors !== false,
      maxErrorDepth: config.maxErrorDepth || 5,
      environment: typeof window !== 'undefined' ? 'browser' : 'node',
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
      assert: console.assert,
      text: console.log
    };

    // Store original error handlers
    this.originalErrorHandlers = {
      onerror: null,
      onunhandledrejection: null
    };

    // Track if we've initialized
    this._initialized = false;
  }

  /**
   * Initialize by overriding console methods and setting up error handlers
   * @returns {ConsoleIQ} - The current instance for chaining
   */
  init() {
    this._consoleWrappers = {};

    const standardMethods = ['log', 'info', 'warn', 'error', 'debug'];
    standardMethods.forEach(method => {
      this._consoleWrappers[method] = (...args) => this._handleLog(method, args);
      console[method] = this._consoleWrappers[method];
    });

    // Add support for other console methods without server logging
    const otherMethods = ['dir', 'table', 'time', 'timeEnd', 'trace', 'assert'];
    otherMethods.forEach(method => {
      console[method] = (...args) => {
        if (!this.config.silent) {
          this.originalConsole[method](...args);
        }
      };
    });

    // Add custom text method (send to server if configured)
    console.text = (...args) => {
      if (this.config.endpoint && this.config.allowedLevels.includes('text')) {
        this._sendToServer('text', args);
      }
      if (!this.config.silent) {
        this._applyColorAndLog('text', ...args);
      }
    };

    // Initialize error handlers
    this._setupErrorHandlers();
    this._initialized = true;

    return this;
  }

  /**
   * Set up global error handlers
   * @private
   */
  _setupErrorHandlers() {
    // Browser and Node.js error handling
    if (this.config.captureGlobalErrors) {
      if (typeof window !== 'undefined' && window.addEventListener) {
        // Browser error handling
        this.originalErrorHandlers.onerror = window.onerror;
        window.onerror = (message, source, lineno, colno, error) => {
          const enhancedError = this._enhanceError({
            message,
            source,
            lineno,
            colno,
            stack: error?.stack || null,
            name: error?.name || 'Error'
          }, 'window.onerror');

          this._handleGlobalError('window.onerror', enhancedError);

          if (typeof this.originalErrorHandlers.onerror === 'function') {
            return this.originalErrorHandlers.onerror(message, source, lineno, colno, error);
          }
          return false;
        };
      } else if (typeof process !== 'undefined') {
        // Node.js error handling
        this.originalErrorHandlers.onerror = process.listeners('uncaughtException').pop() || null;
        process.removeAllListeners('uncaughtException');
        process.on('uncaughtException', (error) => {
          const enhancedError = this._enhanceError(error, 'uncaughtException');
          this._handleGlobalError('uncaughtException', enhancedError);
          if (typeof this.originalErrorHandlers.onerror === 'function') {
            this.originalErrorHandlers.onerror(error);
          }
        });
      }
    }

    // Unhandled promise rejections
    if (this.config.captureUnhandledRejections) {
      if (typeof window !== 'undefined' && window.addEventListener) {
        // Browser
        this.originalErrorHandlers.onunhandledrejection = window.onunhandledrejection;
        window.addEventListener('unhandledrejection', (event) => {
          const enhancedError = this._enhanceRejection(event.reason);
          this._handleRejection(enhancedError);
          if (typeof this.originalErrorHandlers.onunhandledrejection === 'function') {
            this.originalErrorHandlers.onunhandledrejection(event);
          }
        });
      } else if (typeof process !== 'undefined') {
        // Node.js
        this.originalErrorHandlers.onunhandledrejection = process.listeners('unhandledRejection').pop() || null;
        process.removeAllListeners('unhandledRejection');
        process.on('unhandledRejection', (reason, promise) => {
          const enhancedError = this._enhanceRejection(reason);
          this._handleRejection(enhancedError);
          if (typeof this.originalErrorHandlers.onunhandledrejection === 'function') {
            this.originalErrorHandlers.onunhandledrejection(reason, promise);
          }
        });
      }
    }

    // Console errors (if not already captured via console.error override)
    if (this.config.captureConsoleErrors) {
      this.originalConsoleError = console.error;
      console.error = (...args) => {
        const enhancedArgs = args.map(arg => {
          if (arg instanceof Error) {
            return this._enhanceError(arg, 'console.error');
          }
          return arg;
        });
        this._handleConsoleError(enhancedArgs);
        this.originalConsoleError(...args);
      };
    }
  }

  /**
   * Enhance an error object with additional context
   * @private
   * @param {Error|Object} error - The error to enhance
   * @param {string} source - Where the error originated from
   * @returns {Object} - Enhanced error object
   */
  _enhanceError(error, source) {
    if (!this.config.enhanceErrors) return error;

    const stack = error.stack || new Error().stack;
    const enhancedError = {
      ...error,
      source,
      timestamp: new Date().toISOString(),
      loggerName: this.config.name,
      environment: this.config.environment,
      stack: this.config.autoTraceErrors ? this._cleanStack(stack) : stack
    };

    // Add browser context if available
    if (typeof window !== 'undefined') {
      enhancedError.browser = {
        url: window.location.href,
        userAgent: navigator.userAgent,
        platform: navigator.platform
      };
    }

    // Add Node.js context if available
    if (typeof process !== 'undefined') {
      enhancedError.node = {
        version: process.version,
        pid: process.pid,
        cwd: process.cwd(),
        argv: process.argv
      };
    }

    return enhancedError;
  }

  /**
   * Enhance a promise rejection reason
   * @private
   * @param {any} reason - Rejection reason
   * @returns {Object} - Enhanced error object
   */
  _enhanceRejection(reason) {
    if (reason instanceof Error) {
      return this._enhanceError(reason, 'unhandledRejection');
    }

    return {
      message: String(reason),
      name: 'UnhandledRejection',
      source: 'unhandledRejection',
      timestamp: new Date().toISOString(),
      loggerName: this.config.name,
      environment: this.config.environment,
      stack: this.config.autoTraceErrors ? this._cleanStack(new Error().stack) : undefined
    };
  }

  /**
   * Clean up stack trace by removing noise
   * @private
   * @param {string} stack - Original stack trace
   * @returns {string} - Cleaned stack trace
   */
  _cleanStack(stack) {
    if (!stack) return '';

    const lines = stack.split('\n');
    // Remove ConsoleIQ internal traces from the stack
    const filtered = lines.filter(line => !line.includes('ConsoleIQ.'));
    return filtered.join('\n');
  }

  /**
   * Handle global errors
   * @private
   * @param {string} type - Error type
   * @param {Object} errorInfo - Error information
   */
  _handleGlobalError(type, errorInfo) {
    const errorMessage = this._formatError(type, errorInfo);
    if (this.config.endpoint && this.config.allowedLevels.includes('error')) {
      this._sendToServer('error', [errorMessage, errorInfo]);
    }
    if (!this.config.silent) {
      this._applyColorAndLog('error', errorMessage);
      if (this.config.autoTraceErrors && errorInfo.stack) {
        this._applyColorAndLog('trace', errorInfo.stack);
      }
    }
  }

  /**
   * Format error message with context
   * @private
   * @param {string} type - Error type
   * @param {Object} errorInfo - Error information
   * @returns {string} - Formatted error message
   */
  _formatError(type, errorInfo) {
    let message = `[${this.config.name}] [${type}] ${errorInfo.message || errorInfo}`;

    if (errorInfo.source) {
      message += ` (source: ${errorInfo.source})`;
    }

    if (errorInfo.lineno && errorInfo.colno) {
      message += ` at ${errorInfo.lineno}:${errorInfo.colno}`;
    }

    return message;
  }

  /**
   * Handle unhandled promise rejections
   * @private
   * @param {Error|any} reason - Rejection reason
   */
  _handleRejection(reason) {
    const errorMessage = this._formatError('unhandledRejection', reason);

    if (this.config.endpoint && this.config.allowedLevels.includes('error')) {
      this._sendToServer('error', [errorMessage, reason]);
    }
    if (!this.config.silent) {
      this._applyColorAndLog('error', errorMessage);
      if (this.config.autoTraceErrors && reason.stack) {
        this._applyColorAndLog('trace', reason.stack);
      }
    }
  }

  /**
   * Handle console errors
   * @private
   * @param {Array} args - Error arguments
   */
  _handleConsoleError(args) {
    if (this.config.endpoint && this.config.allowedLevels.includes('error')) {
      const enhancedArgs = args.map(arg => {
        if (arg instanceof Error) {
          return this._enhanceError(arg, 'console.error');
        }
        return arg;
      });
      this._sendToServer('error', enhancedArgs);
    }
  }

  /**
   * Handle log output (send to server if configured & allowed)
   * @private
   * @param {string} level - Log level
   * @param {Array} args - Arguments to log
   */
  _handleLog(level, args) {
    // Enhance errors in the arguments
    const enhancedArgs = args.map(arg => {
      if (arg instanceof Error) {
        return this._enhanceError(arg, `console.${level}`);
      }
      return arg;
    });

    // Send to server if endpoint & allowed
    if (this.config.endpoint && this.config.allowedLevels.includes(level)) {
      this._sendToServer(level, enhancedArgs);
    }

    // Output to console only
    if (!this.config.silent) {
      this._applyColorAndLog(level, ...enhancedArgs);

      // Automatically add stack trace for errors if enabled
      if (level === 'error' && this.config.autoTraceErrors) {
        const errorArg = enhancedArgs.find(arg => arg instanceof Error);
        if (errorArg?.stack) {
          this._applyColorAndLog('trace', errorArg.stack);
        } else if (this.config.environment === 'browser') {
          this._applyColorAndLog('trace', new Error().stack);
        }
      }
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
   * Send logs to server preserving original console format
   * @private
   * @param {string} level - Log level
   * @param {Array} args - Arguments to log
   * @returns {Promise<void>}
   */
  async _sendToServer(level, args) {
    if (!this.config.endpoint) return;

    try {
      // Create a payload that preserves the original console data structure
      const logData = {
        level,
        // Console-formatted output
        message: this._formatConsoleLike(level, args),
        // Additional metadata
        timestamp: new Date().toISOString(),
        name: this.config.name,
        environment: this.config.environment,
        metadata: this._getEnvironmentMetadata(),
        // Stack trace for errors
        ...(level === 'error' ? { stack: this._getErrorStack(args) } : {})
      };

      const headers = {
        'Content-Type': 'application/json'
      };

      if (this.config.apiKey) {
        headers['Authorization'] = `Bearer ${this.config.apiKey}`;
      }

      await axios.post(this.config.endpoint, logData, {
        headers,
        timeout: 5000
      });
    } catch (error) {
      if (!this.config.silent) {
        this.originalConsole.error(`ConsoleIQ: Failed to send log:`, error.message);
      }
    }
  }

  /**
   * Prepare data for serialization while preserving structure
   * @private
   * @param {any} data - Data to prepare
   * @param {Set} [seen] - Track circular references
   * @param {number} [depth=0] - Current depth
   * @returns {any} - Prepared data
   */
  _prepareForSerialization(data, seen = new WeakSet(), depth = 0) {
    if (depth > this.config.maxErrorDepth) return '[Max Depth Reached]';
  
    // Handle primitives
    if (data === null || typeof data !== 'object') {
      return data;
    }
  
    // Handle circular references
    if (seen.has(data)) {
      return '[Circular Reference]';
    }
    seen.add(data);
  
    // Handle errors specially
    if (data instanceof Error) {
      const errorObj = {
        __type: 'Error',
        name: data.name,
        message: data.message,
        stack: data.stack
      };
  
      // Include any custom error properties
      Object.getOwnPropertyNames(data).forEach(key => {
        if (!['name', 'message', 'stack'].includes(key)) {
          try {
            errorObj[key] = this._prepareForSerialization(data[key], seen, depth + 1);
          } catch (e) {
            errorObj[key] = '[Unable to serialize]';
          }
        }
      });
  
      return errorObj;
    }
  
    // Handle arrays
    if (Array.isArray(data)) {
      return data.map(item => {
        try {
          return this._prepareForSerialization(item, seen, depth + 1);
        } catch (e) {
          return '[Array item unable to serialize]';
        }
      });
    }
  
    // Handle plain objects
    const result = {};
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        try {
          result[key] = this._prepareForSerialization(data[key], seen, depth + 1);
        } catch (e) {
          result[key] = '[Unable to serialize property]';
        }
      }
    }
    return result;
  }

  /**
   * Format data like the console would display it
   * @private
   * @param {string} level - Log level
   * @param {Array} args - Arguments to format
   * @returns {string} - Formatted string
   */
  _formatConsoleLike(level, args) {
    try {
      return args.map(arg => {
        if (typeof arg === 'object' && arg !== null) {
          try {
            // Handle Errors specially
            if (arg instanceof Error) {
              return JSON.stringify({
                message: arg.message,
                name: arg.name,
                stack: arg.stack,
                ...Object.getOwnPropertyDescriptors(arg)
              }, null, 2);
            }
            // Handle regular objects
            return JSON.stringify(arg, null, 2);
          } catch (e) {
            // Fallback if JSON.stringify fails (circular references etc.)
            return String(arg);
          }
        }
        return String(arg);
      }).join(' ');
    } catch (e) {
      // Fallback to simple string joining if everything fails
      return args.map(arg => String(arg)).join(' ');
    }
  }

  /**
   * Get error stack from arguments if available
   * @private
   * @param {Array} args - Arguments to check
   * @returns {string|null} - Stack trace or null
   */
  _getErrorStack(args) {
    const errorArg = args.find(arg => arg instanceof Error);
    if (errorArg?.stack) {
      return errorArg.stack;
    }
    return null;
  }

  /**
   * Get environment metadata
   * @private
   * @returns {Object} - Environment metadata
   */
  _getEnvironmentMetadata() {
    if (typeof window !== 'undefined') {
      return {
        type: 'browser',
        url: window.location.href,
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        screen: {
          width: window.screen.width,
          height: window.screen.height
        }
      };
    } else if (typeof process !== 'undefined') {
      return {
        type: 'node',
        version: process.version,
        pid: process.pid,
        cwd: process.cwd(),
        argv: process.argv,
        memoryUsage: process.memoryUsage()
      };
    }
    return { type: 'unknown' };
  }

  /**
   * Reset console to original behavior and remove error handlers
   * @returns {ConsoleIQ} - The current instance for chaining
   */
  restore() {
    if (!this._initialized) return this;

    // Only restore methods that we actually overrode
    Object.keys(this.originalConsole).forEach(method => {
      if (console[method] === this._consoleWrappers?.[method]) {
        console[method] = this.originalConsole[method];
      }
    });

    // Remove custom text method only if it's ours
    if (console.text === this._textWrapper) {
      delete console.text;
    }

    // Restore error handlers
    if (typeof window !== 'undefined' && window.addEventListener) {
      // Browser
      if (window.onerror === this._handleWindowError) {
        window.onerror = this.originalErrorHandlers.onerror;
      }
      if (window.onunhandledrejection === this._handleWindowRejection) {
        window.onunhandledrejection = this.originalErrorHandlers.onunhandledrejection;
      }
    } else if (typeof process !== 'undefined') {
      // Node.js
      if (typeof this.originalErrorHandlers.onerror === 'function') {
        process.removeAllListeners('uncaughtException');
        process.on('uncaughtException', this.originalErrorHandlers.onerror);
      }
      if (typeof this.originalErrorHandlers.onunhandledrejection === 'function') {
        process.removeAllListeners('unhandledRejection');
        process.on('unhandledRejection', this.originalErrorHandlers.onunhandledrejection);
      }
    }

    // Restore console.error if we modified it
    if (this.config.captureConsoleErrors && this.originalConsoleError) {
      console.error = this.originalConsoleError;
    }

    this._initialized = false;
    return this;
  }

  /**
   * Get the current configuration
   * @returns {Object} - Current configuration
   */
  getConfig() {
    return { ...this.config };
  }

  /**
   * Update the configuration
   * @param {Object} newConfig - New configuration values
   * @returns {ConsoleIQ} - The current instance for chaining
   */
  setConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    return this;
  }
}

module.exports = ConsoleIQ;
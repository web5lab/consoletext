/**
 * Basic usage example for ConsoleIQ
 */

const { createConsoleIQ } = require('../index');

// Initialize ConsoleIQ with default settings
const consoleIQ = createConsoleIQ({
  // For remote logging (uncomment and add your endpoint)
  // endpoint: 'https://your-logging-api.com/logs',
  // apiKey: 'your-api-key',
  colorize: true,
  silent: false
});

// Example usage of different console methods
console.log('This is a regular log message');
console.info('This is an info message');
console.warn('This is a warning message');
console.error('This is an error message');
console.debug('This is a debug message');

// Custom text method (this one would send to the server if endpoint is configured)
console.text('This message would be sent to the server if endpoint is configured');

// Log objects
console.log('Logging an object:', { user: 'John', role: 'Admin' });

// Restore original console behavior when done
consoleIQ.restore();
console.log('Console is back to normal');
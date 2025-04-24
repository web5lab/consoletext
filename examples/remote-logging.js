/**
 * Remote logging example for ConsoleText
 */

const { createConsoleText } = require('../index');

// Initialize ConsoleText with remote logging configuration
const consoleText = createConsoleText({
  endpoint: 'https://example.com/api/logs', // Replace with your actual endpoint
  apiKey: 'your-api-key-here', // Replace with your actual API key
  colorize: true
});

// This message will be displayed in the console with color
// but won't be sent to the server
console.info('This message only appears in the console');

// This message will be both displayed in the console
// and sent to the remote server
console.text('This message is sent to the remote server');

// You can also log objects
console.text('User action:', {
  userId: 123,
  action: 'login',
  timestamp: new Date()
});

// When you're done, restore the original console
setTimeout(() => {
  consoleText.restore();
  console.log('Console is back to normal');
}, 1000);
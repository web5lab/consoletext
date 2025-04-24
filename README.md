# ConsoleText

Enhanced console logging with colorization and remote capabilities for Node.js applications.

## Features

- 🎨 **Colorized Console Output**: Improve readability with color-coded log levels
- 🌐 **Remote Logging**: Send selected logs to a remote server endpoint
- 🔄 **Preserve Original Console**: Easily restore original console behavior
- 🛠️ **Configurable**: Customize behavior with simple options
- 📝 **Custom Log Method**: Special `console.text()` method for remote logging

## Installation

```bash
npm install ConsoleText
```

## Quick Start

```javascript
const { createConsoleText } = require('consoleText');

// Initialize with default options
const ConsoleText = createConsoleText();

// Use enhanced console methods
console.log('Regular log message');
console.info('Info message in blue');
console.warn('Warning message in yellow');
console.error('Error message in red');
console.debug('Debug message in green');

// Use custom text method (for remote logging)
console.text('This can be sent to a remote server if configured');

// When done, restore original console behavior
ConsoleText.restore();
```

## Configuration

```javascript
const { createConsoleText } = require('consoleText');

const ConsoleText = createConsoleText({
  // Remote logging endpoint (optional)
  endpoint: 'https://your-logging-api.com/logs',
  
  // API key for authentication (optional)
  apiKey: 'your-api-key',
  
  // Enable/disable colorization (default: true)
  colorize: true,
  
  // Enable/disable console output (default: false)
  silent: false
});
```

## Using with React

### Basic Setup

```javascript
// src/logger.js
import { createConsoleText } from 'consoleText';

export const logger = createConsoleText({
  endpoint: process.env.REACT_APP_LOGGING_ENDPOINT,
  apiKey: process.env.REACT_APP_LOGGING_API_KEY
});
```

```javascript
// src/index.js or App.js
import { logger } from './logger';

// Initialize logger early in your app
logger.init();

// Use in your components
function App() {
  useEffect(() => {
    console.info('App mounted');
    console.text('This will be sent to the server');
    
    // Cleanup on unmount
    return () => logger.restore();
  }, []);

  return <div>Your App</div>;
}
```

### Custom Hook

```javascript
// src/hooks/useLogger.js
import { useEffect } from 'react';
import { createConsoleText } from 'consoleText';

export function useLogger(config = {}) {
  useEffect(() => {
    const logger = createConsoleText(config);
    logger.init();
    
    return () => logger.restore();
  }, []);
}

// Usage in component
function MyComponent() {
  useLogger({
    endpoint: 'https://api.example.com/logs',
    colorize: true
  });

  return <div>Component with logging</div>;
}
```

## Remote Logging

Only the `console.text()` method sends logs to the remote server. Other console methods are enhanced but only output locally.

```javascript
// Configure with remote endpoint
const ConsoleText = createConsoleText({
  endpoint: 'https://your-logging-api.com/logs',
  apiKey: 'your-api-key'
});

// This will be sent to the remote server
console.text('Important information to log remotely');

// These will only appear in the local console
console.log('Local log message');
console.info('Local info message');
```

## Advanced Usage

### Manual Initialization

```javascript
const { ConsoleText } = require('consoleText');

// Create instance without auto-initialization
const logger = new ConsoleText({
  colorize: true,
  endpoint: 'https://your-logging-api.com/logs'
});

// Initialize when ready
logger.init();

// Use enhanced console
console.log('Console is now enhanced');

// Restore when done
logger.restore();
```

## API Reference

### `createConsoleText(config)`

Creates and initializes a new ConsoleText instance.

- `config` (Object): Configuration options
  - `endpoint` (String): URL for remote logging
  - `apiKey` (String): Authentication key for remote endpoint
  - `colorize` (Boolean): Whether to colorize console output (default: true)
  - `silent` (Boolean): Whether to suppress console output (default: false)

Returns an initialized ConsoleText instance.

### `ConsoleText`

Class that provides console enhancement functionality.

#### Methods

- `init()`: Overrides console methods with enhanced versions
- `restore()`: Restores original console behavior

## Examples

See the [examples](./examples) directory for more usage examples.

## License

MIT
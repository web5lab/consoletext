# ConsoleIQ

![npm version](https://img.shields.io/npm/v/consoleiq)
![license](https://img.shields.io/npm/l/consoleiq)
![downloads](https://img.shields.io/npm/dm/consoleiq)

> Enhanced console logging with remote capabilities for any JavaScript environment

ConsoleIQ provides powerful console logging enhancements with built-in remote reporting, error handling, and framework integrations - all in a lightweight package.

## Features

- 🌐 **Universal** - Works in browsers, Node.js, and any JavaScript runtime with consistent API
- ☁️ **Remote Ready** - Built-in support for sending logs to any HTTP endpoint with configurable levels
- 🛡️ **Error Handling** - Automatic error capturing with stack traces and environment context
- 🎨 **Colorized Output** - Enhanced terminal/console output with customizable colorization
- 🔄 **Framework Support** - Integration examples for React, Vue, Angular, and Node.js/Express
- 🪶 **Lightweight** - Zero dependencies (except axios for HTTP requests)

## Installation

```bash
npm install consoleiq
```

## Basic Usage

```javascript
const ConsoleIQ = require('consoleiq');

// Initialize with default options
const logger = new ConsoleIQ().init();

// Use enhanced console methods
console.log('Regular log message');
console.info('Info message');
console.warn('Warning message');
console.error('Error message');
console.debug('Debug message');

// Custom text method for remote logging
console.text('This will be sent to remote endpoint if configured');
```

## Configuration

```javascript
const logger = new ConsoleIQ({
  endpoint: 'https://api.your-log-service.com/logs',
  apiKey: 'your-api-key-here',
  colorize: true,
  silent: false,
  name: 'MyAppLogger',
  allowedLevels: ['error', 'warn', 'text'],
  captureGlobalErrors: true,
  captureUnhandledRejections: true,
  autoTraceErrors: true,
  enhanceErrors: true,
  maxErrorDepth: 5,
  environment: 'browser' // or 'node'
}).init();
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `endpoint` | string | `""` | URL endpoint for remote logging |
| `apiKey` | string | `null` | API key for authentication |
| `colorize` | boolean | `true` | Enable/disable colored output |
| `silent` | boolean | `false` | Suppress all console output |
| `name` | string | `"ConsoleIQ"` | Logger instance name |
| `allowedLevels` | Array<string> | `["error", "text"]` | Levels to send remotely |
| `captureGlobalErrors` | boolean | `true` | Capture uncaught exceptions |
| `captureUnhandledRejections` | boolean | `true` | Capture promise rejections |
| `captureConsoleErrors` | boolean | `true` | Capture console.error calls |
| `autoTraceErrors` | boolean | `true` | Add stack traces to errors |
| `enhanceErrors` | boolean | `true` | Add context to error objects |
| `maxErrorDepth` | number | `5` | Max depth for error serialization |
| `environment` | string | auto-detected | Force environment (browser/node) |

## Advanced Features

### Environment Detection

ConsoleIQ automatically detects whether it's running in a browser or Node.js environment and adjusts its behavior accordingly.

```javascript
// In browser:
logger.getConfig().environment === 'browser'

// In Node.js:
logger.getConfig().environment === 'node'
```

### Error Handling

Comprehensive error handling with stack traces, environment context, and automatic serialization of complex error objects.

```javascript
// Enhanced error object includes:
{
  message: 'Error message',
  stack: 'Cleaned stack trace',
  timestamp: 'ISO string',
  environment: 'browser',
  browser: { url, userAgent, platform },
  // ...and any custom error properties
}
```

### Remote Logging

Send logs to any HTTP endpoint with configurable levels and automatic retries. The payload includes rich metadata:

```javascript
{
  "level": "error",
  "message": "Form validation failed",
  "timestamp": "2025-04-30T12:34:56.789Z",
  "name": "MyAppLogger",
  "environment": "browser",
  "metadata": {
    "browser": {
      "url": "https://example.com/form",
      "userAgent": "Mozilla/5.0...",
      "platform": "Win32"
    }
  },
  "stack": "Error: Validation failed... (clean stack trace)"
}
```

## Framework Integration

### React Hook

```javascript
import { useEffect } from 'react';
import ConsoleIQ from 'consoleiq';

export function useConsoleIQ(config) {
  useEffect(() => {
    const logger = new ConsoleIQ(config).init();
    return () => logger.restore();
  }, [config?.endpoint]); // Re-init if endpoint changes
}
```

### Vue Plugin

```javascript
import ConsoleIQ from 'consoleiq';

export default {
  install(app, config) {
    const logger = new ConsoleIQ(config).init();
    app.provide('logger', logger);
    app.config.globalProperties.$logger = logger;
  }
};
```

### Angular Service

```javascript
import { Injectable, OnDestroy } from '@angular/core';
import ConsoleIQ from 'consoleiq';

@Injectable({ providedIn: 'root' })
export class LoggerService implements OnDestroy {
  private logger: ConsoleIQ;

  constructor() {
    this.logger = new ConsoleIQ({
      name: 'AngularApp'
    }).init();
  }

  ngOnDestroy() {
    this.logger.restore();
  }
}
```

### Node.js/Express

```javascript
const ConsoleIQ = require('consoleiq');

// For server-side usage
const logger = new ConsoleIQ({
  endpoint: process.env.LOGGING_ENDPOINT,
  captureGlobalErrors: true,
  environment: 'node'
}).init();

// Use in Express middleware
app.use((req, res, next) => {
  console.text(`Request: ${req.method} ${req.path}`);
  next();
});
```

## Key Benefits

- Enhanced console methods with colorization and remote logging
- Automatic capture of uncaught exceptions and promise rejections
- Error object enhancement with environment context
- Configurable log levels and filtering
- Circular reference handling in object serialization
- Framework-specific integration examples
- Lightweight with zero dependencies (except axios for HTTP)

## License

MIT © 2025 ConsoleIQ

## Links

- [GitHub Repository](https://github.com/consoleiq/consoleiq)
- [Documentation](https://consoleiq.io)
- [Issues](https://github.com/consoleiq/consoleiq/issues)
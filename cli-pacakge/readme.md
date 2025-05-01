# inti-consoleiq

> 🧠 Smart console integration for JavaScript/TypeScript applications

`inti-consoleiq` is a setup tool that helps you quickly integrate [ConsoleIQ](https://console-iq.com) into your frontend or backend JavaScript/TypeScript projects.

## Features

- 🚀 Quick setup wizard for ConsoleIQ integration
- 🔄 Auto-detects TypeScript/JavaScript preferences
- 📁 Automatically finds your project entry point
- 🧩 Works with ESM and CommonJS module systems
- 🔌 Zero-configuration installation

## Installation

```bash
# Install globally
npm install -g inti-consoleiq

# Or run directly with npx
npx inti-consoleiq
```

## Usage

Run the command in your project directory:

```bash
inti-consoleiq
```

Follow the interactive prompts:

1. Enter your ConsoleIQ API key
2. Provide your application name
3. Specify which console methods to capture (e.g., log,warn,error)
4. Select your environment (browser/node)

The tool will:
- Create a configuration file
- Auto-detect your project's entry point 
- Add the necessary import
- Install the `consoleiq` package

## Example

```
🧠 ConsoleIQ Setup for Frontend or Backend JavaScript/TypeScript Projects

🔑 ConsoleIQ API Key: abc123xyz456
📛 App Name (e.g. MyApp): MyAwesomeApp
📊 Log Levels (comma-separated, e.g. log,error): log,warn,error,info
🌍 Environment (browser/node): browser

✅ Created src/consoleiq.ts
✅ Injected import into src/main.ts
📦 Installing ConsoleIQ SDK...
✅ ConsoleIQ installed successfully!

🚀 ConsoleIQ is now fully integrated into your project!
```

## What Gets Created

The tool generates a configuration file (`consoleiq.js` or `consoleiq.ts`) with your settings:

```typescript
import { createConsoleIQ } from 'consoleiq';

createConsoleIQ({
  apiKey: 'your-api-key',
  name: 'YourAppName',
  allowedLevels: ['log', 'error', 'warn'],
  environment: 'browser'
});
```

And adds an import to your entry file:

```typescript
import './consoleiq.ts';
// Your existing code...
```

## Requirements

- Node.js 12.x or higher
- npm or yarn
- A JavaScript/TypeScript project

## Troubleshooting

If automatic detection fails, the tool will prompt you to manually specify your entry file or provide instructions for manual integration.

## License

MIT

## About ConsoleIQ

ConsoleIQ enhances your console logging with intelligent features like remote logging, filtering, and advanced analysis. Get your API key at [console-iq.com](https://console-iq.com).
#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const prompt = require("prompt-sync")({ sigint: true });
const axios = require("axios");
const { execSync } = require("child_process");

// ANSI color helpers
const green = (msg) => `\x1b[32m${msg}\x1b[0m`;
const cyan = (msg) => `\x1b[36m${msg}\x1b[0m`;
const red = (msg) => `\x1b[31m${msg}\x1b[0m`;

// Banner
console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🧠 ConsoleIQ Setup - Intelligent Logging for Devs

ConsoleIQ helps you capture, monitor, and analyze logs
from frontend and backend JavaScript/TypeScript projects.

🔗 Dashboard: https://consoleiq.io
📚 Docs:      https://consoleiq.io/docs
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);

(async function main() {
  let apiKey = '';
  const hasApiKey = prompt("🔑 Do you already have a ConsoleIQ API Key? (y/n): ").trim().toLowerCase();

  if (hasApiKey === "n" || hasApiKey === "no") {
    const hasAccount = prompt("👤 Do you already have an account? (y/n): ").trim().toLowerCase();
    const email = prompt("📧 Email: ").trim();
    const password = prompt("🔒 Password: ").trim();

    if (hasAccount === "y" || hasAccount === "yes") {
      // LOGIN FLOW
      try {
        const res = await axios.post("https://api.consoleiq.io/auth/cli-login", {
          email,
          password,
        });
        apiKey = res.data.apiKey;
        console.log(green(`\n✅ Logged in! Your API Key: ${apiKey}\n`));
      } catch (err) {
        console.error(red(`❌ Login failed: ${err.response?.data?.message || err.message}`));
        process.exit(1);
      }
    } else {
      // REGISTER + OTP FLOW
      const appName = prompt("📛 App Name (e.g. MyApp): ").trim();
      try {
        await axios.post("https://api.consoleiq.io/auth/create-gmail-account", {
          email,
          password,
          name:appName,
        });
        console.log(green("📨 OTP sent to your email."));
        const otp = prompt("🔢 Enter the OTP: ").trim();
        const verifyRes = await axios.post("https://api.consoleiq.io/auth/cli-verify-otp", {
          email,
          code:otp,
        });
        apiKey = verifyRes.data.apiKey;
        console.log(green(`\n✅ Account verified! Your API Key: ${apiKey}\n`));
      } catch (err) {
        console.error(red(`❌ Registration failed test: ${err.response?.data?.message || err.message}`,));
        process.exit(1);
      }
    }
  } else {
    apiKey = prompt("🔑 Enter your ConsoleIQ API Key: ").trim();
  }

  // Common config input
  const appName = prompt("📛 App Name (for logs): ").trim();
  const levelsInput = prompt("📊 Log Levels (comma-separated, e.g. log,error): ").trim();
  const environment = prompt("🌍 Environment (browser/node): ", "browser").trim();

  const allowedLevels = levelsInput
    .split(",")
    .map((lvl) => lvl.trim())
    .filter(Boolean);

  if (!apiKey || !appName || allowedLevels.length === 0) {
    console.error(red("❌ Missing required fields. Aborting setup."));
    process.exit(1);
  }

  // 🔍 Config preview
  console.log(cyan("\n📝 Configuration Summary:"));
  console.log(`- App Name:        ${appName}`);
  console.log(`- Log Levels:      ${allowedLevels.join(", ")}`);
  console.log(`- Environment:     ${environment}`);
  console.log(`- Output File:     ${fs.existsSync("tsconfig.json") ? "consoleiq.ts" : "consoleiq.js"}`);

  // Determine .ts or .js
  const prefersTS = fs.existsSync("tsconfig.json");
  const extension = prefersTS ? "ts" : "js";

  // Choose file location
  const srcDir = fs.existsSync("src") ? "src" : ".";
  const consoleiqFile = `consoleiq.${extension}`;
  const consoleiqPath = path.join(srcDir, consoleiqFile);

  // Detect module system
  let isESM = true;
  try {
    const pkg = JSON.parse(fs.readFileSync("package.json", "utf-8"));
    if (pkg.type === "commonjs") isESM = false;
  } catch (_) {
    isESM = true;
  }

  // Write setup file
  const importLine = isESM
    ? `import { createConsoleIQ } from 'consoleiq';`
    : `const { createConsoleIQ } = require('consoleiq');`;

  const setupCode = `${importLine}\n\ncreateConsoleIQ({
    apiKey: '${apiKey}',
    name: '${appName}',
    allowedLevels: ${JSON.stringify(allowedLevels)},
    environment: '${environment}'
  });`;

  fs.writeFileSync(consoleiqPath, setupCode.trim());
  console.log(green(`\n✅ Created ${path.relative(process.cwd(), consoleiqPath)}`));

  // Detect entry file
  const entryCandidates = [
    "main.tsx", "main.ts", "main.jsx", "main.js",
    "index.tsx", "index.ts", "index.jsx", "index.js",
    "app.ts", "app.js", "server.js", "server.ts", "api.js"
  ];

  let entryFile = null;
  for (const file of entryCandidates) {
    const candidate = path.join(srcDir, file);
    if (fs.existsSync(candidate)) {
      entryFile = candidate;
      break;
    }
  }

  if (!entryFile) {
    const customPath = prompt("📁 Couldn't auto-detect entry file. Enter path manually: ").trim();
    if (customPath && fs.existsSync(customPath)) {
      entryFile = path.resolve(customPath);
    } else {
      console.warn(red("⚠️  Skipping entry file injection. Add manually:"));
      console.log(`👉 ${isESM ? `import './${consoleiqFile}';` : `require('./${consoleiqFile}')`}`);
    }
  }

  // Inject into entry
  if (entryFile) {
    let content = fs.readFileSync(entryFile, "utf-8");
    const injectionLine = isESM
      ? `import './${consoleiqFile}';`
      : `require('./${consoleiqFile}')`;

    if (!content.includes(injectionLine)) {
      content = `${injectionLine}\n${content}`;
      fs.writeFileSync(entryFile, content);
      console.log(green(`✅ Injected import into ${path.relative(process.cwd(), entryFile)}`));
    } else {
      console.log(cyan("ℹ️  ConsoleIQ already imported in entry file."));
    }
  }

  // Install ConsoleIQ
  try {
    console.log(cyan("\n📦 Installing ConsoleIQ SDK..."));
    execSync("npm install consoleiq axios prompt-sync --save", { stdio: "inherit" });
    console.log(green("✅ ConsoleIQ installed successfully!"));
  } catch (err) {
    console.error(red("❌ Installation failed. Run manually:\n   npm install consoleiq axios prompt-sync --save"));
  }

  console.log(green("\n🎉 ConsoleIQ is now fully integrated into your project!\n"));
})();
// __tests__/ConsoleIQ.test.js

const ConsoleIQ = require('../src/ConsoleIQ');
const axios = require('axios');

jest.mock('axios');

describe('ConsoleIQ', () => {
  let consoleIQ;
  let originalConsole;

  beforeAll(() => {
    originalConsole = { ...console };
  });

  beforeEach(() => {
    consoleIQ = new ConsoleIQ();
    axios.post.mockClear();
  });

  test('should create instance with default config', () => {
    expect(consoleIQ.config).toEqual({
      endpoint: null,
      apiKey: null,
      colorize: true,
      silent: false,
      name: 'ConsoleIQ',
      allowedLevels: [ 'error', 'text'],
      captureGlobalErrors: true,
      captureUnhandledRejections: true,
      captureConsoleErrors: true,
      autoTraceErrors: true,
      enhanceErrors: true,
      maxErrorDepth: 5,
      environment: 'node'
    });
  });

  test('should create instance with custom config', () => {
    const config = {
      endpoint: 'https://test.com',
      apiKey: 'test-key',
      colorize: false,
      silent: true,
      name: 'TestLogger',
      allowedLevels: ['text'],
      // Add new config properties to match implementation
      captureGlobalErrors: false,
      captureUnhandledRejections: false,
      captureConsoleErrors: false,
      autoTraceErrors: false,
      enhanceErrors: false,
      maxErrorDepth: 3
    };
    const instance = new ConsoleIQ(config);
    expect(instance.config).toEqual({
      ...config,
      environment: 'node' // This is added automatically
    });
  });

  test('should initialize and override console methods', () => {
    consoleIQ.init();
    expect(console.log).not.toBe(originalConsole.log);
    expect(console.info).not.toBe(originalConsole.info);
    expect(console.warn).not.toBe(originalConsole.warn);
    expect(console.error).not.toBe(originalConsole.error);
    expect(console.debug).not.toBe(originalConsole.debug);
    expect(console.text).toBeDefined();
  });

  test('should restore original console methods', () => {
    consoleIQ.init();
    consoleIQ.restore();
    expect(console.log).toBe(originalConsole.log);
    expect(console.info).toBe(originalConsole.info);
    expect(console.warn).toBe(originalConsole.warn);
    expect(console.error).toBe(originalConsole.error); // This should now pass
    expect(console.debug).toBe(originalConsole.debug);
    expect(console.text).toBeUndefined();
  });

  test('should respect silent mode', () => {
    const spy = jest.spyOn(originalConsole, 'log');
    consoleIQ = new ConsoleIQ({ silent: true });
    consoleIQ.init();
    console.log('test message');
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  test('should send logs to server when endpoint is configured', async () => {
    const endpoint = 'https://test.com/logs';
    const apiKey = 'test-key';
    const message = 'test message';
    
    consoleIQ = new ConsoleIQ({
      endpoint,
      apiKey,
      name: 'TestLogger'
    });
    consoleIQ.init();
    
    await console.text(message);

    expect(axios.post).toHaveBeenCalledWith(
      endpoint,
      expect.objectContaining({
        level: 'text',
        name: 'TestLogger',
        messages: [message]
      }),
      expect.objectContaining({
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        }
      })
    );
  });

  test('should handle non-string arguments', () => {
    consoleIQ.init();
    const obj = { key: 'value' };
    const arr = [1, 2, 3];
    const fn = () => {};
    
    expect(() => {
      console.log(obj, arr, fn);
    }).not.toThrow();
  });

  test('should support other console methods', () => {
    consoleIQ.init();
    expect(() => {
      console.dir({});
      console.table([]);
      console.time('test');
      console.timeEnd('test');
      console.trace();
      console.assert(true);
    }).not.toThrow();
  });
});
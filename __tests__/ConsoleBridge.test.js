const ConsoleText = require('../src/ConsoleText');
const axios = require('axios');

jest.mock('axios');

describe('ConsoleText', () => {
  let consoleText;
  let originalConsole;

  beforeEach(() => {
    // Store original console methods
    originalConsole = {
      log: console.log,
      info: console.info,
      warn: console.warn,
      error: console.error,
      debug: console.debug,
      dir: console.dir,
      table: console.table,
      time: console.time,
      timeEnd: console.timeEnd,
      trace: console.trace
    };

    consoleText = new ConsoleText();
  });

  afterEach(() => {
    // Restore original console methods
    Object.keys(originalConsole).forEach(method => {
      console[method] = originalConsole[method];
    });
    delete console.text;
    jest.resetAllMocks();
  });

  test('should create instance with default config', () => {
    expect(consoleText.config).toEqual({
      endpoint: null,
      apiKey: null,
      colorize: true,
      silent: false
    });
  });

  test('should create instance with custom config', () => {
    const config = {
      endpoint: 'https://test.com',
      apiKey: 'test-key',
      colorize: false,
      silent: true
    };
    const instance = new ConsoleText(config);
    expect(instance.config).toEqual(config);
  });

  test('should initialize and override console methods', () => {
    consoleText.init();
    
    expect(typeof console.log).toBe('function');
    expect(typeof console.info).toBe('function');
    expect(typeof console.warn).toBe('function');
    expect(typeof console.error).toBe('function');
    expect(typeof console.debug).toBe('function');
    expect(typeof console.text).toBe('function');
  });

  test('should restore original console methods', () => {
    consoleText.init();
    consoleText.restore();
    
    expect(console.log).toBe(originalConsole.log);
    expect(console.info).toBe(originalConsole.info);
    expect(console.warn).toBe(originalConsole.warn);
    expect(console.error).toBe(originalConsole.error);
    expect(console.debug).toBe(originalConsole.debug);
    expect(console.text).toBeUndefined();
  });

  test('should respect silent mode', () => {
    const mockConsole = jest.spyOn(console, 'log').mockImplementation();
    const silentLogger = new ConsoleText({ silent: true }).init();
    
    console.log('test message');
    expect(mockConsole).not.toHaveBeenCalled();
    
    mockConsole.mockRestore();
    silentLogger.restore();
  });

  test('should send logs to server when endpoint is configured', async () => {
    const endpoint = 'https://test.com/logs';
    const apiKey = 'test-key';
    const message = 'test message';

    axios.post.mockResolvedValueOnce({ status: 200 });

    const logger = new ConsoleText({ endpoint, apiKey }).init();
    await console.text(message);

    expect(axios.post).toHaveBeenCalledWith(
      endpoint,
      expect.objectContaining({
        level: 'text',
        message
      }),
      expect.objectContaining({
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        }
      })
    );

    logger.restore();
  });

  test('should handle non-string arguments', () => {
    const mockConsole = jest.spyOn(console, 'log').mockImplementation();
    const logger = new ConsoleText().init();

    const testObject = { test: 'value' };
    console.text(testObject);

    expect(mockConsole).toHaveBeenCalledWith(testObject);

    mockConsole.mockRestore();
    logger.restore();
  });

  test('should support other console methods', () => {
    const dirSpy = jest.spyOn(console, 'dir').mockImplementation();
    const tableSpy = jest.spyOn(console, 'table').mockImplementation();
    
    const logger = new ConsoleText().init();

    console.dir({ test: 'value' });
    console.table([{ test: 'value' }]);

    expect(dirSpy).toHaveBeenCalled();
    expect(tableSpy).toHaveBeenCalled();

    dirSpy.mockRestore();
    tableSpy.mockRestore();
    logger.restore();
  });
});
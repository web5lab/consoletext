/**
 * Type definitions for ConsoleIQ
 */

declare module 'consoleiq' {
  /**
   * Configuration options for ConsoleIQ
   */
  export interface ConsoleIQConfig {
    /**
     * URL endpoint for remote logging
     */
    endpoint?: string;
  
    /**
     * API key for authentication with remote endpoint
     */
    apiKey?: string;
  
    /**
     * Whether to colorize console output
     * @default true
     */
    colorize?: boolean;
  
    /**
     * Whether to suppress console output
     * @default false
     */
    silent?: boolean;
  
    /**
     * Name for the logger instance (included in server logs)
     * @default 'ConsoleIQ'
     */
    name?: string;
  
    /**
     * Array of allowed log levels that will be sent to the remote server
     * @default ['error', 'text']
     */
    allowedLevels?: string[];
  
    /**
     * Whether to capture global `window.onerror` / `process.on('uncaughtException')`
     * @default true
     */
    captureGlobalErrors?: boolean;
  
    /**
     * Whether to capture unhandled promise rejections
     * @default true
     */
    captureUnhandledRejections?: boolean;
  
    /**
     * Whether to capture errors logged via console.error
     * @default true
     */
    captureConsoleErrors?: boolean;
  
    /**
     * Whether to automatically add stack traces to errors
     * @default true
     */
    autoTraceErrors?: boolean;
  
    /**
     * Whether to enhance error objects with additional context
     * @default true
     */
    enhanceErrors?: boolean;
  
    /**
     * Maximum depth when serializing error objects
     * @default 5
     */
    maxErrorDepth?: number;
  
    /**
     * Environment name: 'browser' or 'node'
     * (automatically inferred if not provided)
     */
    environment?: 'node' | 'browser';
  }
  
  /**
   * ConsoleIQ class for enhancing and extending console functionality
   */
  export class ConsoleIQ {
    /**
     * Create a new ConsoleIQ instance
     */
    constructor(config?: ConsoleIQConfig);
    
    /**
     * Initialize by overriding console methods
     */
    init(): this;
    
    /**
     * Reset console to original behavior
     */
    restore(): this;
  }

  /**
   * Create and initialize a new ConsoleIQ instance
   */
  export function createConsoleIQ(config?: ConsoleIQConfig): ConsoleIQ;
}

/**
 * Extend the global Console interface to include the custom text method
 */
declare global {
  interface Console {
    /**
     * Custom log method that sends logs to the remote server if configured
     * (Only sends if endpoint and allowedLevels include 'text')
     */
    text(...data: any[]): void;
  }
}

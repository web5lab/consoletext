/**
 * Type definitions for ConsoleText
 */

declare module 'consoleText' {
  /**
   * Configuration options for ConsoleText
   */
  export interface ConsoleTextConfig {
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
  }

  /**
   * ConsoleText class for enhancing and extending console functionality
   */
  export class ConsoleText {
    /**
     * Create a new ConsoleText instance
     */
    constructor(config?: ConsoleTextConfig);
    
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
   * Create and initialize a new ConsoleText instance
   */
  export function createConsoleText(config?: ConsoleTextConfig): ConsoleText;
}

/**
 * Extend the global Console interface to include the custom text method
 */
declare global {
  interface Console {
    /**
     * Custom log method that sends logs to the remote server if configured
     */
    text(...data: any[]): void;
  }
}
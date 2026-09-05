import type { MemoryConfig, MemoryContext, MemorySearchResult } from '../types/index.js'
import { logger } from '../utils/logger.js'

/**
 * Memory - Manages long-term memory for the AI companion
 * 
 * Note: Memory logic effectively moved to backend. This class is kept for compatibility
 * but essentially does nothing in the frontend now.
 */
export class Memory {
  private config: MemoryConfig
  private initialized = false

  constructor(config?: MemoryConfig) {
    this.config = config ?? {}
  }

  /**
   * Initialize memory for a user
   */
  async initialize(userId: string): Promise<void> {
    this.initialized = true
    logger.info(`Memory initialized (frontend stub) for user: ${userId}`)
  }

  /**
   * Check if memory is initialized
   */
  isInitialized(): boolean {
    return this.initialized
  }

  /**
   * Add a message to memory
   */
  async addMessage(_role: 'user' | 'assistant', _content: string): Promise<void> {
    // No-op - backend handles this via the agent loop
  }

  /**
   * Get memory context for the current conversation
   */
  async getContext(): Promise<MemoryContext> {
    return {}
  }

  /**
   * Search memory for relevant context
   */
  async search(_query: string, _limit?: number): Promise<MemorySearchResult[]> {
    return []
  }

  /**
   * Clear all memory
   */
  async clear(): Promise<void> {
    // No-op
  }

  /**
   * Get current configuration
   */
  getConfig(): MemoryConfig {
    return { ...this.config }
  }

  /**
   * Cleanup resources
   */
  dispose(): void {
    this.initialized = false
  }
}

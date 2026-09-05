import type { MemoryAdapter, MemoryContext, ZepConfig } from '../../types/index.js'

/**
 * Re-export the base memory adapter interface
 */
export type { MemoryAdapter, MemoryContext }

/**
 * Zep-specific adapter configuration
 */
export interface ZepAdapterConfig extends ZepConfig {
  // Session management
  sessionId?: string
  autoCreateSession?: boolean
}

/**
 * Local memory adapter configuration (in-memory, for development)
 */
export interface LocalMemoryConfig {
  maxMessages?: number
  maxFacts?: number
}

/**
 * Memory adapter factory type
 */
export type MemoryAdapterFactory<TConfig = unknown> = (config?: TConfig) => MemoryAdapter

/**
 * Message stored in memory
 */
export interface MemoryMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  metadata?: Record<string, unknown>
}

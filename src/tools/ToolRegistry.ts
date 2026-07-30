import type { ToolsConfig, ToolDefinition, MCPConfig } from '../types'
import { logger } from '../utils/logger'

/**
 * ToolRegistry - Manages external tools and MCP integrations
 * 
 * Tools are capabilities that the AI can use to:
 * - Access external APIs
 * - Query databases
 * - Control external systems
 * - Perform actions on behalf of the user
 * 
 * Supports:
 * - MCP (Model Context Protocol) servers
 * - Custom tool definitions
 */
export class ToolRegistry {
  private config: ToolsConfig
  private tools: Map<string, ToolDefinition> = new Map()
  private mcpClients: Map<string, MCPClient> = new Map()

  constructor(config?: ToolsConfig) {
    this.config = config ?? {}
    this.initTools()
  }

  private initTools(): void {
    // Register custom tools
    if (this.config.custom) {
      for (const tool of this.config.custom) {
        this.register(tool)
      }
    }

    // Initialize MCP connections
    if (this.config.mcp) {
      for (const mcpConfig of this.config.mcp) {
        this.connectMCP(mcpConfig)
      }
    }
  }

  /**
   * Register a custom tool
   */
  register(tool: ToolDefinition): void {
    if (this.tools.has(tool.name)) {
      logger.warn(`Tool ${tool.name} already registered, overwriting`)
    }
    this.tools.set(tool.name, tool)
    logger.info(`Registered tool: ${tool.name}`)
  }

  /**
   * Unregister a tool
   */
  unregister(name: string): void {
    this.tools.delete(name)
    logger.info(`Unregistered tool: ${name}`)
  }

  /**
   * Get a tool by name
   */
  get(name: string): ToolDefinition | undefined {
    return this.tools.get(name)
  }

  /**
   * Get all registered tools
   */
  getAll(): ToolDefinition[] {
    return Array.from(this.tools.values())
  }

  /**
   * Get tool definitions for AI model (OpenAI function calling format)
   */
  getToolDefinitions(): ToolDefinition[] {
    return this.getAll().map(tool => ({
      name: tool.name,
      description: tool.description,
      parameters: normalizeToolParameters(tool.parameters),
    }))
  }

  /**
   * Execute a tool
   */
  async execute(name: string, params: Record<string, unknown>): Promise<unknown> {
    const tool = this.tools.get(name)
    
    if (!tool) {
      throw new Error(`Tool not found: ${name}`)
    }

    if (!tool.handler) {
      throw new Error(`Tool ${name} has no handler`)
    }

    logger.info(`Executing tool: ${name}`)
    return tool.handler(params)
  }

  /**
   * Connect to an MCP server
   */
  async connectMCP(config: MCPConfig): Promise<void> {
    // TODO: Implement MCP client connection
    // This would use the MCP protocol to connect to external tool servers
    
    logger.info(`Connecting to MCP server: ${config.name}`)
    
    const client = new MCPClient(config)
    await client.connect()
    
    this.mcpClients.set(config.name, client)
    
    // Register tools from MCP server
    const tools = await client.listTools()
    for (const tool of tools) {
      this.register({
        ...tool,
        handler: async (params) => client.callTool(tool.name, params),
      })
    }
  }

  /**
   * Disconnect from an MCP server
   */
  async disconnectMCP(name: string): Promise<void> {
    const client = this.mcpClients.get(name)
    if (client) {
      await client.disconnect()
      this.mcpClients.delete(name)
      logger.info(`Disconnected from MCP server: ${name}`)
    }
  }

  /**
   * Cleanup resources
   */
  async dispose(): Promise<void> {
    for (const [name, client] of this.mcpClients) {
      await client.disconnect()
      logger.info(`Disconnected from MCP server: ${name}`)
    }
    this.mcpClients.clear()
    this.tools.clear()
  }
}

function normalizeToolParameters(parameters?: Record<string, unknown>): Record<string, unknown> {
  if (!parameters || Object.keys(parameters).length === 0) {
    return {
      type: 'object',
      properties: {},
      required: [],
      additionalProperties: false,
    }
  }

  if (parameters.type === 'object' && 'properties' in parameters) {
    return parameters
  }

  return {
    type: 'object',
    properties: parameters,
    required: [],
    additionalProperties: false,
  }
}

/**
 * MCP Client - Connects to Model Context Protocol servers
 * 
 * This is a placeholder implementation.
 * The actual implementation would use the MCP SDK.
 */
class MCPClient {
  private config: MCPConfig

  constructor(config: MCPConfig) {
    this.config = config
  }

  async connect(): Promise<void> {
    // TODO: Implement actual MCP connection
    // if (this.config.url) {
    //   // Connect via HTTP/WebSocket
    // } else if (this.config.command) {
    //   // Spawn subprocess
    // }
    
    logger.info(`MCP client connected: ${this.config.name}`)
  }

  async disconnect(): Promise<void> {
    // TODO: Implement disconnection
    logger.info(`MCP client disconnected: ${this.config.name}`)
  }

  async listTools(): Promise<ToolDefinition[]> {
    // TODO: Fetch tools from MCP server
    return []
  }

  async callTool(name: string, _params: Record<string, unknown>): Promise<unknown> {
    // TODO: Call tool on MCP server
    logger.info(`Calling MCP tool: ${name}`)
    return null
  }
}

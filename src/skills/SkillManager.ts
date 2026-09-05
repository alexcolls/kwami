import type { SkillsConfig, SkillDefinition, SkillContext, SkillResult } from '../types/index.js'
import { logger } from '../utils/logger.js'

/**
 * SkillManager - Manages native behaviors and actions
 * 
 * Skills are things the AI companion can DO:
 * - Animations and visual effects
 * - Complex workflows
 * - Custom behaviors
 * 
 * Unlike Tools (which are external), Skills are internal to Kwami.
 */
export class SkillManager {
  private config: SkillsConfig
  private skills: Map<string, SkillDefinition> = new Map()
  private kwamiRef: unknown = null

  constructor(config?: SkillsConfig) {
    this.config = config ?? {}
    this.initSkills()
  }

  private initSkills(): void {
    // Register configured skills
    if (this.config.definitions) {
      for (const skill of this.config.definitions) {
        this.register(skill)
      }
    }

    // Register built-in skills
    this.registerBuiltInSkills()
  }

  private registerBuiltInSkills(): void {
    // TODO: Add built-in skills like:
    // - greet: Play greeting animation
    // - think: Show thinking animation
    // - celebrate: Play celebration animation
    // etc.
  }

  /**
   * Set reference to Kwami instance (for skill context)
   */
  setKwamiRef(kwami: unknown): void {
    this.kwamiRef = kwami
  }

  /**
   * Register a skill
   */
  register(skill: SkillDefinition): void {
    if (this.skills.has(skill.name)) {
      logger.warn(`Skill ${skill.name} already registered, overwriting`)
    }
    this.skills.set(skill.name, skill)
    logger.info(`Registered skill: ${skill.name}`)
  }

  /**
   * Unregister a skill
   */
  unregister(name: string): void {
    this.skills.delete(name)
    logger.info(`Unregistered skill: ${name}`)
  }

  /**
   * Get a skill by name
   */
  get(name: string): SkillDefinition | undefined {
    return this.skills.get(name)
  }

  /**
   * Get all registered skills
   */
  getAll(): SkillDefinition[] {
    return Array.from(this.skills.values())
  }

  /**
   * Get skills by trigger type
   */
  getByTrigger(trigger: 'voice' | 'action' | 'event'): SkillDefinition[] {
    return this.getAll().filter(s => s.trigger === trigger)
  }

  /**
   * Execute a skill
   */
  async execute(name: string, params?: Record<string, unknown>): Promise<SkillResult> {
    const skill = this.skills.get(name)
    
    if (!skill) {
      throw new Error(`Skill not found: ${name}`)
    }

    const context: SkillContext = {
      kwami: this.kwamiRef,
      params,
    }

    logger.info(`Executing skill: ${skill.name}`)
    return await skill.execute(context)
  }

  /**
   * Check if a skill exists
   */
  has(name: string): boolean {
    return this.skills.has(name)
  }

  /**
   * Get skill count
   */
  count(): number {
    return this.skills.size
  }

  /**
   * Get all registered skill names
   */
  getSkillNames(): string[] {
    return Array.from(this.skills.keys())
  }

  /**
   * Get all skill definitions
   */
  getSkillDefinitions(): SkillDefinition[] {
    return Array.from(this.skills.values())
  }

  /**
   * Cleanup resources
   */
  dispose(): void {
    this.skills.clear()
    this.kwamiRef = null
  }
}

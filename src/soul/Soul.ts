import type { SoulConfig, EmotionalTraits, MemoryContext } from '../types'
import { logger } from '../utils/logger'
import { getSoulPresetById, toSoulConfig } from './presets'

/**
 * Soul - Manages the AI's personality and identity
 * 
 * The Soul defines:
 * - Name and identity
 * - Personality traits
 * - System prompts
 * - Conversation style
 * - Emotional characteristics
 */
export class Soul {
  private config: SoulConfig

  constructor(config?: SoulConfig) {
    this.config = config ?? this.getDefaultConfig()
  }

  private getDefaultConfig(): SoulConfig {
    return {
      name: 'Kwami',
      personality: 'A friendly and helpful AI companion',
      systemPrompt: 'You are Kwami, a friendly AI companion. Be helpful, clear, and engaging.',
      traits: ['friendly', 'helpful', 'curious'],
      language: 'en',
      conversationStyle: 'friendly',
      responseLength: 'medium',
      emotionalTone: 'warm',
      emotionalTraits: this.getDefaultEmotionalTraits(),
    }
  }

  private getDefaultEmotionalTraits(): EmotionalTraits {
    return {
      happiness: 0,
      energy: 0,
      confidence: 0,
      calmness: 0,
      optimism: 0,
      socialness: 0,
      creativity: 0,
      patience: 0,
      empathy: 0,
      curiosity: 0,
    }
  }

  /**
   * Get the complete system prompt for AI configuration
   * Optionally includes memory context
   */
  getSystemPrompt(memoryContext?: MemoryContext): string {
    const {
      systemPrompt,
      personality,
      traits,
      conversationStyle,
      responseLength,
      emotionalTone,
      emotionalTraits,
    } = this.config

    let prompt = systemPrompt ?? ''

    if (personality) {
      prompt += `\n\nPersonality: ${personality}`
    }

    if (traits && traits.length > 0) {
      prompt += `\n\nKey traits: ${traits.join(', ')}`
    }

    if (conversationStyle) {
      prompt += `\n\nConversation style: ${conversationStyle}`
    }

    if (responseLength) {
      const lengthGuide = {
        short: 'Keep responses brief and concise (1-2 sentences).',
        medium: 'Provide balanced responses with enough detail (2-4 sentences).',
        long: 'Give comprehensive, detailed responses when appropriate.',
      }
      prompt += `\n\n${lengthGuide[responseLength]}`
    }

    if (emotionalTone) {
      const toneGuide = {
        neutral: 'Maintain a balanced, objective tone.',
        warm: 'Express warmth and friendliness in your interactions.',
        enthusiastic: 'Show enthusiasm and energy in your responses.',
        calm: 'Maintain a calm, soothing demeanor.',
        playful: 'Use a light, playful tone while still being helpful and clear.',
        confident: 'Speak with confident, decisive phrasing without sounding arrogant.',
        serious: 'Use a serious, focused tone and avoid casual language.',
        compassionate: 'Respond with compassionate, emotionally supportive language.',
      } as const
      if (emotionalTone in toneGuide) {
        prompt += `\n\n${toneGuide[emotionalTone as keyof typeof toneGuide]}`
      }
    }

    if (emotionalTraits) {
      const traitLabels: Record<string, [string, string]> = {
        happiness: ['sadder', 'happier'],
        energy: ['more low-energy', 'more energetic'],
        confidence: ['more tentative', 'more confident'],
        calmness: ['more tense', 'calmer'],
        optimism: ['more cautious', 'more optimistic'],
        socialness: ['more reserved', 'more social'],
        empathy: ['more detached', 'more empathic'],
        curiosity: ['less exploratory', 'more curious'],
        creativity: ['more literal', 'more creative'],
        patience: ['more brisk', 'more patient'],
      }
      const traitWeights: Record<string, number> = {
        happiness: 1.1,
        energy: 1.0,
        confidence: 1.2,
        calmness: 1.25,
        optimism: 1.05,
        socialness: 0.9,
        empathy: 1.35,
        curiosity: 0.95,
        creativity: 0.9,
        patience: 1.15,
      }
      const weightedTraits: Array<{ magnitude: number; directive: string }> = []
      Object.entries(emotionalTraits).forEach(([key, value]) => {
        if (!(key in traitLabels)) return
        if (typeof value !== 'number') return
        const weightedScore = value * (traitWeights[key] ?? 1)
        const magnitude = Math.min(100, Math.abs(weightedScore))
        if (magnitude < 10) return
        const [lowLabel, highLabel] = traitLabels[key]
        const direction = weightedScore > 0 ? highLabel : lowLabel
        let strength = 'slightly'
        if (magnitude >= 85) {
          strength = 'very strongly'
        } else if (magnitude >= 60) {
          strength = 'strongly'
        } else if (magnitude >= 35) {
          strength = 'moderately'
        }
        weightedTraits.push({ magnitude, directive: `${strength} ${direction}` })
      })
      if (weightedTraits.length > 0) {
        weightedTraits.sort((a, b) => b.magnitude - a.magnitude)
        const directives = weightedTraits.slice(0, 5).map((item) => item.directive)
        prompt += `\n\nVoice emotion profile: ${directives.join(', ')}. Keep this consistent without sounding exaggerated.`
      }
    }

    // Include memory context if provided
    if (memoryContext) {
      if (memoryContext.summary) {
        prompt += `\n\n## What you remember about this user:\n${memoryContext.summary}`
      }
      if (memoryContext.facts && memoryContext.facts.length > 0) {
        prompt += `\n\n## Key facts:\n${memoryContext.facts.map((f: string) => `- ${f}`).join('\n')}`
      }
    }

    return prompt.trim()
  }

  /**
   * Get the soul's name
   */
  getName(): string {
    return this.config.name ?? 'Kwami'
  }

  /**
   * Set the soul's name
   */
  setName(name: string): void {
    this.config.name = name
  }

  /**
   * Get all traits
   */
  getTraits(): string[] {
    return this.config.traits ?? []
  }

  /**
   * Add a trait
   */
  addTrait(trait: string): void {
    if (!this.config.traits) {
      this.config.traits = []
    }
    if (!this.config.traits.includes(trait)) {
      this.config.traits.push(trait)
    }
  }

  /**
   * Remove a trait
   */
  removeTrait(trait: string): void {
    if (this.config.traits) {
      this.config.traits = this.config.traits.filter(t => t !== trait)
    }
  }

  /**
   * Get conversation style
   */
  getConversationStyle(): string | undefined {
    return this.config.conversationStyle
  }

  /**
   * Set conversation style
   */
  setConversationStyle(style: string): void {
    this.config.conversationStyle = style
  }

  /**
   * Get response length preference
   */
  getResponseLength(): 'short' | 'medium' | 'long' | undefined {
    return this.config.responseLength
  }

  /**
   * Set response length preference
   */
  setResponseLength(length: 'short' | 'medium' | 'long'): void {
    this.config.responseLength = length
  }

  /**
   * Get emotional tone
   */
  getEmotionalTone():
    | 'neutral'
    | 'warm'
    | 'enthusiastic'
    | 'calm'
    | 'playful'
    | 'confident'
    | 'serious'
    | 'compassionate'
    | undefined {
    return this.config.emotionalTone
  }

  /**
   * Set emotional tone
   */
  setEmotionalTone(
    tone:
      | 'neutral'
      | 'warm'
      | 'enthusiastic'
      | 'calm'
      | 'playful'
      | 'confident'
      | 'serious'
      | 'compassionate'
  ): void {
    this.config.emotionalTone = tone
  }

  /**
   * Get emotional traits
   */
  getEmotionalTraits(): EmotionalTraits | undefined {
    return this.config.emotionalTraits
  }

  /**
   * Set a specific emotional trait (-100 to 100)
   */
  setEmotionalTrait(trait: keyof EmotionalTraits, value: number): void {
    if (!this.config.emotionalTraits) {
      this.config.emotionalTraits = this.getDefaultEmotionalTraits()
    }
    this.config.emotionalTraits[trait] = Math.max(-100, Math.min(100, value))
  }

  /**
   * Get language
   */
  getLanguage(): string {
    return this.config.language ?? 'en'
  }

  /**
   * Set language
   */
  setLanguage(language: string): void {
    this.config.language = language
  }

  /**
   * Get the full configuration
   */
  getConfig(): SoulConfig {
    return { ...this.config }
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<SoulConfig>): void {
    this.config = { ...this.config, ...config }
  }

  /**
   * Load soul from a template name
   */
  loadTemplate(templateName: string): void {
    const normalized = templateName.trim().toLowerCase()
    const preset =
      getSoulPresetById(normalized) ??
      getSoulPresetById(normalized.replace(/\s+/g, '-'))

    if (!preset) {
      logger.warn(`Unknown soul template: ${templateName}`)
      return
    }

    this.updateConfig(toSoulConfig(preset))
    logger.info(`Loaded soul template: ${preset.id}`)
  }

  /**
   * Export soul as JSON string
   */
  exportAsJSON(): string {
    return JSON.stringify(this.config, null, 2)
  }

  /**
   * Import soul from JSON string
   */
  importFromJSON(json: string): void {
    try {
      const config = JSON.parse(json) as SoulConfig
      this.config = { ...this.config, ...config }
    } catch (error) {
      logger.error('Failed to import soul:', error)
      throw error
    }
  }
}

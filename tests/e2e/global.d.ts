/**
 * The control surface `tests/e2e/fixtures/app.js` hangs off `window` for the specs to drive.
 * Kept here rather than in the fixture so the specs typecheck without pulling browser-only
 * modules into the Node-side tsconfig.
 */
export {};

interface KwamiE2EToolDefinition {
  name: string;
  description: string;
  parameters?: Record<string, unknown>;
}

interface KwamiE2ESnapshot {
  id: string;
  name: string;
  state: string;
  connected: boolean;
  systemPrompt: string;
  tools: KwamiE2EToolDefinition[];
  skills: string[];
  instanceCount: number;
}

interface KwamiE2EBlobState {
  skin: { colors: { x: string; y: string; z: string }; resolution: number };
  shape: { scale: number };
}

declare global {
  interface Window {
    kwamiE2EReady?: boolean;
    kwamiE2E: {
      webglAvailable(): boolean;
      create(config?: Record<string, unknown>): { id: string; name: string; state: string };
      snapshot(): KwamiE2ESnapshot;
      setState(state: string): string;
      updateSoul(config: Record<string, unknown>): string;
      registerTool(name: string, description: string): string[];
      executeTool(name: string, params: Record<string, unknown>): Promise<unknown>;
      litPixels(): number;
      dispose(): Promise<{ instanceCount: number; stillRegistered?: boolean }>;
      exports: {
        soulPresetCount(): number;
        presetName(id: string): string | null;
        promptFor(id: string): string;
        toolSchemaFor(name: string): Record<string, unknown>;
        randomizesBlobState(): KwamiE2EBlobState;
      };
    };
  }
}

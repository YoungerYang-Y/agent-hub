import { allAdapters, requireAdapter } from "../adapters/index.js";
import type { AgentAdapter } from "../adapters/types.js";
import { join } from "node:path";

export interface TargetSelectionResult {
  failed: boolean;
  errors: Array<{ target: string; error: unknown }>;
}

export function expandTargetSelection(target: string): AgentAdapter[] {
  if (target === "all") return allAdapters();
  return [requireAdapter(target)];
}

export function resolveConfigDirForTargetSelection(targetSelection: string, configDir: string | undefined, adapter: AgentAdapter): string | undefined {
  if (!configDir) return undefined;
  if (targetSelection !== "all") return configDir;
  return join(configDir, adapter.id);
}

export function runForTargetSelection(target: string, fn: (adapter: AgentAdapter) => void): TargetSelectionResult {
  const errors: Array<{ target: string; error: unknown }> = [];
  for (const adapter of expandTargetSelection(target)) {
    try {
      fn(adapter);
    }
    catch (error) {
      errors.push({ target: adapter.id, error });
      console.error(`[${adapter.displayName}] ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  return { failed: errors.length > 0, errors };
}

import type { HubResource, HubResourceType, HubTarget } from "../core/manifest.js";

export const SUPPORTED_TARGETS = ["codex", "kiro", "claude-code"] as const;

export interface ConfigResolutionOptions {
  configDir?: string;
}

export interface InstallDestination {
  configDir: string;
  relativePath: string;
  absolutePath: string;
}

export interface AgentAdapter {
  id: HubTarget;
  displayName: string;
  envVar: string;
  resolveConfigDir(options: ConfigResolutionOptions): string;
  resolveInstallDestination(resource: HubResource, options: ConfigResolutionOptions): InstallDestination;
}

export function resourceTypeDirectory(type: HubResourceType): string {
  switch (type) {
    case "skill":
      return "skills";
    case "prompt":
      return "prompts";
    case "hook":
      return "hooks";
    case "agent":
      return "agents";
  }
}

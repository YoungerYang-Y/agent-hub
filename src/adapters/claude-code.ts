import { join } from "node:path";
import { defaultHiddenHome } from "../core/platform.js";
import { sourceBasename } from "../core/paths.js";
import type { HubResource } from "../core/manifest.js";
import type { AgentAdapter, ConfigResolutionOptions, InstallDestination } from "./types.js";
import { resourceTypeDirectory } from "./types.js";

export function createClaudeCodeAdapter(): AgentAdapter {
  return {
    id: "claude-code",
    displayName: "Claude Code",
    envVar: "CLAUDE_HOME",
    resolveConfigDir(options: ConfigResolutionOptions): string {
      return options.configDir ?? process.env.CLAUDE_HOME ?? defaultHiddenHome("claude");
    },
    resolveInstallDestination(resource: HubResource, options: ConfigResolutionOptions): InstallDestination {
      const configDir = this.resolveConfigDir(options);
      const relativePath = join(resourceTypeDirectory(resource.type), sourceBasename(resource.source));
      return {
        configDir,
        relativePath,
        absolutePath: join(configDir, relativePath),
      };
    },
  };
}

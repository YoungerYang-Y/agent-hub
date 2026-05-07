import { join } from "node:path";
import { defaultToolHome } from "../core/platform.js";
import { sourceBasename } from "../core/paths.js";
import type { HubResource } from "../core/manifest.js";
import type { AgentAdapter, ConfigResolutionOptions, InstallDestination } from "./types.js";
import { resourceTypeDirectory } from "./types.js";

export function createKiroAdapter(): AgentAdapter {
  return {
    id: "kiro",
    displayName: "Kiro",
    envVar: "KIRO_HOME",
    resolveConfigDir(options: ConfigResolutionOptions): string {
      return options.configDir ?? process.env.KIRO_HOME ?? defaultToolHome("kiro");
    },
    resolveInstallDestination(resource: HubResource, options: ConfigResolutionOptions): InstallDestination {
      const configDir = this.resolveConfigDir(options);
      
      // For agents, flatten: content/agents/dev -> agents/dev.json
      if (resource.type === "agent") {
        const agentName = sourceBasename(resource.source);
        const relativePath = join("agents", `${agentName}.json`);
        return {
          configDir,
          relativePath,
          absolutePath: join(configDir, relativePath),
        };
      }
      
      // For other types, preserve directory structure
      const relativePath = join(resourceTypeDirectory(resource.type), sourceBasename(resource.source));
      return {
        configDir,
        relativePath,
        absolutePath: join(configDir, relativePath),
      };
    },
  };
}

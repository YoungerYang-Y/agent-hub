import { join } from "node:path";
import { defaultToolHome } from "../core/platform.js";
import { sourceBasename } from "../core/paths.js";
import type { AgentAdapter, ConfigResolutionOptions, InstallDestination } from "./types.js";
import { resourceTypeDirectory } from "./types.js";
import type { HubResource } from "../core/manifest.js";

export function createCodexAdapter(): AgentAdapter {
  return {
    id: "codex",
    displayName: "Codex",
    envVar: "CODEX_HOME",
    resolveConfigDir(options: ConfigResolutionOptions): string {
      return options.configDir ?? process.env.CODEX_HOME ?? defaultToolHome("codex");
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

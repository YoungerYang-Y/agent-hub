import { requireAdapter } from "../adapters/index.js";
import { defaultResourcesForTarget, loadRegistries } from "../core/manifest.js";
import { syncResources } from "../core/copy.js";

export interface InstallCommandOptions {
  dryRun: boolean;
  force: boolean;
  configDir?: string;
}

export function runInstall(repoRoot: string, target: string, options: InstallCommandOptions): void {
  const adapter = requireAdapter(target);
  const resources = defaultResourcesForTarget(loadRegistries(repoRoot), adapter.id);
  const result = syncResources(resources, adapter, {
    repoRoot,
    configDir: options.configDir,
    dryRun: options.dryRun,
    force: options.force,
  });

  if (resources.length === 0) {
    console.log(`No default resources registered for ${adapter.displayName}.`);
    return;
  }

  console.log(`${options.dryRun ? "Planned" : "Installed"} ${result.operations.length} resource(s) for ${adapter.displayName}:`);
  for (const operation of result.operations) {
    console.log(`- ${operation.resourceId}: ${operation.source} -> ${operation.destination}`);
  }
  if (!options.dryRun) console.log(`Manifest: ${result.manifestPath}`);
}

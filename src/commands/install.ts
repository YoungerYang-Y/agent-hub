import { requireAdapter } from "../adapters/index.js";
import { loadRegistries, selectResourcesForTarget, type HubResourceType } from "../core/manifest.js";
import { syncResources } from "../core/copy.js";

export interface InstallCommandOptions {
  dryRun: boolean;
  force: boolean;
  configDir?: string;
  allResources: boolean;
  resourceId?: string;
  resourceType?: HubResourceType;
}

export function runInstall(repoRoot: string, target: string, options: InstallCommandOptions): void {
  const adapter = requireAdapter(target);
  const resources = selectResourcesForTarget(loadRegistries(repoRoot), adapter.id, {
    allResources: options.allResources,
    resourceId: options.resourceId,
    resourceType: options.resourceType,
  });
  const result = syncResources(resources, adapter, {
    repoRoot,
    configDir: options.configDir,
    dryRun: options.dryRun,
    force: options.force,
  });

  if (resources.length === 0) {
    console.log(`No resources matched for ${adapter.displayName}.`);
    return;
  }

  console.log(`${options.dryRun ? "Planned" : "Installed"} ${result.operations.length} resource(s) for ${adapter.displayName}:`);
  for (const operation of result.operations) {
    console.log(`- ${operation.resourceId}: ${operation.source} -> ${operation.destination}`);
  }
  if (!options.dryRun) console.log(`Manifest: ${result.manifestPath}`);
}

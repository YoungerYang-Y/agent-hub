import { requireAdapter } from "../adapters/index.js";
import { loadRegistries } from "../core/manifest.js";
import { collectManagedStatuses, managedManifestPath, readManagedManifest } from "../core/managed-manifest.js";

export interface StatusCommandOptions {
  configDir?: string;
}

export function runStatus(repoRoot: string, target: string, options: StatusCommandOptions): void {
  const adapter = requireAdapter(target);
  const configDir = adapter.resolveConfigDir(options);
  const manifestPath = managedManifestPath(configDir);
  const manifest = readManagedManifest(manifestPath);
  const statuses = collectManagedStatuses({
    manifest,
    registryResources: loadRegistries(repoRoot),
    target: adapter.id,
    configDir,
    repoRoot,
  });

  if (statuses.length === 0) {
    console.log(`No managed resources for ${adapter.displayName}.`);
    console.log(`Manifest: ${manifestPath}`);
    return;
  }

  console.log(`Managed resources for ${adapter.displayName}:`);
  for (const status of statuses) {
    console.log(`- ${status.id} [${status.type}] destination=${status.destinationState} hash=${status.hashState} registry=${status.registryState}`);
    console.log(`  source: ${status.sourcePath}`);
    console.log(`  destination: ${status.destinationPath}`);
  }
  console.log(`Manifest: ${manifestPath}`);
}

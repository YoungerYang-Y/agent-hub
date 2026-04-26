import { requireAdapter } from "../adapters/index.js";
import { loadRegistries } from "../core/manifest.js";
import { managedManifestPath, pruneManagedResources, readManagedManifest } from "../core/managed-manifest.js";

export interface PruneCommandOptions {
  configDir?: string;
  dryRun: boolean;
}

export function runPrune(repoRoot: string, target: string, options: PruneCommandOptions): void {
  const adapter = requireAdapter(target);
  const configDir = adapter.resolveConfigDir(options);
  const manifestPath = managedManifestPath(configDir);
  const manifest = readManagedManifest(manifestPath);
  const result = pruneManagedResources({
    manifest,
    manifestPath,
    registryResources: loadRegistries(repoRoot),
    target: adapter.id,
    configDir,
    repoRoot,
    dryRun: options.dryRun,
  });

  if (result.operations.length === 0) {
    console.log(`No stale managed resources for ${adapter.displayName}.`);
    console.log(`Manifest: ${manifestPath}`);
    return;
  }

  console.log(`${options.dryRun ? "Planned prune of" : "Pruned"} ${result.operations.length} stale managed resource(s) for ${adapter.displayName}:`);
  for (const operation of result.operations) {
    console.log(`- ${operation.id}: ${operation.destinationPath} (${operation.destinationState})`);
  }
  console.log(`Manifest: ${manifestPath}`);
}

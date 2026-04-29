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

  const action = options.dryRun ? "Plan prune" : "Pruned";
  console.log(`\n${action}: ${result.operations.length} stale resource(s) ← ${adapter.displayName}\n`);
  
  for (const operation of result.operations) {
    const dest = operation.destinationPath.replace(process.env.HOME || "", "~");
    console.log(`  ✗ ${operation.id}`);
    console.log(`    ${dest} (${operation.destinationState})\n`);
  }
  
  console.log(`Manifest: ${manifestPath}`);
}

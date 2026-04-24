import { allAdapters } from "../adapters/index.js";
import { loadRegistries } from "../core/manifest.js";

export function runList(repoRoot: string): void {
  const resources = loadRegistries(repoRoot);
  if (resources.length === 0) {
    console.log("No resources registered.");
    return;
  }

  console.log("Registered resources:");
  for (const resource of resources) {
    const defaultLabel = resource.default ? "default" : "optional";
    console.log(`- ${resource.id} [${resource.type}] (${defaultLabel}) -> ${resource.targets.join(", ")}`);
    console.log(`  ${resource.description}`);
  }

  console.log("");
  console.log(`Supported targets: ${allAdapters().map((adapter) => adapter.id).join(", ")}`);
}

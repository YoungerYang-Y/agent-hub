import { createHash } from "node:crypto";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

export function hashPath(path: string): string {
  const hash = createHash("sha256");
  appendPathHash(hash, path, path);
  return hash.digest("hex");
}

function appendPathHash(hash: ReturnType<typeof createHash>, root: string, current: string): void {
  const stat = statSync(current);
  const relativePath = relative(root, current) || ".";
  hash.update(relativePath);

  if (stat.isDirectory()) {
    const entries = readdirSync(current).sort();
    for (const entry of entries) appendPathHash(hash, root, join(current, entry));
    return;
  }

  hash.update(readFileSync(current));
}

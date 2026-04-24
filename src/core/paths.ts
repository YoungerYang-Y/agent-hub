import { basename, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export function repositoryRootFromCli(): string {
  return join(fileDirname(import.meta.url), "../..");
}

export function fileDirname(metaUrl: string): string {
  return fileURLToPath(new URL(".", metaUrl));
}

export function sourceBasename(source: string): string {
  return basename(source.replace(/[/\\]$/, ""));
}

export function toFileUrl(path: string): string {
  return pathToFileURL(path).href;
}

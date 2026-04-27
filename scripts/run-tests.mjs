import { existsSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const env = { ...process.env };
if (process.platform !== "win32" && existsSync("/tmp")) {
  env.TMPDIR = "/tmp";
  env.TMP = "/tmp";
  env.TEMP = "/tmp";
}

const vitestBin = join(process.cwd(), "node_modules/vitest/vitest.mjs");
const result = spawnSync(process.execPath, [vitestBin, "run", "tests", ...process.argv.slice(2)], {
  cwd: process.cwd(),
  env,
  stdio: "inherit",
});

process.exit(result.status ?? 1);

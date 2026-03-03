import { readdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = join(__dirname, "..");
const outputName = "repomix-calcularq-full.md";

for (const entry of readdirSync(repoRoot, { withFileTypes: true })) {
  if (!entry.isFile()) continue;
  if (!/^repomix-.*\.md$/i.test(entry.name)) continue;
  rmSync(join(repoRoot, entry.name), { force: true });
}

const npmCli = process.env.npm_execpath;
if (!npmCli) {
  console.error("[repomix] npm_execpath nao encontrado.");
  process.exit(1);
}

const args = [
  npmCli,
  "exec",
  "--yes",
  "--",
  "repomix",
  ".",
  "--style",
  "markdown",
  "--output",
  outputName,
  "--ignore",
  "dist/**,backups/**,node_modules/**,repomix-*.md",
];

const result = spawnSync(process.execPath, args, {
  cwd: repoRoot,
  stdio: "inherit",
});

if (result.error) {
  console.error("[repomix] erro ao executar repomix:", result.error.message);
  process.exit(1);
}

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

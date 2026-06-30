import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";

const defaultKeyPath = "V:\\Password\\updatetracker.key";
const keyPath = process.env.TAURI_SIGNING_PRIVATE_KEY || defaultKeyPath;

if (!existsSync(keyPath)) {
  console.error(`No se encontró la clave privada: ${keyPath}`);
  console.error("Configurá TAURI_SIGNING_PRIVATE_KEY o revisá la ruta del archivo .key.");
  process.exit(1);
}

const env = {
  ...process.env,
  TAURI_SIGNING_PRIVATE_KEY: keyPath,
};

const build = spawnSync("npm.cmd", ["run", "tauri", "--", "build"], {
  env,
  shell: false,
  stdio: "inherit",
});

if (build.status !== 0) {
  process.exit(build.status ?? 1);
}

const latest = spawnSync("node", ["scripts/generate-latest-json.mjs"], {
  env,
  shell: false,
  stdio: "inherit",
});

process.exit(latest.status ?? 1);

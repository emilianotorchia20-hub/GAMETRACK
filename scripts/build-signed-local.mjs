import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";

const defaultKeyPath = "V:\\Password\\updatetrack.key";
const keyPath = process.env.TAURI_SIGNING_PRIVATE_KEY || defaultKeyPath;

if (!existsSync(keyPath)) {
  console.error(`No se encontro la clave privada: ${keyPath}`);
  console.error("Configura TAURI_SIGNING_PRIVATE_KEY o revisa la ruta del archivo .key.");
  process.exit(1);
}

const baseEnv = Object.fromEntries(
  Object.entries(process.env).filter(([key, value]) => value !== undefined && !key.startsWith("=")),
);

const env = {
  ...baseEnv,
  TAURI_SIGNING_PRIVATE_KEY: keyPath,
};

const build = spawnSync("npm.cmd", ["run", "tauri", "--", "build"], {
  env,
  shell: false,
  stdio: "inherit",
});

if (build.status !== 0) {
  console.error(`tauri build fallo con codigo ${build.status ?? "desconocido"}.`);
  if (build.error) console.error(build.error.message);
  process.exit(build.status ?? 1);
}

const latest = spawnSync("node", ["scripts/generate-latest-json.mjs"], {
  env,
  shell: false,
  stdio: "inherit",
});

if (latest.status !== 0) {
  console.error(`generate-latest-json fallo con codigo ${latest.status ?? "desconocido"}.`);
  if (latest.error) console.error(latest.error.message);
}

process.exit(latest.status ?? 1);

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

function run(command, args) {
  if (process.platform === "win32") {
    return spawnSync("cmd.exe", ["/d", "/s", "/c", command, ...args], {
      env,
      shell: false,
      stdio: "inherit",
    });
  }

  return spawnSync(command, args, {
    env,
    shell: false,
    stdio: "inherit",
  });
}

function printFailure(label, result) {
  console.error(`${label} fallo.`);
  console.error(`status: ${result.status ?? "desconocido"}`);
  console.error(`signal: ${result.signal ?? "ninguna"}`);
  if (result.error) console.error(`error: ${result.error.message}`);
}

const build = run("npm.cmd", ["run", "tauri", "--", "build"]);

if (build.status !== 0) {
  printFailure("tauri build", build);
  process.exit(build.status ?? 1);
}

const latest = run("node", ["scripts/generate-latest-json.mjs"]);

if (latest.status !== 0) {
  printFailure("generate-latest-json", latest);
}

process.exit(latest.status ?? 1);

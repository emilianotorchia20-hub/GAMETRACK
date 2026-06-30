import { readFile } from "node:fs/promises";

const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const tauriConfig = JSON.parse(await readFile("src-tauri/tauri.conf.json", "utf8"));
const cargoToml = await readFile("src-tauri/Cargo.toml", "utf8");
const cargoVersion = cargoToml.match(/^version\s*=\s*"([^"]+)"/m)?.[1];
const lockRaw = await readFile("package-lock.json", "utf8").catch(() => null);
const lockJson = lockRaw ? JSON.parse(lockRaw) : null;

const expected = packageJson.version;
const checks = [
  ["src-tauri/tauri.conf.json", tauriConfig.version],
  ["src-tauri/Cargo.toml", cargoVersion],
];

if (lockJson) {
  checks.push(["package-lock.json", lockJson.version]);
  checks.push(["package-lock root package", lockJson.packages?.[""]?.version]);
}

const mismatches = checks.filter(([, value]) => value !== expected);

if (mismatches.length) {
  console.error(`Versiones desincronizadas. package.json=${expected}`);
  for (const [file, value] of mismatches) {
    console.error(`- ${file}: ${value || "no encontrada"}`);
  }
  process.exit(1);
}

console.log(`Versiones sincronizadas: ${expected}`);

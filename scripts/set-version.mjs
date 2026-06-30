import { readFile, writeFile } from "node:fs/promises";

const version = process.argv[2];
const semver = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;

if (!semver.test(version || "")) {
  console.error("Versión inválida. Uso: npm run version:set -- 1.0.1");
  process.exit(1);
}

async function updateJson(path, updater) {
  const raw = await readFile(path, "utf8");
  const data = JSON.parse(raw);
  updater(data);
  await writeFile(path, `${JSON.stringify(data, null, 2)}\n`);
}

async function updateCargo(path) {
  const raw = await readFile(path, "utf8");
  const next = raw.replace(/^version\s*=\s*"[^"]+"/m, `version = "${version}"`);
  if (next === raw) {
    throw new Error(`No se encontró version en ${path}`);
  }
  await writeFile(path, next);
}

await updateJson("package.json", (data) => {
  data.version = version;
});

try {
  await updateJson("package-lock.json", (data) => {
    data.version = version;
    if (data.packages?.[""]) {
      data.packages[""].version = version;
    }
  });
} catch (err) {
  if (err.code !== "ENOENT") throw err;
}

await updateJson("src-tauri/tauri.conf.json", (data) => {
  data.version = version;
});

await updateCargo("src-tauri/Cargo.toml");

console.log(`Versión sincronizada: ${version}`);

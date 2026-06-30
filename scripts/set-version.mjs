import { readFile, writeFile } from "node:fs/promises";

const version = process.argv[2];
const semver = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;

if (!semver.test(version || "")) {
  console.error("Version invalida. Uso: npm run version:set -- 1.0.1");
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
  const packageSection = raw.match(/^\[package\]\r?\n[\s\S]*?(?=^\[|\Z)/m);

  if (!packageSection) {
    throw new Error(`No se encontro la seccion [package] en ${path}`);
  }

  const section = packageSection[0];
  const updatedSection = section.match(/^version\s*=/m)
    ? section.replace(/^version\s*=\s*"[^"]*"/m, `version = "${version}"`)
    : section.replace(/^(name\s*=\s*"[^"]+"\r?\n)/m, `$1version = "${version}"\n`);

  if (updatedSection === section && !section.includes(`version = "${version}"`)) {
    throw new Error(`No se pudo actualizar version en ${path}`);
  }

  const next = raw.slice(0, packageSection.index) + updatedSection + raw.slice(packageSection.index + section.length);
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

console.log(`Version sincronizada: ${version}`);

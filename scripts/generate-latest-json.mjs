import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";

const owner = "emilianotorchia20-hub";
const repo = "GAMETRACK";
const platform = "windows-x86_64-nsis";
const fallbackPlatform = "windows-x86_64";
const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
const version = packageJson.version;
const bundleDir = join("src-tauri", "target", "release", "bundle", "nsis");
const installer = join(bundleDir, `GameTrack_${version}_x64-setup.exe`);
const signature = `${installer}.sig`;
const output = join(bundleDir, "latest.json");
const publicOutputDir = "release";
const publicOutput = join(publicOutputDir, "latest.json");

function readChangelogNotes() {
  if (!existsSync("CHANGELOG.md")) {
    return `GameTrack ${version}`;
  }

  const changelog = readFileSync("CHANGELOG.md", "utf8");
  const escaped = version.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const header = changelog.match(new RegExp(`(^|\\r?\\n)## \\[${escaped}\\][^\\n]*\\r?\\n`));

  if (!header) {
    return `GameTrack ${version}`;
  }

  const start = header.index + header[0].length;
  const rest = changelog.slice(start);
  const nextHeader = rest.search(/\r?\n## \[/);
  const body = nextHeader >= 0 ? rest.slice(0, nextHeader) : rest;

  return (body.trim() || `GameTrack ${version}`).replace(/\r\n/g, "\n");
}

if (!existsSync(installer)) {
  console.error(`No se encontró el instalador: ${installer}`);
  console.error("Ejecutá primero: npm run tauri:build:local");
  process.exit(1);
}

if (!existsSync(signature)) {
  console.error(`No se encontró la firma del updater: ${signature}`);
  console.error("El build debe ejecutarse con TAURI_SIGNING_PRIVATE_KEY configurada.");
  process.exit(1);
}

const fileName = basename(installer);
const url = `https://github.com/${owner}/${repo}/releases/latest/download/${fileName}`;
const signatureText = readFileSync(signature, "utf8").trim();
const manifest = {
  version,
  notes: readChangelogNotes(),
  pub_date: new Date().toISOString(),
  platforms: {
    [platform]: {
      signature: signatureText,
      url,
    },
    [fallbackPlatform]: {
      signature: signatureText,
      url,
    },
  },
};

writeFileSync(output, `${JSON.stringify(manifest, null, 2)}\n`);
mkdirSync(publicOutputDir, { recursive: true });
writeFileSync(publicOutput, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`latest.json actualizado: ${output}`);
console.log(`copia para subir a GitHub Releases: ${publicOutput}`);

import { readFile } from "node:fs/promises";

const jsonFiles = [
  "package.json",
  "src-tauri/tauri.conf.json",
  "src-tauri/capabilities/default.json",
  "manifest.json",
];

for (const file of jsonFiles) {
  JSON.parse(await readFile(file, "utf8"));
}

console.log("Validación básica de formato completada.");

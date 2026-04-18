#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

const targetVersion = process.argv[2];
const semverPattern =
  /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;

if (!targetVersion || !semverPattern.test(targetVersion)) {
  console.error(
    "Uso: node scripts/version-sync.mjs <versao>\nExemplo: node scripts/version-sync.mjs 1.10.1"
  );
  process.exit(1);
}

const packageFiles = [
  { path: "package.json", required: true },
  { path: "src-tauri/tauri.conf.json", required: true },
];

const updatedFiles = [];

for (const fileDef of packageFiles) {
  const relativeFile = fileDef.path;
  const absoluteFile = path.join(repoRoot, relativeFile);

  if (!fs.existsSync(absoluteFile)) {
    if (fileDef.required) {
      console.error(
        `Arquivo obrigatorio ausente para sincronizacao de versao: ${relativeFile}`
      );
      process.exit(1);
    }
    continue;
  }

  const content = fs.readFileSync(absoluteFile, "utf8");
  const json = JSON.parse(content);

  if (json.version !== targetVersion) {
    json.version = targetVersion;
    fs.writeFileSync(
      absoluteFile,
      `${JSON.stringify(json, null, 2)}\n`,
      "utf8"
    );
    updatedFiles.push(relativeFile);
  }
}

const cargoTomlPath = path.join(repoRoot, "src-tauri/Cargo.toml");
const cargoTomlContent = fs.readFileSync(cargoTomlPath, "utf8");
const cargoTomlUpdated = cargoTomlContent.replace(
  /^(\[package\][\s\S]*?^\s*version\s*=\s*")([^"]+)(")/m,
  (_match, prefix, _currentVersion, suffix) =>
    `${prefix}${targetVersion}${suffix}`
);

if (cargoTomlUpdated !== cargoTomlContent) {
  fs.writeFileSync(cargoTomlPath, cargoTomlUpdated, "utf8");
  updatedFiles.push("src-tauri/Cargo.toml");
}

if (!updatedFiles.length) {
  console.log(`Versao ja esta sincronizada em ${targetVersion}.`);
  process.exit(0);
}

console.log(`Versao sincronizada para ${targetVersion} em:`);
for (const file of updatedFiles) {
  console.log(`- ${file}`);
}

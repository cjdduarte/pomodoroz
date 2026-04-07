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
  "package.json",
  "app/electron/package.json",
  "app/renderer/package.json",
];

const updatedFiles = [];

for (const relativeFile of packageFiles) {
  const absoluteFile = path.join(repoRoot, relativeFile);
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

if (!updatedFiles.length) {
  console.log(`Versao ja esta sincronizada em ${targetVersion}.`);
  process.exit(0);
}

console.log(`Versao sincronizada para ${targetVersion} em:`);
for (const file of updatedFiles) {
  console.log(`- ${file}`);
}

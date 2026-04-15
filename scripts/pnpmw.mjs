#!/usr/bin/env node

import { spawnSync } from "node:child_process";

const args = process.argv.slice(2);

if (args.length === 0) {
  console.error("Uso: node scripts/pnpmw.mjs <args-do-pnpm>");
  process.exit(1);
}

function commandAvailable(command) {
  const probe = spawnSync(command, ["--version"], {
    stdio: "ignore",
    env: process.env,
  });
  return !probe.error && probe.status === 0;
}

let command;
let commandArgs;

if (commandAvailable("pnpm")) {
  command = "pnpm";
  commandArgs = args;
} else if (commandAvailable("corepack")) {
  command = "corepack";
  commandArgs = ["pnpm", ...args];
} else {
  console.error("ERRO: pnpm nao encontrado e corepack nao esta disponivel no PATH.");
  console.error("Sugestao: instale pnpm no PATH ou habilite corepack no ambiente.");
  process.exit(1);
}

const result = spawnSync(command, commandArgs, {
  stdio: "inherit",
  env: process.env,
});

if (result.error) {
  console.error(`[pnpmw] Falha ao executar ${command}: ${result.error.message}`);
  process.exit(1);
}

process.exit(result.status ?? 1);

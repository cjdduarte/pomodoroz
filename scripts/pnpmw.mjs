#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import path from "node:path";

const args = process.argv.slice(2);

if (args.length === 0) {
  console.error("Uso: node scripts/pnpmw.mjs <args-do-pnpm>");
  process.exit(1);
}

function runCommand(command, commandArgs) {
  return spawnSync(command, commandArgs, {
    stdio: "inherit",
    env: process.env,
  });
}

function commandAvailable(command, probeArgs = ["--version"]) {
  const probe = spawnSync(command, probeArgs, {
    stdio: "ignore",
    env: process.env,
  });
  return !probe.error;
}

function executeOrExit(command, commandArgs) {
  const result = runCommand(command, commandArgs);
  if (result.error) {
    return false;
  }

  process.exit(result.status ?? 1);
}

const npmExecPath = process.env.npm_execpath?.trim();
if (npmExecPath) {
  const execBaseName = path.basename(npmExecPath).toLowerCase();
  const execArgs = execBaseName.includes("corepack")
    ? [npmExecPath, "pnpm", ...args]
    : [npmExecPath, ...args];
  executeOrExit(process.execPath, execArgs);
}

const commandCandidates = [
  { command: "pnpm", args },
  { command: "corepack", args: ["pnpm", ...args] },
];

const nodeDir = path.dirname(process.execPath);
const commandExtension = process.platform === "win32" ? ".cmd" : "";
const pnpmSibling = path.join(nodeDir, `pnpm${commandExtension}`);
const corepackSibling = path.join(nodeDir, `corepack${commandExtension}`);

commandCandidates.push({ command: pnpmSibling, args });
commandCandidates.push({
  command: corepackSibling,
  args: ["pnpm", ...args],
});

for (const candidate of commandCandidates) {
  if (!commandAvailable(candidate.command)) {
    continue;
  }
  executeOrExit(candidate.command, candidate.args);
}

console.error("ERRO: pnpm nao encontrado e corepack nao esta disponivel no PATH.");
if (npmExecPath) {
  console.error(`Info: npm_execpath detectado, mas falhou: ${npmExecPath}`);
}
console.error("Sugestao: instale pnpm no PATH ou habilite corepack no ambiente.");
process.exit(1);

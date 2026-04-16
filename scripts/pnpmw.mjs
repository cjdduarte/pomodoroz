#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import fs from "node:fs";
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
  return !probe.error && probe.status === 0;
}

function executeOrExit(command, commandArgs) {
  const result = runCommand(command, commandArgs);
  if (result.error) {
    return false;
  }

  if (result.status === 0) {
    process.exit(0);
  }

  return false;
}

function quoteForCmd(argument) {
  return `"${String(argument).replace(/"/g, '""')}"`;
}

function buildCmdInvocation(command, commandArgs) {
  const joinedArgs = commandArgs.map(quoteForCmd).join(" ");
  const commandLine = `${quoteForCmd(command)}${joinedArgs ? ` ${joinedArgs}` : ""}`;
  return {
    command: "cmd.exe",
    args: ["/d", "/s", "/c", commandLine],
  };
}

const npmExecPath = process.env.npm_execpath?.trim();
if (npmExecPath) {
  const execBaseName = path.basename(npmExecPath).toLowerCase();
  const execArgs = execBaseName.includes("corepack")
    ? [npmExecPath, "pnpm", ...args]
    : [npmExecPath, ...args];

  const probeArgs = execBaseName.includes("corepack")
    ? [npmExecPath, "pnpm", "--version"]
    : [npmExecPath, "--version"];

  if (commandAvailable(process.execPath, probeArgs)) {
    executeOrExit(process.execPath, execArgs);
  }
}

const commandCandidates = [
  { command: "pnpm", args },
  { command: "corepack", args: ["pnpm", ...args] },
];

const nodeDir = path.dirname(process.execPath);
const corepackScriptPath = path.join(
  nodeDir,
  "node_modules",
  "corepack",
  "dist",
  "corepack.js"
);
const commandExtension = process.platform === "win32" ? ".cmd" : "";
const pnpmSibling = path.join(nodeDir, `pnpm${commandExtension}`);
const corepackSibling = path.join(nodeDir, `corepack${commandExtension}`);

if (fs.existsSync(corepackScriptPath)) {
  commandCandidates.push({
    command: process.execPath,
    args: [corepackScriptPath, "pnpm", ...args],
    probeArgs: [corepackScriptPath, "--version"],
  });
}

commandCandidates.push({ command: pnpmSibling, args });
commandCandidates.push({
  command: corepackSibling,
  args: ["pnpm", ...args],
});

if (process.platform === "win32") {
  const corepackViaCmd = buildCmdInvocation(corepackSibling, ["pnpm", ...args]);
  const corepackProbeViaCmd = buildCmdInvocation(corepackSibling, ["pnpm", "--version"]);
  commandCandidates.push({
    command: corepackViaCmd.command,
    args: corepackViaCmd.args,
    probeArgs: corepackProbeViaCmd.args,
  });

  const pnpmViaCmd = buildCmdInvocation("pnpm", args);
  const pnpmProbeViaCmd = buildCmdInvocation("pnpm", ["--version"]);
  commandCandidates.push({
    command: pnpmViaCmd.command,
    args: pnpmViaCmd.args,
    probeArgs: pnpmProbeViaCmd.args,
  });
}

for (const candidate of commandCandidates) {
  if (!commandAvailable(candidate.command, candidate.probeArgs)) {
    continue;
  }
  const executed = executeOrExit(candidate.command, candidate.args);
  if (executed === false) {
    continue;
  }
}

console.error("ERRO: pnpm nao encontrado e corepack nao esta disponivel no PATH.");
if (npmExecPath) {
  console.error(`Info: npm_execpath detectado, mas falhou: ${npmExecPath}`);
}
console.error("Sugestao: instale pnpm no PATH ou habilite corepack no ambiente.");
process.exit(1);
